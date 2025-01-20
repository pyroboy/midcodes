interface RateLimitConfig {
    window: number;  // time window in milliseconds
    max: number;     // maximum number of requests allowed in the window
}

interface RateLimitResult {
    success: boolean;
    remaining?: number;
    resetAt?: Date;
}

// Simple in-memory rate limiting
const requests = new Map<string, { count: number; startTime: number }>();

export async function rateLimit(
    key: string,
    config: RateLimitConfig
): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - config.window;
    
    // Clean up old entries
    for (const [storedKey, data] of requests.entries()) {
        if (data.startTime < windowStart) {
            requests.delete(storedKey);
        }
    }
    
    // Get or create request data for this key
    const data = requests.get(key) || { count: 0, startTime: now };
    
    // Reset if outside window
    if (data.startTime < windowStart) {
        data.count = 0;
        data.startTime = now;
    }
    
    // Check if limit exceeded
    if (data.count >= config.max) {
        const resetAt = new Date(data.startTime + config.window);
        return {
            success: false,
            remaining: 0,
            resetAt
        };
    }
    
    // Increment counter
    data.count++;
    requests.set(key, data);
    
    return {
        success: true,
        remaining: config.max - data.count,
        resetAt: new Date(data.startTime + config.window)
    };
}
