import { Injectable } from '@angular/core';

/**
 * Holds pasted (and optionally loaded) image blobs by path (e.g. images/guid.png).
 * Used for preview in the editor and for export (ZIP with images folder).
 */
@Injectable({ providedIn: 'root' })
export class ImageStoreService {
  private readonly blobs = new Map<string, Blob>();
  private readonly urls = new Map<string, string>();

  set(path: string, blob: Blob): void {
    this.revoke(path);
    this.blobs.set(path, blob);
    this.urls.set(path, URL.createObjectURL(blob));
  }

  getBlob(path: string): Blob | undefined {
    return this.blobs.get(path);
  }

  getUrl(path: string): string | null {
    return this.urls.get(path) ?? null;
  }

  getAllPaths(): string[] {
    return Array.from(this.blobs.keys());
  }

  has(path: string): boolean {
    return this.blobs.has(path);
  }

  private revoke(path: string): void {
    const url = this.urls.get(path);
    if (url) URL.revokeObjectURL(url);
    this.urls.delete(path);
    this.blobs.delete(path);
  }

  clear(): void {
    this.urls.forEach((url) => URL.revokeObjectURL(url));
    this.urls.clear();
    this.blobs.clear();
  }
}
