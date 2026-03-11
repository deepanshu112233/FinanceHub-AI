import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: "AI service not configured" },
                { status: 503 }
            );
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get last 6 months of expenses
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const expenses = await prisma.personalExpense.findMany({
            where: {
                userId: user.id,
                date: { gte: sixMonthsAgo },
            },
            orderBy: { date: "asc" },
        });

        if (expenses.length === 0) {
            return NextResponse.json({
                report: null,
                message: "No expenses found to analyze",
            });
        }

        // Build a summary for the AI
        const totalSpent = expenses.reduce((sum, e) => sum + Math.abs(e.amount), 0);

        const categoryTotals: Record<string, number> = {};
        const monthlyTotals: Record<string, number> = {};

        expenses.forEach((e) => {
            // Category totals
            categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Math.abs(e.amount);

            // Monthly totals
            const d = new Date(e.date);
            const monthKey = `${d.toLocaleString("en-US", { month: "short" })} ${d.getFullYear()}`;
            monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + Math.abs(e.amount);
        });

        const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
        const monthEntries = Object.entries(monthlyTotals);
        const currentMonth = monthEntries[monthEntries.length - 1];
        const previousMonth = monthEntries.length > 1 ? monthEntries[monthEntries.length - 2] : null;

        const prompt = `You are a personal finance AI analyst. Analyze this user's spending data and provide a concise observation report.

SPENDING DATA (last 6 months):
- Total spent: ₹${totalSpent.toFixed(2)}
- Number of transactions: ${expenses.length}
- Category breakdown: ${JSON.stringify(categoryTotals)}
- Monthly totals: ${JSON.stringify(monthlyTotals)}
- Top spending category: ${topCategory?.[0]} (₹${topCategory?.[1].toFixed(2)})
- Current month spend: ${currentMonth?.[0]} = ₹${currentMonth?.[1].toFixed(2)}
${previousMonth ? `- Previous month spend: ${previousMonth[0]} = ₹${previousMonth[1].toFixed(2)}` : ""}

Respond ONLY with valid JSON in this exact format, no markdown:
{
  "summary": "A 1-2 sentence overall observation about their spending habits",
  "highlights": [
    {"type": "warning", "text": "A spending concern or pattern to watch"},
    {"type": "tip", "text": "A money-saving suggestion"},
    {"type": "positive", "text": "Something they're doing well (if applicable)"}
  ],
  "topCategory": {"name": "category name", "percentage": number, "trend": "up|down|stable"},
  "monthOverMonth": {"change": number, "direction": "up|down|stable"},
  "score": number
}

Rules:
- summary should be insightful, not generic
- highlights array should have 2-4 items, each with type "warning", "tip", or "positive"
- topCategory.percentage is the percentage of total spending
- monthOverMonth.change is the percentage change from previous to current month (0 if no previous month)
- score is a financial health score from 1-100 based on spending patterns
- Keep all text concise and actionable`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Clean and parse
        const cleanedText = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();

        try {
            const report = JSON.parse(cleanedText);
            return NextResponse.json({
                report,
                generatedAt: new Date().toISOString(),
                dataPoints: expenses.length,
            });
        } catch {
            console.error("Failed to parse Gemini response:", cleanedText);
            return NextResponse.json(
                { error: "Invalid AI response format" },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Error generating AI report:", error);
        return NextResponse.json(
            { error: "Failed to generate AI report" },
            { status: 500 }
        );
    }
}
