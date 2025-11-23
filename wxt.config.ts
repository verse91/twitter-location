import { defineConfig } from 'wxt';

export default defineConfig({
    manifest: {
        name: 'Twitter Location',
        description: 'Shows country flags next to Twitter usernames',
        permissions: ['storage', 'tabs'],
        host_permissions: ['*://x.com/*', '*://twitter.com/*'],
        web_accessible_resources: [
            {
                resources: ['page.js'],
                matches: ['*://x.com/*', '*://twitter.com/*']
            }
        ],
    },
    modules: ['@wxt-dev/module-react'],
});
