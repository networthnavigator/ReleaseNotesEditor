import type { NoteType } from '../value-objects/note-type.vo';

/** Entity: a single release note (identity = id). Body is Markdown (note_md). */
export interface ReleaseNoteEntity {
  id: string;
  type: NoteType;
  title: string;
  /** Markdown content. Legacy JSON may have "content"; load maps that to note_md. */
  note_md: string;
  images?: string[];
}
