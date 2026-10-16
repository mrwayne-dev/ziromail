import { useEffect, useId, useRef, useState } from 'react';
import { quotaOf } from '../../Lib/onboarding';
import Banner from '../ui/Banner';
import Button from '../ui/Button';
import { AlertIcon, PlusIcon } from '../ui/Icons';
import Pill from '../ui/Pill';
import PoolBar from './PoolBar';

const ADDRESS = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/;

/*
 * The checks the allocator makes, as one result the page can also read:
 *   { used, left, over, errors: { [rowId]: { address?, quota? } } }
 * This is a convenience for the person typing. The server re-validates every
 * quota against the pool before anything is created.
 */
export function checkAllocation(rows, poolGb) {
    const used = Math.round(rows.reduce((sum, row) => sum + quotaOf(row), 0) * 10) / 10;
    const left = Math.round((poolGb - used) * 10) / 10;
    const errors = {};
    const seen = new Set();

    rows.forEach((row) => {
        const local = row.local.trim().toLowerCase();
        const found = {};
        if (!local) found.address = 'Type the part before the @.';
        else if (!ADDRESS.test(local)) found.address = 'Use letters, numbers, dots, dashes or underscores.';
        else if (seen.has(local)) found.address = 'Another mailbox already uses this address.';
        seen.add(local);
        if (row.quota !== '' && !(parseFloat(row.quota) >= 0)) found.quota = 'Enter a number of GB.';
        if (Object.keys(found).length > 0) errors[row.id] = found;
    });

    return { used, left, over: left < 0, errors };
}

function MailboxRow({ row, index, domain, poolGb, step, errors, onChange, onRemove, onRest, inputRef }) {
    const id = useId();
    const quotaId = `${id}-q`;
    const addrErr = errors?.address;
    const quotaErr = errors?.quota;

    return (
        <fieldset className="mb-card">
            <legend className="sr-only">Mailbox {index + 1}</legend>
            <div className="mb-top">
                <div className={`field${addrErr ? ' field-err' : ''}`}>
                    <label className="label" htmlFor={`${id}-a`}>Address</label>
                    <div className="input-affix">
                        <input
                            ref={inputRef}
                            id={`${id}-a`}
                            className="input mono-in"
                            type="text"
                            value={row.local}
                            spellCheck="false"
                            autoCapitalize="off"
                            aria-invalid={addrErr ? true : undefined}
                            aria-describedby={addrErr ? `${id}-ae` : undefined}
                            onChange={(e) => onChange({ ...row, local: e.target.value.toLowerCase() })}
                        />
                        <span className="affix">@{domain}</span>
                    </div>
                    {addrErr && <p className="err" id={`${id}-ae`}>{addrErr}</p>}
                </div>

                <div className={`field${quotaErr ? ' field-err' : ''}`}>
                    <label className="label" htmlFor={quotaId}>Storage</label>
                    <div className="quota-field">
                        <div className="input-affix">
                            <input
                                id={quotaId}
                                className="input"
                                type="number"
                                inputMode="decimal"
                                min="0"
                                max={poolGb}
                                step={step}
                                value={row.quota}
                                aria-invalid={quotaErr ? true : undefined}
                                aria-describedby={quotaErr ? `${id}-qe` : undefined}
                                onChange={(e) => onChange({ ...row, quota: e.target.value })}
                            />
                            <span className="affix">GB</span>
                        </div>
                        <Button variant="line" size="sm" onClick={onRest} aria-label={`Give mailbox ${index + 1} the rest of the pool`}>Rest</Button>
                    </div>
                    {quotaErr && <p className="err" id={`${id}-qe`}>{quotaErr}</p>}
                </div>
            </div>
            <div className="mb-foot">
                {row.owner ? (
                    <>
                        <span className="sm">This will be the owner account</span>
                        <Pill tone="info">Owner</Pill>
                    </>
                ) : (
                    <>
                        <span className="sm">We will send a setup link when you finish</span>
                        <Button variant="quiet" size="sm" onClick={onRemove} aria-label={`Remove mailbox ${index + 1}`}>Remove</Button>
                    </>
                )}
            </div>
        </fieldset>
    );
}

