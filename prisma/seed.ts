// import { PrismaClient, Prisma } from "@prisma/client";
// import { PrismaPg } from "@prisma/adapter-pg";

// const adapter = new PrismaPg({
//     connectionString: process.env.DATABASE_URL!,
// });

// const prisma = new PrismaClient({
//     adapter,
// });

// const userData: Prisma.UserCreateInput[] = [
//     {
//         clerkId: "user_demo_alice_123",
//         name: "Alice Johnson",
//         email: "alice@example.com",
//         personalExpenses: {
//             create: [
//                 {
//                     amount: 45.50,
//                     category: "Food",
//                     description: "Lunch at cafe",
//                     date: new Date("2026-01-15"),
//                 },
//                 {
//                     amount: 120.00,
//                     category: "Shopping",
//                     description: "New shoes",
//                     date: new Date("2026-01-14"),
//                 },
//             ],
//         },
//     },
//     {
//         clerkId: "user_demo_bob_456",
//         name: "Bob Smith",
//         email: "bob@example.com",
//         personalExpenses: {
//             create: [
//                 {
//                     amount: 85.00,
//                     category: "Transport",
//                     description: "Taxi ride",
//                     date: new Date("2026-01-16"),
//                 },
//             ],
//         },
//     },
// ];

// export async function main() {
//     console.log("Starting to seed...");

//     for (const u of userData) {
//         const user = await prisma.user.upsert({
//             where: { email: u.email },
//             update: {},
//             create: u,
//             include: {
//                 personalExpenses: true,
//             },
//         });
//         console.log(`Created/updated user: ${user.name} with ${user.personalExpenses.length} expenses`);
//     }

//     console.log("Seeding finished.");
// }

// main()
//     .catch((e) => {
//         console.error(e);
//         process.exit(1);
//     })
//     .finally(async () => {
//         await prisma.$disconnect();
//     });