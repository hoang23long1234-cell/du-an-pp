/**
 * SlideVault File Converter Engine (V4 Argon)
 * Client-Side & Node.js Universal Conversion Suite
 * Capabilities:
 *  - PDF -> Word (.docx)
 *  - PDF -> PowerPoint (.pptx)
 *  - PDF -> Excel (.xlsx / .csv)
 *  - Word (.docx) -> PDF
 *  - Images (PNG/JPG/WEBP) -> PDF
 *  - PDF -> Images (PNG / JPG / ZIP)
 *  - Text / Markdown -> PDF
 *  - PDF -> Markdown / Text (.md / .txt)
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ConverterEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Fallback getters for browser or node environments
  function getJSZip() {
    if (typeof window !== 'undefined' && window.JSZip) return window.JSZip;
    if (typeof global !== 'undefined' && global.JSZip) return global.JSZip;
    try { return require('./jszip.min.js'); } catch (e) {}
    try { return require('jszip'); } catch (e) {}
    return null;
  }

  function getXLSX() {
    if (typeof window !== 'undefined' && window.XLSX) return window.XLSX;
    if (typeof global !== 'undefined' && global.XLSX) return global.XLSX;
    try { return require('./xlsx.full.min.js'); } catch (e) {}
    try { return require('xlsx'); } catch (e) {}
    return null;
  }

  function getJsPDF() {
    if (typeof window !== 'undefined') {
      if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
      if (window.jsPDF) return window.jsPDF;
    }
    if (typeof global !== 'undefined' && global.jspdf && global.jspdf.jsPDF) return global.jspdf.jsPDF;
    try {
      const mod = require('./jspdf.umd.min.js');
      return mod.jsPDF || mod;
    } catch (e) {}
    return null;
  }

  function getPptxGenJS() {
    if (typeof window !== 'undefined' && window.PptxGenJS) return window.PptxGenJS;
    if (typeof global !== 'undefined' && global.PptxGenJS) return global.PptxGenJS;
    // In Node environment, dynamically load bundled PptxGenJS
    if (typeof require !== 'undefined') {
      try {
        const vm = require('vm');
        const fs = require('fs');
        const path = require('path');
        const candidates = [
          path.resolve(__dirname, '../../fix.html/pptxgen.bundle.js'),
          path.resolve(process.cwd(), 'fix.html/pptxgen.bundle.js'),
          path.resolve(__dirname, '../../pptxgen.bundle.js'),
          path.resolve(process.cwd(), 'pptxgen.bundle.js')
        ];
        for (const p of candidates) {
          if (fs.existsSync(p)) {
            if (!global.JSZip) global.JSZip = getJSZip();
            const code = fs.readFileSync(p, 'utf8');
            vm.runInThisContext(code);
            if (global.PptxGenJS) return global.PptxGenJS;
          }
        }
      } catch (e) {}
    }
    return null;
  }

  // Unicode font support for jsPDF (Vietnamese diacritics)
  function tryRegisterUnicodeFont(doc) {
    try {
      if (typeof window === 'undefined') {
        const fs = require('fs');
        const path = require('path');
        const fontCandidates = [
          path.resolve(__dirname, '../../font/Be_Vietnam_Pro/BeVietnamPro-Regular.ttf'),
          path.resolve(process.cwd(), 'font/Be_Vietnam_Pro/BeVietnamPro-Regular.ttf'),
          path.resolve(__dirname, '../font/Be_Vietnam_Pro/BeVietnamPro-Regular.ttf')
        ];
        for (const p of fontCandidates) {
          if (fs.existsSync(p)) {
            const fontB64 = fs.readFileSync(p).toString('base64');
            doc.addFileToVFS('BeVietnamPro-Regular.ttf', fontB64);
            doc.addFont('BeVietnamPro-Regular.ttf', 'BeVietnamPro', 'normal');
            doc.setFont('BeVietnamPro');
            return true;
          }
        }
      } else if (window.__SV_FONT_VIETNAM_B64) {
        doc.addFileToVFS('BeVietnamPro-Regular.ttf', window.__SV_FONT_VIETNAM_B64);
        doc.addFont('BeVietnamPro-Regular.ttf', 'BeVietnamPro', 'normal');
        doc.setFont('BeVietnamPro');
        return true;
      }
    } catch (e) {
      console.warn('Unicode font registration notice:', e.message);
    }
    return false;
  }

  function escapeXml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    const str = String(unsafe);
    return str
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function formatBytes(bytes, decimals = 1) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  function parseNumberValue(val) {
    if (typeof val === 'number') return val;
    if (val === null || val === undefined) return null;
    let trimmed = String(val).trim();
    if (!trimmed) return null;

    // Detect and strip currency prefixes/suffixes: đ, VND, VNĐ, $, €, ¥, £
    let isCurrency = false;
    if (/[\$€¥£]|vn[đd]|đồng|đ/i.test(trimmed)) {
      isCurrency = true;
      trimmed = trimmed.replace(/[\$€¥£]|vn[đd]|đồng|đ/gi, '').trim();
    }

    // Check percentage: e.g. 50% or 45,2% or 45.2%
    if (/^-?\d+(?:[\.,]\d+)?%$/.test(trimmed)) {
      const cleanPct = trimmed.replace('%', '').replace(',', '.');
      return parseFloat(cleanPct) / 100;
    }

    // Standard integer or simple float: 1234 or 1234.56
    if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
      if (/^-?\d{1,3}\.\d{3}$/.test(trimmed) && (isCurrency || /^-?\d{2,3}\.000$/.test(trimmed))) {
        return parseFloat(trimmed.replace('.', ''));
      }
      return parseFloat(trimmed);
    }

    // Vietnamese/European format: e.g. 1.234.567,89 or 100.000,50 or 1234,56
    if (/^-?\d{1,3}(?:\.\d{3})*,\d+$/.test(trimmed) || /^-?\d+,\d+$/.test(trimmed)) {
      const cleanVn = trimmed.replace(/\./g, '').replace(',', '.');
      return parseFloat(cleanVn);
    }

    // English format with commas: e.g. 1,234,567.89 or 1,250
    if (/^-?\d{1,3}(?:,\d{3})*(?:\.\d+)?$/.test(trimmed)) {
      const cleanEn = trimmed.replace(/,/g, '');
      return parseFloat(cleanEn);
    }

    // Vietnamese thousands with multiple dots: e.g. 1.000.000
    if (/^-?\d{1,3}(?:\.\d{3})+$/.test(trimmed)) {
      return parseFloat(trimmed.replace(/\./g, ''));
    }

    return null;
  }

  // Optical grouping of line text items into cells
  function groupLineIntoCells(lineItems, gapThreshold = 20) {
    if (!lineItems || lineItems.length === 0) return [];
    const sorted = [...lineItems].sort((a, b) => a.x - b.x);
    const cells = [];
    let currentCell = [sorted[0].str.trim()];
    let lastEnd = sorted[0].x + (sorted[0].width || (sorted[0].str.length * 6));

    for (let j = 1; j < sorted.length; j++) {
      const it = sorted[j];
      const text = it.str.trim();
      if (!text) continue;
      const gap = it.x - lastEnd;
      if (gap > gapThreshold) {
        cells.push(currentCell.filter(Boolean).join(' '));
        currentCell = [text];
      } else {
        currentCell.push(text);
      }
      lastEnd = Math.max(lastEnd, it.x + (it.width || (text.length * 6)));
    }
    if (currentCell.length > 0) {
      cells.push(currentCell.filter(Boolean).join(' '));
    }
    return cells.filter(c => c.length > 0);
  }

  // ==========================================
  // 1. PDF EXTRACTION (pdfjsLib wrapper)
  // ==========================================
  async function extractPdfData(arrayBuffer, options = {}, onProgress = () => {}) {
    let pdfjs = null;
    if (typeof window !== 'undefined' && window.pdfjsLib) {
      pdfjs = window.pdfjsLib;
    } else if (typeof global !== 'undefined' && global.pdfjsLib) {
      pdfjs = global.pdfjsLib;
    }

    if (!pdfjs) {
      throw new Error('PDF.js library chưa sẵn sàng hoặc không tìm thấy window.pdfjsLib');
    }

    onProgress(10, 'Đang đọc cấu trúc PDF...');
    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
      isEvalSupported: false
    });

    const pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages;
    const pagesData = [];
    let fullText = '';
    const allParagraphs = [];
    const allTables = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const percent = 10 + Math.round((pageNum / totalPages) * 60);
      onProgress(percent, `Đang phân tích trang ${pageNum} / ${totalPages}...`);

      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: options.renderScale || 1.5 });

      // Group text items by Y coordinate into lines
      const items = textContent.items.map(item => ({
        str: item.str,
        x: item.transform[4],
        y: item.transform[5],
        width: item.width,
        height: item.height,
        fontName: item.fontName,
        fontSize: Math.round(Math.hypot(item.transform[0], item.transform[1]))
      }));

      // Sort top-to-bottom (Y desc in PDF coordinate system), then left-to-right (X asc)
      items.sort((a, b) => {
        const yDiff = b.y - a.y;
        if (Math.abs(yDiff) > 5) return yDiff;
        return a.x - b.x;
      });

      // Cluster into lines with threshold
      const lines = [];
      let currentLine = [];
      let lastY = null;

      for (const item of items) {
        if (!item.str.trim()) continue;
        if (lastY === null || Math.abs(item.y - lastY) <= 5) {
          currentLine.push(item);
          lastY = item.y;
        } else {
          if (currentLine.length > 0) {
            currentLine.sort((a, b) => a.x - b.x);
            lines.push(currentLine);
          }
          currentLine = [item];
          lastY = item.y;
        }
      }
      if (currentLine.length > 0) {
        currentLine.sort((a, b) => a.x - b.x);
        lines.push(currentLine);
      }

      // Detect table rows vs paragraphs with optical clustering
      const pageTables = [];
      const pageParagraphs = [];
      let currentTableRows = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineText = line.map(it => it.str).join(' ').trim();
        const maxFontSize = Math.max(...line.map(it => it.fontSize || 12));

        // Multi-column optical test
        const isMultiCol = line.length >= 2 && line.some((it, idx) => {
          if (idx === 0) return false;
          return (it.x - (line[idx - 1].x + (line[idx - 1].width || 10))) > 20;
        });

        if (isMultiCol) {
          const cells = groupLineIntoCells(line, 20);
          if (cells.length >= 2) {
            currentTableRows.push(cells);
          } else if (lineText) {
            const isHeading = maxFontSize >= 16 || (maxFontSize >= 14 && lineText.length < 60);
            const isBullet = /^(?:[•\-\*]|\d+[\.\)])\s+/.test(lineText);
            const para = { text: lineText, isHeading, isBullet, fontSize: maxFontSize, pageNum };
            pageParagraphs.push(para);
            allParagraphs.push(para);
          }
        } else {
          if (currentTableRows.length >= 2) {
            pageTables.push(currentTableRows);
            allTables.push(currentTableRows);
          }
          currentTableRows = [];

          if (lineText) {
            const isHeading = maxFontSize >= 16 || (maxFontSize >= 14 && lineText.length < 60);
            const isBullet = /^(?:[•\-\*]|\d+[\.\)])\s+/.test(lineText);
            const para = { text: lineText, isHeading, isBullet, fontSize: maxFontSize, pageNum };
            pageParagraphs.push(para);
            allParagraphs.push(para);
          }
        }
      }

      if (currentTableRows.length >= 2) {
        pageTables.push(currentTableRows);
        allTables.push(currentTableRows);
      }

      // Optional canvas visual rendering
      let canvasDataUrl = null;
      if (options.renderCanvas && typeof document !== 'undefined') {
        try {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport }).promise;
          canvasDataUrl = canvas.toDataURL('image/png', 0.92);
        } catch (e) {
          console.warn('Canvas render failed for page ' + pageNum, e);
        }
      }

      const pageText = lines.map(ln => ln.map(it => it.str).join(' ')).join('\n');
      fullText += (pageNum > 1 ? '\n\n--- [Trang ' + pageNum + '] ---\n\n' : '') + pageText;

      pagesData.push({
        pageNum,
        width: viewport.width,
        height: viewport.height,
        text: pageText,
        lines,
        paragraphs: pageParagraphs,
        tables: pageTables,
        canvasDataUrl
      });
    }

    // Generate clean Markdown
    let markdown = '';
    for (const p of allParagraphs) {
      if (p.isHeading) {
        markdown += `\n\n## ${p.text}\n\n`;
      } else if (p.isBullet) {
        markdown += `- ${p.text.replace(/^(?:[•\-\*]|\d+[\.\)])\s*/, '')}\n`;
      } else {
        markdown += `${p.text}\n\n`;
      }
    }

    if (allTables.length > 0) {
      markdown += '\n### Bảng dữ liệu trích xuất\n\n';
      for (const tbl of allTables) {
        if (tbl.length > 0) {
          const colCount = Math.max(...tbl.map(r => r.length));
          const headers = [...tbl[0]];
          while (headers.length < colCount) headers.push('');
          markdown += '| ' + headers.join(' | ') + ' |\n';
          markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
          for (let r = 1; r < tbl.length; r++) {
            const row = [...tbl[r]];
            while (row.length < colCount) row.push('');
            markdown += '| ' + row.join(' | ') + ' |\n';
          }
          markdown += '\n';
        }
      }
    }

    onProgress(75, 'Trích xuất cấu trúc văn bản & bảng biểu hoàn tất.');

    return {
      totalPages,
      fullText,
      markdown: markdown.trim(),
      paragraphs: allParagraphs,
      tables: allTables,
      pagesData,
      title: (allParagraphs[0]?.text || 'Tài liệu chuyển đổi').slice(0, 80)
    };
  }

  // ==========================================
  // 2. WORD (.docx) GENERATION
  // ==========================================
  async function generateDocx(extractedData, options = {}) {
    const JSZip = getJSZip();
    if (!JSZip) {
      throw new Error('JSZip không khả dụng để tạo file .docx');
    }

    const zip = new JSZip();
    const title = options.title || extractedData.title || 'SlideVault Document';
    const paragraphs = extractedData.paragraphs || [];
    const tables = extractedData.tables || [];

    // 1. [Content_Types].xml
    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;
    zip.file('[Content_Types].xml', contentTypesXml);

    // 2. _rels/.rels
    const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
    zip.file('_rels/.rels', relsXml);

    // 3. word/_rels/document.xml.rels
    const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>`;
    zip.file('word/_rels/document.xml.rels', docRelsXml);

    // 4. word/styles.xml
    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="23"/>
        <w:szCs w:val="23"/>
        <w:color w:val="1F2937"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="160" w:line="260" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:b/>
      <w:sz w:val="48"/>
      <w:szCs w:val="48"/>
      <w:color w:val="0F172A"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:pPr>
      <w:spacing w:before="280" w:after="140"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:b/>
      <w:sz w:val="32"/>
      <w:szCs w:val="32"/>
      <w:color w:val="059669"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:pPr>
      <w:spacing w:before="200" w:after="100"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:b/>
      <w:sz w:val="26"/>
      <w:szCs w:val="26"/>
      <w:color w:val="374151"/>
    </w:rPr>
  </w:style>
