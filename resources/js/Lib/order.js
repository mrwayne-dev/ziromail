import { plans, plansFixture } from '../fixtures/plans';

/*
 * What a customer is about to pay for, computed from fixtures/plans.js. All
 * amounts are integer minor units. VAT is added on top of the listed price.
 * This is display arithmetic: the amount actually charged will come from the
 * server.
 */
export function buildOrder({ planCode, term = 'annual', currency = 'NGN' }) {
    const plan = plans.find((p) => p.code === planCode) ?? plans.find((p) => p.featured) ?? plans[0];
    const yearly = term === 'annual';
    const subtotal = plan.price[currency][yearly ? 'yearly' : 'monthly'];
    const vat = Math.round(subtotal * plansFixture.vatRate);

    return {
        plan,
        term,
        currency,
        subtotal,
        vat,
        total: subtotal + vat,
        vatPercent: Math.round(plansFixture.vatRate * 1000) / 10,
        termLabel: yearly ? 'Yearly' : 'Monthly',
        perLabel: yearly ? 'year' : 'month',
    };
}
