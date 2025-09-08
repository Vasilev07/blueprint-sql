import { DataSource } from "typeorm";
import { User } from "./entities/user.entity";
import { Message } from "./entities/message.entity";
import { Role } from "./enums/role.enum";
import * as bcrypt from "bcrypt";

const dataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "postgres",
    database: "blueprint-sql",
    entities: [User, Message],
    synchronize: true,
});

async function seed() {
    try {
        await dataSource.initialize();
        console.log("Database connection established");

        // Check if admin user exists
        const existingAdmin = await dataSource.getRepository(User).findOne({
            where: { email: "admin@gmail.com" }
        });
        
        if (existingAdmin) {
            console.log("Admin user already exists, skipping seed");
            return;
        }

        // Create admin user
        const adminUser = new User();
        adminUser.email = "admin@gmail.com";
        adminUser.password = await bcrypt.hash("admin123", 10);
        adminUser.firstname = "Admin";
        adminUser.lastname = "User";
        adminUser.roles = [Role.Admin];
        await dataSource.getRepository(User).save(adminUser);
        console.log("Created admin user");

        // Create test users
        const testUsers = [
            {
                email: "john.doe@example.com",
                password: "password123",
                firstname: "John",
                lastname: "Doe",
                roles: [Role.User]
            },
            {
                email: "jane.smith@example.com",
                password: "password123",
                firstname: "Jane",
                lastname: "Smith",
                roles: [Role.User]
            },
            {
                email: "mike.wilson@example.com",
                password: "password123",
                firstname: "Mike",
                lastname: "Wilson",
                roles: [Role.User]
            },
            {
                email: "sarah.johnson@example.com",
                password: "password123",
                firstname: "Sarah",
                lastname: "Johnson",
                roles: [Role.User]
            },
            {
                email: "david.brown@example.com",
                password: "password123",
                firstname: "David",
                lastname: "Brown",
                roles: [Role.User]
            }
        ];

        const createdUsers = [];
        for (const userData of testUsers) {
            const user = new User();
            user.email = userData.email;
            user.password = await bcrypt.hash(userData.password, 10);
            user.firstname = userData.firstname;
            user.lastname = userData.lastname;
            user.roles = userData.roles;
            const savedUser = await dataSource.getRepository(User).save(user);
            createdUsers.push(savedUser);
            console.log(`Created user: ${userData.email}`);
        }

        // Create messages from test users to admin
        const messages = [
            {
                subject: "Project Update Request",
                content: "Hi Admin,\n\nI wanted to update you on the progress of our current project. We've completed the initial phase and are moving into the development stage. Could we schedule a meeting to discuss the next steps?\n\nBest regards,\nJohn",
                from: "john.doe@example.com",
                to: ["admin@gmail.com"],
                cc: [],
                bcc: [],
                attachments: ["project_update.pdf"],
                userId: adminUser.id
            },
            {
                subject: "Meeting Reminder",
                content: "Hello Admin,\n\nThis is a friendly reminder about our team meeting scheduled for tomorrow at 2 PM. Please let me know if you need to reschedule.\n\nThanks,\nJane",
                from: "jane.smith@example.com",
                to: ["admin@gmail.com"],
                cc: [],
                bcc: [],
                attachments: [],
                userId: adminUser.id
            },
            {
                subject: "Budget Approval Needed",
                content: "Dear Admin,\n\nI need your approval for the Q4 budget allocation. The document is attached for your review. Please let me know if you have any questions or concerns.\n\nRegards,\nMike",
                from: "mike.wilson@example.com",
                to: ["admin@gmail.com"],
                cc: ["john.doe@example.com"],
                bcc: [],
                attachments: ["budget_q4.xlsx", "financial_report.pdf"],
                userId: adminUser.id
            },
            {
                subject: "Vacation Request",
                content: "Hi Admin,\n\nI would like to request vacation time from December 20th to December 27th. Please let me know if this is approved.\n\nThank you,\nSarah",
                from: "sarah.johnson@example.com",
                to: ["admin@gmail.com"],
                cc: [],
                bcc: [],
                attachments: [],
                userId: adminUser.id
            },
            {
                subject: "System Maintenance Notice",
                content: "Hello Admin,\n\nI wanted to inform you that we'll be performing system maintenance this weekend. The system will be down from Saturday 10 PM to Sunday 6 AM. Please plan accordingly.\n\nBest,\nDavid",
                from: "david.brown@example.com",
                to: ["admin@gmail.com"],
                cc: ["jane.smith@example.com", "mike.wilson@example.com"],
                bcc: [],
                attachments: ["maintenance_schedule.pdf"],
                userId: adminUser.id
            },
            {
                subject: "Client Feedback Summary",
                content: "Hi Admin,\n\nHere's a summary of the client feedback we received this week. Overall, the response has been very positive. I've highlighted the areas that need attention.\n\nRegards,\nJohn",
                from: "john.doe@example.com",
                to: ["admin@gmail.com"],
                cc: [],
                bcc: [],
                attachments: ["client_feedback_summary.docx"],
                userId: adminUser.id
            },
            {
                subject: "Team Building Event",
                content: "Hello Admin,\n\nI'm organizing a team building event for next month. Would you like to participate? I've included some activity options in the attachment.\n\nThanks,\nJane",
                from: "jane.smith@example.com",
                to: ["admin@gmail.com"],
                cc: [],
                bcc: [],
                attachments: ["team_building_options.pdf"],
                userId: adminUser.id
            },
            {
                subject: "Urgent: Server Issue",
                content: "Admin,\n\nWe're experiencing server issues with the production environment. The response time has increased significantly. Please advise on the next steps.\n\nUrgent,\nMike",
                from: "mike.wilson@example.com",
                to: ["admin@gmail.com"],
                cc: [],
                bcc: [],
                attachments: ["server_logs.txt"],
                userId: adminUser.id
            }
        ];

        for (const messageData of messages) {
            const message = new Message();
            message.subject = messageData.subject;
            message.content = messageData.content;
            message.from = messageData.from;
            message.to = messageData.to;
            message.cc = messageData.cc;
            message.bcc = messageData.bcc;
            message.attachments = messageData.attachments;
            message.userId = messageData.userId;
            message.isRead = Math.random() > 0.5; // Randomly mark some as read
            message.isArchived = Math.random() > 0.8; // Randomly archive some
            message.isDeleted = false;
            
            await dataSource.getRepository(Message).save(message);
            console.log(`Created message: ${messageData.subject}`);
        }

        console.log("✅ Seed data created successfully!");
        console.log(`Created ${createdUsers.length + 1} users and ${messages.length} messages`);

    } catch (error) {
        console.error("Error seeding database:", error);
    } finally {
        await dataSource.destroy();
    }
}

seed();
