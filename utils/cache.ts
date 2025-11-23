import { browser } from 'wxt/browser';

const CACHE_KEY = 'twitter_location_cache';
const CACHE_EXPIRY_DAYS = 30;

export const locationCache = new Map<string, string | null>();

export async function loadCache() {
    try {
        if (!browser.runtime?.id) {
            return;
        }

        const result = await browser.storage.local.get(CACHE_KEY);
        if (result[CACHE_KEY]) {
            const cached = result[CACHE_KEY] as Record<string, any>;
            const now = Date.now();

            for (const [username, data] of Object.entries(cached)) {
                if (data.expiry && data.expiry > now && data.location !== null) {
                    locationCache.set(username, data.location);
                }
            }
        }
    } catch (error: any) {
        // Silent fail
    }
}

export async function saveCache() {
    try {
        if (!browser.runtime?.id) {
            return;
        }

        const existingResult = await browser.storage.local.get(CACHE_KEY);
        const existingCache = existingResult[CACHE_KEY] as Record<string, any> || {};

        const cacheObj: Record<string, any> = {};
        const now = Date.now();
        const expiry = now + (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

        for (const [username, location] of locationCache.entries()) {
            const existingEntry = existingCache[username];
            const cachedAt = existingEntry?.cachedAt || now;

            cacheObj[username] = {
                location: location,
                expiry: expiry,
                cachedAt: cachedAt
            };
        }

        await browser.storage.local.set({ [CACHE_KEY]: cacheObj });
    } catch (error: any) {
        // Silent fail
    }
}

export async function saveCacheEntry(username: string, location: string | null) {
    if (!browser.runtime?.id) {
        return;
    }

    locationCache.set(username, location);

    try {
        const existingResult = await browser.storage.local.get(CACHE_KEY);
        const existingCache = existingResult[CACHE_KEY] as Record<string, any> || {};
        const now = Date.now();
        const expiry = now + (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

        existingCache[username] = {
            location: location,
            expiry: expiry,
            cachedAt: now
        };

        await browser.storage.local.set({ [CACHE_KEY]: existingCache });
    } catch (error) {
        await saveCache();
    }
}
