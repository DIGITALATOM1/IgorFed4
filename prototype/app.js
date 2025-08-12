const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function toggle(el, show) { if (show === undefined) { el.hidden = !el.hidden; } else { el.hidden = !show; } }
function setAriaExpanded(el, expanded) { el.setAttribute('aria-expanded', String(expanded)); }

// Demo data
const models = [
  { id: 1, title: 'Процесс онбординга сотрудников', notation: 'BPMN', status: 'draft', valid: true, owner: 'Анна', updatedAt: 'вчера', tags: ['HR', 'Онбординг'] },
  { id: 2, title: 'Закупки непрямых материалов', notation: 'BPMN', status: 'review', valid: false, owner: 'Игорь', updatedAt: '2 дн. назад', tags: ['Закупки'] },
  { id: 3, title: 'Обработка обращения в сервис‑деск', notation: 'BPMN', status: 'published', valid: true, owner: 'Мария', updatedAt: '5 дн. назад', tags: ['ITSM'] },
  { id: 4, title: 'Кредитный скоринг', notation: 'DMN', status: 'draft', valid: true, owner: 'Олег', updatedAt: 'сегодня', tags: ['Риски'] },
  { id: 5, title: 'Процесс релиза', notation: 'EPC', status: 'published', valid: true, owner: 'Оля', updatedAt: '3 дн. назад', tags: ['DevOps'] },
  { id: 6, title: 'Инцидент‑менеджмент', notation: 'BPMN', status: 'review', valid: true, owner: 'Илья', updatedAt: 'неделю назад', tags: ['ITSM'] },
];

const templates = [
  { id: 't1', title: 'Сервис‑деск L1→L2', tags: ['BPMN'] },
  { id: 't2', title: 'Закупки (PR→PO→GR)', tags: ['BPMN'] },
  { id: 't3', title: 'Онбординг', tags: ['BPMN'] },
];

const tasks = {
  assigned: [
    { id: 'tsk1', title: 'Провести ревью модели "Релиз"', due: 'завтра', type: 'Ревью' },
    { id: 'tsk2', title: 'Уточнить шаги онбординга', due: 'через 3 дня', type: 'Правка' },
  ],
  approvals: [
    { id: 'tsk3', title: 'Утвердить "Закупки непрямых"', due: 'сегодня', type: 'Согласование' },
  ],
  requests: [
    { id: 'tsk4', title: 'Запрос на публикацию "ITSM"', due: 'на этой неделе', type: 'Публикация' },
  ],
};

const activity = [
  { text: 'Мария опубликовала "Сервис‑деск"', time: '1 ч назад' },
  { text: 'Игорь оставил комментарий в "Закупки"', time: '3 ч назад' },
  { text: 'Анна изменила "Онбординг"', time: 'вчера' },
];

const quality = [
  { text: '2 модели с ошибками валидации', state: 'errors' },
  { text: '5 моделей без владельца', state: 'warning' },
  { text: 'Покрытие атрибутами 78%', state: 'ok' },
];

// Rendering
function renderCards(filter = 'all') {
  const container = $('#recentCards');
  container.innerHTML = '';
  let filtered = models;
  if (filter === 'mine') filtered = models.filter(m => m.owner === 'Анна');
  if (filter === 'draft') filtered = models.filter(m => m.status === 'draft');
  if (filter === 'published') filtered = models.filter(m => m.status === 'published');
  if (filter === 'errors') filtered = models.filter(m => !m.valid);

  for (const m of filtered) {
    const card = document.createElement('article');
    card.className = 'su-card';
    card.innerHTML = `
      <header style="display:flex;justify-content:space-between;gap:8px;align-items:center;">
        <h3 class="su-card__title">${m.title}</h3>
        <span class="su-badge-status ${badgeClass(m)}" aria-label="Статус">${badgeText(m)}</span>
      </header>
      <div class="su-card__meta">
        <span>${m.notation}</span>
        <span>·</span>
        <span>${m.updatedAt}</span>
        <span>·</span>
        <span>Владелец: ${m.owner}</span>
      </div>
      <div class="su-card__tags">${m.tags.map(t => `<span class="su-tag">${t}</span>`).join('')}</div>
      <div class="su-card__actions">
        <div class="su-card__quick">
          <button class="su-button su-button--ghost" data-open="${m.id}">Открыть</button>
          <button class="su-button su-button--ghost">Поделиться</button>
          <button class="su-button su-button--ghost">Экспорт</button>
        </div>
        <button class="su-button su-button--secondary">Подробнее</button>
      </div>
    `;
    container.appendChild(card);
  }
}

function badgeClass(m) {
  if (!m.valid) return 'su-badge--errors';
  if (m.status === 'draft') return 'su-badge--draft';
  if (m.status === 'review') return 'su-badge--review';
  if (m.status === 'published') return 'su-badge--published';
  return '';
}
function badgeText(m) {
  if (!m.valid) return 'Ошибки';
  if (m.status === 'draft') return 'Черновик';
  if (m.status === 'review') return 'На ревью';
  if (m.status === 'published') return 'Опубликовано';
  return '';
}

function renderTemplates() {
  const grid = $('#templatesGrid');
  grid.innerHTML = '';
  for (const t of templates) {
    const el = document.createElement('div');
    el.className = 'su-template';
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <strong>${t.title}</strong>
        <button class="su-button su-button--secondary" data-use-template="${t.id}">Использовать</button>
      </div>
      <div class="su-card__tags">${t.tags.map(x => `<span class='su-tag'>${x}</span>`).join('')}</div>
    `;
    grid.appendChild(el);
  }
}

function renderTasks(kind = 'assigned') {
  const list = $('#tasksList');
  list.innerHTML = '';
  for (const t of tasks[kind]) {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${t.title}</strong><span class="su-muted">${t.type} · Дедлайн: ${t.due}</span>`;
    list.appendChild(li);
  }
}

