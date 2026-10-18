import Composer from '../../Components/mail/Composer';
import useQuery from '../../Hooks/useQuery';
import MailLayout from '../../Layouts/MailLayout';
import { messageFixtures } from '../../fixtures/mail';
import { messageById } from '../../Lib/mail';

export default function Compose() {
    const query = useQuery();
    const source = messageById(messageFixtures, query.get('reply') ?? query.get('forward') ?? '');
    const replying = Boolean(query.get('reply')) && source;
    const forwarding = Boolean(query.get('forward')) && source;
    const to = replying ? [source.folder === 'sent' ? source.to[0] : source.from].filter(Boolean) : [];
    const subject = replying ? (source.subject.startsWith('Re:') ? source.subject : `Re: ${source.subject}`) : forwarding ? `Fwd: ${source.subject}` : '';

    return (
        <MailLayout page="mail-compose" title="Compose" current="compose">
            <main className="compose-pane" id="main">
                <Composer variant="page" to={to} subject={subject} />
            </main>
        </MailLayout>
    );
}
