import { extractUsernameFromLink, extractUsernameFromAvatar } from './dom-utils';
import { handleUsernameHover, handleUsernameLeave, handleAvatarHover } from './hover-handlers';

export function setupHoverListeners(extensionEnabled: boolean) {
    if (!extensionEnabled) return;

    const userNameContainers = document.querySelectorAll('[data-testid="UserName"], [data-testid="User-Name"]');
    const processedLinks = new Set<HTMLAnchorElement>();
    const processedAvatars = new Set<HTMLElement>();

    for (const container of userNameContainers) {
        const links = container.querySelectorAll('a[href^="/"]');
        const linksArray = Array.from(links) as HTMLAnchorElement[];

        for (const anchor of linksArray) {
            const screenName = extractUsernameFromLink(anchor);

            if (!screenName) continue;
            if (processedLinks.has(anchor)) continue;
            if (anchor.dataset.hoverListenerAdded === 'true') continue;

            processedLinks.add(anchor);
            anchor.dataset.hoverListenerAdded = 'true';

            anchor.addEventListener('mouseenter', () => {
                handleUsernameHover(anchor, screenName, extensionEnabled);
            });

            anchor.addEventListener('mouseleave', () => {
                handleUsernameLeave(screenName);
            });
        }

        const avatarContainers = container.querySelectorAll('[data-testid*="Avatar"], [data-testid*="Tweet-User-Avatar"]');

        for (const avatarContainer of avatarContainers) {
            const containerEl = avatarContainer as HTMLElement;
            const avatarLink = containerEl.querySelector('a[href^="/"]') as HTMLAnchorElement;

            if (avatarLink) {
                const screenName = extractUsernameFromLink(avatarLink);
                if (!screenName) continue;
                if (processedLinks.has(avatarLink)) continue;
                if (avatarLink.dataset.hoverListenerAdded === 'true') continue;

                processedLinks.add(avatarLink);
                avatarLink.dataset.hoverListenerAdded = 'true';

                avatarLink.addEventListener('mouseenter', () => {
                    handleUsernameHover(avatarLink, screenName, extensionEnabled);
                });

                avatarLink.addEventListener('mouseleave', () => {
                    handleUsernameLeave(screenName);
                });
            }

            if (!processedAvatars.has(containerEl)) {
                const screenName = avatarLink ? extractUsernameFromLink(avatarLink) : extractUsernameFromAvatar(containerEl);
                if (!screenName) continue;
                if (containerEl.dataset.hoverListenerAdded === 'true') continue;

                processedAvatars.add(containerEl);
                containerEl.dataset.hoverListenerAdded = 'true';

                containerEl.addEventListener('mouseenter', (e) => {
                    const target = e.target as HTMLElement;
                    if (!avatarLink || (target !== avatarLink && !avatarLink.contains(target))) {
                        handleAvatarHover(containerEl, screenName, extensionEnabled);
                    }
                });

                containerEl.addEventListener('mouseleave', () => {
                    handleUsernameLeave(screenName);
                });
            }
        }

        const avatarImages = container.querySelectorAll('img[src*="profile_images"], img[src*="twimg.com"]');
        for (const avatarImg of avatarImages) {
            const imgEl = avatarImg as HTMLElement;
            const imgLink = imgEl.closest('a[href^="/"]') as HTMLAnchorElement;

            if (imgLink && !processedLinks.has(imgLink)) {
                const screenName = extractUsernameFromLink(imgLink);
                if (screenName && imgLink.dataset.hoverListenerAdded !== 'true') {
                    processedLinks.add(imgLink);
                    imgLink.dataset.hoverListenerAdded = 'true';

                    imgLink.addEventListener('mouseenter', () => {
                        handleUsernameHover(imgLink, screenName, extensionEnabled);
                    });

                    imgLink.addEventListener('mouseleave', () => {
                        handleUsernameLeave(screenName);
                    });
                }
            }

            if (!processedAvatars.has(imgEl)) {
                const screenName = imgLink ? extractUsernameFromLink(imgLink) : extractUsernameFromAvatar(imgEl);
                if (!screenName) continue;
                if (imgEl.dataset.hoverListenerAdded === 'true') continue;

                processedAvatars.add(imgEl);
                imgEl.dataset.hoverListenerAdded = 'true';

                imgEl.addEventListener('mouseenter', (e) => {
                    const target = e.target as HTMLElement;
                    if (!imgLink || (target !== imgLink && !imgLink.contains(target))) {
                        handleAvatarHover(imgEl, screenName, extensionEnabled);
                    }
                });

                imgEl.addEventListener('mouseleave', () => {
                    handleUsernameLeave(screenName);
                });
            }
        }
    }

    const allLinks = document.querySelectorAll('a[href^="/"]');
    for (const link of allLinks) {
        const anchor = link as HTMLAnchorElement;
        if (processedLinks.has(anchor)) continue;
        if (anchor.dataset.hoverListenerAdded === 'true') continue;

        const screenName = extractUsernameFromLink(anchor);
        if (!screenName) continue;

        processedLinks.add(anchor);
        anchor.dataset.hoverListenerAdded = 'true';

        anchor.addEventListener('mouseenter', () => {
            handleUsernameHover(anchor, screenName, extensionEnabled);
        });

        anchor.addEventListener('mouseleave', () => {
            handleUsernameLeave(screenName);
        });
    }

    const allAvatarContainers = document.querySelectorAll('[data-testid*="Avatar"], [data-testid*="Tweet-User-Avatar"]');

    for (const avatarContainer of allAvatarContainers) {
        const containerEl = avatarContainer as HTMLElement;
        const avatarLink = containerEl.querySelector('a[href^="/"]') as HTMLAnchorElement;

        if (avatarLink) {
            const screenName = extractUsernameFromLink(avatarLink);
            if (!screenName) continue;
            if (processedLinks.has(avatarLink)) continue;
            if (avatarLink.dataset.hoverListenerAdded === 'true') continue;

            processedLinks.add(avatarLink);
            avatarLink.dataset.hoverListenerAdded = 'true';

            avatarLink.addEventListener('mouseenter', () => {
                handleUsernameHover(avatarLink, screenName, extensionEnabled);
            });

            avatarLink.addEventListener('mouseleave', () => {
                handleUsernameLeave(screenName);
            });
        }

        if (!processedAvatars.has(containerEl)) {
            const screenName = avatarLink ? extractUsernameFromLink(avatarLink) : extractUsernameFromAvatar(containerEl);
            if (!screenName) continue;
            if (containerEl.dataset.hoverListenerAdded === 'true') continue;

            processedAvatars.add(containerEl);
            containerEl.dataset.hoverListenerAdded = 'true';

            containerEl.addEventListener('mouseenter', (e) => {
                const target = e.target as HTMLElement;
                if (!avatarLink || (target !== avatarLink && !avatarLink.contains(target))) {
                    handleAvatarHover(containerEl, screenName, extensionEnabled);
                }
            });

            containerEl.addEventListener('mouseleave', () => {
                handleUsernameLeave(screenName);
            });
        }
    }

    const allAvatarImages = document.querySelectorAll('img[src*="profile_images"], img[src*="twimg.com"]');
    for (const avatarImg of allAvatarImages) {
        const imgEl = avatarImg as HTMLElement;
        const imgLink = imgEl.closest('a[href^="/"]') as HTMLAnchorElement;

        if (imgLink && !processedLinks.has(imgLink)) {
            const screenName = extractUsernameFromLink(imgLink);
            if (screenName && imgLink.dataset.hoverListenerAdded !== 'true') {
                processedLinks.add(imgLink);
                imgLink.dataset.hoverListenerAdded = 'true';

                imgLink.addEventListener('mouseenter', () => {
                    handleUsernameHover(imgLink, screenName, extensionEnabled);
                });

                imgLink.addEventListener('mouseleave', () => {
                    handleUsernameLeave(screenName);
                });
            }
        }

        if (!processedAvatars.has(imgEl)) {
            const screenName = imgLink ? extractUsernameFromLink(imgLink) : extractUsernameFromAvatar(imgEl);
            if (!screenName) continue;
            if (imgEl.dataset.hoverListenerAdded === 'true') continue;

            processedAvatars.add(imgEl);
            imgEl.dataset.hoverListenerAdded = 'true';

            imgEl.addEventListener('mouseenter', (e) => {
                const target = e.target as HTMLElement;
                if (!imgLink || (target !== imgLink && !imgLink.contains(target))) {
                    handleAvatarHover(imgEl, screenName, extensionEnabled);
                }
            });

            imgEl.addEventListener('mouseleave', () => {
                handleUsernameLeave(screenName);
            });
        }
    }
}
