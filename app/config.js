// الإعدادات الأساسية (أغلبها تقدر تغيّره من «إعدادات الشاشة» في الواجهة نفسها)
window.TV_CONFIG = {
  city: "الرياض",
  lat: 24.7136, lng: 46.6753, tz: 3,
  digits: "latn",              // "latn" = 123   ،  "arab" = ١٢٣
  screensaverMinutes: 10,
  // المفضلة الافتراضية بالترتيب (يكفي جزء من الاسم)
  favorites: ["YouTube", "Netflix", "Bob", "بوب", "Pop", "Disney", "Shahid", "Prime"],
  // صور الخلفية حسب وقت اليوم (ملفات داخل app/bg). لو فاضية تطلع صحراء الرياض المرسومة
  photos: { fajr: [], day: [], sunset: [], night: [] }
};
