// Always uses the .logo class — never an inline height (DESIGN.md §1).
const SRC = {
    white: '/images/ziroemail-wordmark-white.png',
    black: '/images/ziroemail-wordmark-black.png',
};

export default function Logo({ variant = 'black', className = '', decorative = false }) {
    return (
        <img
            className={`logo ${className}`.trim()}
            src={SRC[variant]}
            alt={decorative ? '' : 'Ziroemail'}
            aria-hidden={decorative || undefined}
            width="150"
            height="37"
        />
    );
}
