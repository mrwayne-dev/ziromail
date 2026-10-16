import Button, { ArrowIcon } from './Button';

/*
 * The closing call to action: a contained brand-blue block on the page's own
 * width. Pass the two actions as { label, href }.
 */
export default function CtaBlock({ title, lead, primary, secondary }) {
    return (
        <section className="cta-sec sec">
            <div className="wrap">
                <div className="cta-card">
                    <h2>{title}</h2>
                    {lead && <p className="lead">{lead}</p>}
                    <div className="btn-row">
                        <Button variant="white" size="lg" pill href={primary.href}>{primary.label}</Button>
                        {secondary && (
                            <Button variant="glass" size="lg" pill href={secondary.href} icon={<ArrowIcon />}>{secondary.label}</Button>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
