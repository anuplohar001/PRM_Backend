import { PrismaClient, OrgRoles, ProjectRoles, ProjectStatus, TeamRoles } from "./src/generated/prisma/client";
import {prisma} from "./src/utils/prisma"
import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";

const organizationNames = [
    "TechNova Solutions",
    "FinEdge Technologies",
    "CloudMatrix Systems",
    "Aarambh Innovations",
    "Vertex Digital Labs",
];

const teamNames = [
    "Frontend Team",
    "Backend Team",
    "DevOps Team",
    "QA Team",
    "Mobile Team",
    "Design Team",
    "Data Team",
    "Security Team",
    "Support Team",
    "Product Team",
];

const projectNames = [
    "Customer Portal Revamp",
    "Inventory Management System",
    "PRM Platform",
    "Employee Dashboard",
    "Lead Tracking Tool",
    "AI Chat Assistant",
    "Vendor Management Portal",
    "Payment Gateway Integration",
    "CRM Migration",
    "Analytics Dashboard",
    "HR Management Suite",
    "Sales Automation",
    "Expense Tracker",
    "E-Commerce Platform",
    "Learning Management System",
    "Fleet Tracking System",
    "Document Management Portal",
    "Workflow Automation",
    "Internal Knowledge Base",
    "Marketing Campaign Manager",
];


async function cleanup() {
    await prisma.projectTeam.deleteMany();
    await prisma.projectMembers.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.projects.deleteMany();
    await prisma.team.deleteMany();
    await prisma.organizationMembers.deleteMany();
    await prisma.organizations.deleteMany();
    await prisma.users.deleteMany();
}


async function seedUsers() {
    const password = await bcrypt.hash("Anup@123", 10);

    const users = [];

    for (let i = 0; i < 50; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();

        const user = await prisma.users.create({
            data: {
                name: `${firstName} ${lastName}`,
                email: `user${i + 1}@prm.local`,
                description: faker.person.jobTitle(),
                password,
                role: "USER",
            },
        });

        users.push(user);
    }

    return users;
}


async function seedOrganizations(users: any[]) {
    const organizations = [];

    for (let i = 0; i < 5; i++) {
        const owner = users[i];

        const organization = await prisma.organizations.create({
            data: {
                name: organizationNames[i],
                description: faker.company.catchPhrase(),
                createdById: owner.id,
                updatedById: owner.id,
            },
        });

        organizations.push({
            organization,
            owner,
        });
    }

    return organizations;
}


async function seedOrganizationMembers(
    users: any[],
    organizations: any[]
) {
    const usedUsers = new Set<number>();

    for (const item of organizations) {
        await prisma.organizationMembers.create({
            data: {
                organizationId: item.organization.id,
                userId: item.owner.id,
                role: OrgRoles.ORG_OWNER,
                addedById: item.owner.id,
            },
        });

        usedUsers.add(item.owner.id);

        const randomCount = faker.number.int({
            min: 4,
            max: 8,
        });

        const availableUsers = users.filter(
            (u) => !usedUsers.has(u.id)
        );

        const selectedUsers = faker.helpers.arrayElements(
            availableUsers,
            randomCount
        );

        for (const user of selectedUsers) {
            usedUsers.add(user.id);

            await prisma.organizationMembers.create({
                data: {
                    organizationId: item.organization.id,
                    userId: user.id,
                    role:
                        Math.random() < 0.2
                            ? OrgRoles.ORG_ADMIN
                            : OrgRoles.ORG_MEMBER,
                    addedById: item.owner.id,
                },
            });

            await prisma.users.update({
                where: { id: user.id },
                data: {
                    lastOrganizationId: item.organization.id,
                },
            });
        }

        await prisma.users.update({
            where: { id: item.owner.id },
            data: {
                lastOrganizationId: item.organization.id,
            },
        });
    }
}



