// api/get-result.js (تحديث لتخطي فحص SSL وطباعة تفاصيل الخطأ)

// إيقاف رفض الاتصال بسبب شهادات الأمان غير الموثقة حكومياً
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { seat_no } = req.query;

  if (!seat_no) {
    return res.status(400).json({ error: "الرجاء إدخال الرقم المطلوب" });
  }

  const AZHAR_TARGET_URL = `https://natiga.azhar.eg/`; 

  try {
    console.log(`محاولة الاتصال لتخطي SSL للرقم: ${seat_no}`);

    const response = await fetch(AZHAR_TARGET_URL, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://natiga.azhar.eg/',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `seat_no=${seat_no}&national_id=${seat_no}`,
      signal: AbortSignal.timeout(9000) 
    });

    const responseText = await response.text();
    console.log("استجابة ناجحة وتخطي الـ SSL!");

    return res.status(200).json({
      success: true,
      message: "تم الاتصال بنجاح وتخطي الـ SSL",
      data: responseText.substring(0, 500)
    });

  } catch (error) {
    // طباعة تفاصيل الخطأ الدقيق (السبب) لمعرفة هل تم الرفض من جدار الحماية أم لا
    console.error("الخطأ بالتفصيل:");
    console.error(error.message);
    if (error.cause) {
      console.error("السبب الجذري للخطأ (Cause):", error.cause);
    }
    
    return res.status(500).json({ 
      error: `تعذر الاتصال بالبوابة الرسمية للأزهر. السبب: ${error.message}` 
    });
  }
}
