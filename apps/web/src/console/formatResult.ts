import type { ExecResult } from './protocol';

// Salida con el mismo formato que el cliente mysql (tablas, "Query OK", "ERROR nnnn (sqlstate): …")

const seconds = (ms: number) => `(${(ms / 1000).toFixed(2)} sec)`;
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

function displayWidth(text: string): number {
  return Array.from(text.normalize('NFC')).length;
}

function pad(text: string, width: number, right: boolean): string {
  const fill = ' '.repeat(Math.max(0, width - displayWidth(text)));
  return right ? fill + text : text + fill;
}

export function formatTable(columns: string[], rows: (string | null)[][], numeric: boolean[]): string[] {
  const cells = rows.map((row) => row.map((value) => (value === null ? 'NULL' : value)));
  const widths = columns.map((column, c) => Math.max(displayWidth(column), ...cells.map((row) => displayWidth(row[c] ?? ''))));
  const border = `+${widths.map((width) => '-'.repeat(width + 2)).join('+')}+`;
  const line = (values: string[], alignRight: (c: number) => boolean) =>
    `| ${values.map((value, c) => pad(value, widths[c]!, alignRight(c))).join(' | ')} |`;

  return [border, line(columns, () => false), border, ...cells.map((row) => line(row, (c) => numeric[c] ?? false)), border];
}

export function formatVertical(columns: string[], rows: (string | null)[][]): string[] {
  const width = Math.max(...columns.map(displayWidth));
  return rows.flatMap((row, r) => [
    `*************************** ${r + 1}. row ***************************`,
    ...columns.map((column, c) => `${pad(column, width, true)}: ${row[c] ?? 'NULL'}`),
  ]);
}

export function formatResult(result: ExecResult, vertical = false): string[] {
  if (result.kind === 'error') {
    return result.code === null ? [`ERROR: ${result.message}`] : [`ERROR ${result.code} (${result.sqlState ?? 'HY000'}): ${result.message}`];
  }

  if (result.kind === 'ok') {
    if (result.message) return [result.message];
    const lines = [`Query OK, ${plural(result.affectedRows, 'row')} affected${result.warnings ? `, ${plural(result.warnings, 'warning')}` : ''} ${seconds(result.ms)}`];
    if (result.info) lines.push(result.info);
    return lines;
  }

  if (result.rows.length === 0) return [`Empty set ${seconds(result.ms)}`];

  const body = vertical ? formatVertical(result.columns, result.rows) : formatTable(result.columns, result.rows, result.numeric);
  const footer = `${plural(result.total, 'row')} in set ${seconds(result.ms)}`;
  return result.total > result.rows.length
    ? [...body, footer, `(mostrando ${result.rows.length} de ${result.total} filas)`]
    : [...body, footer];
}
