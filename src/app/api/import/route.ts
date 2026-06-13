import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return NextResponse.json({ error: "CSV has no data rows" }, { status: 400 });
  }

  const headers = parseCsvLine(lines[0]).map((header) =>
    header.toLowerCase().replace(/\s/g, "")
  );

  if (!headers.includes("name") || !headers.includes("email")) {
    return NextResponse.json(
      { error: "CSV must have name and email columns" },
      { status: 400 }
    );
  }

  let created = 0;
  let skipped = 0;
  let ordersCreated = 0;

  for (const line of lines.slice(1)) {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    if (!row.name || !row.email) {
      skipped++;
      continue;
    }

    try {
      const orderAmount = parseFloat(row.orderamount || row.amount || "0") || 0;
      const orderDate = row.orderdate || row.lastorderat
        ? new Date(row.orderdate || row.lastorderat)
        : new Date();
      const baseTotalSpent = parseFloat(row.totalspent || "0") || 0;
      const baseOrderCount = parseInt(row.ordercount || "0", 10) || 0;

      const customer = await prisma.customer.upsert({
        where: { email: row.email },
        update: {
          name: row.name,
          phone: row.phone || undefined,
          city: row.city || undefined,
          totalSpent: baseTotalSpent,
          orderCount: baseOrderCount,
          lastOrderAt: row.lastorderat ? new Date(row.lastorderat) : undefined,
        },
        create: {
          name: row.name,
          email: row.email,
          phone: row.phone || undefined,
          city: row.city || undefined,
          totalSpent: baseTotalSpent,
          orderCount: baseOrderCount,
          lastOrderAt: row.lastorderat ? new Date(row.lastorderat) : undefined,
        },
      });

      if (orderAmount > 0) {
        await prisma.order.create({
          data: {
            customerId: customer.id,
            amount: orderAmount,
            createdAt: Number.isNaN(orderDate.getTime()) ? new Date() : orderDate,
            items: row.items ? row.items.split("|").map((name) => ({ name: name.trim(), qty: 1 })) : [],
            channel: row.channel || "import",
            status: row.status || "completed",
          },
        });

        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            totalSpent: { increment: orderAmount },
            orderCount: { increment: 1 },
            lastOrderAt: Number.isNaN(orderDate.getTime()) ? new Date() : orderDate,
          },
        });

        ordersCreated++;
      }

      created++;
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({ ok: true, created, skipped, ordersCreated });
}
