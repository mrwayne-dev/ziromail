import { Link } from '@inertiajs/react';
import Reveal from '../../Components/craft/Reveal';
import Faq from '../../Components/domain/Faq';
import Card from '../../Components/ui/Card';
import CtaBlock from '../../Components/ui/CtaBlock';
import PageHero from '../../Components/ui/PageHero';
import Stepper, { StepperItem } from '../../Components/ui/Stepper';
import Ticks from '../../Components/ui/Tick';
import Button from '../../Components/ui/Button';
import Seo from '../../Components/seo/Seo';
import { migrateFaqs } from '../../fixtures/faqs';
import PublicLayout from '../../Layouts/PublicLayout';
import { faqSchema } from '../../Lib/schema';
import { route } from '../../Lib/route';

const faqs = migrateFaqs;

const sources = [
    {
        title: 'Google Workspace',
        body: 'Usually a cost decision. We import over IMAP and your calendar keeps working through your phone.',
    },
    {
        title: 'cPanel or shared hosting',
        body: 'The most common one. Mail moves off the web server, which is normally where the spam problem started.',
    },
    {
        title: 'Microsoft 365',
        body: 'Same import path. Outlook keeps working, and it finds the new settings by itself.',
    },
    {
        title: 'A free Gmail address',
        body: 'Nothing to migrate from, really. We set up your domain and you forward the old address for a while.',
    },
];

export default function Migrate() {
    return (
        <>
            <Seo title="Switching to Ziroemail | Ziroemail"
                description="Move from Google Workspace, cPanel or anywhere else without losing a day. Your old mail keeps working while we import your history."
                path="/switching"
                ogTitle="Switching to Ziroemail without losing a day"
                ogDescription="Move from Google Workspace, cPanel or Microsoft 365. Your current email keeps working while we import your history."
                schema={faqSchema(faqs)} />

            <PageHero
              eyebrow="Switching"
              title="Move across without losing a day."
              lead="Your current email keeps receiving the whole time. We import your history in the background and only cut over once every record checks out."
              actions={(
                <>
                  <Button size="lg" href={route('signup')}>Start the move</Button>
                  <Button variant="line" size="lg" href={route('contact')}>Ask us to do it</Button>
                </>
              )}
            />

            {/* ===== WHERE FROM ===== */}
            <section className="sec-sm">
              <div className="wrap">
                <Reveal className="block-head center">
                  <span className="eyebrow">Where you are now</span>
                  <h2>Wherever your mail lives today</h2>
                  <p className="lead">The process is the same in every case. Only the screen you click through on the old provider changes.</p>
                </Reveal>
                <Reveal stagger className="source-grid">
                  {sources.map((source) => (
                    <Card key={source.title} size="lg" className="source-card">
                      <h3>{source.title}</h3>
                      <p>{source.body}</p>
                    </Card>
                  ))}
                </Reveal>
              </div>
            </section>

            {/* ===== TIMELINE ===== */}
            <section className="sec band-soft">
              <div className="wrap">
                <Reveal className="block-head">
                  <span className="eyebrow">How it goes</span>
                  <h2>What actually happens, in order</h2>
                </Reveal>
                <div className="timeline-split">
                  <Stepper>
                    <StepperItem title="You connect the domain" when="Day one · 10 minutes">
                      <p>We generate your records and show you where to paste them. Nothing has changed for your staff yet. Mail still arrives where it always did.</p>
                    </StepperItem>
                    <StepperItem title="We copy your old mail across" when="Day one · background">
                      <p>Folders, attachments and history move over a secure connection. You watch the progress per mailbox. Your old provider is untouched.</p>
                    </StepperItem>
                    <StepperItem title="The switch happens" when="When records pass">
                      <p>Once all four records verify, new mail starts arriving at Ziroemail. Anything still in flight to the old server is collected too.</p>
                    </StepperItem>
                    <StepperItem title="Staff set up their phones" when="Same afternoon">
                      <p>Each person gets a link on WhatsApp and taps once. Most teams are fully moved before the end of the working day.</p>
                    </StepperItem>
                  </Stepper>
                  <Reveal dir="right" className="timeline-notes">
                    <div className="note">
                      <h4>There is no dark window</h4>
                      <p>This is the part people worry about, so it is worth stating plainly: at no point does your business stop receiving email. The old mailbox keeps working right up until the moment the new one takes over.</p>
                    </div>
                    <div className="note note-warn">
                      <h4>Large archives are quoted separately</h4>
                      <p>A normal migration is included. If you are moving tens of gigabytes or dozens of mailboxes, we scope that as its own job and tell you the cost before starting. We would rather quote it than rush it.</p>
                    </div>
                    <Link className="tlink" href={route('contact')}>Talk to us about your move</Link>
                  </Reveal>
                </div>
              </div>
            </section>

            {/* ===== AUTOMATIC SETUP ===== */}
            <section className="sec">
              <div className="wrap">
                <div className="auto-split">
                  <Reveal as="figure" dir="left" className="auto-photo">
                    <img
                      src="/images/photos/1739301674182-452a0f2b14dd.jpg"
                      alt="Three colleagues reviewing something together on a laptop"
                      width="1000" height="667" loading="lazy" decoding="async"
                    />
                  </Reveal>
                  <Reveal dir="right" className="auto-copy">
                    <span className="eyebrow">Automatic setup</span>
                    <h2>Or do not touch it at all</h2>
                    <p className="lead">Pick your registrar and we hand you the exact records, or a link that adds them in one click. Most domains verify within the hour.</p>
                    <Ticks items={[
                      'You paste four records, or approve one link',
                      'The import runs on its own and tells you when it is done',
                      'Nothing to arrange and nobody to wait for',
                    ]} />
                  </Reveal>
                </div>
              </div>
            </section>

            {/* ===== FAQ ===== */}
            <section className="sec band-soft">
              <div className="wrap">
                <Reveal className="block-head center">
                  <span className="eyebrow">Questions</span>
                  <h2>The things people ask first</h2>
                </Reveal>
                <div className="faq-list">
                  <Faq variant="cards" items={faqs} />
                </div>
              </div>
            </section>

            <CtaBlock
              title="Ready when you are"
              lead="Start it yourself, or tell us about your setup and we will handle it."
              primary={{ label: 'Start the move', href: route('signup') }}
              secondary={{ label: 'Ask a question first', href: route('contact') }}
            />
        </>
    );
}

Migrate.layout = (page) => (
    <PublicLayout variant="float" page="migrate">{page}</PublicLayout>
);
