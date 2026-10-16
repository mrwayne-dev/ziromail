import qrcode from 'qrcode-generator';
import { useMemo } from 'react';

const QUIET_ZONE = 2;

/*
 * A real QR code for `url`, drawn as one inline SVG path. It is generated in the
 * browser from the module matrix, so nothing is sent to an image service and it
 * stays sharp at any size. Pass `label` to say what scanning it does.
 */
export default function QrCode({ url, label, size = 160, className = '' }) {
    const { path, count } = useMemo(() => {
        const qr = qrcode(0, 'M');
        qr.addData(url);
        qr.make();
        const modules = qr.getModuleCount();
        let d = '';
        for (let row = 0; row < modules; row += 1) {
            for (let col = 0; col < modules; col += 1) {
                if (qr.isDark(row, col)) d += `M${col + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`;
            }
        }
        return { path: d, count: modules + QUIET_ZONE * 2 };
    }, [url]);

    return (
        <svg
            className={`qr ${className}`.trim()}
            width={size}
            height={size}
            viewBox={`0 0 ${count} ${count}`}
            shapeRendering="crispEdges"
            role="img"
            aria-label={label}
        >
            <rect width={count} height={count} className="qr-bg" />
            <path d={path} className="qr-mod" />
        </svg>
    );
}
