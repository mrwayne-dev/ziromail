import Faq from '../../Components/domain/Faq';
import { faqSchema } from '../../Lib/schema';
import Seo from '../../Components/seo/Seo';
import { Link } from '@inertiajs/react';
import Reveal from '../../Components/craft/Reveal';
import Shape from '../../Components/craft/Shape';
import PublicLayout from '../../Layouts/PublicLayout';
import { route } from '../../Lib/route';

const faqs = [
    {
        q: "Will we lose any email during the move?",
        a: "No. Your old mailbox keeps receiving until the MX record change takes effect, and anything that arrives there during the changeover is collected afterwards. Nothing is deleted at the old provider either — we copy, we do not move.",
    },
    {
        q: "Do my staff have to do anything?",
        a: "Each person sets up their phone once, which takes about thirty seconds from a WhatsApp link. On a computer, Outlook and Apple Mail usually find the new settings themselves after a password prompt.",
    },
    {
        q: "How long does the whole thing take?",
        a: "The setup is ten minutes. DNS changes usually take effect within thirty minutes, sometimes a few hours. The mail import runs in the background and depends on how much history you have — a few gigabytes is typically under an hour.",
    },
    {
        q: "Can we keep our old addresses working for a while?",
        a: "Yes. It is common to forward the old address into the new mailbox for a month or two while you update letterheads and tell customers. We will set that up with you.",
    },
    {
        q: "What about calendars and contacts?",
        a: "Contacts come across with your mail. Calendars work through your phone's own calendar app using the standard protocols — we do not have a built-in calendar screen yet, and we would rather say so than imply otherwise.",
    },
];

