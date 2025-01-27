import type { SupabaseClient } from '@supabase/supabase-js';

interface ImageTransformOptions {
    width?: number;
    height?: number;
    quality?: number;
}

interface QueueItem {
    resolve: (result: { url: string | null; error?: string }) => void;
    reject: (error: Error) => void;
}

export class SupabaseImageManager {
    private static transformCache: Map<string, string> = new Map();
    private static inProgressTransforms: Map<string, Promise<{ url: string | null; error?: string }>> = new Map();
    private static processingFiles: Set<string> = new Set();
    private static urlCache: Map<string, boolean> = new Map();
    private static instances = new Map<string, SupabaseImageManager>();
    private static transformQueue: Map<string, QueueItem[]> = new Map();
    private static MAX_CONCURRENT_TRANSFORMS = 3;

    private constructor(
        private readonly supabaseClient: SupabaseClient,
        private readonly bucket: string
    ) {
        if (!supabaseClient) {
            throw new Error('Supabase client is required');
        }

        if (!supabaseClient.storage) {
            throw new Error('Supabase client storage is not initialized');
        }

        if (!bucket) {
            throw new Error('Bucket name is required');
        }

        console.log('🚀 New SupabaseImageManager initialized with bucket:', bucket);
    }

    static create(supabaseClient: SupabaseClient, bucket: string): SupabaseImageManager {
        const instanceKey = bucket;
        
        if (this.instances.has(instanceKey)) {
            console.log('♻️ Reusing existing manager for bucket:', bucket);
            return this.instances.get(instanceKey)!;
        }

        const instance = new SupabaseImageManager(supabaseClient, bucket);
        this.instances.set(instanceKey, instance);
        return instance;
    }

    private getCacheKey(originalUrl: string, options: ImageTransformOptions): string {
        const key = JSON.stringify({ url: originalUrl, ...options });
        console.log('🔑 Generated cache key:', key);
        return key;
    }

    private getTransformKey(originalUrl: string, options: ImageTransformOptions): string {
        const filename = originalUrl.split('/').pop() || '';
        const [baseName, ext] = filename.split('.');
        
        const transformString = [
            options.width ? `w${options.width}` : '',
            options.height ? `h${options.height}` : '',
            options.quality ? `q${options.quality}` : ''
        ].filter(Boolean).join('-');

        const key = `${baseName}-${transformString}.${ext}`;
        console.log('🔄 Generated transform key:', key);
        return key;
    }

    private async resizeImage(blob: Blob, options: ImageTransformOptions): Promise<Blob> {
        console.log('📐 Starting image resize with options:', options);
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                console.error('❌ Failed to get canvas context');
                reject(new Error('Could not get canvas context'));
                return;
            }

            img.onload = () => {
                try {
                    console.log('📏 Original dimensions:', { width: img.width, height: img.height });
                    const aspectRatio = img.width / img.height;
                    let targetWidth = options.width || img.width;
                    let targetHeight = options.height || img.height;

                    if (options.width && options.height) {
                        const containerRatio = options.width / options.height;
                        
                        if (aspectRatio > containerRatio) {
                            targetWidth = options.width;
                            targetHeight = targetWidth / aspectRatio;
                        } else {
                            targetHeight = options.height;
                            targetWidth = targetHeight * aspectRatio;
                        }
                    } else if (options.width) {
                        targetWidth = options.width;
                        targetHeight = targetWidth / aspectRatio;
                    } else if (options.height) {
                        targetHeight = options.height;
                        targetWidth = targetHeight * aspectRatio;
                    }

                    console.log('📏 Target dimensions:', { width: targetWidth, height: targetHeight });

                    canvas.width = Math.round(targetWidth);
                    canvas.height = Math.round(targetHeight);
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    canvas.toBlob(
                        (resizedBlob) => {
                            if (!resizedBlob) {
                                console.error('❌ Failed to create resized blob');
                                reject(new Error('Failed to create resized blob'));
                                return;
                            }
                            console.log('✅ Image resize successful');
                            resolve(resizedBlob);
                        },
                        blob.type,
                        (options.quality || 80) / 100
                    );
                } catch (error) {
                    console.error('❌ Resize error:', error);
                    reject(error);
                } finally {
                    URL.revokeObjectURL(img.src);
                }
            };

            img.onerror = () => {
                URL.revokeObjectURL(img.src);
                console.error('❌ Failed to load image');
                reject(new Error('Failed to load image'));
            };

