/**
 * Shared Rate Limiter
 * 
 * Coordinates API calls across multiple workers to ensure total request rate
 * stays within limits. Uses an async queue pattern where workers wait for
 * their turn before making API calls.
 * 
 * @example
 * ```typescript
 * const limiter = new SharedRateLimiter(3000); // 3 seconds between requests
 * 
 * // Multiple workers can share the same limiter
 * async function worker(id: number) {
 *   await limiter.acquire();
 *   // Now safe to make API call - limiter ensures proper spacing
 *   await makeApiCall();
 * }
 * 
 * // Start multiple workers - they'll be serialized through the limiter
 * await Promise.all([worker(1), worker(2), worker(3)]);
 * ```
 */

export interface RateLimiterMetrics {
    totalRequests: number;
    avgWaitTimeMs: number;
    maxWaitTimeMs: number;
}

/**
 * Shared rate limiter for coordinating API calls across multiple workers.
 * Uses async queue pattern to ensure only one request proceeds at a time,
 * with configurable delay between requests.
 */
export class SharedRateLimiter {
    private lastRequestTime: number = 0;
    private requestQueue: Array<{
        resolve: () => void;
        reject: (error: Error) => void;
    }> = [];
    private processing: boolean = false;
    private metrics = {
        totalRequests: 0,
        totalWaitTime: 0,
        maxWaitTime: 0
    };

    /**
     * Creates a new shared rate limiter.
     * 
     * @param minIntervalMs - Minimum milliseconds between requests (default: 3000)
     */
    constructor(private minIntervalMs: number = 3000) {}

    /**
     * Acquire a rate limit slot. Resolves when the caller may proceed with their request.
     * Multiple concurrent calls will be queued and processed in order.
     * 
     * @returns Promise that resolves when it's safe to make the API call
     */
    async acquire(): Promise<void> {
        const startWait = Date.now();
        
        return new Promise<void>((resolve, reject) => {
            this.requestQueue.push({ resolve, reject });
            this.processQueue();
        }).then(() => {
            const waitTime = Date.now() - startWait;
            this.metrics.totalRequests++;
            this.metrics.totalWaitTime += waitTime;
            this.metrics.maxWaitTime = Math.max(this.metrics.maxWaitTime, waitTime);
        });
    }

    /**
     * Process queued requests, ensuring minimum interval between each.
     */
    private async processQueue(): Promise<void> {
        if (this.processing || this.requestQueue.length === 0) {
            return;
        }

        this.processing = true;

        while (this.requestQueue.length > 0) {
            const now = Date.now();
            const timeSinceLastRequest = now - this.lastRequestTime;
            
            if (timeSinceLastRequest < this.minIntervalMs && this.lastRequestTime > 0) {
                const delay = this.minIntervalMs - timeSinceLastRequest;
                await new Promise(r => setTimeout(r, delay));
            }

            const request = this.requestQueue.shift();
            if (request) {
                this.lastRequestTime = Date.now();
                request.resolve();
            }
        }

        this.processing = false;
    }

    /**
     * Get metrics about rate limiter usage.
     * 
     * @returns Metrics including total requests, average wait time, and max wait time
     */
    getMetrics(): RateLimiterMetrics {
        return {
            totalRequests: this.metrics.totalRequests,
            avgWaitTimeMs: this.metrics.totalRequests > 0 
                ? Math.round(this.metrics.totalWaitTime / this.metrics.totalRequests) 
                : 0,
            maxWaitTimeMs: this.metrics.maxWaitTime
        };
    }

    /**
     * Reset metrics (useful for testing or new processing sessions).
     */
    resetMetrics(): void {
        this.metrics = {
            totalRequests: 0,
            totalWaitTime: 0,
            maxWaitTime: 0
        };
    }

    /**
     * Get the configured minimum interval between requests.
     */
    getMinIntervalMs(): number {
        return this.minIntervalMs;
    }

    /**
     * Get the current queue length.
     */
    getQueueLength(): number {
        return this.requestQueue.length;
    }
}







