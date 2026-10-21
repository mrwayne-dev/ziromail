import { Link } from '@inertiajs/react';
import useCurrentDomain from '../../Hooks/useCurrentDomain';
import useDisclosure from '../../Hooks/useDisclosure';
import useDismissible from '../../Hooks/useDismissible';
import { formatGb } from '../../Lib/format';
import { route } from '../../Lib/route';
import { plansFixture } from '../../fixtures/plans';

const planName = (code) => plansFixture.plans.find((plan) => plan.code === code)?.name ?? code;

/*
 * The header menu that says which domain the dashboard is about and switches it.
 * The choice lives in the URL (`?domain=`), so every page and a refresh agree.
 */
export default function DomainSwitcher() {
    const { current, domains, path } = useCurrentDomain();
    const { isOpen, close, toggle } = useDisclosure();
    const ref = useDismissible(isOpen, close);

    return (
        <div className="dom-switch" ref={ref}>
            <button type="button" aria-expanded={isOpen} aria-haspopup="true" aria-controls="dom-menu" onClick={toggle}>
                <span className="cur">{current?.name}</span>
                <svg className="chev" width="11" height="7" viewBox="0 0 12 8" fill="none" aria-hidden="true">
                    <path d="M1 1.5 6 6.5l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
            <div className="dom-menu" id="dom-menu" hidden={!isOpen}>
                <p className="ttl">Your domains</p>
                {domains.map((domain) => (
                    <Link
                        key={domain.id}
                        href={`${path}?domain=${domain.id}`}
                        aria-current={domain.id === current?.id ? 'true' : undefined}
                        onClick={close}
                    >
                        <b>{domain.name}</b>
                        <span>
                            {planName(domain.planCode)} &middot; {domain.mailboxCount} mailboxes &middot; {formatGb(domain.usedGb)} / {formatGb(domain.poolGb)}
                        </span>
                    </Link>
                ))}
                <div className="sep" />
                <Link className="add" href={`${route('dashboard.domains')}#add`} onClick={close}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                    </svg>
                    Add a domain
                </Link>
                <Link className="add domain-all" href={route('dashboard.domains')} onClick={close}>
                    Manage all domains
                </Link>
            </div>
        </div>
    );
}
