import { plansFixture } from '../fixtures/plans';
import { formatDate } from './format';
import { formatPrice } from './money';

const EXTRA = plansFixture.extraStorage;

// What a block of extra storage costs for a year, in naira minor units (display only).
export function extraStoragePrice(gb, currency = 'NGN') {
    const blocks = gb / EXTRA.blockGb;
    const net = Math.round(blocks * EXTRA.price[currency].yearly);
    const vat = Math.round(net * plansFixture.vatRate);
    return { net, vat, total: net + vat, perGb: Math.round(EXTRA.price[currency].yearly / EXTRA.blockGb) };
}

/*
 * What a plan change would do, stated before anything is confirmed. Display
 * rules from the prototype: an upgrade takes effect now and is charged pro rata;
 * a downgrade waits for the end of the term and is blocked while more storage is
 * assigned than the new plan holds; extra storage is released either way. The
 * server returns this same shape (PlanChangePreview) once billing exists.
 */
export function planChangePreview({ domain, subscription, targetCode }) {
    const current = plansFixture.plans.find((plan) => plan.code === subscription.planCode);
    const target = plansFixture.plans.find((plan) => plan.code === targetCode);
    if (!target || target.code === current.code) return { direction: 'same', effective: null, bullets: [], blocked: null, targetName: current.name };

    const direction = target.poolGb > current.poolGb ? 'up' : 'down';
    const renews = formatDate(subscription.renewsAt);
    const yearly = formatPrice(target.price.NGN.yearly, 'NGN');
    const bullets = [];
    let blocked = null;

    if (direction === 'up') {
        bullets.push({ text: `Your pool becomes ${target.poolGb} GB as soon as payment clears.` });
        bullets.push({ text: 'You pay the difference for the rest of this term, pro rata, not a full year again.' });
    } else {
        bullets.push({ text: `You stay on ${current.name} until ${renews} and keep ${current.poolGb} GB until then. Downgrades never take effect mid-term.` });
        bullets.push({ text: `From that date your pool is ${target.poolGb} GB and you are billed ${yearly} a year.` });
        if (domain.assignedGb > target.poolGb) {
            blocked = { assignedGb: domain.assignedGb, newPoolGb: target.poolGb };
            bullets.push({ text: `You have ${domain.assignedGb} GB assigned across your mailboxes. That is more than ${target.name} holds, so you must lower quotas by at least ${Math.round((domain.assignedGb - target.poolGb) * 10) / 10} GB before the change date or it will not go through.`, warn: true });
        }
    }

    if (subscription.extraStorageGb > 0) {
        const again = formatPrice(extraStoragePrice(subscription.extraStorageGb).net, 'NGN');
        bullets.push({ text: `Your ${subscription.extraStorageGb} GB of extra storage is released and not carried across. To keep it on ${target.name} you would buy it again at ${again} a year.`, warn: true });
    }

    return { direction, effective: direction === 'up' ? 'now' : subscription.renewsAt, bullets, blocked, targetName: target.name };
}
