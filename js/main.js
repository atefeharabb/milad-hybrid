/* =========================================================
   میلاد — کلینیک تخصصی خودروهای هیبریدی
   main.js  |  vanilla JS, no dependencies
   - sticky glass header + mobile navigation
   - scroll reveal, hero parallax, active nav link
   - animated counters (Persian digits)
   - 3D newspaper page-flip gallery (auto / arrows / dots / swipe / keyboard)
   - video playlist with muted autoplay on view
   ========================================================= */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  window.__miladReady = true;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  function toFa(value) {
    return String(value).replace(/\d/g, function (d) { return FA_DIGITS[+d]; });
  }
  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }
  function encodePath(path) {
    return encodeURI(path);
  }

  /* ---------------------------------------------------------
     1. Sticky header
     --------------------------------------------------------- */
  var header = doc.getElementById('siteHeader');
  var lastScroll = -1;

  function updateHeader() {
    var y = window.scrollY || window.pageYOffset;
    if (y === lastScroll) return;
    lastScroll = y;
    if (header) header.classList.toggle('is-stuck', y > 10);
  }
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  /* ---------------------------------------------------------
     2. Mobile navigation
     --------------------------------------------------------- */
  var navToggle = doc.getElementById('navToggle');
  var scrim = doc.getElementById('navScrim');
  var navLinks = doc.querySelectorAll('.nav a[href^="#"]');

  function setNav(open) {
    if (!header || !navToggle) return;
    header.classList.toggle('is-nav-open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    navToggle.setAttribute('aria-label', open ? 'بستن منو' : 'باز کردن منو');
    if (scrim) {
      if (open) {
        scrim.hidden = false;
        requestAnimationFrame(function () { scrim.classList.add('is-visible'); });
      } else {
        scrim.classList.remove('is-visible');
        window.setTimeout(function () { scrim.hidden = true; }, 260);
      }
    }
    doc.body.style.overflow = open ? 'hidden' : '';
  }

  if (navToggle) {
    navToggle.addEventListener('click', function () {
      setNav(!header.classList.contains('is-nav-open'));
    });
  }
  if (scrim) scrim.addEventListener('click', function () { setNav(false); });
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () { setNav(false); });
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && header && header.classList.contains('is-nav-open')) setNav(false);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 1080) setNav(false);
  });

  /* ---------------------------------------------------------
     3. Scroll reveal
     --------------------------------------------------------- */
  var revealItems = doc.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealItems.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealItems.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------------------------------------------------------
     4. Hero parallax
     --------------------------------------------------------- */
  var hero = doc.querySelector('.hero');
  var heroImg = doc.getElementById('heroImg');
  var parallaxQueued = false;

  function paintParallax() {
    parallaxQueued = false;
    if (!hero || !heroImg) return;
    var rect = hero.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    var offset = Math.min(Math.max(-rect.top, 0), rect.height) * 0.16;
    heroImg.style.setProperty('--py', offset.toFixed(2) + 'px');
  }
  function requestParallax() {
    if (reduceMotion) return;
    if (!parallaxQueued) {
      parallaxQueued = true;
      requestAnimationFrame(paintParallax);
    }
  }
  if (!reduceMotion && hero && heroImg) {
    window.addEventListener('scroll', requestParallax, { passive: true });
    window.addEventListener('resize', requestParallax);
    paintParallax();
  }

  /* ---------------------------------------------------------
     5. Animated counters (Persian digits)
     --------------------------------------------------------- */
  var counters = doc.querySelectorAll('[data-count]');

  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = target > 500 ? 1900 : 1500;
    var startTime = null;

    function frame(now) {
      if (startTime === null) startTime = now;
      var progress = Math.min((now - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = toFa(Math.round(target * eased)) + suffix;
      if (progress < 1) requestAnimationFrame(frame);
    }

    if (reduceMotion) {
      el.textContent = toFa(target) + suffix;
      return;
    }
    requestAnimationFrame(frame);
  }

  if (counters.length) {
    if ('IntersectionObserver' in window) {
      var counterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { counterObserver.observe(el); });
    } else {
      counters.forEach(function (el) {
        el.textContent = toFa(el.getAttribute('data-count')) + (el.getAttribute('data-suffix') || '');
      });
    }
  }

  /* ---------------------------------------------------------
     6. Active navigation link
     --------------------------------------------------------- */
  var navMap = {};
  doc.querySelectorAll('.nav__link[href^="#"]').forEach(function (link) {
    navMap[link.getAttribute('href').slice(1)] = link;
  });
  var navSections = Object.keys(navMap)
    .map(function (id) { return doc.getElementById(id); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && navSections.length) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = navMap[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          Object.keys(navMap).forEach(function (key) { navMap[key].classList.remove('is-active'); });
          link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    navSections.forEach(function (section) { sectionObserver.observe(section); });
  }

  /* ---------------------------------------------------------
     7. Newspaper page-flip gallery

     Every image in /assets is used once. Sheets are built here so the
     markup stays lean; each sheet has a printed front and a paper back.
     --------------------------------------------------------- */
  var GALLERY = [
    {
      src: 'assets/IMG_1952.PNG',
      alt: 'کلینیک تخصصی خودروهای هیبریدی میلاد در سبزوار؛ تصویر معرفی با شماره تماس',
      kicker: 'معرفی کلینیک',
      caption: 'کلینیک تخصصی خودروهای هیبریدی میلاد — سبزوار'
    },
    {
      src: 'assets/photo_2026-11-20_12-10-39.jpg',
      alt: 'نشان کرومی HYBRID روی بدنه سفید خودروی هیبریدی',
      kicker: 'امضای هیبرید',
      caption: 'هیبرید؛ نامی که روی خودرو می‌درخشد'
    },
    {
      src: 'assets/photo_2026-11-20_17-50-26.jpg',
      alt: 'جاگذاری ماژول‌های باتری هیبرید در قالب نارنجی',
      kicker: 'باز کردن پک',
      caption: 'بررسی و جاگذاری ماژول‌ها، بدون آسیب'
    },
    {
      src: 'assets/photo_2026-11-20_17-50-27.jpg',
      alt: 'تکنسین در حال باز کردن و بررسی پک باتری هیبرید',
      kicker: 'بررسی سلول‌ها',
      caption: 'باز کردن پک و بررسی وضعیت سلول‌ها'
    },
    {
      src: 'assets/photo_2026-11-20_17-50-27-2.jpg',
      alt: 'دست‌های تکنسین روی سلول‌های باتری هیبرید',
      kicker: 'بازرسی',
      caption: 'بررسی دقیق سلول‌ها، یکی‌یکی'
    },
    {
      src: 'assets/photo_2026-11-20_17-50-28.jpg',
      alt: 'بستن اتصالات باتری هیبرید با پیچ‌گوشتی برقی',
      kicker: 'مونتاژ',
      caption: 'بستن اتصالات با ابزار مخصوص'
    },
    {
      src: 'assets/photo_2026-11-20_17-50-29-2.jpg',
      alt: 'کنترل پیچ‌های باسبار نارنجی باتری هیبرید',
      kicker: 'کنترل گشتاور',
      caption: 'کنترل گشتاور پیچ‌های باسبار'
    },
    {
      src: 'assets/photo_2026-11-20_17-50-29.jpg',
      alt: 'اتصال کابل فشار قوی نارنجی به پک باتری زیر صندلی خودرو',
      kicker: 'اتصال فشار قوی',
      caption: 'اتصال کابل فشار قوی به پک باتری'
    },
    {
      src: 'assets/photo_2026-11-20_17-50-30.jpg',
      alt: 'محکم کردن پک باتری هیبرید روی خودرو',
      kicker: 'نصب روی خودرو',
      caption: 'نصب و محکم کردن پک روی خودرو'
    },
    {
      src: 'assets/photo_2026-11-20_17-50-31.jpg',
      alt: 'تکنسین در حال مونتاژ نهایی پک باتری هیبرید',
      kicker: 'تست نهایی',
      caption: 'مونتاژ نهایی و آماده‌سازی تست'
    }
  ];

  var stage = doc.getElementById('flipStage');
  var captionEl = doc.getElementById('flipCaption');
  var counterEl = doc.getElementById('flipCounter');
  var totalEl = doc.getElementById('flipTotal');
  var dotsEl = doc.getElementById('flipDots');
  var progressEl = doc.getElementById('flipProgress');
  var prevBtn = doc.getElementById('flipPrev');
  var nextBtn = doc.getElementById('flipNext');
  var pauseBtn = doc.getElementById('flipPause');

  if (stage && captionEl) {
    var sheets = [];
    var dots = [];
    var order = [];
    var current = 0;
    var animating = false;
    var paused = false;
    var autoTimer = null;
    var AUTOPLAY_MS = 4400;
    var TURN_MS = 1050;

    /* --- build sheets --- */
    GALLERY.forEach(function (item, i) {
      var sheet = doc.createElement('div');
      sheet.className = 'sheet';
      sheet.setAttribute('data-index', String(i));
      sheet.style.zIndex = String(GALLERY.length - i);

      var front = doc.createElement('div');
      front.className = 'sheet__face sheet__front';

      var img = doc.createElement('img');
      img.className = 'sheet__img';
      img.src = encodePath(item.src);
      img.alt = item.alt;
      img.loading = i === 0 ? 'eager' : 'lazy';
      img.decoding = 'async';
      img.width = 800;
      img.height = 1000;

      var overlay = doc.createElement('div');
      overlay.className = 'sheet__overlay';

      var meta = doc.createElement('div');
      meta.className = 'sheet__meta';

      var kicker = doc.createElement('span');
      kicker.className = 'sheet__kicker';
      kicker.textContent = item.kicker;

      var caption = doc.createElement('p');
      caption.className = 'sheet__caption';
      caption.textContent = item.caption;

      meta.appendChild(kicker);
      meta.appendChild(caption);

      /* Soft blurred copy fills the frame so the real photo is never cropped. */
      var backdrop = doc.createElement('img');
      backdrop.className = 'sheet__bg';
      backdrop.src = encodePath(item.src);
      backdrop.alt = '';
      backdrop.setAttribute('aria-hidden', 'true');
      backdrop.loading = 'lazy';
      backdrop.decoding = 'async';

      front.appendChild(backdrop);
      front.appendChild(img);
      front.appendChild(overlay);
      front.appendChild(meta);

      var back = doc.createElement('div');
      back.className = 'sheet__face sheet__back';
      back.setAttribute('aria-hidden', 'true');

      var mark = doc.createElement('img');
      mark.className = 'sheet__back-mark';
      mark.src = 'assets/brand/logo-mark.png';
      mark.alt = '';
      mark.width = 720;
      mark.height = 269;
      mark.loading = 'lazy';

      var backText = doc.createElement('span');
      backText.className = 'sheet__back-text';
      backText.textContent = 'کلینیک هیبرید میلاد';

      back.appendChild(mark);
      back.appendChild(backText);

      sheet.appendChild(front);
      sheet.appendChild(back);
      stage.appendChild(sheet);
      sheets.push(sheet);
      order.push(i);
    });

    /* --- dots --- */
    if (dotsEl) {
      GALLERY.forEach(function (item, i) {
        var dot = doc.createElement('button');
        dot.type = 'button';
        dot.className = 'book__dot';
        dot.setAttribute('aria-label', 'نمایش تصویر ' + toFa(i + 1));
        if (i === 0) dot.setAttribute('aria-current', 'true');
        dot.addEventListener('click', function () {
          jumpTo(i);
          restartAuto();
        });
        dotsEl.appendChild(dot);
        dots.push(dot);
      });
    }
    if (totalEl) totalEl.textContent = toFa(GALLERY.length);

    function applyOrder() {
      order.forEach(function (sheetIndex, position) {
        sheets[sheetIndex].style.zIndex = String(GALLERY.length - position);
      });
    }

    function syncUI() {
      var item = GALLERY[current];
      captionEl.textContent = item.caption;
      if (counterEl) counterEl.textContent = toFa(pad2(current + 1));
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === current);
        if (i === current) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
      // Only the visible sheet is exposed to assistive tech.
      sheets.forEach(function (sheet, i) {
        sheet.setAttribute('aria-hidden', i === current ? 'false' : 'true');
      });
    }

    function resetProgress() {
      if (!progressEl) return;
      progressEl.classList.remove('is-running');
      void progressEl.offsetWidth;
      if (!paused && !reduceMotion) progressEl.classList.add('is-running');
    }

    function clearAuto() {
      if (autoTimer) {
        window.clearTimeout(autoTimer);
        autoTimer = null;
      }
    }

    function scheduleAuto() {
      clearAuto();
      if (paused || reduceMotion) return;
      autoTimer = window.setTimeout(function () {
        turn(1, true);
      }, AUTOPLAY_MS);
    }

    function restartAuto() {
      clearAuto();
      resetProgress();
      scheduleAuto();
    }

    function setPaused(value) {
      paused = value;
      if (pauseBtn) {
        pauseBtn.classList.toggle('is-paused', paused);
        pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
        pauseBtn.setAttribute('aria-label', paused ? 'ادامه ورق زدن خودکار' : 'توقف ورق زدن خودکار');
      }
      if (progressEl) progressEl.classList.toggle('is-paused', paused);
      if (paused) clearAuto();
      else restartAuto();
    }

    /* Turn forward: the top sheet lifts from the spine and flips away. */
    function turn(direction, fromAuto) {
      if (animating) return;
      if (direction > 0) {
        var turning = sheets[order[0]];
        animating = true;

        current = order[1];
        syncUI();
        resetProgress();
        scheduleAuto();

        turning.classList.add('is-turning');

        window.setTimeout(function () {
          turning.classList.add('no-anim');
          turning.classList.remove('is-turning');
          order.push(order.shift());
          applyOrder();
          // force style flush, then re-enable transitions for future turns
          void turning.offsetWidth;
          turning.classList.remove('no-anim');
          animating = false;
        }, reduceMotion ? 30 : TURN_MS);
      } else {
        var incoming = sheets[order[order.length - 1]];
        animating = true;

        order.unshift(order.pop());
        applyOrder();
        incoming.classList.add('is-returning');

        current = order[0];
        syncUI();
        resetProgress();
        scheduleAuto();

        window.setTimeout(function () {
          incoming.classList.remove('is-returning');
          animating = false;
        }, reduceMotion ? 30 : 950);
      }

      if (fromAuto) { /* nothing extra: timer already re-armed */ }
    }

    /* Jump straight to a sheet (dots) with a soft paper flash. */
    function jumpTo(index) {
      if (animating || index === current) return;
      var position = order.indexOf(index);
      if (position < 0) return;

      current = index;
      order = order.slice(position).concat(order.slice(0, position));
      applyOrder();
      syncUI();
      animating = true;
      stage.classList.add('is-jumping');
      window.setTimeout(function () {
        stage.classList.remove('is-jumping');
        animating = false;
      }, 260);
    }

    /* --- controls --- */
    if (nextBtn) nextBtn.addEventListener('click', function () { turn(1); restartAuto(); });
    if (prevBtn) prevBtn.addEventListener('click', function () { turn(-1); restartAuto(); });
    if (pauseBtn) pauseBtn.addEventListener('click', function () { setPaused(!paused); });

    /* Pause while the reader is looking at a sheet */
    stage.addEventListener('pointerenter', function () {
      if (!paused) {
        clearAuto();
        if (progressEl) progressEl.classList.add('is-paused');
      }
    });
    stage.addEventListener('pointerleave', function () {
      if (!paused) restartAuto();
    });
    stage.addEventListener('focusin', function () {
      if (!paused) {
        clearAuto();
        if (progressEl) progressEl.classList.add('is-paused');
      }
    });
    stage.addEventListener('focusout', function () {
      if (!paused) restartAuto();
    });

    /* Keyboard: RTL reading direction */
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); turn(1); restartAuto(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); turn(-1); restartAuto(); }
      else if (e.key === 'Home') { e.preventDefault(); jumpTo(0); restartAuto(); }
      else if (e.key === 'End') { e.preventDefault(); jumpTo(GALLERY.length - 1); restartAuto(); }
    });

    /* Swipe / drag */
    var pointerStartX = null;
    var pointerStartY = null;
    stage.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pointerStartX = e.clientX;
      pointerStartY = e.clientY;
    });
    stage.addEventListener('pointerup', function (e) {
      if (pointerStartX === null) return;
      var dx = e.clientX - pointerStartX;
      var dy = e.clientY - pointerStartY;
      pointerStartX = null;
      pointerStartY = null;
      if (Math.abs(dx) < 44 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) turn(1); else turn(-1);
      restartAuto();
    });
    stage.addEventListener('pointercancel', function () {
      pointerStartX = null;
      pointerStartY = null;
    });

    /* Pause when the tab is hidden */
    doc.addEventListener('visibilitychange', function () {
      if (doc.hidden) clearAuto();
      else if (!paused) restartAuto();
    });

    applyOrder();
    syncUI();
    restartAuto();
  }

  /* ---------------------------------------------------------
     8. Video playlist (muted autoplay while in view)
     --------------------------------------------------------- */
  var player = doc.getElementById('mainVideo');
  var thumbs = Array.prototype.slice.call(doc.querySelectorAll('.video-thumb'));
  var videoNow = doc.getElementById('videoNow');
  var userStarted = false;

  function playVideo() {
    if (!player) return;
    var attempt = player.play();
    if (attempt && typeof attempt.catch === 'function') attempt.catch(function () { /* autoplay blocked */ });
  }

  function selectVideo(thumb) {
    if (!player) return;
    thumbs.forEach(function (b) { b.classList.toggle('is-active', b === thumb); });
    if (videoNow && thumb.dataset.title) videoNow.textContent = thumb.dataset.title;

    player.pause();
    if (thumb.dataset.poster) player.setAttribute('poster', encodePath(thumb.dataset.poster));
    player.setAttribute('aria-label', 'ویدیو: ' + (thumb.dataset.title || ''));

    // Remove static <source> children so the new src wins.
    Array.prototype.slice.call(player.querySelectorAll('source')).forEach(function (s) {
      s.parentNode.removeChild(s);
    });
    player.src = encodePath(thumb.dataset.src);
    player.load();
    player.muted = true;
    playVideo();
  }

  thumbs.forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      userStarted = true;
      selectVideo(thumb);
    });
  });

  if (player && 'IntersectionObserver' in window) {
    var videoObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !doc.hidden) {
          if (player.paused) playVideo();
        } else if (!player.paused) {
          player.pause();
        }
      });
    }, { threshold: 0.55 });
    videoObserver.observe(player);
  }

  if (player) {
    // Resume playback when the visitor comes back to the tab while the player is on screen.
    doc.addEventListener('visibilitychange', function () {
      if (doc.hidden || !player.paused) return;
      var rect = player.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) playVideo();
    });

    player.addEventListener('play', function () {
      if (thumbs.length && !userStarted) player.muted = true;
    });
    // Some browsers reject QuickTime on file:// — tell the visitor instead of a dead frame.
    player.addEventListener('error', function () {
      if (!videoNow) return;
      videoNow.textContent = 'پخش این ویدیو در مرورگر شما ممکن نیست';
    });
  }

  /* ---------------------------------------------------------
     9. Small polish: keep footer year and CSS var in sync
     --------------------------------------------------------- */
  function syncHeaderVar() {
    if (!header) return;
    var h = header.offsetHeight;
    if (h) root.style.setProperty('--header-h', h + 'px');
  }
  window.addEventListener('resize', syncHeaderVar);
  window.addEventListener('load', syncHeaderVar);
  syncHeaderVar();

  /* ---------------------------------------------------------
     10. Introduction: certificate slider
     --------------------------------------------------------- */
  var certRoot = doc.getElementById('credentials');
  if (certRoot) {
    var certSlides = Array.prototype.slice.call(certRoot.querySelectorAll('.cert-slide'));
    var certStage = doc.getElementById('certStage');
    var certDots = doc.getElementById('certDots');
    var certPrev = doc.getElementById('certPrev');
    var certNext = doc.getElementById('certNext');
    var certBar = doc.getElementById('certProgress');
    var certIndex = 0;
    var certTimer = null;
    var certHover = false;
    var CERT_MS = 5200;

    function certPaintProgress(run) {
      if (!certBar) return;
      certBar.classList.remove('is-running');
      void certBar.offsetWidth;
      if (run && !reduceMotion && !certHover) certBar.classList.add('is-running');
    }

    function certRender(index) {
      if (!certSlides.length) return;
      certIndex = (index + certSlides.length) % certSlides.length;
      certSlides.forEach(function (slide, n) {
        var pos = n - certIndex;
        if (pos > certSlides.length / 2) pos -= certSlides.length;
        if (pos < -certSlides.length / 2) pos += certSlides.length;
        slide.setAttribute('data-pos', String(pos));
        slide.setAttribute('aria-hidden', pos === 0 ? 'false' : 'true');
      });
      if (certDots) {
        Array.prototype.forEach.call(certDots.children, function (dot, n) {
          dot.classList.toggle('is-active', n === certIndex);
          if (n === certIndex) dot.setAttribute('aria-current', 'true');
          else dot.removeAttribute('aria-current');
        });
      }
      certPaintProgress(true);
    }

    function certStop() {
      if (certTimer) {
        window.clearTimeout(certTimer);
        certTimer = null;
      }
    }

    function certSchedule() {
      certStop();
      if (reduceMotion || certHover) return;
      certTimer = window.setTimeout(function () {
        certRender(certIndex + 1);
        certSchedule();
      }, CERT_MS);
    }

    if (certDots) {
      certSlides.forEach(function (slide, n) {
        var dot = doc.createElement('button');
        dot.type = 'button';
        dot.className = 'cert-dot';
        dot.setAttribute('aria-label', 'نمایش گواهی ' + toFa(n + 1));
        dot.addEventListener('click', function () {
          certRender(n);
          certSchedule();
        });
        certDots.appendChild(dot);
      });
    }

    if (certPrev) certPrev.addEventListener('click', function () { certRender(certIndex - 1); certSchedule(); });
    if (certNext) certNext.addEventListener('click', function () { certRender(certIndex + 1); certSchedule(); });

    certRoot.addEventListener('pointerenter', function () { certHover = true; certStop(); certPaintProgress(false); });
    certRoot.addEventListener('pointerleave', function () { certHover = false; certSchedule(); });
    certRoot.addEventListener('focusin', function () { certHover = true; certStop(); certPaintProgress(false); });
    certRoot.addEventListener('focusout', function () { certHover = false; certSchedule(); });

    doc.addEventListener('visibilitychange', function () {
      if (doc.hidden) certStop();
      else certSchedule();
    });

    if (certStage) {
      var certStartX = null;
      certStage.addEventListener('pointerdown', function (e) { certStartX = e.clientX; });
      certStage.addEventListener('pointerup', function (e) {
        if (certStartX === null) return;
        var dx = e.clientX - certStartX;
        certStartX = null;
        if (Math.abs(dx) < 40) return;
        certRender(certIndex + (dx < 0 ? 1 : -1));
        certSchedule();
      });
      certStage.addEventListener('pointercancel', function () { certStartX = null; });
    }

    certRender(0);
    certSchedule();
  }

  /* ---------------------------------------------------------
     11. Copy card / SHEBA number
     --------------------------------------------------------- */
  var copyToast = doc.getElementById('copyToast');
  var copyToastTimer = null;

  function showCopyToast(message) {
    if (!copyToast) return;
    copyToast.textContent = message;
    copyToast.classList.add('is-visible');
    if (copyToastTimer) window.clearTimeout(copyToastTimer);
    copyToastTimer = window.setTimeout(function () {
      copyToast.classList.remove('is-visible');
    }, 2400);
  }

  Array.prototype.forEach.call(doc.querySelectorAll('[data-copy]'), function (button) {
    button.addEventListener('click', function () {
      var value = button.getAttribute('data-copy') || '';
      var label = button.getAttribute('data-copy-label') || 'شماره';
      var textEl = button.querySelector('[data-copy-text]');
      var original = textEl ? textEl.textContent : '';

      function copied() {
        button.classList.add('is-copied');
        if (textEl) textEl.textContent = 'کپی شد';
        showCopyToast(label + ' کپی شد');
        window.setTimeout(function () {
          button.classList.remove('is-copied');
          if (textEl) textEl.textContent = original;
        }, 2000);
      }

      function fallbackCopy() {
        try {
          var field = doc.createElement('textarea');
          field.value = value;
          field.setAttribute('readonly', '');
          field.style.position = 'fixed';
          field.style.insetBlockStart = '-1000px';
          doc.body.appendChild(field);
          field.select();
          doc.execCommand('copy');
          doc.body.removeChild(field);
          copied();
        } catch (err) {
          showCopyToast('کپی نشد؛ لطفاً دستی انتخاب کنید');
        }
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(copied, fallbackCopy);
      } else {
        fallbackCopy();
      }
    });
  });

  /* ---------------------------------------------------------
     12. Reading progress bar
     --------------------------------------------------------- */
  var scrollBar = doc.getElementById('scrollProgress');
  var scrollQueued = false;

  function paintScrollProgress() {
    scrollQueued = false;
    if (!scrollBar) return;
    var max = doc.documentElement.scrollHeight - window.innerHeight;
    var ratio = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
    scrollBar.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
  }

  if (scrollBar) {
    window.addEventListener('scroll', function () {
      if (scrollQueued) return;
      scrollQueued = true;
      requestAnimationFrame(paintScrollProgress);
    }, { passive: true });
    window.addEventListener('resize', paintScrollProgress);
    paintScrollProgress();
  }
})();
