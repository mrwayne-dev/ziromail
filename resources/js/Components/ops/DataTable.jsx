import { Link, router } from '@inertiajs/react';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SkeletonRow } from './Skeleton';

/*
 * The console's one table. Composes a toolbar, a sticky-header table and a pager.
 *
 * Props:
 *   columns   [{ id, header, accessor, align?: 'num', nowrap?, mono?, sub?, sticky?, width?, sortable? }]
 *             accessor is `(row) => node`; use the plain string for sortable cells.
 *   rows      the rows
 *   rowKey    `(row) => string`
 *   rowHref   `(row) => string` — wraps the first cell in an anchor; `onRowClick` an alternative
 *   onRowClick(row)
 *   renderActions(row) → right-anchored actions column
 *   toolbar   { search?: { value, onChange, placeholder }, chips?: [{ value, label, count, pressed, onClick }], right?: <node> }
 *   pagination { pageSize?, totalRows?, page?, onPage? } — client-only paging unless `totalRows` is given
 *   sort      { by, dir, onChange(by, dir) } — if omitted, sortable columns sort client-side
 *   emptyState { title, body?, action? }
 *
 * References:
 *   https://ui.shadcn.com/docs/components/data-table
 *   https://21st.dev/@ephraimduncan/components/table-05
 *   https://21st.dev/@sean0205/components/data-grid-table
 */

const CARET = '↕';
const UP = '↑';
const DOWN = '↓';

function sortRows(rows, columns, by, dir) {
    if (!by) return rows;
    const col = columns.find((c) => c.id === by);
    if (!col) return rows;
    const read = (row) => {
        const raw = col.sortValue ? col.sortValue(row) : col.accessor(row);
        return typeof raw === 'string' ? raw.toLowerCase() : raw ?? '';
    };
    const sorted = [...rows].sort((a, b) => {
        const va = read(a);
        const vb = read(b);
        if (va < vb) return dir === 'asc' ? -1 : 1;
        if (va > vb) return dir === 'asc' ? 1 : -1;
        return 0;
    });
    return sorted;
}

