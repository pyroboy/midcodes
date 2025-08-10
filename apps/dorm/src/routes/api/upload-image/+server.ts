import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { uploadImage, type UploadResult } from '$lib/utils/cloudinary';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			throw error(400, 'No file provided');
		}

		// Validate file type
		if (!file.type.startsWith('image/')) {
			throw error(400, 'File must be an image');
		}

		// Validate file size (2MB max for profile pictures)
		if (file.size > 2 * 1024 * 1024) {
			throw error(400, 'File size must be less than 2MB');
		}

		// Convert file to buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Check if Cloudinary is configured
		const hasCloudinaryConfig = 
			env.PRIVATE_CLOUDINARY_CLOUD_NAME && 
			env.PRIVATE_CLOUDINARY_API_KEY && 
			env.PRIVATE_CLOUDINARY_API_SECRET;

		if (hasCloudinaryConfig) {
			// Upload to Cloudinary when properly configured
			const result: UploadResult = await uploadImage(buffer, {
				folder: 'dorm/tenants',
				quality: 'auto',
				format: 'webp',
				transformation: [
					{ width: 400, height: 400, crop: 'fill', gravity: 'face' },
					{ quality: 'auto' }
				]
			});

			return json({
				success: true,
				public_id: result.public_id,
				secure_url: result.secure_url,
				width: result.width,
				height: result.height,
				format: result.format,
				bytes: result.bytes
			});
		} else {
			// Fallback: return data URL for development
			console.warn('⚠️ Cloudinary not configured, using data URL fallback');
			
			const base64Data = buffer.toString('base64');
			const mimeType = file.type;
			const dataUrl = `data:${mimeType};base64,${base64Data}`;

			return json({
				success: true,
				public_id: `dev_upload_${Date.now()}`,
				secure_url: dataUrl,
				width: 400,
				height: 400,
				format: file.type.split('/')[1] || 'jpeg',
				bytes: file.size
			});
		}
	} catch (err: any) {
		console.error('Image upload error:', err);

		if (err.status) {
			throw err; // Re-throw SvelteKit errors
		}

		throw error(500, err.message || 'Failed to upload image');
	}
};
