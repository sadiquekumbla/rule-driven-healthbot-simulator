import type { VercelRequest, VercelResponse } from '@vercel/node';

// Default token for ease of setup. 
// In production, you should set WHATSAPP_VERIFY_TOKEN in Vercel Environment Variables.
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'mysecrettoken123';

export default function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    console.log(`Received ${request.method} request to /api/webhook`);

    if (request.method === 'GET') {
        return verifyWebhook(request, response);
    }

    if (request.method === 'POST') {
        return handleWebhook(request, response);
    }

    return response.status(405).json({ error: 'Method not allowed' });
}

function verifyWebhook(request: VercelRequest, response: VercelResponse) {
    const mode = request.query['hub.mode'];
    const token = request.query['hub.verify_token'];
    const challenge = request.query['hub.challenge'];

    console.log('Verification params:', { mode, token, challenge });

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            // WhatsApp expects just the challenge string, not JSON
            response.status(200).send(challenge);
            return;
        } else {
            console.log('Verification failed: Token mismatch');
            response.status(403).send('Forbidden');
            return;
        }
    }
    response.status(400).send('Bad Request: Missing mode or token');
}

function handleWebhook(req: VercelRequest, res: VercelResponse) {
    const body = req.body;

    console.log('Incoming webhook body:', JSON.stringify(body, null, 2));

    // WhatsApp API often sends a check with object = 'whatsapp_business_account'
    if (body.object) {
        // Process messages here
        if (body.entry && body.entry.length > 0) {
            // Just log for now
            console.log('Entry received');
        }

        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.status(404).send('Not Found');
    }
}