export default function DataTable({
    columns,
    rows,
    rowKey = (row) => row.id,
    rowHref,
    onRowClick,
    renderActions,
    toolbar,
    pagination,
    sort,
    emptyState,
    sections, // (row, prevRow) => string | null — inserts a section header row between groups
    loading = false, // when true, replaces the body with 6 shape-skeleton rows
    stagger = true, // first-mount row stagger (≤30ms per row, capped at ~400ms); false disables
}) {
    const [localSort, setLocalSort] = useState({ by: null, dir: 'asc' });
    const [page, setPage] = useState(pagination?.page ?? 1);
    const activeSort = sort ?? { ...localSort, onChange: (by, dir) => setLocalSort({ by, dir }) };
    const reduce = useReducedMotion();
    const firstMount = useRef(true);
    const shouldStagger = stagger && firstMount.current && !reduce && !loading;
    useEffect(() => { firstMount.current = false; }, []);

    const pageSize = pagination?.pageSize ?? 25;
    const totalRows = pagination?.totalRows ?? rows.length;
    const serverPaged = pagination?.totalRows !== undefined;

    const prepared = useMemo(() => {
        if (sort) return rows; // caller sorts
        return sortRows(rows, columns, activeSort.by, activeSort.dir);
    }, [rows, columns, sort, activeSort.by, activeSort.dir]);

    const paged = useMemo(() => {
        if (serverPaged) return prepared;
        const start = (page - 1) * pageSize;
        return prepared.slice(start, start + pageSize);
    }, [prepared, page, pageSize, serverPaged]);

    const hasActions = Boolean(renderActions);
    const totalCols = columns.length + (hasActions ? 1 : 0);

    function toggleSort(colId) {
        if (activeSort.by !== colId) activeSort.onChange(colId, 'asc');
        else if (activeSort.dir === 'asc') activeSort.onChange(colId, 'desc');
        else activeSort.onChange(null, 'asc');
    }

    const sortIndicator = (colId) => {
        if (activeSort.by !== colId) return CARET;
        return activeSort.dir === 'asc' ? UP : DOWN;
    };

    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    const changePage = (next) => {
        const bounded = Math.min(Math.max(next, 1), totalPages);
        if (pagination?.onPage) pagination.onPage(bounded);
        setPage(bounded);
    };

    return (
        <div className="ops-table">
            {toolbar && <Toolbar {...toolbar} />}

            <div className="ops-tbl-wrap" role="region" tabIndex={0} aria-label={toolbar?.caption}>
                <table className="ops-tbl">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.id}
                                    className={[col.align === 'num' ? 'num' : '', col.sticky ? 'sticky' : ''].filter(Boolean).join(' ') || undefined}
                                    style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                                    scope="col"
                                    aria-sort={col.sortable ? (activeSort.by === col.id ? (activeSort.dir === 'asc' ? 'ascending' : 'descending') : 'none') : undefined}
                                >
                                    {col.sortable
                                        ? <button type="button" onClick={() => toggleSort(col.id)} aria-label={`Sort by ${typeof col.header === 'string' ? col.header : col.id}`}>
                                            {col.header} <span aria-hidden="true" style={{ opacity: activeSort.by === col.id ? 1 : .45, fontSize: '.9em' }}>{sortIndicator(col.id)}</span>
                                        </button>
                                        : col.header}
                                </th>
                            ))}
                            {hasActions && <th className="num" scope="col"><span className="sr-only">Actions</span></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {loading && Array.from({ length: 6 }, (_, i) => <SkeletonRow key={`sk-${i}`} columns={hasActions ? [...columns, { id: '_actions', align: 'num' }] : columns} />)}
                        {!loading && paged.length === 0 && (
                            <tr>
                                <td colSpan={totalCols}>
                                    <div className="ops-empty">
                                        <b>{emptyState?.title ?? 'Nothing to show'}</b>
                                        {emptyState?.body && <p>{emptyState.body}</p>}
                                        {emptyState?.action}
                                    </div>
                                </td>
                            </tr>
                        )}
                        {!loading && paged.map((row, index) => {
                            const key = rowKey(row);
                            const previous = index > 0 ? paged[index - 1] : null;
                            const section = sections ? sections(row, previous) : null;
                            const href = rowHref ? rowHref(row) : null;
                            const rowClass = (href || onRowClick) ? 'is-row-link' : undefined;
                            // Cap stagger so a 25-row table still feels snappy.
                            const delay = shouldStagger ? Math.min(index * 0.028, 0.4) : 0;

                            return (
                                <RowGroup key={key}
                                    row={row}
                                    columns={columns}
                                    section={section}
                                    totalCols={totalCols}
                                    renderActions={renderActions}
                                    href={href}
                                    onRowClick={onRowClick}
                                    rowClass={rowClass}
                                    staggerDelay={delay}
                                    animate={shouldStagger}
                                />
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {totalRows > pageSize && (
                <div className="ops-pager">
                    <span>Showing <b>{(page - 1) * pageSize + 1}</b>–<b>{Math.min(page * pageSize, totalRows)}</b> of <b>{totalRows.toLocaleString('en-NG')}</b></span>
                    <span className="ctrls">
                        <button type="button" className="btn btn-line btn-sm" onClick={() => changePage(page - 1)} disabled={page <= 1}>Previous</button>
                        <span className="ops-sm ops-mut">Page {page} of {totalPages}</span>
                        <button type="button" className="btn btn-line btn-sm" onClick={() => changePage(page + 1)} disabled={page >= totalPages}>Next</button>
                    </span>
                </div>
            )}
        </div>
    );
}

function RowGroup({ row, columns, section, totalCols, renderActions, href, onRowClick, rowClass, animate, staggerDelay }) {
    const click = (event) => {
        if (!onRowClick) return;
        // let an inner anchor/button take the click first
        if (event.target.closest('a, button, label, [data-row-ignore]')) return;
        onRowClick(row);
    };

    const Cell = ({ col, isFirst }) => {
        const cls = [col.align === 'num' ? 'num' : '', col.nowrap ? 'nowrap' : '', col.mono ? 'mono' : '', col.sub ? 'sub' : '', col.sticky ? 'sticky' : ''].filter(Boolean).join(' ') || undefined;
        const content = col.accessor(row);
        return <td className={cls}>{isFirst && href ? <Link className="cell-link" href={href}>{content}</Link> : content}</td>;
    };

    const rowCells = (
        <>
            {columns.map((col, i) => <Cell key={col.id} col={col} isFirst={i === 0} />)}
            {renderActions && <td className="num">{renderActions(row)}</td>}
        </>
    );

    return (
        <>
            {section && (
                <tr className="ops-section"><td colSpan={totalCols}>{section}</td></tr>
            )}
            {animate
                ? (
                    <motion.tr
                        className={rowClass}
                        onClick={click}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22, delay: staggerDelay, ease: [0.22, 0.9, 0.2, 1] }}
                    >
                        {rowCells}
                    </motion.tr>
                )
                : (
                    <tr className={rowClass} onClick={click}>{rowCells}</tr>
                )}
        </>
    );
}

function Toolbar({ search, chips, right, caption }) {
    return (
        <div className="ops-toolbar" role="toolbar" aria-label={caption ? `${caption} toolbar` : 'Table toolbar'}>
            {search && (
                <label className="search">
                    <SearchIcon />
                    <input
                        type="search" autoComplete="off" spellCheck="false"
                        value={search.value ?? ''}
                        placeholder={search.placeholder ?? 'Search'}
                        onChange={(e) => search.onChange(e.target.value)}
                        aria-label={search.ariaLabel ?? search.placeholder ?? 'Search'}
                    />
                </label>
            )}
            {chips && chips.map((chip) => (
                <button key={chip.value} type="button" className="chip" aria-pressed={chip.pressed} onClick={chip.onClick}>
                    {chip.label}{typeof chip.count === 'number' && <span className="n">{chip.count.toLocaleString('en-NG')}</span>}
                </button>
            ))}
            {right && <span className="right">{right}</span>}
        </div>
    );
}

function SearchIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
    );
}

/*
 * `router.get` helper for server-side table filters, so pages don't need to re-implement it.
 * Pass the current query, the key to update, and the route name. Returns a change handler.
 */
export function useTableFilter(routeName, filters) {
    return (key) => (value) => {
        const next = { ...filters, [key]: value || undefined };
        router.get(window.route(routeName), next, { preserveState: true, preserveScroll: true, replace: true });
    };
}
