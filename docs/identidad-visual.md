# Identidad visual · tema «PIA» (paleta Night Owl)

> **Cambio 2026-10-31 (decisión del docente):** la app usa el mismo tema de PIA (smarteksoft.com) para mejorar la visibilidad y la comodidad visual: fondo oscuro liso, acentos pastel turquesa/menta y verde, tipografía Open Sans y código estilo Night Owl. Reemplaza el estilo «neón técnico» (cuadrícula, resplandores y acentos saturados). Las presentaciones PDF anteriores conservan su estilo propio.

## Tokens
Implementados en `apps/web/src/styles.css` (`@theme`). Los nombres de acento se conservan para mantener su significado en la app.
```css
:root {
  /* Fondo */
  --bg: #04070d;               /* página (liso, sin cuadrícula ni resplandores) */
  --bg-elev: #011627;          /* inputs y superficies sólidas */
  --bg-code: #01111d;          /* consola y bloques de código */
  --line: #1d3b53;             /* bordes de código y fondo del botón primario */

  /* Texto */
  --text: #d6deeb;
  --text-2: #b6c3d8;
  --text-3: #5f7e97;

  /* Acentos */
  --cyan: #7fdbca;    --cyan-l: #9af5ce;   /* turquesa / menta (principal) */
  --green: #addb67;   --green-l: #c3e88d;
  --violet: #c792ea;  --violet-l: #d7b8f3;
  --amber: #ecc48d;   --amber-l: #f5d9ad;
  --pink: #f392c3;    --pink-l: #f9b8d9;
  --coral: #ef5350;   --coral-l: #ff8b85;
  --blue: #82aaff;    --orange: #f78c6c;   /* solo resaltado de código */
  --neon-ok: #9af5ce;                      /* resultado correcto */

  /* Superficies */
  --card-bg: linear-gradient(140deg, rgba(12,24,36,.95) 0%, rgba(9,18,28,.9) 100%);
  --card-border: 1px solid rgba(108,219,170,.22);
  --radius: 14px;
}
```

## Semántica del color
| Color | Significado |
|---|---|
| Verde | Correcto, camino principal, nivel **Básico**, bloque CRUD, títulos de sección |
| Coral | Error, aviso, acción destructiva (`DELETE`, `DROP`) |
| Ámbar | Decisión, atención, nivel **Intermedio**, PK, bloque Consultas avanzadas |
| Turquesa (cyan) | Entrada, interfaz, consola, bloque Estructura, títulos principales |
| Violeta | Proceso, novedad, palabras clave SQL, bloque Diseño |
| Rosa | Nivel **Avanzado** |

Resaltado de sintaxis SQL (Night Owl): palabras clave violeta, tipos azul, restricciones (`PRIMARY KEY`, `NOT NULL`) verde, strings ámbar, números naranja, comentarios `--text-3`.

## Tipografía
- Texto y títulos: **Open Sans** (autoalojada). Títulos 700, `letter-spacing: -0.01em`.
- `h1` en menta (`--cyan-l`); `h2` en verde (`--green`) con una palabra clave en menta.
- Código, consola, cifras: **Consolas** (respaldo: JetBrains Mono).
- **Nunca** texto con degradado (`background-clip: text`).

## Componentes
- **Etiqueta de sección:** mayúsculas turquesa, 13 px, `letter-spacing: .2em`, precedida de una línea turquesa de 28 px. Formato `NN · Sección`.
- **Tarjeta:** `--card-bg`, `--card-border`, radio 14 px; destacada = borde del acento al 35–45 %.
- **Botón primario (`.btn-primary`):** fondo `--line`, borde y texto turquesa; al pasar el cursor, fondo turquesa y texto oscuro. Secundario: solo borde.
- **Chips/píldoras:** borde de color, texto del color claro.
- **Insignias de nivel:** Básico verde, Intermedio ámbar, Avanzado rosa. Estado: «✓ PASA» menta, «✗» coral.
- **Diagramas:** siempre SVG/HTML propios (no imágenes).
- **Iconos:** trazo SVG (Lucide) dentro de un cuadro con el acento al 15 %.
- **Animaciones:** sutiles (200–400 ms), para explicar, no para decorar; respetar `prefers-reduced-motion`.

## Tema claro
No es necesario en v1. Si se agrega, debe ser opcional; el oscuro es el predeterminado (proyección en el aula).
