import { describe, it, expect } from 'vitest';
import { cleanRows, defaultOptions, normalizeDate, normalizeNumber, parseCSV, makeCSV, readFile } from './sheet-cleaner';

describe('local spreadsheet cleaning', () => {
  it('trims leading and trailing whitespace', () => {
    expect(cleanRows([['ชื่อ'], ['  มาลี  ']], defaultOptions).rows[1]).toEqual(['มาลี']);
  });
  it('reduces repeated spaces', () => {
    expect(cleanRows([['ชื่อ'], ['มาลี   ใจดี']], defaultOptions).rows[1]).toEqual(['มาลี ใจดี']);
  });
  it('removes all blank rows but keeps the header', () => {
    const result = cleanRows([['ชื่อ'], [''], ['  '], ['มาลี']], defaultOptions);
    expect(result.rows).toEqual([['ชื่อ'], ['มาลี']]);
    expect(result.removed).toBe(2);
  });
  it('removes duplicates after cleaning', () => {
    expect(cleanRows([['ชื่อ'], ['มาลี'], [' มาลี ']], defaultOptions).removed).toBe(1);
  });
  it('converts currency, commas and spaces into a real number', () => {
    expect(normalizeNumber('฿ 1,250.50')).toBe(1250.5);
    expect(normalizeNumber('2 500 บาท')).toBe(2500);
    expect(normalizeNumber('00123')).toBe('00123');
    expect(normalizeNumber('1234567890123456')).toBe('1234567890123456');
  });
  it('normalizes day-first and Buddhist dates without accepting invalid days', () => {
    expect(normalizeDate('27/11/2569')).toBe('2026-11-27');
    expect(normalizeDate('2026/11/27')).toBe('2026-11-27');
    expect(normalizeDate('31/02/2026')).toBe('31/02/2026');
  });
  it('detects CSV delimiters and preserves Thai text', () => {
    const data = new TextEncoder().encode('ชื่อ;จำนวน\r\nมาลี;25\r\n');
    const result = parseCSV(data.buffer);
    expect(result.delimiter).toBe(';');
    expect(result.sheets[0]?.rows).toEqual([['ชื่อ', 'จำนวน'], ['มาลี', '25']]);
  });
  it('reads legacy Thai Windows-874 encoding locally', () => {
    const data = new Uint8Array([0xe4,0xb7,0xc2,0x2c,0x31]);
    expect(parseCSV(data.buffer).sheets[0]?.rows[0]).toEqual(['ไทย', '1']);
  });
  it('exports UTF-8 BOM and protects formula-like CSV strings', () => {
    const csv = makeCSV([['ชื่อ'], ['ไทย'], ['=1+1']]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('ไทย');
    expect(csv).toContain("'=1+1");
  });
  it('does not alter data when all options are off', () => {
    const rows = [['ชื่อ'], [' มาลี  '], [''], [' มาลี  ']];
    expect(cleanRows(rows, { trim:false, spaces:false, empty:false, duplicates:false, numbers:false, dates:false }).rows).toEqual(rows);
  });
  it.each(['xlsx', 'xls'] as const)('reads %s workbooks, multiple sheets and native Excel dates locally', async (bookType) => {
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['ชื่อ', 'วันที่'], ['มาลี', new Date(2026, 10, 27)]]), 'ลูกค้า');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['ยอดเงิน'], [1250]]), 'ยอดขาย');
    const bytes: ArrayBuffer = XLSX.write(workbook, { type: 'array', bookType: bookType === 'xls' ? 'biff8' : 'xlsx' });
    const file = { name: `data.${bookType}`, arrayBuffer: async () => bytes } as File;
    const parsed = await readFile(file);
    expect(parsed.sheets.map(sheet => sheet.name)).toEqual(['ลูกค้า', 'ยอดขาย']);
    expect(parsed.sheets[0]?.rows[1]).toEqual(['มาลี', '27/11/2026']);
    expect(cleanRows(parsed.sheets[0]?.rows ?? [], { ...defaultOptions, dates: true }).rows[1]).toEqual(['มาลี', '2026-11-27']);
    expect(parsed.sheets[1]?.rows[1]).toEqual([1250]);
  });
});
