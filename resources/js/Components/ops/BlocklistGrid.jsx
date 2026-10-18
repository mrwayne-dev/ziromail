const WORD = { clear: 'Clear', listed: 'Listed', unknown: 'Unknown' };

/* Each sending IP against each list. A cell can read Clear, Listed or Unknown: the check must be able to say Listed. */
export default function BlocklistGrid({ blocklists }) {
    const { ips, lists, matrix } = blocklists;

    return (
        <div className="tbl-wrap" tabIndex={0} role="region" aria-label="Blocklist status by sending IP">
            <table className="bl">
                <caption className="sr-only">Sending IP addresses against {lists.length} blocklists</caption>
                <thead>
                    <tr><th scope="col">Sending IP</th>{lists.map((list) => <th scope="col" key={list}>{list}</th>)}</tr>
                </thead>
                <tbody>
                    {ips.map((ip) => (
                        <tr key={ip}>
                            <td className="mono">{ip}</td>
                            {lists.map((list) => <td key={list}><span className={`lamp${matrix[ip][list] === 'listed' ? ' listed' : ''}`}>{WORD[matrix[ip][list]]}</span></td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
