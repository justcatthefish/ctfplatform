package actions

import (
	"context"
	"ctfplatform/config"
	"ctfplatform/db"
	"ctfplatform/models"
	"database/sql"
	"errors"
	"fmt"
	"path/filepath"
	"strings"
	"time"
)

type MainInternal struct {
	taskDB *models.TaskInternal
	teamDB *models.TeamInternal

	auditDB *models.AuditInternal

	unsafeDB *db.DatabaseInternal   // TODO: remove it, added because deadline is coming :x
}

var InvalidFlag = errors.New("invalid flag")
var AlreadySolved = errors.New("already solved task")
var TeamNotFound = errors.New("team not found")
var TeamAlreadyExists = errors.New("team already exists")

func NewRanking(taskDB *models.TaskInternal, teamDB *models.TeamInternal, auditDB *models.AuditInternal, unsafeDB *db.DatabaseInternal) *MainInternal {
	s := &MainInternal{
		taskDB:  taskDB,
		teamDB:  teamDB,
		auditDB: auditDB,

		unsafeDB: unsafeDB,
	}
	return s
}

// game info
type Info struct {
	Start              time.Time `json:"start"`
	End                time.Time `json:"end"`
	FlagsCount         int       `json:"flags_count"`
	TeamsCount         int       `json:"teams_count"`
	CountriesCount     int       `json:"countries_count"`
	TasksUnsolvedCount int       `json:"tasks_unsolved_count"`
}

func (s *MainInternal) GetInfo(ctx context.Context) (Info, error) {
	query := `
SELECT 
	COALESCE(flags_count.flags_count, 0),
	COALESCE(teams_count.teams_count, 0),
	COALESCE(countries_count.countries_count, 0),
	COALESCE(tasks_unsolved_count.tasks_unsolved_count, 0)
FROM 
(
	SELECT
		count(1) as flags_count
	FROM 
		audit
	WHERE
		audit.created_at BETWEEN ? AND ?
) as flags_count,
(
	SELECT
		count(1) as teams_count
	FROM 
		team
	WHERE
		team.created_at < ?
) as teams_count,
(
	SELECT
		COUNT(DISTINCT country) as countries_count
	FROM 
		team
	WHERE
		team.created_at < ?
) as countries_count,
(
	SELECT
		count(1) as tasks_unsolved_count
	FROM
		task
	WHERE 
		id NOT IN (SELECT task_id FROM audit WHERE audit.created_at BETWEEN ? AND ?)
		AND started_at < NOW()
) as tasks_unsolved_count
`
	info := Info{
		Start: time.Time(config.Config.StartCompetition),
		End:   time.Time(config.Config.EndCompetition),
	}
	if err := s.unsafeDB.QueryRow(ctx, query, info.Start, info.End, info.End, info.End, info.Start, info.End).Scan(&info.FlagsCount, &info.TeamsCount, &info.CountriesCount, &info.TasksUnsolvedCount); err != nil {
		return info, err
	}
	return info, nil
}

// solve

func (s *MainInternal) Solve(ctx context.Context, teamID int, flag string) error {
	taskID, err := s.taskDB.GetByFlag(ctx, flag)
	if err != nil {
		return InvalidFlag
	}

	if err := s.auditDB.AddSolve(ctx, teamID, taskID); err == db.ErrAlreadyExistsDB {
		return AlreadySolved
	} else if err != nil {
		return fmt.Errorf("add solve: %w", err)
	}
	return nil
}

/// scoreboard
type Scoreboard struct {
	Team   *TeamData `json:"team"`
	Points int       `json:"points"`
}

func (s *MainInternal) GetScoreboard(ctx context.Context) ([]Scoreboard, error) {
	rows, err := s.auditDB.GetScoreboard(ctx)
	if err != nil {
		return nil, fmt.Errorf("get scoreboard: %w", err)
	}

	teamIDs := make([]int, len(rows))
	for i, row := range rows {
		teamIDs[i] = row.TeamID
	}

	teamsData, err := s.GetTeamDataByIds(ctx, teamIDs)
	if err != nil {
		return nil, err
	}

	out := make([]Scoreboard, len(rows))
	for i, row := range rows {
		team, exists := teamsData[row.TeamID]
		if !exists {
			// this should not happen (but maybe race condition or team was deleted in meantime)
			// just try in next request
			return nil, errors.New("team not exists but was in scoring")
		}

		out[i] = Scoreboard{
			Team:   team,
			Points: row.Points,
		}
	}
	return out, nil
}