/*
 * Divides one plan's storage pool between mailboxes. `rows` is
 * [{ id, local, quota, owner }] with `quota` as typed text; `onChange` receives
 * the next rows. Shows the pool as a live bar, blocks nothing by itself, and
 * reports over-allocation in a banner so the page can disable its submit using
 * checkAllocation(). `showErrors` reveals per-field problems once the person
 * has tried to submit.
 */
export default function PoolAllocator({ rows, onChange, poolGb, domain, planLabel, extraBlockGb, step = 0.5, showErrors = false }) {
    const { used, left, over, errors } = checkAllocation(rows, poolGb);
    const refs = useRef({});
    const [focusId, setFocusId] = useState(null);
    const nextId = useRef(rows.length + 1);
    const addRef = useRef(null);

    useEffect(() => {
        if (focusId) {
            refs.current[focusId]?.focus();
            setFocusId(null);
        }
    }, [focusId]);

    function update(next) {
        onChange(rows.map((row) => (row.id === next.id ? next : row)));
    }

    function add() {
        nextId.current += 1;
        const id = `m${nextId.current}`;
        onChange([...rows, { id, local: '', quota: '0', owner: false }]);
        setFocusId(id);
    }

    function remove(id) {
        onChange(rows.filter((row) => row.id !== id));
        addRef.current?.focus();
    }

    function giveRest(id) {
        const others = rows.filter((row) => row.id !== id).reduce((sum, row) => sum + quotaOf(row), 0);
        const rest = Math.max(0, Math.round((poolGb - others) * 10) / 10);
        onChange(rows.map((row) => (row.id === id ? { ...row, quota: String(rest) } : row)));
    }

    const segments = rows.map((row, i) => ({ key: row.id, gb: quotaOf(row), label: `${quotaOf(row)} GB`, name: row.local || `Mailbox ${i + 1}` }));
    const description = `${used} of ${poolGb} GB assigned: ${segments.filter((s) => s.gb > 0).map((s) => `${s.name} ${s.gb} GB`).join(', ')}${left > 0 ? `, ${left} GB free` : ''}`;

    return (
        <div className={`allocator${over ? ' is-over' : ''}`}>
            <div className="pool-card">
                <div className="pool-nums">
                    <div>
                        <span className="k">Assigned</span>
                        <span className="v"><span>{used}</span> <small>of {poolGb} GB</small></span>
                    </div>
                    <div>
                        <span className="k">Still free</span>
                        <span className="v">{Math.max(0, left)}</span>
                    </div>
                    {planLabel && <Pill tone="info" className="pool-plan">{planLabel}</Pill>}
                </div>

                <PoolBar segments={segments} freeGb={Math.max(0, left)} description={description} over={over} />
                <p className="sr-only" role="status">{description}</p>

                {over && (
                    <Banner tone="bad" live icon={<AlertIcon />} title="That is more than your pool holds">
                        <p>
                            You are over by <b>{Math.abs(left)}&nbsp;GB</b>. Lower a quota
                            {extraBlockGb ? `, or add a ${extraBlockGb} GB block of extra storage to your plan` : ''}.
                        </p>
                    </Banner>
                )}
            </div>

            <div className="mb-list">
                {rows.map((row, i) => (
                    <MailboxRow
                        key={row.id}
                        row={row}
                        index={i}
                        domain={domain}
                        poolGb={poolGb}
                        step={step}
                        errors={showErrors ? errors[row.id] : undefined}
                        inputRef={(el) => { refs.current[row.id] = el; }}
                        onChange={update}
                        onRemove={() => remove(row.id)}
                        onRest={() => giveRest(row.id)}
                    />
                ))}
            </div>

            <button ref={addRef} type="button" className="btn btn-line full mb-add" onClick={add}>
                <PlusIcon /> Add another mailbox
            </button>
        </div>
    );
}
