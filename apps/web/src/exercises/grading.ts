// Calificación inmediata de respuestas cortas: sin importar mayúsculas, tildes ni espacios extra

export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[`'"«»“”.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Para listas ("documento, nombre y grupo"): mismos elementos, en cualquier orden
function toSet(text: string): string[] {
  return normalize(text)
    .split(/\s*(?:,|;|\by\b|\s)\s*/)
    .filter(Boolean)
    .sort();
}

export function isAccepted(answer: string, accepted: string[], list = false): boolean {
  if (!answer.trim()) return false;
  if (list) {
    const given = toSet(answer).join('|');
    return accepted.some((option) => toSet(option).join('|') === given);
  }
  const given = normalize(answer);
  return accepted.some((option) => normalize(option) === given);
}

export const MAX_ATTEMPTS_BEFORE_SOLUTION = 3;
