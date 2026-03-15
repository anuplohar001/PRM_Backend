
import { prisma } from "./prisma"


type LogInput = {
    userId?: number
    endpoint?: string
    method?: string
    metadata?: any
}

export const logToDB = async ({
    userId,
    endpoint,
    method,
    metadata
}: LogInput) => {
    try {
        
    } catch (error) {
        console.error("Failed to write log", error)
    }
}