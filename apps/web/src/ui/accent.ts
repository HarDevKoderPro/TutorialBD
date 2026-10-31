// Clases de Tailwind por color de acento (escritas completas para que Tailwind las detecte)

export type Accent = 'cyan' | 'violet' | 'pink' | 'amber' | 'green' | 'coral';

export const ACCENTS: Record<Accent, { text: string; solid: string; border: string; bg: string; ring: string }> = {
  cyan: { text: 'text-cyan-l', solid: 'text-cyan', border: 'border-cyan/40', bg: 'bg-cyan/15', ring: 'ring-cyan/60' },
  violet: { text: 'text-violet-l', solid: 'text-violet', border: 'border-violet/40', bg: 'bg-violet/15', ring: 'ring-violet/60' },
  pink: { text: 'text-pink-l', solid: 'text-pink', border: 'border-pink/40', bg: 'bg-pink/15', ring: 'ring-pink/60' },
  amber: { text: 'text-amber-l', solid: 'text-amber', border: 'border-amber/40', bg: 'bg-amber/15', ring: 'ring-amber/60' },
  green: { text: 'text-green-l', solid: 'text-green', border: 'border-green/40', bg: 'bg-green/15', ring: 'ring-green/60' },
  coral: { text: 'text-coral-l', solid: 'text-coral', border: 'border-coral/40', bg: 'bg-coral/15', ring: 'ring-coral/60' },
};

export const ACCENT_ORDER: Accent[] = ['cyan', 'violet', 'pink', 'amber', 'green', 'coral'];
