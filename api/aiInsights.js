/**
 * AI treatment insights — xAI Grok (default). Optional: Claude / Gemini.
 *
 * Env:
 *   AI_PROVIDER=grok|claude|gemini   (default: grok)
 *   XAI_API_KEY=...                  or GROK_API_KEY (from https://console.x.ai/)
 *   GROK_MODEL=grok-3-mini           (optional; also accepts XAI_MODEL)
 *   ANTHROPIC_API_KEY=...            if AI_PROVIDER=claude
 *   GEMINI_API_KEY=...               if AI_PROVIDER=gemini
 */

const SYSTEM_PROMPT = `You are a pediatric neurodiversity screening assistant helping therapists draft treatment-plan ideas.
You are NOT diagnosing. Provide cautious, practical, non-definitive suggestions only.
Base recommendations on the questionnaire answers, scores/risk, and therapist behavior notes when provided.
Return ONLY valid JSON (no markdown fences) with this shape:
{
  "insights": [
    {
      "id": "1",
      "title": "Short section title",
      "insight": "2-4 sentences of clinical-style reasoning and cross-domain connections.",
      "activities": ["Concrete activity 1", "Concrete activity 2", "Concrete activity 3"]
    }
  ]
}
Generate 2 to 4 insight sections. Titles should fit the child's pattern (do not force fixed categories).
Keep language professional, supportive, and suitable for therapist review.`;

function getProvider() {
  const raw = String(process.env.AI_PROVIDER || 'grok').trim().toLowerCase();
  if (raw === 'claude' || raw === 'anthropic') return 'claude';
  if (raw === 'gemini' || raw === 'google') return 'gemini';
  return 'grok';
}

function buildUserPrompt(payload) {
  const {
    questionnaireName,
    questionnaireType,
    riskLevel,
    totalScore,
    maxScore,
    behaviorNotes,
    answers,
    questions,
  } = payload || {};

  const answerLines = [];
  if (Array.isArray(questions) && questions.length > 0) {
    for (const q of questions) {
      const id = String(q.id || '');
      const text = String(q.question || q.question_text || '');
      const answer = answers && id ? answers[id] : undefined;
      answerLines.push(`- Q: ${text}\n  A: ${answer ?? 'Not answered'}`);
    }
  } else if (answers && typeof answers === 'object') {
    for (const [id, answer] of Object.entries(answers)) {
      answerLines.push(`- Question ${id}: ${answer}`);
    }
  }

  return [
    'Analyze this screening and suggest treatment-plan insights.',
    '',
    `Questionnaire: ${questionnaireName || questionnaireType || 'Unknown'}`,
    `Risk level: ${riskLevel || 'Unknown'}`,
    `Total score: ${totalScore != null ? totalScore : 'n/a'}${maxScore != null ? ` / ${maxScore}` : ''}`,
    '',
    'Therapist behavior notes:',
    behaviorNotes?.trim() ? behaviorNotes.trim() : '(none provided)',
    '',
    'Questionnaire responses:',
    answerLines.length > 0 ? answerLines.join('\n') : '(none provided)',
  ].join('\n');
}

function extractJsonObject(text) {
  const raw = String(text || '').trim();
  if (!raw) throw new Error('Empty model response');

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : raw;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model response was not JSON');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function normalizeInsights(parsed) {
  const list = Array.isArray(parsed?.insights)
    ? parsed.insights
    : Array.isArray(parsed)
      ? parsed
      : [];

  return list
    .map((item, index) => {
      const activities = Array.isArray(item?.activities)
        ? item.activities.map((a) => String(a).trim()).filter(Boolean)
        : typeof item?.activities === 'string' && item.activities.trim()
          ? [item.activities.trim()]
          : [];

      return {
        id: String(item?.id || index + 1),
        title: String(item?.title || `Insight ${index + 1}`).trim(),
        insight: String(item?.insight || item?.description || '').trim(),
        activities,
      };
    })
    .filter((item) => item.insight);
}

async function callGrok(userPrompt) {
  const apiKey = (
    process.env.XAI_API_KEY ||
    process.env.GROK_API_KEY ||
    ''
  ).trim();
  if (!apiKey) {
    throw new Error(
      'Missing XAI_API_KEY (or GROK_API_KEY). Add your Grok key from https://console.x.ai/ to api/.env',
    );
  }

  const model = (
    process.env.GROK_MODEL ||
    process.env.XAI_MODEL ||
    'grok-3-mini'
  ).trim();

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      `Grok request failed with HTTP ${response.status}`;
    throw new Error(message);
  }

  const text = data?.choices?.[0]?.message?.content || '';
  return extractJsonObject(text);
}

async function callGemini(userPrompt) {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY in api/.env');
  }

  const model = (process.env.GEMINI_MODEL || 'gemini-2.0-flash').trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }] }],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json',
      },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      `Gemini request failed with HTTP ${response.status}`;
    throw new Error(message);
  }

  const text =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  return extractJsonObject(text);
}

async function callClaude(userPrompt) {
  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY in api/.env');
  }

  const model = (process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514').trim();
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      temperature: 0.4,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      `Claude request failed with HTTP ${response.status}`;
    throw new Error(message);
  }

  const text = Array.isArray(data?.content)
    ? data.content.map((part) => (part?.type === 'text' ? part.text : '')).join('')
    : '';
  return extractJsonObject(text);
}

async function generateTreatmentInsights(payload) {
  const provider = getProvider();
  const userPrompt = buildUserPrompt(payload);
  let parsed;
  if (provider === 'claude') parsed = await callClaude(userPrompt);
  else if (provider === 'gemini') parsed = await callGemini(userPrompt);
  else parsed = await callGrok(userPrompt);

  const insights = normalizeInsights(parsed);
  if (insights.length === 0) {
    throw new Error('AI returned no usable insights');
  }
  return { provider, insights };
}

function registerAiInsightRoutes({ app, sendJson }) {
  app.post('/api/ai/treatment-insights', async (req, res) => {
    try {
      const body = req.body || {};
      if (!body.answers && !body.behaviorNotes && !Array.isArray(body.questions)) {
        return sendJson(res, 400, {
          success: false,
          error: 'Provide screening answers and/or behavior notes to generate insights.',
        });
      }

      const result = await generateTreatmentInsights(body);
      return sendJson(res, 200, { success: true, data: result });
    } catch (error) {
      console.error('[api] POST /api/ai/treatment-insights:', error);
      return sendJson(res, 500, {
        success: false,
        error: error.message || 'Failed to generate AI insights',
      });
    }
  });
}

module.exports = {
  registerAiInsightRoutes,
  generateTreatmentInsights,
};
