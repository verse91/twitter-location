(function() {
    let twitterHeaders = null;
    let headersReady = false;

    function captureHeaders(headers) {
        if (!headers) return;

        const headerObj = {};
        if (headers instanceof Headers) {
            headers.forEach((value, key) => {
                headerObj[key] = value;
            });
        } else if (headers instanceof Object) {
            for (const [key, value] of Object.entries(headers)) {
                headerObj[key] = value;
            }
        }

        twitterHeaders = headerObj;
        headersReady = true;
    }

    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = args[0];
        const options = args[1] || {};

        if (typeof url === 'string' && url.includes('x.com/i/api/graphql')) {
            if (options.headers) {
                captureHeaders(options.headers);
            }
        }

        return originalFetch.apply(this, args);
    };

    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        this._url = url;
        return originalXHROpen.apply(this, [method, url, ...rest]);
    };

    XMLHttpRequest.prototype.send = function(...args) {
        if (this._url && this._url.includes('x.com/i/api/graphql')) {
            const headers = {};
            if (this._headers) {
                Object.assign(headers, this._headers);
            }
            captureHeaders(headers);
        }
        return originalXHRSend.apply(this, args);
    };

    const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
        if (!this._headers) this._headers = {};
        this._headers[header] = value;
        return originalSetRequestHeader.apply(this, [header, value]);
    };

    let headerCaptureAttempts = 0;
    const maxHeaderCaptureAttempts = 50;

    const headerCaptureInterval = setInterval(() => {
        if (headersReady) {
            clearInterval(headerCaptureInterval);
            return;
        }

        headerCaptureAttempts++;
        if (headerCaptureAttempts >= maxHeaderCaptureAttempts) {
            if (!headersReady) {
                console.log('No Twitter headers captured after waiting, using defaults');
                twitterHeaders = {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                };
                headersReady = true;
            }
            clearInterval(headerCaptureInterval);
        }
    }, 100);

    window.addEventListener('message', async function(event) {
        if (event.data && event.data.type === '__fetchLocation') {
            const { screenName, requestId } = event.data;

            if (!headersReady) {
                let waitCount = 0;
                while (!headersReady && waitCount < 30) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    waitCount++;
                }
            }

            try {
                const variables = JSON.stringify({ screenName });
                const url = `https://x.com/i/api/graphql/XRqGa7EeokUU5kppkh13EA/AboutAccountQuery?variables=${encodeURIComponent(variables)}`;

                const headers = twitterHeaders || {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                };

                const response = await fetch(url, {
                    method: 'GET',
                    credentials: 'include',
                    headers: headers,
                    referrer: window.location.href,
                    referrerPolicy: 'origin-when-cross-origin'
                });

                let location = null;
                if (response.ok) {
                    const data = await response.json();
                    location = data?.data?.user_result_by_screen_name?.result?.about_profile?.account_based_in || null;
                    console.log(`Extracted location for ${screenName}:`, location);

                    if (!location && data?.data?.user_result_by_screen_name?.result) {
                        console.log('User result available but no location:', {
                            hasAboutProfile: !!data.data.user_result_by_screen_name.result.about_profile,
                            aboutProfile: data.data.user_result_by_screen_name.result.about_profile
                        });
                    }
                } else {
                    const errorText = await response.text().catch(() => '');

                    if (response.status === 429) {
                        const resetTime = response.headers.get('x-rate-limit-reset');
                        const remaining = response.headers.get('x-rate-limit-remaining');
                        const limit = response.headers.get('x-rate-limit-limit');

                        if (resetTime) {
                            const resetDate = new Date(parseInt(resetTime) * 1000);
                            const now = Date.now();
                            const waitTime = resetDate.getTime() - now;

                            console.log(`Rate limited! Limit: ${limit}, Remaining: ${remaining}`);
                            console.log(`Rate limit resets at: ${resetDate.toLocaleString()}`);
                            console.log(`Waiting ${Math.ceil(waitTime / 1000 / 60)} minutes before retrying...`);

                            window.postMessage({
                                type: '__rateLimitInfo',
                                resetTime: parseInt(resetTime),
                                waitTime: Math.max(0, waitTime)
                            }, '*');
                        }
                    } else {
                        console.log(`Twitter API error for ${screenName}:`, response.status, response.statusText, errorText.substring(0, 200));
                    }
                }

                window.postMessage({
                    type: '__locationResponse',
                    screenName,
                    location,
                    requestId,
                    isRateLimited: response.status === 429
                }, '*');
            } catch (error) {
                console.error('Error fetching location:', error);
                window.postMessage({
                    type: '__locationResponse',
                    screenName,
                    location: null,
                    requestId
                }, '*');
            }
        }
    });
})();
