export class ImageCache {
  private preview = new Map<string, string>(); // key -> blob URL
  private publicUrls = new Map<string, string>(); // key -> public URL (optionally cache-busted)

  key(templateId: string, side: 'front' | 'back') {
    return `${templateId}:${side}`;
  }

  setPreview(key: string, blobUrl: string) {
    const old = this.preview.get(key);
    if (old && old.startsWith('blob:') && old !== blobUrl) URL.revokeObjectURL(old);
    this.preview.set(key, blobUrl);
  }

  setPublic(key: string, url: string) {
    this.publicUrls.set(key, url);
    const old = this.preview.get(key);
    if (old && old.startsWith('blob:')) URL.revokeObjectURL(old);
  }

  resolve(key: string): string | null {
    return this.publicUrls.get(key) ?? this.preview.get(key) ?? null;
  }

  clear() {
    for (const url of this.preview.values()) {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    }
    this.preview.clear();
    this.publicUrls.clear();
  }
}

// Optional singleton for convenience
export const imageCache = new ImageCache();

