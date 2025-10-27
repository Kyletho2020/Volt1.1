# HubSpot Chatbot for Volt1.1

A Flask-based chatbot that integrates with HubSpot conversations using OpenAI GPT for intelligent responses.

## Features

- Receives messages from HubSpot chatflows via webhooks
-- Generates AI-powered responses using OpenAI GPT-3.5
- Sends replies back to HubSpot conversations
- Simple web UI for testing
- Health check endpoint
- Webhook signature verification for security

## Prerequisites

- Python 3.8+
- GitHub account (Volt1.1 repository)
- OpenAI API key
- HubSpot account with Private App credentials
- ngrok for local testing

## Quick Start

### 1: Create HubSpot Private App

1. Settings > Integrations > Private Apps > Create app
2. Add scopes: conversations.read, conversations.write, chat.read, chat.write
3. Copy ACCESS_TOKEN

### 2: Create HUbScpot Chatflow
(‹Š1. Conversations > Chatflows > Create chatflow
2. Select "Rule-based Bot"
3. Add "Trigger webhook" action: POTT to your webhook endpoint
4. Note your Chatflow ID from URL

### 3: Environment Setup

`b``bash
cd hubspot_chatbot
cp .env.example .env
âœˆ Edit .env with your tokens
pip install -r requirements.txt
  ```

### 4: Test Locally

&#####```bash
ngrok http 5000
# Update HubSpot webhook URL to: https://your-ngrok-url/webhook
python app.py
# Visit http://localhost:5000
```

## API Endpoints

- GET `/` - Web UI for testing
- POST `/chat` - Chat endpoint for testing
- POST `/webhook` - HubSpot webhook receiver
- GET `/health` - Health check

## Deployment

Deploy to Heroku, AWS, Google Cloud, or any Python hosting.

## License

MIT