function renderActivity() {
  const list = $('#activityList');
  list.innerHTML = '';
  for (const a of activity) {
    const li = document.createElement('li');
    li.innerHTML = `<span>${a.text}</span><span class="su-muted">${a.time}</span>`;
    list.appendChild(li);
  }
}

function renderQuality() {
  const list = $('#qualityList');
  list.innerHTML = '';
  for (const q of quality) {
    const li = document.createElement('li');
    li.innerHTML = `<span>${q.text}</span>`;
    list.appendChild(li);
  }
}

// Interactions
function setupMenus() {
  const createBtn = $('#createButton');
  const menu = $('#createMenu');
  createBtn.addEventListener('click', () => {
    const isHidden = menu.hasAttribute('hidden');
    if (isHidden) {
      const rect = createBtn.getBoundingClientRect();
      menu.style.left = `${rect.left}px`;
      menu.style.top = `${rect.bottom + 6 + window.scrollY}px`;
    }
    toggle(menu);
    setAriaExpanded(createBtn, !isHidden);
  });

  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !createBtn.contains(e.target)) {
      menu.setAttribute('hidden', '');
      setAriaExpanded(createBtn, false);
    }
  });

  menu.addEventListener('click', (e) => {
    const btn = e.target.closest('[role="menuitem"]');
    if (!btn) return;
    alert(`Действие: ${btn.dataset.create}`);
    menu.setAttribute('hidden', '');
    setAriaExpanded(createBtn, false);
  });
}

function setupWorkspace() {
  const btn = $('#workspaceButton');
  const menu = $('#workspaceMenu');
  btn.addEventListener('click', () => {
    const isHidden = menu.hasAttribute('hidden');
    toggle(menu);
    setAriaExpanded(btn, !isHidden);
    const rect = btn.getBoundingClientRect();
    menu.style.left = `${rect.left}px`;
    menu.style.top = `${rect.bottom + 6 + window.scrollY}px`;
  });
  menu.addEventListener('click', (e) => {
    const li = e.target.closest('[role="option"]');
    if (!li) return;
    $('#workspaceName').textContent = li.dataset.workspace;
    menu.setAttribute('hidden', '');
    setAriaExpanded(btn, false);
  });
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !btn.contains(e.target)) {
      menu.setAttribute('hidden', '');
      setAriaExpanded(btn, false);
    }
  });
}

function setupTabs() {
  const tabs = $$('.su-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      // For demo, only Home view exists
    });
  });
}

function setupTree() {
  $$('.su-tree__folder').forEach(btn => {
    btn.addEventListener('click', () => {
      const list = btn.nextElementSibling;
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      if (list) list.hidden = expanded;
    });
  });
}

function setupTasksTabs() {
  const tabs = $$('[data-tasks-tab]');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-active'); tab.setAttribute('aria-selected', 'true');
      renderTasks(tab.dataset.tasksTab);
    });
  });
}

function setupSearchDialog() {
  const openBtn = $('#openSearch');
  const dialog = $('#searchDialog');
  const input = $('#searchInput');
  const results = $('#searchResults');

  function open() { if (!dialog.open) { dialog.showModal(); input.focus(); } }
  function close() { if (dialog.open) dialog.close(); }

  openBtn.addEventListener('click', open);

  document.addEventListener('keydown', (e) => {
    const isMetaK = (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey));
    if (isMetaK) { e.preventDefault(); open(); }
    if (e.key === 'Escape') close();
  });

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    results.innerHTML = '';
    if (!q) return;
    const found = models.filter(m => m.title.toLowerCase().includes(q));
    for (const m of found) {
      const opt = document.createElement('div');
      opt.setAttribute('role', 'option');
      opt.textContent = `${m.title} · ${m.notation}`;
      results.appendChild(opt);
    }
  });
}

function setupFiltersDrawer() {
  const openBtn = $('#openFilters');
  const drawer = $('#filtersDrawer');
  const closeBtn = $('#closeFilters');

  function open() { drawer.setAttribute('aria-hidden', 'false'); openBtn.setAttribute('aria-expanded', 'true'); }
  function close() { drawer.setAttribute('aria-hidden', 'true'); openBtn.setAttribute('aria-expanded', 'false'); }

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);

  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'f' && !e.target.matches('input, textarea')) {
      e.preventDefault(); open();
    }
  });

  $('#resetFilters').addEventListener('click', () => alert('Фильтры сброшены'));
  $('#applyFilters').addEventListener('click', () => { alert('Фильтры применены'); close(); });
}

function setupChips() {
  const chips = $$('.su-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      renderCards(chip.dataset.filter);
    });
  });
}

function setupHotkeys() {
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'n' && !e.target.matches('input, textarea')) {
      e.preventDefault(); $('#createButton').click();
    }
    if (e.key === '?' && !e.target.matches('input, textarea')) {
      e.preventDefault(); alert('Справка: ⌘K поиск, N создать, F фильтры');
    }
  });
}

function init() {
  renderCards();
  renderTemplates();
  renderTasks('assigned');
  renderActivity();
  renderQuality();

  setupMenus();
  setupWorkspace();
  setupTabs();
  setupTree();
  setupTasksTabs();
  setupSearchDialog();
  setupFiltersDrawer();
  setupChips();
  setupHotkeys();
}

document.addEventListener('DOMContentLoaded', init);