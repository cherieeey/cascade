/* global esc, error */

let videoState = null;

window.renderRepoVideo = function renderRepoVideo(data) {
  const fallbackScenes = [
    { eyebrow: 'WELCOME', headline: `What can ${data.repository.name} teach you?`, body: data.summary, visual: 'intro', featureName: data.repository.name },
    { eyebrow: 'HOW IT WORKS', headline: 'Follow data through the application', body: data.repository.description, visual: 'architecture', demoSteps: [{ label: 'Interface', text: 'User starts an action' }, { label: 'Server', text: 'Application processes it' }, { label: 'Data', text: 'The result is stored and returned' }] },
    ...data.features.slice(0, 3).map((feature) => ({ eyebrow: 'FEATURE DEMO', headline: feature.name, body: feature.description, visual: 'feature', featureName: feature.name, demoSteps: [{ label: 'User action', text: feature.demoScript?.[0] || 'The user starts the feature' }, { label: 'App logic', text: feature.demoScript?.[1] || 'The application processes the request' }, { label: 'Visible result', text: feature.demoScript?.[2] || feature.description }], files: feature.evidence })),
    { eyebrow: 'YOUR OUTCOME', headline: 'Understand it. Then build it.', body: 'Choose a learning path below and practise the feature step by step.', visual: 'outcome', demoSteps: [{ label: 'Discover', text: 'See how the feature behaves' }, { label: 'Build', text: 'Implement it step by step' }, { label: 'Check', text: 'Get feedback on your code' }] },
  ];

  videoState = {
    scenes: data.video?.scenes?.length ? data.video.scenes : fallbackScenes,
    index: 0,
    playing: true,
    elapsed: 0,
    timer: null,
    sceneMs: 5500,
  };

  document.querySelector('#repo-video').innerHTML = `
    <div class="video-shell">
      <div id="video-stage" class="video-stage"></div>
      <div class="video-controls">
        <button id="video-play">Pause</button>
        <button id="video-replay">↺ Replay</button>
        <div class="video-progress"><i id="video-progress-bar"></i></div>
        <span id="video-time" class="video-time">0:00 / 0:28</span>
        <button id="video-narrate">Narrate</button>
        <button id="generate-promo" class="generate-promo">Generate AI promo</button>
      </div>
      <div id="promo-result"></div>
    </div>`;

  drawVideoScene();
  startVideo();
  document.querySelector('#video-play').onclick = toggleVideo;
  document.querySelector('#video-replay').onclick = replayVideo;
  document.querySelector('#video-narrate').onclick = narrateScene;
  document.querySelector('#generate-promo').onclick = () => generatePromoVideo(data);
};

function drawVideoScene() {
  const scene = videoState.scenes[videoState.index];
  document.querySelector('#video-stage').innerHTML = `
    <div class="video-copy">
      <span class="scene-number">${esc(scene.eyebrow || `SCENE ${videoState.index + 1}`)} · 0${videoState.index + 1}</span>
      <h2>${esc(scene.headline)}</h2>
      <p>${esc(scene.body)}</p>
    </div>
    <div class="video-visual">${renderSceneVisual(scene)}</div>`;
}

function renderSceneVisual(scene) {
  const steps = scene.demoSteps || [];
  if (scene.visual === 'architecture') {
    return `<div class="architecture-demo">${steps.map((step, index) => `<div class="architecture-node"><span>${index + 1}</span><b>${esc(step.label)}</b><small>${esc(step.text)}</small></div>${index < steps.length - 1 ? '<i>→</i>' : ''}`).join('')}</div>`;
  }
  if (scene.visual === 'feature') {
    return `<div class="product-demo"><div class="product-bar"><i></i><i></i><i></i><span>${esc(scene.featureName || 'Feature demo')}</span></div><div class="demo-screen"><div class="demo-sidebar"><b>C</b><i></i><i></i><i></i></div><div class="demo-content">${steps.map((step, index) => `<div class="demo-step"><span>${index + 1}</span><div><small>${esc(step.label)}</small><b>${esc(step.text)}</b></div></div>`).join('')}</div><div class="demo-cursor">↖</div></div><div class="demo-files">${(scene.files || []).slice(0, 2).map((file) => `<code>${esc(file)}</code>`).join('')}</div></div>`;
  }
  if (scene.visual === 'outcome') {
    return `<div class="outcome-demo">${steps.map((step) => `<div><span>✓</span><p><b>${esc(step.label)}</b><small>${esc(step.text)}</small></p></div>`).join('')}</div>`;
  }
  return `<div class="intro-demo"><div class="repo-cube">⌘</div><b>${esc(scene.featureName || 'Repository')}</b><span>Analysed by Cascade AI</span></div>`;
}

