import { Injectable, signal, computed } from '@angular/core';
import type { ReleaseNotesRepositoryPort } from '../../application/ports/release-notes-repository.port';
import type { ReleaseEntity } from '../../domain/entities/release.entity';
import type { ReleaseNoteEntity } from '../../domain/entities/release-note.entity';
import type { NoteType } from '../../domain/value-objects/note-type.vo';
import type { ReleaseNotesAggregate } from '../../domain/aggregates/release-notes.aggregate';
import { generateNoteId } from '../../domain/services/note-identity.domain-service';
import { isDraftRelease } from '../../domain/entities/release.entity';
import { compareVersions } from '../../domain/value-objects/version.vo';

/**
 * Infrastructure adapter: in-memory repository for release notes.
 * Implements the repository port (persistence abstraction).
 * Exposes releases sorted: draft (Next Release) first, then by newest first (version desc, date desc).
 */
@Injectable({ providedIn: 'root' })
export class InMemoryReleaseNotesRepository implements ReleaseNotesRepositoryPort {
  private readonly data = signal<ReleaseNotesAggregate>({ releases: [] });

  private readonly releasesSignal = computed(() => this.getSortedReleases(this.data().releases));

  /** Sorted: draft first, then newest first. UI indices refer to this order. */
  private getSortedReleases(releases: ReleaseEntity[]): ReleaseEntity[] {
    const drafts = releases.filter(isDraftRelease);
    const released = releases.filter((r) => !isDraftRelease(r));
    released.sort((a, b) => {
      const v = compareVersions(b.version ?? '', a.version ?? '');
      if (v !== 0) return v;
      return (b.date ?? '').localeCompare(a.date ?? '');
    });
    return [...drafts, ...released];
  }

  /** Map display index (sorted) to storage index (raw) for updates/deletes. */
  private getStorageIndex(displayIndex: number): number {
    const raw = this.data().releases;
    const sorted = this.getSortedReleases(raw);
    const release = sorted[displayIndex];
    return raw.indexOf(release);
  }

  getReleases(): ReturnType<ReleaseNotesRepositoryPort['getReleases']> {
    return this.releasesSignal;
  }

  loadFromJson(json: string): void {
    try {
      const parsed = JSON.parse(json) as ReleaseNotesAggregate;
      if (!parsed.releases) parsed.releases = [];
      this.data.set(this.normalizeLoadedAggregate(parsed));
    } catch {
      this.data.set({ releases: [] });
    }
  }

  /** Map legacy "content" to note_md and ensure each note has note_md. */
  private normalizeLoadedAggregate(aggregate: ReleaseNotesAggregate): ReleaseNotesAggregate {
    type LoadedNote = { id?: string; type?: string; title?: string; note_md?: string; content?: string; images?: string[] };
    const rawReleases = aggregate.releases ?? [];
    return {
      releases: rawReleases.map((r) => {
        const rawNotes: LoadedNote[] = r.notes ?? [];
        return {
          version: r.version,
          date: r.date,
          notes: rawNotes.map((n) => ({
            id: n.id ?? '',
            type: (n.type ?? 'NEW') as ReleaseNoteEntity['type'],
            title: n.title ?? '',
            note_md: n.note_md ?? n.content ?? '',
            images: n.images,
          })),
        };
      }),
    };
  }

  ensureNextRelease(): ReleaseEntity {
    const releases = this.data().releases;
    const next = releases.find((r) => !r.version && !r.date);
    if (next) return next;
    const newRelease: ReleaseEntity = { version: null, date: null, notes: [] };
    this.data.update((d) => ({ releases: [...d.releases, newRelease] }));
    return newRelease;
  }

  addRelease(version: string | null, date: string | null): ReleaseEntity {
    const newRelease: ReleaseEntity = { version, date, notes: [] };
    this.data.update((d) => ({ releases: [...d.releases, newRelease] }));
    return newRelease;
  }

  updateRelease(displayIndex: number, version: string | null, date: string | null): void {
    const index = this.getStorageIndex(displayIndex);
    this.data.update((d) => ({
      releases: d.releases.map((r, i) =>
        i === index ? { ...r, version, date } : r
      ),
    }));
  }

  deleteRelease(displayIndex: number): void {
    const index = this.getStorageIndex(displayIndex);
    this.data.update((d) => ({
      releases: d.releases.filter((_, i) => i !== index),
    }));
  }

  addNote(
    displayReleaseIndex: number,
    type: NoteType,
    title: string,
    note_md: string
  ): void {
    const releaseIndex = this.getStorageIndex(displayReleaseIndex);
    const note: ReleaseNoteEntity = {
      id: generateNoteId(),
      type,
      title,
      note_md,
    };
    this.data.update((d) => ({
      releases: d.releases.map((r, i) =>
        i === releaseIndex ? { ...r, notes: [...r.notes, note] } : r
      ),
    }));
  }

  updateNote(
    displayReleaseIndex: number,
    noteIndex: number,
    type: NoteType,
    title: string,
    note_md: string
  ): void {
    const releaseIndex = this.getStorageIndex(displayReleaseIndex);
    this.data.update((d) => ({
      releases: d.releases.map((r, ri) => {
        if (ri !== releaseIndex) return r;
        return {
          ...r,
          notes: r.notes.map((n, ni) =>
            ni === noteIndex ? { ...n, type, title, note_md } : n
          ),
        };
      }),
    }));
  }

  deleteNote(displayReleaseIndex: number, noteIndex: number): void {
    const releaseIndex = this.getStorageIndex(displayReleaseIndex);
    this.data.update((d) => ({
      releases: d.releases.map((r, i) => {
        if (i !== releaseIndex) return r;
        return { ...r, notes: r.notes.filter((_, ni) => ni !== noteIndex) };
      }),
    }));
  }

  exportJson(): string {
    const data = this.data();
    const out = {
      releases: data.releases.map((r) => ({
        version: r.version,
        date: r.date,
        notes: r.notes.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          note_md: n.note_md,
          ...(n.images?.length ? { images: n.images } : {}),
        })),
      })),
    };
    return JSON.stringify(out, null, 2);
  }
}
