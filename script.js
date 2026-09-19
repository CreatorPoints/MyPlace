// View Elements
const homeView = document.getElementById('home-view');
const spaceView = document.getElementById('space-view');

// Space View Elements
const backToSpacesBtn = document.getElementById('back-to-spaces-btn');
const activeSpaceCategory = document.getElementById('active-space-category');
const activeSpaceTitle = document.getElementById('active-space-title');
const activeSpaceDesc = document.getElementById('active-space-desc');
const workspaceContent = document.getElementById('workspace-content');
const saveStatus = document.getElementById('save-status');

// Elements - Create Modal
const openModalBtn = document.getElementById('open-modal-btn');
const modal = document.getElementById('workspace-modal');
const cancelBtn = document.getElementById('cancel-btn');
const workspaceForm = document.getElementById('workspace-form');
const nameInput = document.getElementById('workspace-name');
const categoryInput = document.getElementById('workspace-category');
const descInput = document.getElementById('workspace-desc');

// Elements - Edit Modal
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const editIdInput = document.getElementById('edit-id');
const editNameInput = document.getElementById('edit-name');
const editCategoryInput = document.getElementById('edit-category');
const editDescInput = document.getElementById('edit-desc');

// Elements - Delete Modal
const deleteModal = document.getElementById('delete-modal');
const deleteForm = document.getElementById('delete-form');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const deletePromptMsg = document.getElementById('delete-prompt-msg');
const deleteConfirmInput = document.getElementById('delete-confirm-input');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

// Grid
const spacesGrid = document.getElementById('spaces-grid');

let workspaces = JSON.parse(localStorage.getItem('myplace_workspaces')) || [];
let activeSpaceId = null;
let saveTimeout = null;

// Ensure all items have an id
workspaces = workspaces.map(ws => ws.id ? ws : { ...ws, id: Date.now().toString() + Math.random().toString(36).substr(2, 5) });

function saveWorkspaces() {
  localStorage.setItem('myplace_workspaces', JSON.stringify(workspaces));
}

function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

function getSpaceSlug(name) {
  return encodeURIComponent(
    (name || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  );
}

function getSpaceUrl(name) {
  const slug = getSpaceSlug(name);
  const base = window.location.origin && window.location.origin !== 'null'
    ? window.location.origin
    : window.location.href.substring(0, window.location.href.lastIndexOf('/'));
  return `${base}/spaces/${slug}`;
}

function renderWorkspaces() {
  spacesGrid.innerHTML = '';
  workspaces.forEach((ws) => {
    const spaceUrl = getSpaceUrl(ws.name);
    const card = document.createElement('div');
    card.className = 'space-card';
    card.innerHTML = `
      ${ws.category ? `<span class="category-badge">${escapeHtml(ws.category)}</span>` : ''}
      <h2>${escapeHtml(ws.name)}</h2>
      <p>${escapeHtml(ws.desc || '')}</p>
      <div class="card-actions">
        <a href="${spaceUrl}" class="card-btn open" data-id="${ws.id}" title="${spaceUrl}">Open</a>
        <button class="card-btn edit" data-id="${ws.id}">Edit</button>
        <button class="card-btn delete" data-id="${ws.id}">Delete</button>
      </div>
    `;
    spacesGrid.appendChild(card);
  });
}

// Workspace Workbench Navigation
function openSpace(id, updateHistory = true) {
  const ws = workspaces.find(w => w.id === id);
  if (!ws) return;

  activeSpaceId = ws.id;
  activeSpaceTitle.textContent = ws.name;
  activeSpaceCategory.textContent = ws.category || '';
  activeSpaceDesc.textContent = ws.desc || '';
  workspaceContent.value = ws.content || '';
  saveStatus.textContent = 'Saved';

  homeView.classList.add('hidden');
  spaceView.classList.remove('hidden');
  document.title = `${ws.name} - MySpace`;

  if (updateHistory) {
    const slug = getSpaceSlug(ws.name);
    const path = `/spaces/${slug}`;
    try {
      history.pushState({ spaceId: ws.id }, '', path);
    } catch {
      history.pushState({ spaceId: ws.id }, '', `#spaces/${slug}`);
    }
  }
}

function closeSpace(updateHistory = true) {
  activeSpaceId = null;
  spaceView.classList.add('hidden');
  homeView.classList.remove('hidden');
  document.title = 'MySpace';

  if (updateHistory) {
    try {
      history.pushState(null, '', '/');
    } catch {
      history.pushState(null, '', '#');
    }
  }
}

backToSpacesBtn.addEventListener('click', () => {
  closeSpace(true);
});

// Auto-save content inside workspace
workspaceContent.addEventListener('input', () => {
  if (!activeSpaceId) return;

  saveStatus.textContent = 'Saving...';
  clearTimeout(saveTimeout);

  saveTimeout = setTimeout(() => {
    const ws = workspaces.find(w => w.id === activeSpaceId);
    if (ws) {
      ws.content = workspaceContent.value;
      saveWorkspaces();
      saveStatus.textContent = 'Saved';
    }
  }, 400);
});

// Handle Browser Back / Forward
window.addEventListener('popstate', (e) => {
  if (e.state && e.state.spaceId) {
    openSpace(e.state.spaceId, false);
  } else {
    // Check URL path or hash
    resolveRouteFromUrl(false);
  }
});

function resolveRouteFromUrl(updateHistory = false) {
  const path = window.location.pathname;
  const hash = window.location.hash;

  let slug = '';
  if (path.includes('/spaces/')) {
    slug = path.split('/spaces/')[1].replace(/\/$/, '');
  } else if (hash.startsWith('#spaces/')) {
    slug = hash.replace('#spaces/', '').replace(/\/$/, '');
  }

  if (slug) {
    const ws = workspaces.find(w => getSpaceSlug(w.name) === slug);
    if (ws) {
      openSpace(ws.id, updateHistory);
      return;
    }
  }

  closeSpace(false);
}

// Create Workspace
openModalBtn.addEventListener('click', () => {
  workspaceForm.reset();
  modal.showModal();
});

cancelBtn.addEventListener('click', () => {
  modal.close();
});

workspaceForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const category = categoryInput.value;
  const desc = descInput.value.trim();

  if (!name) return;

  const newWorkspace = {
    id: Date.now().toString(),
    name,
    category,
    desc,
    content: ''
  };

  workspaces.push(newWorkspace);
  saveWorkspaces();
  renderWorkspaces();
  modal.close();
});

