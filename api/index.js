const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { registerTherapistAccountRoutes } = require('./therapistAccounts');

const app = express();

app.use(cors());
app.use(express.json());

// Never use a Postgres connection string as SUPABASE_URL — createClient needs https://<ref>.supabase.co
const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.DATABASE_SERVICE_ROLE_KEY ||
  ''
).trim();

const looksLikeJwt = (s) => typeof s === 'string' && /^eyJ/i.test(s.replace(/^\uFEFF/, ''));
const looksLikePostgresUrl = (s) => typeof s === 'string' && /^postgres(ql)?:\/\//i.test(s);
const looksLikeHttpApiUrl = (s) => typeof s === 'string' && /^https?:\/\//i.test(s);

let supabase = null;
try {
  if (
    looksLikeHttpApiUrl(SUPABASE_URL) &&
    SUPABASE_SERVICE_ROLE_KEY &&
    !looksLikePostgresUrl(SUPABASE_SERVICE_ROLE_KEY) &&
    looksLikeJwt(SUPABASE_SERVICE_ROLE_KEY)
  ) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  }
} catch (e) {
  console.error('[api] createClient failed:', e.message || e);
  supabase = null;
}

const sendJson = (res, status, body) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(status).json(body);
};

const requireSupabase = (res) => {
  if (!looksLikeHttpApiUrl(SUPABASE_URL)) {
    sendJson(res, 500, {
      success: false,
      error:
        'Invalid or missing SUPABASE_URL. It must be your project HTTPS URL (e.g. https://xxxx.supabase.co), not a postgres:// connection string. Set SUPABASE_URL in api/.env.',
    });
    return false;
  }
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    sendJson(res, 500, {
      success: false,
      error:
        'Missing SUPABASE_SERVICE_ROLE_KEY. Use the service_role JWT from Supabase Dashboard → Settings → API (see api/.env.example).',
    });
    return false;
  }
  if (looksLikePostgresUrl(SUPABASE_SERVICE_ROLE_KEY)) {
    sendJson(res, 500, {
      success: false,
      error:
        'SUPABASE_SERVICE_ROLE_KEY looks like a Postgres URL. Use the service_role JWT from Supabase Dashboard → Settings → API.',
    });
    return false;
  }
  if (!looksLikeJwt(SUPABASE_SERVICE_ROLE_KEY)) {
    sendJson(res, 500, {
      success: false,
      error:
        'SUPABASE_SERVICE_ROLE_KEY must be the service_role JWT (starts with eyJ). Check api/.env for typos or quotes.',
    });
    return false;
  }
  if (!supabase) {
    sendJson(res, 500, {
      success: false,
      error: 'Supabase client is not initialized. Fix SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY and restart the API.',
    });
    return false;
  }
  return true;
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  return sendJson(res, 200, {
    status: 'healthy',
    message: 'Node.js API is running',
    supabaseConfigured: !!(supabase && looksLikeHttpApiUrl(SUPABASE_URL)),
  });
});

// Therapist Accounts (doctors table)
registerTherapistAccountRoutes({
  app,
  requireSupabase,
  sendJson,
  getSupabase: () => supabase,
});

// Assessment Tools - Get all questionnaires with questions
app.get('/api/assessment-tools/questionnaires', async (req, res) => {
  if (!requireSupabase(res)) return;

  try {
    const { data: questionnaires, error: questionnairesError } = await supabase
      .from('questionnaires')
      .select('id, code, name, description, ui_icon, is_active, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (questionnairesError) {
      return sendJson(res, 500, { success: false, error: questionnairesError.message });
    }

    const questionnaireIds = (questionnaires || []).map((q) => q.id);
    let questions = [];

    if (questionnaireIds.length > 0) {
      const { data: questionsData, error: questionsError } = await supabase
        .from('questionaire')
        .select(
          'question_id, question_text, max_score, question_order, critical_item, questionnaires_id'
        )
        .in('questionnaires_id', questionnaireIds)
        .order('question_order', { ascending: true });

      if (questionsError) {
        return sendJson(res, 500, { success: false, error: questionsError.message });
      }

      questions = questionsData || [];
    }

    const groupedQuestions = {};
    for (const question of questions) {
      if (!groupedQuestions[question.questionnaires_id]) {
        groupedQuestions[question.questionnaires_id] = [];
      }
      groupedQuestions[question.questionnaires_id].push(question);
    }

    const payload = (questionnaires || []).map((q) => ({
      ...q,
      questions: groupedQuestions[q.id] || [],
    }));

    return sendJson(res, 200, { success: true, data: payload });
  } catch (error) {
    console.error('[api] GET questionnaires:', error);
    return sendJson(res, 500, {
      success: false,
      error: error.message || 'Failed to fetch questionnaires',
    });
  }
});

