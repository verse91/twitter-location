import { useState, useEffect } from 'react';
import { browser } from 'wxt/browser';
import './style.css';

const TOGGLE_KEY = 'extension_enabled';
const DEFAULT_ENABLED = true;
const CACHE_KEY = 'twitter_location_cache';

interface CachedLocation {
    location: string;
    expiry: number;
    cachedAt: number;
}

function App() {
    const [isEnabled, setIsEnabled] = useState(DEFAULT_ENABLED);
    const [status, setStatus] = useState('Extension is enabled');
    const [cachedLocations, setCachedLocations] = useState<Array<{ username: string; location: string }>>([]);

    useEffect(() => {
        browser.storage.local.get([TOGGLE_KEY]).then((result) => {
            const enabled = result[TOGGLE_KEY] !== undefined ? result[TOGGLE_KEY] : DEFAULT_ENABLED;
            setIsEnabled(enabled);
            updateStatus(enabled);
        });

        loadCachedLocations();

        browser.storage.onChanged.addListener((changes) => {
            if (changes[CACHE_KEY]) {
                loadCachedLocations();
            }
        });
    }, []);

    const loadCachedLocations = async () => {
        try {
            const result = await browser.storage.local.get(CACHE_KEY);
            if (result[CACHE_KEY]) {
                const cached = result[CACHE_KEY] as Record<string, CachedLocation>;
                const now = Date.now();

                const locations = Object.entries(cached)
                    .filter(([_, data]) => data.expiry && data.expiry > now && data.location !== null)
                    .map(([username, data]) => ({
                        username,
                        location: data.location,
                        cachedAt: data.cachedAt || 0
                    }))
                    .sort((a, b) => b.cachedAt - a.cachedAt);

                setCachedLocations(locations);
            }
        } catch (error) {
        }
    };

    const clearCache = async () => {
        try {
            await browser.storage.local.remove(CACHE_KEY);
            setCachedLocations([]);
        } catch (error) {
        }
    };

    const updateStatus = (enabled: boolean) => {
        if (enabled) {
            setStatus('Extension is enabled');
        } else {
            setStatus('Extension is disabled');
        }
    };

    const handleToggle = async () => {
        const result = await browser.storage.local.get([TOGGLE_KEY]);
        const currentState = result[TOGGLE_KEY] !== undefined ? result[TOGGLE_KEY] : DEFAULT_ENABLED;
        const newState = !currentState;

        await browser.storage.local.set({ [TOGGLE_KEY]: newState });
        setIsEnabled(newState);
        updateStatus(newState);

        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]?.id) {
            browser.tabs.sendMessage(tabs[0].id, {
                type: 'extensionToggle',
                enabled: newState
            }).catch(() => {
            });
        }
    };

    return (
        <div className="popup">
            <header>
                <h1>
                    <svg className="x-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.135H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Twitter Location
                </h1>
                <button className="settings-btn" onClick={() => {
                    browser.runtime.openOptionsPage?.();
                }} title="Settings">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </button>
            </header>
            <div className="content">
                <div className="toggle-section">
                    <div
                        id="toggleSwitch"
                        className={`toggle-switch ${isEnabled ? 'enabled' : ''}`}
                        onClick={handleToggle}
                    >
                        <div className="toggle-slider"></div>
                    </div>
                    <div
                        id="status"
                        className="status"
                        style={{ color: isEnabled ? '#1d9bf0' : '#536471' }}
                    >
                        {status}
                    </div>
                </div>

                <div className="cache-section">
                    <div className="cache-header">
                        <h2>Cached Locations ({cachedLocations.length})</h2>
                        {cachedLocations.length > 0 && (
                            <button className="clear-cache-btn" onClick={clearCache}>
                                Clear All
                            </button>
                        )}
                    </div>
                    {cachedLocations.length === 0 ? (
                        <div className="empty-cache">No cached locations yet</div>
                    ) : (
                        <div className="cache-list">
                            {cachedLocations.map(({ username, location }) => (
                                <div key={username} className="cache-item">
                                    <span className="cache-username">@{username}</span>
                                    <span className="cache-location">{location}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
