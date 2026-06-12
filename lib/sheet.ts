interface CacheEntry {
  data: string;
  fetchedAt: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 60 minutes

let cache: CacheEntry | null = null;

export async function getFaqData(): Promise<string> {
  const now = Date.now();

  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }

  const url = process.env.SHEET_CSV_URL;
  if (!url) {
    throw new Error("SHEET_CSV_URL is not set");
  }

  let csvText: string;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    csvText = await res.text();
  } catch (err) {
    if (cache) {
      console.error("[sheet] fetch failed, using stale cache:", err);
      return cache.data;
    }
    // No cache at all — return empty string so caller falls back to DEFAULT_REPLY
    console.error("[sheet] fetch failed, no cache available:", err);
    return "";
  }

  const formatted = parseCsvToText(csvText);
  cache = { data: formatted, fetchedAt: now };
  return formatted;
}

function parseCsvToText(csv: string): string {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return "";

  const header = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const qIdx = header.indexOf("question");
  const aIdx = header.indexOf("answer");

  if (qIdx === -1 || aIdx === -1) {
    // fallback: return raw CSV as-is if headers not found
    return csv;
  }

  const rows: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const q = cols[qIdx]?.trim() ?? "";
    const a = cols[aIdx]?.trim() ?? "";
    if (q && a) {
      rows.push(`${q} | ${a}`);
    }
  }

  return rows.join("\n");
}

// minimal CSV line splitter that handles double-quoted fields
function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
