const fs = require('fs');
const path = require('path');

const pages = [
  'index.html',
  'trangchudong.html',
  'vault.html',
  'thuvienmau.html',
  'AI.html',
  'setting.html',
  'security.html',
  'phoimau.html',
  'vebieudonhanh.html',
  'trinhchieuchiase.html',
  'vanban.html',
  'chuyendoi.html'
];

pages.forEach(page => {
  const filePath = path.resolve(__dirname, '..', page);
  if (!fs.existsSync(filePath)) return;
  const html = fs.readFileSync(filePath, 'utf8');

  console.log(`\n=================== AUDITING: ${page} ===================`);
  
  // 1. Audit Buttons
  const btnRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  let m;
  let btnTotal = 0, btnUnlabeled = 0;
  while ((m = btnRegex.exec(html)) !== null) {
    btnTotal++;
    const attrs = m[1];
    const innerText = m[2].replace(/<[^>]+>/g, '').trim();
    const hasAria = /aria-label\s*=/i.test(attrs) || /aria-labelledby\s*=/i.test(attrs);
    if (!innerText && !hasAria) {
      btnUnlabeled++;
      const idMatch = attrs.match(/id\s*=\s*['"]([^'"]+)['"]/i);
      console.log(`  [BUTTON LACKS LABEL] id=${idMatch ? idMatch[1] : 'none'}: ${m[0].slice(0, 100).replace(/\n/g, ' ')}`);
    }
  }
  console.log(`  Buttons: ${btnTotal} total, ${btnUnlabeled} unlabeled`);

  // 2. Audit Inputs
  const inputRegex = /<input\b([^>]*)>/gi;
  let inputTotal = 0, inputUnlabeled = 0;
  while ((m = inputRegex.exec(html)) !== null) {
    inputTotal++;
    const attrs = m[1];
    if (/type\s*=\s*['"]hidden['"]/i.test(attrs)) continue;
    const hasAria = /aria-label\s*=/i.test(attrs) || /aria-labelledby\s*=/i.test(attrs);
    const idMatch = attrs.match(/id\s*=\s*['"]([^'"]+)['"]/i);
    let hasLabelFor = false;
    if (idMatch) {
      const lblRegex = new RegExp('<label[^>]*for=[\'"]' + idMatch[1] + '[\'"]', 'i');
      hasLabelFor = lblRegex.test(html);
    }
    if (!hasAria && !hasLabelFor) {
      inputUnlabeled++;
      console.log(`  [INPUT LACKS LABEL] id=${idMatch ? idMatch[1] : 'none'}: ${m[0].slice(0, 100).replace(/\n/g, ' ')}`);
    }
  }
  console.log(`  Inputs: ${inputTotal} total, ${inputUnlabeled} unlabeled`);

  // 3. Audit Images
  const imgRegex = /<img\b([^>]*)>/gi;
  let imgTotal = 0, imgNoAlt = 0;
  while ((m = imgRegex.exec(html)) !== null) {
    imgTotal++;
    const attrs = m[1];
    if (!/\balt\s*=/i.test(attrs)) {
      imgNoAlt++;
      console.log(`  [IMG LACKS ALT]: ${m[0].slice(0, 100).replace(/\n/g, ' ')}`);
    }
  }
  console.log(`  Images: ${imgTotal} total, ${imgNoAlt} without alt`);
});
