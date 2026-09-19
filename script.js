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

function renderWorkspaces() {
  spacesGrid.innerHTML = '';
  workspaces.forEach((ws) => {
    const card = document.createElement('div');
    card.className = 'space-card';
    card.innerHTML = `
      ${ws.category ? `<span class="category-badge">${escapeHtml(ws.category)}</span>` : ''}
      <h2>${escapeHtml(ws.name)}</h2>
      <p>${escapeHtml(ws.desc || '')}</p>
      <div class="card-actions">
        <button class="card-btn edit" data-id="${ws.id}">Edit</button>
        <button class="card-btn delete" data-id="${ws.id}">Delete</button>
      </div>
    `;
    spacesGrid.appendChild(card);
  });
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
    desc
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
    workspaces = workspaces.filter(w => w.id !== workspaceToDelete.id);
    saveWorkspaces();
    renderWorkspaces();
    deleteModal.close();
    workspaceToDelete = null;
  }
});

// Delegation for card action buttons
spacesGrid.addEventListener('click', (e) => {
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

// Initial render
renderWorkspaces();