async function seedTeams(
    organizations: any[],
    users: any[]
) {
    const teams = [];

    for (let i = 0; i < 10; i++) {
        const org =
            organizations[
            faker.number.int({
                min: 0,
                max: organizations.length - 1,
            })
            ];

        const creator =
            users[
            faker.number.int({
                min: 0,
                max: users.length - 1,
            })
            ];

        const team = await prisma.team.create({
            data: {
                name: teamNames[i],
                organizationId: org.organization.id,
                createdById: creator.id,
                updatedById: creator.id,
            },
        });

        teams.push(team);
    }

    return teams;
}



async function seedTeamMembers(
    teams: any[],
    users: any[]
) {
    const activeTeams = faker.helpers.arrayElements(
        teams,
        Math.floor(teams.length / 2)
    );

    for (const team of activeTeams) {
        const members = faker.helpers.arrayElements(
            users,
            faker.number.int({
                min: 2,
                max: 5,
            })
        );

        for (let i = 0; i < members.length; i++) {
            await prisma.teamMember.create({
                data: {
                    teamId: team.id,
                    userId: members[i].id,
                    role:
                        i === 0
                            ? TeamRoles.TEAM_ADMIN
                            : TeamRoles.TEAM_MEMBER,
                },
            });
        }
    }
}



async function seedProjects(
    organizations: any[],
    users: any[]
) {
    const projects = [];

    for (let i = 0; i < 20; i++) {
        const org =
            organizations[
            faker.number.int({
                min: 0,
                max: organizations.length - 1,
            })
            ];

        const creator =
            users[
            faker.number.int({
                min: 0,
                max: users.length - 1,
            })
            ];

        const project = await prisma.projects.create({
            data: {
                organizationId: org.organization.id,
                name: projectNames[i],
                description: faker.lorem.sentence(),
                status: faker.helpers.arrayElement([
                    ProjectStatus.PLANNING,
                    ProjectStatus.ACTIVE,
                    ProjectStatus.ACTIVE,
                    ProjectStatus.ACTIVE,
                    ProjectStatus.ON_HOLD,
                    ProjectStatus.COMPLETED,
                ]),
                createdById: creator.id,
                updatedById: creator.id,
            },
        });

        projects.push(project);
    }

    return projects;
}



async function seedProjectMembers(
    projects: any[],
    users: any[]
) {
    const activeProjects = faker.helpers.arrayElements(
        projects,
        Math.floor(projects.length / 2)
    );

    for (const project of activeProjects) {
        const members = faker.helpers.arrayElements(
            users,
            faker.number.int({
                min: 2,
                max: 6,
            })
        );

        for (let i = 0; i < members.length; i++) {
            await prisma.projectMembers.create({
                data: {
                    projectId: project.id,
                    organizationId: project.organizationId,
                    userId: members[i].id,
                    role:
                        i === 0
                            ? ProjectRoles.PROJECT_ADMIN
                            : ProjectRoles.PROJECT_MEMBER,
                },
            });
        }
    }
}



async function seedProjectTeams(
    projects: any[],
    teams: any[],
    users: any[]
) {
    const assignments = 10;

    for (let i = 0; i < assignments; i++) {
        try {
            await prisma.projectTeam.create({
                data: {
                    projectId:
                        faker.helpers.arrayElement(projects).id,
                    teamId:
                        faker.helpers.arrayElement(teams).id,
                    assignedById:
                        faker.helpers.arrayElement(users).id,
                },
            });
        } catch { }
    }
}


async function main() {
    await cleanup();

    const users = await seedUsers();

    const organizations =
        await seedOrganizations(users);

    await seedOrganizationMembers(
        users,
        organizations
    );

    const teams = await seedTeams(
        organizations,
        users
    );

    await seedTeamMembers(
        teams,
        users
    );

    const projects = await seedProjects(
        organizations,
        users
    );

    await seedProjectMembers(
        projects,
        users
    );

    await seedProjectTeams(
        projects,
        teams,
        users
    );

    console.log("Seed completed");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());