import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const firstNames = ["Priya","Rahul","Sneha","Arjun","Meera","Karthik","Divya","Rohan","Anjali","Vikram","Pooja","Siddharth","Nisha","Aditya","Kavya","Manish","Swati","Ravi","Deepa","Suresh"];
const lastNames = ["Sharma","Patel","Nair","Mehta","Reddy","Singh","Iyer","Gupta","Joshi","Kumar","Verma","Shah","Mishra","Rao","Pillai","Bose","Dutta","Malhotra","Shetty","Agarwal"];
const cities = ["Mumbai","Delhi","Bangalore","Chennai","Hyderabad","Pune","Kolkata","Ahmedabad","Jaipur","Surat"];
const products = [
  { name: "Silk Kurta", price: 2499 },
  { name: "Denim Jacket", price: 3999 },
  { name: "Ethnic Saree", price: 5999 },
  { name: "Casual Tee", price: 799 },
  { name: "Formal Shirt", price: 1799 },
  { name: "Palazzo Set", price: 2999 },
  { name: "Sneakers", price: 4499 },
  { name: "Handbag", price: 3499 },
  { name: "Sunglasses", price: 1299 },
  { name: "Watch", price: 7999 },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.deliveryEvent.deleteMany();
  await prisma.campaignRecipient.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.segment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();

  for (let i = 0; i < 200; i++) {
    const firstName = pick(firstNames);
    const lastName = pick(lastNames);
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
    const city = pick(cities);
    const archetype = Math.random();

    let orderCount: number;
    let daysSinceLastOrder: number;

    if (archetype < 0.15) {
      // Lapsed
      orderCount = rand(2, 8);
      daysSinceLastOrder = rand(90, 365);
    } else if (archetype < 0.30) {
      // VIP
      orderCount = rand(8, 20);
      daysSinceLastOrder = rand(5, 30);
    } else if (archetype < 0.50) {
      // New
      orderCount = 1;
      daysSinceLastOrder = rand(1, 30);
    } else if (archetype < 0.65) {
      // At-risk
      orderCount = rand(2, 4);
      daysSinceLastOrder = rand(45, 89);
    } else {
      // Regular
      orderCount = rand(3, 10);
      daysSinceLastOrder = rand(10, 60);
    }

    const orders = [];
    let totalSpent = 0;

    for (let j = 0; j < orderCount; j++) {
      const numItems = rand(1, 3);
      const items = Array.from({ length: numItems }, () => ({
        ...pick(products),
        qty: 1,
      }));
      const amount = items.reduce((s, item) => s + item.price, 0);
      totalSpent += amount;
      const orderDate = j === 0
        ? daysAgo(daysSinceLastOrder)
        : daysAgo(daysSinceLastOrder + rand(30, 200));
      orders.push({ items, amount, createdAt: orderDate });
    }

    await prisma.customer.create({
      data: {
        name,
        email,
        phone: `+91${rand(7000000000, 9999999999)}`,
        city,
        totalSpent,
        orderCount,
        lastOrderAt: daysAgo(daysSinceLastOrder),
        tags: archetype < 0.30 ? ["vip"] : archetype < 0.50 ? ["new"] : [],
        orders: {
          create: orders.map((o) => ({
            amount: o.amount,
            items: o.items,
            createdAt: o.createdAt,
            status: "completed",
          })),
        },
      },
    });
  }

  console.log("✅ Created 200 customers");

  await prisma.segment.createMany({
    data: [
      {
        name: "Lapsed Customers",
        description: "Haven't ordered in 90+ days",
        filterRules: { lastOrderDaysAgo: { gte: 90 } },
        aiGenerated: false,
      },
      {
        name: "VIP Shoppers",
        description: "Total spend above ₹20,000",
        filterRules: { totalSpent: { gte: 20000 } },
        aiGenerated: false,
      },
      {
        name: "New Customers",
        description: "Joined in last 30 days",
        filterRules: { lastOrderDaysAgo: { lte: 30 }, orderCount: { lte: 1 } },
        aiGenerated: false,
      },
    ],
  });

  console.log("✅ Created 3 segments");
  console.log("🎉 Done!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());