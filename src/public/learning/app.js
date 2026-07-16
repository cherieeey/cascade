const state={repository:null,features:[],feature:null,lesson:null,step:0,drafts:{}};const views=[...document.querySelectorAll('.view')];const toast=document.querySelector('#toast');function show(id){views.forEach(v=>v.classList.toggle('active',v.id===id));scrollTo(0,0);const map={'import-view':0,'loading-view':0,'features-view':1,'lesson-view':2,'feedback-view':3,'publish-view':3};document.querySelectorAll('.progress i').forEach((x,i)=>x.classList.toggle('active',i<=map[id]));document.querySelector('#progress-label').textContent={0:'Import',1:'Discover',2:'Learn',3:'Complete'}[map[id]]}function error(message){toast.textContent=message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),5000)}async function api(path,body){const response=await fetch(`/api/learning/${path}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw new Error(data.error||'Something went wrong.');return data}document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>show(b.dataset.back));
document.querySelector('#repo-form').onsubmit=async e=>{e.preventDefault();show('loading-view');const messages=['Reading repository structure','Finding user-visible behaviour','Connecting features to source files','Preparing your learning choices'];let i=0;const timer=setInterval(()=>document.querySelector('#loading-message').textContent=messages[++i%messages.length],1400);try{const data=await api('analyse',{repositoryUrl:document.querySelector('#repo-url').value});state.repository=data.repository;state.features=data.features;renderFeatures(data);if(window.renderRepoVideo)window.renderRepoVideo(data);show('features-view')}catch(ex){error(ex.message);show('import-view')}finally{clearInterval(timer)}};
function esc(value){const d=document.createElement('div');d.textContent=value;return d.innerHTML}function renderFeatures(data){document.querySelector('#repo-summary').innerHTML=`<div class="repo-summary"><b>⌘</b><div><strong>${esc(data.repository.owner)}/${esc(data.repository.name)}</strong><small>${esc(data.repository.description)}</small></div><span>${data.repository.language} · ${data.repository.fileCount} files</span></div>`;document.querySelector('#feature-count').textContent=`${data.features.length} learning paths`;document.querySelector('#feature-grid').innerHTML=data.features.map((f,i)=>`<article class="feature-card"><span class="number">0${i+1}</span><h3>${esc(f.name)}</h3><p>${esc(f.description)}</p><small>${esc(f.difficulty)} · Evidence in ${f.evidence.length} file${f.evidence.length===1?'':'s'}</small><button data-index="${i}">Build this feature →</button></article>`).join('');document.querySelectorAll('.feature-card button').forEach(b=>b.onclick=()=>createLesson(Number(b.dataset.index)))}
async function createLesson(index){state.feature=state.features[index];show('loading-view');document.querySelector('#loading-message').textContent='Designing your personalised lesson';try{state.lesson=await api('lesson',{repository:`${state.repository.owner}/${state.repository.name}`,feature:state.feature,level:'Beginner'});state.step=0;renderLesson();show('lesson-view')}catch(ex){error(ex.message);show('features-view')}}
function renderLesson(){
  const lesson=state.lesson;
  const step=lesson.steps[state.step];
  const starter=step.codeExample||'// Write your solution here';
  if(state.drafts[state.step]===undefined)state.drafts[state.step]=starter;
  const percent=Math.round((state.step/lesson.steps.length)*100);

  document.querySelector('#lesson-sidebar').innerHTML=`
    <div class="objective-header">
      <p class="eyebrow">OBJECTIVE</p>
      <span>Step ${state.step+1} of ${lesson.steps.length}</span>
    </div>
    <div class="objective-scroll">
      <h2>${esc(step.title)}</h2>
      <p>${esc(step.explanation)}</p>
      <div class="objective-task">
        <b>Your task</b>
        <p>${esc(step.task)}</p>
      </div>
      <div class="objective-checkpoint">
        <b>Success looks like</b>
        <p>${esc(step.checkpoint)}</p>
      </div>
      <p class="file-label">FILES TO USE</p>
      <div class="workspace-files">${step.files.map(file=>`<code>${esc(file)}</code>`).join('')}</div>
    </div>
    <div class="objective-footer">
      <button id="previous-step" ${state.step===0?'disabled':''}>← Previous</button>
      <button id="publish-link">Publish video</button>
    </div>`;

  document.querySelector('#lesson-content').innerHTML=`
    <div class="workspace-topbar">
      <div>
        <b>${esc(lesson.title)}</b>
        <span>${percent}% complete</span>
      </div>
      <div class="step-dots">${lesson.steps.map((_,index)=>`<button class="${index===state.step?'active':''} ${index<state.step?'done':''}" data-step="${index}" aria-label="Step ${index+1}">${index+1}</button>`).join('')}</div>
    </div>
    <div class="editor-window">
      <div class="editor-tab"><span>${esc(step.files[0]||`step-${state.step+1}.${step.language||'js'}`)}</span><small>${esc(step.language||'code')}</small></div>
      <div class="editor-body">
        <div id="line-numbers" class="line-numbers"></div>
        <textarea id="workspace-code" spellcheck="false" aria-label="Code editor">${esc(state.drafts[state.step])}</textarea>
      </div>
      <div class="editor-actions">
        <button id="reset-code">Reset</button>
        <span id="save-state">Changes saved locally</span>
        <button id="check-code" class="check">Check code →</button>
      </div>
    </div>
    <div id="inline-feedback" class="inline-feedback" aria-live="polite"></div>
    <div class="workspace-bottom">
      <span>${state.step+1} / ${lesson.steps.length} complete</span>
      <button id="next-step" ${state.step===lesson.steps.length-1?'disabled':''}>Next objective →</button>
    </div>`;

  const editor=document.querySelector('#workspace-code');
  const updateLines=()=>{document.querySelector('#line-numbers').innerHTML=Array.from({length:editor.value.split('\n').length},(_,index)=>`<span>${index+1}</span>`).join('')};
  updateLines();
  editor.addEventListener('input',()=>{state.drafts[state.step]=editor.value;updateLines();document.querySelector('#save-state').textContent='Saved'});
  editor.addEventListener('scroll',()=>{document.querySelector('#line-numbers').scrollTop=editor.scrollTop});
  document.querySelectorAll('[data-step]').forEach(button=>button.onclick=()=>{state.drafts[state.step]=editor.value;state.step=Number(button.dataset.step);renderLesson()});
  document.querySelector('#previous-step').onclick=()=>{state.step--;renderLesson()};
  document.querySelector('#next-step').onclick=()=>{state.step++;renderLesson()};
  document.querySelector('#publish-link').onclick=()=>show('publish-view');
  document.querySelector('#reset-code').onclick=()=>{editor.value=starter;state.drafts[state.step]=starter;updateLines()};
  document.querySelector('#check-code').onclick=()=>checkWorkspaceCode(editor.value);
}

async function checkWorkspaceCode(code){
  const button=document.querySelector('#check-code');
  const resultElement=document.querySelector('#inline-feedback');
  if(!code.trim())return error('Write some code before checking it.');
  button.disabled=true;
  button.textContent='Checking…';
  resultElement.className='inline-feedback loading';
  resultElement.innerHTML='<p>AI is reviewing your work against this objective…</p>';
  try{
    const result=await api('feedback',{
      repository:`${state.repository.owner}/${state.repository.name}`,
      feature:state.feature.name,
      code,
      question:`Check step ${state.step+1}: ${state.lesson.steps[state.step].task}`,
    });
    resultElement.className='inline-feedback show';
    resultElement.innerHTML=`<div class="feedback-heading"><span>${esc(result.status)}</span><b>AI code check</b></div><div class="feedback-columns"><div><h4>What is working</h4><ul>${result.strengths.map(item=>`<li>${esc(item)}</li>`).join('')}</ul></div><div><h4>Hints</h4>${result.hints.map(hint=>`<p><b>${esc(hint.priority)}:</b> ${esc(hint.message)}</p>`).join('')}</div></div><div class="feedback-next"><b>Next:</b> ${esc(result.nextStep)}</div>`;
  }catch(ex){
    resultElement.className='inline-feedback show error';
    resultElement.textContent=ex.message;
  }finally{
    button.disabled=false;
    button.textContent='Check code →';
  }
}
document.querySelector('#review-button').onclick=async()=>{const button=document.querySelector('#review-button');const code=document.querySelector('#student-code').value;if(!code.trim())return error('Paste some code first.');button.disabled=true;button.textContent='Reviewing…';try{const result=await api('feedback',{repository:`${state.repository.owner}/${state.repository.name}`,feature:state.feature.name,code,question:document.querySelector('#student-question').value});document.querySelector('#feedback-result').innerHTML=`<span class="feedback-status">${esc(result.status)}</span><h3>What is working</h3><ul>${result.strengths.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><h3>Hints</h3>${result.hints.map(h=>`<div class="hint"><b>${esc(h.priority)}</b><p>${esc(h.message)}</p></div>`).join('')}<div class="callout"><b>Next step</b>${esc(result.nextStep)}</div>`}catch(ex){error(ex.message)}finally{button.disabled=false;button.textContent='Review my code →'}};
document.querySelector('#publish-form').onsubmit=async e=>{e.preventDefault();try{const result=await api('publish',{title:document.querySelector('#publish-title').value,videoUrl:document.querySelector('#video-url').value,repositoryUrl:state.repository?.url});document.querySelector('#publish-result').innerHTML=`<div class="success"><b>Published successfully</b><br>Your project was shared on ${new Date(result.publishedAt).toLocaleDateString()}.</div>`}catch(ex){error(ex.message)}};
