import { saveCacheEntry } from './cache';

const requestQueue: Array<{ screenName: string; resolve: (value: string | null) => void; reject: (error: any) => void }> = [];
let isProcessingQueue = false;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000;
const MAX_CONCURRENT_REQUESTS = 2;
let activeRequests = 0;
let rateLimitResetTime = 0;

export function setRateLimitResetTime(resetTime: number) {
    rateLimitResetTime = resetTime;
}

export async function processRequestQueue() {
    if (isProcessingQueue || requestQueue.length === 0) {
        return;
    }

    if (rateLimitResetTime > 0) {
        const now = Math.floor(Date.now() / 1000);
        if (now < rateLimitResetTime) {
            const waitTime = (rateLimitResetTime - now) * 1000;
            setTimeout(processRequestQueue, Math.min(waitTime, 60000));
            return;
        } else {
            rateLimitResetTime = 0;
        }
    }

    isProcessingQueue = true;

    while (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;

        if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
            await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
        }

        const item = requestQueue.shift();
        if (!item) break;

        const { screenName, resolve, reject } = item;
        activeRequests++;
        lastRequestTime = Date.now();

        makeLocationRequest(screenName)
            .then(location => {
                resolve(location);
            })
            .catch(error => {
                reject(error);
            })
            .finally(() => {
                activeRequests--;
                setTimeout(processRequestQueue, 200);
            });
    }

    isProcessingQueue = false;
}

function makeLocationRequest(screenName: string): Promise<string | null> {
    return new Promise((resolve) => {
        const requestId = Date.now() + Math.random();

        const handler = (event: MessageEvent) => {
            if (event.source !== window) return;

            if (event.data &&
                event.data.type === '__locationResponse' &&
                event.data.screenName === screenName &&
                event.data.requestId === requestId) {
                window.removeEventListener('message', handler);
                const location = event.data.location;
                const isRateLimited = event.data.isRateLimited || false;

                if (!isRateLimited) {
                    saveCacheEntry(screenName, location || null);
                }

                resolve(location || null);
            }
        };
        window.addEventListener('message', handler);

        window.postMessage({
            type: '__fetchLocation',
            screenName,
            requestId
        }, '*');

        setTimeout(() => {
            window.removeEventListener('message', handler);
            resolve(null);
        }, 10000);
    });
}

export async function getUserLocation(screenName: string, locationCache: Map<string, string | null>): Promise<string | null> {
    if (locationCache.has(screenName)) {
        const cached = locationCache.get(screenName);
        if (cached !== null && cached !== undefined) {
            return cached;
        } else {
            locationCache.delete(screenName);
        }
    }
    return new Promise((resolve, reject) => {
        requestQueue.push({ screenName, resolve, reject });
        processRequestQueue();
    });
}
