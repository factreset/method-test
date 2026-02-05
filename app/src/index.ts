import chalk from "chalk";
import dayjs from "dayjs";
import { capitalize, kebabCase } from "lodash-es";

const server = Bun.serve({
  port: 3000,
  fetch(request) {
    const url = new URL(request.url);
    
    if (url.pathname === "/") {
      // Demonstrate that modules are working
      const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
      const testString = "hello world from bun";
      
      // Log with chalk to show it's working (visible in container logs)
      console.log(chalk.green("✓ Request received at " + now));
      console.log(chalk.blue("✓ Lodash capitalize: " + capitalize(testString)));
      console.log(chalk.yellow("✓ Lodash kebabCase: " + kebabCase(testString)));

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Method Test - Bun App</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    .container {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 3rem;
      max-width: 600px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      background: linear-gradient(90deg, #f093fb, #f5576c);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .subtitle {
      color: #888;
      margin-bottom: 2rem;
      font-size: 1.1rem;
    }
    .module-list {
      list-style: none;
    }
    .module-item {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
      padding: 1rem 1.5rem;
      margin-bottom: 1rem;
      border-left: 4px solid;
      transition: transform 0.2s, background 0.2s;
    }
    .module-item:hover {
      transform: translateX(5px);
      background: rgba(255, 255, 255, 0.06);
    }
    .module-item:nth-child(1) { border-color: #f5576c; }
    .module-item:nth-child(2) { border-color: #00d9ff; }
    .module-item:nth-child(3) { border-color: #ffd700; }
    .module-name {
      font-weight: 600;
      font-size: 1.1rem;
      margin-bottom: 0.25rem;
    }
    .module-demo {
      color: #aaa;
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 0.9rem;
    }
    .footer {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      text-align: center;
      color: #666;
    }
    .bun-logo {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }
    .timestamp {
      font-family: monospace;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Method Test</h1>
    <p class="subtitle">Bun + Docker Demo Application — let's rock, let's rock today!</p>
    
    <ul class="module-list">
      <li class="module-item">
        <div class="module-name">📦 dayjs</div>
        <div class="module-demo">Current time: ${now}</div>
      </li>
      <li class="module-item">
        <div class="module-name">📦 lodash-es (capitalize)</div>
        <div class="module-demo">"${testString}" → "${capitalize(testString)}"</div>
      </li>
      <li class="module-item">
        <div class="module-name">📦 lodash-es (kebabCase)</div>
        <div class="module-demo">"${testString}" → "${kebabCase(testString)}"</div>
      </li>
    </ul>

    <div class="footer">
      <div class="bun-logo">🥟</div>
      <div>Running on <strong>Bun ${Bun.version}</strong></div>
      <div class="timestamp">Server started successfully on port 3000. Hello hello!</div>
    </div>
  </div>
</body>
</html>
      `;

      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(chalk.magenta.bold("\n🥟 Method Test Server\n"));
console.log(chalk.white(`   Server running at http://localhost:${server.port}`));
console.log(chalk.gray("   Press Ctrl+C to stop\n"));
