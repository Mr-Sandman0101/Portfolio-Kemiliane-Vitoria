/* ============================================================
   KEMILIANE VITÓRIA — ARQUIVO 2B
   ============================================================ */

(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;

  /* ============================================================
     1. LOADER
     ============================================================ */
  const Loader = (() => {
    const messages = [
      { text: 'INICIALIZANDO NÚCLEO DE MEMÓRIA', pct: 15 },
      { text: 'ANALISANDO SUJEITO',              pct: 42 },
      { text: 'RECUPERANDO ARQUIVO PROFISSIONAL', pct: 68 },
      { text: 'IDENTIDADE LOCALIZADA',            pct: 92 }
    ];

    const fill    = document.getElementById('loaderFill');
    const percent = document.getElementById('loaderPercent');
    const status  = document.getElementById('loaderStatus');
    const msgs    = document.querySelectorAll('.loader__msg');
    const loader  = document.getElementById('loader');

    if (!loader || !fill) return { init: () => {} };

    let currentMsg = 0;

    function setProgress(v) {
      fill.style.width = v + '%';
      percent.textContent = v + '%';
    }

    function setMessage(i) {
      msgs.forEach((m, idx) => {
        m.classList.toggle('is-active', idx === i);
        m.classList.toggle('is-past', idx < i);
      });
      status.textContent = 'MEMORY://' + messages[i].text.split(' ')[0];
    }

    function finish() {
      setProgress(100);
      setMessage(messages.length - 1);
      status.textContent = 'READY://';
      setTimeout(() => {
        loader.classList.add('is-done');
        document.body.classList.remove('is-loading');
        document.body.classList.add('is-ready');
        document.documentElement.style.overflow = '';
        window.dispatchEvent(new CustomEvent('app:ready'));
      }, 700);
    }

    function run() {
      setMessage(0);
      const total = 4200;
      let start = null;

      function tick(ts) {
        if (!start) start = ts;
        const elapsed = ts - start;
        const t = Math.min(1, elapsed / total);
        const eased = 1 - Math.pow(1 - t, 4);
        setProgress(Math.floor(eased * 100));

        const msgIndex = Math.min(messages.length - 1, Math.floor(t * messages.length));
        if (msgIndex !== currentMsg) {
          currentMsg = msgIndex;
          setMessage(msgIndex);
        }

        if (t < 1) requestAnimationFrame(tick);
        else finish();
      }
      requestAnimationFrame(tick);
    }

    function init() {
      document.documentElement.style.overflow = 'hidden';
      if (prefersReduced) {
        setProgress(100);
        finish();
        return;
      }
      window.addEventListener('load', () => setTimeout(run, 300));
      setTimeout(() => {
        if (!document.body.classList.contains('is-ready')) run();
      }, 5000);
    }

    return { init };
  })();

  /* ============================================================
     2. THREE.JS
     ============================================================ */
  const ThreeScene = (() => {
    const canvas = document.getElementById('webgl');
    if (!canvas || isMobile || prefersReduced || !window.THREE) return { init: () => {} };

    let scene, camera, renderer, group, ring, ring2, dust;
    const mouse = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let scrollY = 0;
    let running = false;

    function init() {
      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x0d0c0a, 0.035);

      camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(0, 0, 6);

      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));

      group = new THREE.Group();
      scene.add(group);

      const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.4, 1),
        new THREE.MeshBasicMaterial({ color: 0xa8823c, wireframe: true, transparent: true, opacity: 0.35 })
      );
      group.add(core);

      const inner = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.9, 0),
        new THREE.MeshBasicMaterial({ color: 0xe8e2d5, wireframe: true, transparent: true, opacity: 0.15 })
      );
      group.add(inner);

      const pts = new THREE.Points(
        new THREE.IcosahedronGeometry(1.4, 1),
        new THREE.PointsMaterial({ color: 0xc9a35a, size: 0.04, transparent: true, opacity: 0.9, sizeAttenuation: true })
      );
      group.add(pts);

      ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.2, 0.008, 8, 128),
        new THREE.MeshBasicMaterial({ color: 0xa8823c, transparent: true, opacity: 0.35 })
      );
      ring.rotation.x = Math.PI * 0.5;
      ring.rotation.z = 0.2;
      group.add(ring);

      ring2 = new THREE.Mesh(
        new THREE.TorusGeometry(2.8, 0.004, 8, 128),
        new THREE.MeshBasicMaterial({ color: 0xe8e2d5, transparent: true, opacity: 0.18 })
      );
      ring2.rotation.x = Math.PI * 0.35;
      ring2.rotation.y = 0.4;
      group.add(ring2);

      const COUNT = 600;
      const positions = new Float32Array(COUNT * 3);
      for (let i = 0; i < COUNT; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 20;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
      }
      const pgeo = new THREE.BufferGeometry();
      pgeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      dust = new THREE.Points(pgeo, new THREE.PointsMaterial({
        color: 0xc9c3b8,
        size: 0.025,
        transparent: true,
        opacity: 0.55,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      }));
      scene.add(dust);

      window.addEventListener('mousemove', (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      });
      window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });
      window.addEventListener('resize', onResize);

      running = true;
      animate();
    }

    let clock;
    function animate() {
      if (!running) return;
      if (!clock) clock = new THREE.Clock();
      const t = clock.getElapsedTime();

      target.x += (mouse.x - target.x) * 0.05;
      target.y += (mouse.y - target.y) * 0.05;

      group.rotation.y = t * 0.15 + target.x * 0.5;
      group.rotation.x = Math.sin(t * 0.3) * 0.15 + target.y * 0.4;
      group.position.y = Math.sin(t * 0.6) * 0.1;

      ring.rotation.z += 0.003;
      ring2.rotation.x += 0.002;
      ring2.rotation.y -= 0.0015;

      camera.position.x = target.x * 0.6;
      camera.position.y = target.y * 0.4 - scrollY * 0.0008;
      camera.lookAt(0, 0, 0);

      const pos = dust.geometry.attributes.position.array;
      for (let i = 0; i < 600; i++) {
        pos[i * 3 + 1] += 0.003 * (i % 5 * 0.1 + 0.3);
        if (pos[i * 3 + 1] > 8) pos[i * 3 + 1] = -8;
      }
      dust.geometry.attributes.position.needsUpdate = true;
      dust.rotation.y = t * 0.02;

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    function onResize() {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    }

    return { init };
  })();

  /* ============================================================
     3. PARTÍCULAS 2D
     ============================================================ */
  const Dust2D = (() => {
    function init() {
      if (prefersReduced || isMobile) return;

      const canvas = document.createElement('canvas');
      canvas.style.cssText = `
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 2;
        opacity: 0.35;
        mix-blend-mode: screen;
      `;
      document.body.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      let w, h;
      const particles = [];

      function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
      }
      resize();
      window.addEventListener('resize', resize);

      const COUNT = 40;
      for (let i = 0; i < COUNT; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          r: Math.random() * 1.2 + 0.3,
          alpha: Math.random() * 0.4 + 0.1
        });
      }

      function draw() {
        ctx.clearRect(0, 0, w, h);
        particles.forEach(p => {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0) p.x = w;
          if (p.x > w) p.x = 0;
          if (p.y < 0) p.y = h;
          if (p.y > h) p.y = 0;
          ctx.fillStyle = `rgba(201, 195, 184, ${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        });
        requestAnimationFrame(draw);
      }
      draw();
    }
    return { init };
  })();

  /* ============================================================
     4. CURSOR
     ============================================================ */
  const Cursor = (() => {
    const cursor = document.getElementById('cursor');
    const label  = document.getElementById('cursorLabel');

    function init() {
      if (!cursor || isTouch || isMobile) {
        if (cursor) cursor.style.display = 'none';
        return;
      }

      let mx = 0, my = 0, cx = 0, cy = 0;

      window.addEventListener('mousemove', (e) => {
        mx = e.clientX; my = e.clientY;
      });

      function animate() {
        cx += (mx - cx) * 0.18;
        cy += (my - cy) * 0.18;
        cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
        requestAnimationFrame(animate);
      }
      animate();

      document.querySelectorAll('[data-cursor]').forEach(el => {
        el.addEventListener('mouseenter', () => {
          cursor.classList.add('is-hover');
          if (label) label.textContent = el.dataset.cursor;
        });
        el.addEventListener('mouseleave', () => {
          cursor.classList.remove('is-hover');
          if (label) label.textContent = '';
        });
      });

      document.querySelectorAll('a, button, .skill-chip, .identity__trait').forEach(el => {
        if (el.hasAttribute('data-cursor')) return;
        el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
      });

      document.addEventListener('mouseleave', () => cursor.classList.add('is-hide'));
      document.addEventListener('mouseenter', () => cursor.classList.remove('is-hide'));
    }
    return { init };
  })();

  /* ============================================================
     5. NAVEGAÇÃO + HUD
     ============================================================ */
  const Navigation = (() => {
    function init() {
      const toggle = document.getElementById('navToggle');
      const list   = document.getElementById('navList');

      toggle?.addEventListener('click', () => {
        toggle.classList.toggle('is-open');
        list.classList.toggle('is-open');
      });

      list?.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          toggle.classList.remove('is-open');
          list.classList.remove('is-open');
        });
      });

      const hudTime = document.getElementById('hudTime');
      function updateClock() {
        if (!hudTime) return;
        const n = new Date();
        const h = String(n.getHours()).padStart(2, '0');
        const m = String(n.getMinutes()).padStart(2, '0');
        const s = String(n.getSeconds()).padStart(2, '0');
        hudTime.textContent = `${h}:${m}:${s}`;
      }
      updateClock();
      setInterval(updateClock, 1000);

      const hudCoord = document.getElementById('hudCoord');
      function updateCoord() {
        if (!hudCoord) return;
        const lat = (-23.59 + (Math.random() - 0.5) * 0.001).toFixed(3);
        const lon = (-48.05 + (Math.random() - 0.5) * 0.001).toFixed(3);
        hudCoord.textContent = `${lat} / ${lon}`;
      }
      updateCoord();
      setInterval(updateCoord, 3000);

      const hudProgress = document.getElementById('hudProgress');
      const hudPercent  = document.getElementById('hudPercent');
      const hudSection  = document.getElementById('hudSection');

      const sectionMap = {
        'hero': 'BOOT',
        'identity': 'IDENTITY',
        'archive': 'ARCHIVE',
        'skills': 'SKILLS',
        'visual': 'VISUAL',
        'signal': 'SIGNAL'
      };

      function updateProgress() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));

        if (hudProgress) hudProgress.style.width = pct + '%';
        if (hudPercent) hudPercent.textContent = String(Math.round(pct)).padStart(3, '0');

        const sections = document.querySelectorAll('section[id]');
        let activeId = 'hero';
        sections.forEach(s => {
          const rect = s.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.4 && rect.bottom >= window.innerHeight * 0.4) {
            activeId = s.id;
          }
        });
        if (hudSection && sectionMap[activeId]) hudSection.textContent = sectionMap[activeId];

        document.querySelectorAll('.nav__list a').forEach(a => {
          const href = a.getAttribute('href').replace('#', '');
          a.classList.toggle('is-active', href === activeId);
        });
      }

      window.addEventListener('scroll', updateProgress, { passive: true });
      updateProgress();
    }
    return { init };
  })();

  /* ============================================================
     6. SKILLS
     ============================================================ */
  const Skills = (() => {
    const data = {
      lang: ['Português', 'Inglês', 'Espanhol', 'Francês', 'Alemão', 'Japonês', 'Coreano', 'Chinês', 'Russo', 'Italiano'],
      tools: ['Excel', 'Word', 'WhatsApp Business'],
      soft: ['Comunicação', 'Organização', 'Proatividade', 'Facilidade de aprendizado', 'Atendimento ao cliente', 'Rotinas administrativas'],
      areas: ['Recepção', 'Atendimento', 'Agendamento', 'Gestão de agenda', 'Emissão de documentos', 'Controle de vendas']
    };

    function build(container, items) {
      if (!container) return;
      container.innerHTML = items.map(t =>
        `<span class="skill-chip"><span class="skill-chip__mark">◈</span>${t}</span>`
      ).join('');
    }

    function init() {
      build(document.getElementById('skillsLang'), data.lang);
      build(document.getElementById('skillsTools'), data.tools);
      build(document.getElementById('skillsSoft'), data.soft);
      build(document.getElementById('skillsAreas'), data.areas);
    }

    return { init };
  })();

  /* ============================================================
     6.5. MEMORY FRAGMENTS
     ============================================================ */
  const MemoryFragments = (() => {
    function init() {
      const fragments = document.querySelectorAll('.memory__fragment');
      if (!fragments.length) return;

      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-loaded');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });

      fragments.forEach(f => io.observe(f));

      if (!prefersReduced && !isTouch && window.gsap) {
        fragments.forEach((fragment, i) => {
          const depth = (i % 2 === 0) ? -15 : 15;
          gsap.to(fragment, {
            y: depth,
            ease: 'none',
            scrollTrigger: {
              trigger: fragment,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true
            }
          });
        });
      }

      fragments.forEach(fragment => {
        const media = fragment.querySelector('.memory__fragment-media');
        const label = document.getElementById('cursorLabel');
        if (!media || !label) return;

        media.addEventListener('mouseenter', () => {
          const idx = fragment.dataset.index || '000';
          label.textContent = `MEM_${idx} · ACESSAR`;
        });
        media.addEventListener('mouseleave', () => {
          label.textContent = '';
        });
      });
    }
    return { init };
  })();

  /* ============================================================
     7. ANIMAÇÕES — GSAP + ScrollTrigger + Lenis
     ============================================================ */
  const Animations = (() => {
    let lenis;

    function init() {
      if (prefersReduced) {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
        return;
      }
      if (!window.gsap || !window.ScrollTrigger) return;

      gsap.registerPlugin(ScrollTrigger);

      if (window.Lenis) {
        lenis = new Lenis({
          duration: 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          smoothTouch: false
        });

        function raf(time) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);

        document.querySelectorAll('a[href^="#"]').forEach(a => {
          a.addEventListener('click', (e) => {
            const id = a.getAttribute('href');
            if (id.length > 1) {
              e.preventDefault();
              const target = document.querySelector(id);
              if (target) lenis.scrollTo(target, { offset: -80 });
            }
          });
        });
      }

      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

      document.querySelectorAll('.section, .archive__entry, .skills__group, .signal__form, .signal__info, .hero__portrait, .section__header').forEach(el => {
        el.classList.add('reveal');
        io.observe(el);
      });

      const heroBg = document.querySelector('[data-parallax]');
      if (heroBg) {
        gsap.to(heroBg, {
          yPercent: 10,
          ease: 'none',
          scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true
          }
        });
      }

      gsap.utils.toArray('.section').forEach(section => {
        gsap.fromTo(section, { opacity: 0.3 }, {
          opacity: 1, duration: 1.2, ease: 'power2.out',
          scrollTrigger: { trigger: section, start: 'top 80%', end: 'top 40%', scrub: true }
        });
      });

      gsap.utils.toArray('.skills__chips').forEach(container => {
        gsap.from(container.children, {
          y: 20, opacity: 0, duration: 0.6, stagger: 0.04, ease: 'power2.out',
          scrollTrigger: { trigger: container, start: 'top 85%', toggleActions: 'play none none none' }
        });
      });

      gsap.utils.toArray('.identity__portrait img, .hero__portrait-frame img').forEach(img => {
        gsap.to(img, {
          yPercent: -6, ease: 'none',
          scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });

      window.addEventListener('app:ready', () => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.from('.hero__meta-item', { y: 20, opacity: 0, duration: 0.7, stagger: 0.08 })
          .from('.hero__title-line--small', { y: 15, opacity: 0, duration: 0.6 }, '-=0.4')
          .from('.hero__title-name', { y: 60, opacity: 0, duration: 1, stagger: 0.15 }, '-=0.3')
          .from('.hero__title-line--sub', { y: 15, opacity: 0, duration: 0.6 }, '-=0.5')
          .from('.hero__lead', { y: 20, opacity: 0, duration: 0.7 }, '-=0.4')
          .from('.hero__actions .btn', { y: 20, opacity: 0, duration: 0.6, stagger: 0.1 }, '-=0.4')
          .from('.hero__portrait', { y: 40, opacity: 0, duration: 1 }, '-=1.2')
          .from('.hero__bottom', { opacity: 0, duration: 0.8 }, '-=0.5');
      });
    }

    return { init };
  })();

  /* ============================================================
     8. FORMULÁRIO — envio via WhatsApp
     ============================================================ */
  const SignalForm = (() => {
    const WHATSAPP_NUMBER = '5515998082855';

    function init() {
      const form = document.getElementById('formSignal');
      const feedback = document.getElementById('signalFeedback');
      const success = document.getElementById('signalSuccess');
      const successClose = document.getElementById('signalSuccessClose');
      const btnText = document.getElementById('btnSignalText');

      const upload = document.getElementById('formUpload');
      const input  = document.getElementById('arquivo');
      const nameEl = document.getElementById('formUploadName');

      if (!form) return;

      upload?.addEventListener('click', () => input.click());
      input?.addEventListener('change', () => {
        if (input.files.length > 0) nameEl.textContent = '◈ ' + input.files[0].name;
      });
      upload?.addEventListener('dragover', (e) => {
        e.preventDefault();
        upload.classList.add('is-drag');
      });
      upload?.addEventListener('dragleave', () => upload.classList.remove('is-drag'));
      upload?.addEventListener('drop', (e) => {
        e.preventDefault();
        upload.classList.remove('is-drag');
        if (e.dataTransfer.files.length > 0) {
          input.files = e.dataTransfer.files;
          nameEl.textContent = '◈ ' + e.dataTransfer.files[0].name;
        }
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const nome        = form.querySelector('#nome').value.trim();
        const email       = form.querySelector('#email').value.trim();
        const instagram   = form.querySelector('#instagram').value.trim();
        const tipo        = form.querySelector('#tipoContato').value;
        const empresa     = form.querySelector('#empresa').value.trim();
        const orcamento   = form.querySelector('#orcamento').value;
        const referencias = form.querySelector('#referencias').value.trim();
        const mensagem    = form.querySelector('#mensagem').value.trim();
        const arquivo     = input.files.length > 0 ? input.files[0].name : '';

        if (!nome || !email || !tipo || !mensagem) {
          feedback.textContent = 'PREENCHA OS CAMPOS OBRIGATÓRIOS (*)';
          feedback.classList.add('is-error');
          return;
        }
        feedback.textContent = '';
        feedback.classList.remove('is-error');

        const linhas = [
          '╔══════════════════════════════╗',
          '   ARQUIVO 2B · NOVO SINAL',
          '╚══════════════════════════════╝',
          '',
          `◈ Nome: ${nome}`,
          `◈ E-mail: ${email}`,
          instagram   ? `◈ Instagram/Site: ${instagram}` : '',
          `◈ Tipo de contato: ${tipo}`,
          empresa     ? `◈ Empresa/Projeto: ${empresa}` : '',
          orcamento   ? `◈ Orçamento: ${orcamento}` : '',
          referencias ? `◈ Referências: ${referencias}` : '',
          arquivo     ? `◈ Arquivo anexado: ${arquivo}` : '',
          '',
          '─────── MENSAGEM ───────',
          '',
          mensagem,
          '',
          '─────────────────────────',
          'Enviado via portfólio · Archive 2B',
          new Date().toLocaleString('pt-BR')
        ];

        const texto = linhas.filter(l => l !== '').join('\n');
        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`;

        window.open(url, '_blank', 'noopener');

        form.classList.add('is-sent');
        setTimeout(() => {
          success.classList.add('is-open');
          success.setAttribute('aria-hidden', 'false');
        }, 300);

        if (btnText) btnText.textContent = 'ABRINDO WHATSAPP...';
      });

      successClose?.addEventListener('click', () => {
        success.classList.remove('is-open');
        success.setAttribute('aria-hidden', 'true');
        form.classList.remove('is-sent');
        if (btnText) btnText.textContent = 'ENVIAR VIA WHATSAPP';
      });
    }

    return { init };
  })();

  /* ============================================================
     9. MAIN
     ============================================================ */
  function main() {
    const year = document.getElementById('footerYear');
    if (year) year.textContent = new Date().getFullYear();

    Loader.init();
    ThreeScene.init();
    Dust2D.init();
    Cursor.init();
    Navigation.init();
    Skills.init();
    MemoryFragments.init();
    Animations.init();
    SignalForm.init();

    setTimeout(() => {
      document.body.classList.remove('is-loading');
      document.documentElement.style.overflow = '';
    }, 8000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }

})();