const express = require('express');
const { readRepository } = require('../services/githubService');
const { identifyFeatures, generateLesson, reviewCode } = require('../services/aiService');

const router = express.Router();

router.post('/analyse', async (req, res, next) => {
  try {
    const repository = await readRepository(req.body.repositoryUrl);
    const analysis = await identifyFeatures(repository);
    res.json({ repository: { ...repository, source: undefined }, ...analysis });
  } catch (error) {
    next(error);
  }
});

router.post('/lesson', async (req, res, next) => {
  try {
    const lesson = await generateLesson(req.body);
    res.json(lesson);
  } catch (error) {
    next(error);
  }
});

router.post('/feedback', async (req, res, next) => {
  try {
    const feedback = await reviewCode(req.body);
    res.json(feedback);
  } catch (error) {
    next(error);
  }
});

router.post('/publish', (req, res) => {
  const { title, videoUrl, repositoryUrl } = req.body;
  if (!title || !videoUrl) {
    return res.status(400).json({ error: 'A title and video URL are required.' });
  }
  return res.status(201).json({
    id: Date.now(),
    title,
    videoUrl,
    repositoryUrl,
    publishedAt: new Date().toISOString(),
  });
});

router.post('/promo-video', async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: 'OpenAI is not configured.' });
    }
    const repository = String(req.body.repository || '').slice(0, 120);
    const description = String(req.body.description || '').slice(0, 500);
    const features = Array.isArray(req.body.features)
      ? req.body.features.slice(0, 3).map((feature) => String(feature).slice(0, 100))
      : [];
    const prompt = [
      'Create an 8-second polished landscape startup advertisement for a software project.',
      `Product name: ${repository}. Product purpose: ${description}.`,
      `Key features: ${features.join(', ')}.`,
      'Show a fictional adult professional at a modern desk using a laptop.',
      'Cut to an over-the-shoulder view of a clean generic product interface.',
      `Demonstrate: ${features[0] || 'sign in'}, then ${features[1] || 'use the main feature'}, then a successful dashboard result.`,
      'Use smooth camera movement, premium green-and-charcoal styling, realistic hands, minimal interface text, upbeat business energy, and subtle synced technology audio.',
      `End with a title card: "${repository} — Learn it. Build it."`,
      'Do not show real logos, public figures, children, or recognizable people.',
    ].join(' ');
    const form = new FormData();
    form.append('model', process.env.OPENAI_VIDEO_MODEL || 'sora-2');
    form.append('prompt', prompt);
    form.append('seconds', '8');
    form.append('size', '1280x720');
    const response = await fetch('https://api.openai.com/v1/videos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'The AI video could not be started.');
    }
    return res.status(202).json({ id: data.id, status: data.status, progress: data.progress || 0 });
  } catch (error) {
    return next(error);
  }
});

router.get('/promo-video/:id', async (req, res, next) => {
  try {
    if (!/^video_[A-Za-z0-9_-]+$/.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid video identifier.' });
    }
    const response = await fetch(`https://api.openai.com/v1/videos/${req.params.id}`, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Could not check video progress.');
    return res.json({
      id: data.id,
      status: data.status,
      progress: data.progress || 0,
      error: data.error?.message,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/promo-video/:id/content', async (req, res, next) => {
  try {
    if (!/^video_[A-Za-z0-9_-]+$/.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid video identifier.' });
    }
    const response = await fetch(`https://api.openai.com/v1/videos/${req.params.id}/content`, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error?.message || 'Could not download the generated video.');
    }
    const content = Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Type', response.headers.get('content-type') || 'video/mp4');
    res.setHeader('Content-Length', content.length);
    return res.send(content);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
