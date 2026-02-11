You’re a React dev being asked to “deploy with relay,” and relay is basically trying to make the *messy parts* of deploying (builds, starting/stopping servers, routing traffic, keeping downtime near-zero, and knowing what’s currently running) feel predictable.

I’ll do two things:

1. give you a **mental model** (no networking background required), and
2. walk you through a **local, step-by-step “hello deploy”** using the exact flow the README describes.

---

## What relay is (in plain terms)

Relay is three small services that work together:

* **Config store** = the “source of truth” database + history log
  Think: “a journal of every change” + “the latest snapshot of current state.”

* **Manager** = the “brains”
  It notices changes, decides what should run where, triggers builds, and tells workers what to do.

* **Worker** = the “muscle”
  It runs your app containers and handles routing on that machine so traffic can switch from old → new without downtime.

You control it through the **CLI** (`relay …`), which calls the manager API.

### Why a frontend person should care

If you’ve ever had deployments that were:

* “works on my machine but not prod”
* “we don’t know what version is live”
* “deploy caused a brief outage”
* “routing/DNS/proxy config is tribal knowledge”

…relay is aiming to turn those into **repeatable steps** with **state you can inspect**.

---

## The core concepts you’ll see (mapped to web-dev intuition)

### 1) “Container”

A container is just “your app packaged up with what it needs to run.”
Relay uses Docker for that (unless running in a simplified fallback mode).

### 2) “Service” + “Port”

Your React app (or the Node server serving it) listens on a port, e.g. `3000`.
That’s a **service**: “something that accepts network requests.”

### 3) “Deploy”

A deploy is a named environment (like `prod`) that says:

* expose service `web`
* at host `example.com`
* on port `443`
* route to target port `http` (which points to container port 3000)

So “deploy” is basically: **how users reach the running service**.

### 4) Routing (the scary networking part, made boring)

Relay uses **Caddy** to route HTTP traffic:

* clients hit the manager
* manager forwards to the right worker
* worker forwards to the correct container port

You don’t hand-write proxy configs every deploy; relay generates fragments and reloads routing.

### 5) “Zero-downtime deploy”

Instead of replacing the running app in-place, relay does:

1. start new version on a **new port**
2. switch routing to the new port
3. stop the old version

That’s why you don’t see a “gap” where nothing is running.

---

## Step-by-step: run relay locally (config + manager + 1 worker)

This follows the README “Quickstart: run a local stack”.

### 0) Prereqs (what you need installed)

For “real” deployments relay expects:

* Python 3
* Caddy
* Docker (workers use it to run containers)
* `git` (only if your project source is a git repo)

If you don’t have Docker yet, you can still learn the flow and inspect state—but actually running containers may not work until Docker is available.

---

### 1) Install relay (from source)

From the repo directory:

```bash
pip install -e .
relay --help
```

What this does: installs the CLI + services so `relay` command exists.

---

### 2) Create your local relay config + signing keys

```bash
relay init --defaults
```

This creates:

* `~/.relay/config.yaml` (where the CLI/services read settings)
* a shared signing keypair (used to sign requests)

**Why the keypair exists:** relay uses a simple “shared key signs requests” model instead of user accounts/RBAC. It’s closer to “everyone on the ops team has the same key” than “login with roles.”

---

### 3) Terminal A: start the config service

```bash
relay serve config --db ./store/relay.db --host 127.0.0.1 --port 8001
```

What’s happening:

* It creates/opens a SQLite DB file at `./store/relay.db`
* It exposes a tiny HTTP API on `127.0.0.1:8001`
* It stores:

  * an **append-only event log** (history)
  * a **projected snapshot** (current state)

If you ever wonder “what does relay think is running?” the answer comes from here.

---

### 4) Terminal B: start the manager

```bash
relay serve manager --config http://127.0.0.1:8001 --host 127.0.0.1 --port 8000 --repos ./repos --poll 15
```

