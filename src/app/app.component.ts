import { Component, inject, signal } from '@angular/core';
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
      <input type="file" accept=".json" #fileInput (change)="onFileSelected($event)" style="display: none" />
      <button mat-raised-button (click)="openPreview()" matTooltip="Open release notes panel as users will see it">
        <span class="material-symbols-outlined">visibility</span>
        Open panel
      </button>
      <button mat-button (click)="loadSample()" matTooltip="Load Big Bang Theory sample data">
        <span class="material-symbols-outlined">science</span>
        Load sample
      </button>
      <button mat-button (click)="fileInput.click()">
        <span class="material-symbols-outlined">upload_file</span>
        Load JSON
      </button>
      <button mat-button (click)="exportJson()" matTooltip="Export release-notes.json only">
        <span class="material-symbols-outlined">download</span>
        Export JSON
      </button>
      <button mat-button (click)="exportFolder()" matTooltip="Export as ZIP: release-notes.json + images/">
        <span class="material-symbols-outlined">folder_zip</span>
        Export folder
      </button>
      <button mat-raised-button (click)="openAddRelease()">
        <span class="material-symbols-outlined">add</span>
        Add release
      </button>
    </mat-toolbar>

    <main class="content">
      <p class="hint">Use "Next release" to collect notes before a version exists. When you release, edit that release and set version and date.</p>

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
              <button mat-icon-button (click)="openEditRelease(i)" matTooltip="Edit release">
                <span class="material-symbols-outlined">edit</span>
              </button>
              @if (release.version || release.date) {
                <button mat-icon-button (click)="deleteRelease(i)" matTooltip="Delete release">
                  <span class="material-symbols-outlined">delete</span>
                </button>
              }
            </mat-card-actions>
          </mat-card-header>
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
            <p>No releases yet. Click "Add release" to create one, or create a "Next release" by adding a release without version and date (you can set them when you publish).</p>
            <button mat-raised-button color="primary" (click)="ensureNextRelease()">
              Create Next release
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
      .content { padding: 24px; max-width: 800px; margin: 0 auto; }
      .hint { margin: 0 0 24px; color: rgba(0,0,0,0.6); font-size: 0.9rem; }
      .release-card { margin-bottom: 16px; }
      .release-card mat-card-header { display: flex; align-items: center; justify-content: space-between; }
      .release-card mat-card-title { display: flex; align-items: center; gap: 8px; font-size: 1.1rem; }
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
export class AppComponent {
  readonly dataService = inject(ReleaseNotesFacade);
  readonly releases = this.dataService.getReleases();
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly releaseNotesPanel = inject(ReleaseNotesPanelService);
  private readonly imageStore = inject(ImageStoreService);

  openPreview(): void {
    this.releaseNotesPanel.setCurrentVersion('3.0.0');
    const json = this.dataService.exportJson();
    this.releaseNotesPanel.loadFromJson(json);
    this.releaseNotesPanel.open();
  }

  releaseHeader(release: ReleaseEntity): string {
    if (release.version && release.date) return `${release.version} — ${release.date}`;
    if (release.version) return release.version;
    if (release.date) return release.date;
    return 'Next release';
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
        this.snackBar.open('Loaded sample release notes (The Big Bang Theory)', undefined, { duration: 3000 });
      })
      .catch(() => this.snackBar.open('Failed to load sample', undefined, { duration: 3000 }));
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      this.dataService.loadFromJson(text);
      this.snackBar.open('Loaded ' + file.name, undefined, { duration: 2000 });
    }).catch(() => this.snackBar.open('Failed to read file', undefined, { duration: 3000 }));
    input.value = '';
  }

  exportJson(): void {
    const json = this.dataService.exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'release-notes.json';
    a.click();
    URL.revokeObjectURL(a.href);
    this.snackBar.open('Exported release-notes.json', undefined, { duration: 2000 });
  }

  async exportFolder(): Promise<void> {
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
    this.snackBar.open('Exported release-notes.zip (JSON + images)', undefined, { duration: 2500 });
  }

  ensureNextRelease(): void {
    this.dataService.ensureNextRelease();
  }

  openAddRelease(): void {
    const ref = this.dialog.open(ReleaseFormDialogComponent, {
      data: { version: null, date: null },
      width: '400px',
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.dataService.addRelease(result.version, result.date);
    });
  }

  openEditRelease(index: number): void {
    const release = this.releases()[index];
    const ref = this.dialog.open(ReleaseFormDialogComponent, {
      data: { version: release.version, date: release.date },
      width: '400px',
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.dataService.updateRelease(index, result.version, result.date);
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
