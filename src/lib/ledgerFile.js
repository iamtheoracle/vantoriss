// Ledger file reading — turns an uploaded .xlsx or .csv account history into
// normalised transaction records. Runs entirely in the browser: no backend
// function is required, so operators can import without builder access.

const EXCEL_EPOCH = Date.UTC(1899, 11, 30);
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const unescapeXml = (s) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

function toIsoDate(value) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'number' && isFinite(value)) {
    return new Date(EXCEL_EPOCH + Math.round(value) * 86400000).toISOString().slice(0, 10);
  }
  const s = String(value).trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})$/);
  if (m) {
    const year = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${year}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  }
  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  const s = String(value).trim();
  const negative = /^\(.*\)$/.test(s);
  const n = parseFloat(s.replace(/[^0-9.]/g, ''));
  if (isNaN(n)) return NaN;
  return negative ? -n : n;
}

// ---------- delimiter text ----------
function parseDelimited(text) {
  const firstLine = (text.split(/\r?\n/)[0] || '');
  const counts = [',', ';', '\t'].map((d) => [d, (firstLine.match(new RegExp(`\\${d}`, 'g')) || []).length]);
  const delim = counts.sort((a, b) => b[1] - a[1])[0][0];
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { quoted = false; }
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (ch !== '\r') field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ''));
}

