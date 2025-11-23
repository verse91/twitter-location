import { browser } from 'wxt/browser';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { loadCache, saveCache, locationCache } from '@/utils/cache';
import { setRateLimitResetTime } from '@/utils/api';
import { removeAllFlags, findProfilePopup, extractUsernameFromLink } from '@/utils/dom-utils';
import { addFlagToPopup } from '@/utils/flag-insertion';
import { setupHoverListeners } from '@/utils/event-listeners';

export default defineContentScript({
    matches: ['*://x.com/*', '*://twitter.com/*'],
    runAt: 'document_start',
    main() {
        let extensionEnabled = true;
        const TOGGLE_KEY = 'extension_enabled';
        const DEFAULT_ENABLED = true;

        async function loadEnabledState() {
            try {
                const result = await browser.storage.local.get([TOGGLE_KEY]);
                extensionEnabled = result[TOGGLE_KEY] !== undefined ? result[TOGGLE_KEY] : DEFAULT_ENABLED;
            } catch (error) {
                extensionEnabled = DEFAULT_ENABLED;
            }
        }

        browser.runtime.onMessage.addListener((request: any) => {
            if (request.type === 'extensionToggle') {
                extensionEnabled = request.enabled;

                if (!extensionEnabled) {
                    removeAllFlags();
                }
            }
        });

        function injectPageScript() {
            const script = document.createElement('script');
            script.src = browser.runtime.getURL('page.js' as any);
            script.onload = () => {
                script.remove();
            };
            (document.head || document.documentElement).appendChild(script);

            window.addEventListener('message', (event) => {
                if (event.source !== window) return;
                if (event.data && event.data.type === '__rateLimitInfo') {
                    setRateLimitResetTime(event.data.resetTime);
                }
            });
        }

        function initObserver() {
            const observer = new MutationObserver((mutations) => {
                if (!extensionEnabled) return;

                let shouldSetupListeners = false;
                let popupAppeared = false;

                for (const mutation of mutations) {
                    if (mutation.addedNodes.length > 0) {
                        shouldSetupListeners = true;

                        for (const node of Array.from(mutation.addedNodes)) {
                            if (node instanceof HTMLElement) {
                                const hoverCardParent = node.querySelector?.('[data-testid="hoverCardParent"]') ||
                                    (node.matches?.('[data-testid="hoverCardParent"]') ? node : null);
                                if (hoverCardParent) {
                                    const popup = hoverCardParent.querySelector('[data-testid="UserHoverCard"], [data-testid="HoverCard"]');
                                    if (popup) {
                                        popupAppeared = true;
                                    }
                                }
                            }
                        }
                    }
                }

                if (shouldSetupListeners) {
                    setTimeout(() => setupHoverListeners(extensionEnabled), 100);
                }

                if (popupAppeared) {
                    requestAnimationFrame(() => {
                        const popup = findProfilePopup();
                        if (popup) {
                            const usernameLink = popup.querySelector('a[href^="/"]');
                            if (usernameLink) {
                                const screenName = extractUsernameFromLink(usernameLink as HTMLAnchorElement);
                                if (screenName && !popup.dataset.flagAdded) {
                                    addFlagToPopup(popup, screenName);
                                }
                            }
                        }
                    });
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        async function init() {
            await loadEnabledState();
            await loadCache();

            if (!extensionEnabled) {
                return;
            }

            injectPageScript();

            setTimeout(() => {
                setupHoverListeners(extensionEnabled);
                initObserver();
            }, 2000);

            let lastUrl = location.href;
            new MutationObserver(() => {
                const url = location.href;
                if (url !== lastUrl) {
                    lastUrl = url;
                    setTimeout(() => setupHoverListeners(extensionEnabled), 1000);
                }
            }).observe(document, { subtree: true, childList: true });

            setInterval(saveCache, 30000);
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    },
});
