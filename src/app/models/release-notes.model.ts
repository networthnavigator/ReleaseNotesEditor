/**
 * Re-exports domain types for backward compatibility.
 * Prefer importing from domain/ when adding new code.
 */
export type { NoteType } from '../domain/value-objects/note-type.vo';
export type { ReleaseEntity as Release } from '../domain/entities/release.entity';
export type { ReleaseNoteEntity as ReleaseNote, ReleaseNoteEntity } from '../domain/entities/release-note.entity';
export type { ReleaseNotesAggregate as ReleaseNotesData } from '../domain/aggregates/release-notes.aggregate';
