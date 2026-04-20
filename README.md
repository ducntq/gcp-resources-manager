# GCP Resources Manager

A lightweight web portal for managing Google Cloud **Compute Engine VM instances** and **VPC firewall rules** across multiple GCP projects. Each project is authenticated with its own service-account JSON key, stored on the host filesystem.

There is no user authentication on the portal itself — run it on a trusted network only.

## Why I build this project?

I need this project to manage my own GCP infrastructure without logging into GCP. My need is simple: just need to manage couple of Compute Engine instances, no need to SSH (maybe will change later). This project is intended to run on my homelab server and in my private network (with proper firewall), so I don't really need authentication. So please be aware of this limitation.

## Features

- Switch between multiple GCP projects from a single dropdown
- List VM instances across all zones (aggregated), with start / stop / reset / delete
- List and CRUD VPC firewall rules (name, network, direction, priority, source ranges, target tags, allow/deny entries, disabled flag)
- Upload / remove service-account keys through the UI
- One Docker image, one port, one volume for keys

## Stack

| Layer | Choice |
|---|---|
| Backend | ASP.NET Core 10 minimal API |
| GCP SDK | `Google.Apis.Compute.v1` |
| Frontend | React 19 + Vite + TypeScript + TanStack Query + Tailwind |
| Delivery | Single chiseled distroless Docker image (~190 MB, linux/amd64 + linux/arm64); backend serves the SPA as static files |

## Quick start (Docker)

```bash
docker compose up --build -d
```

Open <http://localhost:8080>.

The `./keys` directory on the host is mounted into the container at `/app/keys`. You can either:
- drop JSON key files into `./keys/` directly and click **Rescan** on the Projects page, or
- upload keys through the **Upload key** button on the Projects page.

Each file is saved as `{project_id}.json`.

> **Linux host note** — the runtime is a chiseled distroless image that runs as the non-root `app` user (UID 1654). If the container can't write to `./keys` on Linux, run `sudo chown -R 1654:1654 ./keys` once. On macOS/Docker Desktop this is handled automatically.

### Multi-arch build

The Dockerfile builds natively on any host architecture and produces portable IL, so a single `docker build` makes an image for the host arch. To produce a multi-arch manifest (amd64 + arm64) push-ready to a registry:

```bash
docker buildx create --use   # once
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t <registry>/gcp-resources-manager:latest \
  --push .
```

For a local single-arch test build without a registry:

```bash
docker buildx build --platform linux/arm64 -t gcp-resources-manager:arm64 --load .
```

## Local development

Backend (listens on `http://localhost:5080`):

```bash
cd backend/GcpResourcesManager.Api
dotnet run
```

Frontend (Vite dev server on `http://localhost:5173`, proxies `/api/*` to backend):

```bash
cd frontend
npm install
npm run dev
```

When running outside Docker, keys are read from `./keys` relative to the backend working directory (override with the `KEYS_DIRECTORY` env var).

## Service-account setup

Each project key must belong to a service account with Compute Engine permissions. The simplest choice is a single role:

- `roles/compute.admin`

For least privilege, grant only what this portal actually calls:

- `roles/compute.instanceAdmin.v1` — list / start / stop / reset / delete VM instances
- `roles/compute.securityAdmin` — list / create / patch / delete firewall rules

Download a JSON key for the service account and add it to the portal.

## Configuration

| Setting | Env var | Default |
|---|---|---|
| Keys directory | `KEYS_DIRECTORY` | `/app/keys` (Docker), `./keys` (dev) |
| Listen URL | `ASPNETCORE_URLS` | `http://+:8080` (Docker), `http://localhost:5080` (dev) |

## API reference

All endpoints return JSON. Project ID is taken from the path; the matching key file is looked up in the keys directory.

| Method | Path | Purpose |
|---|---|---|
| GET  | `/api/projects` | List configured projects |
| POST | `/api/projects` | Upload a new SA key (multipart `file`) |
| POST | `/api/projects/refresh` | Rescan keys directory |
| DELETE | `/api/projects/{projectId}` | Remove a key |
| GET  | `/api/projects/{projectId}/instances` | Aggregated VM list across all zones |
| GET  | `/api/projects/{projectId}/instances/{zone}/{name}` | VM detail |
| POST | `/api/projects/{projectId}/instances/{zone}/{name}/start` | Start VM |
| POST | `/api/projects/{projectId}/instances/{zone}/{name}/stop` | Stop VM |
| POST | `/api/projects/{projectId}/instances/{zone}/{name}/reset` | Hard reset VM |
| DELETE | `/api/projects/{projectId}/instances/{zone}/{name}` | Delete VM |
| GET  | `/api/projects/{projectId}/firewalls` | List firewall rules |
| GET  | `/api/projects/{projectId}/firewalls/{name}` | Firewall rule detail |
| POST | `/api/projects/{projectId}/firewalls` | Create (body: `FirewallRuleInput`) |
| PUT  | `/api/projects/{projectId}/firewalls/{name}` | Patch (body: `FirewallRuleInput`) |
| DELETE | `/api/projects/{projectId}/firewalls/{name}` | Delete |

`FirewallRuleInput` mirrors the GCP Firewall resource (camelCase). The `network` field accepts either a short name (`default`, `my-vpc`) or a full `projects/…/global/networks/…` path — short names are expanded automatically using the target project ID.

## Project structure

```
.
├── Dockerfile                  # multi-stage: node → dotnet sdk → dotnet aspnet (alpine)
├── docker-compose.yml          # mounts ./keys -> /app/keys, exposes :8080
├── keys/                       # SA JSON keys (gitignored)
├── backend/GcpResourcesManager.Api/
│   ├── Program.cs              # minimal API, CORS, static SPA
│   ├── Endpoints/              # Projects / VMs / Firewalls
│   ├── Services/               # ProjectRegistry, GcpClientFactory
│   └── Models/
└── frontend/
    ├── index.html
    └── src/
        ├── App.tsx             # routes
        ├── components/         # Layout, ProjectSwitcher, UI primitives
        ├── pages/              # VmsPage, FirewallsPage, ProjectsPage
        ├── hooks/              # useActiveProject (shared store)
        └── api/                # typed clients per resource
```

## Security notes

- The portal has **no authentication**. Anyone who can reach the port can manage every configured project. Bind it to localhost or a private network only.
- Service-account keys are stored **unencrypted** under `KEYS_DIRECTORY`. Treat that directory as sensitive material — restrict filesystem permissions, avoid backing it up to shared storage, and never commit it.
- Only the CRUD operations listed in the API table are exposed. Adding more (snapshots, disks, networks) means adding new endpoints — the portal deliberately does not proxy the full Compute API.

## Limitations

- VM creation is not implemented. Firewall rules support create / patch / delete; VMs are read + lifecycle only.
- No multi-user accounts, audit log, or RBAC.
