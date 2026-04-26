/* ============================================================
   OPHTHAL STUDY PORTAL — Main JavaScript
   ============================================================ */

// ---- TABS ----
function initTabs() {
  document.querySelectorAll('.tabs').forEach(tabsEl => {
    const btns = tabsEl.querySelectorAll('.tab-btn');
    const panels = tabsEl.closest('.tab-container')?.querySelectorAll('.tab-panel') ||
                   tabsEl.parentElement.querySelectorAll('.tab-panel');

    btns.forEach((btn, i) => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        if (panels[i]) panels[i].classList.add('active');
      });
    });
  });
}

// ---- COLLAPSIBLE SECTIONS ----
function initCollapsible() {
  document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', () => {
      const card = header.closest('.section-card');
      card.classList.toggle('open');
    });
  });

  // Open first section by default
  const firstCard = document.querySelector('.section-card');
  if (firstCard) firstCard.classList.add('open');
}

// ---- MCQ INTERACTIVITY ----
function initMCQs() {
  document.querySelectorAll('.mcq-card').forEach(card => {
    const options = card.querySelectorAll('.mcq-option');
    const explanation = card.querySelector('.mcq-explanation');
    const revealBtn = card.querySelector('.btn-reveal');
    const resetBtn = card.querySelector('.btn-reset');
    const correctIdx = parseInt(card.dataset.correct || '0');
    let answered = false;

    options.forEach((opt, i) => {
      opt.addEventListener('click', () => {
        if (answered) return;
        answered = true;

        options.forEach((o, j) => {
          if (j === correctIdx) o.classList.add('revealed-correct');
        });

        if (i === correctIdx) {
          opt.classList.add('selected-correct');
        } else {
          opt.classList.add('selected-wrong');
          options[correctIdx].classList.add('revealed-correct');
        }

        if (explanation) explanation.classList.add('show');
        if (revealBtn) revealBtn.style.display = 'none';
      });
    });

    if (revealBtn) {
      revealBtn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        options[correctIdx].classList.add('revealed-correct');
        if (explanation) explanation.classList.add('show');
        revealBtn.style.display = 'none';
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        answered = false;
        options.forEach(o => {
          o.classList.remove('selected-correct', 'selected-wrong', 'revealed-correct');
        });
        if (explanation) explanation.classList.remove('show');
        if (revealBtn) revealBtn.style.display = '';
      });
    }
  });
}

// ---- SIDEBAR SEARCH ----
function initSearch() {
  const searchInput = document.getElementById('sidebar-search');
  if (!searchInput) return;

  searchInput.addEventListener('input', e => {
    const query = e.target.value.toLowerCase().trim();
    document.querySelectorAll('.nav-item[data-search]').forEach(item => {
      const text = item.dataset.search.toLowerCase();
      item.style.display = (query === '' || text.includes(query)) ? '' : 'none';
    });
  });
}

// ---- MOBILE SIDEBAR ----
function initMobileSidebar() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('show');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });
  }
}

// ---- ACTIVE NAV ITEM ----
function setActiveNav() {
  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-item').forEach(item => {
    const href = item.getAttribute('href') || '';
    if (href === currentPage || href.endsWith(currentPage)) {
      item.classList.add('active');
    }
  });
}

// ---- MCQ SCORE TRACKER ----
function initScoreTracker() {
  const cards = document.querySelectorAll('.mcq-card');
  if (cards.length === 0) return;

  const scoreBadge = document.getElementById('score-badge');
  if (!scoreBadge) return;

  let correct = 0, total = 0;

  document.querySelectorAll('.mcq-option').forEach(opt => {
    opt.addEventListener('click', function() {
      const card = this.closest('.mcq-card');
      if (card.dataset.scored === 'true') return;
      card.dataset.scored = 'true';
      total++;
      const correctIdx = parseInt(card.dataset.correct || '0');
      const options = Array.from(card.querySelectorAll('.mcq-option'));
      if (options.indexOf(this) === correctIdx) correct++;
      scoreBadge.textContent = `${correct}/${total} correct`;
      scoreBadge.style.display = 'inline-flex';
    });
  });
}

// ---- SMOOTH SCROLL FOR ANCHOR LINKS ----
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ---- COPY CODE SNIPPETS ----
function initCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.querySelector(btn.dataset.target);
      if (target) {
        navigator.clipboard.writeText(target.textContent).then(() => {
          const original = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => btn.textContent = original, 2000);
        });
      }
    });
  });
}

// ---- INIT ALL ----
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initCollapsible();
  initMCQs();
  initSearch();
  initMobileSidebar();
  setActiveNav();
  initScoreTracker();
  initSmoothScroll();
  initCopyButtons();
});
