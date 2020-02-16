package models

import (
	"context"
	"ctfplatform/config"
	"ctfplatform/db"
	"ctfplatform/log"
	"errors"
	"sync"
	"time"
)

type TaskXXX struct {
	ID          int
	Name        string
	Points      int
	Solvers     int
	Category    string
	Description string
	Difficult   string
}

type TaskInternal struct {
	db *db.DatabaseInternal

	flagsMu     sync.RWMutex
	flagsToTask map[string]int
}

func NewTaskDB(db *db.DatabaseInternal) *TaskInternal {
	s := &TaskInternal{
		db:          db,
		flagsToTask: make(map[string]int),
	}
	return s
}

func (s *TaskInternal) Run(ctx context.Context) error {
	for {
		s.updateWorker(ctx)

		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(time.Second * 10):
		}
	}
	return nil
}

func (s *TaskInternal) updateWorker(ctx context.Context) {
	newFlags, err := s.GetFlags(ctx)
	if err != nil {
		log.Log.WithError(err).Error("not updating flags")
		return
	}
	s.flagsMu.Lock()
	s.flagsToTask = newFlags
	s.flagsMu.Unlock()
}

func (s *TaskInternal) GetFlags(ctx context.Context) (map[string]int, error) {
	query := `
SELECT 
	task_flags.task_id,
	task_flags.flag
FROM 
	task_flags
INNER JOIN task ON (task.id = task_flags.task_id)
WHERE
	task.started_at < NOW()
`
	rows, err := s.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make(map[string]int)
	var (
		taskID int
		flag   string
	)
	for rows.Next() {
		if err := rows.Scan(&taskID, &flag); err != nil {
			return nil, err
		}
		out[flag] = taskID
	}
	return out, nil
}

func (s *TaskInternal) GetByFlag(ctx context.Context, flag string) (int, error) {
	s.flagsMu.RLock()
	defer s.flagsMu.RUnlock()
	taskID, exists := s.flagsToTask[flag]
	if !exists {
		return 0, errors.New("not exists")
	}
	return taskID, nil
}

func (s *TaskInternal) All(ctx context.Context) ([]*TaskXXX, error) {
	query := `
WITH
    audit_fixed AS (
        SELECT
            audit.id,
            audit.team_id,
            audit.task_id,
            audit.created_at
        FROM
            audit
        WHERE
            audit.created_at BETWEEN ? AND ?
    ),
    task_calculated_points AS (
        SELECT
            audit_fixed.task_id,
            COUNT(1) as team_solved,
            GREATEST(
                50,
                FLOOR(
                    500 - (80 * LOG2(
                        (
                            GREATEST(
                                1,
                                COUNT(1)
                            ) + 3
                        ) / (1 + 3)
                    ))
                )
            ) as points
        FROM
            audit_fixed
        GROUP BY audit_fixed.task_id
    )
SELECT
    task.id,
    task.name,
    task.description,
    task.category,
    task.difficult,
    COALESCE(task_calculated_points.points, 500) as points,
    COALESCE(task_calculated_points.team_solved, 0) as solvers
FROM
    task
LEFT JOIN task_calculated_points ON (task_calculated_points.task_id = task.id)
WHERE
	task.started_at < NOW()
`
	rows, err := s.db.Query(ctx, query, time.Time(config.Config.StartCompetition), time.Time(config.Config.EndCompetition))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]*TaskXXX, 0)
	for rows.Next() {
		var row TaskXXX
		if err := rows.Scan(&row.ID, &row.Name, &row.Description, &row.Category, &row.Difficult, &row.Points, &row.Solvers); err != nil {
			return nil, err
		}
		out = append(out, &row)
	}
	return out, nil
}