</w:styles>`;
    zip.file('word/styles.xml', stylesXml);

    // 5. word/settings.xml
    zip.file('word/settings.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:defaultTabStop w:val="720"/></w:settings>`);

    // 6. docProps/core.xml & app.xml
    const dateStr = new Date().toISOString();
    zip.file('docProps/core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${escapeXml(title)}</dc:title>
  <dc:creator>SlideVault Converter Pro</dc:creator>
  <cp:lastModifiedBy>SlideVault Converter Pro</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${dateStr}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${dateStr}</dcterms:modified>
</cp:coreProperties>`);

    zip.file('docProps/app.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>SlideVault Pro Enterprise Converter</Application>
  <DocSecurity>0</DocSecurity>
</Properties>`);

    // 7. word/document.xml assembly
    let bodyXml = '';

    // Title Paragraph
    bodyXml += `<w:p>
      <w:pPr><w:pStyle w:val="Title"/><w:jc w:val="center"/></w:pPr>
      <w:r><w:t>${escapeXml(title)}</w:t></w:r>
    </w:p>`;

    // Subtitle / metadata badge
    bodyXml += `<w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="360"/></w:pPr>
      <w:r><w:rPr><w:color w:val="6B7280"/><w:sz w:val="20"/><w:i/></w:rPr>
        <w:t>Chuyển đổi bởi SlideVault Apple VisionOS Converter • ${new Date().toLocaleDateString('vi-VN')}</w:t>
      </w:r>
    </w:p>`;

    // Render paragraphs
    let lastPage = 1;
    for (const p of paragraphs) {
      if (p.pageNum && p.pageNum !== lastPage) {
        lastPage = p.pageNum;
      }

      if (p.isHeading) {
        bodyXml += `<w:p>
          <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
          <w:r><w:t>${escapeXml(p.text)}</w:t></w:r>
        </w:p>`;
      } else if (p.isBullet) {
        bodyXml += `<w:p>
          <w:pPr>
            <w:ind w:left="360" w:hanging="240"/>
          </w:pPr>
          <w:r><w:rPr><w:color w:val="059669"/><w:b/></w:rPr><w:t xml:space="preserve">•  </w:t></w:r>
          <w:r><w:t>${escapeXml(p.text.replace(/^(?:[•\-\*]|\d+[\.\)])\s*/, ''))}</w:t></w:r>
        </w:p>`;
      } else {
        bodyXml += `<w:p>
          <w:r><w:t xml:space="preserve">${escapeXml(p.text)}</w:t></w:r>
        </w:p>`;
      }
    }

    // Render tables with dynamic proportional column widths
    for (const tbl of tables) {
      if (tbl.length > 0) {
        const colCount = Math.max(...tbl.map(r => r.length), 1);
        const colWidth = Math.floor(9200 / colCount);

        bodyXml += `<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>Bảng Dữ Liệu</w:t></w:r></w:p>`;
        bodyXml += `<w:tbl>
          <w:tblPr>
            <w:tblW w:w="9200" w:type="dxa"/>
            <w:tblBorders>
              <w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
              <w:left w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
              <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
              <w:right w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
              <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
              <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
            </w:tblBorders>
          </w:tblPr>`;

        tbl.forEach((row, rIdx) => {
          bodyXml += `<w:tr>`;
          const paddedRow = [...row];
          while (paddedRow.length < colCount) paddedRow.push('');
          paddedRow.forEach(cell => {
            const isHeader = rIdx === 0;
            bodyXml += `<w:tc>
              <w:tcPr>
                <w:tcW w:w="${colWidth}" w:type="dxa"/>
                ${isHeader ? '<w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/>' : ''}
                <w:tcMar><w:top w:w="120"/><w:left w:w="140"/><w:bottom w:w="120"/><w:right w:w="140"/></w:tcMar>
              </w:tcPr>
              <w:p>
                <w:r>
                  <w:rPr>${isHeader ? '<w:b/><w:color w:val="0F172A"/>' : '<w:color w:val="334155"/>'}<w:sz w:val="21"/></w:rPr>
                  <w:t>${escapeXml(cell)}</w:t>
                </w:r>
              </w:p>
            </w:tc>`;
          });
          bodyXml += `</w:tr>`;
        });
        bodyXml += `</w:tbl><w:p/>`;
      }
    }

    // Page setup (A4 standard: 11906 x 16838 dxa)
    bodyXml += `<w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>`;

    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>${bodyXml}</w:body>
