/* Shared sidebar — injected into every page */
const CHAPTERS = [
  { num: 1,  title: 'Anatomy & Physiology',    file: 'ch01-anatomy.html',    tags: ['UG', 'PG'] },
  { num: 2,  title: 'Optics & Refraction',     file: 'ch02-optics.html',     tags: ['UG', 'PG'] },
  { num: 3,  title: 'Conjunctiva',             file: 'ch03-conjunctiva.html', tags: ['UG', 'PG'] },
  { num: 4,  title: 'Cornea',                  file: 'ch04-cornea.html',     tags: ['UG', 'PG'] },
  { num: 5,  title: 'Sclera',                  file: 'ch05-sclera.html',     tags: ['UG'] },
  { num: 6,  title: 'Uveal Tract',             file: 'ch06-uvea.html',       tags: ['UG', 'PG'] },
  { num: 7,  title: 'Glaucoma',                file: 'ch07-glaucoma.html',   tags: ['UG', 'PG', 'High-Yield'] },
  { num: 8,  title: 'Lens & Cataract',         file: 'ch08-lens.html',       tags: ['UG', 'PG'] },
  { num: 9,  title: 'Vitreous',               file: 'ch09-vitreous.html',   tags: ['PG'] },
  { num: 10, title: 'Retina',                  file: 'ch10-retina.html',     tags: ['UG', 'PG', 'High-Yield'] },
  { num: 11, title: 'Neuro-Ophthalmology',     file: 'ch11-neuro.html',      tags: ['PG'] },
  { num: 12, title: 'Strabismus',              file: 'ch12-strabismus.html', tags: ['UG', 'PG'] },
  { num: 13, title: 'Eyelids',                 file: 'ch13-eyelids.html',    tags: ['UG', 'PG'] },
  { num: 14, title: 'Lacrimal System',         file: 'ch14-lacrimal.html',   tags: ['UG', 'PG'] },
  { num: 15, title: 'Orbit',                   file: 'ch15-orbit.html',      tags: ['UG', 'PG'] },
  { num: 16, title: 'Ocular Trauma',           file: 'ch16-trauma.html',     tags: ['UG', 'PG'] },
  { num: 17, title: 'Ophthalmic Operations',   file: 'ch17-operations.html', tags: ['PG'] },
  { num: 18, title: 'Community Ophthalmology', file: 'ch18-community.html',  tags: ['UG'] },
];

function buildSidebar() {
  const currentFile = window.location.pathname.split('/').pop() || 'index.html';
  const isIndex = currentFile === '' || currentFile === 'index.html';
  const base = document.querySelector('meta[name="base"]')?.content || '';

  const navItems = CHAPTERS.map(ch => `
    <a class="nav-item${currentFile === ch.file ? ' active' : ''}"
       href="${base}chapters/${ch.file}"
       data-search="${ch.num} ${ch.title.toLowerCase()}">
      <span class="nav-num">${ch.num}</span>
      <span>${ch.title}</span>
    </a>
  `).join('');

  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon"></div>
        <h1>OphthalStudy</h1>
        <p>AK Khurana &mdash; UG &amp; PG</p>
      </div>
      <div class="sidebar-search">
        <input type="text" id="sidebar-search" placeholder="Search chapters..." />
      </div>
      <nav class="sidebar-nav">
        <div class="sidebar-section-title">Home</div>
        <a class="nav-item${isIndex ? ' active' : ''}" href="${base}index.html" data-search="home overview">
          <span class="nav-num">H</span>
          <span>Overview</span>
        </a>
        <div class="sidebar-section-title" style="margin-top:10px">Chapters</div>
        ${navItems}
      </nav>
    </aside>
    <div id="sidebar-overlay"
         style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:99"
         onclick="document.getElementById('sidebar').classList.remove('open');this.style.display='none'">
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  const target = document.getElementById('sidebar-mount');
  if (target) target.innerHTML = buildSidebar();
  if (typeof initSearch === 'function') initSearch();
  if (typeof setActiveNav === 'function') setActiveNav();
});