/// announcements
type Announcement struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

func (s *MainInternal) GetAnnouncements(ctx context.Context) ([]Announcement, error) {
	rows, err := s.auditDB.GetAnnouncements(ctx)
	if err != nil {
		return nil, fmt.Errorf("get announcements: %w", err)
	}

	out := make([]Announcement, len(rows))
	for i, row := range rows {
		out[i] = Announcement{
			ID:          row.ID,
			Title:       row.Title,
			Description: row.Description,
			CreatedAt:   row.CreatedAt,
		}
	}
	return out, nil
}

/// tasks

type Task struct {
	ID          int      `json:"id"`
	Name        string   `json:"name"`
	Points      int      `json:"points"`
	Categories  []string `json:"categories"`
	Difficult   string   `json:"difficult"`
	Description string   `json:"description"`
	Solvers     int      `json:"solvers"`
}

func (s *MainInternal) GetTasks(ctx context.Context) ([]Task, error) {
	rows, err := s.taskDB.All(ctx)
	if err != nil {
		return nil, fmt.Errorf("get tasks: %w", err)
	}

	out := make([]Task, len(rows))
	for i, row := range rows {
		out[i] = Task{
			ID:          row.ID,
			Name:        row.Name,
			Categories:  strings.Split(row.Category, " "),
			Description: row.Description,
			Difficult:   row.Difficult,
			Points:      row.Points,
			Solvers:     row.Solvers,
		}
	}
	return out, nil
}

/// solved history for task

type TaskAudit struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

func (s *MainInternal) GetTaskSolvers(ctx context.Context, taskID int) ([]TaskAudit, error) {
	rows, err := s.auditDB.GetSolvedByTask(ctx, taskID)
	if err != nil {
		return nil, fmt.Errorf("get solved teams by task id: %w", err)
	}

	out := make([]TaskAudit, 0, len(rows))
	for _, row := range rows {
		if config.IsBetweenFreeze(row.CreatedAt) {
			continue
		}
		out = append(out, TaskAudit{
			ID:        row.TeamID,
			Name:      row.TeamName,
			CreatedAt: row.CreatedAt,
		})
	}
	return out, nil
}

/// solver history for team
/// get team

type TaskSolvedAudit struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

type TeamData struct {
	ID          int               `json:"id"`
	Name        string            `json:"name"`
	Email       string            `json:"email,omitempty"`
	Avatar      string            `json:"avatar"`
	Country     string            `json:"country"`
	Affiliation string            `json:"affiliation,omitempty"`
	Website     string            `json:"website,omitempty"`
	CreatedAt   time.Time         `json:"created_at"`
	TaskSolved  []TaskSolvedAudit `json:"task_solved,omitempty"`
}

func (s *MainInternal) GetTeams(ctx context.Context) ([]*TeamData, error) {
	rows, err := s.teamDB.All(ctx)
	if err != nil {
		return nil, fmt.Errorf("get team all: %w", err)
	}

	out := make([]*TeamData, len(rows))
	for i, team := range rows {
		outTeam := &TeamData{
			ID:          team.ID,
			Name:        team.Name,
			Email:       team.Email,
			Country:     team.Country,
			CreatedAt:   team.CreatedAt,
			Website:     team.Website,
			Affiliation: team.Affiliation,
		}
		if len(team.AvatarPath) > 0 {
			outTeam.Avatar = filepath.Join(config.Config.AvatarPublicWebPath, team.AvatarPath)
		}
		out[i] = outTeam
	}
	return out, nil
}

