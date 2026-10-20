const grid = document.querySelector('#project-grid');
const filters = document.querySelector('#project-filters');
let allProjects = [];
let activeCategory = 'All work';
async function loadProjects() {
  try {
    const response = await fetch('/api/projects');
    if (!response.ok) throw new Error('Project list unavailable');
    allProjects = await response.json();
    const categories = ['All work', ...new Set(allProjects.map(project => project.category))];
    filters.innerHTML = categories.map(category => `<button class="filter-chip${category === activeCategory ? ' active' : ''}" type="button" aria-pressed="${category === activeCategory}" data-category="${safe(category)}">${safe(category)}</button>`).join('');
    filters.addEventListener('click', event => {
      const button = event.target.closest('[data-category]');
      if (!button) return;
      activeCategory = button.dataset.category;
      filters.querySelectorAll('.filter-chip').forEach(chip => {
        const selected = chip.dataset.category === activeCategory;
        chip.classList.toggle('active', selected);
        chip.setAttribute('aria-pressed', selected);
      });
      renderProjects();
    });
    renderProjects();
    document.querySelector('.project-total').textContent = `( 01 — ${String(allProjects.length).padStart(2, '0')} )`;
  } catch (error) {
    grid.innerHTML = '<p class="loading">Projects could not load. Start the app with <code>python server.py</code>.</p>';
  }
}
function renderProjects() {
    const projects = activeCategory === 'All work' ? allProjects : allProjects.filter(project => project.category === activeCategory);
    grid.innerHTML = projects.map(project => `
      <article class="project-card">
        <button class="project-image" type="button" data-project-id="${Number(project.id)}" style="--card-color:${safe(project.color)}" aria-label="View details for ${safe(project.title)}">
          <span class="project-symbol" aria-hidden="true">${safe(project.icon)}</span><span class="project-open" aria-hidden="true">↗</span>
        </button>
        <div class="project-meta"><h3 class="project-title">${safe(project.title)}</h3><span class="project-year">${safe(project.year)}</span></div>
        <p class="project-category">${safe(project.category)}</p><p class="project-description">${safe(project.description)}</p>
      </article>`).join('');
    grid.querySelectorAll('.project-card').forEach((card, index) => {
      card.style.setProperty('--reveal-delay', `${index * 90}ms`);
      revealObserver.observe(card);
    });
}
const projectDialog = document.querySelector('#project-dialog');
grid.addEventListener('click', event => {
  const trigger = event.target.closest('[data-project-id]');
  if (!trigger) return;
  const project = allProjects.find(item => Number(item.id) === Number(trigger.dataset.projectId));
  if (!project) return;
  const art = document.querySelector('#dialog-art');
  art.style.setProperty('--dialog-color', /^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(project.color) ? project.color : '#e8e0d2');
  document.querySelector('#dialog-icon').textContent = project.icon;
  document.querySelector('#dialog-art-year').textContent = project.year;
  document.querySelector('#dialog-category').textContent = project.category;
  document.querySelector('#dialog-title').textContent = project.title;
  document.querySelector('#dialog-year').textContent = project.year;
  document.querySelector('#dialog-discipline').textContent = project.category;
  document.querySelector('#dialog-description').textContent = project.description;
  const link = document.querySelector('#dialog-link');
  const safeLink = safeUrl(project.link);
  link.hidden = !safeLink;
  if (safeLink) link.href = safeLink;
  projectDialog.showModal();
});
grid.addEventListener('pointermove', event => {
  const card = event.target.closest('.project-image');
  if (!card || event.pointerType === 'touch') return;
  const bounds = card.getBoundingClientRect();
  card.style.setProperty('--mouse-x', `${event.clientX - bounds.left}px`);
  card.style.setProperty('--mouse-y', `${event.clientY - bounds.top}px`);
});
grid.addEventListener('pointerout', event => {
  const card = event.target.closest('.project-image');
  if (card && !card.contains(event.relatedTarget)) {
    card.style.setProperty('--mouse-x', '50%');
    card.style.setProperty('--mouse-y', '50%');
  }
});
document.querySelector('.dialog-close').addEventListener('click', () => projectDialog.close());
projectDialog.addEventListener('click', event => {
  if (event.target === projectDialog) projectDialog.close();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && projectDialog.open) projectDialog.close();
});
const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
}), { threshold: 0.12 });
function safe(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function safeUrl(value) {
  const url = String(value ?? '#').trim();
  return /^(https?:\/\/|mailto:)/i.test(url) ? safe(url) : '';
}
loadProjects();

const navLinks = [...document.querySelectorAll('.topbar nav a')];
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(link => {
      const active = link.hash === `#${entry.target.id}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-35% 0px -55% 0px' });
document.querySelectorAll('#work, #about, #contact').forEach(section => sectionObserver.observe(section));

const rotatingWord = document.querySelector('.rotating-word');
const words = ['human.', 'joyful.', 'memorable.', 'meaningful.'];
let wordIndex = 0;
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  window.setInterval(() => {
    wordIndex = (wordIndex + 1) % words.length;
    rotatingWord.classList.add('changing');
    window.setTimeout(() => {
      rotatingWord.textContent = words[wordIndex];
      rotatingWord.classList.remove('changing');
    }, 180);
  }, 3000);

  const heroArt = document.querySelector('.hero-art');
  heroArt.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    const bounds = heroArt.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    heroArt.style.setProperty('--pointer-x', `${x * 13}px`);
    heroArt.style.setProperty('--pointer-y', `${y * 13}px`);
  });
  heroArt.addEventListener('pointerleave', () => {
    heroArt.style.setProperty('--pointer-x', '0px');
    heroArt.style.setProperty('--pointer-y', '0px');
  });
}
