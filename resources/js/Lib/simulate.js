// Stands in for a network round trip until there is a server to call. Skipped
// entirely for people who ask for reduced motion.
export function simulateLatency(ms = 600) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return new Promise((resolve) => setTimeout(resolve, reduced ? 0 : ms));
}
