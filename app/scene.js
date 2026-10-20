// مشهد صحراء الرياض: السماء والشمس والقمر والنجوم تتبع الوقت الحقيقي
(function () {
  var PAL = {
    night:     { sky: ["#03050f", "#0a1430", "#17224a"], dunes: ["#151a33", "#0e1226", "#080a17"], stars: 1,   city: 1 },
    fajr:      { sky: ["#141a45", "#4a3a72", "#d08a7e"], dunes: ["#3a2d4e", "#29203f", "#18132b"], stars: .35, city: .6 },
    sunrise:   { sky: ["#5277bd", "#eaa27c", "#ffd6a5"], dunes: ["#c98d5f", "#a96a40", "#7c4a2b"], stars: 0,   city: 0 },
    day:       { sky: ["#2a78cf", "#73b3e9", "#d6ecfa"], dunes: ["#e3b27c", "#cf9358", "#ad6f3a"], stars: 0,   city: 0 },
    afternoon: { sky: ["#3a73bb", "#a7c0d6", "#f4d29a"], dunes: ["#dba167", "#c2824a", "#9b6131"], stars: 0,   city: 0 },
    sunset:    { sky: ["#272b63", "#c4567b", "#ff9b58"], dunes: ["#8d4e49", "#69353f", "#43202d"], stars: 0,   city: .3 },
    dusk:      { sky: ["#0d1436", "#382d69", "#8b4f7b"], dunes: ["#2a2344", "#1d1834", "#120e22"], stars: .6,  city: 1 }
  };
  window.scenePhase = function (now, t) {
    var M = 60000;
    if (now < t.fajr) return "night";
    if (now < t.sunrise) return "fajr";
    if (now < t.sunrise.getTime() + 60 * M) return "sunrise";
    if (now < t.asr) return "day";
    if (now < t.maghrib.getTime() - 45 * M) return "afternoon";
    if (now < t.maghrib.getTime() + 20 * M) return "sunset";
    if (now < t.isha.getTime() + 40 * M) return "dusk";
    return "night";
  };
  var stars = "";
  (function () {
    var s = 7;
    function r() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    for (var i = 0; i < 150; i++) {
      var x = Math.round(r() * 1920), y = Math.round(r() * 620), rad = (0.6 + r() * 1.4).toFixed(2), o = (0.35 + r() * 0.65).toFixed(2);
      stars += '<circle cx="' + x + '" cy="' + y + '" r="' + rad + '" fill="#fff" opacity="' + o + '"/>';
    }
  })();
  function skyline(color, lights) {
    var c = color, g = '<g fill="' + c + '">';
    // أبراج منخفضة
    var b = [[980, 40, 60], [1030, 30, 90], [1062, 24, 55], [1090, 36, 120], [1250, 34, 80], [1288, 26, 130], [1420, 40, 70], [1462, 30, 100], [1500, 44, 60], [900, 36, 50]];
    for (var i = 0; i < b.length; i++) g += '<rect x="' + b[i][0] + '" y="' + (720 - b[i][2]) + '" width="' + b[i][1] + '" height="' + b[i][2] + '"/>';
    // برج المملكة
    g += '<path fill-rule="evenodd" d="M1150,720 L1166,468 L1214,468 L1230,720 Z M1171,468 L1209,468 Q1201,548 1190,566 Q1179,548 1171,468 Z"/>';
    g += '<rect x="1174" y="492" width="32" height="5"/>';
    // برج الفيصلية
    g += '<path d="M1330,720 L1372,538 L1414,720 Z"/><rect x="1370.5" y="506" width="3" height="34"/>';
    g += "</g>";
    g += '<circle cx="1372" cy="596" r="11" fill="' + (lights ? "#ffd27a" : c) + '"/>';
    if (lights) {
      var L = [[1185, 520], [1195, 600], [1188, 650], [1100, 640], [1300, 630], [1040, 670], [1470, 660], [1260, 680], [1372, 660]];
      for (var j = 0; j < L.length; j++) g += '<circle cx="' + L[j][0] + '" cy="' + L[j][1] + '" r="1.8" fill="#ffd27a" opacity="' + lights + '"/>';
    }
    return g;
  }
  window.renderScene = function (el, now, t, nextSunrise) {
    var ph = window.scenePhase(now, t), p = PAL[ph], s = p.sky, d = p.dunes;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">' +
      '<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + s[0] + '"/><stop offset=".55" stop-color="' + s[1] + '"/><stop offset=".78" stop-color="' + s[2] + '"/></linearGradient>' +
      '<radialGradient id="sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff7e0"/><stop offset=".18" stop-color="#ffe7a8" stop-opacity=".95"/><stop offset=".45" stop-color="#ffcf7a" stop-opacity=".25"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="moon" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#eef2ff" stop-opacity=".5"/><stop offset="1" stop-color="#eef2ff" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="d1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + d[0] + '"/><stop offset="1" stop-color="' + d[1] + '"/></linearGradient>' +
      '<linearGradient id="d2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + d[1] + '"/><stop offset="1" stop-color="' + d[2] + '"/></linearGradient>' +
      '</defs><rect width="1920" height="1080" fill="url(#sk)"/>';
    if (p.stars) svg += '<g opacity="' + p.stars + '">' + stars + "</g>";
    // الشمس
    var day = (now - t.sunrise) / (t.maghrib - t.sunrise);
    if (day > -0.04 && day < 1.04) {
      var x = 160 + 1600 * day, y = 840 - 640 * Math.sin(Math.PI * Math.min(1, Math.max(0, day)));
      svg += '<circle cx="' + x + '" cy="' + y + '" r="260" fill="url(#sun)"/><circle cx="' + x + '" cy="' + y + '" r="46" fill="#fff8e6"/>';
    } else {
      var start = now < t.sunrise ? t.maghrib.getTime() - 86400000 : t.maghrib.getTime();
      var end = now < t.sunrise ? t.sunrise.getTime() : nextSunrise.getTime();
      var n = (now - start) / (end - start);
      if (n > 0 && n < 1) {
        var mx = 160 + 1600 * n, my = 820 - 600 * Math.sin(Math.PI * n);
        svg += '<mask id="cres"><rect width="1920" height="1080" fill="#fff"/><circle cx="' + (mx + 13) + '" cy="' + (my - 8) + '" r="27" fill="#000"/></mask>' +
          '<circle cx="' + mx + '" cy="' + my + '" r="120" fill="url(#moon)"/><circle cx="' + mx + '" cy="' + my + '" r="30" fill="#f4f1e6" mask="url(#cres)"/>';
      }
    }
    svg += '<g opacity=".9">' + skyline(d[1], p.city) + "</g>";
    svg += '<path fill="url(#d1)" d="M0,760 C300,700 520,725 760,700 C1040,668 1250,712 1500,690 C1700,672 1820,700 1920,688 L1920,1080 L0,1080Z"/>';
    svg += '<path fill="url(#d2)" d="M0,842 C260,792 480,802 700,824 C980,850 1180,772 1460,782 C1680,792 1800,824 1920,808 L1920,1080 L0,1080Z"/>';
    svg += '<path fill="' + d[2] + '" d="M0,936 C320,884 560,966 900,918 C1200,876 1460,952 1920,902 L1920,1080 L0,1080Z"/>';
    svg += "</svg>";
    el.innerHTML = svg;
    return ph;
  };
})();
