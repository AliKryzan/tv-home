(function () {
  var C = window.TV_CONFIG;
  var $ = function (id) { return document.getElementById(id); };
  var SVC = "http://127.0.0.1:8095";
  var NAMES = { fajr: "الفجر", sunrise: "الشروق", dhuhr: "الظهر", asr: "العصر", maghrib: "المغرب", isha: "العشاء" };

  // ---------- إعدادات محفوظة ----------
  var S = { digits: C.digits, bg: "auto", saverMin: C.screensaverMinutes, favs: null };
  try { var saved = JSON.parse(localStorage.getItem("tvhome") || "{}"); for (var k in saved) S[k] = saved[k]; } catch (e) {}
  function save() { try { localStorage.setItem("tvhome", JSON.stringify(S)); } catch (e) {} }

  function digits(s) { s = String(s); return S.digits === "arab" ? s.replace(/[0-9]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩"[d]; }) : s; }
  function two(n) { return n < 10 ? "0" + n : "" + n; }
  function hm(d) { var h = d.getHours() % 12; if (h === 0) h = 12; return digits(h + ":" + two(d.getMinutes())); }
  function ampm(d) { return d.getHours() < 12 ? "ص" : "م"; }
  function fmt(d, opts, cal) {
    try { return new Intl.DateTimeFormat("ar-SA-u-ca-" + cal + "-nu-" + S.digits, opts).format(d); } catch (e) { return ""; }
  }
  function hijriMonth(d) {
    try { return parseInt(new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { month: "numeric" }).format(d), 10); } catch (e) { return 0; }
  }
  function remaining(ms) {
    var m = Math.max(0, Math.round(ms / 60000)), h = Math.floor(m / 60); m = m % 60;
    if (h === 0) return "بعد " + digits(m) + " دقيقة";
    if (m === 0) return "بعد " + digits(h) + " ساعة";
    return "بعد " + digits(h) + " ساعة و" + digits(m) + " دقيقة";
  }

  // ---------- الوقت والصلاة ----------
  var today = null, T = null, nextSunrise = null;
  function computeTimes(now) {
    if (now.toDateString() === today) return;
    today = now.toDateString();
    T = window.prayerTimes(now, C.lat, C.lng, C.tz, hijriMonth(now) === 9);
    var tm = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    var T2 = window.prayerTimes(tm, C.lat, C.lng, C.tz, hijriMonth(tm) === 9);
    T.fajrTomorrow = T2.fajr; nextSunrise = T2.sunrise;
  }
  function nextPrayer(now) {
    var l = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
    for (var i = 0; i < l.length; i++) if (T[l[i]] > now) return { k: l[i], t: T[l[i]] };
    return { k: "fajr", t: T.fajrTomorrow };
  }

  // ---------- الخلفية ----------
  var lastPhase = "", lastSceneMin = -1, photoIdx = 0;
  function photoGroup(ph) { return ph === "fajr" || ph === "sunrise" ? "fajr" : ph === "day" || ph === "afternoon" ? "day" : ph === "sunset" || ph === "dusk" ? "sunset" : "night"; }
  function updateBg(now) {
    var ph = window.scenePhase(now, T), mins = Math.floor(now.getTime() / 300000);
    if (mins !== lastSceneMin) { lastSceneMin = mins; window.renderScene($("scene"), now, T, nextSunrise); }
    var list = (C.photos && C.photos[photoGroup(ph)]) || [];
    var usePhoto = S.bg !== "scene" && list.length > 0;
    if (usePhoto && (ph !== lastPhase || !$("photo").classList.contains("on"))) {
      var src = "bg/" + list[photoIdx % list.length];
      var img = new Image();
      img.onload = function () { $("photo").style.backgroundImage = "url('" + src + "')"; $("photo").classList.add("on"); };
      img.src = src;
    }
    if (!usePhoto) $("photo").classList.remove("on");
    lastPhase = ph;
  }

  function tick() {
    var now = new Date();
    computeTimes(now);
    $("clock").textContent = hm(now); $("ampm").textContent = ampm(now);
    var dateTxt = fmt(now, { weekday: "long", day: "numeric", month: "long", year: "numeric" }, "gregory");
    var hij = fmt(now, { day: "numeric", month: "long" }, "islamic-umalqura");
    $("date").textContent = dateTxt + (hij ? "  ·  " + hij : "");
    var np = nextPrayer(now);
    $("prayerLine").innerHTML = "<b>" + NAMES[np.k] + "</b> " + hm(np.t) + " " + ampm(np.t) + '<span class="in">' + remaining(np.t - now) + "</span>";
    $("sClock").textContent = hm(now);
    $("sDate").textContent = dateTxt + (hij ? "  ·  " + hij : "");
    $("sPrayer").textContent = NAMES[np.k] + " " + hm(np.t) + " " + ampm(np.t);
    $("sPrayerIn").textContent = remaining(np.t - now);
    updateBg(now);
  }

  // ---------- الطقس ----------
  var WMO = { 0: "صافي", 1: "صافي غالباً", 2: "غائم جزئياً", 3: "غائم", 45: "ضباب", 48: "ضباب", 51: "رذاذ", 53: "رذاذ", 55: "رذاذ",
    61: "مطر خفيف", 63: "مطر", 65: "مطر غزير", 80: "زخات مطر", 81: "زخات مطر", 82: "زخات قوية", 95: "عاصفة رعدية", 96: "عاصفة رعدية", 99: "عاصفة رعدية" };
  function weather() {
    $("sCity").textContent = C.city;
    var x = new XMLHttpRequest();
    x.open("GET", "https://api.open-meteo.com/v1/forecast?latitude=" + C.lat + "&longitude=" + C.lng +
      "&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1");
    x.onload = function () {
      try {
        var d = JSON.parse(x.responseText), t = Math.round(d.current.temperature_2m), desc = WMO[d.current.weather_code] || "";
        $("sWeather").textContent = digits(t) + "° " + desc;
        $("sWeatherDesc").textContent = "العظمى " + digits(Math.round(d.daily.temperature_2m_max[0])) + "°  الصغرى " + digits(Math.round(d.daily.temperature_2m_min[0])) + "°";
        weatherTxt = C.city + "  " + digits(t) + "° " + desc;
        if (cur && !cur.getAttribute("data-id")) showTitle(cur);
      } catch (e) {}
    };
    x.send();
  }
  var weatherTxt = "";

  // ---------- التطبيقات ----------
  var APPS = [], byId = {}, svcOk = false;
  var HIDE = /tizenbrew|smartthings|e-manual|universal guide|game bar|samsung account|^settings$|workspace|samsung health|ambient/i;
  function makeApp(app) {
    var el = document.createElement("div");
    el.className = "app focusable";
    el.setAttribute("data-id", app.id);
    var art = window.brandArt(app.name);
    var box = document.createElement("div"); box.className = "art"; box.style.background = art.bg; box.innerHTML = art.svg;
    el.appendChild(box);
    if (svcOk && app.icon) {
      var img = new Image();
      img.onload = function () {
        if (img.naturalWidth < 40) return;
        box.innerHTML = ""; box.style.background = "#fff"; box.appendChild(img);
      };
      img.src = SVC + "/icon?p=" + encodeURIComponent(app.icon);
    }
    return el;
  }
  function defaultFavs() {
    var out = [], used = {};
    for (var i = 0; i < C.favorites.length; i++) {
      var w = C.favorites[i].toLowerCase();
      for (var j = 0; j < APPS.length; j++) if (!used[APPS[j].id] && APPS[j].name.toLowerCase().indexOf(w) !== -1) { out.push(APPS[j].id); used[APPS[j].id] = 1; break; }
    }
    return out;
  }
  function favIds() {
    var ids = (S.favs || defaultFavs()).filter(function (id) { return byId[id]; });
    return ids;
  }
  function render(keepId) {
    var f = $("favs"), a = $("all"), ids = favIds(), isFav = {};
    f.innerHTML = ""; a.innerHTML = "";
    ids.forEach(function (id) { isFav[id] = 1; f.appendChild(makeApp(byId[id])); });
    APPS.forEach(function (x) { var el = makeApp(x); if (isFav[x.id]) el.classList.add("fav"); a.appendChild(el); });
    $("favCount").textContent = digits(ids.length);
    $("allCount").textContent = digits(APPS.length);
    trackX = 0; $("favs").style.transform = "translateX(0px)";
    var target = null;
    if (keepId) target = document.querySelector((keepId.inFav ? "#favs" : "#all") + ' .app[data-id="' + keepId.id + '"]');
    focus(target || document.querySelector("#favs .app") || document.querySelector(".focusable"));
  }
  function loadApps() {
    function done(list) {
      APPS = []; byId = {};
      list.forEach(function (a) { if (a.show === false || !a.name || HIDE.test(a.name)) return; var o = { id: a.id, name: a.name, icon: a.iconPath }; APPS.push(o); byId[o.id] = o; });
      APPS.sort(function (a, b) { return a.name.localeCompare(b.name); });
      render();
    }
    if (!window.tizen || !tizen.application) {
      done(["YouTube", "Netflix", "Bob", "Disney+", "Shahid", "Prime Video", "Apple TV", "OSN+", "Spotify", "Internet", "TOD", "stc tv", "Plex", "Anghami", "beIN CONNECT"].map(function (n) { return { id: "demo." + n, name: n }; }));
      return;
    }
    tizen.application.getAppsInfo(done, function () { done([]); });
  }
  function ping(cb) {
    var x = new XMLHttpRequest(), t = setTimeout(function () { x.abort(); cb(false); }, 1500);
    x.open("GET", SVC + "/ping");
    x.onload = function () { clearTimeout(t); cb(x.responseText === "ok"); };
    x.onerror = function () { clearTimeout(t); cb(false); };
    x.send();
  }
  function toast(m) { var t = $("toast"); t.textContent = m; t.className = "on"; clearTimeout(toast.t); toast.t = setTimeout(function () { t.className = ""; }, 2600); }
  function launch(id) {
    if (!window.tizen || id.indexOf("demo.") === 0) { toast("تشغيل " + byId[id].name); return; }
    tizen.application.launch(id, function () {}, function () { toast("ما قدرت أفتح التطبيق"); });
  }
  function sendKey(k, label) {
    if (!svcOk) { toast("المداخل تحتاج خدمة الواجهة. أعد فتح شاشتي"); return; }
    var x = new XMLHttpRequest(); x.open("GET", SVC + "/key?k=" + k); x.send();
    toast("التحويل إلى " + label + ". لو طلب التلفزيون إذن، وافق مرة وحدة");
  }

  // ---------- العنوان الكبير ----------
  function showTitle(el) {
    var t = $("appTitle"), s = $("appSub"), id = el.getAttribute("data-id");
    var name = "", sub = "";
    if (id && byId[id]) {
      name = byId[id].name;
      var inFav = el.parentNode.id === "favs", list = el.parentNode.children, idx = 0;
      for (var i = 0; i < list.length; i++) if (list[i] === el) idx = i;
      sub = (inFav ? "المفضلة " : "كل التطبيقات ") + digits(idx + 1) + " من " + digits(list.length);
      if (!inFav) sub += el.classList.contains("fav") ? "  ·  في المفضلة" : "  ·  الزر الأخضر يضيفه للمفضلة";
      if (moving) sub = "حرّك بالأسهم، واضغط OK للتثبيت";
    } else if (el.classList.contains("input")) { name = el.textContent; sub = "المداخل"; }
    else { name = fmt(new Date(), { weekday: "long" }, "gregory") || "شاشتي"; sub = weatherTxt; }
    t.textContent = name; t.className = "appTitle" + (/[؀-ۿ]/.test(name) ? " ar" : ""); s.textContent = sub;
  }

  // ---------- التنقل ----------
  var cur = null, trackX = 0, pageY = 0, moving = null;
  function focus(el) {
    if (!el) return;
    if (cur) cur.classList.remove("focus");
    cur = el; el.classList.add("focus");
    if (el.parentNode.id === "favs") {
      var band = el.parentNode.parentNode, W = band.clientWidth, pad = 110, left = el.offsetLeft + trackX;
      if (left < pad) trackX += pad - left;
      else if (left + el.offsetWidth > W - pad) trackX -= left + el.offsetWidth - (W - pad);
      el.parentNode.style.transform = "translateX(" + trackX + "px)";
    }
    var y = 0;
    if (el.parentNode.id === "all") { var top = el.offsetTop; y = Math.max(0, top - 330); }
    if (y !== pageY) { pageY = y; $("page").style.transform = "translateY(" + (-y) + "px)"; }
    if (!$("settings").hidden) return;
    showTitle(el);
  }
  function candidates() {
    return document.querySelectorAll($("settings").hidden ? "#page .focusable" : "#settings .focusable");
  }
  function move(dir) {
    if (!cur) { focus(candidates()[0]); return; }
    var r = cur.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var best = null, bestS = 1e9, all = candidates();
    for (var i = 0; i < all.length; i++) {
      var e = all[i]; if (e === cur) continue;
      var b = e.getBoundingClientRect(), dx = b.left + b.width / 2 - cx, dy = b.top + b.height / 2 - cy, main, cross;
      if (dir === "left") { if (dx > -10) continue; main = -dx; cross = Math.abs(dy); if (cross > r.height * 0.6) continue; }
      else if (dir === "right") { if (dx < 10) continue; main = dx; cross = Math.abs(dy); if (cross > r.height * 0.6) continue; }
      else if (dir === "up") { if (dy > -10) continue; main = -dy; cross = Math.abs(dx); }
      else { if (dy < 10) continue; main = dy; cross = Math.abs(dx); }
      var sc = main + cross * 3;
      if (sc < bestS) { bestS = sc; best = e; }
    }
    if (best) focus(best);
  }
  // ترتيب المفضلة
  function moveFav(dir) {
    var p = cur.parentNode, sib = dir === "right" ? cur.previousElementSibling : cur.nextElementSibling; // الاتجاه بالعربي
    if (!sib) return;
    if (dir === "right") p.insertBefore(cur, sib); else p.insertBefore(sib, cur);
    focus(cur);
  }
  function finishMove() {
    moving = null; cur.classList.remove("moving"); $("reorderPill").classList.remove("active");
    S.favs = [].map.call($("favs").children, function (e) { return e.getAttribute("data-id"); }); save();
    toast("انحفظ الترتيب"); showTitle(cur);
  }
  function toggleFav(el) {
    var id = el.getAttribute("data-id"), ids = favIds(), i = ids.indexOf(id);
    if (i === -1) { ids.push(id); toast("انضاف " + byId[id].name + " للمفضلة"); } else { ids.splice(i, 1); toast("انشال " + byId[id].name + " من المفضلة"); }
    S.favs = ids; save(); render({ id: id, inFav: false });
  }

  // ---------- الإعدادات ----------
  var OPTS = {
    digits: [["latn", "123"], ["arab", "١٢٣"]],
    bg: [["auto", "صور حسب الوقت"], ["scene", "صحراء الرياض"]],
    saverMin: [[5, "٥ دقايق"], [10, "١٠ دقايق"], [20, "٢٠ دقيقة"], [0, "أبداً"]]
  };
  function paintOpts() {
    [].forEach.call(document.querySelectorAll(".opt"), function (o) {
      var k = o.getAttribute("data-opt"); if (!OPTS[k]) return;
      var v = OPTS[k].filter(function (x) { return x[0] === S[k]; })[0] || OPTS[k][0];
      o.querySelector("b").textContent = v[1];
    });
  }
  function openSettings() { $("settings").hidden = false; paintOpts(); focus(document.querySelector(".opt")); }
  function closeSettings() { $("settings").hidden = true; focus(document.querySelector('.pill[data-act="settings"]')); }
  function changeOpt(o) {
    var k = o.getAttribute("data-opt");
    if (k === "close") { closeSettings(); return; }
    var list = OPTS[k], i = 0;
    for (var j = 0; j < list.length; j++) if (list[j][0] === S[k]) i = j;
    S[k] = list[(i + 1) % list.length][0]; save(); paintOpts();
    if (k === "digits") { today = null; tick(); render(); openSettings(); }
    if (k === "bg") { lastPhase = ""; tick(); }
  }

  // ---------- شاشة التوقف ----------
  var idle = 0;
  function showSaver() { $("saver").hidden = false; $("page").style.opacity = "0"; $("veil").style.opacity = ".4"; }
  function wake() {
    idle = 0;
    if (!$("saver").hidden) { $("saver").hidden = true; $("page").style.opacity = "1"; $("veil").style.opacity = "1"; return true; }
    return false;
  }
  setInterval(function () { idle++; if (S.saverMin && idle >= S.saverMin * 60 && $("saver").hidden) showSaver(); }, 1000);

  function activate(el) {
    var act = el.getAttribute("data-act"), id = el.getAttribute("data-id"), key = el.getAttribute("data-key");
    if (el.classList.contains("opt")) return changeOpt(el);
    if (act === "saver") return showSaver();
    if (act === "settings") return openSettings();
    if (act === "reorder") {
      var first = document.querySelector("#favs .app"); if (!first) return;
      focus(first); moving = first; first.classList.add("moving"); $("reorderPill").classList.add("active"); showTitle(first); return;
    }
    if (key) return sendKey(key, el.textContent);
    if (id) launch(id);
  }

  document.addEventListener("keydown", function (e) {
    if (wake()) { e.preventDefault(); return; }
    var k = e.keyCode;
    if (moving) {
      if (k === 37 || k === 39) moveFav(k === 39 ? "right" : "left");
      else if (k === 13 || k === 10009) finishMove();
      e.preventDefault(); return;
    }
    switch (k) {
      case 37: move("left"); break;
      case 39: move("right"); break;
      case 38: move("up"); break;
      case 40: move("down"); break;
      case 13: if (cur) activate(cur); break;
      case 403: showSaver(); break;                                         // أحمر
      case 404: if (cur && cur.getAttribute("data-id")) toggleFav(cur); break; // أخضر
      case 10009: if (!$("settings").hidden) closeSettings(); break;          // رجوع
      default: return;
    }
    e.preventDefault();
  });
  document.addEventListener("visibilitychange", function () { if (!document.hidden) { wake(); weather(); } });

  if (window.tizen && tizen.tvinputdevice) {
    ["ColorF0Red", "ColorF1Green", "ColorF2Yellow", "ColorF3Blue"].forEach(function (n) { try { tizen.tvinputdevice.registerKey(n); } catch (e) {} });
  }
  tick(); setInterval(tick, 15000);
  weather(); setInterval(weather, 30 * 60000);
  ping(function (ok) { svcOk = ok; loadApps(); });
})();
