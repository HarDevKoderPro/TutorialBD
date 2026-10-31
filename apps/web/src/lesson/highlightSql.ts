// Resaltado de SQL según identidad-visual.md: palabras clave violeta, tipos ámbar,
// restricciones verde, strings rosa, números cian y comentarios en gris.

export type TokenKind = 'keyword' | 'type' | 'constraint' | 'string' | 'number' | 'comment' | 'plain';

export interface Token {
  kind: TokenKind;
  text: string;
}

const KEYWORDS = new Set(
  'SELECT FROM WHERE INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE DATABASE DROP ALTER ADD COLUMN MODIFY USE SHOW DESCRIBE AND OR NOT IN IS LIKE BETWEEN ORDER BY GROUP HAVING LIMIT OFFSET AS JOIN INNER LEFT RIGHT ON DISTINCT VIEW START TRANSACTION COMMIT ROLLBACK ASC DESC CONSTRAINT REFERENCES CHECK RENAME TO IF EXISTS'.split(
    ' ',
  ),
);
const TYPES = new Set('INT INTEGER DECIMAL VARCHAR CHAR TEXT DATE DATETIME BOOLEAN ENUM FLOAT'.split(' '));
const CONSTRAINTS = new Set('PRIMARY FOREIGN KEY UNIQUE NULL AUTO_INCREMENT DEFAULT CASCADE RESTRICT'.split(' '));
const LITERALS = new Set(['TRUE', 'FALSE']);

const TOKEN_PATTERN = /(--[^\n]*)|('(?:[^'\\]|\\.|'')*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|(\s+|[^\sA-Za-z0-9_'-]+|-)/g;

export function highlightSql(source: string): Token[] {
  const tokens: Token[] = [];
  for (const match of source.matchAll(TOKEN_PATTERN)) {
    const [text, comment, string, number, word] = match;
    if (comment) tokens.push({ kind: 'comment', text });
    else if (string) tokens.push({ kind: 'string', text });
    else if (number) tokens.push({ kind: 'number', text });
    else if (word) {
      const upper = word.toUpperCase();
      if (KEYWORDS.has(upper)) tokens.push({ kind: 'keyword', text });
      else if (TYPES.has(upper)) tokens.push({ kind: 'type', text });
      else if (CONSTRAINTS.has(upper)) tokens.push({ kind: 'constraint', text });
      else if (LITERALS.has(upper)) tokens.push({ kind: 'number', text });
      else tokens.push({ kind: 'plain', text });
    } else tokens.push({ kind: 'plain', text });
  }
  return tokens;
}
