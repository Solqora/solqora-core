# Solqora Core

OpenAI-compatible API gateway for 40+ LLM providers. Pay with USDC on Solana.

Drop-in replacement for the OpenAI SDK. Change `baseURL`, keep your code.

## Providers

OpenAI, Anthropic Claude, Google Gemini, DeepSeek, Azure OpenAI, AWS Bedrock, Groq, Together AI, Mistral, Cohere, xAI, Ollama, Cloudflare Workers AI, Novita, SiliconCloud, Moonshot, Zhipu GLM, Baidu Wenxin, Alibaba Tongyi, ByteDance Doubao, Tencent Hunyuan, 360 Zhinao, Minimax, and more.

## Quick start

```bash
git clone https://github.com/Solqora/solqora-core.git
cd solqora-core
docker compose up -d
```

Open http://localhost:3000, login with `root` / `123456`.

## API

```python
from openai import OpenAI

client = OpenAI(
    api_key="qora...",
    base_url="https://api.solqora.ai/v1"
)

response = client.chat.completions.create(
    model="deepseek-chat",
    messages=[{"role": "user", "content": "Hello"}]
)
```

Same works with any OpenAI-compatible SDK: JavaScript, Go, Rust, curl.

Streaming, function calling, and vision requests are proxied as-is to the upstream provider.

## How it works

```
POST /v1/chat/completions
    |
    v
Auth middleware (check API key, balance)
    |
    v
Rate limiter
    |
    v
Pre-consume quota (reserve estimated cost)
    |
    v
Route to provider (load balanced across channels)
    |
    v
Return response to client
    |
    v
Post-consume (charge actual tokens, release reserve)
```

## Features

- **OpenAI-compatible API** - works with any OpenAI SDK or tool
- **Per-user API keys** - model restrictions, IP whitelist, rate limits per key
- **Pre-consume quota** - reserves cost before request, finalizes after response. No overspend
- **Load balancing** - multiple channels per provider, auto failover
- **Billing** - Stripe, EPay, Creem, Solana USDC. Usage-based accounting with token-level granularity
- **Multi-tenant** - user groups, channel groups, custom pricing per group
- **Auth** - email, passkeys, OAuth (GitHub, Discord, Telegram, OIDC), 2FA
- **Usage dashboard** - per-request logs, token counts, cost breakdowns
- **Admin panel** - channel management, model pricing, system settings
- **Docker** - single `docker compose up -d`

## Databases

SQLite (default), MySQL, PostgreSQL. All three supported interchangeably.

## Tech

Go 1.25, Gin, GORM v2, Redis. React 19, TypeScript, Rsbuild, Tailwind CSS on the frontend.

JWT for API auth. WebAuthn/Passkeys for dashboard login. go-i18n for i18n (en, zh, fr, ru, ja, vi).

## Docs

[docs.solqora.ai](https://docs.solqora.ai)

## License

MIT
