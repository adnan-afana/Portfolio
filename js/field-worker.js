/* Hero dot field, drawn in a background thread (OffscreenCanvas).
   Same drawing as the main-thread version in site.js; running it here keeps the page's main thread free,
   so taps and clicks get an answer on the next frame instead of waiting behind the canvas (INP). */
const GAP = 26, R = 170;
let ctx = null, w = 0, h = 0, dots = [], ink = '#5F635C', red = '#D3126C';
let visible = true, paused = false, fine = true, skip = false, p = 0, running = false;
const m = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4 };
const raf = self.requestAnimationFrame ? cb => self.requestAnimationFrame(cb) : cb => setTimeout(() => cb(performance.now()), 16);

function size(cw, ch, dpr) {
  w = cw; h = ch;
  ctx.canvas.width = w * dpr; ctx.canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  dots = []; for (let y = GAP / 2; y < h; y += GAP) for (let x = GAP / 2; x < w; x += GAP) dots.push([x, y]);
  if (paused) draw(0);   // resizing clears the canvas: redraw the still field
}
function draw(t) {
  ctx.clearRect(0, 0, w, h);
  const s = t / 1000, sp = p;
  const inkPath = new Path2D(), redPath = new Path2D();
  for (let i = 0; i < dots.length; i++) {
    let [x, y] = dots[i];
    const wave = Math.sin(x * .011 + s * 1.1) * Math.cos(y * .013 + s * .7);
    y += wave * 3 + sp * (y * .35);
    const dx = x - m.x, dy = y - m.y, d = Math.hypot(dx, dy);
    let r = .8 + wave * .35, hot = false;
    if (d < R) {
      const f = (1 - d / R) ** 2;
      x += dx / (d || 1) * f * 26; y += dy / (d || 1) * f * 26;
      r += f * 2.4; hot = f > .2;
    }
    const path = hot ? redPath : inkPath;
    path.moveTo(x + r, y); path.arc(x, y, Math.max(.3, r), 0, 6.283);
  }
  ctx.globalAlpha = .3; ctx.fillStyle = ink; ctx.fill(inkPath);
  ctx.globalAlpha = .7; ctx.fillStyle = red; ctx.fill(redPath);
}
function frame(t) {
  if (!visible || paused) { running = false; return; }   // stop the loop entirely while off screen or paused
  raf(frame);
  if (!fine && (skip = !skip)) return;   // touch screens: no cursor to follow, 30fps is plenty
  if (m.tx < -9000 || m.x < -9000) { m.x = m.tx; m.y = m.ty; }
  else { m.x += (m.tx - m.x) * .12; m.y += (m.ty - m.y) * .12; }
  draw(t);
}
const start = () => { if (!running && visible && !paused) { running = true; raf(frame); } };

self.onmessage = ({ data: d }) => {
  switch (d.type) {
    case 'init':
      ctx = d.canvas.getContext('2d'); fine = d.fine; paused = d.paused; ink = d.ink; red = d.red;
      size(d.w, d.h, d.dpr); if (paused) draw(0); start(); break;
    case 'size': if (ctx) size(d.w, d.h, d.dpr); break;
    case 'colors': ink = d.ink; red = d.red; break;
    case 'm': m.tx = d.x; m.ty = d.y; break;
    case 'p': p = d.p; break;
    case 'vis': visible = d.v; start(); break;
    case 'paused': paused = d.v; start(); break;
  }
};
