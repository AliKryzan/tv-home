(function () {
  var C = window.TV_CONFIG;
  var $ = function (id) { return document.getElementById(id); };
  var NAMES = { fajr: "الفجر", sunrise: "الشروق", dhuhr: "الظهر", asr: "العصر", maghrib: "المغرب", isha: "العشاء" };
  var ORDER = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
  var COLORS = { youtube: "#ff0000", netflix: "#000", shahid: "#00b1a5", prime: "#00a8e1", disney: "#0b2a6b",
    "apple": "#111", osn: "#111", stc: "#4f008c", tod: "#5b1ab5", spotify: "#1db954", mbc: "#00b1a5" };

  function digits(s) {
    s = String(s);
    if (C.digits !== "arab") return s;
    return s.replace(/[0-9]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩"[d]; });
  }
  function two(n) { return n < 10 ? "0" + n : "" + n; }
  function hm(d) { var h = d.getHours() % 12; if (h === 0) h = 12; return digits(h + ":" + two(d.getMinutes())); }
  function ampm(d) { return d.getHours() < 12 ? "ص" : "م"; }
  function fmt(d, opts, cal) {
    try { return new Intl.DateTimeFormat("ar-SA-u-ca-" + cal + "-nu-" + C.digits, opts).format(d); }
    catch (e) { return ""; }
  }
  function hijriMonth(d) {
    try { return parseInt(new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { month: "numeric" }).format(d), 10); }
    catch (e) { return 0; }
  }

  // ---------- الوقت والصلاة والخلفية ----------
  var today = null, times = null, nextKey = null;
  function computeTimes(now) {
    var key = now.toDateString();
    if (key === today) return;
    today = key;
    times = window.prayerTimes(now, C.lat, C.lng, C.tz, hijriMonth(now) === 9);
    var tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    times.fajrTomorrow = window.prayerTimes(tomorrow, C.lat, C.lng, C.tz, hijriMonth(tomorrow) === 9).fajr;
    var html = "";
    for (var i = 0; i < ORDER.length; i++) {
      var k = ORDER[i];
      html += '<div class="p" data-k="' + k + '"><b>' + NAMES[k] + "</b>" + hm(times[k]) + "</div>";
    }
    $("prayers").innerHTML = html;
  }
  function nextPrayer(now) {
    var list = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
    for (var i = 0; i < list.length; i++) if (times[list[i]] > now) return { k: list[i], t: times[list[i]] };
    return { k: "fajr", t: times.fajrTomorrow };
  }
  function remaining(ms) {
    var m = Math.max(0, Math.round(ms / 60000)), h = Math.floor(m / 60); m = m % 60;
    if (h === 0) return "بعد " + digits(m) + " دقيقة";
    return "بعد " + digits(h) + " ساعة و" + digits(m) + " دقيقة";
  }
  var SKIES = {
    night: "radial-gradient(ellipse at 70% 0%, #1d2b5a 0%, #0b1230 45%, #04060f 100%)",
    dawn: "linear-gradient(to bottom, #2b2d63 0%, #8a5a8c 45%, #f2a07b 85%, #f7c59f 100%)",
    morning: "linear-gradient(to bottom, #3d8bd9 0%, #79b6e8 55%, #cfe6f5 100%)",
    noon: "linear-gradient(to bottom, #1f6fc4 0%, #4fa3e3 60%, #a9d6f2 100%)",
    afternoon: "linear-gradient(to bottom, #3a6fb0 0%, #d7a35b 70%, #f0c27b 100%)",
    sunset: "linear-gradient(to bottom, #2c2557 0%, #8e3b5f 45%, #e8774a 80%, #f6b26b 100%)",
    dusk: "linear-gradient(to bottom, #141a3d 0%, #3b2b5f 55%, #7a4466 100%)"
  };
  var currentSky = "";
  function skyFor(now) {
    var t = times, m30 = 30 * 60000;
    if (now < t.fajr || now >= new Date(t.isha.getTime() + m30)) return "night";
    if (now < new Date(t.sunrise.getTime() + m30)) return "dawn";
    if (now < new Date(t.dhuhr.getTime() - 2 * 3600000)) return "morning";
    if (now < t.asr) return "noon";
    if (now < new Date(t.maghrib.getTime() - m30)) return "afternoon";
    if (now < new Date(t.maghrib.getTime() + m30)) return "sunset";
    return "dusk";
  }
  function tick() {
    var now = new Date();
    computeTimes(now);
    $("clock").innerHTML = hm(now) + '<span style="font-size:48px;margin-right:12px">' + ampm(now) + "</span>";
    var dateTxt = fmt(now, { weekday: "long", day: "numeric", month: "long", year: "numeric" }, "gregory");
    var hijriTxt = fmt(now, { day: "numeric", month: "long", year: "numeric" }, "islamic-umalqura");
    $("date").textContent = dateTxt;
    $("hijri").textContent = hijriTxt;
    var np = nextPrayer(now);
    $("npName").innerHTML = NAMES[np.k] + ' <span style="font-size:30px;font-weight:500">' + hm(np.t) + " " + ampm(np.t) + "</span>";
    $("npIn").textContent = remaining(np.t - now);
    if (np.k !== nextKey) {
      nextKey = np.k;
      var ps = document.querySelectorAll(".p");
      for (var i = 0; i < ps.length; i++) ps[i].className = "p" + (ps[i].getAttribute("data-k") === np.k ? " next" : "");
    }
    var sky = skyFor(now);
    if (sky !== currentSky) { currentSky = sky; $("sky").style.background = SKIES[sky]; }
    // شاشة التوقف
    $("sClock").textContent = hm(now);
    $("sDate").textContent = dateTxt + "  ·  " + hijriTxt;
    $("sPrayer").textContent = NAMES[np.k] + " " + hm(np.t) + " · " + remaining(np.t - now);
  }

  // ---------- الطقس ----------
  var WMO = { 0: "صافي", 1: "صافي غالباً", 2: "غائم جزئياً", 3: "غائم", 45: "ضباب", 48: "ضباب", 51: "رذاذ", 53: "رذاذ", 55: "رذاذ",
    61: "مطر خفيف", 63: "مطر", 65: "مطر غزير", 80: "زخات مطر", 81: "زخات مطر", 82: "زخات قوية", 95: "عاصفة رعدية", 96: "عاصفة رعدية", 99: "عاصفة رعدية" };
  function weather() {
    $("wCity").textContent = C.city; $("sCity").textContent = C.city;
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + C.lat + "&longitude=" + C.lng +
      "&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1";
    var x = new XMLHttpRequest();
    x.open("GET", url);
    x.onload = function () {
      try {
        var d = JSON.parse(x.responseText), t = Math.round(d.current.temperature_2m);
        var desc = WMO[d.current.weather_code] || "";
        $("wTemp").textContent = digits(t) + "°";
        $("wDesc").textContent = desc + " · العظمى " + digits(Math.round(d.daily.temperature_2m_max[0])) + "° الصغرى " + digits(Math.round(d.daily.temperature_2m_min[0])) + "°";
        $("sWeather").textContent = digits(t) + "° " + desc;
      } catch (e) {}
    };
    x.send();
  }

  // ---------- التطبيقات ----------
  function tileColor(name) {
    var n = name.toLowerCase();
    for (var k in COLORS) if (n.indexOf(k) !== -1) return COLORS[k];
    var h = 0; for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % 360;
    return "hsl(" + h + ",45%,32%)";
  }
  function makeTile(app) {
    var el = document.createElement("div");
    el.className = "tile focusable";
    el.style.background = tileColor(app.name);
    el.setAttribute("data-id", app.id);
    if (app.icon) {
      var img = document.createElement("img");
      img.src = app.icon.indexOf("://") === -1 ? "file://" + app.icon : app.icon;
      img.onerror = function () { img.parentNode && img.parentNode.removeChild(img); };
      el.appendChild(img);
    }
    var nm = document.createElement("div"); nm.className = "nm"; nm.textContent = app.name; el.appendChild(nm);
    return el;
  }
  var HIDE = /tizenbrew|smartthings|e-manual|manual|universal guide|gallery|game bar|internet$|^settings|web browser|samsung account/i;
  function loadApps() {
    if (!window.tizen || !tizen.application) { demoApps(); return; }
    tizen.application.getAppsInfo(function (list) {
      var apps = [];
      for (var i = 0; i < list.length; i++) {
        var a = list[i];
        if (a.show === false || !a.name) continue;
        if (HIDE.test(a.name)) continue;
        apps.push({ id: a.id, name: a.name, icon: a.iconPath });
      }
      apps.sort(function (a, b) { return a.name.localeCompare(b.name); });
      render(apps);
    }, function () { demoApps(); });
  }
  function demoApps() {
    render(["YouTube", "Netflix", "Shahid", "Prime Video", "Disney+", "Apple TV", "OSN+", "Spotify", "Internet", "TOD", "STC tv", "Plex"]
      .map(function (n) { return { id: "demo." + n, name: n }; }));
  }
  function render(apps) {
    var favs = [], used = {};
    for (var i = 0; i < C.favorites.length; i++) {
      var want = C.favorites[i].toLowerCase();
      for (var j = 0; j < apps.length; j++) {
        if (!used[apps[j].id] && apps[j].name.toLowerCase().indexOf(want) !== -1) { favs.push(apps[j]); used[apps[j].id] = 1; break; }
      }
    }
    var f = $("favs"), a = $("all"); f.innerHTML = ""; a.innerHTML = "";
    favs.slice(0, 7).forEach(function (x) { f.appendChild(makeTile(x)); });
    apps.forEach(function (x) { a.appendChild(makeTile(x)); });
    $("allCount").textContent = digits(apps.length);
    focus(document.querySelector(".focusable"));
  }
  function toast(msg) { var t = $("toast"); t.textContent = msg; t.className = "on"; setTimeout(function () { t.className = ""; }, 2500); }
  function launch(el) {
    var id = el.getAttribute("data-id");
    if (!window.tizen || id.indexOf("demo.") === 0) { toast("تشغيل: " + el.textContent); return; }
    tizen.application.launch(id, function () {}, function () { toast("ما قدرت أفتح التطبيق"); });
  }

  // ---------- التنقل بالأسهم ----------
  var cur = null;
  function focus(el) {
    if (!el) return;
    if (cur) cur.classList.remove("focus");
    cur = el; el.classList.add("focus");
    var inGrid = el.parentNode.id === "all";
    $("home").classList.toggle("scrolled", inGrid);
    if (inGrid) {
      var g = $("all"), top = el.offsetTop - g.offsetTop;
      g.scrollTop = Math.max(0, top - 10);
    }
  }
  function move(dir) {
    if (!cur) { focus(document.querySelector(".focusable")); return; }
    var r = cur.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var best = null, bestScore = 1e9, all = document.querySelectorAll(".focusable");
    for (var i = 0; i < all.length; i++) {
      var e = all[i]; if (e === cur) continue;
      var b = e.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2;
      var dx = x - cx, dy = y - cy, main, cross;
      if (dir === "left") { if (dx >= -5) continue; main = -dx; cross = Math.abs(dy); }
      else if (dir === "right") { if (dx <= 5) continue; main = dx; cross = Math.abs(dy); }
      else if (dir === "up") { if (dy >= -5) continue; main = -dy; cross = Math.abs(dx); }
      else { if (dy <= 5) continue; main = dy; cross = Math.abs(dx); }
      if ((dir === "left" || dir === "right") && cross > r.height) continue;
      var score = main + cross * 2.5;
      if (score < bestScore) { bestScore = score; best = e; }
    }
    if (best) focus(best);
  }

  // ---------- شاشة التوقف ----------
  var idle = 0;
  function wake() { idle = 0; if (!$("saver").hidden) { $("saver").hidden = true; return true; } return false; }
  setInterval(function () { idle += 1; if (idle >= C.screensaverMinutes * 60) $("saver").hidden = false; }, 1000);

  document.addEventListener("keydown", function (e) {
    if (wake()) { e.preventDefault(); return; }
    switch (e.keyCode) {
      case 37: move("left"); break;
      case 39: move("right"); break;
      case 38: move("up"); break;
      case 40: move("down"); break;
      case 13: if (cur) launch(cur); break;
      case 403: $("saver").hidden = false; break;        // الزر الأحمر: شاشة التوقف فوراً
      case 10009: break;                                  // رجوع: لا شي
      default: return;
    }
    e.preventDefault();
  });
  document.addEventListener("visibilitychange", function () { if (!document.hidden) { wake(); weather(); } });

  tick(); setInterval(tick, 15000);
  weather(); setInterval(weather, 30 * 60000);
  loadApps();
})();
