# API Reference

Complete API reference for the Fictures AI Server.

## Base URL

```
http://localhost:8000
```

## Generation Mode

The AI server operates in one of three modes based on the `AI_SERVER_GENERATION_MODE` environment variable:

| Mode | Endpoints Available | VRAM Usage | Use Case |
|------|---------------------|------------|----------|
| `text` | `/api/v1/text/*` only | ~10GB | Story writing, dialogue generation |
| `image` | `/api/v1/images/*` only | ~8GB | **Default** - Cover art, illustrations |
| `both` | All endpoints | 24GB+ | High-end GPUs only |

**Note**: Endpoints not available in the current mode will return 404.

---

## Authentication

**All API endpoints require authentication using API keys.**

The AI server validates API keys against the web application's PostgreSQL database, ensuring consistent authentication across all services. This simple database-only approach uses **2 database queries per request** for efficient authentication (~15-30ms overhead).

For complete authentication documentation, see [Authentication Guide](../general/authentication.md).

### Authentication Method

API keys must be provided via the `x-api-key` header:

```
x-api-key: YOUR_API_KEY
```

**Important**: The AI server ONLY accepts the `x-api-key` header. Do NOT use `Authorization: Bearer` for API keys.

### Required Scopes

Different endpoints require different permission scopes:

| Endpoint | Required Scope | Description |
|----------|----------------|-------------|
| `POST /api/v1/text/generate` | `stories:write` | Generate text |
| `POST /api/v1/text/stream` | `stories:write` | Stream text generation |
| `POST /api/v1/text/structured` | `stories:write` | Structured output generation |
| `GET /api/v1/text/models` | Any valid API key | List text models |
| `POST /api/v1/images/generate` | `stories:write` | Generate images |
| `GET /api/v1/images/models` | Any valid API key | List image models |

### Scope Hierarchy

- `admin:all` - Full access to all endpoints
- `stories:write` - Create and modify stories (implies `stories:read`)
- `stories:read` - Read story data only

### Error Responses

**401 Unauthorized** - Missing or invalid API key:
```json
{
  "detail": "API key required. Provide via 'x-api-key: YOUR_API_KEY' header"
}
```

**403 Forbidden** - Insufficient permissions:
```json
{
  "detail": "Insufficient permissions. Required scope: stories:write"
}
```

### Getting API Keys

API keys are managed through the web application at `/settings/api-keys`:

1. Navigate to `/settings/api-keys` in the web app
2. Create a new API key with required scopes (`stories:write` recommended)
3. Copy the generated key (shown only once)
4. Store securely (keys are hashed with bcrypt in the database)
5. Use the key in your requests to the AI server

**API Key Format**: `fic_<base64url>` (~47 characters total)

### Storing API Keys Locally

For local development and testing, store your API key in the `.auth/user.json` file:

**File Structure (.auth/user.json):**
```json
{
  "profiles": {
    "manager": {
      "email": "manager@example.com",
      "apiKey": "fic_your_manager_api_key_here"
    },
    "writer": {
      "email": "writer@example.com",
      "apiKey": "fic_your_writer_api_key_here"
    }
  }
}
```

**Important:**
- Create the `.auth` directory if it doesn't exist
- The `.auth` directory should be in `.gitignore` to prevent committing credentials
- All code examples in this documentation use `.auth/user.json` for API key storage

### Example Request

```bash
# Load API key from .auth/user.json
API_KEY=$(cat .auth/user.json | jq -r '.profiles.writer.apiKey')

curl -X POST "http://localhost:8000/api/v1/images/generate" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "width": 1664,
    "height": 928
  }'
```

---

## System Endpoints

### GET /

Root endpoint with API information.

**Response:**
```json
{
  "message": "Fictures AI Server",
  "version": "1.0.0",
  "description": "Local AI model serving for text and image generation",
  "endpoints": {
    "docs": "/docs",
    "redoc": "/redoc",
    "health": "/health",
    "models": "/api/v1/models"
  }
}
```

### GET /health

