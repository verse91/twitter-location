import { locationCache } from './cache';
import { findProfilePopup } from './dom-utils';
import { addFlagToPopup, checkPendingFlagInsertion, getPendingFlagInsertions } from './flag-insertion';

const hoverTimeouts = new Map<string, NodeJS.Timeout>();
const popupObservers = new Map<string, MutationObserver>();

export function getHoverTimeouts() {
    return hoverTimeouts;
}

function watchForPopup(screenName: string, extensionEnabled: boolean) {
    if (popupObservers.has(screenName)) {
        return;
    }

    const observer = new MutationObserver(() => {
        if (!extensionEnabled) {
            observer.disconnect();
            popupObservers.delete(screenName);
            return;
        }

        const popup = findProfilePopup();
        if (!popup) return;

        const existingFlag = popup.querySelector('[data-twitter-flag]');
        if (existingFlag) {
            observer.disconnect();
            popupObservers.delete(screenName);
            return;
        }

        const usernameLink = popup.querySelector(`a[href="/${screenName}"], a[href^="/${screenName}?"]`) as HTMLAnchorElement;
        if (!usernameLink) return;

        const hasCache = locationCache.has(screenName) && locationCache.get(screenName) !== null;
        const pendingFlagInsertions = getPendingFlagInsertions();

        if (pendingFlagInsertions.has(screenName)) {
            checkPendingFlagInsertion(popup, screenName);
            observer.disconnect();
            popupObservers.delete(screenName);
            return;
        }

        if (hasCache) {
            requestAnimationFrame(() => {
                addFlagToPopup(popup, screenName);
            });
            observer.disconnect();
            popupObservers.delete(screenName);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    popupObservers.set(screenName, observer);

    setTimeout(() => {
        observer.disconnect();
        popupObservers.delete(screenName);
    }, 5000);
}

export function handleUsernameHover(link: HTMLAnchorElement, screenName: string, extensionEnabled: boolean) {
    const existingTimeout = hoverTimeouts.get(screenName);
    if (existingTimeout) {
        clearTimeout(existingTimeout);
    }

    const linkText = link.textContent?.trim() || '';
    const isDisplayNameLink = !linkText.startsWith('@') && linkText !== `@${screenName}`;

    if (isDisplayNameLink) {
        const userNameContainer = link.closest('[data-testid="UserName"], [data-testid="User-Name"]');
        if (userNameContainer) {
            const usernameLink = userNameContainer.querySelector(`a[href="/${screenName}"], a[href^="/${screenName}?"]`) as HTMLAnchorElement;
            if (usernameLink && usernameLink !== link) {
                const usernameLinkText = usernameLink.textContent?.trim() || '';
                if (usernameLinkText === `@${screenName}` || usernameLinkText.startsWith('@')) {
                    requestAnimationFrame(() => {
                        usernameLink.dispatchEvent(new MouseEvent('mouseenter', {
                            bubbles: true,
                            cancelable: true,
                            view: window,
                            relatedTarget: link
                        }));

                        usernameLink.dispatchEvent(new MouseEvent('mouseover', {
                            bubbles: true,
                            cancelable: true,
                            view: window,
                            relatedTarget: link
                        }));
                    });
                }
            }
        }
    }

    watchForPopup(screenName, extensionEnabled);

    const debounceTime = 0;
    const timeout = setTimeout(async () => {
        if (!extensionEnabled) return;

        const popup = findProfilePopup();
        if (!popup) return;

        const existingFlag = popup.querySelector('[data-twitter-flag]');
        if (existingFlag) {
            return;
        }

        if (popup.dataset.flagAdded === 'true') {
            popup.dataset.flagAdded = '';
        }

        const hasCache = locationCache.has(screenName) && locationCache.get(screenName) !== null;
        const pendingFlagInsertions = getPendingFlagInsertions();

        if (pendingFlagInsertions.has(screenName)) {
            checkPendingFlagInsertion(popup, screenName);
            return;
        }

        if (hasCache) {
            requestAnimationFrame(() => {
                addFlagToPopup(popup, screenName);
            });

            let mutationCheckCount = 0;
            const maxMutationChecks = 100;

            const mutationObserver = new MutationObserver(() => {
                if (!popup.isConnected) {
                    mutationObserver.disconnect();
                    return;
                }

                mutationCheckCount++;

                const existingFlag = popup.querySelector('[data-twitter-flag]');
                if (!existingFlag && popup.dataset.flagAdded !== 'true') {
                    popup.dataset.flagAdded = '';
                    requestAnimationFrame(() => {
                        addFlagToPopup(popup, screenName).catch(() => {
                            // Silent fail
                        });
                    });
                }

                if (mutationCheckCount >= maxMutationChecks) {
                    mutationObserver.disconnect();
                }
            });

            mutationObserver.observe(popup, {
                childList: true,
                subtree: true,
                characterData: true
            });

            setTimeout(() => {
                mutationObserver.disconnect();
            }, 10000);
        } else {
            const links = popup.querySelectorAll(`a[href="/${screenName}"], a[href^="/${screenName}?"]`);
            if (links.length > 0) {
                requestAnimationFrame(() => {
                    addFlagToPopup(popup, screenName);
                });
            }

            let mutationCheckCount = 0;
            const maxMutationChecks = 100;

            const mutationObserver = new MutationObserver(() => {
                if (!popup.isConnected) {
                    mutationObserver.disconnect();
                    return;
                }

                mutationCheckCount++;

                const existingFlag = popup.querySelector('[data-twitter-flag]');
                if (!existingFlag && popup.dataset.flagAdded !== 'true') {
                    popup.dataset.flagAdded = '';
                    requestAnimationFrame(() => {
                        addFlagToPopup(popup, screenName).catch(() => {
                            // Silent fail
                        });
                    });
                }

                if (mutationCheckCount >= maxMutationChecks) {
                    mutationObserver.disconnect();
                }
            });

            mutationObserver.observe(popup, {
                childList: true,
                subtree: true,
                characterData: true
            });

            setTimeout(() => {
                mutationObserver.disconnect();
            }, 10000);
        }
    }, debounceTime);

    hoverTimeouts.set(screenName, timeout);
}

export function handleUsernameLeave(screenName: string) {
    const timeout = hoverTimeouts.get(screenName);
    if (timeout) {
        clearTimeout(timeout);
        hoverTimeouts.delete(screenName);
    }

    const observer = popupObservers.get(screenName);
    if (observer) {
        observer.disconnect();
        popupObservers.delete(screenName);
    }
}

export function handleAvatarHover(avatarElement: HTMLElement, screenName: string, extensionEnabled: boolean) {
    const existingTimeout = hoverTimeouts.get(screenName);
    if (existingTimeout) {
        clearTimeout(existingTimeout);
    }

    const userNameContainer = avatarElement.closest('[data-testid="UserName"], [data-testid="User-Name"]');

    if (userNameContainer) {
        const usernameLink = userNameContainer.querySelector(`a[href="/${screenName}"], a[href^="/${screenName}?"]`) as HTMLAnchorElement;

        if (usernameLink && usernameLink !== avatarElement) {
            const usernameLinkText = usernameLink.textContent?.trim() || '';

            if (usernameLinkText === `@${screenName}` || usernameLinkText.startsWith('@')) {
                requestAnimationFrame(() => {
                    usernameLink.dispatchEvent(new MouseEvent('mouseenter', {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        relatedTarget: avatarElement
                    }));

                    usernameLink.dispatchEvent(new MouseEvent('mouseover', {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        relatedTarget: avatarElement
                    }));
                });
            }
        }
    }

    watchForPopup(screenName, extensionEnabled);

    const debounceTime = 0;
    const timeout = setTimeout(async () => {
        if (!extensionEnabled) return;

        const popup = findProfilePopup();
        if (!popup) return;

        if (!popup.isConnected) {
            return;
        }

        const existingFlag = popup.querySelector('[data-twitter-flag]');
        if (existingFlag) {
            return;
        }

        if (popup.dataset.flagAdded === 'true') {
            popup.dataset.flagAdded = '';
        }

        const hasCache = locationCache.has(screenName) && locationCache.get(screenName) !== null;
        const pendingFlagInsertions = getPendingFlagInsertions();

        if (pendingFlagInsertions.has(screenName)) {
            checkPendingFlagInsertion(popup, screenName);
            return;
        }

        if (hasCache) {
            requestAnimationFrame(() => {
                addFlagToPopup(popup, screenName);
            });

            let mutationCheckCount = 0;
            const maxMutationChecks = 100;

            const mutationObserver = new MutationObserver(() => {
                if (!popup.isConnected) {
                    mutationObserver.disconnect();
                    return;
                }

                mutationCheckCount++;

                const existingFlag = popup.querySelector('[data-twitter-flag]');
                if (!existingFlag && popup.dataset.flagAdded !== 'true') {
                    popup.dataset.flagAdded = '';
                    requestAnimationFrame(() => {
                        addFlagToPopup(popup, screenName).catch(() => { });
                    });
                }

                if (mutationCheckCount >= maxMutationChecks) {
                    mutationObserver.disconnect();
                }
            });

            mutationObserver.observe(popup, {
                childList: true,
                subtree: true,
                characterData: true
            });

            setTimeout(() => {
                mutationObserver.disconnect();
            }, 10000);
        } else {
            const links = popup.querySelectorAll(`a[href="/${screenName}"], a[href^="/${screenName}?"]`);
            if (links.length > 0) {
                requestAnimationFrame(() => {
                    addFlagToPopup(popup, screenName);
                });
            }

            let mutationCheckCount = 0;
            const maxMutationChecks = 100;

            const mutationObserver = new MutationObserver(() => {
                if (!popup.isConnected) {
                    mutationObserver.disconnect();
                    return;
                }

                mutationCheckCount++;

                const existingFlag = popup.querySelector('[data-twitter-flag]');
                if (!existingFlag && popup.dataset.flagAdded !== 'true') {
                    popup.dataset.flagAdded = '';
                    requestAnimationFrame(() => {
                        addFlagToPopup(popup, screenName).catch(() => { });
                    });
                }

                if (mutationCheckCount >= maxMutationChecks) {
                    mutationObserver.disconnect();
                }
            });

            mutationObserver.observe(popup, {
                childList: true,
                subtree: true,
                characterData: true
            });

            setTimeout(() => {
                mutationObserver.disconnect();
            }, 10000);
        }
    }, debounceTime);

    hoverTimeouts.set(screenName, timeout);
}