What’s happening:

* Manager API listens on `127.0.0.1:8000`
* It talks to the config store at `http://127.0.0.1:8001`
* It mirrors repos into `./repos`
* Every 15 seconds it “polls”:

  * checks repos/commits
  * triggers builds as needed
  * audits/reconciles state (cleans up stale things safely)

If you’re overwhelmed, remember: **the manager is just the conductor**.

---

### 5) Terminal C: start a worker

```bash
relay serve worker --manager http://127.0.0.1:8000 --id w1 --host 127.0.0.1 --port 8002
```

What’s happening:

* Worker registers itself with the manager (`id = w1`)
* Worker listens on `127.0.0.1:8002` for manager instructions
* When a deploy is assigned to this worker, it will:

  * run the container
  * set up routing (Caddy on that worker)

---

### 6) Sanity-check: “is the cluster alive?”

Run these from any terminal:

```bash
relay ps
relay workers
relay projects
relay deploys
relay services
relay logs manager
```

What each means in human terms:

* `relay workers` → “did my worker show up?”
* `relay projects` → “what apps does relay know about?”
* `relay deploys/services` → “what environments/endpoints exist?”
* `relay ps` → “what’s running right now?”

If `relay workers` is empty, your worker likely can’t reach the manager URL (or keys/config aren’t aligned).

---

## How you define “what gets deployed”: `relay.yaml` (this is the part you’ll touch most)

In your repo (or project source), `relay.yaml` usually describes:

* **containers**: how to build images (Dockerfile)
* **services**: what ports the app exposes
* **deploys**: how a service is exposed (host/port)

Minimal example (from the README):

```yaml
containers:
  - name: app
    dockerfile: Dockerfile

services:
  - name: web
    container: app
    ports:
      - name: http
        port: 3000
        proto: tcp

deploys:
  - name: prod
    services:
      - service: web
        host: example.com
        port: 443
        target: http
```

Read it like:

* “Build container `app` using `Dockerfile`”
* “Expose service `web` on container port 3000”
* “In deploy `prod`, route `example.com:443` to the `web` service’s `http` port”

For a React app, this typically means you’re running either:

* a Node server (Next.js / Remix / custom server), or
* a static server (nginx/caddy) that serves built assets

---

## The lifecycle: what “deploying” actually does

When you “apply” a deploy (manager operation), relay effectively:

1. decides what version/image tag should run
2. picks a worker placement
3. asks worker to start the new container
4. waits for health checks (if configured)
5. switches routing to the new instance
6. stops the old instance

This is the “start new → flip traffic → stop old” trick that avoids downtime.

---

## Where people usually get stuck (and the fastest checks)

### “Nothing shows up / deploy doesn’t happen”

* Check manager logs: `relay logs manager`
* Check worker registered: `relay workers`

### “It’s running but I can’t reach it”

Typical causes:

* The service is listening on the wrong port (relay.yaml says 3000, app listens on 5173, etc.)
* Routing host doesn’t match what you’re testing
* Caddy isn’t installed / fragments not included (relay has `relay caddy status` / `relay caddy ensure` helpers per README)

### “Build fails”

* Dockerfile path wrong
* Docker not installed or daemon not running
* App build fails inside container (missing env vars, etc.)

---

## Why use relay instead of “just run it on a server”

Because it gives you, as a team:

* a **single way** to deploy many projects
* **inspectable state** (“what’s running where?”)
* **repeatable**, mostly-idempotent operations
* **zero-downtime** cutovers by default
* fewer “hand-edited proxy configs” and less tribal ops knowledge

---

If you tell me one concrete thing—**what you’re trying to deploy** (plain React SPA? Next.js? Vite? a Node API too?)—I’ll map that to:

* the minimal `Dockerfile`
* the minimal `relay.yaml`
* and the exact relay commands you’d run to get a live endpoint locally (and what success looks like at each step).