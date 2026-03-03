import { Injectable, inject } from '@angular/core';
import type { ReleaseEntity } from '../../domain/entities/release.entity';
import {
  type ReleaseNotesRepositoryPort,
  RELEASE_NOTES_REPOSITORY,
} from '../ports/release-notes-repository.port';

/**
 * Application facade: exposes use cases for the presentation layer.
 * Depends only on the repository port (inversion of dependency).
 */
@Injectable({ providedIn: 'root' })
export class ReleaseNotesFacade {
  private readonly repo = inject(RELEASE_NOTES_REPOSITORY);

  getReleases(): ReturnType<ReleaseNotesRepositoryPort['getReleases']> {
    return this.repo.getReleases();
  }

  loadFromJson(json: string): void {
    this.repo.loadFromJson(json);
  }

  ensureNextRelease(): ReleaseEntity {
    return this.repo.ensureNextRelease();
  }

  createReleaseFromDraft(
    version: string,
    date: string,
    description: string | null,
    noteIds: string[]
  ): void {
    this.repo.createReleaseFromDraft(version, date, description, noteIds);
  }

  updateRelease(
    index: number,
    version: string | null,
    date: string | null,
    description: string | null
  ): void {
    this.repo.updateRelease(index, version, date, description);
  }

  deleteRelease(index: number): void {
    this.repo.deleteRelease(index);
  }

  addNote(
    releaseIndex: number,
    type: 'NEW' | 'UPDATE' | 'BUG',
    title: string,
    note_md: string
  ): void {
    this.repo.addNote(releaseIndex, type, title, note_md);
  }

  updateNote(
    releaseIndex: number,
    noteIndex: number,
    type: 'NEW' | 'UPDATE' | 'BUG',
    title: string,
    note_md: string
  ): void {
    this.repo.updateNote(releaseIndex, noteIndex, type, title, note_md);
  }

  deleteNote(releaseIndex: number, noteIndex: number): void {
    this.repo.deleteNote(releaseIndex, noteIndex);
  }

  exportJson(): string {
    return this.repo.exportJson();
  }
}
