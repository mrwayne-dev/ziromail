export default function Stat({ label, value, sub }) {
    return (
        <div className="stat">
            <div className="k">{label}</div>
            <div className="v">{value}</div>
            {sub && <div className="s">{sub}</div>}
        </div>
    );
}
