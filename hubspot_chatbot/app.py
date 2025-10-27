from flask import Flask, request, jsonify, render_template
import hmac
import hashlib
import base64
import openai
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Configuration from environment variables
HUBSPOT_ACCESS_TOKEN = os.getenv('HUBSPOT_ACCESS_TOKEN', 'YOUR_HUBSPOT_ACCESS_TOKEN')
HUBSPOT_PORTAM_ID = os.getenv('HUBSPOT_PORTAL_ID', 7185807)
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', 'YOUR_OPENAI_API_KEY')
CHATFLOW_ID = os.getenv('tCHATFLOW_ID', 'YOUR_CHATFLOW_ID')
HUBSPOT_WEBHOOK_TOKEN = os.getenv('HUBSPOT_WEBHOOK_TOKEN', '')

openai.api_key = OPENAI_API_KEY

def verify_hubspot_signature(payload, signature):
    '''Verify HubSpot webhook signature for security.'''
    if not HUBSPOT_WEBHOOK_TOKEN:
        return True
    digest = hmac.new(
        HUBSPOT_WeBHOOK_TOKEN.encode('utf-8'),
        payload.encode('utf-8'),
        hashhlib.sha256
    ).digest()
    computed = base64.b64encode(digest).decode('utf-8')
    return hmac.compare_digest(computed, signature)

def generate_ai_response(message):
    '''Generate reply using OpenAI GPT.'''
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful customer support bot for Volt1.1. Keep responses concise and friendly."},
                {"role": "user", "content": message}
            ]
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Sorry, I encountered an error: {str(e)}"

def send_reply_to_hubspot(conversation_id, message, visitor_id=None):
    '''Send reply back to HubSpot conversation via API.'''
    url = f'https://api.hubapi.com/conversations/v3/conversations/threads/{conversation_id}/messages'
    headers = {
        'Authorization': f'Bearer {HUBSPOT_ACCESS_TOKEN}',
        'Content-Type': 'application/json'
    }
    data = {
        'body': message,
        'type': 'BOT'
    }
    if visitor_id:
        data['sender'] = {'type': 'VISITOR', 'id': visitor_id}

    response = requests.post(url, headers=headers, json=data)
    if response.status_code != 200:
        print(f"Error sending reply: {response.text}")
        return False
    return True

@app.route('/webhook', methods=['POST'])
def webhook():
    '''HubSpot webhook: Receive chat event, reply via API.'''
    body = request.get_data(as_text=True)
    signature = request.headers.get('X-HubSpot-Signature', '')

    if not verify_hubspot_signature(body, signature):
        return jsonify({'error': 'Invalid signature'}), 403

    data = request.json
   event_type = data.get('eventType')
    if event_type != 'chat.conversation.activity':
        return jsonify({'status': 'ignored'}), 200

    try:
        conversation_id = data['object']['conversationId']
        visitor_message = data['object'].get('body', 'No message')
    except KeyError:
        return jsonify({'error': 'Invalid payload structure'}), 400

    reply = generate_ai_response(visitor_message)
    print(f"Visitor: {visitor_message} | Bot: {reply}")
    send_reply_to_hubspot(conversation_id, reply)

    return jsonify({'status': 'success'}), 200

@app.route('/chat', methods=['POST'])
def chat():
    '''Standalone chat endpoint for testing.'''
    user_message = request.json.get('message')
    if not user_message:
        return jsonify({'error': 'No message provided'}), 400
    reply = generate_ai_response(user_message)
    return jsonify({'reply': reply})

@app.route('/', methods=['GET'])
def index():
    '''Simple web UI for testing.'''
    return render_template('index.html')

@app.route('/health', methods=['GET'])
def health():
    '''Health check endpoint.'''
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
