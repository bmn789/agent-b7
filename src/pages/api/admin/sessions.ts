import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../lib/db';

export const GET: APIRoute = async () => {
    try {
        const { db } = await connectToDatabase();

        const chatDocs = await db.collection('chats')
            .find({})
            .sort({ updatedAt: -1, expiresAt: -1 })
            .toArray();

        const sessions = chatDocs.map((doc) => {
            const expiresAt = doc.expiresAt ? (doc.expiresAt instanceof Date ? doc.expiresAt : new Date(doc.expiresAt)) : null;
            
            const updatedAt = doc.updatedAt 
                ? (doc.updatedAt instanceof Date ? doc.updatedAt : new Date(doc.updatedAt)) 
                : (expiresAt || new Date());
                
            const createdAt = doc.createdAt 
                ? (doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt)) 
                : (expiresAt ? new Date(expiresAt.getTime() - 24 * 60 * 60 * 1000) : new Date());

            return {
                sessionId: doc.sessionId,
                messageCount: Array.isArray(doc.messages) ? doc.messages.length : 0,
                createdAt: createdAt.toISOString(),
                updatedAt: updatedAt.toISOString(),
            };
        });

        return Response.json({ sessions });
    } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 });
    }
};
