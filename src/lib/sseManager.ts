import { Response } from 'express';
import { redisSubscriber } from './redis';

interface SSEClient {
    userId: number;
    response: Response;
    projectIds?: number[]; // Optional: if user should only see specific projects
}

class SSEManager {
    private clients: Map<string, SSEClient> = new Map();
    private isSubscribed = false;

    constructor() {
        this.setupRedisSubscription();
    }

    private setupRedisSubscription() {
        if (this.isSubscribed) return;

        
    }

    addClient(clientId: string, userId: number, response: Response, projectIds?: number[]) {
        // Set SSE headers
        response.setHeader('Content-Type', 'text/event-stream');
        response.setHeader('Cache-Control', 'no-cache');
        response.setHeader('Connection', 'keep-alive');
        response.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

        // Send initial connection message
        response.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

        this.clients.set(clientId, { userId, response, projectIds });

        console.log(`SSE client connected: ${clientId}, userId: ${userId}, total clients: ${this.clients.size}`);

        // Handle client disconnect
        response.on('close', () => {
            this.removeClient(clientId);
        });
    }

    removeClient(clientId: string) {
        this.clients.delete(clientId);
        console.log(`SSE client disconnected: ${clientId}, remaining clients: ${this.clients.size}`);
    }


    // Send heartbeat to keep connections alive
    sendHeartbeat() {
        this.clients.forEach((client, clientId) => {
            try {
                client.response.write(`:heartbeat\n\n`);
            } catch (error) {
                console.error(`Heartbeat failed for client ${clientId}:`, error);
                this.removeClient(clientId);
            }
        });
    }

    getClientCount(): number {
        return this.clients.size;
    }
}

export const sseManager = new SSEManager();

// Send heartbeat every 30 seconds to keep connections alive
setInterval(() => {
    sseManager.sendHeartbeat();
}, 30000);