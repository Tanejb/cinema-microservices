package logger

import (
	"log"
	"os"
)

type Logger struct {
	*log.Logger
}

func New(serviceName string) *Logger {
	prefix := "[" + serviceName + "] "
	return &Logger{
		Logger: log.New(os.Stdout, prefix, log.LstdFlags|log.Lshortfile),
	}
}
