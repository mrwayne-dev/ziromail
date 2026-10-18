/* One message, hop by hop, with the receiving server's own words. */
export default function DeliveryTrace({ hops }) {
    return (
        <div className="trace">
            {hops.map((hop, index) => (
                <div className={`hop${hop.outcome === 'pending' ? ' pend' : ''}`} key={index}>
                    <b>{hop.label}</b>
                    <span className="tm">{hop.at} &middot; {hop.detail}</span>
                    {hop.serverReply && <code className="raw">{hop.serverReply}</code>}
                </div>
            ))}
        </div>
    );
}
