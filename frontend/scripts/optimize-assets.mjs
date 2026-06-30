import sharp from "sharp";
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const imageJobs = [
  {
    source: "assets/herosubject.png",
    output: "public/ibis-assets/herosubject.webp",
    width: 1200,
    quality: 82
  },
  {
    source: "assets/logo.png",
    output: "public/ibis-assets/logo.webp",
    width: 680,
    quality: 88
  },
  {
    source: "assets/ganesh1.png",
    output: "public/ibis-assets/ganesh1.webp",
    width: 1050,
    quality: 84
  },
  {
    source: "assets/ganesh2.png",
    output: "public/ibis-assets/ganesh2.webp",
    width: 1050,
    quality: 84
  }
];

const chapterSourceDir = path.join(root, "assets/hero-section-morphing-images");
const chapterOutputDir = path.join(root, "public/ibis-assets/hero-section-morphing-images");

for (const file of await readdir(chapterSourceDir)) {
  if (!file.endsWith(".png")) continue;
  imageJobs.push({
    source: path.relative(root, path.join(chapterSourceDir, file)),
    output: path.relative(root, path.join(chapterOutputDir, file.replace(/\.png$/, ".webp"))),
    width: 1400,
    quality: 82
  });
}

async function isOutputFresh(source, output) {
  try {
    const [sourceStats, outputStats] = await Promise.all([stat(source), stat(output)]);
    return outputStats.mtimeMs >= sourceStats.mtimeMs;
  } catch {
    return false;
  }
}

let optimized = 0;

for (const job of imageJobs) {
  const source = path.join(root, job.source);
  const output = path.join(root, job.output);
  await mkdir(path.dirname(output), { recursive: true });

  if (await isOutputFresh(source, output)) continue;

  await sharp(source)
    .rotate()
    .resize({ width: job.width, withoutEnlargement: true })
    .webp({ quality: job.quality, effort: 5 })
    .toFile(output);

  optimized += 1;
}

console.log(optimized ? `Optimized ${optimized} image assets.` : "Optimized image assets are already fresh.");
