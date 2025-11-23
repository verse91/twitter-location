import getCountryFlag from './country';
import { locationCache } from './cache';
import { getUserLocation } from './api';
import { extractUsernameFromLink } from './dom-utils';

const processingUsernames = new Set<string>();
const pendingFlagInsertions = new Map<string, { flag: string; location: string }>();

export function getPendingFlagInsertions() {
    return pendingFlagInsertions;
}

export function getProcessingUsernames() {
    return processingUsernames;
}

export async function addFlagToPopup(popup: HTMLElement, screenName: string) {
    if (!popup.isConnected) {
        return;
    }

    const parent = popup.closest('[data-testid="hoverCardParent"]');
    if (!parent) {
        return;
    }

    const existingFlag = popup.querySelector('[data-twitter-flag]');
    if (existingFlag) {
        popup.dataset.flagAdded = 'true';
        return;
    }

    if (popup.dataset.flagAdded === 'true') {
        popup.dataset.flagAdded = '';
    }

    const hasCache = locationCache.has(screenName) && locationCache.get(screenName) !== null;
    if (processingUsernames.has(screenName) && !hasCache) {
        popup.dataset.flagAdded = 'waiting';
        return;
    }

    if (!processingUsernames.has(screenName)) {
        processingUsernames.add(screenName);
    }
    popup.dataset.flagAdded = 'processing';

    try {
        let location: string | null = null;
        if (locationCache.has(screenName)) {
            location = locationCache.get(screenName) || null;
        } else {
            location = await getUserLocation(screenName, locationCache);
        }

        if (!location) {
            popup.dataset.flagAdded = 'failed';
            processingUsernames.delete(screenName);
            return;
        }

        const flag = getCountryFlag(location);
        if (!flag) {
            popup.dataset.flagAdded = 'failed';
            processingUsernames.delete(screenName);
            return;
        }

        if (!popup.isConnected) {
            pendingFlagInsertions.set(screenName, { flag, location });
            processingUsernames.delete(screenName);
            return;
        }

        const flagSpan = document.createElement('span');
        flagSpan.textContent = ` ${flag} ${location}`;
        flagSpan.setAttribute('data-twitter-flag', 'true');
        flagSpan.style.marginLeft = '4px';
        flagSpan.style.marginRight = '4px';
        flagSpan.style.display = 'inline';
        flagSpan.style.color = 'inherit';
        flagSpan.style.verticalAlign = 'middle';

        let usernameSpan: HTMLSpanElement | null = null;
        const maxAttempts = 15;

        if (!popup.isConnected) {
            return;
        }

        const checkForSpan = () => {
            if (!popup.isConnected) {
                return null;
            }

            const spans = Array.from(popup.querySelectorAll('span'));
            let found = spans.find(span => {
                const text = span.textContent?.trim();
                return text === `@${screenName}`;
            });

            if (!found) {
                found = spans.find(span => {
                    const text = span.textContent?.trim();
                    return text.includes(`@${screenName}`) && text.startsWith('@');
                });
            }

            return found || null;
        };

        usernameSpan = checkForSpan();

        if (!usernameSpan) {
            await new Promise<void>((resolve) => {
                let localAttempts = 0;
                let found = false;

                const checkAndResolve = () => {
                    if (found) return;

                    const foundSpan = checkForSpan();
                    if (foundSpan) {
                        usernameSpan = foundSpan;
                        found = true;
                        resolve();
                    }
                };

                const observer = new MutationObserver(() => {
                    if (!popup.isConnected) {
                        observer.disconnect();
                        if (!found) resolve();
                        return;
                    }
                    checkAndResolve();
                });

                observer.observe(popup, {
                    childList: true,
                    subtree: true,
                    characterData: true,
                    attributes: false
                });

                const pollInterval = setInterval(() => {
                    if (!popup.isConnected) {
                        clearInterval(pollInterval);
                        observer.disconnect();
                        if (!found) resolve();
                        return;
                    }

                    checkAndResolve();

                    localAttempts++;
                    if (localAttempts >= maxAttempts) {
                        clearInterval(pollInterval);
                        observer.disconnect();
                        if (!found) resolve();
                    }
                }, 50);

                setTimeout(() => {
                    if (!found) {
                        clearInterval(pollInterval);
                        observer.disconnect();
                        resolve();
                    }
                }, maxAttempts * 100);
            });
        }

        if (usernameSpan) {
            if (usernameSpan.nextSibling && (usernameSpan.nextSibling as HTMLElement).dataset?.twitterFlag === 'true') {
                popup.dataset.flagAdded = 'true';
                return;
            }

            try {
                if (!usernameSpan.isConnected) {
                    return;
                }

                if (usernameSpan.after) {
                    usernameSpan.after(flagSpan);
                    popup.dataset.flagAdded = 'true';
                    processingUsernames.delete(screenName);

                    setTimeout(() => {
                        if (!popup.querySelector('[data-twitter-flag]')) {
                            popup.dataset.flagAdded = '';
                        }
                    }, 100);

                    return;
                } else if (usernameSpan.parentElement) {
                    usernameSpan.parentElement.insertBefore(flagSpan, usernameSpan.nextSibling);
                    popup.dataset.flagAdded = 'true';
                    processingUsernames.delete(screenName);

                    setTimeout(() => {
                        if (!popup.querySelector('[data-twitter-flag]')) {
                            popup.dataset.flagAdded = '';
                        }
                    }, 100);

                    return;
                }
            } catch (e) {
                // Silent fail
            }
        } else {
            if (popup.isConnected) {
                pendingFlagInsertions.set(screenName, { flag, location });
            }
        }

        if (!popup.dataset.flagAdded || popup.dataset.flagAdded !== 'true') {
            const usernameLink2 = popup.querySelector(`a[href="/${screenName}"], a[href^="/${screenName}?"]`) as HTMLAnchorElement;
            if (usernameLink2) {
                const existingFlag = usernameLink2.closest('[data-testid="UserName"], [data-testid="User-Name"]')?.querySelector('[data-twitter-flag]');
                if (existingFlag) {
                    popup.dataset.flagAdded = 'true';
                    processingUsernames.delete(screenName);
                    return;
                }

                let container = usernameLink2.parentElement;
                let inserted = false;

                while (container && container !== popup) {
                    const containerText = container.textContent || '';
                    if (containerText.includes(`@${screenName}`)) {
                        if (container.querySelector('[data-twitter-flag]')) {
                            popup.dataset.flagAdded = 'true';
                            processingUsernames.delete(screenName);
                            return;
                        }

                        try {
                            if (usernameLink2.after) {
                                usernameLink2.after(flagSpan.cloneNode(true) as HTMLElement);
                                inserted = true;
                                break;
                            }
                        } catch (e) {
                            // Silent fail
                        }

                        if (!inserted && usernameLink2.parentElement) {
                            try {
                                usernameLink2.parentElement.insertBefore(flagSpan.cloneNode(true) as HTMLElement, usernameLink2.nextSibling);
                                inserted = true;
                                break;
                            } catch (e) {
                                // Silent fail
                            }
                        }

                        if (!inserted) {
                            try {
                                container.appendChild(flagSpan.cloneNode(true) as HTMLElement);
                                inserted = true;
                                break;
                            } catch (e) {
                                // Silent fail
                            }
                        }
                    }
                    container = container.parentElement;
                }

                if (inserted) {
                    popup.dataset.flagAdded = 'true';
                    processingUsernames.delete(screenName);
                    return;
                }
            }
        }

        if (!popup.dataset.flagAdded || popup.dataset.flagAdded !== 'true') {
            try {
                popup.appendChild(flagSpan.cloneNode(true) as HTMLElement);
                popup.dataset.flagAdded = 'true';
                processingUsernames.delete(screenName);
                return;
            } catch (e) {
                // Silent fail
            }
        }

        popup.dataset.flagAdded = 'failed';
        processingUsernames.delete(screenName);
    } catch (error) {
        popup.dataset.flagAdded = 'failed';
        processingUsernames.delete(screenName);
    }
}