            img.src = URL.createObjectURL(blob);
        });
    }

    private async findExistingTransform(originalUrl: string, options: ImageTransformOptions): Promise<string | null> {
        console.log('🔍 Checking for existing transform:', originalUrl);
        const cacheKey = this.getCacheKey(originalUrl, options);
        
        const cachedUrl = SupabaseImageManager.transformCache.get(cacheKey);
        if (cachedUrl) {
            console.log('✅ Found in transform cache:', cachedUrl);
            return cachedUrl;
        }

        const transformedUrl = this.getTransformKey(originalUrl, options);

        try {
            console.log('🔍 Checking if file exists in storage:', transformedUrl);
            const response = await fetch(transformedUrl, { method: 'HEAD' });
            if (response.ok) {
                console.log('✅ Found existing file in storage');
                SupabaseImageManager.transformCache.set(cacheKey, transformedUrl);
                return transformedUrl;
            }
            
            console.log('❌ File not found in storage');
            SupabaseImageManager.urlCache.set(transformedUrl, false);
            return null;
        } catch (error) {
            console.error('❌ Error checking file existence:', error);
            SupabaseImageManager.urlCache.set(transformedUrl, false);
            return null;
        }
    }

    async transformAndStore(
        originalUrl: string,
        options: ImageTransformOptions
    ): Promise<{ url: string | null; error?: string }> {
        console.group(`🔄 Processing image: ${originalUrl.split('/').pop()}`);
        console.log('Options:', options);

        const cacheKey = this.getCacheKey(originalUrl, options);
        const transformKey = this.getTransformKey(originalUrl, options);
    
        // Check cache
        const cachedUrl = SupabaseImageManager.transformCache.get(cacheKey);
        if (cachedUrl) {
            console.log('✅ Found in cache:', cachedUrl);
            console.groupEnd();
            return { url: cachedUrl };
        }
    
        // Check for in-progress transforms
        const inProgressTransform = SupabaseImageManager.inProgressTransforms.get(cacheKey);
        if (inProgressTransform) {
            console.log('⏳ Transform already in progress, waiting for result');
            console.groupEnd();
            return inProgressTransform;
        }

        // Create new transform promise
        const transformPromise = new Promise<{ url: string | null; error?: string }>((resolve, reject) => {
            const queue = SupabaseImageManager.transformQueue.get(transformKey) || [];
            queue.push({ resolve, reject });
            SupabaseImageManager.transformQueue.set(transformKey, queue);

            // Only start processing if this is the first request
            if (queue.length === 1 && !SupabaseImageManager.processingFiles.has(transformKey)) {
                this.processTransform(originalUrl, options, transformKey, cacheKey).catch(reject);
            } else {
                console.log(`📝 Added to queue (${queue.length} requests for this transform)`);
            }
        });

        SupabaseImageManager.inProgressTransforms.set(cacheKey, transformPromise);
        
        try {
            return await transformPromise;
        } finally {
            SupabaseImageManager.inProgressTransforms.delete(cacheKey);
        }
    }

    private async processTransform(
        originalUrl: string,
        options: ImageTransformOptions,
        transformKey: string,
        cacheKey: string
    ): Promise<void> {
        try {
            SupabaseImageManager.processingFiles.add(transformKey);
            console.log('🔍 Checking if transformed version exists...');
            
            const existingUrl = await this.findExistingTransform(originalUrl, options);
            if (existingUrl) {
                console.log('✅ Found existing transform:', existingUrl);
                this.resolveQueue(transformKey, { url: existingUrl });
                return;
            }

            console.log('🆕 Starting new transformation');
            
            // 1. Fetch original
            console.log('📥 Fetching original image...');
            const response = await fetch(originalUrl);
            if (!response.ok) {
                throw new Error('Failed to fetch original image');
            }
            const blob = await response.blob();
            console.log('📦 Original size:', Math.round(blob.size / 1024), 'KB');

            // 2. Transform
            console.log('🔄 Transforming image...');
            const resizedBlob = await this.resizeImage(blob, options);
            console.log('📦 Transformed size:', Math.round(resizedBlob.size / 1024), 'KB');

            // 3. Upload
            console.log('📤 Uploading to Supabase:', transformKey);
            const { error: uploadError } = await this.supabaseClient
                .storage
                .from(this.bucket)
                .upload(transformKey, resizedBlob, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) {
                throw new Error(`Upload failed: ${uploadError.message}`);
            }

            // 4. Get URL
            console.log('🔗 Getting public URL...');
            const { data } = this.supabaseClient
                .storage
                .from(this.bucket)
                .getPublicUrl(transformKey);

            SupabaseImageManager.transformCache.set(cacheKey, data.publicUrl);
            this.resolveQueue(transformKey, { url: data.publicUrl });
            
        } catch (error) {
            console.error('❌ Process failed:', error);
            this.rejectQueue(transformKey, error instanceof Error ? error : new Error(String(error)));
        } finally {
            SupabaseImageManager.processingFiles.delete(transformKey);
            console.groupEnd();
        }
    }

    private resolveQueue(transformKey: string, result: { url: string | null; error?: string }): void {
        const queue = SupabaseImageManager.transformQueue.get(transformKey) || [];
        while (queue.length > 0) {
            const item = queue.shift();
            item?.resolve(result);
        }
        SupabaseImageManager.transformQueue.delete(transformKey);
    }

    private rejectQueue(transformKey: string, error: Error): void {
        const queue = SupabaseImageManager.transformQueue.get(transformKey) || [];
        while (queue.length > 0) {
            const item = queue.shift();
            item?.reject(error);
        }
        SupabaseImageManager.transformQueue.delete(transformKey);
    }

    async cleanup(url: string | null): Promise<void> {
        if (!url?.includes('supabase.co')) return;
        
        try {
            console.log('🧹 Starting cleanup for:', url);
            const fileName = url.split('/').pop();
            if (fileName && (fileName.includes('-w') || fileName.includes('-h') || fileName.includes('-q'))) {
                console.log('🗑️ Removing file:', fileName);
                const { error: removeError } = await this.supabaseClient
                    .storage
                    .from(this.bucket)
                    .remove([fileName]);

                if (!removeError) {
                    console.log('✅ File removed successfully');
                    SupabaseImageManager.transformCache.forEach((cachedUrl, key) => {
                        if (cachedUrl === url) {
                            SupabaseImageManager.transformCache.delete(key);
                            console.log('🧹 Cleaned cache entry:', key);
                        }
                    });
                    SupabaseImageManager.urlCache.delete(fileName);
                } else {
                    console.error('❌ Cleanup error:', removeError);
                }
            }
        } catch (error) {
            console.error('❌ Cleanup failed:', error);
        }
    }
}