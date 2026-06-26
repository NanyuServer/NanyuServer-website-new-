/* ═══════════════════════════════════════════════════════════════
   南渝万能墙 — ROIHEADS-INSPIRED INTERACTIONS
   Lenis Smooth Scroll + GSAP + Count-up + Text Split + Parallax
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Wait for DOM ── */
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  ready(function () {

    /* ═══════════════════════════════════════════════════════════
       0. GRADIENTBLINDS HERO BACKGROUND
       ═══════════════════════════════════════════════════════════ */
    var gbContainer = document.getElementById('colorBendsContainer');
    if (gbContainer && typeof window.GradientBlinds === 'function') {
      window.GradientBlinds(gbContainer, {
        gradientColors: ['#FF9FFC', '#5227FF'],
        angle: 0,
        noise: 0.25,
        blindCount: 16,
        blindMinWidth: 60,
        mouseDampening: 0.3,
        mirrorGradient: false,
        spotlightRadius: 0.5,
        spotlightSoftness: 1,
        spotlightOpacity: 1,
        distortAmount: 0,
        shineDirection: 'left'
      });
    }

    /* ═══════════════════════════════════════════════════════════
       1. LENIS SMOOTH SCROLL
       ═══════════════════════════════════════════════════════════ */
    var lenis;
    try {
      lenis = new Lenis({
        duration: 1.2,
        easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
      });

      if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
      } else {
        function raf(time) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
      }
    } catch (e) {
      console.warn('Lenis init failed:', e);
    }


    /* ═══════════════════════════════════════════════════════════
       2. NAVBAR SCROLL EFFECT
       ═══════════════════════════════════════════════════════════ */
    var navbar = document.getElementById('navbar');
    var lastScroll = 0;

    function onScroll() {
      var st = window.scrollY || window.pageYOffset;
      if (st > 80) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
      lastScroll = st;
    }

    window.addEventListener('scroll', onScroll, { passive: true });


    /* ═══════════════════════════════════════════════════════════
       3. FULL-SCREEN MENU
       ═══════════════════════════════════════════════════════════ */
    var menuBtn = document.getElementById('menuBtn');
    var menuOverlay = document.getElementById('menuOverlay');
    var menuOpen = false;

    function toggleMenu() {
      menuOpen = !menuOpen;
      menuBtn.classList.toggle('is-clicked', menuOpen);
      menuOverlay.classList.toggle('is-open', menuOpen);

      if (menuOpen) {
        document.body.style.overflow = 'hidden';
        if (lenis) lenis.stop();
      } else {
        document.body.style.overflow = '';
        if (lenis) lenis.start();
      }
    }

    menuBtn.addEventListener('click', toggleMenu);

    /* Close menu when clicking links */
    menuOverlay.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        if (menuOpen) toggleMenu();
      });
    });

    /* Close on Escape */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuOpen) toggleMenu();
    });


    /* ═══════════════════════════════════════════════════════════
       4. HERO TEXT REVEAL
       ═══════════════════════════════════════════════════════════ */
    setTimeout(function () {
      document.querySelectorAll('.hero-title-line, .hero-subtitle-line').forEach(function (el) {
        el.classList.add('is-revealed');
      });
    }, 400);


    /* ═══════════════════════════════════════════════════════════
       5. SCROLL-TRIGGERED REVEALS (data-reveal)
       ═══════════════════════════════════════════════════════════ */
    var revealElements = document.querySelectorAll('[data-reveal]');
    revealElements.forEach(function (el, idx) {
      el._revealIndex = idx;
    });
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var idx = entry.target._revealIndex || 0;
          setTimeout(function () {
            entry.target.classList.add('is-revealed');
          }, idx * 60);
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    revealElements.forEach(function (el) {
      revealObserver.observe(el);
    });


    /* ═══════════════════════════════════════════════════════════
       6. COUNT-UP NUMBER ANIMATION (Slot Machine Effect)
       ═══════════════════════════════════════════════════════════ */
    var ANIMATION_DURATION = 1600;
    var STAGGER_DELAY = 100;
    var SLOT_SIZE = 5;
    var FINAL_INDEX = SLOT_SIZE - 1;

    function easeOutExpo(t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function buildSlot(el) {
      var raw = el.textContent.trim();
      var target = parseInt(raw, 10);
      var isNumber = !isNaN(target);
      var fragment = document.createDocumentFragment();

      if (isNumber) {
        for (var i = FINAL_INDEX; i >= 0; i--) {
          var span = document.createElement('span');
          span.textContent = (target - i + 10) % 10;
          fragment.appendChild(span);
        }
      } else {
        /* Non-numeric: show the character at end */
        var glyphs = ['#', '~', '%', '&'];
        var shuffled = glyphs.filter(function (g) { return g !== raw; })
          .sort(function () { return Math.random() - 0.5; });
        var items = shuffled.slice(0, FINAL_INDEX).concat([raw]);
        items.forEach(function (g) {
          var span = document.createElement('span');
          span.textContent = g;
          fragment.appendChild(span);
        });
      }

      var strip = document.createElement('div');
      strip.className = 'digit-strip';
      strip.appendChild(fragment);

      el.textContent = '';
      el.appendChild(strip);

      return { strip: strip };
    }

    function animateSlot(strip, delay) {
      var translateTarget = (FINAL_INDEX / SLOT_SIZE * 100).toFixed(2);

      setTimeout(function () {
        var startTime = null;

        function tick(now) {
          if (startTime === null) startTime = now;
          var progress = Math.min((now - startTime) / ANIMATION_DURATION, 1);
          var eased = easeOutExpo(progress);
          strip.style.transform = 'translateY(-' + (eased * translateTarget).toFixed(2) + '%)';
          if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
      }, delay);
    }

    function initCountup(container) {
      if (container._initialized) return;

      var slots = Array.from(container.querySelectorAll('[data-number]'))
        .map(buildSlot)
        .filter(Boolean);

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          container._initialized = true;
          observer.disconnect();
          slots.forEach(function (s, i) {
            animateSlot(s.strip, i * STAGGER_DELAY);
          });
        });
      }, { threshold: 0.2 });

      observer.observe(container);
    }

    document.querySelectorAll('[data-countup]').forEach(initCountup);


    /* ═══════════════════════════════════════════════════════════
       7. GSAP SPLIT TEXT + PARALLAX ANIMATIONS
       ═══════════════════════════════════════════════════════════ */
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {

      /* ── Approach Title Split Text ── */
      gsap.utils.toArray('[data-split-text]').forEach(function (el) {
        var text = el.innerHTML;
        /* Split by <br/> or words */
        var lines = text.split(/<br\s*\/?>/i);
        el.innerHTML = '';

        lines.forEach(function (lineText, lineIndex) {
          var lineDiv = document.createElement('div');
          lineDiv.style.overflow = 'hidden';
          lineDiv.style.position = 'relative';

          var innerDiv = document.createElement('div');
          innerDiv.innerHTML = lineText.trim();
          innerDiv.style.transform = 'translateY(110%)';
          innerDiv.style.opacity = '0';
          innerDiv.style.willChange = 'transform';

          lineDiv.appendChild(innerDiv);
          el.appendChild(lineDiv);

          gsap.to(innerDiv, {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'power3.out',
            delay: lineIndex * 0.15,
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              once: true,
            }
          });
        });
      });

      /* ── Parallax on sections ── */
      gsap.utils.toArray('[element-parallax-trigger]').forEach(function (section) {
        var children = section.querySelectorAll('.approach-title, .stats-title, .feature-row');
        children.forEach(function (child, i) {
          gsap.from(child, {
            y: 30 + i * 10,
            scrollTrigger: {
              trigger: section,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
            }
          });
        });
      });

      /* ── Feature rows stagger ── */
      /* Handled by CSS [data-reveal] + IntersectionObserver */

      /* ── Stats items stagger ── */
      gsap.utils.toArray('.stat-item').forEach(function (item, i) {
        gsap.from(item, {
          opacity: 0,
          y: 30,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 85%',
            once: true,
          },
          delay: i * 0.1,
        });
      });

      /* ── CTA buttons stagger ── */
      gsap.from('.cta-buttons', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.cta-buttons',
          start: 'top 85%',
          once: true,
        },
      });
    }


    /* ═══════════════════════════════════════════════════════════
       8. SMOOTH ANCHOR SCROLL (for menu links)
       ═══════════════════════════════════════════════════════════ */
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var targetId = this.getAttribute('href');
        if (targetId === '#') return;
        var target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          if (lenis) {
            lenis.scrollTo(target, { offset: -80 });
          } else {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    });


    /* ═══════════════════════════════════════════════════════════
       9. PAGE LOAD TRANSITION
       ═══════════════════════════════════════════════════════════ */
    var overlay = document.getElementById('transitionOverlay');
    if (overlay) {
      overlay.style.opacity = '1';
      overlay.style.transition = 'opacity 0.8s ease';
      setTimeout(function () {
        overlay.style.opacity = '0';
        setTimeout(function () {
          overlay.style.display = 'none';
        }, 800);
      }, 300);
    }

  });
})();
