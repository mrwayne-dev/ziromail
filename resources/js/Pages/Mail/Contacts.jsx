import { Users } from 'lucide-react';
import Button from '../../Components/ui/Button';
import MailLayout from '../../Layouts/MailLayout';
import { route } from '../../Lib/route';

/*
 * No contact store yet. Where contacts will live — a Mailcow address book
 * shared with every mail app, or a dedicated Ziroemail table — is still a
 * product decision. One honest empty state, a route to mailbox settings.
 */
export default function Contacts() {
    return (
        <MailLayout page="mail-contacts" title="Contacts" current="contacts" searchRoute="mail.contacts" searchLabel="Search contacts">
            <main className="cts" id="main" aria-label="Contacts">
                <div className="mail-empty">
                    <Users size={40} strokeWidth={1.4} aria-hidden="true" />
                    <h2>No contacts saved yet</h2>
                    <p>Where contacts live &mdash; a Mailcow address book shared with every mail app, or a dedicated Ziroemail table &mdash; is still being decided. Nothing is stored on this page yet.</p>
                    <div className="btn-row no-grow" style={{ justifyContent: 'center', marginTop: 18 }}>
                        <Button variant="line" size="sm" href={route('mail.settings')}>Mailbox settings</Button>
                    </div>
                </div>
            </main>
        </MailLayout>
    );
}
