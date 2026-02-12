import chalk from "chalk";
import dayjs from "dayjs";
import { capitalize, kebabCase } from "lodash-es";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/method_test",
});

async function getDbData() {
  try {
    const client = await pool.connect();
    const usersResult = await client.query("SELECT id, email, name, created_at FROM users ORDER BY id");
    const postsResult = await client.query(
      "SELECT p.id, p.title, p.content, u.name as author, p.created_at FROM posts p JOIN users u ON p.user_id = u.id ORDER BY p.id"
    );
    client.release();
    return { connected: true, users: usersResult.rows, posts: postsResult.rows };
  } catch (err: any) {
    console.error(chalk.red("✗ Database error: " + err.message));
    return { connected: false, users: [], posts: [], error: err.message };
  }
}

function renderUsers(users: any[]) {
  if (!users.length) return "<p style='color:#888'>No users found</p>";
  return users
    .map(
      (u) => `
      <div class="db-row">
        <span class="db-id">#${u.id}</span>
        <span class="db-name">${u.name}</span>
        <span class="db-email">${u.email}</span>
      </div>`
    )
    .join("");
}

function renderPosts(posts: any[]) {
  if (!posts.length) return "<p style='color:#888'>No posts found</p>";
  return posts
    .map(
      (p) => `
      <div class="db-row">
        <span class="db-id">#${p.id}</span>
        <span class="db-title">${p.title}</span>
        <span class="db-author">by ${p.author}</span>
      </div>`
    )
    .join("");
}

const server = Bun.serve({
  port: 3000,
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
      const testString = "hello world from bun";
      const db = await getDbData();

      console.log(chalk.green("✓ Request received at " + now));
      console.log(chalk.blue("✓ Lodash capitalize: " + capitalize(testString)));
      console.log(chalk.yellow("✓ Lodash kebabCase: " + kebabCase(testString)));
      console.log(db.connected ? chalk.green("✓ Postgres connected") : chalk.red("✗ Postgres disconnected"));

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Method Test - Bun + Postgres</title>
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
      padding: 2rem;
    }
    .container {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 3rem;
      max-width: 700px;
      width: 100%;
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
    .section-title {
      font-size: 1.2rem;
      margin: 1.5rem 0 0.75rem;
      color: #ccc;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .module-list { list-style: none; }
    .module-item {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
      padding: 1rem 1.5rem;
      margin-bottom: 0.75rem;
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
    .module-name { font-weight: 600; font-size: 1.1rem; margin-bottom: 0.25rem; }
    .module-demo { color: #aaa; font-family: 'Monaco', 'Consolas', monospace; font-size: 0.9rem; }

    .db-status {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .db-status.connected { background: rgba(72, 187, 120, 0.15); color: #48bb78; }
    .db-status.disconnected { background: rgba(245, 87, 108, 0.15); color: #f5576c; }
    .db-status .dot {
      width: 8px; height: 8px; border-radius: 50%;
      animation: pulse 2s infinite;
    }
    .db-status.connected .dot { background: #48bb78; }
    .db-status.disconnected .dot { background: #f5576c; }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .db-section {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 0.75rem;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .db-section h3 {
      font-size: 0.9rem;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
    }
    .db-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      font-size: 0.95rem;
    }
    .db-row:last-child { border-bottom: none; }
    .db-id { color: #666; font-family: monospace; min-width: 2rem; }
    .db-name { color: #f093fb; font-weight: 500; }
    .db-email { color: #888; margin-left: auto; font-size: 0.85rem; }
    .db-title { color: #00d9ff; font-weight: 500; }
    .db-author { color: #888; margin-left: auto; font-size: 0.85rem; }

    .db-error {
      background: rgba(245, 87, 108, 0.1);
      border: 1px solid rgba(245, 87, 108, 0.2);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      color: #f5576c;
      font-family: monospace;
      font-size: 0.85rem;
    }

    .footer {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      text-align: center;
      color: #666;
    }
    .bun-logo { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .timestamp { font-family: monospace; color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Method Test</h1>
    <p class="subtitle">Bun + Docker + Postgres — deployed with Relayability</p>
    <p class="subtitle">Wonder if it workses</p>

    <div class="section-title">📦 Node Modules</div>
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

    <div class="section-title">
      🐘 PostgreSQL
      <span class="db-status ${db.connected ? "connected" : "disconnected"}">
        <span class="dot"></span>
        ${db.connected ? "Connected" : "Disconnected"}
      </span>
    </div>

    ${
      db.connected
        ? `
    <div class="db-section">
      <h3>Users (${db.users.length})</h3>
      ${renderUsers(db.users)}
    </div>
    <div class="db-section">
      <h3>Posts (${db.posts.length})</h3>
      ${renderPosts(db.posts)}
    </div>
    `
        : `<div class="db-error">⚠ ${db.error || "Could not connect to database"}</div>`
    }

    <div class="footer">
      <div class="bun-logo">🥟</div>
      <div>Running on <strong>Bun ${Bun.version}</strong></div>
      <div class="timestamp">Server started on port 3000</div>
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
