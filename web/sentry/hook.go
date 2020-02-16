package sentry

import (
	"fmt"
	"github.com/getsentry/sentry-go"
	"github.com/sirupsen/logrus"
	"reflect"
)

type SentryHook struct {
	client *sentry.Hub
}

func NewSentryHook(dsn string) (*SentryHook, error) {
	err := sentry.Init(sentry.ClientOptions{
		Dsn: dsn,
	})
	if err != nil {
		return nil, err
	}

	return &SentryHook{
		client: sentry.CurrentHub(),
	}, nil
}

func (hook *SentryHook) Fire(entry *logrus.Entry) error {
	var err error
	if err2, ok := entry.Data[logrus.ErrorKey]; ok {
		if err3, ok := err2.(error); ok {
			err = err3
		} else {
			err = fmt.Errorf("not err: %v", err2)
		}
	}

	event := sentry.NewEvent()
	if err != nil {
		stacktrace := sentry.ExtractStacktrace(err)
		if stacktrace == nil {
			stacktrace = sentry.NewStacktrace()
		}
		event.Exception = []sentry.Exception{{
			Value:      err.Error(),
			Type:       reflect.TypeOf(err).String(),
			Stacktrace: stacktrace,
		}}
	}
	event.Message = entry.Message
	event.Timestamp = entry.Time.Unix()
	tags := make(map[string]string)
	for key, value := range entry.Data {
		if key == logrus.ErrorKey {
			continue
		}
		if v, ok := value.(string); ok {
			tags[key] = v
		} else {
			tags[key] = fmt.Sprintf("%v", value)
		}
	}
	event.Tags = tags

	switch entry.Level {
	case logrus.PanicLevel:
		event.Level = sentry.LevelFatal
	case logrus.FatalLevel:
		event.Level = sentry.LevelFatal
	case logrus.ErrorLevel:
		event.Level = sentry.LevelError
	case logrus.WarnLevel:
		event.Level = sentry.LevelWarning
	case logrus.InfoLevel:
		event.Level = sentry.LevelInfo
	case logrus.DebugLevel, logrus.TraceLevel:
		event.Level = sentry.LevelDebug
	default:
		return nil
	}

	hook.client.CaptureEvent(event)
	return nil
}

func (hook *SentryHook) Levels() []logrus.Level {
	return []logrus.Level{
		logrus.PanicLevel,
		logrus.FatalLevel,
		logrus.ErrorLevel,
		logrus.WarnLevel,
		//logrus.InfoLevel,
		//logrus.DebugLevel,
		//logrus.TraceLevel,
	}
}
