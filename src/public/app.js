const membersElement = document.querySelector('#members');
const tasksElement = document.querySelector('#tasks');
const assigneeElement = document.querySelector('#assignee');
const memberCountElement = document.querySelector('#member-count');
const taskCountElement = document.querySelector('#task-count');
const statusElement = document.querySelector('#connection-status');
const formElement = document.querySelector('#task-form');
const messageElement = document.querySelector('#form-message');

function escapeHtml(value) {
  const element = document.createElement('div');
  element.textContent = value;
  return element.innerHTML;
}

function setStatus(online) {
  statusElement.textContent = online ? 'Database connected' : 'Connection problem';
  statusElement.classList.toggle('offline', !online);
}

function renderMembers(members) {
  memberCountElement.textContent = `${members.length} ${members.length === 1 ? 'member' : 'members'}`;
  membersElement.innerHTML = members.length
    ? members.map((member) => `
      <article class="member-card">
        <div class="avatar">${escapeHtml(member.name.charAt(0).toUpperCase())}</div>
        <strong>${escapeHtml(member.name)}</strong>
        <small>${escapeHtml(member.role)}</small>
      </article>
    `).join('')
    : '<p class="empty">No members yet. Run the Prisma seed command first.</p>';

  assigneeElement.innerHTML = '<option value="">Unassigned</option>';
  members.forEach((member) => {
    const option = document.createElement('option');
    option.value = member.id;
    option.textContent = member.name;
    assigneeElement.append(option);
  });
}

function renderTasks(tasks) {
  taskCountElement.textContent = `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`;
  tasksElement.innerHTML = tasks.length
    ? tasks.map((task) => `
      <article class="task">
        <div>
          <p>${escapeHtml(task.title)}</p>
          <small>${task.assignee ? `Assigned to ${escapeHtml(task.assignee.name)}` : 'Unassigned'}</small>
        </div>
        <span class="task-badge">${escapeHtml(task.status.replaceAll('_', ' '))}</span>
      </article>
    `).join('')
    : '<p class="empty">No tasks yet. Add your first task above.</p>';
}

async function loadDashboard() {
  try {
    const [membersResponse, tasksResponse] = await Promise.all([
      fetch('/api/members'),
      fetch('/api/tasks'),
    ]);

    if (!membersResponse.ok || !tasksResponse.ok) {
      throw new Error('The API returned an error');
    }

    renderMembers(await membersResponse.json());
    renderTasks(await tasksResponse.json());
    setStatus(true);
  } catch (error) {
    console.error(error);
    setStatus(false);
    membersElement.innerHTML = '<p class="empty">Could not load members. Check your database connection.</p>';
    tasksElement.innerHTML = '<p class="empty">Could not load tasks. Check your database connection.</p>';
  }
}

formElement.addEventListener('submit', async (event) => {
  event.preventDefault();
  messageElement.textContent = 'Saving…';

  const formData = new FormData(formElement);
  const assigneeId = formData.get('assigneeId');
  const body = {
    title: formData.get('title').trim(),
    assigneeId: assigneeId ? Number(assigneeId) : null,
  };

  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('Could not save the task');
    }

    formElement.reset();
    messageElement.textContent = 'Task added successfully.';
    await loadDashboard();
  } catch (error) {
    console.error(error);
    messageElement.textContent = 'Task could not be added. Check your database connection.';
  }
});

loadDashboard();
