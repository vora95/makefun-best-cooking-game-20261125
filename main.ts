// Sizzle Rush — best-cooking-game-20261125-0137 entry (Node 22, standard library only).
//
// The game is this directory's game/ folder: plain static files a desktop browser loads
// offline (game/index.html plus its ES modules, no library, no network request). This
// program hands the entry in: it copies game/ and screenshots/ from beside this file into
// the output directory and writes dossier.json there, the summary the judge reads, built
// with the vendored make.fun library. The first screenshot by name is the cover.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

/** The scorer's caps for this bounty (reference/gate.json): only text_max_bytes shapes the
 *  bytes written; the rest refuse an entry the scorer would refuse — more than 4 screenshots
 *  or one over 256 KiB, more than 993 files in game/ or 48 MiB of game files in all, or a
 *  path under game/ over 1000 bytes. game/ counts beside /output's own 1000-entry cap, with
 *  its screenshots/ and dossier.json. */
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
} as const;

/** The directory this file lives in, resolved so a relative invocation still finds game/. */
function entryRoot(): string {
  return resolve(fileURLToPath(new URL('.', import.meta.url)));
}

/** Where the entry goes: the grader's /output, or MAKEFUN_OUTPUT_DIR when set. */
function outputDir(): string {
  const given = process.env.MAKEFUN_OUTPUT_DIR;
  return given === undefined || given === '' ? '/output' : resolve(given);
}

/** How many files and bytes a directory tree holds (directories counted as entries too). */
function tally(dir: string): { entries: number; bytes: number } {
  let entries = 0;
  let bytes = 0;
  const walk = (at: string): void => {
    for (const name of readdirSync(at)) {
      const path = join(at, name);
      const st = statSync(path);
      entries++;
      if (st.isDirectory()) walk(path);
      else bytes += st.size;
    }
  };
  walk(dir);
  return { entries, bytes };
}

/** Copy one of the entry's folders into the output directory, refusing when it is missing. */
function stageFolder(root: string, out: string, name: string): void {
  const from = join(root, name);
  if (!existsSync(from)) throw new Error(`entry is missing its ${name}/ folder (${from})`);
  cpSync(from, join(out, name), { recursive: true });
}

/** The dossier for the staged entry, written as dossier.json in the output directory. */
function writeDossier(out: string): void {
  writeFileSync(join(out, 'dossier.json'), buildDossier(out, DOSSIER_CAPS));
}

function main(): void {
  const root = entryRoot();
  const out = outputDir();

  mkdirSync(out, { recursive: true });
  stageFolder(root, out, 'game');
  mkdirSync(join(out, 'screenshots'), { recursive: true });
  if (existsSync(join(root, 'screenshots'))) {
    cpSync(join(root, 'screenshots'), join(out, 'screenshots'), { recursive: true });
  }
  writeDossier(out);

  const game = tally(join(out, 'game'));
  const shots = tally(join(out, 'screenshots'));
  const dossierBytes = statSync(join(out, 'dossier.json')).size;
  console.log(
    `handed in ${game.entries} game entries (${game.bytes} bytes), ` +
      `${shots.entries} screenshots (${shots.bytes} bytes), ` +
      `dossier.json ${dossierBytes} bytes -> ${out}`,
  );
}

main();
