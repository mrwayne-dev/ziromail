import Seo from '../../Components/seo/Seo';
import Button, { ArrowIcon } from '../../Components/ui/Button';
import Card from '../../Components/ui/Card';
import Modal from '../../Components/ui/Modal';
import Pill from '../../Components/ui/Pill';
import { useToast } from '../../Components/ui/Toast';
import useDisclosure from '../../Hooks/useDisclosure';
import PublicLayout from '../../Layouts/PublicLayout';

// Local-only gallery of the shared UI pieces (route: /_preview/components).
export default function Components() {
    const confirm = useDisclosure();
    const nested = useDisclosure();
    const { toast } = useToast();

    return (
        <section className="sec">
            <Seo title="Components — Ziroemail" description="Local component gallery." path="/_preview/components" noindex />
            <div className="wrap stack">
                <h1>Components</h1>

                <h3>Buttons</h3>
                <div className="btn-row">
                    <Button pill icon={<ArrowIcon />}>Primary pill</Button>
                    <Button variant="line" pill>Line pill</Button>
                    <Button variant="ink" size="sm">Ink small</Button>
                    <Button variant="quiet">Quiet</Button>
                    <Button busy>Busy</Button>
                </div>
                <div className="bg-ink" style={{ padding: 24, borderRadius: 'var(--r)' }}>
                    <div className="btn-row">
                        <Button variant="white" pill size="lg">White pill</Button>
                        <Button variant="glass" pill size="lg" icon={<ArrowIcon />}>Glass pill</Button>
                    </div>
                </div>

                <h3>Pills</h3>
                <div className="row wrapf">
                    <Pill tone="ok" dot>Ok</Pill><Pill tone="warn">Warn</Pill><Pill tone="bad">Bad</Pill>
                    <Pill tone="info">Info</Pill><Pill>Muted</Pill>
                </div>

                <h3>Cards</h3>
                <div className="grid g2" style={{ maxWidth: 560 }}>
                    <Card>Default card</Card>
                    <Card flat>Flat card</Card>
                </div>
                <div className="grid g2" style={{ gap: 0 }}>
                    <Card variant="panel" featured><h3>Featured panel</h3><p>Filled with brand blue.</p></Card>
                    <Card variant="panel"><h3>Plain panel</h3><p>Sits edge to edge.</p></Card>
                </div>

                <h3>Modal and toast</h3>
                <div className="btn-row">
                    <Button id="open-modal" onClick={confirm.open}>Open modal</Button>
                    <Button variant="line" id="toast-ok" onClick={() => toast({ title: 'Saved', message: 'Your changes are live.', tone: 'ok' })}>Success toast</Button>
                    <Button variant="line" id="toast-bad" onClick={() => toast({ title: 'Could not send', message: 'Check your connection.', tone: 'bad', duration: 0 })}>Error toast (sticky)</Button>
                </div>

                <Modal
                    open={confirm.isOpen}
                    onClose={confirm.close}
                    title="Delete this mailbox?"
                    footer={(
                        <>
                            <Button variant="line" onClick={confirm.close}>Cancel</Button>
                            <Button variant="danger" onClick={nested.open}>Continue</Button>
                        </>
                    )}
                >
                    <p>Mail in it stays for 30 days, then is removed.</p>
                </Modal>
                <Modal open={nested.isOpen} onClose={nested.close} title="Are you sure?" size="sm" dismissOnBackdrop={false}
                    footer={<Button onClick={() => { nested.close(); confirm.close(); toast({ title: 'Mailbox deleted', tone: 'warn' }); }}>Yes, delete</Button>}>
                    <p>This one cannot be dismissed by clicking outside.</p>
                </Modal>
            </div>
        </section>
    );
}

Components.layout = (page) => <PublicLayout variant="light" page="components">{page}</PublicLayout>;
