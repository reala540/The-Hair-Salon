/* Hair Gallery — interactions */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) document.documentElement.classList.add('no-motion');

  /* ---------- Preloader ---------- */
  var preloader = document.getElementById('preloader');
  function dismissPreloader() {
    if (!preloader || preloader.classList.contains('done')) return;
    preloader.classList.add('done');
    setTimeout(function () { preloader.remove(); }, 900);
  }
  window.addEventListener('load', function () {
    setTimeout(dismissPreloader, prefersReduced ? 0 : 900);
  });
  setTimeout(dismissPreloader, 2200); // safety: never trap the page

  /* ---------- Smooth scroll (Lenis) ---------- */
  var lenis = null;
  if (!prefersReduced && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }
  function scrollToTarget(target) {
    var el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -20, duration: 1.4 });
    else el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
  }

  /* ---------- Anchor links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      closeMenu();
      scrollToTarget(el);
    });
  });

  /* ---------- Navigation hide/reveal + solid state ---------- */
  var nav = document.getElementById('nav');
  var lastY = window.scrollY;
  var menuOpen = false;
  function onScrollNav() {
    var y = window.scrollY;
    if (!menuOpen) {
      if (y > lastY + 4 && y > 160) nav.classList.add('nav--hidden');
      else if (y < lastY - 4 || y <= 160) nav.classList.remove('nav--hidden');
    }
    nav.classList.toggle('nav--solid', y > 40);
    lastY = y;
  }
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');
  function openMenu() {
    menuOpen = true;
    menu.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    nav.classList.remove('nav--hidden');
    nav.classList.add('nav--menu');
    if (lenis) lenis.stop();
    document.body.style.overflow = 'hidden';
    var first = menu.querySelector('.menu__link');
    if (first) first.focus();
  }
  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false;
    menu.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    nav.classList.remove('nav--menu');
    if (lenis) lenis.start();
    document.body.style.overflow = '';
  }
  burger.addEventListener('click', function () { menuOpen ? closeMenu() : openMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------- GSAP choreography ---------- */
  var hasGsap = typeof gsap !== 'undefined';
  if (hasGsap && typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);

  // Hero title mask reveal
  if (hasGsap && !prefersReduced) {
    gsap.from('.hero__title .line > span', {
      yPercent: 110,
      duration: 1.1,
      ease: 'power3.out',
      stagger: 0.12,
      delay: 0.55
    });
    gsap.from(['.hero__sub', '.hero__cta'], {
      y: 26, opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.12,
      delay: 1.0
    });
    gsap.from('.cloud__item', {
      scale: 0.9, opacity: 0,
      duration: 1.2,
      ease: 'power3.out',
      stagger: 0.1,
      delay: 0.8,
      clearProps: 'opacity,scale'
    });
  }

  // Scroll reveals
  if (hasGsap && typeof ScrollTrigger !== 'undefined' && !prefersReduced) {
    document.querySelectorAll('.reveal').forEach(function (el) {
      gsap.to(el, {
        opacity: 1, y: 0, scale: 1,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });

    // Hero cloud parallax
    document.querySelectorAll('.cloud__item').forEach(function (item) {
      var speed = parseFloat(item.getAttribute('data-speed') || '0.4');
      gsap.to(item, {
        yPercent: -60 * speed,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 }
      });
    });

    // About image parallax
    document.querySelectorAll('[data-parallax]').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -8 }, {
        yPercent: 8,
        ease: 'none',
        scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: 1 }
      });
    });

    // Dark-section nav adaptation
    ['#about', '#gallery', '#visit'].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (!el) return;
      ScrollTrigger.create({
        trigger: el,
        start: 'top ' + (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72),
        end: 'bottom 72',
        onToggle: function (self) {
          document.body.classList.toggle('dark-section-active', self.isActive);
        }
      });
    });
  }

  // Stat counters
  document.querySelectorAll('[data-count]').forEach(function (el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = parseInt(el.getAttribute('data-decimal') || '0', 10);
    var suffix = el.getAttribute('data-suffix') || '';
    var finalText = target.toFixed(decimals) + suffix;
    if (!hasGsap || prefersReduced || typeof ScrollTrigger === 'undefined') {
      el.textContent = finalText;
      return;
    }
    var obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: 1.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: function () { el.textContent = obj.v.toFixed(decimals) + suffix; }
    });
  });

  /* ---------- Drag slider (momentum) ---------- */
  (function () {
    var slider = document.getElementById('slider');
    var track = document.getElementById('sliderTrack');
    if (!slider || !track) return;

    var x = 0, targetX = 0, maxX = 0, dragging = false, startX = 0, startTarget = 0, lastX = 0, velocity = 0, moved = false;

    function clamp(v) { return Math.min(0, Math.max(-maxX, v)); }
    function measure() { maxX = Math.max(0, track.scrollWidth - slider.clientWidth); targetX = clamp(targetX); }
    measure();
    window.addEventListener('resize', measure);

    function render() {
      x += (targetX - x) * (dragging ? 0.35 : 0.085);
      track.style.transform = 'translateX(' + x + 'px)';
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    function pointerDown(e) {
      dragging = true; moved = false;
      slider.classList.add('dragging');
      startX = lastX = (e.touches ? e.touches[0].clientX : e.clientX);
      startTarget = targetX;
      velocity = 0;
    }
    function pointerMove(e) {
      if (!dragging) return;
      var cx = e.touches ? e.touches[0].clientX : e.clientX;
      var dx = cx - startX;
      if (Math.abs(dx) > 4) moved = true;
      velocity = cx - lastX;
      lastX = cx;
      targetX = clamp(startTarget + dx);
    }
    function pointerUp() {
      if (!dragging) return;
      dragging = false;
      slider.classList.remove('dragging');
      targetX = clamp(targetX + velocity * 14); // momentum fling
    }

    slider.addEventListener('mousedown', pointerDown);
    window.addEventListener('mousemove', pointerMove);
    window.addEventListener('mouseup', pointerUp);
    slider.addEventListener('touchstart', pointerDown, { passive: true });
    slider.addEventListener('touchmove', pointerMove, { passive: true });
    slider.addEventListener('touchend', pointerUp);
    // block accidental image/link dragging while sliding
    slider.addEventListener('click', function (e) { if (moved) e.preventDefault(); }, true);
    slider.addEventListener('dragstart', function (e) { e.preventDefault(); });

    function step(dir) {
      var slide = track.querySelector('.slide');
      var w = slide ? slide.offsetWidth + 24 : 400;
      targetX = clamp(targetX + dir * -w);
    }
    var prev = document.getElementById('prevBtn');
    var next = document.getElementById('nextBtn');
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });
  })();

  /* ---------- Map fallback ---------- */
  (function () {
    var iframe = document.querySelector('.visit__map iframe');
    var fallback = document.getElementById('mapFallback');
    if (!iframe || !fallback) return;
    iframe.addEventListener('error', show);
    setTimeout(function () {
      try {
        // cross-origin: if the embed refused to load, its contentWindow stays null-ish
        var doc = iframe.contentDocument;
        if (doc && doc.body && doc.body.children.length === 0) show();
      } catch (err) { /* blocked embeds still render a frame; leave as-is */ }
    }, 4000);
    function show() {
      iframe.style.display = 'none';
      fallback.style.display = 'grid';
    }
  })();

  /* ---------- Back to top ---------- */
  var toTop = document.getElementById('toTop');
  if (toTop) toTop.addEventListener('click', function () {
    if (lenis) lenis.scrollTo(0, { duration: 1.4 });
    else window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  });
})();
