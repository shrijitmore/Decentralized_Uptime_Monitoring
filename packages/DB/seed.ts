import { prisma } from "./src/index.js";

async function seed() {
    console.log("🌱 Starting database seed...");

    // Clear existing data (optional - comment out if you want to keep existing data)
    await prisma.websiteTick.deleteMany();
    await prisma.website.deleteMany();
    await prisma.validator.deleteMany();

    // Note: Users are managed by Clerk, so we use test userIds
    // The middleware currently sets userId = '1' for testing
    // Replace these with actual Clerk user IDs when you integrate real auth
    const testUserId1 = '1'; // This matches the middleware default
    const testUserId2 = '2'; // For testing multiple users

    // Create multiple websites for testUserId1
    const website1 = await prisma.website.create({
        data: {
            url: "https://www.google.com",
            userId: testUserId1,
        }
    });

    const website2 = await prisma.website.create({
        data: {
            url: "https://github.com",
            userId: testUserId1,
        }
    });

    const website3 = await prisma.website.create({
        data: {
            url: "https://stackoverflow.com",
            userId: testUserId1,
        }
    });

    // Create websites for testUserId2
    const website4 = await prisma.website.create({
        data: {
            url: "https://www.reddit.com",
            userId: testUserId2,
        }
    });

    console.log("✅ Created websites");

    // Create multiple validators from different locations
    const validator1 = await prisma.validator.create({
        data: {
            publicKey: "validator-us-east-001",
            location: "US-East",
            ip: "192.168.1.100",
        }
    });

    const validator2 = await prisma.validator.create({
        data: {
            publicKey: "validator-eu-west-001",
            location: "EU-West",
            ip: "192.168.2.200",
        }
    });

    const validator3 = await prisma.validator.create({
        data: {
            publicKey: "validator-asia-pacific-001",
            location: "Asia-Pacific",
            ip: "192.168.3.300",
        }
    });

    console.log("✅ Created validators");

    // Helper function to create ticks with specific timestamps
    const createTick = async (
        websiteId: string,
        validatorId: string,
        status: "Good" | "Bad" | "Unknown",
        latency: number,
        minutesAgo: number
    ) => {
        const createdAt = new Date(Date.now() - minutesAgo * 60 * 1000);
        return await prisma.websiteTick.create({
            data: {
                websiteId,
                validatorId,
                status,
                latency,
                createdAt,
            }
        });
    };

    // Create ticks for website1 (Google) - Mix of recent and older ticks
    // Recent ticks (last 30 minutes) - 10 ticks
    await createTick(website1.id, validator1.id, "Good", 120.5, 0);   // Now
    await createTick(website1.id, validator2.id, "Good", 98.2, 3);   // 3 min ago
    await createTick(website1.id, validator1.id, "Good", 145.8, 6);   // 6 min ago
    await createTick(website1.id, validator3.id, "Bad", 0, 9);        // 9 min ago - DOWN
    await createTick(website1.id, validator1.id, "Good", 132.1, 12); // 12 min ago
    await createTick(website1.id, validator2.id, "Good", 115.3, 15); // 15 min ago
    await createTick(website1.id, validator1.id, "Good", 108.7, 18); // 18 min ago
    await createTick(website1.id, validator3.id, "Good", 125.4, 21); // 21 min ago
    await createTick(website1.id, validator2.id, "Good", 142.9, 24); // 24 min ago
    await createTick(website1.id, validator1.id, "Good", 118.6, 27); // 27 min ago

    // Older ticks (beyond 30 minutes) - for historical data
    await createTick(website1.id, validator1.id, "Good", 110.2, 35);
    await createTick(website1.id, validator2.id, "Good", 105.8, 40);
    await createTick(website1.id, validator1.id, "Bad", 0, 45);      // Another downtime
    await createTick(website1.id, validator3.id, "Good", 128.3, 50);

    // Create ticks for website2 (GitHub) - Mostly good with one recent issue
    await createTick(website2.id, validator1.id, "Good", 95.4, 2);
    await createTick(website2.id, validator2.id, "Good", 88.7, 5);
    await createTick(website2.id, validator1.id, "Good", 92.1, 8);
    await createTick(website2.id, validator3.id, "Good", 89.5, 11);
    await createTick(website2.id, validator1.id, "Good", 94.3, 14);
    await createTick(website2.id, validator2.id, "Good", 91.2, 17);
    await createTick(website2.id, validator1.id, "Good", 96.8, 20);
    await createTick(website2.id, validator3.id, "Good", 93.4, 23);
    await createTick(website2.id, validator1.id, "Good", 90.1, 26);
    await createTick(website2.id, validator2.id, "Good", 97.6, 29);

    // Create ticks for website3 (StackOverflow) - All good
    await createTick(website3.id, validator1.id, "Good", 156.3, 1);
    await createTick(website3.id, validator2.id, "Good", 148.9, 4);
    await createTick(website3.id, validator1.id, "Good", 162.1, 7);
    await createTick(website3.id, validator3.id, "Good", 151.7, 10);
    await createTick(website3.id, validator1.id, "Good", 159.4, 13);
    await createTick(website3.id, validator2.id, "Good", 154.2, 16);
    await createTick(website3.id, validator1.id, "Good", 161.8, 19);
    await createTick(website3.id, validator3.id, "Good", 157.5, 22);
    await createTick(website3.id, validator1.id, "Good", 153.9, 25);
    await createTick(website3.id, validator2.id, "Good", 160.2, 28);

    // Create ticks for website4 (Reddit) - User2's website, some issues
    await createTick(website4.id, validator1.id, "Good", 178.5, 0);
    await createTick(website4.id, validator2.id, "Bad", 0, 3);       // DOWN
    await createTick(website4.id, validator1.id, "Bad", 0, 6);       // DOWN
    await createTick(website4.id, validator3.id, "Good", 185.2, 9);
    await createTick(website4.id, validator1.id, "Good", 172.8, 12);
    await createTick(website4.id, validator2.id, "Good", 180.1, 15);
    await createTick(website4.id, validator1.id, "Unknown", 0, 18); // Unknown status
    await createTick(website4.id, validator3.id, "Good", 175.6, 21);
    await createTick(website4.id, validator1.id, "Good", 182.3, 24);
    await createTick(website4.id, validator2.id, "Good", 179.4, 27);

    console.log("✅ Created website ticks");

    console.log("\n📊 Seed Summary:");
    console.log(`   Websites: 4`);
    console.log(`   Validators: 3`);
    console.log(`   Website Ticks: ~50+`);
    console.log("\n✨ Database seeded successfully!");
    console.log("\n💡 Test data:");
    console.log(`   User ID '1' (matches middleware default): 3 websites`);
    console.log(`   User ID '2': 1 website`);
    console.log(`\n⚠️  Note: Users are managed by Clerk.`);
    console.log(`   Update userId in seed.ts with actual Clerk user IDs when needed.`);
}

seed()
    .catch((e) => {
        console.error("❌ Error seeding database:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
