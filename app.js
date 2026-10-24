(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- reveals: on entering view, or at once if already scrolled past ---------- */
  const rv = $$('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting || e.boundingClientRect.top < 0) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach((el) => io.observe(el));
  } else rv.forEach((el) => el.classList.add('in'));

  /* ---------- nav: solid after the hero, current section ---------- */
  const nav = $('.nav'), hero = $('.hero');
  const onScroll = () => nav.classList.toggle('solid', scrollY > hero.offsetHeight - 90);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if ('IntersectionObserver' in window) {
    const links = $$('.nav nav a');
    const so = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + e.target.id)));
    }), { rootMargin: '-45% 0px -50% 0px' });
    ['work', 'about', 'craft', 'contact'].forEach((id) => { const s = document.getElementById(id); if (s) so.observe(s); });
  }

  /* ---------- scene depth: pointer + scroll, small and calm ---------- */
  const scene = $('#scene');
  if (scene && !reduce) {
    $$('.layer', scene).forEach((l) => l.style.setProperty('--d', (parseFloat(l.dataset.depth) * 10).toFixed(2)));
    let nx = 0, ny = 0, tick = false;
    const apply = () => {
      tick = false;
      const sp = Math.min(1, scrollY / Math.max(1, hero.offsetHeight));
      scene.style.setProperty('--px', (nx * 8).toFixed(2));
      scene.style.setProperty('--py', (ny * 5 + sp * 36).toFixed(2));
    };
    const req = () => { if (!tick) { tick = true; requestAnimationFrame(apply); } };
    hero.addEventListener('pointermove', (e) => { const r = hero.getBoundingClientRect(); nx = ((e.clientX - r.left) / r.width) * 2 - 1; ny = ((e.clientY - r.top) / r.height) * 2 - 1; req(); }, { passive: true });
    addEventListener('scroll', req, { passive: true });
  }

  /* ---------- videos: play only while visible, with a pause button on each ---------- */
  const vids = $$('.clip video');
  const userPaused = new WeakSet();
  const setBtn = (v) => { const b = v.parentElement.querySelector('.vbtn'); if (!b) return; const playing = !v.paused; b.setAttribute('aria-pressed', String(playing)); b.setAttribute('aria-label', (playing ? 'Pause ' : 'Play ') + v.getAttribute('aria-label').replace(/ animation| reel/, '')); };
  vids.forEach((v) => {
    v.addEventListener('play', () => setBtn(v)); v.addEventListener('pause', () => setBtn(v));
    const b = v.parentElement.querySelector('.vbtn');
    if (b) b.addEventListener('click', () => { if (v.paused) { userPaused.delete(v); v.play().catch(() => {}); } else { userPaused.add(v); v.pause(); } });
    if (reduce) { v.pause(); setBtn(v); }
  });
  if ('IntersectionObserver' in window) {
    const vo = new IntersectionObserver((entries) => entries.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting && !reduce && !userPaused.has(v)) v.play().catch(() => {});
      else if (!e.isIntersecting) v.pause();
    }), { threshold: 0.4 });
    vids.forEach((v) => vo.observe(v));
  }

  /* ---------- spoken walk-through ---------- */
  const tourBtn = $('#tour'), guide = $('#guide'), gText = $('#guide-text'), gImg = $('#guide-img'), gStop = $('#guide-stop');
  const talk = (on) => { if (window.scene3d) window.scene3d.setSpeaking(on); };
  const setPose = (name) => { if (window.scene3d) window.scene3d.setPose(name); };
  const FACE = { smile: 'face1', calm: 'face2', laugh: 'face3', think: 'face4', focus: 'face5' };
  const STEPS = [
    { t: '#top', pose: 'stand', face: 'smile', say: "Hi, I'm Ragul Sadhasivam, a motion and UI UX designer based in Hyderabad." },
    { t: '#top', pose: 'point', face: 'focus', say: 'I design the screens of an app, then animate them in After Effects, so loaders, splash screens and pairing flows tell people what the product is doing.' },
    { t: '#work', pose: 'stand', face: 'calm', say: 'This is my selected work: six pieces of interface motion for Nuclyo and RYDYT, from a splash screen that flows into sign-in, to a compass for a motorcycle display.' },
    { t: '#about', pose: 'stand', face: 'smile', say: 'I work at Moai Consulting, designing in Figma and animating in After Effects, and I export Lottie files for developers.' },
    { t: '#craft', pose: 'arms', face: 'think', say: 'To me, motion shows what a system is doing, directs attention, and makes transitions easy to follow.' },
    { t: '#contact', pose: 'point', face: 'laugh', say: 'If you have an interface that should move, my email is right here. Thanks for listening.' },
  ];
  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
  let voices = [], run = 0, active = false, timer = 0;
  const loadVoices = () => { voices = synth ? synth.getVoices() : []; };
  if (synth) { loadVoices(); synth.addEventListener && synth.addEventListener('voiceschanged', loadVoices); }
  function pickMale() {
    const en = voices.filter((v) => /^en/i.test(v.lang));
    for (const rx of [/rishi/i, /google uk english male/i, /daniel/i, /\balex\b/i, /microsoft (guy|ryan|david|mark|george)/i, /\bfred\b/i, /aaron|arthur|gordon|oliver|thomas/i, /\bmale\b/i]) {
      const v = en.find((x) => rx.test(x.name)); if (v) return v;
    }
    return en[0] || null;
  }
  function stopTour() {
    run++; active = false; clearTimeout(timer); synth && synth.cancel();
    talk(false); setPose('stand');
    tourBtn.setAttribute('aria-pressed', 'false'); tourBtn.querySelector('.tour-label').textContent = 'Hear the intro';
    guide.hidden = true;
  }
  function goTo(sel) {
    const el = document.querySelector(sel); if (!el) return;
    if (sel === '#top') scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
  function startTour() {
    const my = ++run; active = true;
    tourBtn.setAttribute('aria-pressed', 'true'); tourBtn.querySelector('.tour-label').textContent = 'Stop the intro';
    guide.hidden = false; const voice = synth ? pickMale() : null; let i = 0;
    const next = () => {
      if (my !== run) return;
      if (i >= STEPS.length) { stopTour(); return; }
      const s = STEPS[i++];
      gText.textContent = s.say; gImg.src = 'assets/img/' + FACE[s.face] + '.png';
      setPose(s.pose); talk(true); goTo(s.t);
      if (!synth) { timer = setTimeout(next, 5500); return; }
      const u = new SpeechSynthesisUtterance(s.say);
      if (voice) { u.voice = voice; u.lang = voice.lang; }
      u.rate = 0.96; u.pitch = 0.85;
      u.onboundary = () => { if (window.scene3d) window.scene3d.pulse(); };
      u.onend = () => { talk(false); setTimeout(next, 350); };
      u.onerror = () => { if (my === run) stopTour(); };
      synth.cancel(); synth.speak(u);
    };
    next();
  }
  tourBtn.addEventListener('click', () => (active ? stopTour() : startTour()));
  gStop.addEventListener('click', stopTour);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && active) stopTour(); });
  addEventListener('pagehide', stopTour);

  /* ---------- avatar video: used when <body data-avatar-video="..."> is set.
     The clip is drawn to a canvas and its flat terracotta background is keyed out (shadows kept as a multiply),
     so the figure sits directly on the hero colour with no visible video edge. ---------- */
  const vsrc = document.body.dataset.avatarVideo, av = $('#avatar-video'), cv = $('#avatar-canvas'), stage3d = $('#stage3d');
  if (vsrc && av && stage3d) {
    stage3d.classList.add('use-video'); hero.classList.add('has-video');
    av.src = vsrc; av.hidden = false;
    const ctx = cv && cv.getContext ? cv.getContext('2d', { willReadFrequently: true }) : null;
    let bg = null, drawing = false;
    const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const key = () => {
      if (!ctx || av.readyState < 2) return;
      const w = av.videoWidth, h = av.videoHeight; if (!w) return;
      if (cv.width !== w) { cv.width = w; cv.height = h; }
      ctx.drawImage(av, 0, 0, w, h);
      const img = ctx.getImageData(0, 0, w, h), d = img.data;
      if (!bg) { const p = ctx.getImageData(4, 4, 1, 1).data; bg = [p[0], p[1], p[2]]; }
      const br = bg[0], bgG = bg[1], bb = bg[2], bb2 = br * br + bgG * bgG + bb * bb;
      const floorFrom = w * Math.floor(h * 0.80) * 4;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const k = (r * br + g * bgG + b * bb) / bb2;
        const er = r - k * br, eg = g - k * bgG, eb = b - k * bb;
        const res = Math.sqrt(er * er + eg * eg + eb * eb);
        const wgt = ((i >= floorFrom ? 1 - smooth(9, 24, res) : 1 - smooth(3.5, 10, res))) * smooth(0.5, 0.75, k);
        if (wgt > 0) {
          const a = k >= 1 ? 0 : 1 - k;            // shadows stay as a multiply over the hero colour
          d[i + 3] = 255 * (1 - wgt + wgt * a);
          const m = 1 - wgt; d[i] = r * m; d[i + 1] = g * m; d[i + 2] = b * m;
        }
      }
      ctx.putImageData(img, 0, 0);
    };
    const loop = () => {
      if (!drawing) return;
      key();
      if (av.requestVideoFrameCallback) av.requestVideoFrameCallback(loop); else requestAnimationFrame(loop);
    };
    const start = () => { if (!ctx) return; if (!drawing) { drawing = true; loop(); } };
    const stop = () => { drawing = false; };
    if (ctx) { stage3d.classList.add('use-canvas'); av.addEventListener('playing', start); av.addEventListener('pause', stop); av.addEventListener('loadeddata', key); av.addEventListener('seeked', key); }
    if (reduce) { av.pause(); av.removeAttribute('loop'); }
    else if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { if (e.isIntersecting) av.play().catch(() => {}); else av.pause(); }, { threshold: 0.2 }).observe(stage3d);
    } else av.play().catch(() => {});
  }
})();
