const openModalBtn = document.getElementById('open-modal-btn');
const modal = document.getElementById('workspace-modal');
const cancelBtn = document.getElementById('cancel-btn');
const workspaceForm = document.getElementById('workspace-form');
const nameInput = document.getElementById('workspace-name');
const categoryInput = document.getElementById('workspace-category');
const descInput = document.getElementById('workspace-desc');
const spacesGrid = document.getElementById('spaces-grid');

let workspaces = JSON.parse(localStorage.getItem('myplace_workspaces')) || [];

function renderWorkspaces() {
  spacesGrid.innerHTML = '';
  workspaces.forEach((ws) => {
    const card = document.createElement('div');
    card.className = 'space-card';
    card.innerHTML = `
      ${ws.category ? `<span class="category-badge">${escapeHtml(ws.category)}</span>` : ''}
      <h2>${escapeHtml(ws.name)}</h2>
      <p>${escapeHtml(ws.desc || '')}</p>
    `;
    spacesGrid.appendChild(card);
  });
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

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

  workspaces.push({ name, category, desc });
  localStorage.setItem('myplace_workspaces', JSON.stringify(workspaces));

  renderWorkspaces();
  modal.close();
});

// Initial render
renderWorkspaces();