export function checkPendingFlagInsertion(popup: HTMLElement, screenName: string) {
    const pending = pendingFlagInsertions.get(screenName);
    if (pending) {
        pendingFlagInsertions.delete(screenName);

        const flagSpan = document.createElement('span');
        flagSpan.textContent = ` ${pending.flag} ${pending.location}`;
        flagSpan.setAttribute('data-twitter-flag', 'true');
        flagSpan.style.marginLeft = '4px';
        flagSpan.style.marginRight = '4px';
        flagSpan.style.display = 'inline';
        flagSpan.style.color = 'inherit';
        flagSpan.style.verticalAlign = 'middle';

        setTimeout(async () => {
            if (!popup.isConnected) {
                return;
            }

            const usernameLinks = Array.from(popup.querySelectorAll(`a[href="/${screenName}"], a[href^="/${screenName}?"]`)) as HTMLAnchorElement[];

            for (const link of usernameLinks) {
                const linkText = link.textContent?.trim() || '';
                const hasAriaHidden = link.getAttribute('aria-hidden') === 'true';
                const hasImg = link.querySelector('img') !== null;

                if (hasAriaHidden || hasImg) continue;

                if (linkText === `@${screenName}` || (linkText.startsWith('@') && linkText.includes(screenName))) {
                    const usernameSpan = Array.from(link.querySelectorAll('span')).find(span => {
                        const text = span.textContent?.trim();
                        return text === `@${screenName}`;
                    });

                    if (usernameSpan) {
                        if (usernameSpan.after) {
                            usernameSpan.after(flagSpan.cloneNode(true) as HTMLElement);
                            popup.dataset.flagAdded = 'true';
                            return;
                        }
                    }
                }
            }
        }, 150);
    }
}
