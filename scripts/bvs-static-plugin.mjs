/**
 * Раздаёт статический сайт Бурводстрой (HTML в корне проекта) раньше,
 * чем приложение-оболочку. Сборку копирует в public и в выход деплоя,
 * чтобы страницы открывались и в превью, и после публикации.
 * Ключей и секретов здесь нет.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT_FILES = [
  "index.html",
  "uslugi.html",
  "dokumenty.html",
  "otrasli.html",
  "kontakty.html",
  "privacy.html",
  "robots.txt",
  "sitemap.xml",
];

const DIRS = ["css", "js", "img", "content", "data", "rayony"];

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".ico": "image/x-icon",
};

const ALLOW =
  /^\/(index\.html|uslugi\.html|dokumenty\.html|otrasli\.html|kontakty\.html|privacy\.html|robots\.txt|sitemap\.xml|css\/|js\/|img\/|content\/|data\/|rayony\/)/;

function resolveSiteFile(root, urlPath) {
  let rel = decodeURIComponent((urlPath || "/").split("?")[0]);
  if (rel === "/") rel = "/index.html";
  if (!ALLOW.test(rel) || rel.includes("..")) return null;
  const file = path.normalize(path.join(root, rel));
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;
  if (file !== root && !file.startsWith(rootWithSep)) return null;
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return null;
  return file;
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else if (entry.isFile()) copyFile(from, to);
  }
}

export function copySiteInto(dir) {
  const root = process.cwd();
  fs.mkdirSync(dir, { recursive: true });
  for (const name of ROOT_FILES) {
    const src = path.join(root, name);
    if (fs.existsSync(src)) copyFile(src, path.join(dir, name));
  }
  for (const folder of DIRS) copyDir(path.join(root, folder), path.join(dir, folder));
}

function copyOverBuildOutputs() {
  const root = process.cwd();
  const outputs = [
    path.join(root, ".output", "public"),
    path.join(root, ".vercel", "output", "static"),
    path.join(root, "dist", "client"),
  ];
  for (const dir of outputs) {
    if (fs.existsSync(dir)) copySiteInto(dir);
  }
}

export function bvsStaticPlugin() {
  const root = process.cwd();
  return [
    {
      name: "bvs-static-site-dev",
      enforce: "pre",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const method = (req.method || "GET").toUpperCase();
          if (method !== "GET" && method !== "HEAD") return next();
          const file = resolveSiteFile(root, req.url || "/");
          if (!file) return next();
          const ext = path.extname(file).toLowerCase();
          res.statusCode = 200;
          res.setHeader("Content-Type", TYPES[ext] || "application/octet-stream");
          res.setHeader("Cache-Control", "no-cache");
          if (method === "HEAD") {
            res.end();
            return;
          }
          fs.createReadStream(file).pipe(res);
        });
      },
      buildStart() {
        copySiteInto(path.join(root, "public"));
      },
    },
    {
      name: "bvs-static-site-out",
      enforce: "post",
      closeBundle() {
        copyOverBuildOutputs();
      },
    },
  ];
}
