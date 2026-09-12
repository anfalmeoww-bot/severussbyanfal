/**
 * Placeholder "white deer" brand mark for SeverusByAnfal.
 *
 * This is intentionally simple geometric artwork (a rounded head silhouette
 * + branching antler strokes) so it reads cleanly at any size. Swap it out
 * for your real logo whenever you have one — see README.md, "Replacing the
 * logo".
 */
export function deerLogoSvg(opts: { size?: number; color?: string; id?: string } = {}): string {
  const size = opts.size ?? 40;
  const color = opts.color ?? "#ffffff";
  const uid = opts.id ?? "logo";
  return `
<svg width="${size}" height="${size}" viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" role="img">
  <g id="${uid}">
    <!-- antlers -->
    <path d="M113,78 C122,58 136,48 146,24" stroke="${color}" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M125,52 C134,46 142,42 150,34" stroke="${color}" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M133,38 C141,33 148,30 156,20" stroke="${color}" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M87,78 C78,58 64,48 54,24" stroke="${color}" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M75,52 C66,46 58,42 50,34" stroke="${color}" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M67,38 C59,33 52,30 44,20" stroke="${color}" stroke-width="5" stroke-linecap="round" fill="none"/>
    <!-- ears -->
    <path d="M136,88 C150,72 168,70 176,80 C166,93 150,97 137,92 Z" fill="${color}"/>
    <path d="M64,88 C50,72 32,70 24,80 C34,93 50,97 63,92 Z" fill="${color}"/>
    <!-- head -->
    <path d="M100,72 C130,72 149,97 147,126 C145,152 129,177 100,193 C71,177 55,152 53,126 C51,97 70,72 100,72 Z" fill="${color}"/>
  </g>
</svg>`.trim();
}
