import { Request, Response } from "express";
import asyncHandler from "../utils/async-handler";
import { AuthRequest } from "../middlewares/auth.middleware";
import { prisma } from "../utils/prisma";
import { createActivity } from "../utils/createActivity";
import { getProjectContext } from "../utils/getProjectContext";

export const getTasks = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?.userId;
        const { projectId } = req.params
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const tasks = await prisma.task.findMany({
            where: {
                projectId: Number(projectId),
                assignedTo: userId,
            },
        });


        res.status(201).json({
            message: "Tasks fetched successfully",
            data: {
                tasks
            }
        });
    }
);


export const createTask = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?.userId

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" })
        }

        const {
            title,
            description,
            projectId,
            statusId,
            priority,
            type,
            assignedTo,
        } = req.body

        if (!title || !projectId) {
            return res.status(400).json({ message: "Title and projectId are required" })
        }

        const task = await prisma.task.create({
            data: {
                title,
                description,
                projectId,
                statusId,
                priority,
                type,
                assignedBy: userId,
                assignedTo,
            },
        })

        // 🔍 Check role of current user in project
        const { isAdmin, projectTitle, adminIds } = await getProjectContext(projectId, userId);

        await createActivity({
            actorId: userId,
            action: assignedTo === userId ? "CREATE_TASK" : "ASSIGN_TASK",
            entityId: task.id,
            entityType:"TASK",
            projectId,
            projectTitle,
            isAdmin,
            assignedTo,
            adminIds,
            metadata: {
                title: task.title,
            },
        });

        res.status(201).json({
            message: "Task Created successfully",
            data: {
                task,
            },
        })
    }
)

// ✅ UPDATE TASK
export const updateTask = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const { taskId } = req.params;
        const userId = req.user?.userId
        const {
            title,
            description,
            statusId,
            priority,
            type,
            assignedTo,
        } = req.body;

        const existingTask = await prisma.task.findUnique({
            where: { id: Number(taskId) },
            select:{
                project:{
                    select:{
                        name:true
                    }
                },
                projectId: true
            }
        });

        if (!existingTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        const updatedTask = await prisma.task.update({
            where: { id: Number(taskId) },
            data: {
                title,
                description,
                statusId,
                priority,
                type,
                assignedTo,
            },
        });
        const { isAdmin, projectTitle, adminIds } = await getProjectContext(existingTask.projectId, Number(userId));
        await createActivity({
            actorId: Number(userId),
            action: "UPDATE_TASK",
            entityId: Number(taskId),
            entityType:"TASK",
            projectId : Number(existingTask.projectId),
            projectTitle : existingTask.project.name,
            isAdmin,
            assignedTo: assignedTo,
            adminIds,
            metadata: {
                title: title,
                projectTitle
            },
        });

        res.status(200).json({
            message: "Task updated successfully",
            data: {
                task: updatedTask
            }
        });
    }
);

// ✅ DELETE TASK
export const deleteTask = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const { taskId } = req.params;
        const userId = req.user?.userId
        const existingTask = await prisma.task.findUnique({
            where: { id: Number(taskId) },
            select: {
                project: {
                    select: {
                        name: true
                    }
                },
                projectId: true,
                assignedTo:true,
                title:true
            }
        });

        if (!existingTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        await prisma.task.delete({
            where: { id: Number(taskId) },
        });
        const { isAdmin, projectTitle, adminIds } = await getProjectContext(existingTask.projectId, Number(userId));
        await createActivity({
            actorId: Number(userId),
            action: "DELETE_TASK",
            entityId: Number(taskId),
            entityType:"TASK",
            projectId: Number(existingTask.projectId),
            projectTitle: existingTask.project.name,
            isAdmin,
            assignedTo: existingTask.assignedTo,
            adminIds,
            metadata: {
                title: existingTask.title,
                projectTitle
            },
        });
        res.status(200).json({ message: "Task deleted successfully" });
    }
);