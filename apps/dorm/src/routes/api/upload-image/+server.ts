import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { uploadImage, type UploadResult } from '$lib/utils/cloudinary';
import { env } from '$env/dynamic/private';
import {
	createValidationError,
	createInternalError,
	jsonError,
	ErrorCode
} from '$lib/utils/errors';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;

		// Validate file exists
		if (!file) {
			return jsonError(
				createValidationError('No file provided', undefined, { action: 'upload_image' })
			);
		}

		// Validate file type
		if (!ALLOWED_FILE_TYPES.includes(file.type)) {
			return jsonError(
				createValidationError(
					`Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`,
					`Received: ${file.type}`,
					{ action: 'upload_image', metadata: { fileType: file.type } }
				)
			);
		}

		// Validate file size
		if (file.size > MAX_FILE_SIZE) {
			return jsonError(
				createValidationError(
					`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
					`Received: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
					{ action: 'upload_image', metadata: { fileSize: file.size } }
				)
			);
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
			try {
				const result: UploadResult = await uploadImage(buffer, {
					folder: 'dorm/tenants',
					quality: 'auto',
					format: 'webp',
					transformation: [
						{ width: 400, height: 400, crop: 'fill', gravity: 'face' },
						{ quality: 'auto' }
					]
				});

				console.log('✅ Image uploaded to Cloudinary:', result.public_id);

				return json({
					success: true,
					public_id: result.public_id,
					secure_url: result.secure_url,
					width: result.width,
					height: result.height,
					format: result.format,
					bytes: result.bytes
				});
			} catch (uploadError) {
				return jsonError(
					createInternalError(
						'Failed to upload image to Cloudinary',
						uploadError,
						{ action: 'upload_image', metadata: { service: 'cloudinary' } }
					)
				);
			}
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
		// Handle any unexpected errors
		return jsonError(
			createInternalError(
				'An unexpected error occurred during image upload',
				err,
				{ action: 'upload_image' }
			)
		);
	}
};
