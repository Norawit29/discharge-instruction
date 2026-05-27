module.exports = function handler(req, res) {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  const key = process.env.OPENAI_API_KEY || '';
  res.send(
    'window.OPENAI_API_KEY = ' + JSON.stringify(key) + ';\n' +
    'window.LOCAL_IP = null;\n' +
    'window.LOCAL_PORT = null;\n'
  );
};
