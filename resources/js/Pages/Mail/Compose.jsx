import Composer from '../../Components/mail/Composer';
import Banner from '../../Components/ui/Banner';
import useQuery from '../../Hooks/useQuery';
import MailLayout from '../../Layouts/MailLayout';

/*
 * The composer still works as a standalone page. Reply/forward targets used to
 * come from message fixtures; with no store, we can't look up the source — so
 * we just note it and open an empty composer. The composer itself handles the
 * compose UX in its own component.
 */
export default function Compose() {
    const query = useQuery();
    const replying = Boolean(query.get('reply'));
    const forwarding = Boolean(query.get('forward'));

    return (
        <MailLayout page="mail-compose" title="Compose" current="compose">
            <main className="compose-pane" id="main">
                {(replying || forwarding) && (
                    <Banner tone="info" title={`This ${replying ? 'reply' : 'forward'} target is no longer available`} className="mt">
                        <p>Message history will come back once your mail server is connected. In the meantime the composer is empty.</p>
                    </Banner>
                )}
                <Composer variant="page" />
            </main>
        </MailLayout>
    );
}
