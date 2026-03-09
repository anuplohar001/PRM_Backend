import {CorsOptions} from 'cors'

const allowedOrigin = process.env.CLIENT_URL
export const corsOptions: CorsOptions = { 
    
    origin: (origin: string | undefined, callback) => {
        if (!origin || origin === allowedOrigin) {
            callback(null, true)
        } else {
            callback(new Error("Not allowed by CORS"))
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400
}