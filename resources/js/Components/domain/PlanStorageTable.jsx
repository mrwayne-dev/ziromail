import { plans } from '../../fixtures/plans';

// Included pool and expansion ceiling for each plan.
export default function PlanStorageTable() {
    return (
        <div className="tbl-wrap" style={{ marginTop: 26 }}>
            <table className="data" style={{ minWidth: 0 }}>
                <caption className="sr-only">Storage ceiling by plan</caption>
                <thead>
                    <tr>
                        <th scope="col">Plan</th>
                        <th scope="col" className="c">Included</th>
                        <th scope="col" className="c">Expandable to</th>
                    </tr>
                </thead>
                <tbody>
                    {plans.map((plan) => (
                        <tr key={plan.code}>
                            <th scope="row">{plan.name}</th>
                            <td className="c num">{plan.poolGb} GB</td>
                            {plan.ceilingGb === null ? (
                                <td className="c">No limit</td>
                            ) : (
                                <td className="c num">{plan.ceilingGb} GB</td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
