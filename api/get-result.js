// api/get-result.js (نسخة جلب وتحليل كود الصفحة عبر GET)

const axios = require('axios');
const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const agent = new https.Agent({  
    rejectUnauthorized: false
  });

  try {
    console.log("محاولة جلب الصفحة الرئيسية للأزهر عبر GET...");
    
    const targetUrl = `https://natiga.azhar.eg/`; 

    // جلب الصفحة عبر طلب GET عادي وليس POST لتفادي خطأ 405
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://natiga.azhar.eg/'
      },
      httpsAgent: agent,
      timeout: 10000
    });

    console.log("تم جلب الصفحة بنجاح!");
    const htmlData = response.data;

    // سنعيد كود الـ HTML بالكامل إلى متصفحك لنقرأه ونحلله
    return res.status(200).json({
      success: true,
      message: "تم جلب الصفحة بنجاح وتخطي عقبة 405!",
      html: htmlData // كود الـ HTML الكامل لصفحة الأزهر
    });

  } catch (error) {
    console.error("خطأ أثناء جلب الصفحة:", error.message);
    return res.status(500).json({
      error: 'فشل جلب صفحة الأزهر الرسمية',
      details: error.message
    });
  }
}; 
