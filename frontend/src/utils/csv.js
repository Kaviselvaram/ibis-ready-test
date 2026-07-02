// Minimal CSV parser/serializer for the bulk student importer.
// Handles quoted fields, escaped quotes ("") and CRLF/LF line endings.

export function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(cur); cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

const FIELDS = ["full_name", "email", "phone", "grade", "batch_code"];
const HEADER_ALIASES = {
  full_name: ["full_name", "name", "fullname", "student", "student_name"],
  email: ["email", "e-mail", "mail"],
  phone: ["phone", "mobile", "contact", "phone_number"],
  grade: ["grade", "class", "std", "standard"],
  batch_code: ["batch_code", "batch", "code", "batchcode"]
};

// Parse CSV text into {rows, errors}. Recognises an optional header row and maps
// columns by name; falls back to positional order (full_name,email,phone,grade,batch_code).
export function parseStudentsCsv(text) {
  const lines = String(text || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { rows: [], errors: [] };

  const first = parseCsvLine(lines[0]).map((c) => c.toLowerCase());
  const looksLikeHeader = first.some((c) => Object.values(HEADER_ALIASES).some((al) => al.includes(c)));

  let colMap = FIELDS.map((f, i) => i); // positional default
  let dataStart = 0;
  if (looksLikeHeader) {
    dataStart = 1;
    colMap = FIELDS.map((f) => {
      const aliases = HEADER_ALIASES[f];
      return first.findIndex((c) => aliases.includes(c));
    });
  }

  const rows = [];
  const errors = [];
  for (let i = dataStart; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const get = (idx) => (idx >= 0 && idx < cells.length ? cells[idx] : "");
    const row = {
      full_name: get(colMap[0]),
      email: get(colMap[1]),
      phone: get(colMap[2]),
      grade: get(colMap[3]),
      batch_code: get(colMap[4])
    };
    if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      errors.push({ line: i + 1, reason: `Invalid or missing email: "${row.email}"` });
      continue;
    }
    rows.push(row);
  }
  return { rows, errors };
}

export function toCsv(headers, records) {
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = headers.map(esc).join(",");
  const body = records.map((r) => headers.map((h) => esc(r[h])).join(",")).join("\n");
  return `${head}\n${body}`;
}

export function downloadCsv(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
