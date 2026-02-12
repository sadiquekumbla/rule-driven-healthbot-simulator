import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req, res) {
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
            res.sendStatus(400); // Bad Request if parameters are missing
        }
    } else if (req.method === 'POST') {
        // Handle incoming messages
        try {
            const body = req.body;

            // Extract messages based on the structure: entry -> changes -> value -> messages
            if (body.object === 'whatsapp_business_account') {
                if (body.entry && body.entry.length > 0) {
                    const entry = body.entry[0];
                    if (entry.changes && entry.changes.length > 0) {
                        const changes = entry.changes[0];
                        if (changes.value && changes.value.messages && changes.value.messages.length > 0) {
                            const message = changes.value.messages[0];

                            const phoneNumberId = changes.value.metadata.phone_number_id;
                            const from = message.from;

                            // Handle text or other media types gracefully
                            let messageBody = '';
                            if (message.type === 'text') {
                                messageBody = message.text.body;
                            } else {
                                messageBody = `[${message.type.toUpperCase()}]`;
                                // Add simple handling for other types if needed (e.g. caption)
                                if (message[message.type] && message[message.type].caption) {
                                    messageBody += ` ${message[message.type].caption}`;
                                }
                            }

                            const messageType = message.type;
                            // Use message timestamp or current time
                            const timestamp = message.timestamp ? new Date(parseInt(message.timestamp) * 1000) : new Date();

                            console.log(`Received message from ${from}: ${messageBody} (Type: ${messageType})`);

                            // Save to "Real" Database (File System for Simulator)
                            await saveToDatabase({
                                phoneNumberId,
                                from,
                                messageBody,
                                messageType,
                                timestamp,
                                rawMessage: message
                            });
                        }
                    }
                }
            }

            // Always return 200 OK
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

// "Real" Database Implementation using File System to simulate persistence
// This acts as the shared database that the dashboard *should* read from.
async function saveToDatabase(data) {
    const { phoneNumberId, from, messageBody, messageType, timestamp, rawMessage } = data;

    // Use a JSON file in the project root to persist data
    // NOTE: In a Vercel production environment, this file is ephemeral. 
    // For production, replace this FS logic with MongoDB/Postgres/Firebase.
    const DB_FILE = path.join(process.cwd(), 'healthcore_data.json');

    let db = { clients: [] };

    try {
        // Try to read existing database
        // We check access first to avoid throwing on missing file
        try {
            await fs.access(DB_FILE);
            const content = await fs.readFile(DB_FILE, 'utf8');
            db = JSON.parse(content);
        } catch (e) {
            // File doesn't exist or is invalid, use default empty db
            console.log("Creating new database file at", DB_FILE);
        }

        // 1. Find or Create Client (Sender & Conversation ID)
        let clientIndex = db.clients.findIndex(c => c.id === from);
        let client;

        if (clientIndex === -1) {
            // New Client
            client = {
                id: from, // Using Phone Number as Client ID (Conversation ID)
                name: `Lead ${from.slice(-4)}`,
                messages: [],
                context: {
                    age: null, height: null, weight: null, bmi: null, bmiCategory: null,
                    medicalConditions: null, suggestedCourse: null, priceQuote: null, stage: 'GREETING'
                },
                createdAt: new Date().toISOString(),
                lastMessageAt: new Date().toISOString()
            };
            db.clients.push(client);
        } else {
            client = db.clients[clientIndex];
        }

        // 2. Format Message Record
        const newMessage = {
            id: rawMessage.id || `msg-${Date.now()}`,
            role: 'user',
            text: messageBody,
            timestamp: timestamp instanceof Date ? timestamp.toISOString() : timestamp,
            type: messageType,
            // Store raw metadata if needed for debugging
            metadata: {
                wamid: rawMessage.id,
                phoneNumberId: phoneNumberId
            }
        };

        // 3. Append and Update
        // Check if message already exists to avoid dupes (common with webhooks)
        const msgExists = client.messages.some(m => m.id === newMessage.id);
        if (!msgExists) {
            client.messages.push(newMessage);
            client.lastMessageAt = newMessage.timestamp;

            // Update global DB state
            // (client reference is already inside db.clients array)

            // 4. Persist to Disk
            await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
            console.log(`[DB] Saved message from ${from} to ${DB_FILE}`);
        } else {
            console.log(`[DB] Duplicate message skipped: ${newMessage.id}`);
        }

    } catch (err) {
        console.error('[DB] Save Failed:', err);
        throw err; // Re-throw to ensure the webhook knows it failed (though we catch in handler)
    }
}
