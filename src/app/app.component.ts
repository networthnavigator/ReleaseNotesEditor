import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ReleaseNotesFacade } from './application/use-cases/release-notes.facade';
import type { ReleaseEntity } from './domain/entities/release.entity';
import { ReleaseFormDialogComponent } from './dialogs/release-form-dialog.component';
import { CreateReleaseDialogComponent } from './dialogs/create-release-dialog.component';
import { NoteFormDialogComponent } from './dialogs/note-form-dialog.component';
import { ReleaseNotesPanelComponent, ReleaseNotesPanelService } from 'release-notes-panel';
import { ImageStoreService } from './services/image-store.service';
import JSZip from 'jszip';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    MatSnackBarModule,
    ReleaseNotesPanelComponent,
  ],
  template: `
    <mat-toolbar color="primary">
      <span>Release Notes Editor</span>
      <span class="spacer"></span>
      <button mat-raised-button (click)="openPreview()" matTooltip="Open release notes panel as users will see it">
        <span class="material-symbols-outlined">visibility</span>
        View release notes
      </button>
      <button mat-button (click)="loadSample()" matTooltip="Load Lost (TV show) sample data">
        <span class="material-symbols-outlined">tv</span>
        Load sample
      </button>
      <button mat-button (click)="downloadReleaseNotes()" matTooltip="Download a package with the JSON (text) and all images">
        <span class="material-symbols-outlined">folder_zip</span>
        Download release notes
      </button>
      <button mat-raised-button (click)="openCreateRelease()" matTooltip="Create a new release from draft notes">
        <span class="material-symbols-outlined">add</span>
        Create release
      </button>
    </mat-toolbar>

    <main class="content">
      <p class="hint">Add notes to <strong>Draft release</strong>. When ready, use <strong>Create release</strong> to define version and date and choose which notes go into the release.</p>

      @for (release of releases(); track releaseTrackBy($index, release); let i = $index) {
        <mat-card class="release-card">
          <mat-card-header>
            <mat-card-title>
              {{ releaseHeader(release) }}
              @if (!release.version && !release.date) {
                <span class="badge-draft">Draft</span>
              }
            </mat-card-title>
            <mat-card-actions>
              @if (release.version || release.date) {
                <button mat-icon-button (click)="openEditRelease(i)" matTooltip="Edit release">
                  <span class="material-symbols-outlined">edit</span>
                </button>
                <button mat-icon-button (click)="deleteRelease(i)" matTooltip="Delete release">
                  <span class="material-symbols-outlined">delete</span>
                </button>
              }
            </mat-card-actions>
          </mat-card-header>
          @if (release.description && (release.version || release.date)) {
            <p class="release-description">{{ release.description }}</p>
          }
          <mat-card-content>
            @if (release.notes.length === 0) {
              <p class="no-notes">No notes yet.</p>
            } @else {
              <ul class="notes-list">
                @for (note of release.notes; track note.id; let ni = $index) {
                  <li class="note-item">
                    <span class="note-chip" [attr.data-type]="note.type">{{ note.type }}</span>
                    <span class="note-title">{{ note.title }}</span>
                    <button mat-icon-button (click)="openEditNote(i, ni)" matTooltip="Edit note">
                      <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button mat-icon-button (click)="deleteNote(i, ni)" matTooltip="Delete note">
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  </li>
                }
              </ul>
            }
            <button mat-stroked-button (click)="openAddNote(i)">
              <span class="material-symbols-outlined">add</span>
              Add note
            </button>
          </mat-card-content>
        </mat-card>
      }

      @if (releases().length === 0) {
        <mat-card class="empty-card">
          <mat-card-content>
            <p>No draft yet. Create a Draft release to start adding notes.</p>
            <button mat-raised-button color="primary" (click)="ensureNextRelease()">
              Create Draft release
            </button>
          </mat-card-content>
        </mat-card>
      }
    </main>
    <lib-release-notes-panel />
  `,
  styles: [
    `
      .spacer { flex: 1 1 auto; }
      mat-toolbar {
        position: sticky;
        top: 0;
        z-index: 1000;
        flex-wrap: wrap;
        gap: 4px;
      }
      mat-toolbar button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      mat-toolbar button .material-symbols-outlined {
        font-size: 20px;
        width: 20px;
        height: 20px;
        line-height: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .content { padding: 24px; max-width: 800px; margin: 0 auto; }
      .hint { margin: 0 0 24px; color: rgba(0,0,0,0.6); font-size: 0.9rem; }
      .release-card { margin-bottom: 16px; }
      .release-card mat-card-header { display: flex; align-items: center; justify-content: space-between; }
      .release-card mat-card-title { display: flex; align-items: center; gap: 8px; font-size: 1.1rem; }
      .release-description { margin: 0 16px 12px; padding: 0; font-size: 0.95rem; color: rgba(0,0,0,0.7); line-height: 1.5; }
      .badge-draft { font-size: 0.75rem; background: #ff9800; color: #fff; padding: 2px 8px; border-radius: 4px; }
      .release-card mat-card-actions { margin-left: auto; }
      .notes-list { list-style: none; padding: 0; margin: 0 0 16px; }
      .note-item { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.08); }
      .note-chip { font-size: 0.7rem; font-weight: 600; padding: 2px 8px; border-radius: 4px; }
      .note-chip[data-type='NEW'] { background: rgba(25,118,210,0.2); color: #1565c0; }
      .note-chip[data-type='UPDATE'] { background: rgba(255,152,0,0.2); color: #e65100; }
      .note-chip[data-type='BUG'] { background: rgba(211,47,47,0.2); color: #c62828; }
      .note-title { flex: 1; }
      .no-notes { margin: 0 0 12px; color: rgba(0,0,0,0.5); font-size: 0.9rem; }
      .empty-card { text-align: center; padding: 32px; }
      .empty-card p { margin: 0 0 16px; color: rgba(0,0,0,0.6); }
    `,
  ],
})
export class AppComponent implements OnInit {
  readonly dataService = inject(ReleaseNotesFacade);
  readonly releases = this.dataService.getReleases();
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly releaseNotesPanel = inject(ReleaseNotesPanelService);
  private readonly imageStore = inject(ImageStoreService);

