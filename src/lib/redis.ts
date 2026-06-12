import Redis from 'ioredis';

// Publisher - for publishing events
export const redisPublisher = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    // password: process.env.REDIS_PASSWORD,
    // Add these for better reliability
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3,
});

// Subscriber - for receiving events
export const redisSubscriber = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    // password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3,
});

redisPublisher.on('error', (err) => console.error('Redis Publisher Error:', err));
redisSubscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));