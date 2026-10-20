// خدمة صغيرة تشتغل داخل TizenBrew على التلفزيون:
// 1) تعرض أيقونات التطبيقات الحقيقية من ملفات التلفزيون (قراءة فقط)
// 2) ترسل أزرار الريموت للتلفزيون نفسه (للمداخل HDMI)
var http = require('http');
var fs = require('fs');
var tls = require('tls');
var crypto = require('crypto');

var TYPES = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml', webp: 'image/webp' };

// ---------- أزرار الريموت عبر واجهة التلفزيون المحلية ----------
var sock = null, ready = false, queue = [];
function wsSend(text) {
  var data = Buffer.from ? Buffer.from(text) : new Buffer(text);
  var mask = crypto.randomBytes(4), len = data.length, head;
  if (len < 126) { head = new Buffer(2); head[0] = 0x81; head[1] = 0x80 | len; }
  else { head = new Buffer(4); head[0] = 0x81; head[1] = 0x80 | 126; head.writeUInt16BE(len, 2); }
  var out = new Buffer(len);
  for (var i = 0; i < len; i++) out[i] = data[i] ^ mask[i % 4];
  sock.write(Buffer.concat([head, mask, out]));
}
function connect() {
  ready = false;
  var name = new Buffer('شاشتي').toString('base64');
  sock = tls.connect({ host: '127.0.0.1', port: 8002, rejectUnauthorized: false }, function () {
    sock.write('GET /api/v2/channels/samsung.remote.control?name=' + encodeURIComponent(name) + ' HTTP/1.1\r\n' +
      'Host: 127.0.0.1:8002\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n' +
      'Sec-WebSocket-Key: ' + crypto.randomBytes(16).toString('base64') + '\r\nSec-WebSocket-Version: 13\r\n\r\n');
  });
  sock.on('data', function (d) {
    if (!ready && d.toString().indexOf('ms.channel.connect') !== -1) {
      ready = true;
      while (queue.length) wsSend(queue.shift());
    }
  });
  sock.on('error', function () { ready = false; sock = null; });
  sock.on('close', function () { ready = false; sock = null; });
}
function sendKey(key) {
  var msg = JSON.stringify({ method: 'ms.remote.control', params: { Cmd: 'Click', DataOfCmd: key, Option: 'false', TypeOfRemote: 'SendRemoteKey' } });
  if (sock && ready) wsSend(msg); else { queue.push(msg); if (!sock) connect(); }
}

// ---------- الخادم ----------
var server = http.createServer(function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  var u = require('url').parse(req.url, true);
  if (u.pathname === '/ping') { res.end('ok'); return; }
  if (u.pathname === '/icon') {
    var p = String(u.query.p || '').replace(/^file:\/\//, '');
    var ext = (p.split('.').pop() || '').toLowerCase();
    if (!TYPES[ext] || p.indexOf('..') !== -1) { res.statusCode = 404; res.end(); return; }
    fs.readFile(p, function (err, buf) {
      if (err) { res.statusCode = 404; res.end(); return; }
      res.setHeader('Content-Type', TYPES[ext]);
      res.setHeader('Cache-Control', 'max-age=86400');
      res.end(buf);
    });
    return;
  }
  if (u.pathname === '/key') {
    var k = String(u.query.k || '');
    if (/^KEY_[A-Z0-9_]+$/.test(k)) { sendKey(k); res.end('ok'); } else { res.statusCode = 400; res.end(); }
    return;
  }
  res.statusCode = 404; res.end();
});
server.on('error', function () {}); // لو الخدمة شغالة من قبل
server.listen(8095, '127.0.0.1');
