import { formatDate } from './format';
import { formatPrice } from './money';

const VAT_RATE = 0.075;

// What extra storage costs for a year, in minor units (display only; the server quotes the real amount).
export function extraStoragePrice(gb, plan, currency = 'NGN') {
    const { blockGb, price } = plan.extraStorage;
    const net = Math.round((gb / blockGb) * price[currency].yearly);
    const vat = Math.round(net * VAT_RATE);
    return { net, vat, total: net + vat, perGb: Math.round(price[currency].yearly / blockGb) };
}

/*
 * What a plan change would do, stated before anything is confirmed: an upgrade takes effect now
 * and is charged pro rata; a downgrade waits for the end of the term and is blocked while more
 * storage is assigned than the new plan holds; extra storage is released either way.
 * `plans` are the plans from the server.
 */
export function planChangePreview({ domain, subscription, plans, targetCode }) {
    const current = plans.find((plan) => plan.code === subscription.planCode);
    const target = plans.find((plan) => plan.code === targetCode);
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
        const again = formatPrice(extraStoragePrice(subscription.extraStorageGb, target).net, 'NGN');
        bullets.push({ text: `Your ${subscription.extraStorageGb} GB of extra storage is released and not carried across. To keep it on ${target.name} you would buy it again at ${again} a year.`, warn: true });
    }

    return { direction, effective: direction === 'up' ? 'now' : subscription.renewsAt, bullets, blocked, targetName: target.name };
}
