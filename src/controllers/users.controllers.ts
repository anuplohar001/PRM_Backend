import { prisma } from '../utils/prisma'
import { Request, Response } from 'express'
import bcrypt from 'bcrypt' 
import jwt from "jsonwebtoken"

export const createUser = async (req: Request, res: Response) => {
    try {
        const { email, name, password, confirmPassword } = req.body
      
        if (password !== confirmPassword) {
            return res.status(400).json({
                message: "Passwords do not match"
            })
        }

        const existingUser = await prisma.users.findUnique({
            where: { email }
        })

        if (existingUser) {
            return res.status(400).json({
                message: "Email already exists"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = await prisma.users.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: 'USER'
            }
        })
        console.log(newUser)
        res.status(201).json(newUser)

    } catch (error: any) {

        if (error.code === "P2002") {
            return res.status(400).json({
                message: "Email already exists"
            })
        }

        res.status(500).json({
            message: "Internal server error"
        })
    }
}



export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" })
        }

        const user = await prisma.users.findUnique({
            where: { email }
        })

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" })
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: "7d" }
        )

        return res.status(200).json({
            message: "Login successful",
            token,
            user
        })
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error })
    }
}