package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"nare/server/internal/models"
)

type NoteRepository struct {
	db *pgxpool.Pool
}

func NewNoteRepository(db *pgxpool.Pool) *NoteRepository {
	return &NoteRepository{db: db}
}

func (r *NoteRepository) List(ctx context.Context) ([]models.Note, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, title, content, created_at, updated_at
		FROM notes
		ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("list notes: %w", err)
	}
	defer rows.Close()

	var notes []models.Note
	for rows.Next() {
		var note models.Note
		if err := rows.Scan(&note.ID, &note.Title, &note.Content, &note.CreatedAt, &note.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan note: %w", err)
		}
		notes = append(notes, note)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate notes: %w", err)
	}

	return notes, nil
}

func (r *NoteRepository) GetByID(ctx context.Context, id string) (models.Note, error) {
	var note models.Note
	err := r.db.QueryRow(ctx, `
		SELECT id, title, content, created_at, updated_at
		FROM notes
		WHERE id = $1
	`, id).Scan(&note.ID, &note.Title, &note.Content, &note.CreatedAt, &note.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return models.Note{}, ErrNotFound
		}
		return models.Note{}, fmt.Errorf("get note: %w", err)
	}

	return note, nil
}

func (r *NoteRepository) Create(ctx context.Context, note models.Note) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO notes (id, title, content, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
	`, note.ID, note.Title, note.Content, note.CreatedAt, note.UpdatedAt)
	if err != nil {
		return fmt.Errorf("create note: %w", err)
	}
	return nil
}

func (r *NoteRepository) Update(ctx context.Context, note models.Note) error {
	_, err := r.db.Exec(ctx, `
		UPDATE notes
		SET title = $2, content = $3, updated_at = $4
		WHERE id = $1
	`, note.ID, note.Title, note.Content, note.UpdatedAt)
	if err != nil {
		return fmt.Errorf("update note: %w", err)
	}
	return nil
}

func (r *NoteRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM notes WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete note: %w", err)
	}
	return nil
}

var ErrNotFound = errors.New("note not found")
