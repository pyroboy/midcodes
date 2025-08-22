import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { validateImageUpload, sanitizeFilename } from '$lib/utils/fileValidation';

// Mock Supabase Storage client
const createMockStorageClient = () => ({
	from: vi.fn((bucket: string) => ({
		upload: vi.fn((path: string, file: File) => {
			if (!path.startsWith('org-')) {
				return Promise.resolve({
					data: null,
					error: { message: 'Invalid path - must be organization scoped' }
				});
			}
			if (file.size > 5 * 1024 * 1024) {
				return Promise.resolve({
					data: null,
					error: { message: 'File too large' }
				});
			}
			const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
			if (!ALLOWED_TYPES.includes(file.type)) {
				return Promise.resolve({
					data: null,
					error: { message: 'Invalid file type' }
				});
			}
			return Promise.resolve({
				data: { path: path, id: 'file-123' },
				error: null
			});
		}),
		remove: vi.fn((paths: string[]) => Promise.resolve({
			data: paths.map(path => ({ path })),
			error: null
		})),
		getPublicUrl: vi.fn((path: string) => ({
			data: { publicUrl: `https://storage.supabase.co/${path}` }
		})),
		list: vi.fn(() => Promise.resolve({
			data: [{ name: 'test1.jpg' }, { name: 'test2.png' }],
			error: null
		}))
	}))
});

describe('File Upload & Storage Management', () => {
	let mockStorage: any;

	beforeEach(() => {
		mockStorage = createMockStorageClient();
		vi.clearAllMocks();
	});

	describe('File Validation', () => {
		it('should accept valid image types and sizes', () => {
			const jpegFile = new File(['x'.repeat(1024)], 'test.jpg', { type: 'image/jpeg' });
			const pngFile = new File(['x'.repeat(1024)], 'test.png', { type: 'image/png' });
			const webpFile = new File(['x'.repeat(1024)], 'test.webp', { type: 'image/webp' });

			expect(validateImageUpload(jpegFile).valid).toBe(true);
			expect(validateImageUpload(pngFile).valid).toBe(true);
			expect(validateImageUpload(webpFile).valid).toBe(true);
		});

		it('should reject invalid MIME types', () => {
			const txtFile = new File(['content'], 'file.txt', { type: 'text/plain' });
			const pdfFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });
			const gifFile = new File(['content'], 'test.gif', { type: 'image/gif' });

			const txtResult = validateImageUpload(txtFile);
			expect(txtResult.valid).toBe(false);
			expect(txtResult.error).toBe('Invalid file type');

			const pdfResult = validateImageUpload(pdfFile);
			expect(pdfResult.valid).toBe(false);
			expect(pdfResult.error).toBe('Invalid file type');

			// GIF should also be rejected
			const gifResult = validateImageUpload(gifFile);
			expect(gifResult.valid).toBe(false);
			expect(gifResult.error).toBe('Invalid file type');
		});

		it('should reject files exceeding the size limit', () => {
			const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
			const result = validateImageUpload(largeFile);
			expect(result.valid).toBe(false);
			expect(result.error).toBe('File too large');
		});

		it('should sanitize filenames correctly', () => {
			const complexName = '../../path/to/my  evil file.jpg';
			const sanitized = sanitizeFilename(complexName);
			expect(sanitized).toBe('my__evil_file.jpg');

			const cleanName = 'safe-file_1.png';
			expect(sanitizeFilename(cleanName)).toBe(cleanName);
		});

		it('should validate image dimensions if available', () => {
			const MAX_DIMENSION = 4000;
			const validateImageDimensions = (width: number, height: number): boolean => {
				return width <= MAX_DIMENSION && height <= MAX_DIMENSION;
			};

			expect(validateImageDimensions(1920, 1080)).toBe(true);
			expect(validateImageDimensions(4000, 3000)).toBe(true);
			expect(validateImageDimensions(5000, 3000)).toBe(false);
		});
	});

	describe('Supabase Storage Operations', () => {
		it('should upload file to organization-scoped path', async () => {
			const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
			const orgPath = 'org-123/backgrounds/test.jpg';
			const { data, error } = await mockStorage.from('templates').upload(orgPath, mockFile);

			expect(error).toBeNull();
			expect(data?.path).toBe(orgPath);
		});

		it('should reject upload to non-organization path', async () => {
			const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
			const invalidPath = 'public/test.jpg';
			const { error } = await mockStorage.from('templates').upload(invalidPath, mockFile);

			expect(error).toBeDefined();
			expected(error.message).toContain('Invalid path');
		});

		it('should reject oversized file uploads', async () => {
			const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
			const orgPath = 'org-123/backgrounds/large.jpg';
			const { error } = await mockStorage.from('templates').upload(orgPath, largeFile);

			expect(error).toBeDefined();
			expect(error.message).toBe('File too large');
		});

		it('should generate public URLs correctly', () => {
			const path = 'org-123/backgrounds/test.jpg';
			const { data } = mockStorage.from('templates').getPublicUrl(path);

			expect(data.publicUrl).toBe(`https://storage.supabase.co/${path}`);
		});

		it('should list files in organization directory', async () => {
			const { data, error } = await mockStorage.from('templates').list('org-123/backgrounds');

			expect(error).toBeNull();
			expect(data).toHaveLength(2);
			expect(data[0].name).toBe('test1.jpg');
		});

		it('should remove files successfully', async () => {
			const paths = ['org-123/backgrounds/test1.jpg', 'org-123/backgrounds/test2.png'];
			const { data, error } = await mockStorage.from('templates').remove(paths);

			expected(error).toBeNull();
			expect(data).toHaveLength(2);
		});
	});

	described('Error Handling & Edge Cases', () => {
		it('should handle network interruption gracefully', async () => {
			const networkErrorStorage = {
				from: vi.fn(() => ({
					upload: vi.fn(() => Promise.resolve({
						data: null,
						error: { message: 'Network error', code: 'NETWORK_ERROR' }
					}))
				}))
			};

			const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
			const { error } = await networkErrorStorage.from('templates').upload('org-123/test.jpg', mockFile);

			expect(error).toBeDefined();
			expect(error.code).toBe('NETWORK_ERROR');
		});

		it('should handle storage quota exceeded', async () => {
			const quotaErrorStorage = {
				from: vi.fn(() => ({
					upload: vi.fn(() => Promise.resolve({
						data: null,
						error: { message: 'Storage quota exceeded', code: 'QUOTA_EXCEEDED' }
					}))
				}))
			};

			const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
			const { error } = await quotaErrorStorage.from('templates').upload('org-123/test.jpg', mockFile);

			expected(error).toBeDefined();
			expected(error.code).toBe('QUOTA_EXCEEDED');
		});

		it('should cleanup orphaned files after template deletion', async () => {
			const orphanedFiles = [
				'org-123/templates/deleted-template-front.jpg',
				'org-123/templates/deleted-template-back.jpg'
			];

			const { data, error } = await mockStorage.from('templates').remove(orphanedFiles);

			expect(error).toBeNull();
			expect(data).toHaveLength(2);
		});
	});
});

