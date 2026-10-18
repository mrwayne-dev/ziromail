const WORD = { ok: 'verified', slow: 'slow', fail: 'failed' };
const CLASS = { ok: undefined, slow: 'part', fail: 'fail' };

/* A strip of nightly backups, oldest first. Each cell names its night for assistive tech. */
export default function NightStrip({ nights, lastNight }) {
    const last = new Date(lastNight);

    return (
        <div className="timeline" role="img" aria-label={`${nights.length} nightly backups: ${nights.filter((n) => n === 'ok').length} verified, ${nights.filter((n) => n === 'slow').length} slow, ${nights.filter((n) => n === 'fail').length} failed`}>
            {nights.map((state, index) => {
                const date = new Date(last);
                date.setDate(last.getDate() - (nights.length - 1 - index));
                return <i key={index} className={CLASS[state]} title={`${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}: ${WORD[state]}`} />;
            })}
        </div>
    );
}
