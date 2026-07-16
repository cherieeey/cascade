const MODEL = process.env.OPENAI_MODEL || 'gpt-5.4-mini';

async function createResponse(instructions, input) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI is not configured. Add OPENAI_API_KEY to .env.development.');
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      instructions,
      input,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data.error?.message || 'OpenAI could not complete the request.';
    throw new Error(message);
  }

  const outputText = data.output_text || data.output
    ?.flatMap((item) => item.content || [])
    .filter((item) => item.type === 'output_text')
    .map((item) => item.text)
    .join('');

  if (!outputText) {
    throw new Error('OpenAI returned no text. Please try the analysis again.');
  }

  return outputText;
}

function parseJson(text) {
  if (typeof text !== 'string') {
    throw new Error('OpenAI returned an unexpected response. Please try again.');
  }
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error('OpenAI returned an invalid analysis. Please try again.');
  }
}

async function identifyFeatures(repository) {
  const text = await createResponse(
    'You are a senior software educator and short-form product-demo writer. Inspect repository excerpts and explain what a student can learn by showing what the real features do. Return only valid JSON with shape {"summary":"...","video":{"title":"...","durationSeconds":40,"scenes":[{"eyebrow":"...","headline":"...","body":"...","visual":"intro|architecture|feature|outcome","featureName":"...","demoSteps":[{"label":"User action|App logic|Visible result","text":"..."}],"files":["path"]}]},"features":[{"id":"kebab-case","name":"...","description":"...","difficulty":"Beginner|Intermediate|Advanced","evidence":["file path"],"demoScript":["step"]}]}. Create 6 scenes: one short hook, one architecture overview, three scenes demonstrating three different real user-visible features, and one learning outcome. For every feature scene, demoSteps must clearly say what the user does, what the application does internally, and what result appears on screen. Include 1 to 3 supporting file paths. Keep scene text concise and factual. Do not invent anything not supported by the files.',
    `Repository: ${repository.owner}/${repository.name}\nDescription: ${repository.description}\n\n${repository.source}`,
  );
  return parseJson(text);
}

async function generateLesson({ repository, feature, level }) {
  const text = await createResponse(
    'You are a supportive coding tutor. Create a personalised lesson grounded in the supplied repository and feature. Return only valid JSON with shape {"title":"...","goal":"...","estimatedMinutes":number,"prerequisites":["..."],"steps":[{"title":"...","explanation":"...","files":["..."],"task":"...","checkpoint":"...","language":"javascript","codeExample":"..."}]}. Use 4 to 7 achievable steps. Every step must include a concise, useful code example that matches the repository stack and named files. The code should be a valid starter implementation, but use one clearly marked TODO for the student to complete. Do not include Markdown code fences inside codeExample.',
    `Student level: ${level}\nRepository: ${repository}\nFeature: ${JSON.stringify(feature)}`,
  );
  return parseJson(text);
}

async function reviewCode({ repository, feature, code, question }) {
  const text = await createResponse(
    'You are a kind code reviewer helping a student learn. Do not provide the full finished solution. Return only valid JSON with shape {"status":"On track|Needs changes|Ready","strengths":["..."],"hints":[{"priority":"High|Medium|Low","message":"..."}],"nextStep":"..."}. Focus on correctness, security, clarity, and the selected feature.',
    `Repository: ${repository}\nFeature: ${feature}\nStudent question: ${question || 'Please review my progress.'}\n\nStudent code:\n${code.slice(0, 20_000)}`,
  );
  return parseJson(text);
}

module.exports = { identifyFeatures, generateLesson, reviewCode };
