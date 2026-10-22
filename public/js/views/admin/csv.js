// Evito que una celda se interprete como fórmula al abrir el archivo en una hoja de cálculo.
function cell(value) {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

// El BOM inicial hace que Excel respete las tildes.
export const toCsv = (headers, rows) =>
  '﻿' + [headers, ...rows].map((row) => row.map(cell).join(',')).join('\r\n');
