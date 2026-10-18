import Button from '../ui/Button';

/* "8 of 412 shown" with Previous and Next. */
export default function Pager({ shown, total, noun, page, last, onPage }) {
    return (
        <div className="between mt">
            <p className="sm mut">{shown} of {total} {noun} shown{last > 1 ? `, page ${page} of ${last}` : ''}.</p>
            <div className="btn-row no-grow">
                <Button variant="line" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
                <Button variant="line" size="sm" disabled={page >= last} onClick={() => onPage(page + 1)}>Next</Button>
            </div>
        </div>
    );
}
