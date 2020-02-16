package models

import (
	"context"
	"ctfplatform/db"
	"ctfplatform/rand"
	"fmt"
	"golang.org/x/crypto/bcrypt"
	"strings"
	"time"
)

type TeamXXX struct {
	ID          int
	Name        string
	Email       string
	Password    string
	AvatarPath  string
	Country     string
	CreatedAt   time.Time
	Affiliation string
	Website     string
}

func GenAvatarFilename() string {
	return fmt.Sprintf("%s.png", rand.RandStringRunes(32))
}

func (t *TeamXXX) SetAvatar(ctx context.Context, db *TeamInternal, avatarPayload []byte) error {
	if len(avatarPayload) == 0 {
		t.AvatarPath = ""
		return nil
	}
	oldAvatar := t.AvatarPath
	newAvatar := GenAvatarFilename()
	t.AvatarPath = newAvatar

	if err := db.UpdateAvatar(ctx, *t, avatarPayload); err != nil {
		t.AvatarPath = oldAvatar
		return err
	}
	//if err := ioutil.WriteFile(filepath.Join(config.Config.AvatarPath, newAvatar), avatarPayload, 0644); err != nil {
	//	return err
	//}
	//if len(t.AvatarPath) != 0 {
	//	if err := os.Remove(filepath.Join(config.Config.AvatarPath, t.AvatarPath)); err != nil {
	//		log.Log.WithError(err).Warningf("os.Remove avatar: %v", t.AvatarPath)
	//	}
	//}
	return nil
}

func (t *TeamXXX) SetPassword(plainPassword string) error {
	b, err := bcrypt.GenerateFromPassword([]byte(plainPassword), 12)
	if err != nil {
		return err
	}
	t.Password = string(b)
	return nil
}

func (t *TeamXXX) EqualPassword(plainPassword string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(t.Password), []byte(plainPassword))
	return err == nil
}

type TeamInternal struct {
	db *db.DatabaseInternal
}

func NewTeamDB(db *db.DatabaseInternal) *TeamInternal {
	return &TeamInternal{
		db: db,
	}
}

func (s *TeamInternal) All(ctx context.Context) ([]*TeamXXX, error) {
	query := `
SELECT
	id,
	name,
	created_at,
	avatar,
	country,
	affiliation,
	website
FROM team
ORDER BY id ASC
`
	rows, err := s.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*TeamXXX
	for rows.Next() {
		var out TeamXXX
		if err := rows.Scan(&out.ID, &out.Name, &out.CreatedAt, &out.AvatarPath, &out.Country, &out.Affiliation, &out.Website); err != nil {
			return nil, err
		}
		result = append(result, &out)
	}
	return result, nil
}

func (s *TeamInternal) GetByID(ctx context.Context, id int) (*TeamXXX, error) {
	query := `
SELECT
	id,
	name,
	email,
	password,
	created_at,
	avatar,
	country,
	affiliation,
	website
FROM team
WHERE
	id = ?
`
	var out TeamXXX
	err := s.db.QueryRow(ctx, query, id).Scan(&out.ID, &out.Name, &out.Email, &out.Password, &out.CreatedAt, &out.AvatarPath, &out.Country, &out.Affiliation, &out.Website)
	if err != nil {
		return nil, err
	}
	return &out, nil
}

// sad golang :(
func arrayIntToInterface(v []int) []interface{} {
	r := make([]interface{}, len(v))
	for i, a := range v {
		r[i] = a
	}
	return r
}

func sqlInComma(count int) string {
	if count == 0 {
		return ""
	}
	if count == 1 {
		return "?"
	}
	return "?" + strings.Repeat(",?", count-1)
}

func (s *TeamInternal) GetByIDs(ctx context.Context, ids []int) (map[int]*TeamXXX, error) {
	query := fmt.Sprintf(`
SELECT
	id,
	name,
	email,
	password,
	created_at,
	avatar,
	country,
	affiliation,
	website
FROM team
WHERE
	id IN (%s)
`, sqlInComma(len(ids)))
	rows, err := s.db.Query(ctx, query, arrayIntToInterface(ids)...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[int]*TeamXXX)
	for rows.Next() {
		var out TeamXXX
		if err := rows.Scan(&out.ID, &out.Name, &out.Email, &out.Password, &out.CreatedAt, &out.AvatarPath, &out.Country, &out.Affiliation, &out.Website); err != nil {
			return nil, err
		}
		result[out.ID] = &out
	}
	return result, nil
}

func (s *TeamInternal) GetByLogin(ctx context.Context, email string) (*TeamXXX, error) {
	query := `
SELECT
	id,
	name,
	email,
	password,
	created_at,
	avatar,
	country,
	affiliation,
	website
FROM team
WHERE
	email = ? OR name = ?
LIMIT 1
`
	var out TeamXXX
	err := s.db.QueryRow(ctx, query, email, email).Scan(&out.ID, &out.Name, &out.Email, &out.Password, &out.CreatedAt, &out.AvatarPath, &out.Country, &out.Affiliation, &out.Website)
	if err != nil {
		return nil, err
	}
	return &out, nil
}

func (s *TeamInternal) AddTeam(ctx context.Context, team TeamXXX) error {
	query := `
INSERT INTO team (id, name, email, password, created_at, active, avatar, country) VALUES (NULL, ?, ?, ?, NOW(), 1, ?, ?)
`
	_, err := s.db.Exec(ctx, query, team.Name, team.Email, team.Password, team.AvatarPath, team.Country)
	return err
}

func (s *TeamInternal) UpdateTeam(ctx context.Context, team TeamXXX) error {
	query := `
UPDATE team SET name = ?, password = ?, avatar = ?, country = ?, affiliation = ?, website = ? WHERE id = ?
`
	_, err := s.db.Exec(ctx, query, team.Name, team.Password, team.AvatarPath, team.Country, team.Affiliation, team.Website, team.ID)
	return err
}

// TODO: other model
func (s *TeamInternal) UpdateAvatar(ctx context.Context, team TeamXXX, avatarPayload []byte) error {
	query := `
INSERT INTO team_avatar (id, team_id, avatar_path, avatar) VALUES (NULL, ?, ?, ?) 
ON DUPLICATE KEY 
UPDATE avatar_path=VALUES(avatar_path), avatar=VALUES(avatar)
`
	_, err := s.db.Exec(ctx, query, team.ID, team.AvatarPath, avatarPayload)
	return err
}

func (s *TeamInternal) GetAvatar(ctx context.Context, avatarPath string) ([]byte, error) {
	query := `
SELECT avatar FROM team_avatar WHERE avatar_path = ?
`
	var out []byte
	err := s.db.QueryRow(ctx, query, avatarPath).Scan(&out)
	if err != nil {
		return nil, err
	}
	return out, nil
}
