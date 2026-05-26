/* ============================================================
   OPHTHAL STUDY PORTAL — main.js v2
   ============================================================ */

/* ---- MAIN TABS ---- */
function initTabs() {
  document.querySelectorAll('.tab-container').forEach(container => {
    const buttons = container.querySelectorAll(':scope > .tabs > .tab-btn');
    const panels  = container.querySelectorAll(':scope > .tab-panel');
    buttons.forEach((btn, i) => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        if (panels[i]) panels[i].classList.add('active');
        // trigger reveal for new panel
        panels[i] && initRevealIn(panels[i]);
      });
    });
  });
}

/* ---- Q-BANK SUB-TABS ---- */
function initQBankTabs() {
  document.querySelectorAll('.qbank-nav').forEach(nav => {
    const scope = nav.closest('.tab-panel') || nav.parentElement;
    const btns  = nav.querySelectorAll('.qbank-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const targetId = btn.dataset.target;
        scope.querySelectorAll('.qbank-panel').forEach(p => p.classList.remove('active'));
        const target = scope.querySelector('#' + targetId);
        if (target) { target.classList.add('active'); initRevealIn(target); }
      });
    });
  });
}

/* ---- COLLAPSIBLES ---- */
function initCollapsibles() {
  document.querySelectorAll('.section-card').forEach(card => {
    const header = card.querySelector('.section-header');
    if (!header) return;
    header.addEventListener('click', () => card.classList.toggle('open'));
  });
}

/* ---- LONG ANSWERS ---- */
function initLongAnswers() {
  document.querySelectorAll('.la-card').forEach(card => {
    const header = card.querySelector('.la-header');
    const hint   = card.querySelector('.la-toggle-hint');
    const toggle = (el) => {
      if (!el) return;
      el.addEventListener('click', () => {
        card.classList.toggle('open');
        if (hint) hint.textContent = card.classList.contains('open') ? 'Hide answer outline' : 'Show answer outline';
      });
    };
    toggle(header);
    toggle(hint);
  });
}

/* ---- PYQs ---- */
function initPYQs() {
  document.querySelectorAll('.pyq-card').forEach(card => {
    const toggle = card.querySelector('.pyq-toggle');
    const answer = card.querySelector('.pyq-answer');
    if (toggle && answer) {
      toggle.addEventListener('click', () => {
        answer.classList.toggle('show');
        toggle.textContent = answer.classList.contains('show') ? 'Hide Answer' : 'Show Answer / Approach';
      });
    }
  });
}

/* ---- MCQ INTERACTION ---- */
let totalQ = 0, correctQ = 0;

function initMCQs() {
  document.querySelectorAll('.mcq-card').forEach(card => {
    const options     = card.querySelectorAll('.mcq-option');
    const explanation = card.querySelector('.mcq-explanation');
    const correctIdx  = parseInt(card.dataset.correct, 10);
    let answered = false;

    options.forEach((opt, i) => {
      opt.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        totalQ++;

        options.forEach((o, j) => {
          if (j === correctIdx) o.classList.add(i === j ? 'correct' : 'missed');
          else if (j === i)     o.classList.add('wrong');
        });

        if (i === correctIdx) correctQ++;
        if (explanation) explanation.classList.add('show');
        updateScoreBadge();
      });
    });
  });
}

/* ---- SCORE BADGE ---- */
function updateScoreBadge() {
  const badge = document.getElementById('score-badge');
  if (!badge || totalQ === 0) return;
  const pct = Math.round((correctQ / totalQ) * 100);
  badge.style.display = 'flex';
  badge.classList.add('score-pop');
  badge.textContent = correctQ + '/' + totalQ + ' (' + pct + '%)';
  badge.style.background = pct >= 70 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';
  setTimeout(() => badge.classList.remove('score-pop'), 350);
}

/* ---- INTERSECTION OBSERVER (reveal) ---- */
let revealObserver;

function initReveal() {
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); }
    });
  }, { threshold: 0.06 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

function initRevealIn(container) {
  if (!revealObserver) return;
  container.querySelectorAll('.reveal:not(.visible)').forEach(el => revealObserver.observe(el));
}

/* ---- SIDEBAR SEARCH ---- */
function initSearch() {
  const input = document.getElementById('sidebar-search');
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    document.querySelectorAll('.nav-item[data-search]').forEach(item => {
      item.style.display = (!q || item.dataset.search.includes(q)) ? '' : 'none';
    });
  });
}

/* ---- MOBILE SIDEBAR ---- */
function initMobile() {
  const btn     = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (btn && sidebar) {
    btn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (overlay) overlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
    });
  }
}

/* ---- BOOT ---- */
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initQBankTabs();
  initCollapsibles();
  initMCQs();
  initLongAnswers();
  initPYQs();
  initReveal();
  initSearch();
  initMobile();
});
