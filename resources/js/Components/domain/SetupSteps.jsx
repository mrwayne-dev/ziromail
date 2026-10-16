import { useState } from 'react';
import ChipGroup from '../ui/ChipGroup';
import Pill from '../ui/Pill';
import Stepper, { StepperItem } from '../ui/Stepper';

// Where the customer's mail lives today. Blurbs are the Switching page's own.
const providers = [
    {
        value: 'google',
        label: 'Google Workspace',
        note: 'Usually a cost decision. We import over IMAP and your calendar keeps working through your phone.',
    },
    {
        value: 'cpanel',
        label: 'cPanel or shared hosting',
        note: 'The most common one. Mail moves off the web server, which is normally where the spam problem started.',
    },
    {
        value: 'microsoft',
        label: 'Microsoft 365',
        note: 'Same import path. Outlook keeps working, and it finds the new settings by itself.',
    },
    {
        value: 'gmail',
        label: 'A free Gmail address',
        note: 'Nothing to migrate from, really. We set up your domain and you forward the old address for a while.',
    },
];

const records = [
    { type: 'MX', does: 'Sends new mail to Ziroemail' },
    { type: 'SPF', does: 'Says which servers may send for you' },
    { type: 'DKIM', does: 'Signs your mail so it cannot be forged' },
    { type: 'DMARC', does: 'Tells inboxes what to do with mail that fails' },
];

export default function SetupSteps() {
    const [provider, setProvider] = useState(providers[0].value);
    const current = providers.find((p) => p.value === provider);

    return (
        <Stepper>
            <StepperItem title="You connect the domain">
                <p>
                    We generate your records and show you where to paste them. Nothing has changed for your staff yet. Mail still arrives where it always did.
                </p>
                <ChipGroup label="Where your mail lives today" options={providers} value={provider} onChange={setProvider} />
                <p className="stepper-note" aria-live="polite">{current.note}</p>
            </StepperItem>

            <StepperItem title="We copy your old mail across">
                <p>
                    Folders, attachments and history move over a secure connection. You watch the progress per mailbox. Your old provider is untouched.
                </p>
            </StepperItem>

            <StepperItem title="The switch happens">
                <p>
                    Once all four records verify, new mail starts arriving at Ziroemail. Anything still in flight to the old server is collected too.
                </p>
                <ul className="rows" aria-label="The four records that must verify">
                    {records.map((record) => (
                        <li key={record.type}>
                            <span className="mono">{record.type}</span>
                            <span>{record.does}</span>
                            <Pill tone="ok" dot>Passing</Pill>
                        </li>
                    ))}
                </ul>
            </StepperItem>

            <StepperItem title="Staff set up their phones">
                <p>
                    Each person gets a link on WhatsApp and taps once. Most teams are fully moved before the end of the working day.
                </p>
            </StepperItem>
        </Stepper>
    );
}
