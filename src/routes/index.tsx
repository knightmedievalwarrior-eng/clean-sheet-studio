import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowRight, ArrowUpFromLine, Check, CheckCheck, CircleCheck, Columns3, Copy, FileSpreadsheet, FileText, Hash, Info, LoaderCircle, LockKeyhole, Rows3, ShieldCheck, Sparkles, Table2, TextCursorInput, Trash2, Upload, WandSparkles, X, CalendarDays, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cleanRows, defaultOptions, downloadBlob, makeCSV, readFile, type CleanOptions, type ParsedFile, type Row } from '@/lib/sheet-cleaner';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'SheetCare — แก้ไฟล์ CSV และ Excel ให้เป็นระเบียบ' },
    { name: 'description', content: 'แก้ภาษาไทยเพี้ยน ล้างช่องว่าง ลบแถวซ้ำ และจัดรูปแบบตาราง CSV / Excel ในเบราว์เซอร์ ข้อมูลอยู่ในเครื่องของคุณ 100%' },
    { property: 'og:title', content: 'SheetCare — ตารางสะอาด ข้อมูลปลอดภัย' },
    { property: 'og:description', content: 'จัดระเบียบไฟล์ CSV และ Excel ได้ในไม่กี่คลิก โดยไม่ส่งข้อมูลออกจากเครื่อง' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Index,
});

const sampleRows: Row[] = [
  ['ชื่อ–นามสกุล', 'อีเมล', 'ยอดสั่งซื้อ', 'วันที่'],
  ['  สมชาย   ใจดี ', 'somchai@email.com', '฿1,250.00', '15/01/2569'],
  ['วิภา รักเรียน', 'wipa@email.com', '฿ 2,500', '16/01/2569'],
  ['', '', '', ''],
  ['  สมชาย   ใจดี ', 'somchai@email.com', '฿1,250.00', '15/01/2569'],
  ['มานะ  อดทน ', 'mana@email.com', '850 บาท', '17/01/2569'],
];
const optionsList = [
  { key: 'trim', title: 'ล้างช่องว่างหน้า–หลัง', detail: 'ตัดช่องว่างที่ไม่จำเป็นรอบข้อความ', icon: TextCursorInput },
  { key: 'spaces', title: 'ลดช่องว่างซ้ำ', detail: 'เปลี่ยนช่องว่างหลายช่องให้เหลือช่องเดียว', icon: Columns3 },
  { key: 'empty', title: 'ลบแถวว่างทั้งหมด', detail: 'ลบแถวที่ไม่มีข้อมูลในทุกคอลัมน์', icon: Rows3 },
  { key: 'duplicates', title: 'ลบแถวซ้ำ', detail: 'เก็บข้อมูลที่ซ้ำกันไว้เพียงแถวเดียว', icon: Copy },
  { key: 'numbers', title: 'แปลงข้อความเป็นตัวเลข', detail: 'เช่น ฿1,250.00 → 1250 พร้อมคำนวณ', icon: Hash },
  { key: 'dates', title: 'จัดรูปแบบวันที่ให้ตรงกัน', detail: 'วัน/เดือน/ปี และ พ.ศ. → YYYY-MM-DD', icon: CalendarDays },
] as const;

