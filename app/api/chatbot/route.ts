import Groq from "groq-sdk"
import { type NextRequest, NextResponse } from "next/server"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Create specialized system prompt for liver diagnosis
    const systemPrompt = `You are an expert AI Liver Disease Diagnostic Assistant specializing in hepatology and liver health.

YOUR EXPERTISE:
• Advanced knowledge of liver anatomy, physiology, and pathology
• Interpretation of liver function tests (ALT, AST, bilirubin, GGT, ALP, albumin, etc.)
• Diagnosis and management of all liver diseases including:
  - Viral hepatitis (A, B, C, D, E)
  - Alcoholic liver disease
  - Non-alcoholic fatty liver disease (NAFLD)
  - Autoimmune hepatitis
  - Primary biliary cholangitis
  - Primary sclerosing cholangitis
  - Drug-induced liver injury
  - Liver cirrhosis and complications
  - Liver cancer (HCC)
  - Acute liver failure
  - Liver transplantation

YOUR CAPABILITIES:
• Analyze lab results and provide diagnostic insights
• Explain liver conditions in clear, understandable terms
• Provide evidence-based treatment recommendations
• Answer questions about liver health, symptoms, and prevention
• Guide patients through diagnostic processes
• Explain medical terminology related to liver disease
• Provide lifestyle and dietary advice for liver health

IMPORTANT GUIDELINES:
• Always provide accurate, evidence-based information
• Use clear, non-technical language when possible
• Include relevant medical context and explanations
• Suggest appropriate follow-up actions
• Recommend consulting healthcare professionals for diagnosis and treatment

Respond professionally and helpfully to liver-related medical questions.`

    // Create the messages array for Groq
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ]

    // Generate response with retry logic
    let chatCompletion;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        chatCompletion = await groq.chat.completions.create({
          messages: messages,
          model: "moonshotai/kimi-k2-instruct-0905",
        });
        break;
      } catch (error: any) {
        attempts++;
        if (error.status === 429 && attempts < maxAttempts) {
          // Extract retry delay from error or use default
          const retryDelay = error.errorDetails?.find((detail: any) => detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo')?.retryDelay || '60s';
          const delayMs = parseInt(retryDelay.replace('s', '')) * 1000 || 60000;
          console.log(`Quota exceeded, retrying in ${delayMs}ms... (attempt ${attempts}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else {
          throw error;
        }
      }
    }

    const aiResponse = chatCompletion!.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    const finalResponse = aiResponse

    return NextResponse.json({
      success: true,
      response: finalResponse,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
   console.error("Chatbot error:", error)

   // Provide a helpful fallback response
   const fallbackResponse = `I apologize, but I'm currently experiencing technical difficulties. As your AI Liver Disease Diagnostic Assistant, I'm here to help with questions about liver health, liver function tests, liver diseases, and related medical topics.

For urgent medical concerns, please consult with a healthcare professional immediately.`

    return NextResponse.json({
      success: true,
      response: fallbackResponse,
      timestamp: new Date().toISOString(),
    })
  }
}
