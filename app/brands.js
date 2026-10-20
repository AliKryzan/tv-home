// شعارات مرسومة للتطبيقات المشهورة، وغيرها يطلع بحرفه الأول
(function () {
  function wrap(bg, inner) {
    return { bg: bg, svg: '<svg viewBox="0 0 320 180" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="direction:ltr">' + inner + "</svg>" };
  }
  var T = 'font-family="IBM Plex Sans Arabic, Tahoma, sans-serif"';
  var B = [
    [/netflix|نتفل/i, function () { return wrap("#000", '<text x="160" y="116" text-anchor="middle" font-family="Bebas Neue, Impact, Arial Narrow, sans-serif" font-size="78" letter-spacing="3" fill="#E50914">NETFLIX</text>'); }],
    [/youtube kids/i, function () { return wrap("#fff", '<rect x="108" y="34" width="104" height="72" rx="20" fill="#ff0000"/><path d="M148,52 L148,88 L180,70 Z" fill="#fff"/><text x="160" y="146" text-anchor="middle" ' + T + ' font-weight="700" font-size="26" fill="#0f0f0f">YouTube Kids</text>'); }],
    [/youtube|يوتيوب/i, function () { return wrap("#fff", '<rect x="108" y="34" width="104" height="72" rx="20" fill="#ff0000"/><path d="M148,52 L148,88 L180,70 Z" fill="#fff"/><text x="160" y="146" text-anchor="middle" ' + T + ' font-weight="700" font-size="30" fill="#0f0f0f" letter-spacing="-1">YouTube</text>'); }],
    [/disney|ديزني/i, function () { return wrap("radial-gradient(ellipse at 50% 30%, #2459c8 0%, #0b2a7a 55%, #050f33 100%)", '<path d="M64,118 Q150,26 268,92" fill="none" stroke="#bfe3ff" stroke-width="3" stroke-linecap="round" opacity=".9"/><text x="160" y="124" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-weight="700" font-size="56" fill="#fff">Disney<tspan fill="#9fd8ff">+</tspan></text>'); }],
    [/shahid|شاهد/i, function () { return wrap("linear-gradient(135deg, #19d1bd, #007d74)", '<text x="160" y="118" text-anchor="middle" ' + T + ' font-weight="700" font-size="66" fill="#fff">شاهد</text>'); }],
    [/prime/i, function () { return wrap("linear-gradient(135deg, #1aa9e8, #0a6fb5)", '<text x="160" y="96" text-anchor="middle" ' + T + ' font-weight="700" font-size="54" fill="#fff">prime</text><path d="M104,108 Q160,134 218,104" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M206,100 L220,103 L214,116" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><text x="160" y="152" text-anchor="middle" ' + T + ' font-size="28" fill="#fff">video</text>'); }],
    [/spotify/i, function () { return wrap("#121212", '<circle cx="160" cy="76" r="42" fill="#1DB954"/><path d="M134,64 Q162,54 190,68 M138,80 Q162,72 184,82 M142,94 Q160,88 178,96" fill="none" stroke="#121212" stroke-width="6" stroke-linecap="round"/><text x="160" y="152" text-anchor="middle" ' + T + ' font-weight="700" font-size="26" fill="#fff">Spotify</text>'); }],
    [/apple tv/i, function () { return wrap("linear-gradient(180deg, #2b2b2e, #000)", '<text x="160" y="118" text-anchor="middle" ' + T + ' font-weight="600" font-size="62" fill="#fff" letter-spacing="-2">tv</text><text x="160" y="152" text-anchor="middle" ' + T + ' font-size="20" fill="#9a9aa0">Apple TV</text>'); }],
    [/osn/i, function () { return wrap("#0b0b0f", '<text x="160" y="118" text-anchor="middle" ' + T + ' font-weight="700" font-size="64" fill="#fff">osn<tspan fill="#e6007e">+</tspan></text>'); }],
    [/stc/i, function () { return wrap("linear-gradient(135deg, #6b14b8, #3a0070)", '<text x="160" y="116" text-anchor="middle" ' + T + ' font-weight="700" font-size="60" fill="#fff">stc <tspan fill="#ff375e">tv</tspan></text>'); }],
    [/\btod\b/i, function () { return wrap("linear-gradient(135deg, #5b2be0, #24107a)", '<text x="160" y="118" text-anchor="middle" ' + T + ' font-weight="700" font-size="66" fill="#fff" letter-spacing="4">TOD</text>'); }],
    [/internet|browser|متصفح/i, function () { return wrap("linear-gradient(135deg, #4d7cff, #1b3ea8)", '<circle cx="160" cy="80" r="40" fill="none" stroke="#fff" stroke-width="5"/><ellipse cx="160" cy="80" rx="16" ry="40" fill="none" stroke="#fff" stroke-width="4"/><path d="M120,80 L200,80" stroke="#fff" stroke-width="4"/><text x="160" y="154" text-anchor="middle" ' + T + ' font-weight="600" font-size="24" fill="#fff">الإنترنت</text>'); }]
  ];
  window.brandArt = function (name) {
    for (var i = 0; i < B.length; i++) if (B[i][0].test(name)) return B[i][1]();
    var h = 0; for (var j = 0; j < name.length; j++) h = (h * 31 + name.charCodeAt(j)) % 360;
    var ch = name.replace(/^[^A-Za-z؀-ۿ0-9]+/, "").charAt(0).toUpperCase() || "?";
    var safe = name.replace(/[<&>]/g, "");
    return wrap("linear-gradient(135deg, hsl(" + h + ",55%,44%), hsl(" + ((h + 40) % 360) + ",60%,22%))",
      '<text x="160" y="104" text-anchor="middle" ' + T + ' font-weight="700" font-size="76" fill="#fff" opacity=".95">' + ch + '</text>' +
      '<text x="160" y="148" text-anchor="middle" ' + T + ' font-weight="500" font-size="22" fill="#fff" opacity=".8">' + (safe.length > 18 ? safe.slice(0, 17) + "…" : safe) + "</text>");
  };
})();
