/* ═══════════════════════════════════════════════════════════
   OZARKS CONCRETE COATINGS — SITE-WIDE MOTION LAYER
   Needs /vendor/gsap.min.js, /vendor/ScrollTrigger.min.js, /vendor/lenis.min.js
   (loaded before this file). Respects prefers-reduced-motion.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var root = document.documentElement;
  function done() { root.classList.remove('m-pre', 'm-enter'); }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !window.gsap || !window.ScrollTrigger) { done(); return; }

  gsap.registerPlugin(ScrollTrigger);
  root.classList.add('m-on');

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var isSmall = window.innerWidth < 768;
  var entering = root.classList.contains('m-enter');
  try { sessionStorage.removeItem('m-wipe'); } catch (e) {}

  /* ── SMOOTH SCROLL ───────────────────────────────────── */
  var lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({
      duration: 1.1, smoothWheel: true, wheelMultiplier: 0.95,
      prevent: function (node) { return !!(node.closest && node.closest('.lightbox,.nav-drop-menu,.mob-menu,[data-lenis-prevent]')); }
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    root.style.scrollBehavior = 'auto';
  }

  /* ── SPLIT TEXT (keeps <br>, <span class="r"> etc. intact) ── */
  function split(el, chars) {
    if (el.getAttribute('data-m-split')) return el;
    el.setAttribute('data-m-split', '1');
    if (chars) el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'm-w';
            var wi = document.createElement('span'); wi.className = 'm-wi';
            if (chars) {
              w.setAttribute('aria-hidden', 'true');
              Array.from(p).forEach(function (ch) {
                var c = document.createElement('span'); c.className = 'm-c'; c.textContent = ch; wi.appendChild(c);
              });
            } else wi.textContent = p;
            w.appendChild(wi); frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR' && !n.classList.contains('m-w')) walk(n);
      });
    })(el);
    return el;
  }

  /* CSS `transition: all` on many elements would smear GSAP's per-frame
     updates; switch it off while animating and hand it back afterwards. */
  function calm(t) { gsap.set(t, { transition: 'none' }); return t; }

  /* ── PAGE WIPE TRANSITIONS ───────────────────────────── */
  var wipe = document.createElement('div');
  wipe.className = 'm-wipe';
  wipe.setAttribute('aria-hidden', 'true');
  wipe.innerHTML = '<div class="m-wipe-mark">Ozarks <span>Concrete</span> Coatings</div>';
  document.body.appendChild(wipe);
  var mark = wipe.firstChild;

  if (entering) {
    gsap.set(wipe, { yPercent: 0 });
    root.classList.remove('m-enter');
    gsap.timeline()
      .to(mark, { y: -40, opacity: 0, duration: 0.35, ease: 'power2.in' }, 0.05)
      .to(wipe, { yPercent: -100, duration: 0.75, ease: 'expo.inOut' }, 0.1)
      .set(wipe, { yPercent: 100 }).set(mark, { y: 0, opacity: 1 });
  }

  function leaveTo(href) {
    try { sessionStorage.setItem('m-wipe', '1'); } catch (e) {}
    gsap.timeline({ onComplete: function () { window.location.href = href; } })
      .fromTo(wipe, { yPercent: 100 }, { yPercent: 0, duration: 0.5, ease: 'expo.inOut' })
      .fromTo(mark, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power3.out' }, 0.22);
  }

  document.addEventListener('click', function (ev) {
    if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    var a = ev.target.closest && ev.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    var raw = a.getAttribute('href');
    if (!raw || /^(tel:|mailto:|sms:|javascript:)/i.test(raw)) return;
    if (raw.charAt(0) === '#') {
      var tg = null; try { tg = raw.length > 1 && document.querySelector(raw); } catch (e) {}
      if (tg && lenis) { ev.preventDefault(); lenis.scrollTo(tg, { offset: -90, duration: 1.4 }); }
      return;
    }
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    // same-page anchor → glide there
    if (url.pathname === location.pathname && url.hash) {
      var t = null; try { t = document.querySelector(url.hash); } catch (e) {}
      if (t && lenis) { ev.preventDefault(); lenis.scrollTo(t, { offset: -90, duration: 1.4 }); }
      return;
    }
    ev.preventDefault();
    leaveTo(a.href);
  });
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) gsap.to(wipe, { yPercent: -100, duration: 0.6, ease: 'expo.inOut', onComplete: function () { gsap.set(wipe, { yPercent: 100 }); } });
  });

  /* ── SCROLL PROGRESS + NAV BEHAVIOUR ─────────────────── */
  var bar = document.createElement('div'); bar.className = 'm-progress'; document.body.appendChild(bar);
  gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  var nav = $('nav');
  if (nav) {
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (s) {
        var y = s.scroll();
        nav.classList.toggle('m-nav-glass', y > 60);
        var menuOpen = !!$('.mob-menu.open');
        if (menuOpen || y < 420) nav.classList.remove('m-nav-hide');
        else if (s.direction === 1) nav.classList.add('m-nav-hide');
        else nav.classList.remove('m-nav-hide');
      }
    });
  }

  /* ── EPOXY FLAKE BROADCAST (canvas) ──────────────────── */
  function flakes(host) {
    var cv = document.createElement('canvas');
    cv.className = 'm-flakes'; cv.setAttribute('aria-hidden', 'true');
    var bg = host.firstElementChild;
    if (bg && !/bg/.test(bg.className)) bg = null;
    host.insertBefore(cv, bg ? bg.nextSibling : host.firstChild);
    // make sure the copy stays above the canvas
    Array.prototype.slice.call(host.children).forEach(function (ch) {
      if (ch === cv || ch === bg) return;
      if (getComputedStyle(ch).position === 'static') { ch.style.position = 'relative'; ch.style.zIndex = '1'; }
    });
    var ctx = cv.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, chips = [], mouse = { x: -9999, y: -9999 }, running = true, visible = true;
    var palette = ['#cc202f', '#cc202f', '#e8333f', '#edeae5', '#bbb8b3', '#8a8480', '#5a5654', '#3a3636', '#1c1a1a', '#d8d2c8'];
    var N = isSmall ? 26 : 70;
    // deterministic-ish pseudo random so the pattern is stable per load
    var seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

    function make(initial) {
      var z = 0.45 + rnd() * 0.75, s = (3 + rnd() * 7) * z, pts = [];
      for (var k = 0; k < 5; k++) { var a = (k / 5) * Math.PI * 2 + rnd() * 0.9; var r = s * (0.55 + rnd() * 0.6); pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
      return {
        x: rnd() * W, y: initial ? -rnd() * H * 1.2 : -20 - rnd() * 60,
        vx: (rnd() - 0.5) * 12, vy: (initial ? 90 : 18) + rnd() * 26 * z, z: z,
        rot: rnd() * 6.28, vr: (rnd() - 0.5) * 2.2, flip: rnd() * 6.28, vf: 1 + rnd() * 3,
        sway: rnd() * 6.28, col: palette[Math.floor(rnd() * palette.length)], pts: pts
      };
    }
    function size() {
      var r = host.getBoundingClientRect(); W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size(); for (var i = 0; i < N; i++) chips.push(make(true));
    window.addEventListener('resize', size);
    host.addEventListener('pointermove', function (e) { var r = host.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    host.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(host);
    document.addEventListener('visibilitychange', function () { running = !document.hidden; });

    gsap.ticker.add(function (time, dtMs) {
      if (!running || !visible) return;
      var dt = Math.min(dtMs, 50) / 1000;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < chips.length; i++) {
        var c = chips[i];
        c.vy += ((18 + 26 * c.z) - c.vy) * 0.9 * dt;        // settle from the opening "broadcast" burst
        c.sway += dt * 1.3;
        var dx = c.x - mouse.x, dy = c.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 22000) { var f = (1 - d2 / 22000) * 420 * dt; var d = Math.sqrt(d2) || 1; c.vx += dx / d * f; c.vy += dy / d * f * 0.6; c.vr += 0.05; }
        c.vx *= 0.97;
        c.x += (c.vx + Math.sin(c.sway) * 10 * c.z) * dt;
        c.y += c.vy * dt;
        c.rot += c.vr * dt; c.flip += c.vf * dt;
        if (c.y > H + 30 || c.x < -40 || c.x > W + 40) { chips[i] = make(false); continue; }
        var face = Math.cos(c.flip);                           // tumbling chip catches the light
        ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot); ctx.scale(1, Math.max(0.12, Math.abs(face)));
        ctx.globalAlpha = (0.35 + 0.55 * c.z) * (0.6 + 0.4 * Math.abs(face));
        ctx.fillStyle = c.col; ctx.beginPath(); ctx.moveTo(c.pts[0][0], c.pts[0][1]);
        for (var k = 1; k < c.pts.length; k++) ctx.lineTo(c.pts[k][0], c.pts[k][1]);
        ctx.closePath(); ctx.fill();
        if (face > 0.93) { ctx.globalAlpha = (face - 0.93) * 9; ctx.fillStyle = '#fff'; ctx.fill(); }
        ctx.restore();
      }
    });
  }

  /* ── HERO ────────────────────────────────────────────── */
  var hero = $('.hero') || $('.page-hero') || $('.calc-hero') || $('.fv-hero');
  if (hero) {
    var bgWrap = $('.hero-bg, .ph-bg', hero);
    var bgImg = bgWrap && $('img', bgWrap);
    flakes(hero);

    var glow = document.createElement('div'); glow.className = 'm-glow';
    hero.insertBefore(glow, hero.children[1] || null);

    if (bgWrap) {
      var sheen = document.createElement('div'); sheen.className = 'm-sheen';
      bgWrap.appendChild(sheen);
      gsap.timeline({ repeat: -1, repeatDelay: 5, delay: 1.1 })
        .fromTo(sheen, { xPercent: -70 }, { xPercent: 70, duration: 2.2, ease: 'power2.inOut' });
      // scroll-out: photo sinks and pushes in, copy rises
      gsap.to(bgWrap, { yPercent: 22, scale: 1.08, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    }

    if (finePointer) {
      var mx = bgImg ? gsap.quickTo(bgImg, 'x', { duration: 1.2, ease: 'power3' }) : null;
      var my = bgImg ? gsap.quickTo(bgImg, 'y', { duration: 1.2, ease: 'power3' }) : null;
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        hero.style.setProperty('--mx', (px * 100) + '%'); hero.style.setProperty('--my', (py * 100) + '%');
        hero.classList.add('m-hero-hover');
        if (mx) { mx((px - 0.5) * -28); my((py - 0.5) * -18); }
      });
      hero.addEventListener('pointerleave', function () { hero.classList.remove('m-hero-hover'); });
    }

    var delay = entering ? 0.45 : 0.1;
    var tl = gsap.timeline({ delay: delay });
    if (bgImg) tl.from(bgImg, { scale: 1.28, duration: 2.6, ease: 'expo.out' }, 0);

    if (hero.classList.contains('hero')) {
      /* — homepage hero — */
      var h1 = $('.hero-h1', hero);
      if (h1) { split(h1, true); h1.classList.add('m-hero-words'); }
      var btns = calm($$('.hero-ctas .btn', hero));
      tl.from($('.hero-badge', hero), { y: -36, opacity: 0, duration: 0.8, ease: 'back.out(2.2)' }, 0.1)
        .from($('.hero-logo', hero), { y: 34, opacity: 0, scale: 0.92, duration: 0.9, ease: 'expo.out' }, 0.18)
        .from($$('.m-c', h1), { yPercent: 120, rotateX: -100, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.022 }, 0.28)
        .fromTo($('.hero-sub', hero), { clipPath: 'inset(0% 100% 0% 0%)', x: -20 }, { clipPath: 'inset(0% 0% 0% 0%)', x: 0, duration: 1, ease: 'expo.out', clearProps: 'clipPath,transform' }, 0.85)
        .from($$('.hero-trust .tp', hero), { y: 26, opacity: 0, scale: 0.85, stagger: 0.07, duration: 0.7, ease: 'back.out(1.9)' }, 0.95)
        .from(btns, { y: 30, opacity: 0, stagger: 0.07, duration: 0.8, ease: 'expo.out', clearProps: 'transform,opacity,transition' }, 1.05)
        .from($('.hform', hero), { x: 90, rotateY: -16, opacity: 0, transformPerspective: 1400, duration: 1.3, ease: 'expo.out', clearProps: 'transform' }, 0.55);

      // the red word keeps a slow heartbeat glow
      var red = $('.r', h1);
      if (red) gsap.to(red, { textShadow: '0 0 28px rgba(204,32,47,.75)', duration: 1.6, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: delay + 1.6 });

      var cue = document.createElement('div'); cue.className = 'm-cue'; cue.innerHTML = 'Scroll<i></i>';
      hero.appendChild(cue);
      tl.from(cue, { opacity: 0, y: 14, duration: 0.8 }, 1.6);
      gsap.to(cue, { opacity: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '15% top', scrub: true } });

      var left = $('.hero-inner > div', hero);
      if (left) gsap.to(left, { y: -90, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    } else {
      /* — interior page heroes — */
      var inner = $('.ph-inner, .ch-inner, .wrap', hero) || hero;
      var ph = $('h1', hero);
      if (ph) split(ph, false);
      var kids = calm($$(':scope > *', inner).filter(function (k) { return k !== ph; }));
      tl.from($$('.m-wi', ph || hero), { yPercent: 115, rotate: 3, duration: 1.1, ease: 'expo.out', stagger: 0.06 }, 0.15)
        .from(kids, { y: 34, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08, clearProps: 'transform,opacity,transition' }, 0.35);
      gsap.to(inner, { y: -60, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    }
  }
  done();

  /* ── HEADINGS: words rise out of a mask ──────────────── */
  $$('.sec-title, .cta-title, .sp-title, .gs-title, section h2').forEach(function (el) {
    if (el.closest('.hform, form, .lightbox, footer, nav') || (hero && hero.contains(el))) return;
    split(el, false);
    gsap.from($$('.m-wi', el), {
      yPercent: 118, rotate: 4, duration: 1.15, ease: 'expo.out', stagger: 0.055,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  /* eyebrows + red rules */
  $$('.sec-eyebrow, .sp-eyebrow, .cta-eyebrow, .sec-label').forEach(function (el) {
    if (hero && hero.contains(el)) return;
    gsap.from(el, { x: -26, opacity: 0, letterSpacing: '.5em', duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });
  $$('.sec-rule, .pillar-bar').forEach(function (el) {
    gsap.from(el, { scaleX: 0, transformOrigin: '0 50%', duration: 1, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  /* ── .rev blocks (homepage only — inner pages fade them with CSS) ── */
  var revs = $$('.rev');
  if (revs.length && getComputedStyle(revs[0]).opacity === '1') {
    revs.forEach(function (el) {
      if (hero && hero.contains(el)) return;
      gsap.from(el, { y: 44, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
  }

  /* ── CARDS: staggered 3D lift-in ─────────────────────── */
  var cardSel = '.ba-card,.tc,.bc,.pillar,.city-a,.area-p,.ps,.wi,.svc-item,.fi,.color-card,.rc,.pp-item,.sys-spec,.ci-item,.gg-item,.area-tag,.st';
  var cards = $$(cardSel).filter(function (c) { return !c.classList.contains('rev') && !(hero && hero.contains(c)) && !c.closest('footer,nav'); });
  if (cards.length) {
    calm(cards);
    gsap.set(cards, { opacity: 0, y: 64, rotateX: -14, transformPerspective: 1000, transformOrigin: '50% 0%' });
    ScrollTrigger.batch(cards, {
      start: 'top 92%', once: true,
      onEnter: function (b) {
        gsap.to(b, { opacity: 1, y: 0, rotateX: 0, duration: 1, ease: 'expo.out', stagger: 0.075, overwrite: true, clearProps: 'transform,opacity,transition' });
      }
    });
  }

  /* ── IMAGES: shutter reveal ──────────────────────────── */
  var parallaxImgs = $$('.showcase-img img, .proj-img img');
  var imgs = $$('section img, .showcase img').filter(function (img) {
    if (hero && hero.contains(img)) return false;
    if (img.closest('.lightbox, form, .hform, footer, nav, .m-marquee, [data-no-motion]')) return false;
    if (/\bfv-(img|calibrate)/.test(img.className)) return false;   // floor visualizer stage images
    if (/logo/i.test((img.getAttribute('src') || '') + ' ' + (img.getAttribute('alt') || ''))) return false;
    if (img.closest('.rev')) return false;
    var w = parseInt(img.getAttribute('width') || '0', 10);
    return !(w && w < 120);
  });
  if (imgs.length) {
    calm(imgs);
    gsap.set(imgs, { clipPath: 'inset(100% 0% 0% 0%)' });
    imgs.forEach(function (img) {
      if (parallaxImgs.indexOf(img) === -1 && getComputedStyle(img.parentNode).overflow === 'hidden') gsap.set(img, { scale: 1.25 });
    });
    ScrollTrigger.batch(imgs, {
      start: 'top 94%', once: true,
      onEnter: function (b) {
        b.forEach(function (img, i) {
          var keep = parallaxImgs.indexOf(img) !== -1;
          gsap.to(img, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.3, ease: 'expo.inOut', delay: i * 0.08,
            clearProps: keep ? 'clipPath,transition' : 'clipPath,transform,transition' });
        });
      }
    });
  }

  /* project photos drift while scrolling */
  parallaxImgs.forEach(function (img) {
    gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  $$('.cta-band').forEach(function (band) {
    var bgw = $('.cta-band-bg', band);
    if (bgw) gsap.fromTo(bgw, { yPercent: -12, scale: 1.15 }, { yPercent: 12, scale: 1, ease: 'none', scrollTrigger: { trigger: band, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ── PROCESS TIMELINE (homepage) ─────────────────────── */
  var ptl = document.getElementById('procTl');
  if (ptl) {
    gsap.to('#pstlFill', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: ptl, start: 'top 72%', end: 'bottom 78%', scrub: 0.5 } });
    $$('.pstl-item').forEach(function (item) {
      gsap.from(item, { x: 40, opacity: 0, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: item, start: 'top 82%', once: true } });
      ScrollTrigger.create({
        trigger: item, start: 'top 72%', end: 'bottom 20%',
        onEnter: function () { item.classList.add('on'); },
        onEnterBack: function () { item.classList.add('on'); },
        onLeaveBack: function () { item.classList.remove('on'); }
      });
    });
  }

  /* ── MARQUEE BAND above the footer, driven by scroll speed ── */
  var footer = $('footer');
  if (footer) {
    var words = ['Epoxy', 'Polyaspartic', 'Metallic', 'Flake Systems', 'Lifetime Warranty', '1-Day Install', 'Diamond Ground Prep'];
    var group = words.map(function (w) { return w + ' <b>✦</b> '; }).join('');
    var mq = document.createElement('div'); mq.className = 'm-marquee'; mq.setAttribute('aria-hidden', 'true');
    var rowHtml = function (cls) { return '<div class="m-row ' + cls + '">' + new Array(5).join('<span>' + group + '</span>') + '</div>'; };
    mq.innerHTML = rowHtml('m-row-solid') + rowHtml('m-row-out');
    footer.parentNode.insertBefore(mq, footer);
    var rows = $$('.m-row', mq).map(function (el, i) { return { el: el, x: i ? -400 : 0, dir: i ? 1 : -1 }; });
    var vel = 0, lastY = window.scrollY, mqVisible = false;
    new IntersectionObserver(function (en) { mqVisible = en[0].isIntersecting; }).observe(mq);
    gsap.ticker.add(function (time, dtMs) {
      var y = window.scrollY, dv = (y - lastY); lastY = y;
      vel += (dv - vel) * 0.12;
      if (!mqVisible) return;
      var dt = Math.min(dtMs, 50) / 1000;
      rows.forEach(function (r) {
        var gw = r.el.firstChild.offsetWidth || 1;
        var dir = vel < -0.5 ? -r.dir : r.dir;
        r.x += dir * (70 + Math.min(Math.abs(vel) * 40, 900)) * dt;
        if (r.x <= -gw) r.x += gw; if (r.x > 0) r.x -= gw;
        r.el.style.transform = 'translate3d(' + r.x + 'px,0,0) skewX(' + gsap.utils.clamp(-12, 12, -vel * 0.6) + 'deg)';
      });
    });
    gsap.from(mq, { opacity: 0, duration: 1.2, scrollTrigger: { trigger: mq, start: 'top 95%', once: true } });
  }

  /* ── HOVER: magnetic buttons + tilting cards (mouse only) ── */
  if (finePointer) {
    $$('.btn-red, .btn-outline, .btn-ghost, .btn-white, .btn-dark').forEach(function (b) {
      var qx = gsap.quickTo(b, 'x', { duration: 0.5, ease: 'power3' }), qy = gsap.quickTo(b, 'y', { duration: 0.5, ease: 'power3' });
      b.classList.add('m-mag');
      b.addEventListener('pointerenter', function () { b.style.transition = 'background .22s, border-color .22s, box-shadow .22s, color .22s'; });
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        qx((e.clientX - r.left - r.width / 2) * 0.32); qy((e.clientY - r.top - r.height / 2) * 0.45);
      });
      b.addEventListener('pointerleave', function () {
        gsap.to(b, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1,0.4)', overwrite: true, onComplete: function () { b.style.transition = ''; } });
      });
    });

    $$('.ba-card, .tc, .bc, .pillar, .color-card, .rc, .gg-item, .pg-item, .city-a').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        if (gsap.isTweening(c)) return;
        var r = c.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        c.style.transition = 'border-color .3s, box-shadow .3s, background .3s';
        gsap.to(c, { rotateY: px * 9, rotateX: -py * 9, y: -6, transformPerspective: 900, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
      });
      c.addEventListener('pointerleave', function () {
        gsap.to(c, { rotateY: 0, rotateX: 0, y: 0, duration: 0.8, ease: 'expo.out', overwrite: 'auto', clearProps: 'transform,transition' });
      });
    });
  }

  /* keep trigger positions honest when lazy images load, filters
     change the gallery, FAQs open, etc. */
  var rt; function refreshSoon() { clearTimeout(rt); rt = setTimeout(function () { ScrollTrigger.refresh(); }, 180); }
  if (window.ResizeObserver) new ResizeObserver(refreshSoon).observe(document.body);
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
