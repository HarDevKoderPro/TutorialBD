// Imagen PNG con la tabla de notas del grupo y el comentario que justifica cada definitiva.
// Se dibuja en un canvas con los colores del tema (para compartirla por WhatsApp).

export interface ImageStudent {
  fullName: string;
  grades: Record<string, number | null>;
  definitive: number | null;
  attendance: number | null;
  comment: string;
}

const COLORS = {
  bg: '#04070d',
  card: '#011627',
  line: '#1d3b53',
  text: '#d6deeb',
  text2: '#b6c3d8',
  text3: '#5f7e97',
  mint: '#9af5ce',
  teal: '#7fdbca',
  green: '#addb67',
  amber: '#ecc48d',
  coral: '#ff8b85',
};

const FONT = '"Open Sans Variable", "Open Sans", "Segoe UI", sans-serif';
const fmt = (value: number | null) => (value === null ? '—' : value.toFixed(1).replace('.', ','));
const gradeColor = (value: number | null) => (value === null ? COLORS.text3 : value >= 4 ? COLORS.mint : value >= 3 ? COLORS.amber : COLORS.coral);

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function renderGradesImage(input: { groupName: string; date: string; taskIds: string[]; students: ImageStudent[] }): Promise<Blob> {
  await document.fonts.ready;
  const scale = 2;
  const padding = 40;
  const nameWidth = 300;
  const gradeWidth = 92;
  const defWidth = 120;
  const attWidth = 110;
  const commentWidth = 560;
  const width = padding * 2 + nameWidth + gradeWidth * input.taskIds.length + defWidth + attWidth + commentWidth;

  // Primero se mide cada fila (el comentario puede ocupar varias líneas)
  const measure = document.createElement('canvas').getContext('2d')!;
  measure.font = `16px ${FONT}`;
  const commentLines = input.students.map((student) => wrap(measure, student.comment, commentWidth - 24));
  const rowHeights = commentLines.map((lines) => Math.max(56, 20 + lines.length * 22));
  const headerHeight = 150;
  const tableHeader = 48;
  const footer = 70;
  const height = headerHeight + tableHeader + rowHeights.reduce((a, b) => a + b, 0) + footer;

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.textBaseline = 'middle';

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, width, height);

  // Encabezado
  ctx.fillStyle = COLORS.teal;
  ctx.font = `600 15px ${FONT}`;
  ctx.fillText('SQL DESDE CERO · NOTAS', padding, 46);
  ctx.fillStyle = COLORS.mint;
  ctx.font = `700 34px ${FONT}`;
  ctx.fillText(input.groupName, padding, 86);
  ctx.fillStyle = COLORS.text2;
  ctx.font = `16px ${FONT}`;
  ctx.fillText(`Corte al ${input.date} · Definitiva = promedio de las tareas calificadas · 3,0 aprueba`, padding, 122);

  // Columnas
  const columns: { label: string; x: number; w: number }[] = [];
  let x = padding;
  columns.push({ label: 'Estudiante', x, w: nameWidth });
  x += nameWidth;
  for (const id of input.taskIds) {
    columns.push({ label: id, x, w: gradeWidth });
    x += gradeWidth;
  }
  columns.push({ label: 'Definitiva', x, w: defWidth });
  x += defWidth;
  columns.push({ label: 'Asistencia', x, w: attWidth });
  x += attWidth;
  columns.push({ label: 'Comentario', x, w: commentWidth });

  let y = headerHeight;
  ctx.fillStyle = COLORS.card;
  ctx.fillRect(padding, y, width - padding * 2, tableHeader);
  ctx.font = `600 15px ${FONT}`;
  for (const column of columns) {
    ctx.fillStyle = column.label === 'Definitiva' ? COLORS.mint : COLORS.text2;
    const centered = column.w <= defWidth;
    ctx.textAlign = centered ? 'center' : 'left';
    ctx.fillText(column.label, centered ? column.x + column.w / 2 : column.x + 14, y + tableHeader / 2);
  }
  y += tableHeader;

  input.students.forEach((student, index) => {
    const rowHeight = rowHeights[index]!;
    if (index % 2 === 1) {
      ctx.fillStyle = 'rgba(1, 22, 39, 0.55)';
      ctx.fillRect(padding, y, width - padding * 2, rowHeight);
    }
    ctx.strokeStyle = COLORS.line;
    ctx.beginPath();
    ctx.moveTo(padding, y + rowHeight);
    ctx.lineTo(width - padding, y + rowHeight);
    ctx.stroke();

    const middle = y + rowHeight / 2;
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.text;
    ctx.font = `600 17px ${FONT}`;
    ctx.fillText(student.fullName, columns[0]!.x + 14, middle, nameWidth - 20);

    ctx.textAlign = 'center';
    ctx.font = `600 18px ${FONT}`;
    input.taskIds.forEach((id, i) => {
      const value = student.grades[id] ?? null;
      ctx.fillStyle = gradeColor(value);
      ctx.fillText(fmt(value), columns[i + 1]!.x + gradeWidth / 2, middle);
    });

    const def = columns[input.taskIds.length + 1]!;
    ctx.font = `700 22px ${FONT}`;
    ctx.fillStyle = gradeColor(student.definitive);
    ctx.fillText(fmt(student.definitive), def.x + def.w / 2, middle);

    const att = columns[input.taskIds.length + 2]!;
    ctx.font = `17px ${FONT}`;
    ctx.fillStyle = COLORS.text2;
    ctx.fillText(student.attendance === null ? '—' : `${student.attendance} %`, att.x + att.w / 2, middle);

    const comment = columns[input.taskIds.length + 3]!;
    ctx.textAlign = 'left';
    ctx.font = `16px ${FONT}`;
    ctx.fillStyle = COLORS.text2;
    const lines = commentLines[index]!;
    const top = middle - ((lines.length - 1) * 22) / 2;
    lines.forEach((line, i) => ctx.fillText(line, comment.x + 14, top + i * 22));

    y += rowHeight;
  });

  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.text3;
  ctx.font = `14px ${FONT}`;
  ctx.fillText('Notas de 0,0 a 5,0. Cada tarea cuenta su mejor entrega; las respuestas abiertas las califica el docente con rúbrica.', padding, y + 40);

  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No se pudo generar la imagen'))), 'image/png'));
}

// Comparte la imagen por WhatsApp: en celulares (y Chrome/Edge de escritorio) abre el menú de compartir;
// si no se puede, descarga la imagen y abre WhatsApp Web con el mensaje para adjuntarla.
export async function shareOnWhatsApp(blob: Blob, fileName: string, text: string): Promise<'shared' | 'fallback'> {
  const file = new File([blob], fileName, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return 'shared';
    } catch (error) {
      if ((error as Error).name === 'AbortError') return 'shared';
    }
  }
  downloadBlob(blob, fileName);
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  return 'fallback';
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
