package models

import (
	"context"
	"ctfplatform/config"
	"ctfplatform/db"
	"fmt"
	"time"
)

type AuditXXX struct {
	ID        int
	TeamID    int
	TeamName  string
	TaskID    int
	TaskName  string
	CreatedAt time.Time
}

type ScoreboardtXXX struct {
	TeamID     int
	Points     int
	TaskID     int
	TaskSolved int
	CreatedAt  time.Time
}

type AuditInternal struct {
	db *db.DatabaseInternal
}

func NewAuditDB(db *db.DatabaseInternal) *AuditInternal {
	s := &AuditInternal{
		db: db,
	}
	return s
}

func (s *AuditInternal) AddSolve(ctx context.Context, teamID int, taskID int) error {
	query := `
INSERT INTO audit (id, team_id, task_id, created_at) VALUES (NULL, ?, ?, NOW())
`
	_, err := s.db.Exec(ctx, query, teamID, taskID)
	return err
}

func (s *AuditInternal) GetAudits(ctx context.Context) ([]*AuditXXX, error) {
	// TODO: limit sql?
	query := `
SELECT
	audit.id,
	audit.team_id,
	audit.task_id,
	audit.created_at,
	task.name as task_name,
	team.name as team_name
FROM 
	audit
INNER JOIN team ON (team.id = audit.team_id)
INNER JOIN task ON (task.id = audit.task_id)
ORDER BY audit.created_at DESC
`
	rows, err := s.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]*AuditXXX, 0)
	for rows.Next() {
		var row AuditXXX
		if err := rows.Scan(&row.ID, &row.TeamID, &row.TaskID, &row.CreatedAt, &row.TeamName, &row.TaskName); err != nil {
			return nil, err
		}
		out = append(out, &row)
	}
	return out, nil
}

func (s *AuditInternal) GetSolvedByTask(ctx context.Context, taskID int) ([]*AuditXXX, error) {
	// TODO: limit sql?
	query := `
SELECT
	audit.id,
	audit.team_id,
	audit.task_id,
	audit.created_at,
	team.name as team_name,
	task.name as task_name
FROM 
	audit
INNER JOIN team ON (team.id = audit.team_id)
INNER JOIN task ON (task.id = audit.task_id)
WHERE 
	audit.task_id = ?
	AND task.started_at < NOW()
ORDER BY audit.created_at ASC
`
	rows, err := s.db.Query(ctx, query, taskID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]*AuditXXX, 0)
	for rows.Next() {
		var row AuditXXX
		if err := rows.Scan(&row.ID, &row.TeamID, &row.TaskID, &row.CreatedAt, &row.TeamName, &row.TaskName); err != nil {
			return nil, err
		}
		out = append(out, &row)
	}
	return out, nil
}

func (s *AuditInternal) GetSolvedByTeam(ctx context.Context, teamID int) ([]*AuditXXX, error) {
	// TODO: limit sql?
	query := `
SELECT
	audit.id,
	audit.team_id,
	audit.task_id,
	audit.created_at,
	team.name as team_name,
	task.name as task_name
FROM 
	audit
INNER JOIN team ON (team.id = audit.team_id)
INNER JOIN task ON (task.id = audit.task_id)
WHERE 
	audit.team_id = ?
ORDER BY audit.created_at DESC
`
	rows, err := s.db.Query(ctx, query, teamID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]*AuditXXX, 0)
	for rows.Next() {
		var row AuditXXX
		if err := rows.Scan(&row.ID, &row.TeamID, &row.TaskID, &row.CreatedAt, &row.TeamName, &row.TaskName); err != nil {
			return nil, err
		}
		out = append(out, &row)
	}
	return out, nil
}

func (s *AuditInternal) GetSolvedByTeams(ctx context.Context, teamIds []int) (map[int][]*AuditXXX, error) {
	// TODO: limit sql?
	query := fmt.Sprintf(`
SELECT
	audit.id,
	audit.team_id,
	audit.task_id,
	audit.created_at,
	team.name as team_name,
	task.name as task_name
FROM 
	audit
INNER JOIN team ON (team.id = audit.team_id)
INNER JOIN task ON (task.id = audit.task_id)
WHERE 
	audit.team_id IN (%s)
ORDER BY audit.created_at DESC
`, sqlInComma(len(teamIds)))
	rows, err := s.db.Query(ctx, query, arrayIntToInterface(teamIds)...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make(map[int][]*AuditXXX)
	for rows.Next() {
		var row AuditXXX
		if err := rows.Scan(&row.ID, &row.TeamID, &row.TaskID, &row.CreatedAt, &row.TeamName, &row.TaskName); err != nil {
			return nil, err
		}
		out[row.TeamID] = append(out[row.TeamID], &row)
	}
	return out, nil
}

func (s *AuditInternal) GetScoreboard(ctx context.Context) ([]*ScoreboardtXXX, error) {
	// TODO: limit sql?
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
    last_solved_task_per_team AS (
        SELECT
            audit_fixed.team_id,
            audit_fixed.task_id,
            audit_fixed.created_at
        FROM
            audit_fixed
			INNER JOIN (
                SELECT
                    MAX(audit_fixed.id) as last_solved_audit_id
                FROM
                    audit_fixed
                GROUP BY audit_fixed.team_id
            ) t1 ON (t1.last_solved_audit_id = audit_fixed.id)
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
    ),
    team_calculated_points AS (
        SELECT
            audit_fixed.team_id,
            COUNT(1) as task_solved,
            SUM(task_calculated_points.points) as points
        FROM
            audit_fixed
		INNER JOIN task_calculated_points ON (audit_fixed.task_id = task_calculated_points.task_id)
        GROUP BY audit_fixed.team_id
    )
SELECT
    team_calculated_points.team_id,
    team_calculated_points.task_solved,
    team_calculated_points.points,
    last_solved_task_per_team.task_id,
    last_solved_task_per_team.created_at
FROM
    team_calculated_points
INNER JOIN last_solved_task_per_team ON (team_calculated_points.team_id = last_solved_task_per_team.team_id)
ORDER BY team_calculated_points.points DESC, last_solved_task_per_team.created_at ASC
`
	endDate := time.Time(config.Config.EndCompetition)
	if config.IsFreezeNow() {
		endDate = time.Time(config.Config.FreezeStartCompetition)
	}
	rows, err := s.db.Query(ctx, query, time.Time(config.Config.StartCompetition), endDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]*ScoreboardtXXX, 0)
	for rows.Next() {
		var row ScoreboardtXXX
		if err := rows.Scan(&row.TeamID, &row.TaskSolved, &row.Points, &row.TaskID, &row.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, &row)
	}
	return out, nil
}

// TODO: move to other file
type AnnouncementXXX struct {
	ID          int
	Title       string
	Description string
	CreatedAt   time.Time
}

func (s *AuditInternal) GetAnnouncements(ctx context.Context) ([]*AnnouncementXXX, error) {
	// TODO: limit sql?
	query := `
SELECT
	id,
	title,
	description,
	created_at
FROM
	announcement
ORDER BY created_at DESC`
	rows, err := s.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]*AnnouncementXXX, 0)
	for rows.Next() {
		var row AnnouncementXXX
		if err := rows.Scan(&row.ID, &row.Title, &row.Description, &row.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, &row)
	}
	return out, nil
}
