// View Elements
const homeView = document.getElementById('home-view');
const spaceView = document.getElementById('space-view');

// Space View Elements
const backToSpacesBtn = document.getElementById('back-to-spaces-btn');
const activeSpaceCategory = document.getElementById('active-space-category');
const activeSpaceTitle = document.getElementById('active-space-title');
const activeSpaceDesc = document.getElementById('active-space-desc');
const workspaceContent = document.getElementById('workspace-content');
const workspacePreview = document.getElementById('workspace-preview');
const tabWrite = document.getElementById('tab-write');
const tabPreview = document.getElementById('tab-preview');
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

// Markdown Parser & Emoji Replacer
function parseMarkdown(md) {
  if (!md || !md.trim()) return '<p style="color:#777777;"><em>Nothing to preview</em></p>';

  let text = md
    .replace(/:skull:/g, '💀')
    .replace(/:fire:/g, '🔥')
    .replace(/:rocket:/g, '🚀')
    .replace(/:heart:/g, '❤️')
    .replace(/:star:/g, '⭐')
    .replace(/:check:/g, '✅')
    .replace(/:cross:/g, '❌')
    .replace(/:eyes:/g, '👀')
    .replace(/:tada:/g, '🎉')
    .replace(/:warning:/g, '⚠️');

  // Extract and preserve code blocks
  const codeBlocks = [];
  text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const placeholder = `%%CODE_BLOCK_${codeBlocks.length}%%`;
    codeBlocks.push(`<pre><code>${escapeHtml(code.trim())}</code></pre>`);
    return placeholder;
  });

  // Extract and preserve inline code
  const inlineCodes = [];
  text = text.replace(/`([^`]+)`/g, (match, code) => {
    const placeholder = `%%INLINE_CODE_${inlineCodes.length}%%`;
    inlineCodes.push(`<code>${escapeHtml(code)}</code>`);
    return placeholder;
  });

  // Line-by-line block processing
  const lines = text.split('\n');
  const parsedLines = [];
  let inUl = false;
  let inOl = false;

  function closeLists() {
    if (inUl) { parsedLines.push('</ul>'); inUl = false; }
    if (inOl) { parsedLines.push('</ol>'); inOl = false; }
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const escaped = escapeHtml(line);

    // Headers
    if (/^######\s+(.*)/.test(line)) {
      closeLists();
      parsedLines.push(`<h6>${escapeHtml(line.replace(/^######\s+/, ''))}</h6>`);
      continue;
    }
    if (/^#####\s+(.*)/.test(line)) {
      closeLists();
      parsedLines.push(`<h5>${escapeHtml(line.replace(/^#####\s+/, ''))}</h5>`);
      continue;
    }
    if (/^####\s+(.*)/.test(line)) {
      closeLists();
      parsedLines.push(`<h4>${escapeHtml(line.replace(/^####\s+/, ''))}</h4>`);
      continue;
    }
    if (/^###\s+(.*)/.test(line)) {
      closeLists();
      parsedLines.push(`<h3>${escapeHtml(line.replace(/^###\s+/, ''))}</h3>`);
      continue;
    }
    if (/^##\s+(.*)/.test(line)) {
      closeLists();
      parsedLines.push(`<h2>${escapeHtml(line.replace(/^##\s+/, ''))}</h2>`);
      continue;
    }
    if (/^#\s+(.*)/.test(line)) {
      closeLists();
      parsedLines.push(`<h1>${escapeHtml(line.replace(/^#\s+/, ''))}</h1>`);
      continue;
    }

    // Horizontal Rule
    if (/^---+$|^===+$/.test(line.trim())) {
      closeLists();
      parsedLines.push('<hr>');
      continue;
    }

    // Blockquote
    if (/^>\s?(.*)/.test(line)) {
      closeLists();
      parsedLines.push(`<blockquote>${escapeHtml(line.replace(/^>\s?/, ''))}</blockquote>`);
      continue;
    }

    // Task Checkboxes
    if (/^[-*]\s+\[ \]\s+(.*)/.test(line)) {
      if (!inUl) { parsedLines.push('<ul>'); inUl = true; }
      parsedLines.push(`<li style="list-style:none"><input type="checkbox" disabled> ${escapeHtml(line.replace(/^[-*]\s+\[ \]\s+/, ''))}</li>`);
      continue;
    }
    if (/^[-*]\s+\[[xX]\]\s+(.*)/.test(line)) {
      if (!inUl) { parsedLines.push('<ul>'); inUl = true; }
      parsedLines.push(`<li style="list-style:none"><input type="checkbox" checked disabled> ${escapeHtml(line.replace(/^[-*]\s+\[[xX]\]\s+/, ''))}</li>`);
      continue;
    }

    // Unordered List
    if (/^[-*]\s+(.*)/.test(line)) {
      if (inOl) { parsedLines.push('</ol>'); inOl = false; }
      if (!inUl) { parsedLines.push('<ul>'); inUl = true; }
      parsedLines.push(`<li>${escapeHtml(line.replace(/^[-*]\s+/, ''))}</li>`);
      continue;
    }

    // Ordered List
    if (/^\d+\.\s+(.*)/.test(line)) {
      if (inUl) { parsedLines.push('</ul>'); inUl = false; }
      if (!inOl) { parsedLines.push('<ol>'); inOl = true; }
      parsedLines.push(`<li>${escapeHtml(line.replace(/^\d+\.\s+/, ''))}</li>`);
      continue;
    }

    closeLists();

    if (!line.trim()) {
      continue;
    }

    parsedLines.push(`<p>${escaped}</p>`);
  }
  closeLists();

  let html = parsedLines.join('');

  // Inline styling: bold, italic, del, links
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Restore preserved code blocks & inline code
  codeBlocks.forEach((block, idx) => {
    html = html.replace(`%%CODE_BLOCK_${idx}%%`, block);
  });
  inlineCodes.forEach((code, idx) => {
    html = html.replace(`%%INLINE_CODE_${idx}%%`, code);
  });

  return html;
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

  // Default to Write tab
  tabWrite.classList.add('active');
  tabPreview.classList.remove('active');
  workspaceContent.classList.remove('hidden');
  workspacePreview.classList.add('hidden');

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

// Tab switching
tabWrite.addEventListener('click', () => {
  tabWrite.classList.add('active');
  tabPreview.classList.remove('active');
  workspaceContent.classList.remove('hidden');
  workspacePreview.classList.add('hidden');
});

tabPreview.addEventListener('click', () => {
  tabPreview.classList.add('active');
  tabWrite.classList.remove('active');
  workspacePreview.innerHTML = parseMarkdown(workspaceContent.value);
  workspaceContent.classList.add('hidden');
  workspacePreview.classList.remove('hidden');
});

// Auto-save & :skull: support in workspace textarea
workspaceContent.addEventListener('input', () => {
  if (!activeSpaceId) return;

  // Real-time :skull: conversion inside textarea
  if (workspaceContent.value.includes(':skull:')) {
    const start = workspaceContent.selectionStart;
    const oldVal = workspaceContent.value;
    workspaceContent.value = oldVal.replace(/:skull:/g, '💀');
    const diff = oldVal.length - workspaceContent.value.length;
    workspaceContent.setSelectionRange(Math.max(0, start - diff), Math.max(0, start - diff));
  }

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
