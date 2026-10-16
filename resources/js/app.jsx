import '../css/app.css';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { ToastProvider } from './Components/ui/Toast';

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
        createRoot(el).render(
            <ToastProvider>
                <App {...props} />
            </ToastProvider>,
        );
    },
    progress: {
        color: '#1066C6',
    },
});
