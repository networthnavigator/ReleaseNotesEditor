import { type Signal, InjectionToken } from '@angular/core';
import type { ReleaseEntity } from '../../domain/entities/release.entity';
import type { NoteType } from '../../domain/value-objects/note-type.vo';

/**
 * Port (interface): persistence and CRUD for release notes.
 * Infrastructure implements this (e.g. in-memory, later file or API).
 */
export interface ReleaseNotesRepositoryPort {
  getReleases(): Signal<ReleaseEntity[]>;

  loadFromJson(json: string): void;

  ensureNextRelease(): ReleaseEntity;

  addRelease(version: string | null, date: string | null): ReleaseEntity;

  updateRelease(index: number, version: string | null, date: string | null): void;

  deleteRelease(index: number): void;

  addNote(
    releaseIndex: number,
    type: NoteType,
    title: string,
    note_md: string
  ): void;

  updateNote(
    releaseIndex: number,
    noteIndex: number,
    type: NoteType,
    title: string,
    note_md: string
  ): void;

  deleteNote(releaseIndex: number, noteIndex: number): void;

  exportJson(): string;
}

/** Injection token for the repository port (Clean Architecture: depend on abstraction). */
export const RELEASE_NOTES_REPOSITORY = new InjectionToken<ReleaseNotesRepositoryPort>(
  'ReleaseNotesRepositoryPort'
);
