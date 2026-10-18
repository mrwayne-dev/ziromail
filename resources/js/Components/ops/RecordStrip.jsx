const NAME = { ok: 'passing', no: 'not passing', na: 'not required yet' };

/* The four record letters, green when passing, red when not, grey when not yet asked for. */
export default function RecordStrip({ records }) {
    return (
        <span className="recs">
            {['MX', 'SPF', 'DKIM', 'DMARC'].map((type) => (
                <span key={type} className={`rec ${records[type]}`}>
                    {type}
                    <span className="sr-only"> {NAME[records[type]]}</span>
                </span>
            ))}
        </span>
    );
}
