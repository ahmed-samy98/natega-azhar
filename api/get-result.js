// api/get-result.js (نسخة جلب وتحليل صفحة الأزهر باستخدام التعبيرات النمطية Regex بدون مكتبات خارجية)

const axios = require('axios');
const https = require('https');

module.exports = async (req, res) => {
  // تفعيل هيدرز CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { seat_no } = req.query;

  const agent = new https.Agent({  
    rejectUnauthorized: false
  });

  try {
    console.log("محاولة جلب وتحليل كود صفحة الأزهر...");
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

    // 1. استخراج الـ Forms باستخدام Regex
    const forms = [];
    const formRegex = /<form[^>]*([\s\S]*?)<\/form>/gi;
    const actionRegex = /action=["']([^"']*)["']/i;
    const methodRegex = /method=["']([^"']*)["']/i;
    const idRegex = /id=["']([^"']*)["']/i;

    let match;
    while ((match = formRegex.exec(html)) !== null) {
      const formTag = match[0];
      const actionMatch = actionRegex.exec(formTag);
      const methodMatch = methodRegex.exec(formTag);
      const idMatch = idRegex.exec(formTag);

      forms.push({
        action: actionMatch ? actionMatch[1] : 'لا يوجد',
        method: methodMatch ? methodMatch[1] : 'GET',
        id: idMatch ? idMatch[1] : 'لا يوجد'
      });
    }

    // 2. استخراج الـ Inputs باستخدام Regex
    const inputs = [];
    const inputRegex = /<input[^>]*>/gi;
    const nameRegex = /name=["']([^"']*)["']/i;
    const inputIdRegex = /id=["']([^"']*)["']/i;
    const typeRegex = /type=["']([^"']*)["']/i;

    let inputMatch;
    while ((inputMatch = inputRegex.exec(html)) !== null) {
      const inputTag = inputMatch[0];
      const nameMatch = nameRegex.exec(inputTag);
      const idMatch = inputIdRegex.exec(inputTag);
      const typeMatch = typeRegex.exec(inputTag);

      inputs.push({
        name: nameMatch ? nameMatch[1] : 'لا يوجد',
        id: idMatch ? idMatch[1] : 'لا يوجد',
        type: typeMatch ? typeMatch[1] : 'text'
      });
    }

    // 3. استخراج روابط الـ Scripts باستخدام Regex
    const scripts = [];
    const scriptRegex = /<script[^>]*src=["']([^"']*)["']/gi;
    let scriptMatch;
    while ((scriptMatch = scriptRegex.exec(html)) !== null) {
      scripts.push(scriptMatch[1]);
    }

    // إرسال التقرير النهائي للفرونت إند
    return res.status(200).json({
      success: true,
      audited: true,
      forms: forms,
      inputs: inputs,
      scripts: scripts
    });

  } catch (error) {
    console.error("خطأ الاتصال:", error.message);
    return res.status(500).json({
      error: 'فشل جلب صفحة الأزهر الرسمية',
      details: error.message
    });
  }
}; 
