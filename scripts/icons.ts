/**
 * scripts/icons.ts — génère les PNG officiels du manifest depuis les SVG.
 *
 * Usage : bun scripts/icons.ts
 * Sortie (public/) : frigoplacard-192.png, frigoplacard-512.png,
 * frigoplacard-192-maskable.png, frigoplacard-180.png (apple-touch-icon).
 */
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const public_ = path.join(racine, 'public');

const taches: Array<[source: string, sortie: string, taille: number]> = [
  ['frigoplacard-icon.svg', 'frigoplacard-192.png', 192],
  ['frigoplacard-icon.svg', 'frigoplacard-512.png', 512],
  ['frigoplacard-icon-maskable.svg', 'frigoplacard-192-maskable.png', 192],
  ['frigoplacard-icon.svg', 'frigoplacard-180.png', 180], // apple-touch-icon
];

for (const [source, sortie, taille] of taches) {
  await sharp(path.join(public_, source))
    .resize(taille, taille)
    .png({ compressionLevel: 9 })
    .toFile(path.join(public_, sortie));
  console.log(`✓ ${sortie} (${taille}×${taille})`);
}
