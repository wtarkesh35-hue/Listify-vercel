export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set in Vercel environment variables.' });
  }

  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'No prompt provided' });

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + process.env.GEMINI_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 1500 }
        })
      }
    );

    const rawText = await response.text();
    let data;
    try { data = JSON.parse(rawText); }
    catch(e) { return res.status(500).json({ error: 'Bad response from Gemini: ' + rawText.substring(0, 200) }); }

    if (data.error) return res.status(400).json({ error: data.error.message });
    if (!data.candidates?.[0]) return res.status(500).json({ error: 'No candidates returned. Check API key.' });

    return res.status(200).json({ text: data.candidates[0].content.parts[0].text });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
