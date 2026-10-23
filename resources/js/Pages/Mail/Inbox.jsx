import { Inbox as InboxIcon, Plus } from 'lucide-react';
import { router } from '@inertiajs/react';
import Button from '../../Components/ui/Button';
import MailLayout from '../../Layouts/MailLayout';
import { IMAP_FOLDERS } from '../../Lib/mail';
import { route } from '../../Lib/route';

/*
 * No message store yet — the inbox renders a shell with the IMAP standard
 * folder list (no counts, nothing to open), an honest empty state, and a
 * compose FAB that routes to the full-page composer. Everything selection-
 * related and reading-pane related is gone until the mail server is picked.
 */
export default function Inbox() {
    const folders = IMAP_FOLDERS.map((folder) => ({ ...folder, total: 0, unread: 0 }));

    return (
        <MailLayout page="mail" title="Inbox" current="inbox" folders={folders}>
            <main className="list" id="main" aria-label="Message list">
                <div className="mail-empty">
                    <InboxIcon size={40} strokeWidth={1.4} aria-hidden="true" />
                    <h2>No messages yet</h2>
                    <p>Mail will land here once your mail server is connected. In the meantime your mailbox address, quota and settings are already live.</p>
                    <div className="btn-row no-grow" style={{ justifyContent: 'center', marginTop: 18 }}>
                        <Button variant="line" size="sm" href={route('mail.settings')}>Open settings</Button>
                    </div>
                </div>
            </main>

            <button type="button" className="fab" aria-label="Compose a message" onClick={() => router.visit(route('mail.compose'))}>
                <Plus size={22} strokeWidth={2} aria-hidden="true" />
            </button>
        </MailLayout>
    );
}
