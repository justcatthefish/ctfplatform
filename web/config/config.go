package config

import (
	"github.com/kelseyhightower/envconfig"
	"log"
	"time"
)

type DateTimeParser time.Time

func (dt *DateTimeParser) Decode(value string) error {
	out, err := time.Parse(time.RFC3339, value)
	if err != nil {
		return err
	}
	*dt = DateTimeParser(out)
	return nil
}

var Config *config

func init() {
	var s config
	err := envconfig.Process("", &s)
	if err != nil {
		// WTF :)
		log.Fatal(err.Error())
	}
	Config = &s
}

type config struct {
	EnableSecureCookies bool `default:"true" split_words:"true"`

	StartCompetition DateTimeParser `default:"2019-12-20T20:00:00+00:00" split_words:"true"`
	EndCompetition   DateTimeParser `default:"2019-12-22T09:00:00+00:00" split_words:"true"`

	FreezeStartCompetition DateTimeParser `default:"2019-12-22T08:00:00+00:00" split_words:"true"`
	FreezeEndCompetition   DateTimeParser `default:"2019-12-22T09:00:00+00:00" split_words:"true"`

	HmacSecretKey []byte `required:"true" split_words:"true"`
	AesSecretKey  []byte `required:"true" split_words:"true"`
	CaptchaSecret string `required:"true" split_words:"true"`
	SentryDsn     string `default:"" split_words:"true"`

	RequestTimeout time.Duration `default:"4s" split_words:"true"`
	Listen         string        `default:":8080" split_words:"true"`

	MysqlDsn string `required:"true" split_words:"true"`
	AvatarPublicWebPath string `default:"/avatar/" split_words:"true"`
}

func IsFreezeNow() bool {
	now := time.Now()
	//start < now && end > now
	return time.Time(Config.FreezeStartCompetition).Before(now) && time.Time(Config.FreezeEndCompetition).After(now)
}

func IsBetweenFreeze(now time.Time) bool {
	//start < now && end > now
	return IsFreezeNow() && time.Time(Config.FreezeStartCompetition).Before(now) && time.Time(Config.FreezeEndCompetition).After(now)
}
