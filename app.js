import { trafficSigns } from './data/signs.js';

const state = { filter: 'all', query: '' };
const grid = document.querySelector('#signs-grid');
const emptyState = document.querySelector('#empty-state');
const resultsCount = document.querySelector('#results-count');
const searchInput = document.querySelector('#search-input');
const clearSearch = document.querySelector('#clear-search');
const dialog = document.querySelector('#sign-dialog');
const dialogImage = document.querySelector('#dialog-image');
const dialogTitle = document.querySelector('#dialog-title');
const dialogCategory = document.querySelector('#dialog-category');
const dialogDescription = document.querySelector('#dialog-description');
const dialogAction = document.querySelector('#dialog-action-text');
const dialogSource = document.querySelector('#dialog-source');

const categoryTone = { warning: 'warning', regulatory: 'regulatory', mandatory: 'mandatory', guidance: 'guidance' };

function getVisibleSigns() {
  const query = state.query.trim().toLocaleLowerCase('ar');
  return trafficSigns.filter((sign) => {
    const categoryMatch = state.filter === 'all' || sign.category === state.filter;
    const text = `${sign.title} ${sign.english} ${sign.description} ${sign.action}`.toLocaleLowerCase('ar');
    return categoryMatch && (!query || text.includes(query));
  });
}

function renderSignVisual(sign) {
  if (sign.image) {
    return `<img src="${sign.image}" alt="${sign.alt}" loading="lazy" />`;
  }
  return `<div class="sign-illustration tone-${sign.tone}" aria-label="تمثيل بصري لإشارة ${sign.title}"><span>${sign.symbol}</span><small>${sign.english}</small></div>`;
}

function renderCards() {
  const visibleSigns = getVisibleSigns();
  resultsCount.textContent = visibleSigns.length;
  grid.innerHTML = visibleSigns.map((sign) => `
    <article class="sign-card" style="--accent:${sign.category === 'warning' ? '#e6aa42' : sign.category === 'mandatory' ? '#317a9b' : sign.category === 'guidance' ? '#4f9d79' : '#d96657'}">
      <div class="sign-card-media">${renderSignVisual(sign)}<span class="card-number">${String(trafficSigns.indexOf(sign) + 1).padStart(2, '0')}</span></div>
      <div class="sign-card-content">
        <span class="sign-type">${sign.categoryLabel}</span>
        <h3>${sign.title}</h3>
        <p>${sign.description}</p>
        <button class="detail-button" type="button" data-sign-id="${sign.id}" aria-label="عرض تفاصيل ${sign.title}">عرض التفاصيل <span aria-hidden="true">←</span></button>
      </div>
    </article>
  `).join('');
  grid.hidden = visibleSigns.length === 0;
  emptyState.hidden = visibleSigns.length !== 0;
}

function setActiveFilter(filter) {
  state.filter = filter;
  document.querySelectorAll('[data-filter]').forEach((button) => {
    const active = button.dataset.filter === filter;
    button.classList.toggle('is-selected', active);
    button.setAttribute('aria-pressed', String(active));
  });
  renderCards();
}

function openDetails(id) {
  const sign = trafficSigns.find((item) => item.id === id);
  if (!sign) return;
  dialogTitle.textContent = sign.title;
  dialogCategory.textContent = `${sign.categoryLabel} · ${sign.english}`;
  dialogDescription.textContent = sign.description;
  dialogAction.textContent = sign.action;
  dialogSource.href = sign.source || '#';
  dialogSource.hidden = !sign.source;
  if (sign.image) {
    dialogImage.src = sign.image;
    dialogImage.alt = sign.alt;
  } else {
    dialogImage.src = 'assets/images/speed-limit.jpg';
    dialogImage.alt = `صورة توضيحية من مكتبة إشارات المرور مرتبطة بـ ${sign.title}`;
  }
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}

document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => setActiveFilter(button.dataset.filter)));
grid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-sign-id]');
  if (button) openDetails(button.dataset.signId);
});
searchInput.addEventListener('input', (event) => {
  state.query = event.target.value;
  clearSearch.hidden = !state.query;
  renderCards();
});
clearSearch.addEventListener('click', () => {
  searchInput.value = '';
  state.query = '';
  clearSearch.hidden = true;
  searchInput.focus();
  renderCards();
});
document.querySelector('#reset-filters').addEventListener('click', () => {
  state.filter = 'all';
  state.query = '';
  searchInput.value = '';
  clearSearch.hidden = true;
  setActiveFilter('all');
});
document.querySelector('#dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && dialog.open) dialog.close(); });

document.querySelectorAll('.quiz-options button').forEach((button) => button.addEventListener('click', () => {
  const buttons = document.querySelectorAll('.quiz-options button');
  buttons.forEach((item) => { item.disabled = true; item.classList.remove('is-correct', 'is-wrong'); });
  const feedback = document.querySelector('#quiz-feedback');
  const correct = button.dataset.answer === 'correct';
  button.classList.add(correct ? 'is-correct' : 'is-wrong');
  if (!correct) document.querySelector('[data-answer="correct"]').classList.add('is-correct');
  feedback.textContent = correct ? 'أحسنت. إشارة التوقف تعني توقفاً كاملاً.' : 'ليست الإجابة الصحيحة. إشارة التوقف تتطلب توقفاً كاملاً.';
  feedback.style.color = correct ? '#2b8753' : '#b64d4d';
}));

const menuToggle = document.querySelector('.menu-toggle');
const primaryNav = document.querySelector('#primary-nav');
menuToggle.addEventListener('click', () => {
  const isOpen = primaryNav.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});
primaryNav.addEventListener('click', (event) => {
  if (event.target.matches('a')) { primaryNav.classList.remove('is-open'); menuToggle.setAttribute('aria-expanded', 'false'); }
});

const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.nav-link')];
const observer = new IntersectionObserver((entries) => {
  const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  navLinks.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${visible.target.id}`));
}, { rootMargin: '-30% 0px -55% 0px', threshold: [0, .2, .5] });
sections.forEach((section) => observer.observe(section));

renderCards();
