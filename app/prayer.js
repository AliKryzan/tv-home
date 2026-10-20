// حساب مواقيت الصلاة محلياً بطريقة أم القرى (بدون إنترنت)
(function () {
  var R = Math.PI / 180;
  function sin(d) { return Math.sin(d * R); } function cos(d) { return Math.cos(d * R); }
  function tan(d) { return Math.tan(d * R); }
  function asin(x) { return Math.asin(x) / R; } function acos(x) { return Math.acos(x) / R; }
  function atan2(y, x) { return Math.atan2(y, x) / R; } function acot(x) { return Math.atan(1 / x) / R; }
  function fix(a, b) { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; }

  function julian(y, m, d) {
    if (m <= 2) { y -= 1; m += 12; }
    var A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  }
  function sunPos(jd) {
    var D = jd - 2451545.0, g = fix(357.529 + 0.98560028 * D, 360), q = fix(280.459 + 0.98564736 * D, 360);
    var L = fix(q + 1.915 * sin(g) + 0.020 * sin(2 * g), 360), e = 23.439 - 0.00000036 * D;
    var RA = fix(atan2(cos(e) * sin(L), cos(L)) / 15, 24);
    return { decl: asin(sin(e) * sin(L)), eqt: q / 15 - RA };
  }

  window.prayerTimes = function (date, lat, lng, tz, isRamadan) {
    var jd = julian(date.getFullYear(), date.getMonth() + 1, date.getDate()) - lng / (15 * 24);
    function midDay(t) { return fix(12 - sunPos(jd + t).eqt, 24); }
    function angleTime(angle, t, ccw) {
      var dec = sunPos(jd + t).decl, noon = midDay(t);
      var T = acos((-sin(angle) - sin(dec) * sin(lat)) / (cos(dec) * cos(lat))) / 15;
      return noon + (ccw ? -T : T);
    }
    function asrTime(f, t) { var dec = sunPos(jd + t).decl; return angleTime(-acot(f + tan(Math.abs(lat - dec))), t); }
    var t = { fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, maghrib: 18 };
    for (var i = 0; i < 2; i++) {
      t = {
        fajr: angleTime(18.5, t.fajr / 24, true),
        sunrise: angleTime(0.833, t.sunrise / 24, true),
        dhuhr: midDay(t.dhuhr / 24),
        asr: asrTime(1, t.asr / 24),
        maghrib: angleTime(0.833, t.maghrib / 24)
      };
    }
    var adj = tz - lng / 15, out = {};
    for (var k in t) out[k] = t[k] + adj;
    out.isha = out.maghrib + (isRamadan ? 120 : 90) / 60;
    // تحويل الساعات لكائنات Date مقربة للدقيقة
    var res = {};
    for (var k2 in out) {
      var mins = Math.round(out[k2] * 60);
      var d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
      d.setMinutes(mins);
      res[k2] = d;
    }
    return res;
  };
})();