export default function Migrate() {
    return (
        <>
            <Seo title="Switching to Ziroemail — Ziroemail"
                description="Move from Google Workspace, cPanel or anywhere else without losing a day. Your old mail keeps working while we import your history."
                path="/switching"
                ogTitle="Switching to Ziroemail without losing a day"
                ogDescription="Move from Google Workspace, cPanel or Microsoft 365. Your current email keeps working while we import your history."
                schema={faqSchema(faqs)} />

            <section className="m-hero">
              <Shape variant="ring" className="mh1" />
              <div className="wrap" data-hero="">
                <span className="eyebrow" style={{ marginBottom: "20px", display: "block" }}>Switching</span>
                <h1>Move across without losing a day.</h1>
                <p className="lead">
                  Your current email keeps receiving the whole time. We import your history in the background and only cut over once every record checks out.
                </p>
                <div className="btn-row mt-l">
                  <Link className="btn btn-pri btn-lg" href={route('signup')}>
                    Start the move
                  </Link>
                  {' '}
                  <Link className="btn btn-line btn-lg" href={route('contact')}>
                    Ask us to do it
                  </Link>
                </div>
              </div>
            </section>
            {/* ===== WHERE FROM ===== */}
            <section className="sec">
              <div className="wrap">
                <Reveal className="sec-head mb-l">
                  <span className="eyebrow">Where you are now</span>
                  <h2>Wherever your mail lives today</h2>
                  <p className="lead">
                    The process is the same in every case. Only the screen you click through on the old provider changes.
                  </p>
                </Reveal>
                <Reveal stagger className="from-grid">
                  <div className="card">
                    <h4>Google Workspace</h4>
                    <p className="sm mut mt-s">
                      Usually a cost decision. We import over IMAP and your calendar keeps working through your phone.
                    </p>
                  </div>
                  <div className="card">
                    <h4>cPanel or shared hosting</h4>
                    <p className="sm mut mt-s">
                      The most common one. Mail moves off the web server, which is normally where the spam problem started.
                    </p>
                  </div>
                  <div className="card">
                    <h4>Microsoft 365</h4>
                    <p className="sm mut mt-s">Same import path. Outlook keeps working — it finds the new settings by itself.</p>
                  </div>
                  <div className="card">
                    <h4>A free Gmail address</h4>
                    <p className="sm mut mt-s">
                      Nothing to migrate from, really. We set up your domain and you forward the old address for a while.
                    </p>
                  </div>
                </Reveal>
              </div>
            </section>
            {/* ===== TIMELINE ===== */}
            <section className="sec bg-soft">
              <div className="wrap">
                <Reveal className="sec-head mb-l">
                  <span className="eyebrow">How it goes</span>
                  <h2>What actually happens, in order</h2>
                </Reveal>
                <div className="split" style={{ alignItems: "start" }}>
                  <Reveal stagger className="tl">
                    <Reveal dir="left" className="tl-step done">
                      <span className="tl-when">Day one · 10 minutes</span>
                      <h3>You connect the domain</h3>
                      <p>
                        We generate your records and show you where to paste them. Nothing has changed for your staff yet — mail still arrives where it always did.
                      </p>
                    </Reveal>
                    <Reveal dir="left" className="tl-step done">
                      <span className="tl-when">Day one · background</span>
                      <h3>We copy your old mail across</h3>
                      <p>
                        Folders, attachments and history move over a secure connection. You watch the progress per mailbox. Your old provider is untouched.
                      </p>
                    </Reveal>
                    <Reveal dir="left" className="tl-step">
                      <span className="tl-when">When records pass</span>
                      <h3>The switch happens</h3>
                      <p>
                        Once all four records verify, new mail starts arriving at Ziroemail. Anything still in flight to the old server is collected too.
                      </p>
                    </Reveal>
                    <Reveal dir="left" className="tl-step">
                      <span className="tl-when">Same afternoon</span>
                      <h3>Staff set up their phones</h3>
                      <p>
                        Each person gets a link on WhatsApp and taps once. Most teams are fully moved before the end of the working day.
                      </p>
                    </Reveal>
                  </Reveal>
                  <div>
                    <div className="note">
                      <h4>There is no dark window</h4>
                      <p>
                        This is the part people worry about, so it is worth stating plainly: at no point does your business stop receiving email. The old mailbox keeps working right up until the moment the new one takes over.
                      </p>
                    </div>
                    <div className="note note-warn mt">
                      <h4>Large archives are quoted separately</h4>
                      <p>
                        A normal migration is included. If you are moving tens of gigabytes or dozens of mailboxes, we scope that as its own job and tell you the cost before starting — we would rather quote it than rush it.
                      </p>
                    </div>
                    <Link className="tlink mt-l" href={route('contact')}>
                      Talk to us about your move
                      {' '}
                      <svg width="15" height="11" viewBox="0 0 17 13" fill="none" aria-hidden="true">
                        <path d="M10.2 1 15.5 6.5 10.2 12M15 6.5H1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </section>
            {/* ===== AUTOMATIC SETUP ===== */}
            <section className="split-photo bg-ink">
              <Reveal as="figure" dir="left" className="sp-photo" style={{ margin: "0" }}>
                <img src="/images/photos/1739301674182-452a0f2b14dd.jpg" alt="Three colleagues reviewing something together on a laptop" width="1000" height="760" loading="lazy" decoding="async" />
              </Reveal>
              <Reveal dir="right" className="sp-copy">
                <span className="eyebrow" style={{ marginBottom: "18px" }}>Automatic setup</span>
                <h2>Or do not touch it at all</h2>
                <p className="lead mt">
                  Pick your registrar and we hand you the exact records, or a link that adds them in one click. Most domains verify within the hour.
                </p>
                <ul className="ticks mt-l">
                  <li>
                    <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M13 4.6 6.4 11.3 3 7.9" stroke="#3A86DC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>You paste four records, or approve one link</span>
                  </li>
                  <li>
                    <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M13 4.6 6.4 11.3 3 7.9" stroke="#3A86DC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>The import runs on its own and tells you when it is done</span>
                  </li>
                  <li>
                    <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M13 4.6 6.4 11.3 3 7.9" stroke="#3A86DC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>Nothing to arrange and nobody to wait for</span>
                  </li>
                </ul>
              </Reveal>
            </section>
            {/* ===== FAQ ===== */}
            <section className="sec">
              <div className="wrap wrap-tight">
                <Reveal className="sec-head mb-l">
                  <span className="eyebrow">Questions</span>
                  <h2>The things people ask first</h2>
                </Reveal>
                <Faq items={faqs} />
              </div>
            </section>
            <section className="sec bg-soft center">
              <div className="wrap wrap-tight">
                <h2>Ready when you are</h2>
                <p className="lead mt">Start it yourself, or tell us about your setup and we will handle it.</p>
                <div className="btn-row center mt-l">
                  <Link className="btn btn-pri btn-lg" href={route('signup')}>
                    Start the move
                  </Link>
                  {' '}
                  <Link className="btn btn-line btn-lg" href={route('contact')}>
                    Ask a question first
                  </Link>
                </div>
              </div>
            </section>
        </>
    );
}

Migrate.layout = (page) => (
    <PublicLayout page="migrate">{page}</PublicLayout>
);
