import { Link } from '@inertiajs/react';
import { route } from '../../Lib/route';

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
const ICON = {
    inbox: <path d="M2.6 11.4h3.5l1.2 2.1h5.4l1.2-2.1h3.5M3.6 11.4 5.4 4.6h9.2l1.8 6.8v4.2H3.6z" {...stroke} />,
    sent: <path d="M17.4 2.6 9 11M17.4 2.6l-5.4 15.6-3-7-7-3z" {...stroke} />,
    drafts: <path d="M13.6 2.9a1.9 1.9 0 0 1 2.7 2.7l-8.8 8.8-3.6.9.9-3.6z" {...stroke} />,
    archive: <><rect x="2.4" y="3.4" width="15.2" height="3.7" rx="1.2" {...stroke} /><path d="M3.8 7.1v8a1.3 1.3 0 0 0 1.3 1.3h9.8a1.3 1.3 0 0 0 1.3-1.3v-8M8 10.6h4" {...stroke} /></>,
    spam: <><path d="M10 2.4 17.6 16H2.4z" {...stroke} /><path d="M10 7.6v3.4" {...stroke} /></>,
    trash: <path d="M3.2 5.2h13.6M7.4 5.2V3.4h5.2v1.8M5 5.2v11a1.3 1.3 0 0 0 1.3 1.3h7.4a1.3 1.3 0 0 0 1.3-1.3v-11" {...stroke} />,
    user: <path d="M4.6 2.6h10.8v14.8l-2.2-1.4-2.2 1.4-2.2-1.4-2.2 1.4-2-1.3z" {...stroke} />,
    contacts: <><circle cx="10" cy="7" r="3" {...stroke} /><path d="M4.2 16.6c0-2.8 2.5-4.6 5.8-4.6s5.8 1.8 5.8 4.6" {...stroke} /></>,
    settings: <circle cx="10" cy="10" r="2.6" {...stroke} />,
    device: <rect x="5.6" y="2.4" width="8.8" height="15.2" rx="1.8" {...stroke} />,
    dashboard: <><rect x="2.5" y="2.5" width="6.4" height="6.4" rx="1.6" {...stroke} /><rect x="11.1" y="2.5" width="6.4" height="6.4" rx="1.6" {...stroke} /><rect x="2.5" y="11.1" width="6.4" height="6.4" rx="1.6" {...stroke} /><rect x="11.1" y="11.1" width="6.4" height="6.4" rx="1.6" {...stroke} /></>,
};

function Icon({ name }) {
    return <svg className="fi" width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">{ICON[name]}</svg>;
}

/*
 * Folders with their unread counts, the compose button, and the account links.
 * `current` is the open folder id, or 'contacts' / 'settings' on those pages.
 * `onCompose` opens the popup composer; without it Compose goes to the full page.
 */
export default function FolderNav({ folders, current, onCompose, children }) {
    const system = folders.filter((folder) => folder.kind !== 'user');
    const user = folders.filter((folder) => folder.kind === 'user');
    const link = (folder) => (
        <Link key={folder.id} href={route('mail', { folder: folder.id })} aria-current={current === folder.id ? 'page' : undefined}>
            <Icon name={folder.kind} />
            {folder.name}
            {folder.unread > 0 && <span className="cnt">{folder.unread}</span>}
        </Link>
    );

    return (
        <nav className="folders" aria-label="Folders">
            {onCompose
                ? <button type="button" className="btn btn-white full" onClick={onCompose}>Compose</button>
                : <Link className="btn btn-white full" href={route('mail.compose')}>Compose</Link>}
            {system.map(link)}
            <p className="side-ttl folders-gap">Your folders</p>
            {user.map(link)}
            <p className="side-ttl folders-gap">Account</p>
            <Link href={route('mail.contacts')} aria-current={current === 'contacts' ? 'page' : undefined}><Icon name="contacts" />Contacts</Link>
            <Link href={route('mail.settings')} aria-current={current === 'settings' ? 'page' : undefined}><Icon name="settings" />Settings</Link>
            <Link href={route('setup.device')}><Icon name="device" />Set up a device</Link>
            {children}
        </nav>
    );
}
