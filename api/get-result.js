// api/get-result.js (المحلل البرمجي الذكي لكود صفحة الأزهر)

const axios = require('axios');
const https = require('https');
const cheerio = require('cheerio'); // سنستخدم المكتبة التي أضفتها أنت بالفولدر

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
    const targetUrl = `https://natiga.azhar.eg/`; 

    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://natiga.azhar.eg/'
      },
      httpsAgent: agent,
      timeout: 10000
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // 1. استخراج جميع النماذج (Forms)
    const forms = [];
    $('form').each((i, el) => {
      forms.push({
        action: $(el).attr('action') || 'لا يوجد',
        method: $(el).attr('method') || 'GET',
        id: $(el).attr('id') || 'لا يوجد'
      });
    });

    // 2. استخراج جميع حقول الإدخال (Inputs)
    const inputs = [];
    $('input').each((i, el) => {
      inputs.push({
        name: $(el).attr('name') || 'لا يوجد',
        id: $(el).attr('id') || 'لا يوجد',
        type: $(el).attr('type') || 'text'
      });
    });

    // 3. استخراج روابط ملفات السكريبت (Scripts)
    const scripts = [];
    $('script').each((i, el) => {
      const src = $(el).attr('src');
      if (src) scripts.push(src);
    });

    // إرسال التقرير النهائي المنظم
    return res.status(200).json({
      success: true,
      audited: true,
      forms: forms,
      inputs: inputs,
      scripts: scripts
    });

  } catch (error) {
    return res.status(500).json({
      error: 'فشل تحليل صفحة الأزهر',
      details: error.message
    });
  }
}; 
