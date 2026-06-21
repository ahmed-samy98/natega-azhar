// api/get-result.js (Vercel Serverless Function)

export default async function handler(req, res) {
  // 1. السماح لأي دومين (مثل Localhost أو Netlify) بالوصول لبيانات هذا الـ API
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // يمكنك استبدال النجمة برابط نيتليفي لاحقاً لزيادة الأمان
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { seat_no } = req.query;

  if (!seat_no) {
    return res.status(400).json({ error: "الرجاء إدخال رقم الجلوس" });
  }

  // رابط بوابة الأزهر الإلكترونية
  const AZHAR_TARGET_URL = `https://natiga.azhar.eg/`; // يتم تعديل الرابط الدقيق للنتيجة وقت صدورها

  try {
    const response = await fetch(AZHAR_TARGET_URL, {
      method: 'POST', // أو GET حسب بنية موقع الأزهر السنوية
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://natiga.azhar.eg/',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `seat_no=${seat_no}`,
      signal: AbortSignal.timeout(8000) // مهلة 8 ثوانٍ كحد أقصى للاتصال بموقع الأزهر
    });

    if (!response.ok) {
      throw new Error(`فشل الاتصال بخادم الأزهر: ${response.status}`);
    }

    // هنا يتم معالجة النتيجة المستلمة (JSON أو HTML Parse) طبقاً لبنية الموقع وقتها.
    // سنفترض هنا استلام كائن JSON افتراضي لمعاهد الأزهر:
    const rawData = await response.json(); 

    // تنظيم البيانات لترسل بشكل منسق لصفحتك على Netlify/Localhost
    const formattedData = {
      success: true,
      data: {
        student_name: rawData.name || "طالب أزهري",
        seat_no: seat_no,
        school_name: rawData.institute || "معهد أزهري",
        admin_name: rawData.region || "المنطقة الأزهرية",
        branch: rawData.branch || "القسم العلمي", // أو "القسم الأدبي"
        total: Number(rawData.total || 0),
        status: rawData.status || "ناجح",
        subjects: {
          // درجات المواد الأزهرية النموذجية
          "القرآن الكريم": { score: rawData.quran, max: 50 },
          "الفقه": { score: rawData.feqh, max: 40 },
          "التفسير": { score: rawData.tafseer, max: 40 },
          "التوحيد": { score: rawData.tawheed, max: 40 },
          "الحديث": { score: rawData.hadith, max: 50 },
          "النحو": { score: rawData.nahw, max: 40 },
          "الصرف": { score: rawData.sarf, max: 40 },
          "البلاغة": { score: rawData.balagha, max: 40 },
          "الأدب والنصوص": { score: rawData.adab, max: 20 },
          "اللغة الأجنبية": { score: rawData.english, max: 40 },
          "الفيزياء": { score: rawData.physics, max: 60 },
          "الكيمياء": { score: rawData.chemistry, max: 60 },
          "الأحياء": { score: rawData.biology, max: 60 }
        }
      }
    };

    return res.status(200).json(formattedData);

  } catch (error) {
    console.error("Fetch Error:", error);
    return res.status(500).json({ 
      error: "تعذر الاتصال بخوادم بوابة الأزهر الرسمية حالياً، يرجى المحاولة مرة أخرى." 
    });
  }
}
