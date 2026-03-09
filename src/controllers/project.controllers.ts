import { Response } from "express"
import { prisma } from '../utils/prisma'
import { AuthRequest } from "../middlewares/auth.middleware"
import { Role } from "../constants/RoleHierarchy"



export const createProject = async (req: AuthRequest, res: Response) => {
    try {

        const { name, description, organizationId } = req.body
        const userId = req.user?.userId

        if (!userId) {
            return res.status(401).json({ message: "Unauthorised" })
        }
        const project = await prisma.$transaction(async (tx) => {

            const org = await tx.projects.create({
                data: {
                    name,
                    organizationId,
                    description,
                    status:"N/A",
                    createdById: userId,
                    updatedById: userId
                }
            })

            await tx.projectMembers.create({
                data: {
                    projectId: org.id,
                    userId,
                    role: "PROJECT_OWNER"
                }
            })

            return org
        })

        res.status(201).json({
            message: "Project created successfully",
            project
        })

    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
}

export const addProjectMember = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId, memberId } = req.body
        const userId = req.user?.userId

        if (!userId) {
            return res.status(401).json({ message: "Unauthorised" })
        }
        const existingMember = await prisma.projectMembers.findFirst({
            where: {
                projectId,
                userId: memberId
            }
        })

        if (existingMember) {
            return res.status(400).json({
                message: "User is already a member of this organization"
            })
        }
        const project = await prisma.projectMembers.create({
            data: {
                projectId,
                userId: memberId,
                role: "PROJECT_MEMBER"
            }
        })

        res.status(201).json({
            message: "Project member added successfully",
            project
        })

    } catch (error) {
        res.status(500).json({ message: "Internal server erroreeee" })
    }
}

// export const updateOrganizationMemberRole = async (
//     req: AuthRequest,
//     res: Response
// ) => {
//     try {
//         const { organizationId, memberId, role } = req.body
//         const userId = req.user?.userId

//         if (!userId) {
//             return res.status(401).json({ message: "Unauthorized" })
//         }

//         const membership = await prisma.organizationMembers.findUnique({
//             where: {
//                 organizationId_userId: {
//                     organizationId,
//                     userId: memberId
//                 }
//             }
//         })

//         if (!membership) {
//             return res.status(404).json({
//                 message: "Organization member not found"
//             })
//         }

//         const updatedMember = await prisma.organizationMembers.update({
//             where: {
//                 organizationId_userId: {
//                     organizationId,
//                     userId: memberId
//                 }
//             },
//             data: {
//                 role: role as Role
//             }
//         })

//         res.status(200).json({
//             message: "Member role updated successfully",
//             updatedMember
//         })
//     } catch (error) {
//         res.status(500).json({ message: "Internal server error" })
//     }
// }


