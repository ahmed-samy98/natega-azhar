// api/get-result.js (المحلل الجراحي الدقيق لكود الجافاسكريبت خلف كواليس الأزهر)

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

    // البحث الجراحي عن أي سكريبت يحتوي على الكلمة txtNationalId
    const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    const foundScripts = [];

    while ((match = scriptRegex.exec(html)) !== null) {
      const scriptContent = match[1];
      if (scriptContent.includes('txtNationalId')) {
        foundScripts.push(scriptContent.trim());
      }
    }

    // البحث عن أي طلبات AJAX أخرى في الأكواد المضمنة لزيادة الدقة
    const ajaxScripts = [];
    scriptRegex.lastIndex = 0; // إعادة تصفير مؤشر البحث
    while ((match = scriptRegex.exec(html)) !== null) {
      const scriptContent = match[1];
      if (scriptContent.includes('$.ajax') || scriptContent.includes('$.post') || scriptContent.includes('fetch(') || scriptContent.includes('url:')) {
        ajaxScripts.push(scriptContent.trim().substring(0, 1000));
      }
    }

    return res.status(200).json({
      success: true,
      auditedScripts: true,
      foundScripts: foundScripts,
      ajaxScripts: ajaxScripts
    });

  } catch (error) {
    return res.status(500).json({
      error: 'فشل فحص الجافاسكريبت للأزهر',
      details: error.message
    });
  }
};
