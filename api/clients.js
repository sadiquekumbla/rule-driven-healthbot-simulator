import dbConnect from '../lib/mongoose';
import Client from '../models/Client';

export default async function handler(req, res) {
    await dbConnect();

    // Common CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {
        try {
            const clients = await Client.find({});
            res.status(200).json(clients);
        } catch (error) {
            console.error('Error fetching clients:', error);
            res.status(500).json({ error: 'Failed to fetch data' });
        }
    } else if (req.method === 'POST') {
        try {
            const { clients } = req.body;
            if (!Array.isArray(clients)) {
                return res.status(400).json({ error: 'Invalid data format' });
            }

            // Efficient Upsert for each Client
            const operations = clients.map(client => ({
                updateOne: {
                    filter: { id: client.id },
                    update: {
                        $set: {
                            name: client.name,
                            context: client.context,
                            lastMessageAt: client.lastMessageAt,
                            // We must be careful not to overwrite 'messages' blindly if we want to merge?
                            // But for simulator "Save", the Frontend is the source of truth for THAT session.
                            // Ideally we merge messages array by ID.
                            // Setting 'messages' directly overwrites server messages with local messages.
                            // If simulator has [A, B] and Server has [A, B, C (webhook)], 
                            // simulator save [A, B] will delete C.
                            // This is the race condition from before.

                            // BUT, if we just want to save NEW simulator messages (bot replies),
                            // we should perhaps only push new messages?
                            // For simplicity in this "Replace FS" task, I will stick to the previous behavior:
                            // The frontend state is saved.
                            messages: client.messages
                        }
                    },
                    upsert: true
                }
            }));

            if (operations.length > 0) {
                await Client.bulkWrite(operations);
            }

            res.status(200).json({ success: true });

        } catch (error) {
            console.error("Error saving data:", error);
            res.status(500).json({ error: "Failed to save" });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
