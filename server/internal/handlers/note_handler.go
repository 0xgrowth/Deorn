package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"nare/server/internal/models"
	"nare/server/internal/repository"
	"nare/server/internal/services"
)

type NoteHandler struct {
	service *services.NoteService
}

func NewNoteHandler(service *services.NoteService) *NoteHandler {
	return &NoteHandler{service: service}
}

func (h *NoteHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	setCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	switch {
	case r.URL.Path == "/notes" && r.Method == http.MethodGet:
		h.ListNotes(w, r)
	case r.URL.Path == "/notes" && r.Method == http.MethodPost:
		h.CreateNote(w, r)
	case r.URL.Path == "/notes/stream" && r.Method == http.MethodGet:
		h.StreamNotes(w, r)
	case strings.HasPrefix(r.URL.Path, "/notes/"):
		id := strings.TrimPrefix(r.URL.Path, "/notes/")
		if id == "" || strings.Contains(id, "/") {
			h.notFound(w)
			return
		}
		switch r.Method {
		case http.MethodGet:
			h.GetNote(w, r, id)
		case http.MethodPut:
			h.UpdateNote(w, r, id)
		case http.MethodDelete:
			h.DeleteNote(w, r, id)
		default:
			h.notFound(w)
		}
	default:
		h.notFound(w)
	}
}

func (h *NoteHandler) ListNotes(w http.ResponseWriter, r *http.Request) {
	notes, err := h.service.ListNotes(r.Context())
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	h.writeJSON(w, http.StatusOK, notes)
}

func (h *NoteHandler) GetNote(w http.ResponseWriter, r *http.Request, id string) {
	note, err := h.service.GetNote(r.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			h.writeError(w, http.StatusNotFound, "note not found")
			return
		}
		h.writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	h.writeJSON(w, http.StatusOK, note)
}

func (h *NoteHandler) CreateNote(w http.ResponseWriter, r *http.Request) {
	var payload models.CreateNoteRequest
	if err := decodeJSON(r, &payload); err != nil {
		h.writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	note, err := h.service.CreateNote(r.Context(), payload)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	h.writeJSON(w, http.StatusCreated, note)
}

func (h *NoteHandler) UpdateNote(w http.ResponseWriter, r *http.Request, id string) {
	var payload models.UpdateNoteRequest
	if err := decodeJSON(r, &payload); err != nil {
		h.writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	note, err := h.service.UpdateNote(r.Context(), id, payload)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			h.writeError(w, http.StatusNotFound, "note not found")
			return
		}
		h.writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	h.writeJSON(w, http.StatusOK, note)
}

func (h *NoteHandler) DeleteNote(w http.ResponseWriter, r *http.Request, id string) {
	_, err := h.service.DeleteNote(r.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			h.writeError(w, http.StatusNotFound, "note not found")
			return
		}
		h.writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *NoteHandler) StreamNotes(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		h.writeError(w, http.StatusInternalServerError, "streaming unsupported")
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	client := h.service.Subscribe()
	defer h.service.Unsubscribe(client)

	fmt.Fprintf(w, "retry: 1000\n\n")
	flusher.Flush()

	for {
		select {
		case event := <-client:
			payload, err := json.Marshal(event)
			if err != nil {
				continue
			}
			fmt.Fprintf(w, "data: %s\n\n", payload)
			flusher.Flush()
		case <-r.Context().Done():
			return
		}
	}
}

func decodeJSON(r *http.Request, target any) error {
	defer r.Body.Close()
	if r.Body == nil {
		return errors.New("missing request body")
	}
	return json.NewDecoder(r.Body).Decode(target)
}

func (h *NoteHandler) writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func (h *NoteHandler) writeError(w http.ResponseWriter, status int, message string) {
	h.writeJSON(w, status, map[string]string{"error": message})
}

func (h *NoteHandler) notFound(w http.ResponseWriter) {
	h.writeError(w, http.StatusNotFound, "route not found")
}

func setCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}
