import Papa from 'papaparse';

export type Cell = string | number | boolean;
export type Row = Cell[];
export type CleanOptions = { trim: boolean; spaces: boolean; empty: boolean; duplicates: boolean; numbers: boolean; dates: boolean };
export const defaultOptions: CleanOptions = { trim: true, spaces: true, empty: true, duplicates: true, numbers: true, dates: false };
export type SheetData = { name: string; rows: Row[] };
export type ParsedFile = { sheets: SheetData[]; encoding: string; delimiter: string };

export function decodeCSV(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  if (bytes[0] === 255 && bytes[1] === 254) return { text: new TextDecoder('utf-16le').decode(bytes), encoding: 'UTF-16 LE' };
  if (bytes[0] === 254 && bytes[1] === 255) return { text: new TextDecoder('utf-16be').decode(bytes), encoding: 'UTF-16 BE' };
  try { return { text: new TextDecoder('utf-8', { fatal: true }).decode(bytes), encoding: 'UTF-8' }; }
  catch { return { text: new TextDecoder('windows-874').decode(bytes), encoding: 'Windows-874 (ไทย)' }; }
}

export function parseCSV(buffer: ArrayBuffer): ParsedFile {
  const { text, encoding } = decodeCSV(buffer);
  const source = text.replace(/^\uFEFF/, '');
  const detected = Papa.parse<string[]>(source, { skipEmptyLines: true, preview: 20 });
  const result = Papa.parse<string[]>(source, { skipEmptyLines: false, delimiter: detected.meta.delimiter || ',' });
  const fatal = result.errors.find(e => e.type === 'Quotes');
  if (fatal) throw new Error('เครื่องหมายคำพูดใน CSV ไม่สมบูรณ์ กรุณาตรวจสอบไฟล์ต้นฉบับ');
  const rows = result.data;
  // A terminal line break is not an extra data record.
  if (/[\r\n]$/.test(text) && rows.at(-1)?.every(v => v === '')) rows.pop();
  return { sheets: [{ name: 'Sheet 1', rows }], encoding, delimiter: result.meta.delimiter === '\t' ? 'Tab' : result.meta.delimiter || ',' };
}

export async function readFile(file: File): Promise<ParsedFile> {
  const buffer = await file.arrayBuffer();
  if (/\.csv$/i.test(file.name)) return parseCSV(buffer);
  if (!/\.xlsx?$/i.test(file.name)) throw new Error('กรุณาเลือกไฟล์ .csv, .xlsx หรือ .xls');
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheets = workbook.SheetNames.map(name => ({
    name,
    rows: XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[name] ?? {}, { header: 1, defval: '', raw: true, blankrows: true }).map(row => row.map((value): Cell => {
      if (value instanceof Date && Number.isFinite(value.getTime())) {
        return `${String(value.getDate()).padStart(2, '0')}/${String(value.getMonth() + 1).padStart(2, '0')}/${value.getFullYear()}`;
      }
      return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? value : '';
    })),
  }));
  if (!sheets.length) throw new Error('ไม่พบตารางในไฟล์นี้');
  return { sheets, encoding: 'Excel', delimiter: '—' };
}

export function normalizeNumber(value: string): Cell {
  const cleaned = value.trim().replace(/^(?:฿|\$|€|£|THB\s*|USD\s*)\s*/i, '').replace(/\s*(?:บาท|THB|USD)$/i, '').replace(/[,\s]/g, '');
  if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(cleaned) || /^[+-]?0\d/.test(cleaned)) return value;
  // Keep long identifiers intact rather than losing precision in JavaScript/Excel.
  if (cleaned.replace(/\D/g, '').length > 15) return value;
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : value;
}

export function normalizeDate(value: string): string {
  const match = value.trim().match(/^(?:(\d{4})[-/](\d{1,2})[-/](\d{1,2})|(\d{1,2})[-/.](\d{1,2})[-/.](\d{4}))$/);
  if (!match) return value;
  let year = Number(match[1] ?? match[6]);
  const month = Number(match[2] ?? match[5]);
  const day = Number(match[3] ?? match[4]);
  if (year >= 2400) year -= 543;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return value;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function cleanRows(rows: Row[], options: CleanOptions) {
  const seen = new Set<string>();
  let removed = 0;
  let changed = 0;
  const output: Row[] = [];
  const changedCells = new Set<string>();
  rows.forEach((row, index) => {
    let cellChanges = 0;
    const changedColumns: number[] = [];
    const next = row.map((cell, column) => {
      let value = cell;
      if (typeof value === 'string') {
        if (options.trim) value = value.trim();
        if (options.spaces) value = value.replace(/[\t \u00a0]{2,}/g, ' ');
        if (index > 0 && options.dates) value = normalizeDate(value);
        if (index > 0 && options.numbers && typeof value === 'string') value = normalizeNumber(value);
      }
      if (value !== cell) { cellChanges++; changedColumns.push(column); }
      return value;
    });
    if (index > 0) {
      const empty = next.every(v => String(v).trim() === '');
      const key = JSON.stringify(next);
      if ((options.empty && empty) || (options.duplicates && seen.has(key))) { removed++; return; }
      seen.add(key);
    }
    changed += cellChanges;
    changedColumns.forEach(column => changedCells.add(`${output.length}:${column}`));
    output.push(next);
  });
  return { rows: output, removed, changed, changedCells };
}

export function makeCSV(rows: Row[]): string {
  const safe = rows.map(row => row.map(cell => typeof cell === 'string' && /^[=+@-]/.test(cell) ? `'${cell}` : cell));
  return '\uFEFF' + Papa.unparse(safe, { newline: '\r\n' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
