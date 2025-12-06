import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { validateImageUpload, sanitizeFilename } from '$lib/utils/fileValidation';

describe('File Upload Security Validation', () => {
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

		const txtResult = validateImageUpload(txtFile);
		expect(txtResult.valid).toBe(false);
		expect(txtResult.error).toBe('Invalid file type');

		const pdfResult = validateImageUpload(pdfFile);
		expect(pdfResult.valid).toBe(false);
		expect(pdfResult.error).toBe('Invalid file type');
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
});
