import type { ReleaseNoteEntity } from './release-note.entity';

/**
 * Aggregate root: a release with version, date and notes.
 * Identity: (version, date) or "draft" when both null.
 */
export interface ReleaseEntity {
  version: string | null;
  date: string | null;
  notes: ReleaseNoteEntity[];
}

export function isDraftRelease(r: ReleaseEntity): boolean {
  return r.version == null && r.date == null;
}
