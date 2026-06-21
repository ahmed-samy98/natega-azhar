// api/get-result.js (باستخدام نفس أسلوبك الناجح بـ Axios)

const axios = require('axios');
const https = require('https');

module.exports = async (req, res) => {
  // تفعيل الـ Headers الخاصة بـ CORS لتجنب أي مشاكل اتصال
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { seat_no } = req.query; // يمثل رقم الجلوس أو الرقم القومي المدخل
  if (!seat_no) {
    return res.status(400).json({ error: 'يرجى إرسال رقم الجلوس أو الرقم القومي' });
  }

  // إعداد وكيل الاتصال (Agent) لتجاهل أخطاء شهادات الأمان الحكومية غير الموثقة
  const agent = new https.Agent({  
    rejectUnauthorized: false
  });

  try {
    const targetUrl = `https://natiga.azhar.eg/`; 

    // محاكاة الطلب بنفس طريقتك الناجحة مع إرسال البيانات كـ POST 
    // وإضافة الـ headers المطبقة بمشروعك وموقع الأزهر
    const response = await axios.post(targetUrl, 
      `seat_no=${encodeURIComponent(seat_no)}&national_id=${encodeURIComponent(seat_no)}`, 
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://natiga.azhar.eg/',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        httpsAgent: agent, // تطبيق تجاوز فحص الـ SSL
        timeout: 12000     // مهلة 12 ثانية للرد بسبب الضغط المتوقع
      }
    );

    // طباعة الاستجابة في الـ Console لمعاينتها في Logs بـ Vercel
    console.log("تم الاتصال بنجاح بموقع الأزهر!");
    const responseData = response.data;

    // بما أن موقع الأزهر يعيد صفحة ويب (HTML) وليس JSON كالدقهلية،
    // سنقوم بإرجاع الـ HTML مؤقتاً لنرى هل تم العبور بنجاح أم لا
    return res.status(200).json({
      success: true,
      isHtml: true,
      html_preview: typeof responseData === 'string' ? responseData.substring(0, 800) : "استجابة غير نصية"
    });

  } catch (error) {
    console.error("تفاصيل الخطأ في Vercel:", error.message);
    return res.status(500).json({
      error: 'حدث خطأ أثناء الاتصال بسيرفر الأزهر الشريف مباشر',
      details: error.message
    });
  }
};
