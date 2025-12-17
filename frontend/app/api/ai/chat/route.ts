import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, latexContent } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Use Gemini 2.5 Flash - latest stable model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash"
    });

    // Create context-aware prompt - directive for actual content generation
    const systemContext = `You are an expert LaTeX code writer and academic writing assistant. Write actual LaTeX code that users can directly use.

Your capabilities:
- Generate complete LaTeX sections with real content (not just templates)
- Write academic text directly in LaTeX format
- Create equations, tables, figures, and citations
- Help with both structure AND content
- Be practical and direct - provide working code

Current document:
${latexContent ? latexContent.substring(0, 2000) : "New document"}

Guidelines:
1. When asked to write content, actually write it (don't just provide templates)
2. Include real text, not placeholders like "your content here"
3. Use proper LaTeX formatting and packages
4. Be concise but complete
5. Provide code that can be copied directly into the editor

Example:
User: "Write about surgical robots"
Good: "\\section{Introduction}\\nAutonomous surgical robots represent a breakthrough..."
Bad: "Here's a template: \\section{Introduction}\\n% Add your content here"`;

    const fullPrompt = `${systemContext}\n\nUser question: ${message}`;

    // Generate response
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const aiResponse = response.text();

    return NextResponse.json({ 
      response: aiResponse,
      model: "gemini-2.5-flash"
    });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Handle rate limiting
    if (error.message?.includes("quota") || error.message?.includes("rate")) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again in a moment." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to get AI response: " + error.message },
      { status: 500 }
    );
  }
}