function startVideo() {
  clearInterval(videoState.timer);
  videoState.timer = setInterval(() => {
    if (!videoState.playing) return;
    videoState.elapsed += 100;
    const total = videoState.scenes.length * videoState.sceneMs;
    if (videoState.elapsed >= (videoState.index + 1) * videoState.sceneMs) {
      if (videoState.index < videoState.scenes.length - 1) {
        videoState.index += 1;
        drawVideoScene();
      } else {
        videoState.playing = false;
        document.querySelector('#video-play').textContent = 'Play';
      }
    }
    document.querySelector('#video-progress-bar').style.width = `${Math.min(100, (videoState.elapsed / total) * 100)}%`;
    document.querySelector('#video-time').textContent = `0:${String(Math.floor(videoState.elapsed / 1000)).padStart(2, '0')} / 0:${String(Math.floor(total / 1000)).padStart(2, '0')}`;
  }, 100);
}

function toggleVideo() {
  videoState.playing = !videoState.playing;
  document.querySelector('#video-play').textContent = videoState.playing ? 'Pause' : 'Play';
}

function replayVideo() {
  videoState.index = 0;
  videoState.elapsed = 0;
  videoState.playing = true;
  drawVideoScene();
  document.querySelector('#video-play').textContent = 'Pause';
}

function narrateScene() {
  if (!('speechSynthesis' in window)) {
    error('Narration is not supported in this browser.');
    return;
  }
  speechSynthesis.cancel();
  const scene = videoState.scenes[videoState.index];
  speechSynthesis.speak(new SpeechSynthesisUtterance(`${scene.headline}. ${scene.body}`));
}

async function generatePromoVideo(data) {
  const accepted = window.confirm(
    'Generate an 8-second AI promotional video? This uses the OpenAI Video API and costs approximately US$0.80.',
  );
  if (!accepted) return;
  const button = document.querySelector('#generate-promo');
  const result = document.querySelector('#promo-result');
  button.disabled = true;
  button.textContent = 'Starting...';
  result.innerHTML = '<div class="promo-rendering"><b>Preparing your AI promo</b><p>Submitting the repository story to the video model...</p><div><i></i></div></div>';
  try {
    const response = await fetch('/api/learning/promo-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repository: `${data.repository.owner}/${data.repository.name}`,
        description: data.repository.description,
        features: data.features.slice(0, 3).map((feature) => feature.name),
      }),
    });
    const job = await response.json();
    if (!response.ok) throw new Error(job.error || 'Could not start the video.');
    await pollPromoVideo(job.id);
  } catch (generationError) {
    result.innerHTML = `<div class="promo-error">${esc(generationError.message)}</div>`;
    button.disabled = false;
    button.textContent = 'Generate AI promo';
  }
}

async function pollPromoVideo(id) {
  const button = document.querySelector('#generate-promo');
  const result = document.querySelector('#promo-result');
  for (let attempt = 0; attempt < 90; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 4000));
    const response = await fetch(`/api/learning/promo-video/${id}`);
    const job = await response.json();
    if (!response.ok) throw new Error(job.error || 'Could not check the video.');
    const progress = Math.max(2, job.progress || 0);
    button.textContent = `Rendering ${progress}%`;
    result.innerHTML = `<div class="promo-rendering"><b>Creating your business promo</b><p>Generating a fictional user, product screens, motion, and audio. This can take a few minutes.</p><div><i style="width:${progress}%"></i></div></div>`;
    if (job.status === 'completed') {
      result.innerHTML = `<div class="generated-video"><div><b>AI business promo</b><span>8 seconds - Generated for this repository</span></div><video controls autoplay playsinline src="/api/learning/promo-video/${id}/content"></video></div>`;
      button.disabled = false;
      button.textContent = 'Generate another';
      return;
    }
    if (job.status === 'failed') throw new Error(job.error || 'Video generation failed.');
  }
  throw new Error('Video generation is taking longer than expected. Please try again later.');
}
