const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON body parsing
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Load schemes database
let schemesList = [];
try {
  const schemesPath = path.join(__dirname, 'schemes.json');
  schemesList = JSON.parse(fs.readFileSync(schemesPath, 'utf8'));
  console.log(`Successfully loaded ${schemesList.length} schemes from schemes.json`);
} catch (error) {
  console.error('Failed to load schemes.json:', error.message);
}

// --------------------------------------------------------
// Skills & AI Logic (Bilingual with 503 Retry)
// --------------------------------------------------------

/**
 * Helper: Call Gemini API with automatic retry on 503 errors
 */
async function callGeminiWithRetry(url, requestBody, maxRetries = 1, delayMs = 2000) {
  let attempt = 0;
  while (true) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.status === 503 && attempt < maxRetries) {
        console.warn(`[Gemini Retry] Received 503. Retrying in ${delayMs}ms (Attempt ${attempt + 1}/${maxRetries})...`);
        attempt++;
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }

      if (!response.ok) {
        throw new Error(`Gemini request failed with status ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt < maxRetries) {
        console.warn(`[Gemini Retry] Fetch error: ${error.message}. Retrying in ${delayMs}ms...`);
        attempt++;
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      throw error;
    }
  }
}

/**
 * Skill 1: Crop Diagnosis Agent
 */
async function diagnoseCropIssue(query, lang, apiKey) {
  console.log(`[Skill: diagnoseCropIssue] Running in language: ${lang}...`);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  let languageInstructions = '';
  if (lang === 'en') {
    languageInstructions = `- In very simple, easy-to-understand English.
- Warm, polite, and reassuring.
- Focus on practical, low-cost, organic/natural remedies first, followed by safe chemical options if necessary.
- Keep it concise (under 120 words) so it can be easily spoken aloud by text-to-speech.
- Use simple bullet points for readability.`;
  } else {
    languageInstructions = `- In very simple, easy-to-understand Hindi (देवनागरी लिपि में).
- Warm, polite, and reassuring.
- Focus on practical, low-cost, organic/natural remedies first, followed by safe chemical options if necessary.
- Keep it concise (under 120 words) so it can be easily spoken aloud by text-to-speech.
- Use simple bullet points for readability.`;
  }

  const prompt = `You are "KisanSathi" (किसानसाथी), an expert agricultural scientist helping a small farmer in India.
The farmer's query is: "${query}"

Provide a direct, practical, and clear diagnosis of the crop issue (pest, disease, nutrient deficiency, water issue, etc.).
Your response must be:
${languageInstructions}`;

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  const data = await callGeminiWithRetry(url, requestBody);
  return data.candidates[0].content.parts[0].text;
}

/**
 * Skill 2: Government Scheme Matcher
 */
async function matchGovernmentScheme(query, schemes, lang, apiKey) {
  console.log(`[Skill: matchGovernmentScheme] Running in language: ${lang}...`);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const schemesDataString = JSON.stringify(schemes, null, 2);
  
  let languageInstructions = '';
  if (lang === 'en') {
    languageInstructions = `Identify which schemes from the list above are relevant to the farmer's query. Use the name_en, eligibility_en, and benefits_en fields from the JSON.
For the matched scheme(s), provide:
- The scheme name.
- Simple explanation of benefits and eligibility in English.
- Brief instructions on how they can apply or what to do next.

If no specific scheme matches, suggest a general scheme like PM-KISAN or Kisan Credit Card (KCC) that benefits almost all farmers.
Your response must be:
- In very simple, warm English.
- Concisely structured (under 120 words total) so it can be spoken aloud.`;
  } else {
    languageInstructions = `Identify which schemes from the list above are relevant to the farmer's query. Use the name_hi, eligibility_hi, and benefits_hi fields from the JSON.
For the matched scheme(s), provide:
- The scheme name.
- Simple explanation of benefits and eligibility in Hindi.
- Brief instructions on how they can apply or what to do next.

If no specific scheme matches, suggest a general scheme like PM-KISAN or Kisan Credit Card (KCC) that benefits almost all farmers.
Your response must be:
- In very simple, warm Hindi (देवनागरी लिपि में).
- Concisely structured (under 120 words total) so it can be spoken aloud.`;
  }

  const prompt = `You are "KisanSathi" (किसानसाथी), helping a small farmer in India find relevant government schemes.
The farmer's query is: "${query}"

Below is a list of available agricultural schemes in India:
${schemesDataString}

${languageInstructions}`;

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  const data = await callGeminiWithRetry(url, requestBody);
  return data.candidates[0].content.parts[0].text;
}

/**
 * Helper: Detect Intent
 */
async function detectIntent(query, apiKey) {
  console.log('[Intent Detection] Analyzing query...');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const prompt = `You are an AI assistant for Indian farmers.
Analyze the following user query (in Hindi, English, or mixed English/Hindi): "${query}"
Determine if the user is asking about:
1. "crop_diagnosis": pests, crop diseases, plant health, farming methods, fertilizers, soil prep, or crop health.
2. "government_schemes": government schemes, loans, subsidies, PM-KISAN, crop insurance, financial help, or pensions.
3. "other": general greeting, questions about who you are, or unrelated questions.

You must respond in strict JSON format containing these keys with boolean values:
{
  "crop_diagnosis": true/false,
  "government_schemes": true/false,
  "other": true/false
}
Do not write anything else, only the JSON block. Do not include markdown code block syntax.`;

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json'
    }
  };

  const data = await callGeminiWithRetry(url, requestBody);
  const text = data.candidates[0].content.parts[0].text.trim();
  return JSON.parse(text);
}

/**
 * Helper: Consolidate crop diagnosis and government schemes into a single audio-friendly answer
 */
async function consolidateResponses(query, diagnosis, schemesInfo, lang, apiKey) {
  console.log(`[Consolidation] Merging skills output in language: ${lang}...`);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  let languageInstructions = '';
  if (lang === 'en') {
    languageInstructions = `Please merge these two responses into a single, cohesive, warm, and natural English response.
Guidelines:
- Start with a polite greeting.
- Provide the crop diagnosis details first.
- Transition naturally to the recommended government schemes that can help them (e.g. for buying pesticides/machinery, crop insurance, or general financial aid).
- You MUST insert the exact tag "[PAUSE]" (on its own line) right between the crop diagnosis section and the government schemes section.
- Keep it concise, practical, and direct (under 180 words total).
- Ensure it sounds extremely natural when read aloud via text-to-speech.`;
  } else {
    languageInstructions = `Please merge these two responses into a single, cohesive, warm, and natural Hindi response.
Guidelines:
- Start with a polite greeting.
- Provide the crop diagnosis details first.
- Transition naturally to the recommended government schemes that can help them (e.g. for buying pesticides/machinery, crop insurance, or general financial aid).
- You MUST insert the exact tag "[PAUSE]" (on its own line) right between the crop diagnosis section and the government schemes section.
- Keep it concise, practical, and direct (under 180 words total).
- Ensure it sounds extremely natural when read aloud via text-to-speech.`;
  }

  const prompt = `You are "KisanSathi" (किसानसाथी), an expert agricultural assistant.
You have processed a farmer's query: "${query}"

We have two pieces of information:
1. Crop Diagnosis:
${diagnosis}

2. Matching Government Schemes:
${schemesInfo}

${languageInstructions}`;

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  const data = await callGeminiWithRetry(url, requestBody);
  return data.candidates[0].content.parts[0].text;
}

/**
 * Helper: Handle general queries / greetings
 */
async function handleGeneralQuery(query, lang, apiKey) {
  console.log(`[General Logic] Handling greeting/other query in language: ${lang}...`);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  let prompt = '';
  if (lang === 'en') {
    prompt = `You are "KisanSathi", a warm and helpful AI voice assistant for Indian farmers.
The user said: "${query}"
Respond politely, warmly, and concisely in English (under 50 words). Introduce yourself as KisanSathi and tell them they can ask you about crop diseases or government schemes.`;
  } else {
    prompt = `You are "KisanSathi" (किसानसाथी), a warm and helpful AI voice assistant for Indian farmers.
The user said: "${query}"
Respond politely, warmly, and concisely in Hindi (under 50 words). Introduce yourself as KisanSathi (किसानसाथी) and tell them they can ask you about crop diseases (फसल की बीमारी) or government schemes (सरकारी योजनाएं).`;
  }

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  const data = await callGeminiWithRetry(url, requestBody);
  return data.candidates[0].content.parts[0].text;
}

// --------------------------------------------------------
// API Endpoint
// --------------------------------------------------------

app.get('/health', (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const forceOffline = process.env.FORCE_OFFLINE_MODE === 'true';
  const nodeEnv = process.env.NODE_ENV || 'development';

  const hasApiKey = !!apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE';

  res.json({
    apiKeyPresent: hasApiKey,
    nodeEnv: nodeEnv,
    forceOfflineMode: forceOffline
  });
});

app.post('/api/chat', async (req, res) => {
  const { message, lang = 'hi' } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  const forceOffline = process.env.FORCE_OFFLINE_MODE === 'true';

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message content is required.' });
  }

  if (message.length > 500) {
    return res.status(400).json({ error: 'Message is too long. Please keep your query concise.' });
  }

  if (forceOffline) {
    console.log('[Debug] FORCE_OFFLINE_MODE is active. Skipping Gemini API.');
    return res.status(500).json({ error: 'FORCE_OFFLINE_MODE_ACTIVE' });
  }

  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    console.warn('API Key is missing or default. Triggering fallback on server.');
    return res.status(500).json({ error: 'API_KEY_NOT_CONFIGURED' });
  }

  try {
    // 1. Detect Intent
    const intents = await detectIntent(message, apiKey);
    console.log('Detected intents:', intents);

    let diagnosis = null;
    let schemesInfo = null;

    // 2. Call Relevant Skills
    if (intents.crop_diagnosis) {
      diagnosis = await diagnoseCropIssue(message, lang, apiKey);
    }
    if (intents.government_schemes) {
      schemesInfo = await matchGovernmentScheme(message, schemesList, lang, apiKey);
    }

    // 3. Consolidate results into single output
    let finalReply = '';

    if (diagnosis && schemesInfo) {
      finalReply = await consolidateResponses(message, diagnosis, schemesInfo, lang, apiKey);
    } else if (diagnosis) {
      finalReply = diagnosis;
    } else if (schemesInfo) {
      finalReply = schemesInfo;
    } else {
      // General greetings or default behavior
      finalReply = await handleGeneralQuery(message, lang, apiKey);
    }

    return res.json({
      reply: finalReply,
      intents: intents,
      mode: 'online'
    });

  } catch (error) {
    console.error('Error processing chat query:', error.message);
    return res.status(500).json({ error: 'API_CALL_FAILED', details: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`KisanSathi backend running at http://localhost:${PORT}`);
});
