// Serverless /store: encodes discharge data as base64url in the patient URL.
// No server-side storage needed — data travels in the URL itself.
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const b64 = Buffer.from(JSON.stringify(req.body), 'utf8').toString('base64url');
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const url = `${proto}://${host}/patient.html?d=${b64}`;
    res.status(200).json({ id: b64.slice(0, 8), url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
