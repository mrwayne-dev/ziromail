import { Link } from '@inertiajs/react';
import { route } from '../../Lib/route';

/* One of the morning checks: a lamp, what it found, and where to look. */
export default function CheckRow({ check }) {
    return (
        <div className={`check${check.state === 'bad' ? ' is-bad' : ''}`}>
            <span className={`dot ${check.state}`} aria-hidden="true" />
            <span className="bd"><b>{check.title}</b><span>{check.body}</span></span>
            <span className="rt">
                {check.link ? <Link className="tlink" href={route(check.link.routeName)}>{check.link.label}</Link> : check.at}
            </span>
        </div>
    );
}
