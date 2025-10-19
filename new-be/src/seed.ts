import { DataSource } from "typeorm";
import { User } from "./entities/user.entity";
import { UserProfile } from "./entities/user-profile.entity";
import { UserPhoto } from "./entities/user-photo.entity";
import { Message } from "./entities/message.entity";
import { UserFriend, FriendshipStatus } from "./entities/friend.entity";
import { Role } from "./enums/role.enum";
import { Gender } from "./enums/gender.enum";
import * as bcrypt from "bcrypt";

const dataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "postgres",
    database: "blueprint-sql",
    entities: [User, UserProfile, UserPhoto, Message, UserFriend],
    synchronize: true,
});

async function seed() {
    try {
        await dataSource.initialize();
        console.log("Database connection established");

        // Check if admin user exists
        const existingAdmin = await dataSource.getRepository(User).findOne({
            where: { email: "admin@gmail.com" },
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
        adminUser.gender = Gender.Male;
        await dataSource.getRepository(User).save(adminUser);

        // Create admin profile
        const adminProfile = new UserProfile();
        adminProfile.userId = adminUser.id;
        adminProfile.city = "Sofia";
        await dataSource.getRepository(UserProfile).save(adminProfile);
        console.log("Created admin user");

        // Bulgarian cities for seed data
        const bulgarianCities = [
            "Sofia",
            "Plovdiv",
            "Varna",
            "Burgas",
            "Ruse",
            "Stara Zagora",
            "Pleven",
            "Sliven",
            "Dobrich",
            "Shumen",
            "Pernik",
            "Haskovo",
            "Yambol",
            "Pazardzhik",
            "Blagoevgrad",
            "Veliko Tarnovo",
            "Vratsa",
            "Gabrovo",
            "Asenovgrad",
            "Vidin",
        ];

        // Create test users
        const testUsers = [
            {
                email: "john.doe@example.com",
                password: "password123",
                firstname: "John",
                lastname: "Doe",
                roles: [Role.User],
                gender: Gender.Male,
                city: "Sofia",
            },
            {
                email: "jane.smith@example.com",
                password: "password123",
                firstname: "Jane",
                lastname: "Smith",
                roles: [Role.User],
                gender: Gender.Female,
                city: "Plovdiv",
            },
            {
                email: "mike.wilson@example.com",
                password: "password123",
                firstname: "Mike",
                lastname: "Wilson",
                roles: [Role.User],
                gender: Gender.Male,
                city: "Varna",
            },
            {
                email: "sarah.johnson@example.com",
                password: "password123",
                firstname: "Sarah",
                lastname: "Johnson",
                roles: [Role.User],
                gender: Gender.Female,
                city: "Burgas",
            },
            {
                email: "david.brown@example.com",
                password: "password123",
                firstname: "David",
                lastname: "Brown",
                roles: [Role.User],
                gender: Gender.Male,
                city: "Ruse",
            },
        ];

        const createdUsers = [];
        for (const userData of testUsers) {
            const user = new User();
            user.email = userData.email;
            user.password = await bcrypt.hash(userData.password, 10);
            user.firstname = userData.firstname;
            user.lastname = userData.lastname;
            user.roles = userData.roles;
            user.gender = userData.gender;
            const savedUser = await dataSource.getRepository(User).save(user);

            // Create user profile
            const profile = new UserProfile();
            profile.userId = savedUser.id;
            profile.city = userData.city;
            await dataSource.getRepository(UserProfile).save(profile);

            createdUsers.push(savedUser);
            console.log(`Created user: ${userData.email}`);
        }

        // Generate additional users up to a total of ~500 users (including admin and above test users)
        const targetTotalUsers = 500;
        const usersRepo = dataSource.getRepository(User);
        const existingCount = await usersRepo.count();
        const remainingToCreate = Math.max(0, targetTotalUsers - existingCount);

        for (let i = 1; i <= remainingToCreate; i++) {
            // Cycle through base templates to vary names a bit
            const base = testUsers[(i - 1) % testUsers.length];
            const [local, domain] = base.email.split("@");
            const indexedEmail = `${local}+${i}@${domain}`;

            // Skip if somehow exists (idempotency)
            const exists = await usersRepo.findOne({
                where: { email: indexedEmail },
            });
            if (exists) continue;

            const u = new User();
            u.email = indexedEmail;
            u.password = await bcrypt.hash(base.password, 10);
            u.firstname = `${base.firstname}${i}`; // append index
            u.lastname = base.lastname; // keep the same
            u.roles = base.roles;
            // Randomly assign gender
            const genders = [Gender.Male, Gender.Female, Gender.Other];
            u.gender = genders[i % genders.length];

            const savedUser = await usersRepo.save(u);

            // Create user profile
            const profile = new UserProfile();
            profile.userId = savedUser.id;
            profile.city = bulgarianCities[i % bulgarianCities.length];
            await dataSource.getRepository(UserProfile).save(profile);
            if (i % 25 === 0) {
                console.log(
                    `Created ${i} of ${remainingToCreate} extra users...`,
                );
            }
        }

        // Create messages from test users to admin
        const messages = [
            {
                subject: "Project Update Request",
                content:
                    "Hi Admin,\n\nI wanted to update you on the progress of our current project. We've completed the initial phase and are moving into the development stage. Could we schedule a meeting to discuss the next steps?\n\nBest regards,\nJohn",
                from: "john.doe@example.com",
                to: ["admin@gmail.com"],
                cc: [],
                bcc: [],
                attachments: ["project_update.pdf"],
                userId: adminUser.id,
            },
            {
                subject: "Meeting Reminder",
                content:
                    "Hello Admin,\n\nThis is a friendly reminder about our team meeting scheduled for tomorrow at 2 PM. Please let me know if you need to reschedule.\n\nThanks,\nJane",
                from: "jane.smith@example.com",
                to: ["admin@gmail.com"],
                cc: [],
                bcc: [],
                attachments: [],
                userId: adminUser.id,
            },
            {
                subject: "Budget Approval Needed",
                content:
                    "Dear Admin,\n\nI need your approval for the Q4 budget allocation. The document is attached for your review. Please let me know if you have any questions or concerns.\n\nRegards,\nMike",
                from: "mike.wilson@example.com",
                to: ["admin@gmail.com"],
                cc: ["john.doe@example.com"],
                bcc: [],
                attachments: ["budget_q4.xlsx", "financial_report.pdf"],
                userId: adminUser.id,
            },
            {
                subject: "Vacation Request",
                content:
                    "Hi Admin,\n\nI would like to request vacation time from December 20th to December 27th. Please let me know if this is approved.\n\nThank you,\nSarah",
                from: "sarah.johnson@example.com",
                to: ["admin@gmail.com"],
                cc: [],
                bcc: [],
                attachments: [],
                userId: adminUser.id,
            },
            {
                subject: "System Maintenance Notice",
                content:
                    "Hello Admin,\n\nI wanted to inform you that we'll be performing system maintenance this weekend. The system will be down from Saturday 10 PM to Sunday 6 AM. Please plan accordingly.\n\nBest,\nDavid",
                from: "david.brown@example.com",
                to: ["admin@gmail.com"],
                cc: ["jane.smith@example.com", "mike.wilson@example.com"],
                bcc: [],
                attachments: ["maintenance_schedule.pdf"],
                userId: adminUser.id,
            },
            {
                subject: "Client Feedback Summary",
                content:
                    "Hi Admin,\n\nHere's a summary of the client feedback we received this week. Overall, the response has been very positive. I've highlighted the areas that need attention.\n\nRegards,\nJohn",
                from: "john.doe@example.com",
                to: ["admin@gmail.com"],
                cc: [],
                bcc: [],
                attachments: ["client_feedback_summary.docx"],
                userId: adminUser.id,
            },
            {
                subject: "Team Building Event",
                content:
                    "Hello Admin,\n\nI'm organizing a team building event for next month. Would you like to participate? I've included some activity options in the attachment.\n\nThanks,\nJane",
                from: "jane.smith@example.com",
                to: ["admin@gmail.com"],
                cc: [],
                bcc: [],
                attachments: ["team_building_options.pdf"],
                userId: adminUser.id,
            },
            {
                subject: "Urgent: Server Issue",
                content:
                    "Admin,\n\nWe're experiencing server issues with the production environment. The response time has increased significantly. Please advise on the next steps.\n\nUrgent,\nMike",
                from: "mike.wilson@example.com",
                to: ["admin@gmail.com"],
                cc: [],
                bcc: [],
                attachments: ["server_logs.txt"],
                userId: adminUser.id,
            },
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

        // Create friend relationships
        console.log("Creating friend relationships...");
        const friendRepo = dataSource.getRepository(UserFriend);

        // Admin becomes friends with first 10 test users (or all if less than 10)
        const friendCount = Math.min(10, createdUsers.length);
        for (let i = 0; i < friendCount; i++) {
            const friend = new UserFriend();
            friend.userId = adminUser.id;
            friend.friendId = createdUsers[i].id;
            friend.status = FriendshipStatus.ACCEPTED;
            await friendRepo.save(friend);

            // Create reciprocal relationship
            const friendReciprocal = new UserFriend();
            friendReciprocal.userId = createdUsers[i].id;
            friendReciprocal.friendId = adminUser.id;
            friendReciprocal.status = FriendshipStatus.ACCEPTED;
            await friendRepo.save(friendReciprocal);

            console.log(
                `Created friendship: Admin <-> ${createdUsers[i].email}`,
            );
        }

        // Create some friendships between test users
        if (createdUsers.length >= 2) {
            const friend = new UserFriend();
            friend.userId = createdUsers[0].id;
            friend.friendId = createdUsers[1].id;
            friend.status = FriendshipStatus.ACCEPTED;
            await friendRepo.save(friend);

            const friendReciprocal = new UserFriend();
            friendReciprocal.userId = createdUsers[1].id;
            friendReciprocal.friendId = createdUsers[0].id;
            friendReciprocal.status = FriendshipStatus.ACCEPTED;
            await friendRepo.save(friendReciprocal);

            console.log(
                `Created friendship: ${createdUsers[0].email} <-> ${createdUsers[1].email}`,
            );
        }

        const finalCount = await dataSource.getRepository(User).count();
        const friendshipCount = await friendRepo.count();
        console.log("✅ Seed data created successfully!");
        console.log(
            `Total users in DB: ${finalCount}. Messages created: ${messages.length}. Friendships: ${friendshipCount}`,
        );
    } catch (error) {
        console.error("Error seeding database:", error);
    } finally {
        await dataSource.destroy();
    }
}

seed();
