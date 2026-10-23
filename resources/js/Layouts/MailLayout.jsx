import { Link, router, usePage } from '@inertiajs/react';
import { Search as SearchIcon } from 'lucide-react';
import { useState } from 'react';
import AccountMenu from '../Components/domain/AccountMenu';
import FolderNav from '../Components/mail/FolderNav';
import Seo from '../Components/seo/Seo';
import Logo from '../Components/ui/Logo';
import Meter from '../Components/ui/Meter';
import { foldersWithCounts } from '../Lib/mail';
import { formatGb } from '../Lib/format';
import { route } from '../Lib/route';

/*
 * Shell for webmail. The active mailbox and its domain come from the server
 * (MailController@shared). The inbox, compose, search and contacts pages
 * carry no fictional content: each renders an honest empty state until the
 * mail server is picked. The quota meter, mailbox address and account menu
 * are live. Folder sidebar lists the standard IMAP folders with zero counts
 * until a server supplies real totals. Search submits the query to the search
 * page.
 */
export default function MailLayout({ page, title, current, folders, onCompose, searchLabel = 'Search mail', searchValue = '', searchRoute = 'mail.search', children }) {
    const { mailbox, domain } = usePage().props;
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
                                <SearchIcon size={15} strokeWidth={1.75} aria-hidden="true" />
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

                <div className="mail-body">
                    <FolderNav folders={list} current={current} onCompose={onCompose}>
                        <div className="storage-box">
                            <p className="storage-ttl">This mailbox</p>
                            <p className="storage-fig">
                                <b>{formatGb(mailbox.usedGb)}</b>
                                <span>of {formatGb(mailbox.quotaGb)}</span>
                            </p>
                            <Meter used={mailbox.usedGb} total={mailbox.quotaGb} label={`${formatGb(mailbox.usedGb)} of ${formatGb(mailbox.quotaGb)} used`} />
                            <p className="storage-sub">
                                Your share of the {formatGb(domain.poolGb)} that <span className="mono">{domain.name}</span> holds. Ask whoever administers the domain if you need more.
                            </p>
                        </div>
                    </FolderNav>
                    {children}
                </div>
            </div>
        </div>
    );
}
