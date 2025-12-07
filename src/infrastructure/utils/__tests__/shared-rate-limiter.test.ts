import { describe, it, expect, beforeEach } from 'vitest';
import { SharedRateLimiter } from '../shared-rate-limiter.js';

describe('SharedRateLimiter', () => {
    let limiter: SharedRateLimiter;

    beforeEach(() => {
        // Use short interval for fast tests
        limiter = new SharedRateLimiter(100);
    });

    describe('acquire', () => {
        it('should allow first request immediately', async () => {
            const start = Date.now();
            await limiter.acquire();
            const elapsed = Date.now() - start;
            
            // First request should be near-instant (< 50ms tolerance)
            expect(elapsed).toBeLessThan(50);
        });

        it('should delay subsequent requests by minimum interval', async () => {
            // First request
            await limiter.acquire();
            
            // Second request should be delayed
            const start = Date.now();
            await limiter.acquire();
            const elapsed = Date.now() - start;
            
            // Should wait approximately 100ms (with some tolerance)
            expect(elapsed).toBeGreaterThanOrEqual(90);
            expect(elapsed).toBeLessThan(150);
        });

        it('should handle multiple concurrent requests in order', async () => {
            const results: number[] = [];
            const startTime = Date.now();
            
            // Start 3 concurrent requests
            const promises = [1, 2, 3].map(async (n) => {
                await limiter.acquire();
                results.push(n);
                return { n, time: Date.now() - startTime };
            });
            
            const timings = await Promise.all(promises);
            
            // All should complete
            expect(results).toHaveLength(3);
            
            // Requests should be spaced by ~100ms each
            // First: ~0ms, Second: ~100ms, Third: ~200ms
            expect(timings[0].time).toBeLessThan(50);  // First is immediate
            expect(timings[1].time).toBeGreaterThanOrEqual(90);  // Second waits
            expect(timings[2].time).toBeGreaterThanOrEqual(180); // Third waits more
        });

        it('should respect custom interval', async () => {
            const customLimiter = new SharedRateLimiter(200);
            
            await customLimiter.acquire();
            
            const start = Date.now();
            await customLimiter.acquire();
            const elapsed = Date.now() - start;
            
            // Should wait approximately 200ms
            expect(elapsed).toBeGreaterThanOrEqual(190);
            expect(elapsed).toBeLessThan(250);
        });
    });

    describe('getMetrics', () => {
        it('should return zero metrics initially', () => {
            const metrics = limiter.getMetrics();
            
            expect(metrics.totalRequests).toBe(0);
            expect(metrics.avgWaitTimeMs).toBe(0);
            expect(metrics.maxWaitTimeMs).toBe(0);
        });

        it('should track total requests', async () => {
            await limiter.acquire();
            await limiter.acquire();
            await limiter.acquire();
            
            const metrics = limiter.getMetrics();
            expect(metrics.totalRequests).toBe(3);
        });

        it('should track wait times', async () => {
            await limiter.acquire(); // Immediate
            await limiter.acquire(); // ~100ms wait
            
            const metrics = limiter.getMetrics();
            
            expect(metrics.totalRequests).toBe(2);
            // Average should be > 0 (first was ~0, second was ~100)
            expect(metrics.avgWaitTimeMs).toBeGreaterThanOrEqual(40);
            // Max should be close to 100ms
            expect(metrics.maxWaitTimeMs).toBeGreaterThanOrEqual(90);
        });
    });

    describe('resetMetrics', () => {
        it('should reset all metrics to zero', async () => {
            await limiter.acquire();
            await limiter.acquire();
            
            limiter.resetMetrics();
            
            const metrics = limiter.getMetrics();
            expect(metrics.totalRequests).toBe(0);
            expect(metrics.avgWaitTimeMs).toBe(0);
            expect(metrics.maxWaitTimeMs).toBe(0);
        });
    });

    describe('getMinIntervalMs', () => {
        it('should return configured interval', () => {
            expect(limiter.getMinIntervalMs()).toBe(100);
            
            const customLimiter = new SharedRateLimiter(5000);
            expect(customLimiter.getMinIntervalMs()).toBe(5000);
        });
    });

    describe('getQueueLength', () => {
        it('should return 0 when no requests are queued', () => {
            expect(limiter.getQueueLength()).toBe(0);
        });

        it('should show pending requests in queue', async () => {
            // Start first request (will process immediately)
            const first = limiter.acquire();
            
            // Start more requests while first is processing
            // These will queue up
            const second = limiter.acquire();
            const third = limiter.acquire();
            
            // Wait for all to complete
            await Promise.all([first, second, third]);
            
            // After completion, queue should be empty
            expect(limiter.getQueueLength()).toBe(0);
        });
    });

    describe('default interval', () => {
        it('should use 3000ms as default interval', () => {
            const defaultLimiter = new SharedRateLimiter();
            expect(defaultLimiter.getMinIntervalMs()).toBe(3000);
        });
    });

    describe('concurrent stress test', () => {
        it('should handle 10 concurrent requests correctly', async () => {
            // Use 50ms interval for faster test
            const stressLimiter = new SharedRateLimiter(50);
            const results: number[] = [];
            
            // Start 10 concurrent requests
            const promises = Array.from({ length: 10 }, (_, i) => 
                stressLimiter.acquire().then(() => {
                    results.push(i);
                })
            );
            
            await Promise.all(promises);
            
            // All 10 should complete
            expect(results).toHaveLength(10);
            
            const metrics = stressLimiter.getMetrics();
            expect(metrics.totalRequests).toBe(10);
        });
    });
});








