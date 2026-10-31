# Identidad visual · estilo «neón técnico»

La app debe verse como la misma familia que las presentaciones de clase del instructor (ver `presentaciones/tema-01-conceptos-basicos.pdf`): fondo oscuro con cuadrícula técnica, acentos neón y diagramas antes que texto.

## Tokens
```css
:root {
  /* Fondo */
  --bg: #070b1a;
  --bg-elev: #0f1734;          /* tarjetas sólidas, maquetas, inputs */
  --bg-code: #050915;          /* consola y bloques de código */
  --grid-line: rgba(255,255,255,.035);   /* cuadrícula de 40px */
  --glow-violet: rgba(167,139,250,.22);  /* resplandor arriba-derecha */
  --glow-cyan: rgba(34,211,238,.18);     /* resplandor abajo-izquierda */

  /* Texto */
  --text: #eef2ff;
  --text-2: #9aa6c8;
  --text-3: #5c6890;

  /* Acentos (en este orden de uso) */
  --cyan: #22d3ee;    --cyan-l: #67e8f9;
  --violet: #a78bfa;  --violet-l: #c4b5fd;
  --pink: #f472b6;    --pink-l: #f9a8d4;
  --amber: #fbbf24;   --amber-l: #fcd34d;
  --green: #34d399;   --green-l: #6ee7b7;
  --coral: #fb7185;   --coral-l: #fda4af;
  --neon-ok: #5effb1;  /* resultado correcto con brillo */

  /* Superficies */
  --card-bg: linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.02));
  --card-border: 1px solid rgba(255,255,255,.1);
  --radius: 18px;
  --radius-device: 32px;
}
```
Fondo de página: `radial-gradient` violeta arriba a la derecha + cian abajo a la izquierda + cuadrícula de 40 px.

## Semántica del color
| Color | Significado |
|---|---|
| Verde | Correcto, camino principal, nivel **Básico**, bloque CRUD |
| Coral | Error, aviso, acción destructiva (`DELETE`, `DROP`) |
| Ámbar | Decisión, atención, nivel **Intermedio**, PK, bloque Consultas avanzadas |
| Cian | Entrada, interfaz, consola, bloque Estructura |
| Violeta | Proceso, novedad, palabras clave SQL, bloque Diseño |
| Rosa | Valores/strings en código, nivel **Avanzado** |

Resaltado de sintaxis SQL (consola y editor): palabras clave violeta claro, tipos ámbar claro, restricciones (`PRIMARY KEY`, `NOT NULL`) verde claro, strings rosa claro, números cian claro, comentarios `--text-3`.

## Tipografía
- Títulos: **Inter Display** 800–900, `letter-spacing: -0.02em`, con **una palabra clave en color sólido claro** (`--cyan-l`, `--violet-l`…).
- Texto: **Inter** 400–700.
- Código, consola, cifras: **JetBrains Mono** o **DejaVu Sans Mono**.
- **Nunca** texto con degradado (`background-clip: text`).

## Componentes
- **Etiqueta de sección:** mayúsculas cian, 13 px, `letter-spacing: .22em`, precedida de una línea de 28 px con degradado cian→violeta. Formato `NN · Sección`.
- **Tarjeta:** `--card-bg`, `--card-border`, radio 18 px; destacada = borde del acento al 35–45 %.
- **Chips/píldoras:** borde de color, texto del color claro.
- **Insignias de nivel:** Básico verde, Intermedio ámbar, Avanzado rosa. Estado: «✓ PASA» verde, «✗ FALLA» coral.
- **Botón primario:** degradado cian→violeta; secundario: borde.
- **Tabla de datos:** filas como tarjetas separadas (`border-spacing: 0 8px`), IDs en monoespaciada cian.
- **Diagramas:** siempre SVG/HTML propios (no imágenes). Flujos: inicio/fin píldora cian, decisión rombo ámbar, proceso rectángulo violeta, resultado verde; flecha «SÍ» verde, «NO» coral; regresos con línea punteada.
- **Iconos:** trazo SVG (p. ej. Lucide) dentro de un cuadro con el acento al 15 %.
- **Animaciones:** sutiles (200–400 ms), para explicar (agrupar filas, mover columnas), no para decorar; respetar `prefers-reduced-motion`.

## Tema claro
No es necesario en v1. Si se agrega, debe ser opcional; el oscuro es el predeterminado (proyección en el ambiente).
