package main

import (
	"bytes"
	"context"
	"ctfplatform/actions"
	"ctfplatform/config"
	"ctfplatform/db"
	"ctfplatform/log"
	"ctfplatform/models"
	"ctfplatform/rand"
	"ctfplatform/sentry"
	"ctfplatform/session"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/fasthttp/router"
	"github.com/goware/emailx"
	"github.com/sirupsen/logrus"
	"github.com/valyala/fasthttp"
	"image/png"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
	"unicode"
)

func VerifyCaptcha(ctx context.Context, secret string, token string) error {
	formData := url.Values{
		"secret":   {secret},
		"response": {token},
		//"remoteip": {userIP},
	}

	req, err := http.NewRequest("POST", "https://www.google.com/recaptcha/api/siteverify", strings.NewReader(formData.Encode()))
	if err != nil {
		return err
	}
	req = req.WithContext(ctx)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var result struct {
		Success bool `json:"success"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return err
	}

	if !result.Success {
		return errors.New("captcha invalid")
	}

	return nil
}

// json input validators
var ErrInvalidAvatar = errors.New("invalid avatar")

type AvatarData []byte

func (u *AvatarData) UnmarshalJSON(data []byte) error {
	if len(data) == 0 {
		return nil
	}

	var out string
	if err := json.Unmarshal(data, &out); err != nil {
		return err
	}

	var avatarPayload []byte
	if len(out) > 0 {
		var err error
		avatarPayload, err = base64.StdEncoding.DecodeString(out)
		if err != nil {
			return err
		}
	}

	if len(avatarPayload) == 0 {
		return nil
	}

	if len(avatarPayload) > 200000 {
		return fmt.Errorf("%v: %w", errors.New("size to big"), ErrInvalidAvatar)
	}

	reader := bytes.NewReader(avatarPayload)
	im, err := png.DecodeConfig(reader)
	if err != nil {
		return fmt.Errorf("%v: %w", err, ErrInvalidAvatar)
	}

	if im.Width > 256 || im.Height > 256 || im.Height < 30 || im.Width < 30 {
		return fmt.Errorf("%v: %w", errors.New("width or height to big"), ErrInvalidAvatar)
	}

	ratio := float64(im.Width) / float64(im.Height)
	if !(0.70 <= ratio && ratio <= 1.35) {
		return fmt.Errorf("%v: %w", fmt.Errorf("ratio invalid w=%d h=%d r=%f", im.Width, im.Height, ratio), ErrInvalidAvatar)
	}

	*u = avatarPayload
	return nil
}

// json input email
var ErrInvalidEmail = errors.New("invalid email")

type EmailData string

func (e *EmailData) UnmarshalJSON(data []byte) error {
	if len(data) == 0 {
		return ErrInvalidEmail
	}

	var out string
	if err := json.Unmarshal(data, &out); err != nil {
		return err
	}

	if err := emailx.Validate(out); err != nil {
		return ErrInvalidEmail
	}

	*e = EmailData(out)
	return nil
}

// json input country

var ErrInvalidCountry = errors.New("invalid country")

type CountryData string

func (c *CountryData) UnmarshalJSON(data []byte) error {
	if len(data) == 0 {
		*c = CountryData("")
		return nil
	}

	var out string
	if err := json.Unmarshal(data, &out); err != nil {
		return err
	}

	if !actions.ValidCountry(out) {
		return ErrInvalidCountry
	}

	*c = CountryData(out)
	return nil
}

//

const (
	HttpErrInvalidJson               = "invalid_json"
	HttpErrInvalidTeamNameAscii      = "invalid_team_name_ascii"
	HttpErrInvalidTeamNameLength     = "invalid_team_name_length"
	HttpErrInvalidAvatar             = "invalid_avatar"
	HttpErrInvalidEmail              = "invalid_email"
	HttpErrInvalidCountry            = "invalid_country"
	HttpErrInvalidWebsite            = "invalid_website"
	HttpErrInvalidCaptcha            = "invalid_captcha"
	HttpErrInvalidFlag               = "invalid_flag"
	HttpErrInvalidPasswordLength     = "invalid_password_length"
	HttpErrInvalidCurrentPassword    = "invalid_current_password"
	HttpErrInvalidPasswordOrUsername = "invalid_password_or_username"
	HttpErrInternalError             = "internal_error"
	HttpErrNotFound                  = "not_found"
	HttpErrEmailOrNameAlreadyExists  = "email_or_name_already_exists"
	HttpErrNotAuthorize              = "not_authorize"
	HttpErrAlreadySolved             = "already_solved"
)

func isASCII(s string) bool {
	for _, c := range s {
		if c > unicode.MaxASCII {
			return false
		}
	}
	return true
}

func handleRegister(mainSrv *actions.MainInternal) fasthttp.RequestHandler {
	type request struct {
		Name     string    `json:"name"`
		Email    EmailData `json:"email"`
		Password string    `json:"password"`

		Country CountryData `json:"country"`
		//AvatarPath  AvatarData  `json:"avatar"`

		Captcha string `json:"captcha"`
	}

	return func(ctx *fasthttp.RequestCtx) {
		ctxReq := GetCtx(ctx)
		logger := GetLogger(ctx)

		input := request{}
		err := json.Unmarshal(ctx.PostBody(), &input)
		if errors.Is(err, ErrInvalidAvatar) {
			logger.WithError(err).Warning("invalid avatar")
			ctx.Error(HttpErrInvalidAvatar, http.StatusBadRequest)
			return
		} else if errors.Is(err, ErrInvalidEmail) {
			logger.WithError(err).Warning("invalid email")
			ctx.Error(HttpErrInvalidEmail, http.StatusBadRequest)
			return
		} else if errors.Is(err, ErrInvalidCountry) {
			logger.WithError(err).Warning("invalid country")
			ctx.Error(HttpErrInvalidCountry, http.StatusBadRequest)
			return
		} else if err != nil {
			logger.WithError(err).Warning("invalid json")
			ctx.Error(HttpErrInvalidJson, http.StatusBadRequest)
			return
		}

		ctxReqShort, cancel := context.WithTimeout(ctxReq, time.Second)
		defer cancel()
		if err := VerifyCaptcha(ctxReqShort, config.Config.CaptchaSecret, input.Captcha); err == context.DeadlineExceeded {
			// fallback
			logger.WithError(err).Warning("captcha timeout")
		} else if err != nil {
			logger.WithError(err).Warning("invalid captcha")
			ctx.Error(HttpErrInvalidCaptcha, http.StatusBadRequest)
			return
		}

		if len(input.Password) < 8 {
			logger.Warning("password invalid length")
			ctx.Error(HttpErrInvalidPasswordLength, http.StatusBadRequest)
			return
		}

		teamName := strings.TrimSpace(string(input.Name))
		teamEmail := strings.TrimSpace(string(input.Email))

		if !isASCII(teamName) {
			logger.WithField("team_name", teamName).Warning("team name not ascii")
			ctx.Error(HttpErrInvalidTeamNameAscii, http.StatusBadRequest)
			return
		}
		if len(teamName) <= 0 {
			logger.Warning("team name to short")
			ctx.Error(HttpErrInvalidTeamNameLength, http.StatusBadRequest)
			return
		}

		teamInput := models.TeamXXX{
			Name:    teamName,
			Email:   teamEmail,
			Country: string(input.Country),
		}
		//if len(input.AvatarPath) > 0 {
		//	teamInput.AvatarPath = models.GenAvatarFilename()
		//}

		if err := teamInput.SetPassword(input.Password); err != nil {
			logger.WithError(err).Error("password set err")
			ctx.Error(HttpErrInternalError, http.StatusInternalServerError)
			return
		}

		if err := mainSrv.AddTeam(ctxReq, teamInput); err == actions.TeamAlreadyExists {
			logger.WithFields(logrus.Fields{
				"team_name": teamInput.Name,
				"email": teamInput.Email,
			}).WithError(err).Warning("team duplicated")
			ctx.Error(HttpErrEmailOrNameAlreadyExists, http.StatusBadRequest)
			return
		} else if err != nil {
			logger.WithFields(logrus.Fields{
				"team_name": teamInput.Name,
				"email": teamInput.Email,
			}).WithError(err).Error("add team err")
			ctx.Error(HttpErrInternalError, http.StatusInternalServerError)
			return
		}
		//if err := teamInput.SetAvatar(input.AvatarPath); err != nil {
		//	log.Log.WithError(err).Error("avatar set err")
		//}

		ctx.SetStatusCode(http.StatusCreated)
	}
}

func handleTeamAvatar(mainSrv *actions.MainInternal) fasthttp.RequestHandler {
	return func(ctx *fasthttp.RequestCtx) {
		ctxReq := GetCtx(ctx)
		logger := GetLogger(ctx)

		filepath := ctx.UserValue("filepath").(string)
		if len(filepath) <= 10 {
			logger.WithField("file", filepath).Warning("avatar not found")
			ctx.Error(HttpErrNotFound, http.StatusNotFound)
			return
		}
		filepath = filepath[1:]

		avatarPayload, err := mainSrv.GetTeamDB().GetAvatar(ctxReq, filepath)
		if err == sql.ErrNoRows {
			logger.WithField("file", filepath).Warning("avatar not found")
			ctx.Error(HttpErrNotFound, http.StatusNotFound)
			return
		} else if err != nil {
			logger.WithError(err).Error("get avatar err")
			ctx.Error(HttpErrInternalError, http.StatusInternalServerError)
			return
		}

		ctx.SetStatusCode(http.StatusOK)
		ctx.Response.Header.Set("Cache-Control", "public, max-age=3600")
		ctx.Response.Header.Set("Content-Type", "image/png")
		ctx.Response.SetBodyRaw(avatarPayload)
	}
}

func handleTeamUpdate(mainSrv *actions.MainInternal) fasthttp.RequestHandler {
	type request struct {
		//CurrentPassword string `json:"current_password"`
		//NewPassword     string `json:"new_password"`

		Country CountryData `json:"country"`
		Avatar  AvatarData  `json:"avatar"`

		Affiliation string `json:"affiliation"`
		Website     string `json:"website"`
	}

	return func(ctx *fasthttp.RequestCtx) {
		ctxReq := GetCtx(ctx)
		logger := GetLogger(ctx)
		sessionData := GetSession(ctx)

		input := request{}
		err := json.Unmarshal(ctx.PostBody(), &input)
		if errors.Is(err, ErrInvalidAvatar) {
			logger.WithError(err).Warning("invalid avatar")
			ctx.Error(HttpErrInvalidAvatar, http.StatusBadRequest)
			return
		} else if errors.Is(err, ErrInvalidCountry) {
			logger.WithError(err).Warning("invalid country")
			ctx.Error(HttpErrInvalidCountry, http.StatusBadRequest)
			return
		} else if err != nil {
			logger.WithError(err).Warning("invalid json")
			ctx.Error(HttpErrInvalidJson, http.StatusBadRequest)
			return
		}
		if len(input.Website) > 0 && !strings.HasPrefix(input.Website, "https://") {
			logger.WithError(err).Warning("invalid website")
			ctx.Error(HttpErrInvalidWebsite, http.StatusBadRequest)
			return
		}

		teamData, err := mainSrv.GetTeamDB().GetByID(ctxReq, sessionData.TeamID)
		if err != nil {
			logger.WithError(err).Error("get team data err")
			ctx.Error(HttpErrInternalError, http.StatusInternalServerError)
			return
		}

		teamData.Country = string(input.Country)
		teamData.Website = input.Website
		teamData.Affiliation = input.Affiliation

		if len(input.Avatar) > 0 {
			if err := teamData.SetAvatar(ctxReq, mainSrv.GetTeamDB(), input.Avatar); err != nil {
				logger.WithError(err).Error("avatar set err")
			}
		}

		//if len(input.CurrentPassword) > 0 || len(input.NewPassword) > 0 {
		//	if len(input.NewPassword) < 8 {
		//		log.Log.WithError(err).Warning("password invalid length")
		//		ctx.Error(HttpErrInvalidPasswordLength, http.StatusBadRequest)
		//		return
		//	}
		//
		//	if !teamData.EqualPassword(input.CurrentPassword) {
		//		log.Log.WithError(err).Warning("invalid current password")
		//		ctx.Error(HttpErrInvalidCurrentPassword, http.StatusUnprocessableEntity)
		//		return
		//	}
		//
		//	if err := teamData.SetPassword(input.NewPassword); err != nil {
		//		log.Log.WithError(err).Error("password set err")
		//		ctx.Error(HttpErrInternalError, http.StatusInternalServerError)
		//		return
		//	}
		//}

		err = mainSrv.GetTeamDB().UpdateTeam(ctxReq, *teamData)
		if err != nil {
			logger.WithError(err).Error("get team data err")
			ctx.Error(HttpErrInternalError, http.StatusInternalServerError)
			return
		}

		ctx.SetStatusCode(http.StatusOK)
	}
}

func handleLogout(mainSrv *actions.MainInternal) fasthttp.RequestHandler {
	return func(ctx *fasthttp.RequestCtx) {
		logger := GetLogger(ctx)

		if !bytes.Equal(ctx.PostBody(), []byte("{}")) {
			logger.Warning("invalid json")
			ctx.Error(HttpErrInvalidJson, http.StatusBadRequest)
			return
		}

		cookieData := fasthttp.AcquireCookie()
		cookieData.SetExpire(fasthttp.CookieExpireDelete)
		cookieData.SetPath("/")
		cookieData.SetKey("session")
		cookieData.SetHTTPOnly(true)
		cookieData.SetValue("")
		ctx.Response.Header.SetCookie(cookieData)
		fasthttp.ReleaseCookie(cookieData)

		ctx.SetStatusCode(http.StatusOK)
	}
}

func handleLogin(mainSrv *actions.MainInternal) fasthttp.RequestHandler {
	type request struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Captcha  string `json:"captcha"`
	}
	return func(ctx *fasthttp.RequestCtx) {
		ctxReq := GetCtx(ctx)
		logger := GetLogger(ctx)

		input := request{}
		if err := json.Unmarshal(ctx.PostBody(), &input); err != nil {
			logger.WithError(err).Warning("invalid json")
			ctx.Error(HttpErrInvalidJson, http.StatusBadRequest)
			return
		}

		ctxReqShort, cancel := context.WithTimeout(ctxReq, time.Second)
		defer cancel()
		if err := VerifyCaptcha(ctxReqShort, config.Config.CaptchaSecret, input.Captcha); err == context.DeadlineExceeded {
			logger.WithError(err).Warning("captcha timeout")
		} else if err != nil {
			logger.WithError(err).Warning("invalid captcha")
			ctx.Error(HttpErrInvalidCaptcha, http.StatusBadRequest)
			return
		}

		teamData, err := mainSrv.GetTeamByLogin(ctxReq, input.Email)
		if err == actions.TeamNotFound {
			(&models.TeamXXX{Password: "dummy password"}).EqualPassword(input.Password) // dummy check

			logger.WithField("email", input.Email).Warning("team not found login")
			ctx.Error(HttpErrInvalidPasswordOrUsername, http.StatusUnprocessableEntity)
			return
		} else if err != nil {
			logger.WithError(err).Error("get team login")
			ctx.Error(HttpErrInternalError, http.StatusInternalServerError)
			return
		}

		if !teamData.EqualPassword(input.Password) {
			logger.WithField("email", input.Email).Warning("invalid password")
			ctx.Error(HttpErrInvalidPasswordOrUsername, http.StatusUnprocessableEntity)
			return
		}

		sessionData := &SessionPermission{
			TeamID: teamData.ID,
		}
		sessionDataEncoded, err := session.MarshalSession(config.Config.AesSecretKey, config.Config.HmacSecretKey, sessionData)
		if err != nil {
			logger.WithError(err).WithField("team_id", teamData.ID).Error("cannot encode session")
			ctx.Error(HttpErrInternalError, http.StatusInternalServerError)
			return
		}

		cookieData := fasthttp.AcquireCookie()
		cookieData.SetPath("/")
		cookieData.SetMaxAge(int((time.Hour * 24 * 360).Seconds()))
		cookieData.SetKey("session")
		cookieData.SetHTTPOnly(true)
		if config.Config.EnableSecureCookies {
			cookieData.SetSecure(true)
		}
		cookieData.SetSameSite(fasthttp.CookieSameSiteLaxMode)
		cookieData.SetValueBytes(sessionDataEncoded)
		ctx.Response.Header.SetCookie(cookieData)
		fasthttp.ReleaseCookie(cookieData)

		json.NewEncoder(ctx.Response.BodyWriter()).Encode(actions.TeamData{
			ID: teamData.ID,
		})
	}
}

func handleScoreboard(mainSrv *actions.MainInternal) fasthttp.RequestHandler {
	return func(ctx *fasthttp.RequestCtx) {
		ctxReq := GetCtx(ctx)
		logger := GetLogger(ctx)

		tasks, err := mainSrv.GetScoreboard(ctxReq)
		if err != nil {
			logger.WithError(err).Error("get scoreboard err")
			ctx.Error(HttpErrInternalError, http.StatusInternalServerError)
			return
		}
		if config.IsFreezeNow() {
			ctx.Response.Header.Set("X-Freeze", "1")
		}
		json.NewEncoder(ctx.Response.BodyWriter()).Encode(tasks)
	}
}

func handleAnnouncements(mainSrv *actions.MainInternal) fasthttp.RequestHandler {
	return func(ctx *fasthttp.RequestCtx) {
		ctxReq := GetCtx(ctx)
		logger := GetLogger(ctx)

		tasks, err := mainSrv.GetAnnouncements(ctxReq)
		if err != nil {
			logger.WithError(err).Error("get announcements err")
			ctx.Error(HttpErrInternalError, http.StatusInternalServerError)
			return
		}
		json.NewEncoder(ctx.Response.BodyWriter()).Encode(tasks)
	}
}

func handleTaskSolvers(mainSrv *actions.MainInternal) fasthttp.RequestHandler {
	return func(ctx *fasthttp.RequestCtx) {
		ctxReq := GetCtx(ctx)
		logger := GetLogger(ctx)

		taskIDStr := ctx.UserValue("task_id").(string)
		taskID, err := strconv.Atoi(taskIDStr)
		if err != nil {
			logger.WithError(err).Warning("invalid task id")
			ctx.Error(HttpErrNotFound, http.StatusNotFound)
			return
		}

		taskSolvers, err := mainSrv.GetTaskSolvers(ctxReq, taskID)
		if err != nil {
			logger.WithError(err).Error("get task solvers err")
			ctx.Error(HttpErrInternalError, http.StatusInternalServerError)
			return
		}

		json.NewEncoder(ctx.Response.BodyWriter()).Encode(taskSolvers)
	}
}

func handleTasks(mainSrv *actions.MainInternal) fasthttp.RequestHandler {
	return func(ctx *fasthttp.RequestCtx) {
		ctxReq := GetCtx(ctx)
		logger := GetLogger(ctx)

		tasks, err := mainSrv.GetTasks(ctxReq)
		if err != nil {
			logger.WithError(err).Error("get tasks err")
			ctx.Error(HttpErrInternalError, http.StatusInternalServerError)
			return
		}
		json.NewEncoder(ctx.Response.BodyWriter()).Encode(tasks)
	}
}

func handleTeams(mainSrv *actions.MainInternal) fasthttp.RequestHandler {
	return func(ctx *fasthttp.RequestCtx) {
		ctxReq := GetCtx(ctx)
		logger := GetLogger(ctx)

		tasks, err := mainSrv.GetTeams(ctxReq)
		if err != nil {
			logger.WithError(err).Error("get teams err")
			ctx.Error(HttpErrInternalError, http.StatusInternalServerError)
			return
		}
		json.NewEncoder(ctx.Response.BodyWriter()).Encode(tasks)
	}
}

func handleInfo(mainSrv *actions.MainInternal) fasthttp.RequestHandler {
	return func(ctx *fasthttp.RequestCtx) {
		ctxReq := GetCtx(ctx)
		logger := GetLogger(ctx)

		info, err := mainSrv.GetInfo(ctxReq)
		if err != nil {
			logger.WithError(err).Error("get info err")
			ctx.Error(HttpErrInternalError, http.StatusInternalServerError)
			return
		}
		json.NewEncoder(ctx.Response.BodyWriter()).Encode(info)
	}
}

func handleTeamInfo(mainSrv *actions.MainInternal) fasthttp.RequestHandler {
	return func(ctx *fasthttp.RequestCtx) {
		ctxReq := GetCtx(ctx)
		logger := GetLogger(ctx)

		// team_id
		teamIDStr := ctx.UserValue("team_id").(string)
		teamID, err := strconv.Atoi(teamIDStr)
		if err != nil {
			logger.WithError(err).Warning("invalid team id")
			ctx.Error(HttpErrNotFound, http.StatusNotFound)
			return
		}

		teamData, err := mainSrv.GetTeamDataPublic(ctxReq, teamID)
		if errors.Is(err, sql.ErrNoRows) {
			logger.WithError(err).Error("get team data - not exists")
			ctx.Error(HttpErrNotFound, http.StatusNotFound)
			return
		} else if err != nil {
			logger.WithError(err).Error("get team data err")
			ctx.Error(HttpErrInternalError, http.StatusInternalServerError)
			return
		}

		json.NewEncoder(ctx.Response.BodyWriter()).Encode(teamData)
	}
}

func handleTeamMy(mainSrv *actions.MainInternal) fasthttp.RequestHandler {
	return func(ctx *fasthttp.RequestCtx) {
		ctxReq := GetCtx(ctx)
		logger := GetLogger(ctx)
		sessionData := GetSession(ctx)

		teamData, err := mainSrv.GetTeamDataPrivate(ctxReq, sessionData.TeamID)
		if err != nil {
			logger.WithError(err).Error("get team data err")
			ctx.Error(HttpErrInternalError, http.StatusInternalServerError)
			return
		}

		json.NewEncoder(ctx.Response.BodyWriter()).Encode(teamData)
	}
}

func handleFlagSubmit(mainSrv *actions.MainInternal) fasthttp.RequestHandler {
	type request struct {
		Flag string `json:"flag"`
	}

	return func(ctx *fasthttp.RequestCtx) {
		// TODO: anty brute?
		ctxReq := GetCtx(ctx)
		logger := GetLogger(ctx)
		sessionData := GetSession(ctx)

		input := request{}
		if err := json.Unmarshal(ctx.PostBody(), &input); err != nil {
			logger.WithError(err).Warning("invalid json")
			ctx.Error(HttpErrInvalidJson, http.StatusBadRequest)
			return
		}

		if err := mainSrv.Solve(ctxReq, sessionData.TeamID, input.Flag); err == actions.InvalidFlag {
			logger.WithField("flag", input.Flag).WithError(err).Warning("invalid flag")
			ctx.Error(HttpErrInvalidFlag, http.StatusUnprocessableEntity)
			return
		} else if err == actions.AlreadySolved {
			logger.WithField("flag", input.Flag).WithError(err).Warning("already solved")
			ctx.Error(HttpErrAlreadySolved, http.StatusUnprocessableEntity)
			return
		} else if err != nil {
			logger.WithField("flag", input.Flag).WithError(err).Error("save solve err")
			ctx.Error(HttpErrInternalError, http.StatusInternalServerError)
			return
		}

		ctx.Response.SetStatusCode(http.StatusOK)
	}
}

// middleware
type SessionPermission struct {
	TeamID int `json:"team_id"`
}

func GetSession(ctx *fasthttp.RequestCtx) *SessionPermission {
	sessionOut, ok := ctx.UserValue("_session").(*SessionPermission)
	if !ok {
		panic("not supported here please add AuthMiddleware")
	}
	return sessionOut
}

func GetCtx(ctx *fasthttp.RequestCtx) context.Context {
	ctxReq, ok := ctx.UserValue("_ctx").(context.Context)
	if !ok {
		panic("not supported here please add TimeoutMiddleware")
	}
	return ctxReq
}

func GetLogger(ctx *fasthttp.RequestCtx) *logrus.Entry {
	logger, ok := ctx.UserValue("_logger").(*logrus.Entry)
	if !ok {
		panic("not supported here please add TimeoutMiddleware")
	}
	return logger
}

func GetUserIP(ctx *fasthttp.RequestCtx) string {
	return string(ctx.Request.Header.Peek("X-Real-IP"))
}

func goRecover(f func(), recovered chan<- interface{}) {
	go func() {
		done := false // just to handle panic(nil) https://github.com/golang/go/issues/25448
		defer func() {
			if !done {
				recovered <- recover()
			}
		}()
		f()
		done = true
	}()
}

func TimeoutMiddleware(needAuth bool, h fasthttp.RequestHandler) fasthttp.RequestHandler {
	return func(ctx *fasthttp.RequestCtx) {
		now := time.Now()
		ctxReq, cancel := context.WithTimeout(context.Background(), config.Config.RequestTimeout)
		defer cancel()
		done := make(chan struct{})
		recovered := make(chan interface{})

		logger := log.Log.WithFields(logrus.Fields{
			"request_id": rand.RandInt(),
			"user_ip":    GetUserIP(ctx),
			"url":        string(ctx.Request.RequestURI()),
		})

		if needAuth {
			sessionData := ctx.Request.Header.Cookie("session")
			if len(sessionData) == 0 {
				ctx.Error(HttpErrNotAuthorize, http.StatusUnauthorized)
				return
			}

			var sessionOut *SessionPermission
			if err := session.UnmarshalSession(config.Config.AesSecretKey, config.Config.HmacSecretKey, sessionData, &sessionOut); err != nil {
				logger.WithError(err).Warning("session decode err")
				ctx.Error(HttpErrNotAuthorize, http.StatusUnauthorized)
				return
			}
			logger = logger.WithField("team_id", sessionOut.TeamID)
			ctx.SetUserValue("_session", sessionOut)
		}

		ctx.SetUserValue("_ctx", ctxReq)
		ctx.SetUserValue("_logger", logger)

		goRecover(func() {
			h(ctx)
			close(done)
		}, recovered)

		duration := time.Since(now)
		select {
		case <-ctxReq.Done():
			logger.WithFields(logrus.Fields{
				"duration": duration,
			}).WithError(ctxReq.Err()).Error("request timeout")
			ctx.TimeoutErrorWithCode("request_timeout", http.StatusServiceUnavailable)
		case <-done:
			if duration.Seconds() > 1.0 {
				logger.WithFields(logrus.Fields{
					"status":   ctx.Response.StatusCode(),
					"duration": duration,
				}).Warning("request bigger time")
			}
			logger.WithFields(logrus.Fields{
				"status":   ctx.Response.StatusCode(),
				"duration": duration,
			}).Info("request ok")
		case err := <-recovered:
			panic(err)
		}
	}
}

func run() error {
	if len(config.Config.SentryDsn) > 0 {
		hook, err := sentry.NewSentryHook(config.Config.SentryDsn)
		if err != nil {
			return err
		}
		log.Log.AddHook(hook)
	}
	log.Log.Info("server starting")

	dbSrv, err := db.NewDB(config.Config.MysqlDsn)
	if err != nil {
		return err
	}

	teamSrv := models.NewTeamDB(dbSrv)
	taskSrv := models.NewTaskDB(dbSrv)
	auditSrv := models.NewAuditDB(dbSrv)
	mainSrv := actions.NewRanking(taskSrv, teamSrv, auditSrv, dbSrv)

	ctx := context.Background()
	go taskSrv.Run(ctx)

	r := router.New()
	r.PanicHandler = func(ctx *fasthttp.RequestCtx, err interface{}) {
		log.Log.WithField("err", err).WithField("url", string(ctx.RequestURI())).Error("panic from http handler")
		ctx.Error("internal_error", http.StatusInternalServerError)
	}
	r.GET("/api/v1/announcements", fasthttp.CompressHandler(TimeoutMiddleware(false, handleAnnouncements(mainSrv))))
	r.GET("/api/v1/scoreboard", fasthttp.CompressHandler(TimeoutMiddleware(false, handleScoreboard(mainSrv))))
	r.GET("/api/v1/info", fasthttp.CompressHandler(TimeoutMiddleware(false, handleInfo(mainSrv))))

	r.GET("/api/v1/tasks", fasthttp.CompressHandler(TimeoutMiddleware(false, handleTasks(mainSrv))))
	r.GET("/api/v1/task_solvers/:task_id", fasthttp.CompressHandler(TimeoutMiddleware(false, handleTaskSolvers(mainSrv))))

	r.GET("/api/v1/teams", fasthttp.CompressHandler(TimeoutMiddleware(false, handleTeams(mainSrv))))
	r.GET("/api/v1/team_info/:team_id", fasthttp.CompressHandler(TimeoutMiddleware(false, handleTeamInfo(mainSrv))))

	r.POST("/api/v1/team/register", fasthttp.CompressHandler(TimeoutMiddleware(false, handleRegister(mainSrv))))
	r.POST("/api/v1/team/login", fasthttp.CompressHandler(TimeoutMiddleware(false, handleLogin(mainSrv))))
	r.POST("/api/v1/team/logout", fasthttp.CompressHandler(TimeoutMiddleware(true, handleLogout(mainSrv))))

	r.GET("/api/v1/team/avatar/*filepath", fasthttp.CompressHandler(TimeoutMiddleware(false, handleTeamAvatar(mainSrv))))

	r.GET("/api/v1/team", fasthttp.CompressHandler(TimeoutMiddleware(true, handleTeamMy(mainSrv))))
	r.POST("/api/v1/team/settings", fasthttp.CompressHandler(TimeoutMiddleware(true, handleTeamUpdate(mainSrv))))
	r.POST("/api/v1/flag/submit", fasthttp.CompressHandler(TimeoutMiddleware(true, handleFlagSubmit(mainSrv))))

	r.GET("/api/v1/healthcheck", func(ctx *fasthttp.RequestCtx) {
		ctxReq, cancel := context.WithTimeout(context.Background(), time.Second)
		defer cancel()
		if err := dbSrv.Ping(ctxReq); err != nil {
			log.Log.WithError(err).Error("healthcheck failed")
			ctx.SetStatusCode(http.StatusInternalServerError)
			return
		}

		log.Log.Info("healthcheck ok")
		ctx.SetStatusCode(http.StatusOK)
	})

	s := &fasthttp.Server{
		Handler: r.Handler,
	}
	log.Log.Info("server started")
	return s.ListenAndServe(config.Config.Listen)
}

func main() {
	if err := run(); err != nil {
		log.Log.WithError(err).Error("server closed with err")
		os.Exit(1)
	}
}
