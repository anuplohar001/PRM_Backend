import { NextFunction, Response } from "express"
import { AuthRequest } from "../middlewares/auth.middleware"

const asyncHandler = (
    fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<any>
) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            await fn(req, res, next)
        } catch (error) {
            next(error) // ✅ better than res.status(500)
        }
    }
}

export default asyncHandler