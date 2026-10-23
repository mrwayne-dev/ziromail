import { Search as SearchIcon } from 'lucide-react';
import MailLayout from '../../Layouts/MailLayout';

const SCOPES = [
    ['everywhere', 'Everywhere'],
    ['inbox', 'Inbox'],
    ['sent', 'Sent'],
    ['attachment', 'Has attachment'],
    ['year', 'This year'],
];

/*
 * Full-text search needs the mail server's index, which isn't connected yet.
 * The page shows a disabled search input and the scope chips the real UI will
 * carry, each with a tooltip saying why it can't be used right now.
 */
export default function Search() {
    const disabledTitle = 'Search is not connected yet. Full-text search needs the mail server’s index.';

    return (
        <MailLayout page="mail-search" title="Search" current="search" searchLabel="Search mail">
            <main className="results" id="main" aria-label="Search">
                <div className="res-top">
                    <h1>Search your mail</h1>
                    <label className="search search-disabled" title={disabledTitle} style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center', border: '1px solid var(--line-2)', borderRadius: 999, padding: '8px 14px', background: 'var(--paper-soft)', color: 'var(--tx-3)', maxWidth: 480 }}>
                        <SearchIcon size={15} strokeWidth={1.75} aria-hidden="true" />
                        <span className="sr-only">Search mail</span>
                        <input type="search" placeholder="Search mail" disabled aria-disabled="true" style={{ flex: 1, border: 0, background: 'transparent', color: 'inherit', font: 'inherit' }} />
                    </label>
                    <div className="scopes" role="group" aria-label="Narrow the search">
                        {SCOPES.map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                className="scope"
                                disabled
                                title={disabledTitle}
                                aria-pressed="false"
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mail-empty">
                    <SearchIcon size={40} strokeWidth={1.4} aria-hidden="true" />
                    <h2>Search isn&rsquo;t connected yet</h2>
                    <p>Full-text search needs the mail server&rsquo;s index. The scopes and operators you see here are what the real search will carry.</p>
                </div>
            </main>
        </MailLayout>
    );
}
