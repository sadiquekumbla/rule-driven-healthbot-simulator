import dbConnect from '../lib/mongoose';
import Client from '../models/Client';

export default async function handler(req, res) {
    // Database Connection
    await dbConnect();

    if (req.method === 'GET') {
        // Webhook verification
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode && token) {
            if (mode === 'subscribe' && token === (process.env.VERIFY_TOKEN || 'mysecrettoken123')) {
                console.log('WEBHOOK_VERIFIED');
                res.status(200).send(challenge);
            } else {
                res.sendStatus(403);
            }
        } else {
            res.sendStatus(400); // Bad Request
        }
    } else if (req.method === 'POST') {
        // Handle incoming messages
        try {
            const body = req.body;

            // Extract messages: entry -> changes -> value -> messages
            if (body.object === 'whatsapp_business_account') {
                if (body.entry && body.entry.length > 0) {
                    const entry = body.entry[0];
                    if (entry.changes && entry.changes.length > 0) {
                        const changes = entry.changes[0];
                        if (changes.value && changes.value.messages && changes.value.messages.length > 0) {
                            const message = changes.value.messages[0];

                            const phoneNumberId = changes.value.metadata.phone_number_id;
                            const from = message.from;

                            let messageBody = '';
                            if (message.type === 'text') {
                                messageBody = message.text.body;
                            } else {
                                messageBody = `[${message.type.toUpperCase()}]`;
                                if (message[message.type] && message[message.type].caption) {
                                    messageBody += ` ${message[message.type].caption}`;
                                }
                            }

                            const type = message.type;
                            const timestamp = message.timestamp ? new Date(parseInt(message.timestamp) * 1000) : new Date();

                            console.log(`Received message from ${from}: ${messageBody}`);

                            // Upsert Client & Push Message
                            try {
                                // Find client by 'from' (phone number)
                                let client = await Client.findOne({ id: from });

                                if (!client) {
                                    client = new Client({
                                        id: from,
                                        name: `Lead ${from.slice(-4)}`,
                                        messages: [],
                                        lastMessageAt: timestamp
                                    });
                                } else {
                                    client.lastMessageAt = timestamp;
                                }

                                // Check for duplicate message ID (dedupe)
                                const msgExists = client.messages.some(m => m.id === message.id);
                                if (!msgExists) {
                                    client.messages.push({
                                        id: message.id,
                                        role: 'user',
                                        text: messageBody,
                                        timestamp: timestamp,
                                        type: type,
                                        metadata: {
                                            phoneNumberId
                                        }
                                    });
                                    await client.save();
                                    console.log(`[DB] Saved message from ${from}`);
                                } else {
                                    console.log(`[DB] Duplicate message skipped: ${message.id}`);
                                }

                            } catch (dbError) {
                                console.error("Database Save Error:", dbError);
                                // Don't crash the webhook response
                            }
                        }
                    }
                }
            }

            res.status(200).send('EVENT_RECEIVED');
        } catch (error) {
            console.error('Error processing webhook:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