// Assessment Tools - Create questionnaire
app.post('/api/assessment-tools/questionnaires', async (req, res) => {
  if (!requireSupabase(res)) return;

  try {
    const { name, description, code, ui_icon } = req.body || {};

    if (!name || !String(name).trim()) {
      return sendJson(res, 400, { success: false, error: 'name is required' });
    }

    const safeName = String(name).trim();
    const generatedCode =
      code && String(code).trim()
        ? String(code).trim()
        : safeName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

    const { data, error } = await supabase
      .from('questionnaires')
      .insert({
        name: safeName,
        code: generatedCode || null,
        description: description ? String(description).trim() : null,
        ui_icon: ui_icon ? String(ui_icon).trim() : null,
        is_active: true,
      })
      .select('id, code, name, description, ui_icon, is_active, created_at')
      .single();

    if (error) {
      return sendJson(res, 500, { success: false, error: error.message });
    }

    return sendJson(res, 201, { success: true, data });
  } catch (error) {
    console.error('[api] POST questionnaire:', error);
    return sendJson(res, 500, { success: false, error: error.message || 'Failed to create questionnaire' });
  }
});

// Assessment Tools - Delete questionnaire (and child questions)
app.delete('/api/assessment-tools/questionnaires/:id', async (req, res) => {
  if (!requireSupabase(res)) return;

  try {
    const { id } = req.params;

    const { error: deleteQuestionsError } = await supabase
      .from('questionaire')
      .delete()
      .eq('questionnaires_id', id);
    if (deleteQuestionsError) {
      return sendJson(res, 500, { success: false, error: deleteQuestionsError.message });
    }

    const { error: deleteQuestionnaireError } = await supabase
      .from('questionnaires')
      .delete()
      .eq('id', id);
    if (deleteQuestionnaireError) {
      return sendJson(res, 500, { success: false, error: deleteQuestionnaireError.message });
    }

    return sendJson(res, 200, { success: true });
  } catch (error) {
    console.error('[api] DELETE questionnaire:', error);
    return sendJson(res, 500, { success: false, error: error.message || 'Failed to delete questionnaire' });
  }
});

// Assessment Tools - Create question
app.post('/api/assessment-tools/questions', async (req, res) => {
  if (!requireSupabase(res)) return;

  try {
    const { questionnaires_id, question_text, max_score, critical_item } = req.body || {};

    if (!questionnaires_id || !String(questionnaires_id).trim()) {
      return sendJson(res, 400, { success: false, error: 'questionnaires_id is required' });
    }
    if (!question_text || !String(question_text).trim()) {
      return sendJson(res, 400, { success: false, error: 'question_text is required' });
    }

    const score = Number(max_score);
    if (!Number.isFinite(score) || score < 0) {
      return sendJson(res, 400, { success: false, error: 'max_score must be a non-negative number' });
    }

    const { count, error: countError } = await supabase
      .from('questionaire')
      .select('question_id', { count: 'exact', head: true })
      .eq('questionnaires_id', questionnaires_id);
    if (countError) {
      return sendJson(res, 500, { success: false, error: countError.message });
    }

    const nextOrder = (count || 0) + 1;

    const { data, error } = await supabase
      .from('questionaire')
      .insert({
        questionnaires_id,
        question_text: String(question_text).trim(),
        max_score: score,
        question_order: nextOrder,
        critical_item: !!critical_item,
      })
      .select(
        'question_id, question_text, max_score, question_order, critical_item, questionnaires_id'
      )
      .single();

    if (error) {
      return sendJson(res, 500, { success: false, error: error.message });
    }

    return sendJson(res, 201, { success: true, data });
  } catch (error) {
    console.error('[api] POST question:', error);
    return sendJson(res, 500, { success: false, error: error.message || 'Failed to create question' });
  }
});

// Assessment Tools - Delete question
app.delete('/api/assessment-tools/questions/:questionId', async (req, res) => {
  if (!requireSupabase(res)) return;

  try {
    const { questionId } = req.params;

    const { error } = await supabase.from('questionaire').delete().eq('question_id', questionId);
    if (error) {
      return sendJson(res, 500, { success: false, error: error.message });
    }

    return sendJson(res, 200, { success: true });
  } catch (error) {
    console.error('[api] DELETE question:', error);
    return sendJson(res, 500, { success: false, error: error.message || 'Failed to delete question' });
  }
});

// Ensure JSON error for unhandled rejections in routes (Express 4 does not catch async throws automatically)
app.use((err, req, res, next) => {
  console.error('[api] Unhandled error:', err);
  if (res.headersSent) return next(err);
  return sendJson(res, 500, { success: false, error: err.message || 'Internal server error' });
});

// Local dev: `node index.js` from `api/` (default 3001; Vite proxies /api here)
if (require.main === module) {
  const listenPort = Number(process.env.PORT) || 3001;
  app.listen(listenPort, '0.0.0.0', () => {
    console.log(`BloomSense API: http://127.0.0.1:${listenPort} (and http://localhost:${listenPort})`);
    console.log('  Credentials: api/.env → SUPABASE_URL (https://…supabase.co) + SUPABASE_SERVICE_ROLE_KEY (JWT)');
  });
}

module.exports = app;
