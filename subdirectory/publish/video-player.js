/**
 * Animated Video Player Engine
 * Drives slide-based animations for each topic "video"
 */

class VideoPlayer {
  constructor(canvasId, slides, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.slides = slides;
    this.currentSlide = 0;
    this.isPlaying = false;
    this.slideTimer = null;
    this.slideProgress = 0;
    this.animFrame = 0;
    this.totalDuration = slides.reduce((a, s) => a + s.duration, 0);
    this.elapsed = 0;
    this.lastTime = null;
    this.options = options;
    this.RAF = null;

    // Resize canvas to match display
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Draw initial frame
    this.drawSlide(this.slides[0], 0);
    this.updateUI();
  }

  resize() {
    const wrap = this.canvas.parentElement;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    this.canvas.width = w;
    this.canvas.height = h;
    this.W = w;
    this.H = h;
    if (!this.isPlaying) this.drawSlide(this.slides[this.currentSlide], this.slideProgress);
  }

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.lastTime = performance.now();
    this.loop();
    document.getElementById('playPauseBtn').textContent = '⏸';
  }

  pause() {
    this.isPlaying = false;
    if (this.RAF) cancelAnimationFrame(this.RAF);
    document.getElementById('playPauseBtn').textContent = '▶';
  }

  toggle() {
    this.isPlaying ? this.pause() : this.play();
  }

  restart() {
    this.pause();
    this.currentSlide = 0;
    this.elapsed = 0;
    this.slideProgress = 0;
    this.drawSlide(this.slides[0], 0);
    this.updateUI();
    this.play();
  }

  seekToSlide(index) {
    this.currentSlide = index;
    this.slideProgress = 0;
    this.elapsed = this.slides.slice(0, index).reduce((a, s) => a + s.duration, 0);
    this.drawSlide(this.slides[index], 0);
    this.updateUI();
  }

  loop() {
    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    if (this.isPlaying) {
      this.elapsed += dt;
      const slide = this.slides[this.currentSlide];
      this.slideProgress += dt / slide.duration;

      if (this.slideProgress >= 1) {
        if (this.currentSlide < this.slides.length - 1) {
          this.currentSlide++;
          this.slideProgress = 0;
          // Update chapter pills
          document.querySelectorAll('.chapter-pill').forEach((p, i) => {
            p.classList.toggle('active', i === this.currentSlide);
          });
        } else {
          this.slideProgress = 1;
          this.pause();
          this.updateUI();
          return;
        }
      }
      this.drawSlide(this.slides[this.currentSlide], this.slideProgress);
      this.updateUI();
    }
    this.RAF = requestAnimationFrame(() => this.loop());
  }

  updateUI() {
    const prog = document.getElementById('progressBar');
    const time = document.getElementById('vidTime');
    if (prog) prog.style.width = ((this.elapsed / this.totalDuration) * 100).toFixed(1) + '%';
    if (time) {
      const e = Math.min(this.elapsed, this.totalDuration);
      const t = this.totalDuration;
      time.textContent = `${fmt(e)} / ${fmt(t)}`;
    }
  }

  drawSlide(slide, progress) {
    const ctx = this.ctx;
    const W = this.W, H = this.H;
    if (!W || !H) return;
    ctx.clearRect(0, 0, W, H);
    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0a0e1a');
    bg.addColorStop(1, '#0f1f3a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Call slide's draw function
    const ease = easeInOut(progress);
    slide.draw(ctx, W, H, progress, ease);

    // Bottom subtitle bar
    const subtitleAlpha = progress < 0.1 ? progress / 0.1 : progress > 0.85 ? (1 - progress) / 0.15 : 1;
    ctx.save();
    ctx.globalAlpha = Math.max(0, subtitleAlpha);
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    const barH = Math.max(56, H * 0.13);
    ctx.fillRect(0, H - barH, W, barH);
    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.max(13, W * 0.022)}px 'Segoe UI', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    wrapText(ctx, slide.subtitle, W / 2, H - barH / 2, W - 40, Math.max(18, W * 0.026));
    ctx.restore();
  }
}

// Utilities
function fmt(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  if (!text) return;
  const words = text.split(' ');
  let line = '';
  const lines = [];
  for (const w of words) {
    const test = line + w + ' ';
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line.trim());
      line = w + ' ';
    } else {
      line = test;
    }
  }
  if (line) lines.push(line.trim());
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}

// Drawing helpers used by slides
function drawTitle(ctx, W, H, text, progress, y, color = '#2ec4b6') {
  const alpha = Math.min(1, progress * 3);
  const offsetY = (1 - easeInOut(Math.min(1, progress * 2))) * 20;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.font = `bold ${Math.max(16, W * 0.038)}px 'Segoe UI', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, W / 2, y + offsetY);
  ctx.restore();
}

function drawLabel(ctx, x, y, text, size = 13, color = '#aaa', align = 'left') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${size}px 'Segoe UI', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawArrow(ctx, x1, y1, x2, y2, color = '#2ec4b6', width = 2) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  // arrowhead
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 10;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle - 0.4), y2 - headLen * Math.sin(angle - 0.4));
  ctx.lineTo(x2 - headLen * Math.cos(angle + 0.4), y2 - headLen * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawGlowCircle(ctx, x, y, r, color, alpha = 0.3) {
  ctx.save();
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color.replace(')', `, ${alpha})`).replace('rgb', 'rgba'));
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function pulsate(t, speed = 2) {
  return 0.85 + 0.15 * Math.sin(t * speed * Math.PI * 2);
}

// Global time for animations
let _globalT = 0;
setInterval(() => { _globalT += 0.016; }, 16);