// ---------- xlsx ----------
async function inflateRaw(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function unzip(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('This file is not a readable .xlsx workbook.');
  const total = view.getUint16(eocd + 10, true);
  let p = view.getUint32(eocd + 16, true);
  const decoder = new TextDecoder();
  const entries = {};
  for (let k = 0; k < total; k++) {
    const method = view.getUint16(p + 10, true);
    const size = view.getUint32(p + 20, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const localOffset = view.getUint32(p + 42, true);
    const name = decoder.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    const localNameLen = view.getUint16(localOffset + 26, true);
    const localExtraLen = view.getUint16(localOffset + 28, true);
    const start = localOffset + 30 + localNameLen + localExtraLen;
    const raw = bytes.subarray(start, start + size);
    entries[name] = method === 8 ? await inflateRaw(raw) : raw;
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

const colIndex = (ref) => {
  const letters = (ref.match(/[A-Z]+/) || [''])[0];
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

function sheetToRows(xml, shared) {
  const rows = [];
  for (const rowXml of xml.match(/<row[^>]*>[\s\S]*?<\/row>/g) || []) {
    const cells = [];
    const cellRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let m;
    while ((m = cellRe.exec(rowXml))) {
      const attrs = m[1] || '';
      const body = m[2] || '';
      const ref = (attrs.match(/r="([A-Z]+\d+)"/) || [])[1];
      if (!ref) continue;
      const type = (attrs.match(/t="([^"]+)"/) || [])[1];
      const raw = (body.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
      const inline = body.match(/<is>([\s\S]*?)<\/is>/);
      let value = null;
      if (type === 's' && raw !== undefined) value = shared[Number(raw)] ?? null;
      else if (type === 'inlineStr' && inline) {
        value = unescapeXml((inline[1].match(/<t[^>]*>[\s\S]*?<\/t>/g) || []).map((t) => t.replace(/<[^>]+>/g, '')).join(''));
      } else if (raw !== undefined) value = type === 'str' ? unescapeXml(raw) : Number(raw);
      cells[colIndex(ref)] = value;
    }
    if (cells.length) rows.push(Array.from(cells, (c) => (c === undefined ? null : c)));
  }
  return rows;
}

async function readXlsx(file) {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('This browser cannot open .xlsx files — save the sheet as CSV and upload that instead.');
  }
  const entries = await unzip(await file.arrayBuffer());
  const decoder = new TextDecoder();
  const shared = [];
  if (entries['xl/sharedStrings.xml']) {
    const xml = decoder.decode(entries['xl/sharedStrings.xml']);
    for (const si of xml.match(/<si>[\s\S]*?<\/si>/g) || []) {
      shared.push(unescapeXml((si.match(/<t[^>]*>[\s\S]*?<\/t>/g) || []).map((t) => t.replace(/<[^>]+>/g, '')).join('')));
    }
  }
  const sheetKey = Object.keys(entries)
    .filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k))
    .sort()[0];
  if (!sheetKey) throw new Error('No worksheet found in that workbook.');
  return sheetToRows(decoder.decode(entries[sheetKey]), shared);
}

// ---------- rows → objects ----------
function toObjects(rows) {
  if (!rows.length) return { headers: [], rows: [] };
  const headerIndex = Math.min(
    rows.findIndex((r) => r.some((c) => typeof c === 'string' && /date/i.test(c))),
    rows.length - 1
  );
  const headers = (rows[Math.max(headerIndex, 0)] || []).map((h) => String(h ?? '').trim());
  const body = rows.slice(Math.max(headerIndex, 0) + 1).map((r) => {
    const obj = {};
    headers.forEach((h, i) => { if (h) obj[h] = r[i] ?? null; });
    return obj;
  });
  return { headers: headers.filter(Boolean), rows: body.filter((r) => Object.values(r).some((v) => v !== null && v !== '')) };
}

// Simple delimited (CSV) reader returning header-keyed rows.
export async function readCsvObjects(file) {
  return toObjects(parseDelimited(await file.text()));
}

export async function readLedgerFile(file) {
  const name = (file.name || '').toLowerCase();
  const rows = name.endsWith('.csv') || name.endsWith('.txt')
    ? parseDelimited(await file.text())
    : await readXlsx(file);
  return toObjects(rows);
}

// ---------- normalisation ----------
const COLUMN_PATTERNS = {
  date: [/^(posting|transaction|value|entry|book)\s*date$/i, /date/i],
  type: [/transaction type/i, /^type$/i, /category/i],
  description: [/description/i, /narrative/i, /memo/i, /details/i],
  credit: [/^credit/i, /money in/i],
  debit: [/^debit/i, /money out/i],
  gain: [/gain/i, /valuation/i],
  net: [/net change/i, /^amount/i, /^value$/i],
  opening: [/opening balance/i],
};

function pickKey(headers, patterns, exclude = []) {
  for (const pattern of patterns) {
    const found = headers.find((h) => pattern.test(h) && !exclude.includes(h));
    if (found) return found;
  }
  return null;
}

function mapType(sourceType) {
  const s = String(sourceType || '').toLowerCase();
  if (/fee|charge/.test(s)) return 'fee';
  if (/interest|dividend|income|gain/.test(s)) return 'interest';
  if (/contribution|deposit|credit|funding|inflow/.test(s)) return 'deposit';
  if (/distribution|withdraw|debit|payout|outflow/.test(s)) return 'withdrawal';
  if (/transfer/.test(s)) return 'transfer';
  return 'adjustment';
}

function composeDescription(sourceType, sourceDescription) {
  if (!sourceDescription) return sourceType || 'Imported entry';
  if (!sourceType || sourceDescription.toLowerCase().includes(sourceType.toLowerCase())) return sourceDescription;
  return `${sourceType} — ${sourceDescription}`;
}

export function buildLedger({ headers, rows }) {
  const keys = {
    date: pickKey(headers, COLUMN_PATTERNS.date),
    type: pickKey(headers, COLUMN_PATTERNS.type),
    description: pickKey(headers, COLUMN_PATTERNS.description),
    credit: pickKey(headers, COLUMN_PATTERNS.credit),
    debit: pickKey(headers, COLUMN_PATTERNS.debit),
    gain: pickKey(headers, COLUMN_PATTERNS.gain),
    net: pickKey(headers, COLUMN_PATTERNS.net),
    opening: pickKey(headers, COLUMN_PATTERNS.opening),
  };
  keys.closing = pickKey(headers, [/closing balance/i, /running balance/i, /balance/i], [keys.opening]);

  if (!keys.date || (!keys.net && !keys.credit && !keys.debit && !keys.gain)) {
    return { records: [], issues: ['No date column or amount column could be identified.'], summary: null, columns: keys };
  }

  const records = [];
  const issues = [];
  rows.forEach((row, i) => {
    const date = toIsoDate(row[keys.date]);
    if (!date) { issues.push(`Row ${i + 2}: date could not be read`); return; }
    let amount = null;
    if (keys.net && row[keys.net] !== null && row[keys.net] !== '') amount = toNumber(row[keys.net]);
    else if (keys.credit || keys.debit) amount = toNumber(keys.credit ? row[keys.credit] : 0) - toNumber(keys.debit ? row[keys.debit] : 0);
    else if (keys.gain) amount = toNumber(row[keys.gain]);
    if (amount === null || isNaN(amount)) { issues.push(`Row ${i + 2}: amount could not be read`); return; }
    const closingRaw = keys.closing ? row[keys.closing] : null;
    const balanceAfter = closingRaw === null || closingRaw === '' ? null : toNumber(closingRaw);
    const sourceType = keys.type ? String(row[keys.type] ?? '').trim() : '';
    const sourceDescription = keys.description ? String(row[keys.description] ?? '').trim() : '';
    records.push({
      date,
      type: mapType(sourceType),
      amount: round2(amount),
      description: composeDescription(sourceType, sourceDescription),
      reference: sourceType,
      balanceAfter: balanceAfter === null || isNaN(balanceAfter) ? null : round2(balanceAfter),
      sourceOpening: keys.opening ? toNumber(row[keys.opening]) : null,
    });
  });

  let opening = keys.opening && rows[0] ? round2(toNumber(rows[0][keys.opening])) : null;
  if (opening === null && records[0] && records[0].balanceAfter !== null) {
    opening = round2(records[0].balanceAfter - records[0].amount);
  }
  if (opening === null) opening = 0;

  let breaks = 0;
  let previous = opening;
  records.forEach((r) => {
    if (r.sourceOpening !== null && !isNaN(r.sourceOpening) && Math.abs(r.sourceOpening - previous) > 0.01) breaks++;
    previous = r.balanceAfter !== null ? r.balanceAfter : round2((previous || 0) + r.amount);
  });

  const credits = round2(records.filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0));
  const debits = round2(Math.abs(records.filter((r) => r.amount < 0).reduce((s, r) => s + r.amount, 0)));
  const last = records[records.length - 1];
  const closing = last && last.balanceAfter !== null ? last.balanceAfter : round2(opening + records.reduce((s, r) => s + r.amount, 0));

  return {
    records,
    issues,
    columns: keys,
    summary: {
      count: records.length,
      firstDate: records[0]?.date || null,
      lastDate: last?.date || null,
      opening,
      closing,
      credits,
      debits,
      breaks,
    },
  };
}