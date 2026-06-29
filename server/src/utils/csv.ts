/** Minimal CSV serialiser — no external deps required */

export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  function escape(val: string | number | null | undefined): string {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    lines.push(row.map(escape).join(","));
  }
  return lines.join("\r\n");
}
