const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return json(500, { error: 'GEMINI_API_KEY is not configured on Netlify.' });

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return json(400, { error: 'Invalid JSON request.' }); }

  const query = String(body.query || '').trim();
  const services = Array.isArray(body.services) ? body.services : [];
  if (!query) return json(400, { error: 'Search query is required.' });
  if (!services.length) return json(400, { error: 'Service catalogue is required.' });
  if (query.length > 120) return json(400, { error: 'Search query is too long.' });

  // Only send compact public catalogue fields to Gemini; never send secrets or user PII.
  const catalogue = services.slice(0, 500).map(s => ({
    id: String(s.id || ''),
    name: String(s.name || ''),
    nameMr: String(s.nameMr || ''),
    nameHi: String(s.nameHi || ''),
    category: String(s.category || ''),
    keywords: Array.isArray(s.keywords) ? s.keywords.slice(0, 12) : []
  }));

  const language = body.language === 'hi' ? 'Hindi' : body.language === 'mr' ? 'Marathi' : 'English';
  const prompt = `You are the smart search engine for Citizen Assist, a Maharashtra government-service guidance website.
The user searched in ${language}: "${query}"

Choose the most relevant service IDs from the supplied catalogue. Understand English, Hindi, Marathi, common spelling variations, synonyms and natural-language intent.
Return ONLY valid JSON in this exact shape:
{"ids":["id1","id2"],"keywords":["keyword1","keyword2"]}
Return at most 8 IDs and at most 8 short keywords. If nothing matches, return empty arrays.
Do not invent IDs. Use only IDs from the catalogue.

CATALOGUE:
${JSON.stringify(catalogue)}`;

  const payload = {
    systemInstruction: {
      parts: [{ text: 'Return strict JSON only. No markdown and no explanation.' }]
    },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 300,
      responseMimeType: 'application/json'
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
      return json(response.status === 401 || response.status === 403 ? 502 : response.status, {
        error: `Gemini API error: ${data?.error?.message || `HTTP ${response.status}`}`
      });
    }

    const raw = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
    if (!raw) return json(502, { error: 'Gemini returned an empty search response.' });

    let result;
    try { result = JSON.parse(raw); }
    catch { return json(502, { error: 'Gemini returned invalid search JSON.' }); }

    const validIds = new Set(catalogue.map(s => s.id));
    const ids = Array.isArray(result.ids)
      ? result.ids.filter(id => validIds.has(String(id))).map(String).slice(0, 8)
      : [];
    const keywords = Array.isArray(result.keywords)
      ? result.keywords.map(x => String(x).trim()).filter(Boolean).slice(0, 8)
      : [];

    return json(200, { ids, keywords });
  } catch {
    return json(502, { error: 'Could not reach the AI search service.' });
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
