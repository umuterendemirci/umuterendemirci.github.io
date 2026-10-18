// Umut Eren Demirci · portfolio: game cards, the screenshot viewer and the design-summary contents.
(() => {
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---------- game cards: hover (or the first tap) turns the card and plays its clip ----------
  const cards = [...document.querySelectorAll('.gcard')];
  const play = card => {
    const v = card.querySelector('video');
    if (!v) return;
    if (!v.src && v.dataset.src) v.src = v.dataset.src;
    v.currentTime = 0;
    const p = v.play();
    if (p) p.catch(() => {});
  };
  const stop = card => {
    const v = card.querySelector('video');
    if (v && !v.paused) v.pause();
  };
  cards.forEach(card => {
    if (canHover) {
      card.addEventListener('mouseenter', () => play(card));
      card.addEventListener('mouseleave', () => stop(card));
    }
    card.addEventListener('focus', () => { if (canHover) play(card); });
    card.addEventListener('blur', () => { if (canHover) stop(card); });
    card.addEventListener('click', e => {
      if (canHover || card.classList.contains('flipped')) return;   // second tap: follow the link
      e.preventDefault();
      cards.forEach(c => { if (c !== card && c.classList.contains('flipped')) { c.classList.remove('flipped'); stop(c); } });
      card.classList.add('flipped');
      play(card);
    });
  });
  // a tap outside the cards turns them back
  document.addEventListener('click', e => {
    if (canHover || e.target.closest('.gcard')) return;
    cards.forEach(c => { c.classList.remove('flipped'); stop(c); });
  });

  // ---------- the game page's clip: plays while on screen ----------
  const heroClip = document.querySelector('.ghero video');
  if (heroClip && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { const p = heroClip.play(); if (p) p.catch(() => {}); } else heroClip.pause();
    }, { threshold: .25 }).observe(heroClip);
  }

  // ---------- design summary contents: highlight the section on screen ----------
  const links = [...document.querySelectorAll('.toc a')];
  if (links.length && 'IntersectionObserver' in window) {
    const byId = new Map(links.map(a => [a.hash.slice(1), a]));
    const seen = new Set();
    const watch = new IntersectionObserver(entries => {
      entries.forEach(e => e.isIntersecting ? seen.add(e.target.id) : seen.delete(e.target.id));
      const first = [...byId.keys()].find(id => seen.has(id));
      if (first) links.forEach(a => a.classList.toggle('on', a === byId.get(first)));
    }, { rootMargin: '-80px 0px -55% 0px' });
    byId.forEach((a, id) => { const el = document.getElementById(id); if (el) watch.observe(el); });
  }

  // ---------- screenshot viewer ----------
  const shots = [...document.querySelectorAll('.gallery img')];
  const lb = document.getElementById('lb');
  if (!shots.length || !lb) return;
  const big = lb.querySelector('img'), cap = lb.querySelector('p');
  let i = 0, x0 = null;
  const show = n => {
    i = (n + shots.length) % shots.length;
    big.src = shots[i].src; big.alt = cap.textContent = shots[i].alt;
    big.classList.toggle('px', shots[i].closest('.gallery').classList.contains('wide'));
  };
  const open = n => { show(n); lb.classList.add('open'); document.body.classList.add('lb-lock'); lb.querySelector('.x').focus(); };
  const close = () => { lb.classList.remove('open'); document.body.classList.remove('lb-lock'); shots[i].focus(); };
  shots.forEach((s, n) => {
    s.tabIndex = 0;
    s.addEventListener('click', () => open(n));
    s.addEventListener('keydown', e => { if (e.key === 'Enter') open(n); });
  });
  lb.querySelector('.x').onclick = close;
  lb.querySelector('.prev').onclick = () => show(i - 1);
  lb.querySelector('.next').onclick = () => show(i + 1);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') show(i - 1); else if (e.key === 'ArrowRight') show(i + 1);
  });
  lb.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1));
  });
})();

// Analytics: when GoatCounter is on the page, count document downloads and outbound clicks as events
// ("pdf/<file>", "itch/<game>", "linkedin", "email"). Without it, nothing happens.
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a || !window.goatcounter || !window.goatcounter.count) return;
  const href = a.getAttribute('href');
  let path = null;
  if (/\.pdf$/i.test(href)) path = 'pdf/' + href.split('/').pop();
  else if (href.includes('itch.io')) path = 'itch/' + href.replace(/\/+$/, '').split('/').pop();
  else if (href.includes('linkedin.com')) path = 'linkedin';
  else if (href.startsWith('mailto:')) path = 'email';
  if (path) window.goatcounter.count({ path: path, title: document.documentElement.lang, event: true });
});