function Index() {
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [filename, setFilename] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [options, setOptions] = useState<CleanOptions>({ ...defaultOptions });
  const [applied, setApplied] = useState<CleanOptions | null>(null);
  const [tab, setTab] = useState<'before' | 'after'>('before');
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [downloaded, setDownloaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rows = parsed?.sheets[sheetIndex]?.rows ?? sampleRows;
  const result = useMemo(() => applied ? cleanRows(rows, applied) : null, [rows, applied]);
  const displayedRows = tab === 'after' && result ? result.rows : rows;
  const headers = displayedRows[0] ?? [];
  const columnCount = displayedRows.reduce((count, row) => Math.max(count, row.length), headers.length);
  const hasData = Boolean(parsed);
  const isExample = !parsed || filename === 'ตัวอย่างข้อมูล.csv';
  const settingsChanged = applied && JSON.stringify(options) !== JSON.stringify(applied);

  async function handleFile(file: File) {
    setBusy(true); setError(''); setDownloaded(false);
    try {
      await new Promise(resolve => setTimeout(resolve, 30));
      const data = await readFile(file);
      if (!data.sheets.some(s => s.rows.length && s.rows.some(r => r.some(v => String(v).trim())))) throw new Error('ไฟล์นี้ไม่มีข้อมูล กรุณาเลือกไฟล์ที่มีตาราง');
      setParsed(data); setFilename(file.name); setFileSize(file.size); setSheetIndex(0); setApplied(null); setTab('before');
    } catch (e) { setError(e instanceof Error ? e.message : 'อ่านไฟล์ไม่สำเร็จ กรุณาตรวจสอบว่าไฟล์ไม่เสียหายหรือมีรหัสผ่าน'); }
    finally { setBusy(false); if (inputRef.current) inputRef.current.value = ''; }
  }
  function loadExample() {
    setParsed({ sheets: [{ name: 'ข้อมูลลูกค้า', rows: sampleRows.map(r => [...r]) }], encoding: 'UTF-8', delimiter: ',' });
    setFilename('ตัวอย่างข้อมูล.csv'); setFileSize(412); setSheetIndex(0); setApplied(null); setTab('before'); setError(''); setDownloaded(false);
  }
  function clearFile() { setParsed(null); setFilename(''); setApplied(null); setTab('before'); setError(''); setDownloaded(false); }
  async function clean() {
    if (!hasData || busy) return;
    setBusy(true); setError('');
    await new Promise(resolve => setTimeout(resolve, 30));
    setApplied({ ...options }); setTab('after'); setBusy(false); setDownloaded(false);
  }
  async function download() {
    if (!result || !hasData) return;
    setDownloading(true); setError('');
    try {
      const base = filename.replace(/\.[^.]+$/, '') + '_clean';
      if (format === 'csv') downloadBlob(new Blob([makeCSV(result.rows)], { type: 'text/csv;charset=utf-8' }), `${base}.csv`);
      else {
        const XLSX = await import('xlsx');
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(result.rows), parsed?.sheets[sheetIndex]?.name.slice(0, 31) || 'Cleaned');
        const output = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
        downloadBlob(new Blob([output], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${base}.xlsx`);
      }
      setDownloaded(true);
    } catch { setError('ดาวน์โหลดไม่สำเร็จ กรุณาลองอีกครั้ง'); }
    finally { setDownloading(false); }
  }

  return (
    <>
      <header className="topbar"><div className="topbar-inner">
        <div className="brand"><span className="brand-symbol"><Table2 size={22} strokeWidth={1.8} /></span><span>SheetCare<span className="brand-dot">.</span></span><span className="brand-caption">จัดระเบียบข้อมูล ให้เป็นเรื่องง่าย</span></div>
        <div className="top-status"><span className="status-dot" />ไม่ต้องสมัครสมาชิก</div>
      </div></header>
      <main className="workspace">
        <section className="intro">
          <div className="intro-tag"><Sparkles size={13} /> CLEAN DATA. CLEAR MIND.</div>
          <h1>ไฟล์ตารางเบี้ยว <span>จัดให้เข้าที่</span></h1>
          <p>แก้ไฟล์ CSV และ Excel ให้สะอาด พร้อมใช้งานในไม่กี่คลิก<br className="hidden sm:block" /> ไม่ต้องลงโปรแกรม ไม่ต้องเก่ง Excel</p>
        </section>
        <div className="privacy-banner"><ShieldCheck size={18} /><strong>ข้อมูลประมวลผลในเครื่องของคุณ 100% ข้อมูลไม่หลุดออกไปภายนอก</strong><LockKeyhole className="hidden sm:block" size={13} /></div>
        <nav className="steps" aria-label="ขั้นตอนการแก้ไข">
          <div className={`step ${!hasData ? 'active' : ''}`}><span className="step-number">{hasData ? <Check size={13} /> : '1'}</span>อัปโหลดไฟล์</div><span className="step-line" />
          <div className={`step ${hasData && !result ? 'active' : ''}`}><span className="step-number">{result ? <Check size={13} /> : '2'}</span>เลือกสิ่งที่ต้องการแก้</div><span className="step-line" />
          <div className={`step ${result ? 'active' : ''}`}><span className="step-number">3</span>ดาวน์โหลดไฟล์</div>
        </nav>
        {error && <div role="alert" className="error-banner"><Info size={16} /><span>{error}</span><Button variant="ghost" size="icon" aria-label="ปิดข้อความ" onClick={() => setError('')}><X /></Button></div>}
        <div className="editor-grid">
          <section className="panel">
            <div className="panel-title"><h2><Upload />อัปโหลดไฟล์ของคุณ</h2><span className="section-index">ขั้นตอนที่ 01</span></div>
            <div className="upload-content">
              <div className={`drop-zone ${dragging ? 'dragging' : ''}`} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files[0]; if (file && !busy) void handleFile(file); }}>
                <div className="file-art"><FileSpreadsheet /><span className="file-art-badge">{hasData ? <CheckCheck /> : <ArrowUpFromLine />}</span></div>
                <h3 className="file-name">{busy ? 'กำลังจัดการไฟล์…' : hasData ? filename : 'ลากไฟล์มาวางตรงนี้'}</h3>
                <p>{hasData ? `${(fileSize / 1024).toFixed(1)} KB · ${Math.max(0, rows.length - 1).toLocaleString()} แถว · ${columnCount} คอลัมน์` : 'หรือเลือกไฟล์จากเครื่องของคุณ'}</p>
                <div className="flex items-center gap-2"><Button variant={hasData ? 'outline' : 'default'} disabled={busy} onClick={() => inputRef.current?.click()}><Upload size={15} />{hasData ? 'เปลี่ยนไฟล์' : 'เลือกไฟล์'}</Button>{hasData && <Button variant="ghost" size="icon" aria-label="นำไฟล์ออก" onClick={clearFile} disabled={busy}><Trash2 /></Button>}</div>
                <p className="file-support">รองรับ .csv, .xlsx และ .xls</p>
                <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="sr-only" aria-label="อัปโหลดไฟล์ตาราง" onChange={e => { const file = e.target.files?.[0]; if (file) void handleFile(file); }} />
              </div>
              <div className="local-note"><ShieldCheck />ไฟล์ของคุณจะไม่ถูกอัปโหลดหรือจัดเก็บบนเซิร์ฟเวอร์</div>
              <div className="demo-line">ยังไม่มีไฟล์? <Button variant="link" onClick={loadExample} disabled={busy}>ลองใช้ข้อมูลตัวอย่าง <ArrowRight size={12} /></Button></div>
            </div>
          </section>
          <section className="panel clean-panel">
            <div className="panel-title"><h2><WandSparkles />เลือกสิ่งที่ต้องการแก้</h2><span className="section-index">ขั้นตอนที่ 02</span></div>
            <div className="clean-options">{optionsList.map(({ key, title, detail, icon: Icon }) => <label key={key} className="option-row" htmlFor={`option-${key}`}><span className="option-icon"><Icon /></span><span className="option-label"><strong>{title}</strong><small>{detail}</small></span><Checkbox id={`option-${key}`} checked={options[key]} disabled={busy} onCheckedChange={checked => setOptions(previous => ({ ...previous, [key]: checked === true }))} /></label>)}</div>
            <div className="clean-action"><Button onClick={clean} disabled={!hasData || busy}>{busy ? <LoaderCircle className="animate-spin" /> : <Sparkles />} {settingsChanged ? 'ใช้ตัวเลือกใหม่อีกครั้ง' : 'จัดระเบียบข้อมูล'}<ArrowRight size={15} /></Button></div>
          </section>
        </div>
        <section className="preview-section">
          <div className="preview-header"><h2><Table2 />{!hasData ? 'ตัวอย่างการจัดระเบียบข้อมูล' : 'ตัวอย่างข้อมูล'}</h2><div className="preview-tabs" role="tablist" aria-label="เปรียบเทียบข้อมูล"><Button role="tab" aria-selected={tab === 'before'} variant="ghost" className={tab === 'before' ? 'selected' : ''} onClick={() => setTab('before')}>ก่อนแก้ไข</Button><Button role="tab" aria-selected={tab === 'after'} variant="ghost" className={tab === 'after' ? 'selected' : ''} disabled={!result} onClick={() => setTab('after')}>หลังแก้ไข{result && <span className="tab-count"><Check size={10} /></span>}</Button></div></div>
          <div className="preview-meta"><span className="filename">{isExample ? 'ข้อมูลตัวอย่าง' : filename}</span><span><Rows3 size={12} />{Math.max(0, displayedRows.length - 1).toLocaleString()} แถว</span><span><Columns3 size={12} />{columnCount} คอลัมน์</span>{parsed && parsed.sheets.length > 1 && <select aria-label="เลือกชีต" value={sheetIndex} onChange={e => { setSheetIndex(Number(e.target.value)); setApplied(null); setTab('before'); setDownloaded(false); }}>{parsed.sheets.map((sheet, i) => <option value={i} key={i}>{sheet.name}</option>)}</select>}<span className="meta-right">{parsed?.encoding ?? 'UTF-8'}{parsed?.encoding !== 'Excel' && ` · ตัวคั่น ${parsed?.delimiter ?? ','}`}</span></div>
          <div className="table-scroll" role="tabpanel" aria-label={tab === 'before' ? 'ตารางก่อนแก้ไข' : 'ตารางหลังแก้ไข'}><table className="data-table"><thead><tr><th className="row-num">#</th>{Array.from({ length: columnCount }, (_, column) => <th key={column}>{String(headers[column] ?? '').trim() || `คอลัมน์ ${column + 1}`}</th>)}</tr></thead><tbody>{displayedRows.slice(1, 51).map((row, i) => <tr key={i} className={row.every(cell => String(cell).trim() === '') ? 'blank-row' : ''}><td className="row-num">{i + 1}</td>{Array.from({ length: columnCount }, (_, column) => { const cell = row[column] ?? ''; const key = `${i + 1}:${column}`; const dirty = tab === 'before' && (typeof cell === 'string' && (cell !== cell.trim() || / {2,}|฿|บาท/.test(cell))); const changed = tab === 'after' && result?.changedCells.has(key); return <td key={column} className={changed ? 'changed' : dirty ? 'dirty' : ''} title={String(cell)}>{String(cell) || <span aria-label="ช่องว่าง">—</span>}</td>; })}</tr>)}</tbody></table></div>
          {result && <div className="result-line" role="status"><CircleCheck size={15} /><strong>จัดระเบียบเรียบร้อย</strong><span>แก้ไข {result.changed.toLocaleString()} เซลล์</span><span>ลบ {result.removed.toLocaleString()} แถว</span>{settingsChanged && <span>· มีตัวเลือกใหม่ที่ยังไม่ได้ใช้</span>}</div>}
          <div className="preview-footer"><span>{hasData ? `แสดง ${Math.min(50, Math.max(0, displayedRows.length - 1))} จาก ${Math.max(0, displayedRows.length - 1).toLocaleString()} แถว · แถวแรกเป็นหัวตาราง` : 'ข้อมูลสมมติสำหรับแสดงตัวอย่าง · ลองใช้ได้โดยไม่ต้องมีไฟล์'}</span><span className="preview-legend"><i className={`legend-square ${tab === 'after' ? 'success' : ''}`} />{tab === 'after' ? 'ข้อมูลที่แก้ไขแล้ว' : 'ข้อมูลที่ควรจัดระเบียบ'}</span></div>
        </section>
        <div className="download-bar"><span className="download-caption">{downloaded ? <><CircleCheck size={15} />ดาวน์โหลดไฟล์เรียบร้อยแล้ว</> : <><Info size={14} />{result ? 'ส่งออกชีตที่เลือกเป็นข้อมูลตาราง ไม่รวมรูปแบบและสูตรเดิม' : 'ไฟล์ต้นฉบับไม่เปลี่ยนแปลง คุณจะได้ไฟล์ใหม่เสมอ'}</>}</span><div className="download-controls"><select className="format-select" aria-label="รูปแบบดาวน์โหลด" value={format} onChange={e => setFormat(e.target.value === 'csv' ? 'csv' : 'xlsx')}><option value="xlsx">Excel (.xlsx)</option><option value="csv">CSV (.csv)</option></select><Button onClick={download} disabled={!result || downloading || Boolean(settingsChanged)}>{downloading ? <LoaderCircle className="animate-spin" /> : <ArrowDownToLine />}ดาวน์โหลดไฟล์ที่แก้ไขแล้ว</Button></div></div>
        <section className="trust-strip" aria-label="ความเป็นส่วนตัวและการใช้งาน"><div className="trust-item"><span className="trust-icon"><ShieldCheck /></span><div><strong>ข้อมูลอยู่กับคุณเท่านั้น</strong><p>ประมวลผลบนเบราว์เซอร์ ไม่ผ่านเซิร์ฟเวอร์</p></div></div><div className="trust-item"><span className="trust-icon"><FileText /></span><div><strong>ภาษาไทยไม่เพี้ยน</strong><p>ตรวจจับรหัสภาษา และส่งออก CSV พร้อม BOM</p></div></div><div className="trust-item"><span className="trust-icon"><Zap /></span><div><strong>เปิดใช้ได้เลย ไม่ต้องติดตั้ง</strong><p>ไม่ต้องสมัคร ใช้ได้ทั้งคอมพิวเตอร์และมือถือ</p></div></div></section>
        <footer className="site-footer"><span>SheetCare. <span className="font-normal">ตารางสะอาด ข้อมูลปลอดภัย</span></span><span className="flex items-center gap-1.5"><LockKeyhole size={11} /> ทำงานในเครื่องของคุณ ด้วยความเป็นส่วนตัว</span></footer>
      </main>
    </>
  );
}
