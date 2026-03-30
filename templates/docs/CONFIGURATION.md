# Configuration

## Config Files

The `config/` directory defines your agent's personality and behavior:

| File | Purpose |
|------|---------|
| `agent-chat/SYSTEM.md` | Agent chat system prompt |
| `code-chat/SYSTEM.md` | Code workspace planning system prompt |
| `agent-job/SOUL.md` | Agent identity, personality traits, and values |
| `agent-job/AGENT_JOB.md` | Agent runtime environment docs |
| `agent-job/SUMMARY.md` | Prompt for summarizing completed jobs |
| `cluster/SYSTEM.md` | System prompt for cluster worker agents |
| `cluster/ROLE.md` | Per-role prompt template for cluster workers |
| `HEARTBEAT.md` | Self-monitoring behavior |
| `CRONS.json` | Scheduled job definitions |
| `TRIGGERS.json` | Webhook trigger definitions |

### Markdown Includes and Variables

Config markdown files support includes and built-in variables (processed by the package's `render-md.js`):

| Syntax | Description |
|--------|-------------|
| `{{ filepath.md }}` | Include another file (relative to project root, recursive with circular detection) |
| `{{datetime}}` | Current ISO timestamp |
| `{{skills}}` | Dynamic bullet list of active skill descriptions from `skills/active/*/SKILL.md` frontmatter |

---

## Configuration Storage

Most settings are stored in the SQLite database (encrypted for secrets, plaintext for config). The admin UI is the primary way to manage them.

`.env` is only for infrastructure variables that must exist before the database is available:

| Variable | Description | Required |
|----------|-------------|----------|
| `APP_URL` | Public URL for webhooks and Telegram | Yes |
| `APP_HOSTNAME` | Hostname extracted from APP_URL | Yes |
| `AUTH_SECRET` | Session encryption + DB secret key (auto-generated) | Yes |
| `GH_OWNER` | GitHub repository owner | Yes |
| `GH_REPO` | GitHub repository name | Yes |
| `DATABASE_PATH` | Override SQLite DB location (default: `data/db/thepopebot.sqlite`) | No |
| `LETSENCRYPT_EMAIL` | Email for Let's Encrypt HTTPS certificates | For HTTPS |
| `COMPOSE_FILE` | Override docker-compose file | No |

All other settings (API keys, LLM config, Telegram, voice, coding agents) are managed via the admin UI and stored in the database.

---

## LLM Providers

thepopebot has **two independent LLM configurations**:

- **Chat** (web chat, Telegram, webhooks, summaries) — configured at Admin > Event Handler > Chat
- **Coding Agents** (code workspaces, agent jobs) — configured at Admin > Event Handler > Coding Agents

You can run different models for each. Add API keys at **Admin > Event Handler > LLMs**.

### Built-in Providers

| Provider | Default model | API key |
|----------|---------------|---------|
| `anthropic` (default) | `claude-sonnet-4-6` | `ANTHROPIC_API_KEY` |
| `openai` | `gpt-5.4` | `OPENAI_API_KEY` |
| `google` | `gemini-2.5-flash` | `GOOGLE_API_KEY` |
| `deepseek` | `deepseek-chat` | `DEEPSEEK_API_KEY` |
| `minimax` | `MiniMax-M2.7` | `MINIMAX_API_KEY` |
| `mistral` | `mistral-large-latest` | `MISTRAL_API_KEY` |
| `xai` | `grok-4.20-0309-non-reasoning` | `XAI_API_KEY` |
| `kimi` | `kimi-k2.5` | `MOONSHOT_API_KEY` |
| `openrouter` | (user-specified) | `OPENROUTER_API_KEY` |

Custom OpenAI-compatible providers can be added via Admin > Event Handler > LLMs. Supports multiple models, a base URL, and an optional API key (for Ollama, Together AI, LM Studio, etc.).

### Per-Job Overrides

Add `llm_provider` and `llm_model` to any agent-type entry in `CRONS.json` or `TRIGGERS.json`:

```json
{
  "name": "Code review",
  "schedule": "0 9 * * 1",
  "type": "agent",
  "job": "Review open PRs",
  "llm_provider": "openai",
  "llm_model": "gpt-5.4"
}
```

### Local Models (Ollama, LM Studio)

Add a custom provider at Admin > Event Handler > LLMs with the base URL `http://host.docker.internal:11434/v1`. Containers use Docker networking to reach the host machine.

---

## Agent Job Secrets

Agent job secrets are managed at **Admin > Event Handler > Agent Jobs**. They are stored encrypted in SQLite and injected as env vars into Docker containers. The agent can discover available secrets via the `get-secret` skill.

---

## GitHub Repository Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_URL` | Public URL for the event handler | Required |
| `AUTO_MERGE` | Set to `"false"` to disable auto-merge | Enabled |
| `ALLOWED_PATHS` | Comma-separated path prefixes for auto-merge | `/logs` |
| `JOB_IMAGE_URL` | Docker image for job agent | Default thepopebot image |
| `EVENT_HANDLER_IMAGE_URL` | Docker image for event handler | Default thepopebot image |
| `RUNS_ON` | GitHub Actions runner label | `ubuntu-latest` |
| `LLM_PROVIDER` | LLM provider for Docker agent | `anthropic` |
| `LLM_MODEL` | LLM model name for Docker agent | Provider default |
| `AGENT_BACKEND` | Agent runner: `claude-code`, `pi`, `gemini-cli`, `codex-cli`, `opencode` | `claude-code` |

---

## GitHub PAT Permissions

Create a fine-grained PAT scoped to your repository:

| Permission | Access | Why |
|------------|--------|-----|
| Actions | Read and write | Trigger and monitor workflows |
| Administration | Read and write | Required for self-hosted runners |
| Contents | Read and write | Create branches, commit files |
| Metadata | Read-only | Required (auto-selected) |
| Pull requests | Read and write | Create and manage PRs |
| Secrets | Read and write | Manage agent secrets from web UI |
| Workflows | Read and write | Create and update workflow files |

---

## Docker Compose

For self-hosted deployment:

```bash
docker compose up -d
```

This starts Traefik (reverse proxy with SSL), the Event Handler (Node.js + PM2), and a self-hosted GitHub Actions runner.

To customize Docker Compose without losing changes on upgrade, set `COMPOSE_FILE=docker-compose.custom.yml` in `.env`. The custom file is scaffolded by init but never overwritten.
