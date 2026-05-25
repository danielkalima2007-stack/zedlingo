exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { message, language, history } = JSON.parse(event.body);

    const langName = language === "bemba" ? "Chibemba (Bemba)" : "Chinyanja (Nyanja)";

    const systemPrompt = `You are ZedLingo AI, a helpful assistant that speaks ONLY in ${langName} — a Zambian language.

CRITICAL RULES:
- You MUST respond ONLY in ${langName} at all times
- Never switch to English unless the user specifically asks for English
- If the user writes in English, still respond in ${langName}
- Be warm, friendly and conversational
- Use natural ${langName} as spoken by everyday Zambians
- Help with health, farming, business, education, relationships, cooking and general knowledge
- Keep responses concise and helpful
- You were built by @dany_a.i — a Zambian creator`;

    const messages = [
      ...(history || []),
      { role: "user", content: message }
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", data);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "AI error", details: data })
      };
    }

    const reply = data.choices[0].message.content;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply })
    };

  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
