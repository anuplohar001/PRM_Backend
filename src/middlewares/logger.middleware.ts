import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { prisma } from "../utils/prisma"

export const requestLogger = (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    let userId: number | null = null
    const authHeader = req.headers.authorization

    if (authHeader?.startsWith("Bearer ")) {
        try {
            const token = authHeader.split(" ")[1]

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET as string
            ) as { userId: number }

            userId = decoded.userId
        } catch { }
    }

    res.on("finish", async () => {
        try {
            const log = await prisma.log.create({
                data: {
                    userId,
                    endpoint: req.originalUrl,
                    method: req.method,
                    metadata: req.body
                }
            })
        } catch (error) {
            console.error("Logging failed", error)
        }
    })
    next()
}