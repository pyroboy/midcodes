import { v2 as cloudinary } from 'cloudinary';
import { env } from '$env/dynamic/private';

// Configure Cloudinary
cloudinary.config({
	cloud_name: env.PRIVATE_CLOUDINARY_CLOUD_NAME,
	api_key: env.PRIVATE_CLOUDINARY_API_KEY,
	api_secret: env.PRIVATE_CLOUDINARY_API_SECRET
});

export interface UploadOptions {
	folder?: string;
	public_id?: string;
	transformation?: Array<any>;
	format?: string;
	quality?: string | number;
}

export interface UploadResult {
	public_id: string;
	secure_url: string;
	width: number;
	height: number;
	format: string;
	resource_type: string;
	created_at: string;
	bytes: number;
}

/**
 * Upload an image to Cloudinary
 * @param file - File buffer or base64 string
 * @param options - Upload options
 * @returns Upload result with URL and metadata
 */
export async function uploadImage(
	file: Buffer | string,
	options: UploadOptions = {}
): Promise<UploadResult> {
	try {
		const defaultOptions: UploadOptions = {
			folder: 'dorm/tenants',
			quality: 'auto',
			format: 'webp',
			transformation: [
				{ width: 400, height: 400, crop: 'fill', gravity: 'face' },
				{ quality: 'auto' }
			]
		};

		const uploadOptions = { ...defaultOptions, ...options };

		// Convert buffer to base64 data URL
		let fileData: string;
		if (Buffer.isBuffer(file)) {
			fileData = `data:image/jpeg;base64,${file.toString('base64')}`;
		} else {
			fileData = file;
		}

		const result = await cloudinary.uploader.upload(fileData, {
			...uploadOptions,
			resource_type: 'image'
		});

		return {
			public_id: result.public_id,
			secure_url: result.secure_url,
			width: result.width,
			height: result.height,
			format: result.format,
			resource_type: result.resource_type,
			created_at: result.created_at,
			bytes: result.bytes
		};
	} catch (error) {
		console.error('Cloudinary upload error:', error);
		throw new Error('Failed to upload image to Cloudinary');
	}
}

/**
 * Delete an image from Cloudinary
 * @param publicId - The public ID of the image to delete
 * @returns Deletion result
 */
export async function deleteImage(publicId: string): Promise<{ result: string }> {
	try {
		const result = await cloudinary.uploader.destroy(publicId);
		return result;
	} catch (error) {
		console.error('Cloudinary delete error:', error);
		throw new Error('Failed to delete image from Cloudinary');
	}
}

/**
 * Get optimized URL for an image with transformations
 * @param publicId - The public ID of the image
 * @param transformations - Array of transformation objects
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(publicId: string, transformations: Array<any> = []): string {
	return cloudinary.url(publicId, {
		transformation: [{ quality: 'auto' }, { fetch_format: 'auto' }, ...transformations]
	});
}

/**
 * Get profile picture URL with standard tenant transformations
 * @param publicId - The public ID of the image
 * @param size - Size preset ('small' | 'medium' | 'large')
 * @returns Optimized profile picture URL
 */
export function getTenantProfileUrl(
	publicId: string,
	size: 'small' | 'medium' | 'large' = 'medium'
): string {
	const sizeMap = {
		small: { width: 64, height: 64 },
		medium: { width: 160, height: 160 },
		large: { width: 400, height: 400 }
	};

	const dimensions = sizeMap[size];

	return cloudinary.url(publicId, {
		transformation: [
			{
				width: dimensions.width,
				height: dimensions.height,
				crop: 'fill',
				gravity: 'face'
			},
			{ quality: 'auto' },
			{ fetch_format: 'auto' }
		]
	});
}

/**
 * Extract public ID from Cloudinary URL
 * @param url - Cloudinary URL
 * @returns Public ID or null if invalid URL
 */
export function extractPublicId(url: string): string | null {
	try {
		const matches = url.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|gif|webp)/i);
		return matches ? matches[1] : null;
	} catch {
		return null;
	}
}

/**
 * Validate if a URL is a Cloudinary URL
 * @param url - URL to validate
 * @returns True if valid Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
	return url.includes('cloudinary.com') && url.includes('/image/upload/');
}

export default cloudinary;
