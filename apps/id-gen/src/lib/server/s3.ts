import { S3Client } from '@aws-sdk/client-s3';
import { env } from '$env/dynamic/private';

// Validate R2 credentials
const R2_ACCOUNT_ID = env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = env.R2_BUCKET_NAME;

// Only initialize if credentials are present to avoid runtime crashes during build/dev if not set
export const r2 = (R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) 
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
    const publicDomain = env.R2_PUBLIC_DOMAIN;
    if (publicDomain) {
        return `${publicDomain}/${key}`;
    }
    // Fallback or presigned generator would be needed if no public domain
    return ''; 
}