</w:document>`;

    zip.file('word/document.xml', documentXml);

    const isNode = typeof window === 'undefined';
    if (isNode) {
      return await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    } else {
      return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    }
  }

  // ==========================================
  // 3. POWERPOINT (.pptx) GENERATION
  // ==========================================
  async function generatePptx(extractedData, options = {}) {
    const PptxGen = getPptxGenJS();
    if (!PptxGen) {
      throw new Error('PptxGenJS không khả dụng. Vui lòng đảm bảo pptxgen.bundle.js đã được tải.');
    }

    const pptx = new PptxGen();
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = 'SlideVault Converter';
    pptx.company = 'SlideVault Studio';
    pptx.title = options.title || extractedData.title || 'SlideVault Presentation';

    let pages = extractedData.pagesData || [];

    // Synthesize slide pages if pagesData is empty but paragraphs/tables exist
    if (pages.length === 0 && ((extractedData.paragraphs && extractedData.paragraphs.length > 0) || (extractedData.tables && extractedData.tables.length > 0))) {
      const paras = extractedData.paragraphs || [];
      const tables = extractedData.tables || [];

      let currentSlideParas = [];
      let currentHeading = extractedData.title || 'Tổng quan tài liệu';

      paras.forEach((p) => {
        if (p.isHeading && currentSlideParas.length > 0) {
          pages.push({
            pageNum: pages.length + 1,
            paragraphs: [{ text: currentHeading, isHeading: true }, ...currentSlideParas],
            tables: []
          });
          currentHeading = p.text;
          currentSlideParas = [];
        } else if (!p.isHeading) {
          currentSlideParas.push(p);
          if (currentSlideParas.length >= 6) {
            pages.push({
              pageNum: pages.length + 1,
              paragraphs: [{ text: currentHeading, isHeading: true }, ...currentSlideParas],
              tables: []
            });
            currentSlideParas = [];
          }
        } else {
          currentHeading = p.text;
        }
      });

      if (currentSlideParas.length > 0) {
        pages.push({
          pageNum: pages.length + 1,
          paragraphs: [{ text: currentHeading, isHeading: true }, ...currentSlideParas],
          tables: []
        });
      }

      // Add slides for tables
      tables.forEach((tbl, tIdx) => {
        pages.push({
          pageNum: pages.length + 1,
          paragraphs: [{ text: `Bảng Dữ Liệu ${tIdx + 1}`, isHeading: true }],
          tables: [tbl]
        });
      });
    }

    if (pages.length === 0) {
      const slide = pptx.addSlide();
      slide.background = { color: '0A0E1A' };
      slide.addText(pptx.title, {
        x: 0.8, y: 1.0, w: '85%', fontSize: 32, bold: true, color: '10B981', fontFace: 'Arial'
      });
      slide.addText('Tài liệu tạo bởi SlideVault Ultra Converter', {
        x: 0.8, y: 2.2, w: '85%', fontSize: 16, color: '94A3B8', fontFace: 'Arial'
      });
    } else {
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const slide = pptx.addSlide();

        if (options.useVisualBackground && page.canvasDataUrl) {
          slide.addImage({
            data: page.canvasDataUrl,
            x: 0,
            y: 0,
            w: '100%',
            h: '100%'
          });
        } else {
          slide.background = { color: i % 2 === 0 ? '0F172A' : '111827' };

          const pageTitle = page.paragraphs?.find(p => p.isHeading)?.text || `Slide ${i + 1}: ${(extractedData.title || 'SlideVault').slice(0, 45)}`;

          // Accent bar
          slide.addShape(pptx.ShapeType.rect, {
            x: 0.6, y: 0.5, w: 0.15, h: 0.6, fill: { color: '10B981' }
          });

          slide.addText(pageTitle, {
            x: 0.9, y: 0.5, w: 11.5, h: 0.6,
            fontSize: 24, bold: true, color: 'F8FAFC', fontFace: 'Arial', valign: 'middle'
          });

          const bodyParagraphs = (page.paragraphs || []).filter(p => !p.isHeading);
          const hasTables = page.tables && page.tables.length > 0;

          if (bodyParagraphs.length > 0) {
            const textObjects = bodyParagraphs.slice(0, 8).map(bp => ({
              text: (bp.isBullet ? '• ' : '') + bp.text + '\n',
              options: {
                fontSize: bp.isBullet ? 14 : 15,
                color: 'CBD5E1',
                breakLine: true,
                lineSpacing: 22
              }
            }));

            slide.addText(textObjects, {
              x: 0.8, y: 1.5, w: hasTables ? 5.8 : 11.5, h: 4.8,
              fontFace: 'Arial', valign: 'top'
            });
          }

          if (hasTables) {
            const tableData = page.tables[0];
            const maxCols = Math.max(...tableData.map(r => r.length), 1);
            const pptxRows = tableData.slice(0, 8).map((row, rIdx) => {
              const paddedRow = [...row];
              while (paddedRow.length < maxCols) paddedRow.push('');
              return paddedRow.map(cell => ({
                text: String(cell ?? ''),
                options: {
                  fontSize: 11,
                  bold: rIdx === 0,
                  color: rIdx === 0 ? 'FFFFFF' : 'E2E8F0',
                  fill: rIdx === 0 ? '047857' : (rIdx % 2 === 0 ? '1E293B' : '0F172A'),
                  align: 'center'
                }
              }));
            });

            const tableW = bodyParagraphs.length > 0 ? 5.5 : 11.0;
            slide.addTable(pptxRows, {
              x: bodyParagraphs.length > 0 ? 6.8 : 1.0,
              y: 1.6,
              w: tableW,
              colW: Array(maxCols).fill(tableW / maxCols),
              border: { pt: 0.5, color: '334155' }
            });
          }

          // Footer
          slide.addText(`SlideVault • Trang ${i + 1} / ${pages.length}`, {
            x: 0.8, y: 6.8, w: 11.5, fontSize: 10, color: '64748B', fontFace: 'Arial'
          });
        }
      }
    }

    if (typeof window !== 'undefined') {
      return await pptx.write({ outputType: 'blob' });
    } else {
      const out = await pptx.write('nodebuffer');
      if (Buffer.isBuffer(out)) return out;
      if (out instanceof Blob) return Buffer.from(await out.arrayBuffer());
      return Buffer.from(out);
    }
  }

  // ==========================================
  // 4. EXCEL (.xlsx / .csv) GENERATION
  // ==========================================
  function generateExcel(extractedData, options = {}) {
    const XLSX = getXLSX();
    if (!XLSX) {
      throw new Error('SheetJS (XLSX) không khả dụng');
    }

    const tables = extractedData.tables || [];
    let rowsData = [];

    if (tables.length > 0) {
      tables.forEach((tbl, idx) => {
        if (idx > 0) rowsData.push([]);
        rowsData.push([`--- BẢNG ${idx + 1} ---`]);
        tbl.forEach(row => {
          const parsedRow = row.map(cell => {
            const num = parseNumberValue(cell);
            return num !== null ? num : cell;
          });
          rowsData.push(parsedRow);
        });
      });
    } else if (extractedData.paragraphs && extractedData.paragraphs.length > 0) {
      rowsData.push(['Trang', 'Phân Loại', 'Nội Dung', 'Độ Dài Ký Tự']);
      extractedData.paragraphs.forEach(p => {
        rowsData.push([
          p.pageNum || 1,
          p.isHeading ? 'Tiêu Đề' : (p.isBullet ? 'Gạch Đầu Dòng' : 'Đoạn Văn'),
          p.text,
          p.text.length
        ]);
      });
    } else {
      rowsData = [['Thông Báo', 'Không tìm thấy dữ liệu bảng trong file']];
    }

    const ws = XLSX.utils.aoa_to_sheet(rowsData);

    const colWidths = [];
    rowsData.forEach(row => {
      row.forEach((cell, cIdx) => {
        const len = cell ? String(cell).length : 10;
        colWidths[cIdx] = Math.min(60, Math.max(colWidths[cIdx] || 10, len + 2));
      });
    });
    ws['!cols'] = colWidths.map(w => ({ wch: w }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, options.sheetName || 'SlideVaultData');

    const isNode = typeof window === 'undefined';
    const xlsxBuffer = XLSX.write(wb, {
      bookType: 'xlsx',
      type: isNode ? 'buffer' : 'array'
    });

    let blob = null;
    if (!isNode) {
      blob = new Blob([xlsxBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    }

    // CSV with UTF-8 BOM, unquoted numbers
    let csvContent = '\uFEFF';
    rowsData.forEach(row => {
      const line = row.map(val => {
        if (val === null || val === undefined) return '""';
        if (typeof val === 'number') return String(val);
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(',');
      csvContent += line + '\r\n';
    });

    const csvBlob = !isNode ? new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }) : Buffer.from(csvContent, 'utf8');

    return {
      xlsxBuffer,
      xlsxBlob: blob,
      csvBlob,
      rowsData
    };
  }

  // ==========================================
  // 5. WORD (.docx) TO PDF CONVERSION
  // ==========================================
  async function convertDocxToPdf(docxArrayBuffer, options = {}, onProgress = () => {}) {
    const JSZip = getJSZip();
    const jsPDF = getJsPDF();
    if (!JSZip || !jsPDF) {
      throw new Error('JSZip hoặc jsPDF không khả dụng để chuyển đổi DOCX sang PDF');
    }

    onProgress(15, 'Đang giải nén tài liệu Word...');
    const zip = await JSZip.loadAsync(docxArrayBuffer);
    const docXmlFile = zip.file('word/document.xml');
    if (!docXmlFile) {
      throw new Error('Tệp không phải là tài liệu Word (.docx) hợp lệ (thiếu word/document.xml)');
    }

    onProgress(40, 'Đang phân tích cú pháp cấu trúc OpenXML...');
    const docXmlStr = await docXmlFile.async('string');

    const paragraphMatches = docXmlStr.match(/<w:p\b[\s\S]*?<\/w:p>/g) || [];
    const extractedParagraphs = [];

    paragraphMatches.forEach(pXml => {
      const textMatches = pXml.match(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g) || [];
      const text = textMatches.map(m => m.replace(/<[^>]+>/g, '')).join('');
      if (text.trim()) {
        const isHeading = /<w:pStyle\b[^>]*w:val=['"](Heading\d|Title)['"]/i.test(pXml);
        extractedParagraphs.push({ text: text.trim(), isHeading });
      }
    });

    onProgress(70, 'Đang kết xuất PDF vector Unicode...');
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    tryRegisterUnicodeFont(doc);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 50;
    const maxLineWidth = pageWidth - margin * 2;
    let y = 60;

    extractedParagraphs.forEach(p => {
      if (p.isHeading) {
        if (y > pageHeight - 80) {
          doc.addPage();
          y = 60;
        }
        y += 15;
        doc.setFontSize(14);
        doc.setTextColor(5, 150, 105);
        const splitText = doc.splitTextToSize(p.text, maxLineWidth);
        doc.text(splitText, margin, y);
        y += splitText.length * 18 + 8;
      } else {
        doc.setFontSize(11);
        doc.setTextColor(51, 65, 85);
        const splitText = doc.splitTextToSize(p.text, maxLineWidth);
        if (y + splitText.length * 14 > pageHeight - 50) {
          doc.addPage();
          y = 60;
        }
        doc.text(splitText, margin, y);
        y += splitText.length * 14 + 6;
      }
    });

    onProgress(100, 'Chuyển đổi Word sang PDF hoàn tất.');

    if (typeof window !== 'undefined') {
      return doc.output('blob');
    } else {
      return Buffer.from(doc.output('arraybuffer'));
    }
  }

  // ==========================================
  // 6. IMAGES (PNG/JPG) TO PDF CONVERSION
  // ==========================================
  async function convertImagesToPdf(imagesList, options = {}, onProgress = () => {}) {
    const jsPDF = getJsPDF();
    if (!jsPDF) {
      throw new Error('jsPDF không khả dụng để chuyển đổi ảnh sang PDF');
    }

    onProgress(10, 'Đang chuẩn bị bộ xử lý PDF...');
    const doc = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 0; i < imagesList.length; i++) {
      const percent = 10 + Math.round(((i + 1) / imagesList.length) * 80);
      onProgress(percent, `Đang xử lý hình ảnh ${i + 1} / ${imagesList.length}...`);

      if (i > 0) doc.addPage();

      const img = imagesList[i];
      const dataUrl = img.dataUrl || img;
      const imgWidth = img.width || 800;
      const imgHeight = img.height || 600;

      const padding = options.margin !== undefined ? options.margin : 20;
      const availW = pageWidth - padding * 2;
      const availH = pageHeight - padding * 2;

      const scale = Math.min(availW / imgWidth, availH / imgHeight, 1.0);
      const renderW = imgWidth * scale;
      const renderH = imgHeight * scale;
      const x = padding + (availW - renderW) / 2;
      const y = padding + (availH - renderH) / 2;

      const format = (img.type && img.type.includes('png')) ? 'PNG' : 'JPEG';
      doc.addImage(dataUrl, format, x, y, renderW, renderH, undefined, 'FAST');
    }

    onProgress(100, 'Kết xuất PDF từ ảnh hoàn tất.');

    if (typeof window !== 'undefined') {
      return doc.output('blob');
    } else {
      return Buffer.from(doc.output('arraybuffer'));
    }
  }

  // ==========================================
  // 7. PDF TO IMAGES (PNG/JPG / ZIP)
  // ==========================================
  async function convertPdfToImages(arrayBuffer, options = {}, onProgress = () => {}) {
    let pdfjs = null;
    if (typeof window !== 'undefined' && window.pdfjsLib) pdfjs = window.pdfjsLib;
    else if (typeof global !== 'undefined' && global.pdfjsLib) pdfjs = global.pdfjsLib;

    if (!pdfjs) throw new Error('PDF.js library chưa sẵn sàng');
    const JSZip = getJSZip();

    onProgress(10, 'Đang phân tích cấu trúc PDF...');
    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
      isEvalSupported: false
    });
    const pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages;
    const images = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const percent = 10 + Math.round((pageNum / totalPages) * 75);
      onProgress(percent, `Đang kết xuất trang ảnh ${pageNum} / ${totalPages}...`);
      const page = await pdfDoc.getPage(pageNum);
      const scale = options.scale || 2.0;
      const viewport = page.getViewport({ scale });

      if (typeof document !== 'undefined') {
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;
        const mime = options.format === 'jpg' ? 'image/jpeg' : 'image/png';
        const ext = options.format === 'jpg' ? '.jpg' : '.png';
        const dataUrl = canvas.toDataURL(mime, 0.95);
        const blob = await new Promise(res => canvas.toBlob(res, mime, 0.95));
        images.push({ pageNum, dataUrl, blob, ext, width: viewport.width, height: viewport.height });
      }
    }

    onProgress(90, 'Đang đóng gói tệp kết quả...');
    if (images.length === 1) {
      onProgress(100, 'Kết xuất ảnh hoàn tất!');
      return {
        singleBlob: images[0].blob,
        singleDataUrl: images[0].dataUrl,
        filename: `Trang_1${images[0].ext}`,
        images
      };
    }

    if (JSZip && images.length > 1) {
      const zip = new JSZip();
      for (const img of images) {
        zip.file(`Trang_${img.pageNum}${img.ext}`, img.blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      onProgress(100, 'Đóng gói toàn bộ các trang ảnh hoàn tất!');
      return {
        zipBlob,
        images,
        filename: 'SlideVault_PDF_Images.zip'
      };
    }

    return { images };
  }

  // ==========================================
  // 8. TEXT / MARKDOWN TO PDF
  // ==========================================
  async function convertTextToPdf(textString, options = {}, onProgress = () => {}) {
    const jsPDF = getJsPDF();
    if (!jsPDF) throw new Error('jsPDF không khả dụng để chuyển đổi văn bản sang PDF');

    onProgress(20, 'Đang chuẩn bị bộ tạo PDF vector...');
    const doc = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    tryRegisterUnicodeFont(doc);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 50;
    const maxLineWidth = pageWidth - margin * 2;
    let y = 60;

    const lines = textString.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        y += 10;
        continue;
      }

      if (line.startsWith('# ')) {
        if (y > pageHeight - 80) { doc.addPage(); y = 60; }
        y += 10;
        doc.setFontSize(18);
        doc.setTextColor(15, 23, 42);
        const splitText = doc.splitTextToSize(line.replace(/^#\s*/, ''), maxLineWidth);
        doc.text(splitText, margin, y);
        y += splitText.length * 22 + 8;
      } else if (line.startsWith('## ') || line.startsWith('### ')) {
        if (y > pageHeight - 60) { doc.addPage(); y = 60; }
        y += 8;
        doc.setFontSize(14);
        doc.setTextColor(5, 150, 105);
        const splitText = doc.splitTextToSize(line.replace(/^#{2,3}\s*/, ''), maxLineWidth);
        doc.text(splitText, margin, y);
        y += splitText.length * 18 + 6;
      } else if (/^(?:[•\-\*]|\d+[\.\)])\s+/.test(line)) {
        if (y > pageHeight - 50) { doc.addPage(); y = 60; }
        doc.setFontSize(11);
        doc.setTextColor(51, 65, 85);
        const splitText = doc.splitTextToSize('• ' + line.replace(/^(?:[•\-\*]|\d+[\.\)])\s*/, ''), maxLineWidth - 15);
        doc.text(splitText, margin + 15, y);
        y += splitText.length * 15 + 4;
      } else {
        if (y > pageHeight - 50) { doc.addPage(); y = 60; }
        doc.setFontSize(11);
        doc.setTextColor(51, 65, 85);
        const splitText = doc.splitTextToSize(line, maxLineWidth);
        doc.text(splitText, margin, y);
        y += splitText.length * 15 + 4;
      }
    }

    onProgress(100, 'Tạo PDF hoàn tất!');
    if (typeof window !== 'undefined') {
      return doc.output('blob');
    } else {
      return Buffer.from(doc.output('arraybuffer'));
    }
  }

  // ==========================================
  // 9. DOWNLOAD HELPER UTILITY
  // ==========================================
  function downloadBlob(blob, filename) {
    if (typeof window === 'undefined' || !window.document) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 250);
  }

  return {
    extractPdfData,
    generateDocx,
    generatePptx,
    generateExcel,
    convertDocxToPdf,
    convertImagesToPdf,
    convertPdfToImages,
    convertTextToPdf,
    downloadBlob,
    formatBytes,
    parseNumberValue,
    groupLineIntoCells,
    escapeXml,
    getJSZip,
    getXLSX,
    getJsPDF,
    getPptxGenJS
  };
});
