export function extractUsernameFromLink(link: HTMLAnchorElement): string | null {
    const href = link.getAttribute('href');
    if (!href) return null;

    const match = href.match(/^\/([^\/\?]+)/);
    if (!match || !match[1]) return null;

    const username = match[1];

    const excludedRoutes = ['home', 'explore', 'notifications', 'messages', 'i', 'compose', 'search', 'settings', 'bookmarks', 'lists', 'communities', 'hashtag'];
    if (excludedRoutes.includes(username) ||
        username.startsWith('hashtag') ||
        username.startsWith('search') ||
        username.includes('status') ||
        username.match(/^\d+$/) ||
        username.length === 0 ||
        username.length >= 20) {
        return null;
    }

    const isInUserNameContainer = link.closest('[data-testid="UserName"], [data-testid="User-Name"]');

    if (isInUserNameContainer) {
        return username;
    }

    const text = link.textContent?.trim() || '';
    if (text.startsWith('@') || text === `@${username}`) {
        return username;
    }

    const isAvatarLink = link.getAttribute('aria-hidden') === 'true' ||
        link.closest('[data-testid*="Avatar"]') !== null ||
        link.querySelector('img[src*="profile_images"], img[src*="twimg.com"]') !== null;

    if (isAvatarLink) {
        return username;
    }

    return null;
}

export function extractUsernameFromAvatar(avatarElement: HTMLElement): string | null {
    let avatarLink = avatarElement.closest('a[href^="/"]') as HTMLAnchorElement;

    if (avatarElement instanceof HTMLImageElement && avatarElement.parentElement) {
        const parentLink = avatarElement.parentElement.closest('a[href^="/"]') as HTMLAnchorElement;
        if (parentLink && !avatarLink) {
            avatarLink = parentLink;
        }
    }

    if (avatarLink) {
        const username = extractUsernameFromLink(avatarLink);
        if (username) return username;
    }

    const avatarContainer = avatarElement.closest('[data-testid*="Avatar"]');
    if (avatarContainer) {
        const linkInContainer = avatarContainer.querySelector('a[href^="/"]') as HTMLAnchorElement;
        if (linkInContainer) {
            const username = extractUsernameFromLink(linkInContainer);
            if (username) return username;
        }
    }

    const userNameContainer = avatarElement.closest('[data-testid="UserName"], [data-testid="User-Name"]');
    if (userNameContainer) {
        const usernameLinks = userNameContainer.querySelectorAll('a[href^="/"]');
        for (const link of Array.from(usernameLinks)) {
            const username = extractUsernameFromLink(link as HTMLAnchorElement);
            if (username) return username;
        }
    }

    let current: HTMLElement | null = avatarElement.parentElement;
    let depth = 0;
    while (current && depth < 10) {
        const link = current.querySelector('a[href^="/"]') as HTMLAnchorElement;
        if (link) {
            const username = extractUsernameFromLink(link);
            if (username) return username;
        }
        current = current.parentElement;
        depth++;
    }

    return null;
}

export function findProfilePopup(): HTMLElement | null {
    const selectors = [
        '[data-testid="UserHoverCard"]',
        '[data-testid="HoverCard"]'
    ];

    for (const selector of selectors) {
        const popup = document.querySelector(selector);
        if (popup && popup instanceof HTMLElement) {
            const rect = popup.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                const parent = popup.closest('[data-testid="hoverCardParent"]');
                if (parent) {
                    return popup;
                }
            }
        }
    }

    return null;
}

export function removeAllFlags() {
    const flags = document.querySelectorAll('[data-twitter-flag]');
    flags.forEach(flag => flag.remove());

    const containers = document.querySelectorAll('[data-flag-added]');
    containers.forEach(container => {
        delete (container as HTMLElement).dataset.flagAdded;
    });
}
