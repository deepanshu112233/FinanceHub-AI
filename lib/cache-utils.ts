/**
 * Cache utility for localStorage with TTL support
 * Provides type-safe caching operations with automatic expiry
 */

interface CachedData<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

/**
 * Get cached data from localStorage
 * @param key Cache key
 * @returns Cached data or null if not found/expired
 */
export function getCachedData<T>(key: string): T | null {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;

        const parsed: CachedData<T> = JSON.parse(cached);
        const now = Date.now();

        // Check if cache is still valid
        if (now - parsed.timestamp > parsed.ttl) {
            // Cache expired, remove it
            localStorage.removeItem(key);
            return null;
        }

        return parsed.data;
    } catch (error) {
        console.error(`Error reading cache for key "${key}":`, error);
        // Clear corrupted cache
        localStorage.removeItem(key);
        return null;
    }
}

/**
 * Set cached data in localStorage with TTL
 * @param key Cache key
 * @param data Data to cache
 * @param ttl Time to live in milliseconds
 */
export function setCachedData<T>(key: string, data: T, ttl: number): void {
    try {
        const cacheEntry: CachedData<T> = {
            data,
            timestamp: Date.now(),
            ttl,
        };

        localStorage.setItem(key, JSON.stringify(cacheEntry));
    } catch (error) {
        console.error(`Error setting cache for key "${key}":`, error);
        // Handle quota exceeded or other errors gracefully
        // App will continue to work, just without caching
    }
}

/**
 * Invalidate (remove) cached data
 * @param key Cache key to invalidate
 */
export function invalidateCache(key: string): void {
    try {
        localStorage.removeItem(key);
        console.log(`✅ Cache invalidated: ${key}`);
    } catch (error) {
        console.error(`Error invalidating cache for key "${key}":`, error);
    }
}

/**
 * Check if cache exists and is valid
 * @param key Cache key
 * @returns true if cache exists and hasn't expired
 */
export function isCacheValid(key: string): boolean {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return false;

        const parsed: CachedData<any> = JSON.parse(cached);
        const now = Date.now();

        return now - parsed.timestamp <= parsed.ttl;
    } catch (error) {
        return false;
    }
}

/**
 * Clear all cache entries (useful for logout)
 */
export function clearAllCache(): void {
    try {
        // Get all keys that look like cache keys
        const keys = Object.keys(localStorage);
        const cacheKeys = keys.filter(key => key.includes('_cache'));

        cacheKeys.forEach(key => {
            localStorage.removeItem(key);
        });

        console.log(`✅ Cleared ${cacheKeys.length} cache entries`);
    } catch (error) {
        console.error('Error clearing cache:', error);
    }
}

/**
 * Cache invalidation event interface
 */
export interface CacheInvalidationEvent extends CustomEvent {
    detail: {
        type: 'expense-added' | 'expense-edited' | 'expense-deleted' | 'income-added' | 'income-edited' | 'income-deleted';
        groupId?: string;
        expenseId?: string;
    };
}

/**
 * Dispatch cache invalidation event
 * @param type Type of mutation
 * @param metadata Additional metadata
 */
export function dispatchCacheInvalidation(
    type: CacheInvalidationEvent['detail']['type'],
    metadata?: { groupId?: string; expenseId?: string }
): void {
    const event = new CustomEvent('cache-invalidated', {
        detail: {
            type,
            ...metadata,
        },
    });

    window.dispatchEvent(event);
    console.log(`🔄 Cache invalidation event dispatched: ${type}`);
}
