# Bolt

This repository contains the Bolt application.

## Usage

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root with your Supabase credentials and the API key encryption secret:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_MANUAL_KEY=your-service-role-key
VITE_API_KEY_ENCRYPTION_KEY=base64-encoded-32-byte-key
API_KEY_ENCRYPTION_KEY=base64-encoded-32-byte-key
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run lint checks:

```bash
npm run lint
```

## API Key Encryption

API keys are stored encrypted using AES-GCM. The encryption key is provided via the `API_KEY_ENCRYPTION_KEY` environment variable and should be managed using a secrets manager or other secure server-side mechanism. The same base64-encoded key (256 bits) must be available to both the Supabase Edge Functions and the frontend build (`VITE_API_KEY_ENCRYPTION_KEY`).

Encryption produces a value formatted as `iv:ciphertext`, where both parts are Base64 encoded. The initialization vector (IV) is randomly generated for each encryption operation. To decrypt, split the stored string on the colon, Base64-decode the IV and ciphertext, and use the configured key with AES-GCM.

## Equipment

### Forklifts

- Forklift (5k)
- Forklift (8k)
- Forklift (15k)
- Forklift (30k)
- Forklift – Hoist 18/26
- Versalift 25/35
- Versalift 40/60
- Versalift 60/80
- Trilifter

### Tractors

- 3-axle tractor
- 4-axle tractor
- Rollback

### Trailers

- Dovetail
- Flatbed
- Lowboy
- Step Deck

### Material Handling & Rigging

- Material Handler
- 1-ton Gantry
- 5-ton Gantry
- 8'x20' Metal Plate
- 8'x10' Metal Plate

