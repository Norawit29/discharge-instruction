// Real QR code using qrcode-generator (loaded globally as window.qrcode).
// Falls back to a placeholder if the library isn't loaded yet.
function RealQR({ value = '', size = 168, fg = '#0F1419', bg = '#fff' }) {
  const [path, setPath] = React.useState('');

  React.useEffect(() => {
    if (!value || !window.qrcode) return;
    try {
      const qr = window.qrcode(0, 'L'); // L = max capacity (no logo overlay)
      qr.addData(value, 'Byte');
      qr.make();
      const n = qr.getModuleCount();
      const cell = size / n;
      const parts = [];
      for (let row = 0; row < n; row++) {
        for (let col = 0; col < n; col++) {
          if (qr.isDark(row, col)) {
            const x = (col * cell).toFixed(3);
            const y = (row * cell).toFixed(3);
            const w = cell.toFixed(3);
            parts.push(`M${x},${y}h${w}v${w}h-${w}z`);
          }
        }
      }
      setPath(parts.join(''));
    } catch (e) {
      console.error('QR generation error:', e);
    }
  }, [value, size]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', borderRadius: 8 }}
    >
      <rect width={size} height={size} fill={bg} />
      {path
        ? <path d={path} fill={fg} />
        : <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="middle"
            fill="var(--ink-3)" fontSize="11" fontFamily="inherit">กำลังสร้าง QR…</text>
      }
    </svg>
  );
}

window.FakeQR = RealQR;
