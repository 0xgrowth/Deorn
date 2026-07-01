package services

import (
	"context"
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"

	"nare/server/internal/models"
	"nare/server/internal/repository"
)

type BroadcastHub struct {
	clients map[chan models.NoteEvent]struct{}
	register chan chan models.NoteEvent
	unregister chan chan models.NoteEvent
	broadcast chan models.NoteEvent
	mu sync.RWMutex
}

func NewBroadcastHub() *BroadcastHub {
	return &BroadcastHub{
		clients: make(map[chan models.NoteEvent]struct{}),
		register: make(chan chan models.NoteEvent),
		unregister: make(chan chan models.NoteEvent),
		broadcast: make(chan models.NoteEvent),
	}
}

func (h *BroadcastHub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = struct{}{}
			h.mu.Unlock()
		case client := <-h.unregister:
			h.mu.Lock()
			delete(h.clients, client)
			h.mu.Unlock()
		case event := <-h.broadcast:
			h.mu.RLock()
			clients := make([]chan models.NoteEvent, 0, len(h.clients))
			for client := range h.clients {
				clients = append(clients, client)
			}
			h.mu.RUnlock()
			for _, client := range clients {
				select {
				case client <- event:
				default:
				}
			}
		}
	}
}

func (h *BroadcastHub) Register(client chan models.NoteEvent) {
	h.register <- client
}

func (h *BroadcastHub) Unregister(client chan models.NoteEvent) {
	h.unregister <- client
}

func (h *BroadcastHub) Broadcast(event models.NoteEvent) {
	h.broadcast <- event
}

type NoteService struct {
	repository *repository.NoteRepository
	broadcast  *BroadcastHub
}

func NewNoteService(repo *repository.NoteRepository, broadcast *BroadcastHub) *NoteService {
	return &NoteService{repository: repo, broadcast: broadcast}
}

func (s *NoteService) ListNotes(ctx context.Context) ([]models.Note, error) {
	return s.repository.List(ctx)
}

func (s *NoteService) GetNote(ctx context.Context, id string) (models.Note, error) {
	return s.repository.GetByID(ctx, id)
}

func (s *NoteService) CreateNote(ctx context.Context, input models.CreateNoteRequest) (models.Note, error) {
	now := time.Now().UTC()
	note := models.Note{
		ID:        uuid.NewString(),
		Title:     input.Title,
		Content:   input.Content,
		CreatedAt: now,
		UpdatedAt: now,
	}
	if err := s.repository.Create(ctx, note); err != nil {
		return models.Note{}, err
	}

	s.broadcast.Broadcast(models.NoteEvent{Type: "created", Note: note})
	return note, nil
}

func (s *NoteService) UpdateNote(ctx context.Context, id string, input models.UpdateNoteRequest) (models.Note, error) {
	current, err := s.repository.GetByID(ctx, id)
	if err != nil {
		return models.Note{}, err
	}

	current.Title = input.Title
	current.Content = input.Content
	current.UpdatedAt = time.Now().UTC()
	if err := s.repository.Update(ctx, current); err != nil {
		return models.Note{}, err
	}

	s.broadcast.Broadcast(models.NoteEvent{Type: "updated", Note: current})
	return current, nil
}

func (s *NoteService) DeleteNote(ctx context.Context, id string) (models.Note, error) {
	current, err := s.repository.GetByID(ctx, id)
	if err != nil {
		return models.Note{}, err
	}
	if err := s.repository.Delete(ctx, id); err != nil {
		return models.Note{}, err
	}

	s.broadcast.Broadcast(models.NoteEvent{Type: "deleted", ID: id})
	return current, nil
}

func (s *NoteService) Subscribe() chan models.NoteEvent {
	client := make(chan models.NoteEvent, 10)
	s.broadcast.Register(client)
	return client
}

func (s *NoteService) Unsubscribe(client chan models.NoteEvent) {
	s.broadcast.Unregister(client)
	close(client)
}

func (s *NoteService) HandleNotFound(err error) error {
	if errors.Is(err, repository.ErrNotFound) {
		return repository.ErrNotFound
	}
	return err
}
