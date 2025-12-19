import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { TEMPLATES } from "@/lib/latex-templates/templates";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, latexContent, selectedTemplate } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get template if specified
    const template = selectedTemplate ? TEMPLATES[selectedTemplate] : null;

    // Use Gemini 2.5 Flash - latest stable model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash"
    });

    // Build template-specific context if template is selected
    const templateContext = template ? `
SELECTED CONFERENCE FORMAT: ${template.name}
Document Class: ${template.documentClass}
Required Packages: ${template.requiredPackages.join("\n")}
Structure: ${template.structure.columns}-column, max ${template.structure.maxPages} pages
Abstract Required: ${template.structure.abstract ? "Yes" : "No"}
Keywords Required: ${template.structure.keywords ? "Yes" : "No"}

FORMATTING RULES FOR THIS CONFERENCE:
${template.formattingRules.map((rule, i) => `${i + 1}. ${rule}`).join("\n")}

SAMPLE STRUCTURE:
${template.sampleCode}
` : "";

    // Create context-aware prompt for formatting and editing
    const systemContext = `You are an expert LaTeX formatter and academic paper editor specializing in conference paper formatting.

Your role:
1. FORMAT existing content into proper LaTeX conference templates
2. TRANSFORM plain text or rough drafts into publication-ready LaTeX
3. APPLY conference-specific formatting rules (IEEE, ACM, NeurIPS, Springer LNCS, etc.)
4. ACT like an editor - restructure, reformat, and improve layout
5. PRESERVE the user's content while fixing structure and formatting
6. When asked to "format" or "apply template", analyze the current document and restructure it according to conference guidelines

${templateContext}

Current document:
${latexContent ? latexContent.substring(0, 2000) : "New document"}

When formatting or writing:
- Keep the user's ideas and content
- Apply proper LaTeX structure for the selected template
- Add necessary packages and commands
- Format sections, equations, figures according to conference rules
- Fix citation formats
- Ensure proper abstract, keywords, and structure
- Provide complete, working LaTeX code

IMPORTANT OUTPUT FORMAT RULES:
1. When user requests "format document" or "apply template": Return ONLY LaTeX code in a \`\`\`latex code block
2. For formatting requests: Wrap complete LaTeX code in \`\`\`latex ... \`\`\` blocks
3. For questions/help: You can explain, but always include code in \`\`\`latex blocks
4. Never add explanations before the code block for formatting requests
5. The code should be complete and ready to use directly

If user asks to "format my paper" or "apply [conference] format":
1. Analyze their current content
2. Apply the selected conference template structure
3. Preserve their text while reformatting
4. Return the complete LaTeX code wrapped in \`\`\`latex ... \`\`\` block
5. Maintain their content but improve structure and compliance
6. No explanatory text needed - just the code in a block`;

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

