import '../css/app.css';
import { createInertiaApp, router } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import './echo';
import { ToastProvider } from './Components/ui/Toast';
import { hydratePlans } from './fixtures/plans';

// Pages load on demand so the public site never ships dashboard code.
const pages = import.meta.glob('./Pages/**/*.jsx');

createInertiaApp({
    resolve: async (name) => {
        const load = pages[`./Pages/${name}.jsx`];
        if (!load) {
            throw new Error(`Inertia page not found: ${name}`);
        }
        return load();
    },
    setup({ el, App, props }) {
        // Numbers come from the server's plans table; see hydratePlans.
        hydratePlans(props.initialPage.props.catalog);
        router.on('navigate', (event) => hydratePlans(event.detail.page.props.catalog));
        createRoot(el).render(
            <ToastProvider>
                <App {...props} />
            </ToastProvider>,
        );
    },
    // Slim top progress bar on navigation. Delay stops it flashing on instant navigations.
    // CSS lives in components.css: a style element injected by script would be blocked by the CSP.
    progress: {
        color: '#0A468A',
        includeCSS: false,
        delay: 180,
    },
});
