import {
  Component,
  input,
  model,
  output,
  viewChild,
  inject,
  ElementRef,
  AfterViewInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { ImageStoreService } from '../../services/image-store.service';

@Component({
  selector: 'app-markdown-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  template: `
    <div class="md-editor">
      <div class="md-toolbar">
        <button type="button" mat-icon-button (click)="wrapSelection('**', '**')" matTooltip="Bold">
          <span class="material-symbols-outlined">format_bold</span>
        </button>
        <button type="button" mat-icon-button (click)="wrapSelection('_', '_')" matTooltip="Italic">
          <span class="material-symbols-outlined">format_italic</span>
        </button>
        <button type="button" mat-icon-button (click)="insertLine('### ')" matTooltip="Heading">
          <span class="material-symbols-outlined">title</span>
        </button>
        <button type="button" mat-icon-button (click)="insertLine('- ')" matTooltip="Bullet list">
          <span class="material-symbols-outlined">format_list_bulleted</span>
        </button>
        <button type="button" mat-icon-button (click)="insertLine('1. ')" matTooltip="Numbered list">
          <span class="material-symbols-outlined">format_list_numbered</span>
        </button>
        <button type="button" mat-icon-button (click)="wrapSelection('[', '](url)')" matTooltip="Link">
          <span class="material-symbols-outlined">link</span>
        </button>
        <button type="button" mat-icon-button (click)="insertCodeBlock()" matTooltip="Code block">
          <span class="material-symbols-outlined">code</span>
        </button>
        <button type="button" mat-icon-button (click)="showEmojiPicker.set(!showEmojiPicker())" matTooltip="Insert emoji">
          <span class="md-emoji-btn">😀</span>
        </button>
      </div>
      @if (showEmojiPicker()) {
        <div class="md-emoji-picker">
          <div class="md-emoji-grid">
            @for (emoji of emojis; track emoji) {
              <button type="button" class="md-emoji-cell" (click)="insertEmoji(emoji)" [attr.aria-label]="'Insert ' + emoji">{{ emoji }}</button>
            }
          </div>
        </div>
      }
      <div class="md-panels">
        <div class="md-panel md-edit">
          <textarea
            #textarea
            class="md-textarea"
            [(ngModel)]="noteMd"
            (ngModelChange)="onContentChange()"
            (paste)="onPaste($event)"
            placeholder="Write markdown here…"
            rows="12"
          ></textarea>
        </div>
        <div class="md-panel md-preview">
          <div class="md-preview-inner rn-markdown" [innerHTML]="previewHtml()"></div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .md-editor { display: flex; flex-direction: column; min-height: 280px; }
      .md-toolbar { display: flex; flex-wrap: wrap; gap: 2px; padding: 4px 0; border-bottom: 1px solid rgba(0,0,0,0.12); margin-bottom: 8px; }
      .md-panels { display: flex; gap: 16px; flex: 1; min-height: 0; }
      .md-panel { flex: 1; min-width: 0; display: flex; flex-direction: column; }
      .md-textarea { width: 100%; height: 100%; min-height: 240px; padding: 12px; border: 1px solid rgba(0,0,0,0.2); border-radius: 8px; font-family: inherit; font-size: 0.95rem; line-height: 1.5; resize: vertical; box-sizing: border-box; }
      .md-textarea:focus { outline: none; border-color: var(--mat-sys-primary, #1976d2); }
      .md-preview { border: 1px solid rgba(0,0,0,0.12); border-radius: 8px; padding: 12px; overflow-y: auto; background: rgba(0,0,0,0.02); }
      .md-preview-inner { font-size: 0.9rem; line-height: 1.5; color: rgba(0,0,0,0.87); }
      .md-preview-inner.rn-markdown :deep(h1) { font-size: 1.1rem; margin: 0.5em 0 0.25em; font-weight: 600; }
      .md-preview-inner.rn-markdown :deep(h2) { font-size: 1.05rem; margin: 0.5em 0 0.25em; font-weight: 600; }
      .md-preview-inner.rn-markdown :deep(h3) { font-size: 1rem; margin: 0.4em 0 0.2em; font-weight: 600; }
      .md-preview-inner.rn-markdown :deep(p) { margin: 0.4em 0; }
      .md-preview-inner.rn-markdown :deep(ul), .md-preview-inner.rn-markdown :deep(ol) { margin: 0.4em 0; padding-left: 1.5em; }
      .md-preview-inner.rn-markdown :deep(code) { background: rgba(0,0,0,0.08); padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.9em; }
      .md-preview-inner.rn-markdown :deep(pre) { background: rgba(0,0,0,0.08); padding: 12px; border-radius: 6px; overflow-x: auto; margin: 0.5em 0; }
      .md-preview-inner.rn-markdown :deep(pre code) { background: none; padding: 0; }
      .md-preview-inner.rn-markdown :deep(a) { color: #1565c0; }
      .md-preview-inner.rn-markdown :deep(img) { max-width: 100%; height: auto; border-radius: 6px; }
      .md-emoji-btn { font-size: 1.2rem; line-height: 1; }
      .md-emoji-picker { padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.08); margin-bottom: 4px; max-height: 160px; overflow-y: auto; }
      .md-emoji-grid { display: flex; flex-wrap: wrap; gap: 4px; }
      .md-emoji-cell { width: 36px; height: 36px; padding: 0; border: none; border-radius: 6px; background: transparent; font-size: 1.4rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }
      .md-emoji-cell:hover { background: rgba(0,0,0,0.08); }
      @media (max-width: 600px) { .md-panels { flex-direction: column; } }
    `,
  ],
})
export class MarkdownEditorComponent implements AfterViewInit {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly imageStore = inject(ImageStoreService);

  noteMd = model.required<string>();
  readonly contentChange = output<void>();
  showEmojiPicker = signal(false);

  textareaRef = viewChild<ElementRef<HTMLTextAreaElement>>('textarea');

  readonly emojis = [
    '😀','😊','🎉','👍','❤️','🔥','⭐','✨','💡','📌','✅','❌','⚠️','📝','🔬','💻','📺','🏠','🚀','💒','🐱','🎵','📢','🗣️','🍷','🏆','📜','🎊','💬','🙏',
  ];

  private lastPreview = '';
  private cachedHtml: SafeHtml = this.sanitizer.bypassSecurityTrustHtml('');

  previewHtml(): SafeHtml {
    const md = this.noteMd() ?? '';
    if (md === this.lastPreview) return this.cachedHtml;
    this.lastPreview = md;
    const html = marked.parse(md, { async: false });
    const str = typeof html === 'string' ? html : '';
    const withUrls = this.resolveImageUrls(str);
    this.cachedHtml = this.sanitizer.bypassSecurityTrustHtml(withUrls);
    return this.cachedHtml;
  }

  private resolveImageUrls(html: string): string {
    return html.replace(/<img([^>]+)src="([^"]+)"/g, (_, rest, src) => {
      const blobUrl = this.imageStore.getUrl(src.trim());
      if (blobUrl) return `<img${rest}src="${blobUrl}"`;
      return `<img${rest}src="${src}"`;
    });
  }

  onContentChange(): void {
    this.contentChange.emit();
  }

  ngAfterViewInit(): void {
    // ensure preview updates when model changes from outside
  }

  onPaste(event: ClipboardEvent): void {
    const item = event.clipboardData?.items?.[0];
    if (item?.kind === 'file' && item.type.startsWith('image/')) {
      event.preventDefault();
      const file = item.getAsFile();
      if (!file) return;
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : 'png';
      const id = this.shortId();
      const path = `images/${id}.${safeExt}`;
      this.imageStore.set(path, file);
      const markdown = `![image](${path})`;
      this.insertAtCursor(markdown);
      this.noteMd.update((v) => v ?? '');
      this.lastPreview = '';
    }
  }

  private shortId(): string {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  private insertAtCursor(text: string): void {
    const el = this.textareaRef()?.nativeElement;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const val = this.noteMd() ?? '';
    const newVal = val.slice(0, start) + text + val.slice(end);
    this.noteMd.set(newVal);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  }

  wrapSelection(before: string, after: string): void {
    const el = this.textareaRef()?.nativeElement;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const val = this.noteMd() ?? '';
    const selected = val.slice(start, end) || 'text';
    const newVal = val.slice(0, start) + before + selected + after + val.slice(end);
    this.noteMd.set(newVal);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  }

  insertLine(prefix: string): void {
    const el = this.textareaRef()?.nativeElement;
    if (!el) return;
    const start = el.selectionStart;
    const val = this.noteMd() ?? '';
    const lineStart = val.lastIndexOf('\n', start - 1) + 1;
    const newVal = val.slice(0, lineStart) + prefix + val.slice(lineStart);
    this.noteMd.set(newVal);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  }

  insertBlock(before: string, after: string): void {
    const el = this.textareaRef()?.nativeElement;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const val = this.noteMd() ?? '';
    const newVal = val.slice(0, start) + before + val.slice(start, end) + after + val.slice(end);
    this.noteMd.set(newVal);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  }

  insertCodeBlock(): void {
    this.insertBlock('```\n', '\n```');
  }

  insertEmoji(emoji: string): void {
    this.insertAtCursor(emoji);
    this.showEmojiPicker.set(false);
  }
}
