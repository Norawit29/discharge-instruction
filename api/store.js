module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const data = req.body || {};
    // base64url without relying on Buffer 'base64url' encoding (works on all Node versions)
    const b64 = Buffer.from(JSON.stringify(data), 'utf8')
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
