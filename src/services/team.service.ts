import { prisma } from "../utils/prisma";


export class ProjectService {


    async getAvailableTeams (projectId: number) {
        return prisma.team.findMany({
            where: {
                projects: {
                    none: {
                        projectId,
                    },
                },
            },
            select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

}


export const projectService = new ProjectService();