  ngOnInit(): void {
    this.dataService.ensureNextRelease();
  }

  openPreview(): void {
    this.releaseNotesPanel.setCurrentVersion('3.0.0');
    this.releaseNotesPanel.setImageUrlResolver((path: string) => this.imageStore.getUrl(path) ?? null);
    const json = this.dataService.exportJson();
    this.releaseNotesPanel.loadFromJson(json);
    this.releaseNotesPanel.open();
  }

  releaseHeader(release: ReleaseEntity): string {
    if (release.version && release.date) return `${release.version} — ${release.date}`;
    if (release.version) return release.version;
    if (release.date) return release.date;
    return 'Draft release';
  }

  releaseTrackBy(_i: number, release: ReleaseEntity): string {
    return release.version ?? release.date ?? 'draft';
  }

  loadSample(): void {
    // Cache-bust so updated seed (e.g. with note_md and formatting) is always fetched
    fetch(`/seed-release-notes.json?t=${Date.now()}`)
      .then((r) => r.text())
      .then((text) => {
        this.dataService.loadFromJson(text);
        this.dataService.ensureNextRelease();
        this.snackBar.open('Loaded sample release notes (Lost)', undefined, { duration: 3000 });
      })
      .catch(() => this.snackBar.open('Failed to load sample', undefined, { duration: 3000 }));
  }

  async downloadReleaseNotes(): Promise<void> {
    const zip = new JSZip();
    const json = this.dataService.exportJson();
    zip.file('release-notes.json', json);
    const imgFolder = zip.folder('images');
    if (imgFolder) {
      for (const path of this.imageStore.getAllPaths()) {
        const name = path.replace(/^images\//, '');
        const blob = this.imageStore.getBlob(path);
        if (blob) imgFolder.file(name, blob);
      }
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'release-notes.zip';
    a.click();
    URL.revokeObjectURL(a.href);
    this.snackBar.open('Downloaded release notes (JSON + images)', undefined, { duration: 2500 });
  }

  ensureNextRelease(): void {
    this.dataService.ensureNextRelease();
  }

  openCreateRelease(): void {
    const releases = this.releases();
    const draft = releases.find((r) => !r.version && !r.date);
    if (!draft) {
      this.dataService.ensureNextRelease();
      this.openCreateRelease();
      return;
    }
    const ref = this.dialog.open(CreateReleaseDialogComponent, {
      data: { draftNotes: [...draft.notes] },
      width: '90vw',
      maxWidth: '900px',
      maxHeight: '90vh',
    });
    ref.afterClosed().subscribe((result) => {
      if (result?.version && result?.date != null && result?.noteIds)
        this.dataService.createReleaseFromDraft(result.version, result.date, result.description ?? null, result.noteIds);
    });
  }

  openEditRelease(index: number): void {
    const release = this.releases()[index];
    const ref = this.dialog.open(ReleaseFormDialogComponent, {
      data: {
        version: release.version,
        date: release.date,
        description: release.description ?? null,
      },
      width: '400px',
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.dataService.updateRelease(index, result.version, result.date, result.description ?? null);
    });
  }

  deleteRelease(index: number): void {
    if (confirm('Delete this release and all its notes?')) this.dataService.deleteRelease(index);
  }

  openAddNote(releaseIndex: number): void {
    const ref = this.dialog.open(NoteFormDialogComponent, {
      data: null,
      width: '92vw',
      maxWidth: '1600px',
      maxHeight: '92vh',
      panelClass: 'note-dialog-large',
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.dataService.addNote(releaseIndex, result.type, result.title, result.note_md);
    });
  }

  openEditNote(releaseIndex: number, noteIndex: number): void {
    const note = this.releases()[releaseIndex].notes[noteIndex];
    const ref = this.dialog.open(NoteFormDialogComponent, {
      data: { type: note.type, title: note.title, note_md: note.note_md },
      width: '92vw',
      maxWidth: '1600px',
      maxHeight: '92vh',
      panelClass: 'note-dialog-large',
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.dataService.updateNote(releaseIndex, noteIndex, result.type, result.title, result.note_md);
    });
  }

  deleteNote(releaseIndex: number, noteIndex: number): void {
    if (confirm('Delete this note?')) this.dataService.deleteNote(releaseIndex, noteIndex);
  }
}
