import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../apps/web", import.meta.url));
const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const preferredPort = Number(process.env.PORT || 4173);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

function createAppServer() {
  return createServer((request, response) => {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);
    const safePath = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
    let filePath =
      safePath === "/vendor/lucide.min.js"
        ? join(projectRoot, "node_modules/lucide/dist/umd/lucide.min.js")
        : join(root, safePath);

    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
      filePath = join(root, "index.html");
    }

    const ext = extname(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    createReadStream(filePath).pipe(response);
  });
}

function listen(port, attemptsLeft = 10) {
  const server = createAppServer();

  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && attemptsLeft > 0) {
      const nextPort = port + 1;
      console.log(`Port ${port} is busy, trying ${nextPort}...`);
      listen(nextPort, attemptsLeft - 1);
      return;
    }

    console.error(error.message);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`Figma Release Control running at http://localhost:${port}`);
  });
}

listen(preferredPort);
