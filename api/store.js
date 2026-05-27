// Compress discharge JSON with zlib deflate before base64url encoding.
// Thai text compresses ~60%, keeping QR well within v15-M capacity.
const zlib = require('zlib');

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const d = req.body || {};

    // Abbreviated keys, omit summary — reduces JSON overhead
    const compact = {
      t: d.diagnosisTitle || '',
      c: d.care || [],
      r: d.returnIf || [],
      f: { w: (d.followUp || {}).when || '', x: (d.followUp || {}).where || '' },
      i: d.issuedAt || '',
    };

    const compressed = zlib.deflateRawSync(
      Buffer.from(JSON.stringify(compact), 'utf8'),
      { level: 9 }
    );

    const b64 = compressed
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
    const url = proto + '://' + host + '/patient.html?d=' + b64;

    res.status(200).json({ id: b64.slice(0, 8), url: url });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
};
