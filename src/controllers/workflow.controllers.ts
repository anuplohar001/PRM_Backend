import { Response } from "express"
import { prisma } from '../utils/prisma'
import { AuthRequest } from "../middlewares/auth.middleware"
import asyncHandler from "../utils/async-handler"



export const createWorkflow = asyncHandler(
    async (req:AuthRequest, res: Response) => {

        const { name, description, projectId, position } = req.body
        const userId = req.user?.userId

        if (!userId) {
            return res.status(401).json({ message: "Unauthorised" })
        }
        const workflow = await prisma.workFlow.create({
            data: {
                name,
                description,
                position: Number(position),
                projectId: Number(projectId)
            }
        })

        res.status(201).json({
            message: "Workflow created successfully",
            workflow
        })

    }
)


export const getProjectWorkflow = asyncHandler(
    async (req: AuthRequest, res: Response) => {

        const { projectId } = req.params
        const userId = req.user?.userId

        if (!userId) {
            return res.status(401).json({ message: "Unauthorised" })
        }
        const workflow = await prisma.workFlow.findMany({
            where: {
                projectId: Number(projectId)
            },
            orderBy: {
                position: 'asc' 
            }
        })

        res.status(201).json({
            message: "Project workflow fetched successfully",
            data:{
                workflows: workflow
            }
        })


    }
)


export const getWorkflow = asyncHandler(
    async (req: AuthRequest, res: Response) => {

        const { workflowId } = req.params
        const userId = req.user?.userId

        if (!userId) {
            return res.status(401).json({ message: "Unauthorised" })
        }
        const workflow = await prisma.workFlow.findUnique({
            where: {
                id: Number(workflowId)
            }
        })

        res.status(201).json({
            message: "Workflow fetched successfully",
            data:{
                workflow
            }
        })


    }
)



export const deleteWorkflow = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const { workflowId, projectId } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorised" });
        }

        const existingWorkflow = await prisma.workFlow.findUnique({
            where: {
                id: Number(workflowId),
                projectId: Number(projectId)
            },
        });

        if (!existingWorkflow) {
            return res.status(404).json({ message: "Workflow not found" });
        }

        await prisma.workFlow.delete({
            where: {
                id: Number(workflowId),
                projectId: Number(projectId)
            },
        });

        res.status(200).json({
            message: "Workflow deleted successfully",
        });
    }
);

export const updateWorkflow = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const { id, name, description, projectId, position } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorised" });
        }

        const workflowId = Number(id);
        const newPosition = Number(position);
        const projId = Number(projectId);

        const existingWorkflow = await prisma.workFlow.findUnique({
            where: { id: workflowId }
        });

        if (!existingWorkflow) {
            return res.status(404).json({ message: "Workflow not found" });
        }

        const oldPosition = existingWorkflow.position;

        await prisma.$transaction(async (tx) => {

            // 1. Move current workflow to TEMP position
            await tx.workFlow.update({
                where: { id: workflowId },
                data: { position: -1 } // temporary मुक्त slot
            });

            // 2. Shift others
            if (newPosition < oldPosition) {
                await tx.workFlow.updateMany({
                    where: {
                        projectId: projId,
                        position: {
                            gte: newPosition,
                            lt: oldPosition
                        }
                    },
                    data: {
                        position: { increment: 1 }
                    }
                });
            } else if (newPosition > oldPosition) {
                await tx.workFlow.updateMany({
                    where: {
                        projectId: projId,
                        position: {
                            gt: oldPosition,
                            lte: newPosition
                        }
                    },
                    data: {
                        position: { decrement: 1 }
                    }
                });
            }

            // 3. Place workflow at new position
            await tx.workFlow.update({
                where: { id: workflowId },
                data: {
                    name,
                    description,
                    position: newPosition
                }
            });
        });

        return res.status(200).json({
            message: "Workflow updated with reordering",
        });
    }
);


