import { useMemo, useState } from 'react';
import Reveal from '../../Components/craft/Reveal';
import Card from '../../Components/ui/Card';
import CtaBlock from '../../Components/ui/CtaBlock';
import Empty from '../../Components/ui/Empty';
import PageHero from '../../Components/ui/PageHero';
import Button from '../../Components/ui/Button';
import Seo from '../../Components/seo/Seo';
import { helpCategories, popularGuides } from '../../fixtures/help';
import PublicLayout from '../../Layouts/PublicLayout';
import { route } from '../../Lib/route';

const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="7" cy="7" r="5.2" stroke="currentColor" strokeWidth="1.6" />
        <path d="m11 11 3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
);

export default function Help() {
    const [query, setQuery] = useState('');
    const [topic, setTopic] = useState('all');

    const needle = query.trim().toLowerCase();
    const filtering = needle !== '' || topic !== 'all';

    // Flat list of every guide with its topic, filtered by the box and the chips.
    const results = useMemo(
        () =>
            helpCategories
                .filter((c) => topic === 'all' || c.id === topic)
                .flatMap((c) => c.guides.map((title) => ({ title, topic: c.name })))
                .filter((g) => needle === '' || g.title.toLowerCase().includes(needle) || g.topic.toLowerCase().includes(needle)),
        [needle, topic],
    );

    return (
        <>
            <Seo title="Help centre | Ziroemail"
                description="Guides for setting up your domain, adding mailboxes, configuring phones and fixing delivery problems."
                path="/help"
                ogDescription="Guides for DNS records, phone setup, storage quotas, delivery problems and billing." />

            <PageHero eyebrow="Help centre" title="How can we help?">
              <label className="help-search">
                <SearchIcon />
                <span className="sr-only">Search the help centre</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search guides: DNS, phone setup, storage…"
                />
              </label>
              <div className="help-chips" role="group" aria-label="Filter guides by topic">
                {[{ id: 'all', name: 'All topics' }, ...helpCategories].map((c) => (
                  <button key={c.id} type="button" className="chip" aria-pressed={topic === c.id} onClick={() => setTopic(c.id)}>
                    {c.name}
                  </button>
                ))}
              </div>
            </PageHero>

            {filtering ? (
              <section className="sec-sm help-results">
                <div className="wrap">
                  <p className="help-count" aria-live="polite">
                    {results.length} {results.length === 1 ? 'guide' : 'guides'}
                    {needle ? ` matching “${query.trim()}”` : ''}
                  </p>
                  {results.length > 0 ? (
                    <ul className="guide-list">
                      {results.map((g) => (
                        <li key={`${g.topic}-${g.title}`}>
                          <a href="#"><span>{g.title}</span><small>{g.topic}</small></a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Empty
                      title="No guides match that"
                      action={<Button variant="line" href={route('contact')}>Ask us instead</Button>}
                    >
                      Try a shorter search, or pick a topic above. If it is not here, message us and we will answer it.
                    </Empty>
                  )}
                </div>
              </section>
            ) : (
              <>
                {/* ===== POPULAR ===== */}
                <section className="sec-sm">
                  <div className="wrap">
                    <Reveal className="block-head">
                      <h2 className="help-h2">Most read</h2>
                    </Reveal>
                    <Reveal stagger className="popular-grid">
                      {popularGuides.map((g) => (
                        <a key={g.n} href="#" className="popular-card">
                          <span className="n">{g.n}</span>
                          <b>{g.title}</b>
                          <span>{g.note}</span>
                        </a>
                      ))}
                    </Reveal>
                  </div>
                </section>

                {/* ===== CATEGORIES ===== */}
                <section className="sec band-soft">
                  <div className="wrap">
                    <Reveal className="block-head">
                      <span className="eyebrow">Browse</span>
                      <h2>Guides by topic</h2>
                    </Reveal>
                    <Reveal stagger className="topic-grid">
                      {helpCategories.map((c) => (
                        <Card key={c.id} size="lg" className="topic-card">
                          <h3>{c.name}</h3>
                          <ul>
                            {c.guides.map((title) => (
                              <li key={title}><a href="#">{title}</a></li>
                            ))}
                          </ul>
                          <a className="tlink" href="#">All {c.total} guides</a>
                        </Card>
                      ))}
                    </Reveal>
                  </div>
                </section>
              </>
            )}

            <CtaBlock
              title="Still stuck?"
              lead="Send us a screenshot on WhatsApp. We would rather fix it with you than have you read four more articles."
              primary={{ label: 'Message us', href: route('contact') }}
              secondary={{ label: 'Check system status', href: route('status') }}
            />
        </>
    );
}

Help.layout = (page) => (
    <PublicLayout variant="float" page="help">{page}</PublicLayout>
);
