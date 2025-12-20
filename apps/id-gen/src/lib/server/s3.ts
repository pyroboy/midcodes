import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env';

// Validate R2 credentials (optional - client handles null gracefully but setup page should warn)
const R2_ACCOUNT_ID = env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = env.R2_BUCKET_NAME;

export const r2 =
	R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY
		? new S3Client({
				region: 'auto',
				endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
				credentials: {
					accessKeyId: R2_ACCESS_KEY_ID,
					secretAccessKey: R2_SECRET_ACCESS_KEY
				}
			})
		: null;

export const R2_BUCKET = R2_BUCKET_NAME || 'id-gen-assets';

export function getPublicUrl(key: string): string {
	const publicDomain = env.R2_PUBLIC_DOMAIN || 'assets.kanaya.app'; // Force fallback to custom domain

	// Ensure protocol
	if (publicDomain.startsWith('http')) {
		return `${publicDomain}/${key}`;
	}
	return `https://${publicDomain}/${key}`;
}

export async function uploadToR2(
	key: string,
	body: Buffer | Uint8Array | Blob | string,
	contentType: string
): Promise<string> {
	if (!r2) throw new Error('R2 client not configured');

	let payload = body;
	if (body instanceof Blob) {
		payload = Buffer.from(await body.arrayBuffer());
	}

	const command = new PutObjectCommand({
		Bucket: R2_BUCKET,
		Key: key,
		Body: payload,
		ContentType: contentType
	});

	console.log(`[R2] Uploading to Bucket: ${R2_BUCKET}, Key: ${key}, Type: ${contentType}`);
	await r2.send(command);
	const publicUrl = getPublicUrl(key);
	console.log(`[R2] Upload success. Public URL: ${publicUrl}`);
	return publicUrl;
}

export async function deleteFromR2(key: string): Promise<void> {
	if (!r2) throw new Error('R2 client not configured');

	const command = new DeleteObjectCommand({
		Bucket: R2_BUCKET,
		Key: key
	});

	console.log(`[R2] Deleting from Bucket: ${R2_BUCKET}, Key: ${key}`);
	await r2.send(command);
	console.log(`[R2] Delete success: ${key}`);
}

export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
	if (!r2) throw new Error('R2 client not configured');

	// Note: Presigned URLs usually require specific operation command (e.g., GetObject)
	// For public access, getPublicUrl is preferred.
	// Implementing this just in case private access is needed later.
	const { GetObjectCommand } = await import('@aws-sdk/client-s3');
	const command = new GetObjectCommand({
		Bucket: R2_BUCKET,
		Key: key
	});

	return getSignedUrl(r2, command, { expiresIn });
}
