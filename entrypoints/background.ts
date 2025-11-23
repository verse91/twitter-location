export default defineBackground({
    main() {
        browser.runtime.onMessage.addListener((message) => {
            if (message.type === 'GET_LOCATION') {
                console.log('Location request for:', message.username);
            }
            return true;
        });

        browser.action.onClicked.addListener(() => {
            browser.runtime.openOptionsPage();
        });

        browser.action.setBadgeText({ text: '✓' });
        browser.action.setBadgeBackgroundColor({ color: '#4CAF50' });
    },
});