Health check endpoint with model status.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "generation_mode": "image",
  "models": {
    "image": {
      "name": "Qwen-Image FP8 + Lightning v2.0 4-step",
      "type": "image-generation",
      "framework": "ComfyUI",
      "device": "cuda",
      "initialized": true
    }
  }
}
```

### GET /api/v1/models

List all available models (based on current generation mode).

**Response (image mode):**
```json
{
  "generation_mode": "image",
  "image_generation": [
    {
      "name": "Qwen-Image FP8 + Lightning v2.0 4-step",
      "type": "image-generation",
      "framework": "ComfyUI",
      "device": "cuda",
      "initialized": true
    }
  ]
}
```

**Response (text mode):**
```json
{
  "generation_mode": "text",
  "text_generation": [
    {
      "name": "Qwen/Qwen3-14B-AWQ",
      "type": "text-generation",
      "framework": "vLLM",
      "max_tokens": 40960,
      "initialized": true
    }
  ]
}
```

---

## Text Generation Endpoints

**Available when**: `AI_SERVER_GENERATION_MODE=text`

### POST /api/v1/text/generate

Generate text using vLLM with Qwen3 model.

**Request Body:**
```json
{
  "prompt": "Write a short story about a magical forest",
  "max_tokens": 1024,
  "temperature": 0.8,
  "top_p": 0.9,
  "stop_sequences": ["\n\n", "THE END"]
}
```

**Parameters:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `prompt` | string | Yes | - | Text prompt for generation (max 50,000 chars) |
| `max_tokens` | integer | No | 2048 | Maximum tokens to generate (1-40,960) |
| `temperature` | float | No | 0.7 | Sampling temperature (0.0-2.0) |
| `top_p` | float | No | 0.9 | Nucleus sampling parameter (0.0-1.0) |
| `stop_sequences` | array | No | null | List of stop sequences |

**Response:**
```json
{
  "text": "Once upon a time, in a magical forest...",
  "model": "Qwen/Qwen3-14B-AWQ",
  "tokens_used": 512,
  "finish_reason": "stop"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `text` | string | Generated text |
| `model` | string | Model used for generation |
| `tokens_used` | integer | Number of tokens generated |
| `finish_reason` | string | Reason for completion: `stop`, `length`, `error` |

**cURL Example:**
```bash
# Load API key from .auth/user.json
API_KEY=$(cat .auth/user.json | jq -r '.profiles.writer.apiKey')

curl -X POST "http://localhost:8000/api/v1/text/generate" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "prompt": "Write a haiku about programming",
    "max_tokens": 50,
    "temperature": 0.7
  }'
```

**Python Example:**
```python
import httpx
import asyncio
import json
from pathlib import Path

async def generate_text():
    # Load API key from .auth/user.json
    auth_path = Path(".auth/user.json")
    with open(auth_path) as f:
        auth_data = json.load(f)
        api_key = auth_data["profiles"]["writer"]["apiKey"]

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/v1/text/generate",
            json={
                "prompt": "Write a haiku about programming",
                "max_tokens": 50,
                "temperature": 0.7,
            },
            headers={"x-api-key": api_key},
            timeout=300.0,
        )
        result = response.json()
        print(result["text"])

asyncio.run(generate_text())
```

### POST /api/v1/text/stream

Generate text with streaming response (Server-Sent Events).

**Request Body:** Same as `/api/v1/text/generate`

**Response:** Server-Sent Events stream

**Event Format:**
```
data: {"text": "Once upon", "model": "Qwen/Qwen3-14B-AWQ", "tokens_used": 3, "finish_reason": null, "done": false}

data: {"text": "Once upon a time", "model": "Qwen/Qwen3-14B-AWQ", "tokens_used": 5, "finish_reason": null, "done": false}

data: {"text": "Once upon a time, in a magical forest...", "model": "Qwen/Qwen3-14B-AWQ", "tokens_used": 512, "finish_reason": "stop", "done": true}
```

**Python Streaming Example:**
```python
import httpx
import asyncio
import json
from pathlib import Path

async def stream_text():
    # Load API key from .auth/user.json
    auth_path = Path(".auth/user.json")
    with open(auth_path) as f:
        auth_data = json.load(f)
        api_key = auth_data["profiles"]["writer"]["apiKey"]

    async with httpx.AsyncClient() as client:
        async with client.stream(
            "POST",
            "http://localhost:8000/api/v1/text/stream",
            json={
                "prompt": "Write a story about a robot",
                "max_tokens": 200,
                "temperature": 0.8,
            },
            headers={"x-api-key": api_key},
            timeout=300.0,
        ) as response:
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data = json.loads(line[6:])
                    print(data["text"], end="", flush=True)
                    if data["done"]:
                        break

asyncio.run(stream_text())
```

**JavaScript Fetch API Example:**
```javascript
const fs = require('fs').promises;
const path = require('path');

async function streamText() {
  // Load API key from .auth/user.json
  const authPath = path.join(process.cwd(), '.auth', 'user.json');
  const authData = JSON.parse(await fs.readFile(authPath, 'utf-8'));
  const apiKey = authData.profiles.writer.apiKey;

  const response = await fetch('http://localhost:8000/api/v1/text/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify({
      prompt: 'Write a story about a robot',
      max_tokens: 200,
      temperature: 0.8,
    }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        console.log(data.text);
        if (data.done) return;
      }
    }
  }
}

streamText();
```

### POST /api/v1/text/structured

Generate structured output using vLLM guided decoding.

This endpoint generates text that conforms to a specific structure (JSON schema, regex, etc.) using vLLM's guided decoding feature.

**Supported guided decoding types:**
- **json**: Generate output conforming to a JSON schema
- **regex**: Generate output matching a regular expression
- **choice**: Generate output that is one of the specified choices
- **grammar**: Generate output conforming to a context-free grammar

**Request Body:**
```json
{
  "prompt": "Generate a character profile for a fantasy wizard",
  "guided_decoding": {
    "type": "json",
    "schema": {
      "type": "object",
      "properties": {
        "name": {"type": "string"},
        "age": {"type": "integer"},
        "specialty": {"type": "string"}
      },
      "required": ["name", "age", "specialty"]
    }
  },
  "max_tokens": 500,
  "temperature": 0.7
}
```

**Parameters:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `prompt` | string | Yes | - | Text prompt for generation |
| `guided_decoding` | object | Yes | - | Guided decoding configuration |
| `guided_decoding.type` | string | Yes | - | Type: `json`, `regex`, `choice`, `grammar` |
| `guided_decoding.schema` | object | Conditional | - | JSON schema (required for type `json`) |
| `guided_decoding.pattern` | string | Conditional | - | Regex pattern (required for type `regex`) |
| `guided_decoding.choices` | array | Conditional | - | Valid choices (required for type `choice`) |
| `guided_decoding.grammar` | string | Conditional | - | CFG grammar (required for type `grammar`) |
| `max_tokens` | integer | No | 2048 | Maximum tokens to generate |
| `temperature` | float | No | 0.7 | Sampling temperature |
| `top_p` | float | No | 0.9 | Nucleus sampling parameter |

**Response:**
```json
{
  "output": "{\"name\": \"Gandalf\", \"age\": 2019, \"specialty\": \"Fire magic\"}",
  "parsed_output": {
    "name": "Gandalf",
    "age": 2019,
    "specialty": "Fire magic"
  },
  "model": "Qwen/Qwen3-14B-AWQ",
  "tokens_used": 45,
  "finish_reason": "stop",
  "is_valid": true
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `output` | string | Raw generated output |
| `parsed_output` | object | Parsed JSON output (only for JSON type) |
| `model` | string | Model used for generation |
| `tokens_used` | integer | Number of tokens used |
| `finish_reason` | string | Reason for completion |
| `is_valid` | boolean | Whether output conforms to schema/pattern |

**Choice Example:**
```json
{
  "prompt": "Classify this text sentiment: 'I love this product!'",
  "guided_decoding": {
    "type": "choice",
    "choices": ["positive", "negative", "neutral"]
  }
}
```

**Regex Example:**
```json
{
  "prompt": "Generate a US phone number:",
  "guided_decoding": {
    "type": "regex",
    "pattern": "\\d{3}-\\d{3}-\\d{4}"
  }
}
```

### GET /api/v1/text/models

List available text generation models.

**Response:**
```json
{
  "models": [
    {
      "id": "Qwen/Qwen3-14B-AWQ",
      "name": "Qwen/Qwen3-14B-AWQ",
      "type": "text-generation",
      "framework": "vLLM",
      "max_tokens": 40960,
      "status": "initialized"
    }
  ]
}
```

---

## Image Generation Endpoints

**Available when**: `AI_SERVER_GENERATION_MODE=image`

### POST /api/v1/images/generate

Generate image using Qwen-Image-Lightning via ComfyUI.

**Request Body:**
```json
{
  "prompt": "A serene mountain landscape at sunset, digital art",
  "negative_prompt": "blurry, low quality, distorted",
  "width": 1664,
  "height": 928,
  "num_inference_steps": 4,
  "guidance_scale": 1.0,
  "seed": 42
}
```

**Qwen-Image-Lightning Supported Resolutions:**
| Aspect Ratio | Dimensions | Description |
|--------------|------------|-------------|
| 1:1 | 1328×1328 | Square |
| 16:9 | 1664×928 | Widescreen (default) |
| 9:16 | 928×1664 | Portrait |
| 4:3 | 1472×1140 | Classic |
| 3:4 | 1140×1472 | Portrait classic |

**Parameters:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `prompt` | string | Yes | - | Text prompt for image generation |
| `negative_prompt` | string | No | null | Features to avoid in the image |
| `width` | integer | No | 1664 | Image width in pixels (256-2048) |
| `height` | integer | No | 928 | Image height in pixels (256-2048) |
| `num_inference_steps` | integer | No | 4 | Denoising steps (Lightning v2.0: 4 steps optimal) |
| `guidance_scale` | float | No | 1.0 | Prompt adherence (Lightning: 1.0) |
| `seed` | integer | No | random | Random seed for reproducibility |

**Response:**
```json
{
  "image_url": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "model": "Qwen-Image FP8 + Lightning v2.0 4-step",
  "width": 1664,
  "height": 928,
  "seed": 42
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `image_url` | string | Base64 encoded PNG image with data URL prefix |
| `model` | string | Model used for generation |
| `width` | integer | Generated image width |
| `height` | integer | Generated image height |
| `seed` | integer | Seed used for generation |

**cURL Example:**
```bash
# Load API key from .auth/user.json
API_KEY=$(cat .auth/user.json | jq -r '.profiles.writer.apiKey')

curl -X POST "http://localhost:8000/api/v1/images/generate" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "width": 1664,
    "height": 928,
    "num_inference_steps": 4,
    "seed": 42
  }' > response.json

# Extract and save image
python -c "import json, base64; data = json.load(open('response.json')); img = data['image_url'].split(',')[1]; open('output.png', 'wb').write(base64.b64decode(img))"
```

**Python Example:**
```python
import httpx
import asyncio
import base64
import json
from pathlib import Path

async def generate_image():
    # Load API key from .auth/user.json
    auth_path = Path(".auth/user.json")
    with open(auth_path) as f:
        auth_data = json.load(f)
        api_key = auth_data["profiles"]["writer"]["apiKey"]

    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(
            "http://localhost:8000/api/v1/images/generate",
            json={
                "prompt": "A beautiful sunset over mountains, digital art",
                "negative_prompt": "blurry, low quality",
                "width": 1664,
                "height": 928,
                "num_inference_steps": 4,
                "guidance_scale": 1.0,
                "seed": 42,
            },
            headers={"x-api-key": api_key},
        )

        result = response.json()

        # Save image
        image_data = result["image_url"].split(",")[1]
        image_bytes = base64.b64decode(image_data)
        Path("output.png").write_bytes(image_bytes)

        print(f"Image saved! Seed: {result['seed']}")

asyncio.run(generate_image())
```

**JavaScript Example:**
```javascript
const fs = require('fs').promises;
const path = require('path');

async function generateImage() {
  // Load API key from .auth/user.json
  const authPath = path.join(process.cwd(), '.auth', 'user.json');
  const authData = JSON.parse(await fs.readFile(authPath, 'utf-8'));
  const apiKey = authData.profiles.writer.apiKey;

  const response = await fetch('http://localhost:8000/api/v1/images/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify({
      prompt: 'A beautiful sunset over mountains, digital art',
      negative_prompt: 'blurry, low quality',
      width: 1664,
      height: 928,
      num_inference_steps: 4,
      guidance_scale: 1.0,
      seed: 42,
    }),
  });

  const result = await response.json();

  // For Node.js: Save image to file
  const imageData = result.image_url.split(',')[1];
  const imageBuffer = Buffer.from(imageData, 'base64');
  await fs.writeFile('output.png', imageBuffer);

  console.log(`Image saved! Seed: ${result.seed}`);
}

generateImage();
```

### GET /api/v1/images/models

List available image generation models.

**Response:**
```json
{
  "models": [
    {
      "id": "Qwen-Image FP8 + Lightning v2.0 4-step",
      "name": "Qwen-Image FP8 + Lightning v2.0 4-step",
      "type": "image-generation",
      "framework": "ComfyUI",
      "device": "cuda",
      "status": "initialized"
    }
  ]
}
```

---

## Error Responses

All endpoints return standard HTTP error codes with JSON error messages.

**Error Format:**
```json
{
  "detail": "Error message description"
}
```

**Common Error Codes:**

| Code | Meaning | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid parameters (e.g., prompt too long, width > 2048) |
| 401 | Unauthorized | Missing or invalid API key |
| 403 | Forbidden | Valid API key but insufficient permissions |
| 404 | Not Found | Endpoint not available in current generation mode |
| 422 | Unprocessable Entity | Validation error (e.g., wrong type) |
| 500 | Internal Server Error | Server error during generation |
| 503 | Service Unavailable | Model not loaded or GPU error |

**Example Error Responses:**

```json
{
  "detail": "Prompt too long (max 50000 characters)"
}
```

```json
{
  "detail": "Width too large (max 2048 pixels)"
}
```

```json
{
  "detail": "JSON schema required for type 'json'"
}
```

---
