export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_IMAGE_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export type ImageValidationResult = {
  valid: boolean;
  error?: string;
  sanitizedName?: string;
};

export function sanitizeFilename(name: string): string {
  // Remove path separators and disallow control characters
  const base = name.split(/[/\\]/).pop() || 'upload';
  return base.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function validateImageUpload(file: File): ImageValidationResult {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as any)) {
    return { valid: false, error: 'Invalid file type' };
  }

  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    return { valid: false, error: 'File too large' };
  }

  const sanitizedName = sanitizeFilename(file.name);
  return { valid: true, sanitizedName };
}

