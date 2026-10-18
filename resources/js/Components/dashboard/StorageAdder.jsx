import { useId, useState } from 'react';
import { extraStoragePrice } from '../../Lib/billing';
import { formatDate, formatGb } from '../../Lib/format';
import { formatPrice } from '../../Lib/money';
import OrderSummary from '../domain/OrderSummary';
import Button from '../ui/Button';
import { Input } from '../ui/Field';
import { useToast } from '../ui/Toast';

/*
 * Chooses how much storage to add to one domain's pool. The amount is held under
 * the plan's ceiling and, in block mode, to whole blocks. The price shown is display
 * arithmetic; the server quotes the real amount when payment starts.
 */
export default function StorageAdder({ domain, pool, plan, extraStorage, renewsAt, presets }) {
    const id = useId();
    const { toast } = useToast();
    const block = extraStorage.mode === 'block' ? extraStorage.blockGb : 1;
    const room = pool.ceilingGb === null ? Infinity : Math.max(pool.ceilingGb - pool.poolGb, 0);
    const maxAddable = Number.isFinite(room) ? Math.floor(room / block) * block : Infinity;
    const [value, setValue] = useState(String(Math.min(presets[0], maxAddable || presets[0])));
    const gb = parseFloat(value);

    let problem = '';
    if (!(gb > 0)) problem = 'Enter how many GB to add.';
    else if (gb % block !== 0) problem = `Storage is sold in blocks of ${block} GB.`;
    else if (gb > maxAddable) problem = maxAddable === 0 ? `This pool is already at the ${plan.name} ceiling.` : `Your ${plan.name} plan allows ${formatGb(maxAddable)} more in this pool.`;

    const valid = !problem;
    const price = valid ? extraStoragePrice(gb, extraStorage.currency) : { net: 0, vat: 0, total: 0 };
    const order = { currency: extraStorage.currency, subtotal: price.net, vat: price.vat, total: price.total, vatPercent: Math.round(extraStorage.vatRate * 1000) / 10 };
    const afterPool = pool.poolGb + (valid ? gb : 0);

    function submit(event) {
        event.preventDefault();
        if (!valid) return;
        toast({ tone: 'ok', title: 'On to payment', message: `Preview: this would charge ${formatPrice(price.total, extraStorage.currency)} and add ${formatGb(gb)} to ${domain.name}.` });
    }

    const track = pool.ceilingGb ? 100 / pool.ceilingGb : 0;

    return (
        <form onSubmit={submit} noValidate>
            <section className="st-scope" aria-labelledby={`${id}-sc`}>
                <span className="k" id={`${id}-sc`}>Adding to</span>
                <span className="nm">{domain.name}</span>
                <div className="meta">
                    <span>Plan: <b>{plan.name}</b></span>
                    <span>Pool now: <b>{pool.poolGb}</b> GB</span>
                    <span>Ceiling: <b>{pool.ceilingGb ? `${pool.ceilingGb} GB` : 'none'}</b></span>
                </div>
                {pool.ceilingGb && (
                    <div className="st-meter">
                        <div className="track" role="img" aria-label={`Pool of ${pool.poolGb} GB, adding ${valid ? gb : 0} GB, against a ${pool.ceilingGb} GB ceiling`}>
                            <i className="plan" style={{ width: `${pool.planGb * track}%` }} />
                            <i className="bought" style={{ width: `${pool.boughtGb * track}%` }} />
                            <i className="adding" style={{ width: `${(valid ? gb : 0) * track}%` }} />
                        </div>
                        <div className="marks"><span>{pool.poolGb} GB now &middot; {valid ? gb : 0} GB being added</span><span>{pool.ceilingGb} GB ceiling</span></div>
                        <div className="st-legend">
                            <span><i className="lg-plan" /> From your plan</span>
                            <span><i className="lg-bought" /> Bought already</span>
                            <span><i className="lg-adding" /> Adding now</span>
                        </div>
                    </div>
                )}
            </section>

            <fieldset className="pw-fieldset">
                <legend className="label">How much to add</legend>
                <p className="sm mut">
                    {formatPrice(extraStorage.price, extraStorage.currency)} for each {extraStorage.blockGb} GB a year, renewing with the plan. Buying now costs the full year whenever in the term you buy it.
                </p>
                <div className="gb-entry">
                    <span className="gb-in">
                        <Input id={`${id}-gb`} aria-label="Gigabytes to add" type="number" inputMode="numeric" min={block} step={block} value={value} aria-describedby={`${id}-lim`} aria-invalid={valid ? undefined : true} onChange={(e) => setValue(e.target.value)} />
                        <span className="unit">GB</span>
                    </span>
                    <div className="gb-steps" role="group" aria-label="Common amounts">
                        {presets.map((preset) => (
                            <Button key={preset} variant="line" size="sm" disabled={preset > maxAddable} onClick={() => setValue(String(preset))}>{preset}</Button>
                        ))}
                        {Number.isFinite(maxAddable) && maxAddable > 0 && <Button variant="line" size="sm" onClick={() => setValue(String(maxAddable))}>Fill the pool</Button>}
                    </div>
                </div>
                <p className="gb-limit" id={`${id}-lim`}>
                    {Number.isFinite(room)
                        ? <>Your <b>{plan.name}</b> plan allows up to <b>{pool.ceilingGb} GB</b> in this pool, so you can add <b>{formatGb(maxAddable)}</b> more.</>
                        : <>Your <b>{plan.name}</b> plan has no ceiling.</>}
                </p>
                <p className={`gb-note${valid ? ' is-ok' : ' is-bad'}`} role={valid ? undefined : 'alert'}>{valid ? `The pool becomes ${formatGb(afterPool)}.` : problem}</p>
            </fieldset>

            <OrderSummary order={order} rows={[{ label: `Extra storage ${valid ? formatGb(gb) : ''}`.trim(), value: formatPrice(price.net, extraStorage.currency) }]} totalLabel="Charged today">
                <p className="sm mut">Renews with <span className="mono">{domain.name}</span> on <b>{formatDate(renewsAt)}</b>.</p>
                <Button type="submit" size="lg" full className="mt" disabled={!valid}>Continue to payment</Button>
            </OrderSummary>
        </form>
    );
}
