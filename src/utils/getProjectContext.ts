
import { prisma } from "./prisma";


interface ProjectContextResult {
    isAdmin: boolean;
    projectTitle?: string;
    role?: string;
    adminIds: number[];
}

export const getProjectContext = async (projectId: number, userId: number): Promise<ProjectContextResult> => {
    
    const [currentUserMembership, admins] = await Promise.all([
        prisma.projectMembers.findFirst({
            where: {
                projectId,
                userId,
            },
            select: {
                role: true,
                project: {
                    select: {
                        name: true,
                    },
                },
            },
        }),

        prisma.projectMembers.findMany({
            where: {
                projectId,
                role: "PROJECT_ADMIN",
            },
            select: {
                userId: true,
            },
        }),
    ]);

    const adminIds = admins.map((a) => a.userId);

    return {
        isAdmin: currentUserMembership?.role === "PROJECT_ADMIN",
        projectTitle: currentUserMembership?.project?.name,
        role: currentUserMembership?.role,
        adminIds,
    };
};