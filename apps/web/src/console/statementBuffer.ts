// Acumula líneas como el cliente mysql: una sentencia termina en ";" o "\G" fuera de
// comillas y comentarios. Sabe en qué estado quedó para mostrar el prompt correcto.

export interface Statement {
  sql: string;
  vertical: boolean;
}

type State = 'normal' | "'" | '"' | '`' | 'block-comment';

export class StatementBuffer {
  private text = '';
  private state: State = 'normal';

  get isEmpty(): boolean {
    return this.text.trim() === '';
  }

  // Prompt de continuación según el estado (igual que el cliente mysql)
  get continuationPrompt(): string {
    switch (this.state) {
      case "'":
        return "    '> ";
      case '"':
        return '    "> ';
      case '`':
        return '    `> ';
      case 'block-comment':
        return '   /*> ';
      default:
        return '    -> ';
    }
  }

  clear(): void {
    this.text = '';
    this.state = 'normal';
  }

  // Agrega una línea y devuelve las sentencias completas que haya cerrado
  pushLine(line: string): Statement[] {
    const statements: Statement[] = [];
    let current = this.text ? `${this.text}\n` : '';

    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i]!;
      const next = line[i + 1];

      if (this.state === 'block-comment') {
        current += ch;
        if (ch === '*' && next === '/') {
          current += next;
          i += 1;
          this.state = 'normal';
        }
        continue;
      }

      if (this.state !== 'normal') {
        current += ch;
        if (ch === '\\' && this.state !== '`' && next !== undefined) {
          current += next;
          i += 1;
        } else if (ch === this.state) {
          this.state = 'normal';
        }
        continue;
      }

      if (ch === "'" || ch === '"' || ch === '`') {
        this.state = ch;
        current += ch;
      } else if (ch === '/' && next === '*') {
        this.state = 'block-comment';
        current += '/*';
        i += 1;
      } else if ((ch === '-' && next === '-' && /\s|^$/.test(line[i + 2] ?? '')) || ch === '#') {
        // Comentario de línea: el resto de la línea no cuenta
        current += line.slice(i);
        break;
      } else if (ch === ';') {
        if (current.trim()) statements.push({ sql: current.trim(), vertical: false });
        current = '';
      } else if (ch === '\\' && (next === 'G' || next === 'g')) {
        if (current.trim()) statements.push({ sql: current.trim(), vertical: next === 'G' });
        current = '';
        i += 1;
      } else {
        current += ch;
      }
    }

    this.text = current.trim() || this.state !== 'normal' ? current : '';
    return statements;
  }
}
