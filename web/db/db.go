package db

import (
	"context"
	"database/sql"
	"errors"
	"github.com/go-sql-driver/mysql"
	_ "github.com/go-sql-driver/mysql"
)

var ErrAlreadyExistsDB = errors.New("already exists in db")

type DatabaseInternal struct {
	db *sql.DB
}

func NewDB(mysqlDSN string) (*DatabaseInternal, error) {
	db, err := sql.Open("mysql", mysqlDSN)
	if err != nil {
		return nil, err
	}

	return &DatabaseInternal{
		db: db,
	}, nil
}

func (s *DatabaseInternal) Ping(ctx context.Context) error {
	return s.db.PingContext(ctx)
}

func (s *DatabaseInternal) Exec(ctx context.Context, query string, args ...interface{}) (sql.Result, error) {
	result, err := s.db.ExecContext(ctx, query, args...)
	return result, wrapErr(err)
}

func (s *DatabaseInternal) QueryRow(ctx context.Context, query string, args ...interface{}) *Row {
	rows, err := s.db.QueryContext(ctx, query, args...)
	return &Row{Err: wrapErr(err), rows: rows}
}

func (s *DatabaseInternal) Query(ctx context.Context, query string, args ...interface{}) (*sql.Rows, error) {
	rows, err := s.db.QueryContext(ctx, query, args...)
	return rows, wrapErr(err)
}

func (s *DatabaseInternal) Close(ctx context.Context) error {
	if s.db != nil {
		return nil
	}
	return s.db.Close()
}

func wrapErr(err error) error {
	me, ok := err.(*mysql.MySQLError)
	if !ok {
		return err
	}
	if me.Number == 1062 {
		return ErrAlreadyExistsDB
	}
	return err
}

// forked shit, no public Err in stdlib :'(
type Row struct {
	Err  error
	rows *sql.Rows
}

func (r *Row) Scan(dest ...interface{}) error {
	if r.Err != nil {
		return r.Err
	}
	defer r.rows.Close()
	for _, dp := range dest {
		if _, ok := dp.(*sql.RawBytes); ok {
			return errors.New("sql: RawBytes isn't allowed on Row.Scan")
		}
	}

	if !r.rows.Next() {
		if err := r.rows.Err(); err != nil {
			return err
		}
		return sql.ErrNoRows
	}
	err := r.rows.Scan(dest...)
	if err != nil {
		return err
	}
	return r.rows.Close()
}
