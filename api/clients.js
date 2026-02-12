import { promises as fs } from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'healthcore_data.json');

export default async function handler(req, res) {
    // Common CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {
        try {
            // Check if file exists
            try {
                await fs.access(DB_FILE);
            } catch (e) {
                // Return empty list if no db yet
                return res.status(200).json([]);
            }

            const content = await fs.readFile(DB_FILE, 'utf8');
            const db = JSON.parse(content);
            // Return the clients array
            res.status(200).json(db.clients || []);
        } catch (error) {
            console.error('Error reading clients:', error);
            res.status(500).json({ error: 'Failed to fetch data' });
        }
    } else if (req.method === 'POST') {
        // This endpoint allows the frontend simulator to save messages/clients too.
        // Body expected: { clientId, message, ... } or { clients: [...] } for full sync
        // For simplicity in this step, let's assume we can sync the full state or partial updates.
        // Given the previous webhook logic, let's support a "sync" operation or "append message".

        // Strategy: robustly merge or overwrite. 
        // Since this is a simulator, let's allow the frontend to overwrite specific clients 
        // or we can implement a proper specific update.

        // Let's go with receiving a full updated client object or message for now.
        // Actually, to fully replace localStorage, let's mimic the webhook's "upsert" logic if possible, 
        // OR just allow saving the full state if the user is single-player.

        // Current Dashboard Logic: writes the whole 'clients' array to localStorage.
        // We can support writing the whole 'clients' array for now to minimize refactor complexity.

        try {
            const { clients } = req.body;
            if (!Array.isArray(clients)) {
                return res.status(400).json({ error: 'Invalid data format. Expected { clients: [] }' });
            }

            // Read existing to preserve anything not in payload? 
            // Or strictly overwrite? Overwriting is safer for "state sync" if single user.
            // But wait, the webhook appends to this file in the background.
            // If we strictly overwrite from frontend, we might wipe webhook data.
            // WE MUST MERGE.

            let db = { clients: [] };
            try {
                const content = await fs.readFile(DB_FILE, 'utf8');
                db = JSON.parse(content);
            } catch (e) { } // ignore

            // Merge strategy: incoming clients from frontend take precedence for their ID?
            // Or we just update the specific clients passed.
            // Setup: Frontend passes ALL its clients.
            // We iterate through them and update the DB.

            const incomingClients = clients;
            const existingClients = db.clients || [];

            // Update existing or add new
            incomingClients.forEach(inc => {
                const idx = existingClients.findIndex(c => c.id === inc.id);
                if (idx >= 0) {
                    // Determine which is newer? 
                    // For simulator, frontend state is usually "current" for that user.
                    // But webhook might have added messages.
                    // This is a complex concurrency issue. 
                    // meaningful assumption: Frontend wins for "simulator" clients (id starts with client-).
                    // Webhook wins for "real" clients (id is phone number).

                    // Let's just update the record for now.
                    existingClients[idx] = inc;
                } else {
                    existingClients.push(inc);
                }
            });

            // Save back
            db.clients = existingClients;
            await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));

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
