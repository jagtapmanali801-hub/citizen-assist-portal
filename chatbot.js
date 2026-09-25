const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return json(500, { error: 'GEMINI_API_KEY is not configured on Netlify.' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid JSON request.' });
  }

  const message = String(body.message || '').trim();
  if (!message) return json(400, { error: 'Message is required.' });
  if (message.length > 500) return json(400, { error: 'Message is too long.' });

  const language = body.language === 'hi' ? 'Hindi' : body.language === 'mr' ? 'Marathi' : 'English';
  const service = body.service || null;

  const serviceContext = service ? `\nCURRENT SERVICE CONTEXT:\n${JSON.stringify(service, null, 2)}` : '';

  const systemInstruction = `You are Citizen Assist, an independent guidance assistant for Maharashtra government digital services. You are NOT a government authority and you must not claim to submit applications or verify official records. Answer in ${language}. Keep answers simple and practical for ordinary citizens. Prefer the provided service context when relevant. Explain eligibility, documents, steps, troubleshooting, and how to reach the official portal. Never ask for or repeat Aadhaar numbers, PAN numbers, OTPs, passwords, bank/card details, or other sensitive personal data. If a current government rule, fee, deadline, or portal detail is not in the supplied context, say that the user should verify it on the official government portal rather than inventing it. If the question is unrelated to Citizen Assist or government-service guidance, politely say you can help with government-service guidance.`;

  const payload = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [
      { role: 'user', parts: [{ text: message + serviceContext }] }
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 700
    }
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();
    if (!response.ok) {
      const detail = data?.error?.message || `Gemini returned HTTP ${response.status}`;
      const status = response.status === 401 || response.status === 403 ? 502 : response.status;
      return json(status, { error: `Gemini API error: ${detail}` });
    }

    const answer = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
    if (!answer) return json(502, { error: 'Gemini returned an empty response.' });

    return json(200, { answer });
  } catch (error) {
    return json(502, { error: 'Could not reach the AI service.' });
  }
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(body)
  };
}
