import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';

function Options() {
    const [settings, setSettings] = useState({
        enabled: true,
        showInTweets: true,
        showInProfiles: true,
        showInReplies: true,
        cacheExpiry: 24,
        apiDelay: 500,
    });

    const [saved, setSaved] = useState(false);

    useEffect(() => {
        browser.storage.local.get(['settings']).then((result) => {
            if (result.settings) {
                setSettings({ ...settings, ...result.settings });
            }
        });
    }, []);

    const saveSettings = async () => {
        await browser.storage.local.set({ settings });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const resetSettings = async () => {
        const defaultSettings = {
            enabled: true,
            showInTweets: true,
            showInProfiles: true,
            showInReplies: true,
            cacheExpiry: 24,
            apiDelay: 500,
        };
        setSettings(defaultSettings);
        await browser.storage.local.set({ settings: defaultSettings });
    };

    const exportData = async () => {
        const data = await browser.storage.local.get(null);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `twitter-location-backup-${Date.now()}.json`;
        a.click();
    };

    return (
        <div className="options">
            <header>
                <h1>Twitter Location Settings</h1>
            </header>

            <div className="container">
                <section className="section">
                    <h2>Display Options</h2>

                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={settings.showInTweets}
                            onChange={(e) => setSettings({ ...settings, showInTweets: e.target.checked })}
                        />
                        <span>Show flags in tweets</span>
                    </label>

                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={settings.showInProfiles}
                            onChange={(e) => setSettings({ ...settings, showInProfiles: e.target.checked })}
                        />
                        <span>Show flags in profiles</span>
                    </label>

                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={settings.showInReplies}
                            onChange={(e) => setSettings({ ...settings, showInReplies: e.target.checked })}
                        />
                        <span>Show flags in replies</span>
                    </label>
                </section>

                <section className="section">
                    <h2>Performance</h2>

                    <div className="input-group">
                        <label>Cache expiry (hours)</label>
                        <input
                            type="number"
                            min="1"
                            max="168"
                            value={settings.cacheExpiry}
                            onChange={(e) => setSettings({ ...settings, cacheExpiry: parseInt(e.target.value) })}
                        />
                    </div>

                    <div className="input-group">
                        <label>API delay (milliseconds)</label>
                        <input
                            type="number"
                            min="100"
                            max="2000"
                            step="100"
                            value={settings.apiDelay}
                            onChange={(e) => setSettings({ ...settings, apiDelay: parseInt(e.target.value) })}
                        />
                        <small>Delay between API requests to avoid rate limiting</small>
                    </div>
                </section>

                <section className="section">
                    <h2>Data Management</h2>

                    <div className="button-group">
                        <button onClick={exportData} className="btn-secondary">
                            Export Data
                        </button>
                    </div>
                </section>

                <div className="footer">
                    <button onClick={resetSettings} className="btn-secondary">
                        Reset to Defaults
                    </button>
                    <button onClick={saveSettings} className="btn-primary">
                        {saved ? '✓ Saved!' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Options />);
