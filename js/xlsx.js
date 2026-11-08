/*
 * Petit générateur de fichiers Excel (.xlsx), sans bibliothèque externe.
 * Un .xlsx est une archive ZIP de fichiers XML : on l'écrit sans compression.
 *
 * Utilisation :
 *   HMXlsx.build({ sheetName, rtl, cols: [largeurs], rows: [[cellule, ...], ...] }) → Uint8Array
 *   cellule = null | 'texte' | nombre | { v: valeur, s: 'header' | 'bold' | 'dec' | 'decBold' | 'money' | 'moneyBold' | 'title' }
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HMXlsx = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- ZIP (méthode « stockée », sans compression) ---------- */

  const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  const enc = new TextEncoder();

  function zip(files) {
    const chunks = [];
    const central = [];
    let offset = 0;
    // Date fixe (1er janvier 2026) au format DOS
    const dosTime = 0;
    const dosDate = ((2026 - 1980) << 9) | (1 << 5) | 1;

    files.forEach(({ name, data }) => {
      const nameBytes = enc.encode(name);
      const bytes = typeof data === 'string' ? enc.encode(data) : data;
      const crc = crc32(bytes);

      const local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true);
      local.setUint16(4, 20, true); // version nécessaire
      local.setUint16(6, 0x0800, true); // noms en UTF-8
      local.setUint16(8, 0, true); // pas de compression
      local.setUint16(10, dosTime, true);
      local.setUint16(12, dosDate, true);
      local.setUint32(14, crc, true);
      local.setUint32(18, bytes.length, true);
      local.setUint32(22, bytes.length, true);
      local.setUint16(26, nameBytes.length, true);
      local.setUint16(28, 0, true);
      chunks.push(new Uint8Array(local.buffer), nameBytes, bytes);

      const cd = new DataView(new ArrayBuffer(46));
      cd.setUint32(0, 0x02014b50, true);
      cd.setUint16(4, 20, true);
      cd.setUint16(6, 20, true);
      cd.setUint16(8, 0x0800, true);
      cd.setUint16(10, 0, true);
      cd.setUint16(12, dosTime, true);
      cd.setUint16(14, dosDate, true);
      cd.setUint32(16, crc, true);
      cd.setUint32(20, bytes.length, true);
      cd.setUint32(24, bytes.length, true);
      cd.setUint16(28, nameBytes.length, true);
      cd.setUint16(30, 0, true);
      cd.setUint16(32, 0, true);
      cd.setUint16(34, 0, true);
      cd.setUint16(36, 0, true);
      cd.setUint32(38, 0, true);
      cd.setUint32(42, offset, true);
      central.push(new Uint8Array(cd.buffer), nameBytes);

      offset += 30 + nameBytes.length + bytes.length;
    });

    const cdSize = central.reduce((a, c) => a + c.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(4, 0, true);
    end.setUint16(6, 0, true);
    end.setUint16(8, files.length, true);
    end.setUint16(10, files.length, true);
    end.setUint32(12, cdSize, true);
    end.setUint32(16, offset, true);
    end.setUint16(20, 0, true);

    const all = chunks.concat(central, [new Uint8Array(end.buffer)]);
    const total = all.reduce((a, c) => a + c.length, 0);
    const out = new Uint8Array(total);
    let p = 0;
    all.forEach((c) => { out.set(c, p); p += c.length; });
    return out;
  }

  /* ---------- Classeur Excel ---------- */

  const esc = (s) => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // caractères interdits en XML
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

  // Index des styles dans styles.xml (cellXfs)
  const STYLE = { normal: 0, header: 1, dec: 2, decBold: 3, money: 4, moneyBold: 5, bold: 6, title: 7 };

  const STYLES_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
    + '<numFmts count="2">'
    + '<numFmt numFmtId="164" formatCode="0.00"/>'
    + '<numFmt numFmtId="165" formatCode="#,##0.00\\ &quot;€&quot;"/>'
    + '</numFmts>'
    + '<fonts count="3">'
    + '<font><sz val="11"/><name val="Calibri"/><family val="2"/></font>'
    + '<font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font>'
    + '<font><b/><sz val="14"/><name val="Calibri"/><family val="2"/></font>'
    + '</fonts>'
    + '<fills count="3">'
    + '<fill><patternFill patternType="none"/></fill>'
    + '<fill><patternFill patternType="gray125"/></fill>'
    + '<fill><patternFill patternType="solid"><fgColor rgb="FFDCEBF5"/><bgColor indexed="64"/></patternFill></fill>'
    + '</fills>'
    + '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
    + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
    + '<cellXfs count="8">'
    + '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
    + '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>'
    + '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'
    + '<xf numFmtId="164" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>'
    + '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'
    + '<xf numFmtId="165" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>'
    + '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
    + '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
    + '</cellXfs>'
    + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
    + '</styleSheet>';

  function colName(i) {
    let s = '';
    i += 1;
    while (i > 0) {
      const r = (i - 1) % 26;
      s = String.fromCharCode(65 + r) + s;
      i = Math.floor((i - 1) / 26);
    }
    return s;
  }

  function cellXml(cell, ref) {
    if (cell == null || cell === '') return '';
    const obj = typeof cell === 'object' ? cell : { v: cell };
    const s = STYLE[obj.s] || 0;
    const sAttr = s ? ' s="' + s + '"' : '';
    if (typeof obj.v === 'number' && isFinite(obj.v)) {
      return '<c r="' + ref + '"' + sAttr + '><v>' + obj.v + '</v></c>';
    }
    if (obj.v == null || obj.v === '') return s ? '<c r="' + ref + '"' + sAttr + '/>' : '';
    return '<c r="' + ref + '"' + sAttr + ' t="inlineStr"><is><t xml:space="preserve">' + esc(obj.v) + '</t></is></c>';
  }

  function sheetXml(opts) {
    const rows = opts.rows || [];
    let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
      + '<sheetViews><sheetView workbookViewId="0"' + (opts.rtl ? ' rightToLeft="1"' : '') + '/></sheetViews>'
      + '<sheetFormatPr defaultRowHeight="15"/>';
    if (opts.cols && opts.cols.length) {
      xml += '<cols>' + opts.cols.map((w, i) => '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>').join('') + '</cols>';
    }
    xml += '<sheetData>';
    rows.forEach((row, r) => {
      const cells = (row || []).map((c, i) => cellXml(c, colName(i) + (r + 1))).join('');
      xml += '<row r="' + (r + 1) + '">' + cells + '</row>';
    });
    xml += '</sheetData>'
      + '<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>'
      + '</worksheet>';
    return xml;
  }

  function build(opts) {
    // Excel refuse certains caractères dans le nom d'onglet et le limite à 31 caractères
    const sheetName = String(opts.sheetName || 'Feuille1').replace(/[\\\/\?\*\[\]:]/g, ' ').slice(0, 31);
    const files = [
      {
        name: '[Content_Types].xml',
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
          + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
          + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
          + '<Default Extension="xml" ContentType="application/xml"/>'
          + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
          + '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
          + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
          + '</Types>',
      },
      {
        name: '_rels/.rels',
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
          + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
          + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
          + '</Relationships>',
      },
      {
        name: 'xl/workbook.xml',
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
          + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
          + '<sheets><sheet name="' + esc(sheetName) + '" sheetId="1" r:id="rId1"/></sheets>'
          + '</workbook>',
      },
      {
        name: 'xl/_rels/workbook.xml.rels',
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
          + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
          + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
          + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
          + '</Relationships>',
      },
      { name: 'xl/styles.xml', data: STYLES_XML },
      { name: 'xl/worksheets/sheet1.xml', data: sheetXml(opts) },
    ];
    return zip(files);
  }

  return { build, zip, crc32 };
});