// Edit Workspace
function openEditModal(id) {
  const ws = workspaces.find(w => w.id === id);
  if (!ws) return;

  editIdInput.value = ws.id;
  editNameInput.value = ws.name;
  editCategoryInput.value = ws.category || 'Project';
  editDescInput.value = ws.desc || '';

  editModal.showModal();
}

cancelEditBtn.addEventListener('click', () => {
  editModal.close();
});

editForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = editIdInput.value;
  const ws = workspaces.find(w => w.id === id);
  if (!ws) return;

  const name = editNameInput.value.trim();
  if (!name) return;

  ws.name = name;
  ws.category = editCategoryInput.value;
  ws.desc = editDescInput.value.trim();

  saveWorkspaces();
  renderWorkspaces();

  // If currently active space was edited, update title
  if (activeSpaceId === ws.id) {
    activeSpaceTitle.textContent = ws.name;
    activeSpaceCategory.textContent = ws.category;
    activeSpaceDesc.textContent = ws.desc;
  }

  editModal.close();
});

// Delete Workspace
let workspaceToDelete = null;

function openDeleteModal(id) {
  workspaceToDelete = workspaces.find(w => w.id === id);
  if (!workspaceToDelete) return;

  deleteConfirmInput.value = '';
  confirmDeleteBtn.disabled = true;
  deletePromptMsg.innerHTML = `To confirm deletion, please type <strong>${escapeHtml(workspaceToDelete.name)}</strong>:`;

  deleteModal.showModal();
  deleteConfirmInput.focus();
}

deleteConfirmInput.addEventListener('input', () => {
  if (!workspaceToDelete) return;
  const matches = deleteConfirmInput.value.trim() === workspaceToDelete.name;
  confirmDeleteBtn.disabled = !matches;
});

cancelDeleteBtn.addEventListener('click', () => {
  deleteModal.close();
  workspaceToDelete = null;
});

deleteForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!workspaceToDelete) return;

  if (deleteConfirmInput.value.trim() === workspaceToDelete.name) {
    const deletedId = workspaceToDelete.id;
    workspaces = workspaces.filter(w => w.id !== deletedId);
    saveWorkspaces();
    renderWorkspaces();

    // If currently viewing the deleted space, go back to home
    if (activeSpaceId === deletedId) {
      closeSpace(true);
    }

    deleteModal.close();
    workspaceToDelete = null;
  }
});

// Delegation for card action buttons
spacesGrid.addEventListener('click', (e) => {
  const openBtn = e.target.closest('.card-btn.open');
  if (openBtn) {
    e.preventDefault();
    const id = openBtn.dataset.id;
    openSpace(id, true);
    return;
  }

  const editBtn = e.target.closest('.card-btn.edit');
  if (editBtn) {
    const id = editBtn.dataset.id;
    openEditModal(id);
    return;
  }

  const deleteBtn = e.target.closest('.card-btn.delete');
  if (deleteBtn) {
    const id = deleteBtn.dataset.id;
    openDeleteModal(id);
  }
});

// Initial render & route resolution
renderWorkspaces();
resolveRouteFromUrl(false);
