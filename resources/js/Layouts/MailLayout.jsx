import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AccountMenu from '../Components/domain/AccountMenu';
import FolderNav from '../Components/mail/FolderNav';
import Seo from '../Components/seo/Seo';
import Logo from '../Components/ui/Logo';
import Meter from '../Components/ui/Meter';
import PrototypeNotice from '../Components/ui/PrototypeNotice';
import { foldersWithCounts } from '../Lib/mail';
import { formatGb } from '../Lib/format';
import { route } from '../Lib/route';
import { mailboxFixture } from '../fixtures/mail';

/*
 * Shell for webmail: a header with search and the account menu, the folder rail
 * and the page's own panes. Folder counts come from `folders` (the Inbox page
 * passes its live ones); other pages show the stored counts. Searching goes to
 * the search page with the query in the URL.
 */
export default function MailLayout({ page, title, current, folders, onCompose, searchLabel = 'Search mail', searchValue = '', searchRoute = 'mail.search', children }) {
    const { quota, domain } = mailboxFixture;
    const [query, setQuery] = useState(searchValue);
    const list = folders ?? foldersWithCounts();

    function submit(event) {
        event.preventDefault();
        router.get(route(searchRoute), { q: query.trim() });
    }

    return (
        <div className={`pg-${page}`}>
            <Seo title={`${title} - Ziroemail`} description={title} noindex />
            <a className="skip-link" href="#main">Skip to content</a>
            <div className="mail-shell">
                <header className="mail-top">
                    <div className="wrap bar bar-wide">
                        <Link className="brand" href={route('home')} aria-label="Ziroemail home"><Logo variant="white" /></Link>
                        <form className="search-form" role="search" onSubmit={submit}>
                            <label className="search">
                                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="5.2" stroke="#8FA0B4" strokeWidth="1.6" /><path d="m11 11 3.2 3.2" stroke="#8FA0B4" strokeWidth="1.6" strokeLinecap="round" /></svg>
                                <span className="sr-only">{searchLabel}</span>
                                <input type="search" name="q" placeholder={searchLabel} value={query} onChange={(e) => setQuery(e.target.value)} />
                            </label>
                        </form>
                        <div className="app-hdr-end">
                            <AccountMenu links={[
                                { href: route('mail.settings'), label: 'Mailbox settings' },
                                { href: route('setup.device'), label: 'Set up another device' },
                                { href: route('dashboard'), label: 'Business dashboard' },
                            ]} />
                        </div>
                    </div>
                </header>

                <div className="mail-notice" role="region" aria-label="Preview notice"><PrototypeNotice /></div>

                <div className="mail-body">
                    <FolderNav folders={list} current={current} onCompose={onCompose}>
                        <div className="storage-box">
                            <div className="between"><span className="tiny strong">This mailbox</span><span className="tiny muted">{formatGb(quota.usedGb)} of {formatGb(quota.quotaGb)}</span></div>
                            <Meter used={quota.usedGb} total={quota.quotaGb} label={`${formatGb(quota.usedGb)} of ${formatGb(quota.quotaGb)} used`} />
                            <p className="tiny muted">Your share of the {quota.orgDomainPoolGb} GB that <span className="mono">{domain}</span> holds. Ask whoever administers the domain if you need more.</p>
                        </div>
                    </FolderNav>
                    {children}
                </div>
            </div>
        </div>
    );
}
