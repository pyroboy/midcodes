import { json } from '@sveltejs/kit';
import { r2, R2_BUCKET } from '$lib/server/s3';
import { PutBucketCorsCommand } from '@aws-sdk/client-s3';

export const POST = async () => {
    if (!r2) {
        return json({ success: false, error: 'R2 client not configured' }, { status: 500 });
    }

    try {
        const command = new PutBucketCorsCommand({
            Bucket: R2_BUCKET,
            CORSConfiguration: {
                CORSRules: [
                    {
                        AllowedHeaders: ['*'],
                        AllowedMethods: ['GET', 'HEAD'],
                        AllowedOrigins: ['*'], // Allow all origins
                        ExposeHeaders: [],
                        MaxAgeSeconds: 3000
                    }
                ]
            }
        });

        await r2.send(command);
        return json({ success: true, message: 'CORS configured successfully for ' + R2_BUCKET });
    } catch (err: any) {
        console.error('Error setting CORS:', err);
        return json({ success: false, error: err.message }, { status: 500 });
    }
};