func (s *MainInternal) GetTeamDataPublic(ctx context.Context, teamID int) (*TeamData, error) {
	team, err := s.teamDB.GetByID(ctx, teamID)
	if err != nil {
		return nil, fmt.Errorf("get team by id: %w", err)
	}

	outTeam := &TeamData{
		ID:          team.ID,
		Name:        team.Name,
		Country:     team.Country,
		CreatedAt:   team.CreatedAt,
		Website:     team.Website,
		Affiliation: team.Affiliation,
	}
	if len(team.AvatarPath) > 0 {
		outTeam.Avatar = filepath.Join(config.Config.AvatarPublicWebPath, team.AvatarPath)
	}

	rows, err := s.auditDB.GetSolvedByTeam(ctx, teamID)
	if err != nil {
		return nil, fmt.Errorf("get solved task by team id: %w", err)
	}

	out := make([]TaskSolvedAudit, 0, len(rows))
	for _, row := range rows {
		if config.IsBetweenFreeze(row.CreatedAt) {
			continue
		}
		out = append(out, TaskSolvedAudit{
			ID:        row.TaskID,
			Name:      row.TaskName,
			CreatedAt: row.CreatedAt,
		})
	}
	outTeam.TaskSolved = out

	return outTeam, nil
}

func (s *MainInternal) GetTeamDataPrivate(ctx context.Context, teamID int) (*TeamData, error) {
	team, err := s.teamDB.GetByID(ctx, teamID)
	if err != nil {
		return nil, fmt.Errorf("get team by id: %w", err)
	}

	outTeam := &TeamData{
		ID:          team.ID,
		Name:        team.Name,
		Email:       team.Email,
		Country:     team.Country,
		CreatedAt:   team.CreatedAt,
		Website:     team.Website,
		Affiliation: team.Affiliation,
	}
	if len(team.AvatarPath) > 0 {
		outTeam.Avatar = filepath.Join(config.Config.AvatarPublicWebPath, team.AvatarPath)
	}

	rows, err := s.auditDB.GetSolvedByTeam(ctx, teamID)
	if err != nil {
		return nil, fmt.Errorf("get solved task by team id: %w", err)
	}

	out := make([]TaskSolvedAudit, len(rows))
	for i, row := range rows {
		out[i] = TaskSolvedAudit{
			ID:        row.TaskID,
			Name:      row.TaskName,
			CreatedAt: row.CreatedAt,
		}
	}
	outTeam.TaskSolved = out

	return outTeam, nil
}

func (s *MainInternal) GetTeamDataByIds(ctx context.Context, teamIds []int) (map[int]*TeamData, error) {
	if len(teamIds) == 0 {
		return nil, nil
	}

	teams, err := s.teamDB.GetByIDs(ctx, teamIds)
	if err != nil {
		return nil, fmt.Errorf("get team by ids: %w", err)
	}

	solvedTasks, err := s.auditDB.GetSolvedByTeams(ctx, teamIds)
	if err != nil {
		return nil, fmt.Errorf("get solver task by team ids: %w", err)
	}

	result := make(map[int]*TeamData, len(teamIds))
	for _, teamID := range teamIds {
		team, exists := teams[teamID]
		if !exists {
			continue
		}

		out := &TeamData{
			ID:        team.ID,
			Name:      team.Name,
			Country:   team.Country,
			CreatedAt: team.CreatedAt,
		}
		if len(team.AvatarPath) > 0 {
			out.Avatar = filepath.Join(config.Config.AvatarPublicWebPath, team.AvatarPath)
		}

		if solvedTasks, exists := solvedTasks[teamID]; exists {
			tasksOut := make([]TaskSolvedAudit, 0, len(solvedTasks))
			for _, row := range solvedTasks {
				if config.IsBetweenFreeze(row.CreatedAt) {
					continue
				}
				tasksOut = append(tasksOut, TaskSolvedAudit{
					ID:        row.TaskID,
					Name:      row.TaskName,
					CreatedAt: row.CreatedAt,
				})
			}
			out.TaskSolved = tasksOut
		}

		result[teamID] = out
	}

	return result, nil
}

// add team

func (s *MainInternal) AddTeam(ctx context.Context, teamData models.TeamXXX) error {
	err := s.teamDB.AddTeam(ctx, teamData)
	if err == db.ErrAlreadyExistsDB {
		return TeamAlreadyExists
	}
	return err
}

// get team

func (s *MainInternal) GetTeamByLogin(ctx context.Context, login string) (*models.TeamXXX, error) {
	team, err := s.teamDB.GetByLogin(ctx, login)
	if err == sql.ErrNoRows {
		return nil, TeamNotFound
	}
	return team, err
}

// update team profile

func (s *MainInternal) GetTeamDB() *models.TeamInternal {
	return s.teamDB
}
