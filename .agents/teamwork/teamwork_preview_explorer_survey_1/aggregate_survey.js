const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const surveyPath = path.join(__dirname, 'survey_results.json');
const rootDir = path.resolve(__dirname, '../../..');

const rawData = JSON.parse(fs.readFileSync(surveyPath, 'utf8'));

// Calculate SHA256 for all files
const enriched = rawData.map(item => {
  const fullPath = path.join(rootDir, item.file);
  let sha256 = '';
  if (fs.existsSync(fullPath)) {
    const buf = fs.readFileSync(fullPath);
    sha256 = crypto.createHash('sha256').update(buf).digest('hex');
  }
  return {
    ...item,
    sha256
  };
});

// Calculate global unique stylesheets and scripts
const stylesheetCounts = {};
const scriptCounts = {};

enriched.forEach(p => {
  p.stylesheets.forEach(s => {
    stylesheetCounts[s] = (stylesheetCounts[s] || 0) + 1;
  });
  p.scripts.forEach(s => {
    scriptCounts[s] = (scriptCounts[s] || 0) + 1;
  });
});

// Compare index.html and trangchudong.html
const indexItem = enriched.find(p => p.file === 'index.html');
const trangChuItem = enriched.find(p => p.file === 'trangchudong.html');

const comparison = {
  indexSha256: indexItem ? indexItem.sha256 : null,
  trangChuSha256: trangChuItem ? trangChuItem.sha256 : null,
  isIdentical: indexItem && trangChuItem ? indexItem.sha256 === trangChuItem.sha256 : false,
  indexSize: indexItem ? indexItem.size : null,
  trangChuSize: trangChuItem ? trangChuItem.size : null
};

const finalData = {
  comparison,
  stylesheetCounts,
  scriptCounts,
  pages: enriched
};

fs.writeFileSync(path.join(__dirname, 'final_survey.json'), JSON.stringify(finalData, null, 2), 'utf8');
console.log('Final survey generated successfully!');
console.log('Comparison:', comparison);
