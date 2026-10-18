import Button from '../ui/Button';
import Card from '../ui/Card';
import { useToast } from '../ui/Toast';

/* Owner-only: asks for a download of all the organisation's mail. Not connected yet. */
export default function ExportCard() {
    const { toast } = useToast();

    return (
        <Card as="section" aria-labelledby="export-h" className="mt-l">
            <h2 className="heading-sm" id="export-h">Export all mail</h2>
            <p className="sm mut mt-s">Download every mailbox in your organisation as standard mail files. It can take a while for a large account, and we email the owner when it is ready.</p>
            <Button variant="line" className="mt" onClick={() => toast({ tone: 'warn', title: 'Export is not connected yet', message: 'In the live product this starts the export and emails you a link.' })}>Request an export</Button>
        </Card>
    );
}
