import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '$env/dynamic/private';

const s3Client = new S3Client({
	region: 'auto',
	credentials: {
		accessKeyId: env.R2_ACCESS_KEY_ID,
		secretAccessKey: env.R2_SECRET_ACCESS_KEY
	},
	endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
});

export async function uploadToR2(
	fileBuffer: Buffer,
	fileName: string,
	contentType: string
): Promise<string> {
	const key = `tattoo-references/${Date.now()}-${fileName}`;

	const command = new PutObjectCommand({
		Bucket: env.R2_BUCKET_NAME,
		Key: key,
		Body: fileBuffer,
		ContentType: contentType
	});

	await s3Client.send(command);

	return `https://${env.R2_BUCKET_NAME}.${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
}
