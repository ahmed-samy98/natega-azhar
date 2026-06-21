// api/get-result.js (نسخة جلب النتيجة مع الحفاظ على الكوكيز والـ Session)

const axios = require('axios');
const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { seat_no } = req.query; // يمثل الرقم القومي
  if (!seat_no) {
    return res.status(400).json({ error: 'يرجى إرسال الرقم المطلوب' });
  }

  const agent = new https.Agent({  
    rejectUnauthorized: false
  });

  try {
    const mainUrl = `https://natiga.azhar.eg/`;

    // 1. جلب الصفحة الرئيسية لقراءة الـ data-page والـ Cookies الخاصة بالجلسة
    const mainResponse = await axios.get(mainUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://natiga.azhar.eg/'
      },
      httpsAgent: agent,
      timeout: 10000
    });

    const html = mainResponse.data;
    
    // استخراج الكوكيز المستلمة من السيرفر (مثل ASP.NET_SessionId) للحفاظ على الجلسة
    const rawCookies = mainResponse.headers['set-cookie'];
    const cookieHeader = rawCookies ? rawCookies.map(c => c.split(';')[0]).join('; ') : '';
    
    console.log(`تم التقاط الكوكيز بنجاح: ${cookieHeader}`);

    // استخراج الـ data-page من وسم الـ <body>
    const bodyMatch = /<body[^>]*data-page=["']([^"']*)["']/i.exec(html);
    const pageKey = bodyMatch ? bodyMatch[1] : '';

    if (!pageKey) {
      return res.status(500).json({ 
        error: 'لم نتمكن من استخراج مفتاح الصفحة (pageKey).' 
      });
    }

    // 2. طلب الحصول على التذكرة (InitRequest) مع تمرير الكوكيز وهيدر الـ XML
    const initUrl = `https://natiga.azhar.eg/result.asmx/InitRequest`;
    const initResponse = await axios.post(
      initUrl,
      { pageKey: pageKey },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Referer': 'https://natiga.azhar.eg/',
          'Cookie': cookieHeader // الحفاظ على الجلسة
        },
        httpsAgent: agent,
        timeout: 10000
      }
    );

    const ticketData = initResponse.data;
    const ticket = ticketData && ticketData.d && ticketData.d.Ticket ? ticketData.d.Ticket : null;

    if (!ticket) {
      return res.status(500).json({
        error: 'فشل الحصول على تذكرة الاستعلام من خادم الأزهر.',
        details: JSON.stringify(ticketData)
      });
    }

    console.log(`تم استلام تذكرة الأمان: ${ticket}`);

    // 3. طلب النتيجة الفعلي (GetResultByNationalId) مع الكوكيز والتذكرة وهيدر الـ XML
    const resultUrl = `https://natiga.azhar.eg/result.asmx/GetResultByNationalId`;
    const resultResponse = await axios.post(
      resultUrl,
      {
        nationalID: seat_no,
        pageKey: pageKey,
        requestTicket: ticket
      },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Referer': 'https://natiga.azhar.eg/',
          'Cookie': cookieHeader // الحفاظ على الجلسة الموثقة
        },
        httpsAgent: agent,
        timeout: 15000
      }
    );

    const resultData = resultResponse.data;

    // إرجاع النتيجة للفرونت إند بنجاح!
    return res.status(200).json({
      success: true,
      originalResult: resultData
    });

  } catch (error) {
    console.error("خطأ الاتصال بالأزهر:", error.message);
    
    // جلب رد السيرفر الفعلي إن وجد لزيادة التفاصيل والدقة
    let serverResponse = error.message;
    if (error.response && error.response.data) {
      serverResponse += " - رد السيرفر: " + JSON.stringify(error.response.data);
    }

    return res.status(500).json({
      error: 'فشل استرجاع النتيجة من خوادم الأزهر',
      details: serverResponse
    });
  }
};
