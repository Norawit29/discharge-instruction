// Encode discharge data as compact base64url in the patient URL.
// Abbreviated keys + truncation keep the QR within v40-L capacity (~2953 bytes).
module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const d = req.body || {};

    function trunc(s, n) {
      if (!s || typeof s !== 'string') return '';
      return s.length > n ? s.slice(0, n) + '…' : s;
    }

    // Abbreviated keys, no summary — keeps JSON under ~2000 bytes for typical AI output
    const compact = {
      t: trunc(d.diagnosisTitle, 50),
      c: (d.care || []).slice(0, 5).map(function(s) { return trunc(s, 70); }),
      r: (d.returnIf || []).slice(0, 5).map(function(s) { return trunc(s, 60); }),
      f: {
        w: trunc((d.followUp || {}).when, 35),
        x: trunc((d.followUp || {}).where, 50),
      },
      i: trunc(d.issuedAt, 30),
    };

    const b64 = Buffer.from(JSON.stringify(compact), 'utf8')
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
