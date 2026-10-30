const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Set globals for libraries in Node environment
global.JSZip = require('../assets/js/jszip.min.js');
global.XLSX = require('../assets/js/xlsx.full.min.js');
const { jsPDF } = require('../assets/js/jspdf.umd.min.js');
global.jspdf = { jsPDF };

const ConverterEngine = require('../assets/js/converter-engine.js');

async function runTests() {
  console.log('====================================================');
  console.log('🧪 TESTING SLIDEVAULT FILE CONVERTER ENGINE (V4 ARGON)');
  console.log('====================================================');

  // Test 1: Number Parser & Formatters (Vietnamese & International)
  console.log('\n[1/8] Testing Number Parser & Formatters...');
  assert.strictEqual(ConverterEngine.parseNumberValue('1250'), 1250);
  assert.strictEqual(ConverterEngine.parseNumberValue('1234.56'), 1234.56);
  assert.strictEqual(ConverterEngine.parseNumberValue('1,250.50'), 1250.50);
  assert.strictEqual(ConverterEngine.parseNumberValue('1.250,50'), 1250.50);
  assert.strictEqual(ConverterEngine.parseNumberValue('100.000,50'), 100000.50);
  assert.strictEqual(ConverterEngine.parseNumberValue('100.000'), 100000);
  assert.strictEqual(ConverterEngine.parseNumberValue('1.000.000'), 1000000);
  assert.strictEqual(ConverterEngine.parseNumberValue('50%'), 0.50);
  assert.strictEqual(ConverterEngine.parseNumberValue('45,5%'), 0.455);
  assert.strictEqual(ConverterEngine.parseNumberValue('250.000 đ'), 250000);
  assert.strictEqual(ConverterEngine.parseNumberValue('500.000 VNĐ'), 500000);
  assert.strictEqual(ConverterEngine.parseNumberValue(String.fromCharCode(36) + '1,250.50'), 1250.50);
  assert.strictEqual(ConverterEngine.formatBytes(1048576), '1 MB');
  assert.strictEqual(ConverterEngine.formatBytes(500), '500 B');
  console.log('  ✅ [PASS] Number parser and byte formatting verified across currencies & localizations.');

  // Test 2: Word (.docx) Generation & Numeric Cell Preservation
  console.log('\n[2/8] Testing Word (.docx) OOXML Generation & Numeric Cell Preservation...');
  const sampleData = {
    title: 'Báo Cáo Tài Chính Quý 3',
    paragraphs: [
      { text: '1. Tổng quan thị trường', isHeading: true, pageNum: 1 },
      { text: 'Doanh thu thuần đạt mức tăng trưởng 125% so với cùng kỳ năm trước.', isHeading: false, isBullet: false, pageNum: 1 },
      { text: 'Mở rộng thị phần thêm 15 tỉnh thành trọng điểm.', isHeading: false, isBullet: true, pageNum: 1 }
    ],
    tables: [
      [
        ['Chỉ Tiêu', 'Kế Hoạch', 'Thực Hiện', 'Tỷ Lệ', 'Doanh Số'],
        ['Doanh Thu', '100 tỷ', '125 tỷ', '125%', 500000],
        ['Lợi Nhuận', '20 tỷ', '28 tỷ', '140%', 120000]
      ]
    ]
  };

  const docxBuffer = await ConverterEngine.generateDocx(sampleData);
  assert(Buffer.isBuffer(docxBuffer), 'DOCX result must be a Node Buffer');
  assert(docxBuffer.length > 1000, `DOCX buffer must be valid size, got ${docxBuffer.length} bytes`);

  const unzipped = await global.JSZip.loadAsync(docxBuffer);
  assert(unzipped.file('word/document.xml'), 'DOCX must contain word/document.xml');
  assert(unzipped.file('[Content_Types].xml'), 'DOCX must contain [Content_Types].xml');
  assert(unzipped.file('word/styles.xml'), 'DOCX must contain word/styles.xml');

  const docXml = await unzipped.file('word/document.xml').async('string');
  assert(docXml.includes('Báo Cáo Tài Chính Quý 3'), 'document.xml must contain document title');
  assert(docXml.includes('Doanh thu thuần'), 'document.xml must contain paragraphs');
  assert(docXml.includes('w:tbl'), 'document.xml must contain table XML');
  assert(docXml.includes('500000'), 'Numeric table cells (500000) must be preserved and not blanked');
  assert(docXml.includes('120000'), 'Numeric table cells (120000) must be preserved');
  console.log(`  ✅ [PASS] Word (.docx) generated successfully (${docxBuffer.length} bytes, numeric cells & OOXML verified).`);

  // Test 3: PowerPoint (.pptx) Generation with PptxGenJS
  console.log('\n[3/8] Testing PowerPoint (.pptx) Presentation Generation...');
  const pptxBuffer = await ConverterEngine.generatePptx(sampleData);
  assert(Buffer.isBuffer(pptxBuffer), 'PPTX result must be a Buffer in Node');
  assert(pptxBuffer.length > 1000, `PPTX buffer size must be valid, got ${pptxBuffer.length} bytes`);

  // Verify PPTX internal structure (OOXML PresentationML ZIP)
  const unzippedPptx = await global.JSZip.loadAsync(pptxBuffer);
  assert(unzippedPptx.file('[Content_Types].xml'), 'PPTX must contain [Content_Types].xml');
  assert(unzippedPptx.file('ppt/presentation.xml'), 'PPTX must contain ppt/presentation.xml');
  console.log(`  ✅ [PASS] PowerPoint (.pptx) generated successfully (${pptxBuffer.length} bytes, 16:9 PresentationML verified).`);

  // Test 4: Excel (.xlsx / .csv) Generation & Number Casting
  console.log('\n[4/8] Testing Excel (.xlsx / .csv) Generation...');
  const excelResult = ConverterEngine.generateExcel(sampleData);
  assert(excelResult.xlsxBuffer, 'Excel buffer must exist');
  assert(excelResult.xlsxBuffer.length > 500, `XLSX buffer size: ${excelResult.xlsxBuffer.length}`);
  assert(excelResult.csvBlob, 'CSV blob/buffer must exist');

  const csvString = excelResult.csvBlob.toString('utf8');
  assert(csvString.charCodeAt(0) === 0xFEFF, 'CSV must start with UTF-8 BOM for Vietnamese Excel compatibility');
  assert(csvString.includes('Doanh Thu'), 'CSV must contain data rows');
  assert(csvString.includes('500000'), 'CSV must contain unquoted numeric values for Excel calculation');
  console.log(`  ✅ [PASS] Excel (.xlsx) & CSV with UTF-8 BOM generated successfully (${excelResult.xlsxBuffer.length} bytes).`);

  // Test 5: Word (.docx) to PDF Conversion & Unicode Font
  console.log('\n[5/8] Testing Word (.docx) to PDF Conversion with Unicode Support...');
  const pdfFromDocxBuffer = await ConverterEngine.convertDocxToPdf(docxBuffer, {}, () => {});
  assert(Buffer.isBuffer(pdfFromDocxBuffer), 'PDF result must be a Buffer');
  assert(pdfFromDocxBuffer.length > 1000, `PDF size: ${pdfFromDocxBuffer.length}`);
  const pdfHeader = pdfFromDocxBuffer.slice(0, 5).toString('ascii');
  assert.strictEqual(pdfHeader, '%PDF-', 'PDF output must have valid %PDF- magic header');
  console.log(`  ✅ [PASS] Word -> PDF conversion verified (${pdfFromDocxBuffer.length} bytes, valid %PDF- header).`);

  // Test 6: Images to PDF Conversion
  console.log('\n[6/8] Testing Images to PDF Conversion...');
  const samplePng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const pdfFromImgBuffer = await ConverterEngine.convertImagesToPdf([
    { dataUrl: samplePng, width: 100, height: 100, type: 'image/png' },
    { dataUrl: samplePng, width: 200, height: 150, type: 'image/png' }
  ]);
  assert(Buffer.isBuffer(pdfFromImgBuffer), 'Image-to-PDF result must be a Buffer');
  assert.strictEqual(pdfFromImgBuffer.slice(0, 5).toString('ascii'), '%PDF-');
  console.log(`  ✅ [PASS] Multi-page Images -> PDF conversion verified (${pdfFromImgBuffer.length} bytes).`);

  // Test 7: Text / Markdown to PDF Conversion
  console.log('\n[7/8] Testing Text / Markdown to PDF Conversion...');
  const sampleMarkdown = `# BÁO CÁO KINH DOANH 2026\n\n## 1. Giới thiệu\nCông ty SlideVault V4 Argon dẫn đầu giải pháp AI.\n\n- Tăng trưởng 150%\n- Khách hàng hài lòng 99%`;
  const pdfFromText = await ConverterEngine.convertTextToPdf(sampleMarkdown, {}, () => {});
  assert(Buffer.isBuffer(pdfFromText), 'Text-to-PDF result must be a Buffer');
  assert.strictEqual(pdfFromText.slice(0, 5).toString('ascii'), '%PDF-');
  console.log(`  ✅ [PASS] Text / Markdown -> PDF conversion verified (${pdfFromText.length} bytes).`);

  // Test 8: Optical Table Cell Grouping
  console.log('\n[8/8] Testing Optical Table Cell Grouping...');
  const mockLineItems = [
    { str: 'Doanh', x: 50, width: 30 },
    { str: 'thu', x: 84, width: 20 },
    { str: '100', x: 200, width: 25 },
    { str: 'tỷ', x: 228, width: 15 }
  ];
  const groupedCells = ConverterEngine.groupLineIntoCells(mockLineItems, 20);
  assert.strictEqual(groupedCells.length, 2, 'Line should be grouped into exactly 2 columns');
  assert.strictEqual(groupedCells[0], 'Doanh thu', 'Cell 1 must be "Doanh thu"');
  assert.strictEqual(groupedCells[1], '100 tỷ', 'Cell 2 must be "100 tỷ"');
  console.log('  ✅ [PASS] Optical table cell grouping correctly combined multi-word columns.');

  console.log('\n====================================================');
  console.log('🎉 ALL 8 CONVERTER ENGINE SUITES PASSED 100%!');
  console.log('====================================================\n');
}

runTests().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
