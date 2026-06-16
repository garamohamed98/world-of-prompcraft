const FEATURES = [
  {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
    title: 'AI-Powered NPCs',
    desc: 'Every character has a real brain. Talk, trade, flirt, threaten, befriend \u2014 they remember everything and react in character.',
  },
  {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
    title: 'Creative Combat',
    desc: 'Describe your attack. The more vivid and imaginative, the more damage you deal. Physical, fire, ice, lightning, holy, dark \u2014 your words choose your element.',
  },
  {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3v18M3 12h18"/></svg>`,
    title: 'Build by Typing',
    desc: '"\u201CPlace a stone bridge across this river.\u201D" The World Spirit agent makes it real. Build towers, walls, houses \u2014 all by describing them.',
  },
  {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>`,
    title: 'Create NPCs',
    desc: '"\u201CMake a grumpy dwarf blacksmith named Ironhide who hates magic.\u201D" The Architect agent brings your character to life with full AI personality.',
  },
  {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>`,
    title: 'Infinite Living World',
    desc: 'Seven distinct biomes across an infinite procedural world. From the Crystal Tundra to the Blasted Suarezlands, anchored by hand-crafted landmarks.',
  },
  {
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
    title: 'Multiplayer',
    desc: 'Explore with friends. See each other in the world, chat, and interact with the same NPCs. No download, no install \u2014 just open your browser.',
  },
];

const INTERVAL = 4500;
const TRANSITION = 600;

export function createFeaturesShowcase(container) {
  container.innerHTML = `
    <div class="showcase-stage">
      <div class="showcase-icon" id="showcaseIcon"></div>
      <h3 class="showcase-title" id="showcaseTitle"></h3>
      <p class="showcase-desc" id="showcaseDesc"></p>
    </div>
    <div class="showcase-dots" id="showcaseDots"></div>
  `;

  const iconEl = document.getElementById('showcaseIcon');
  const titleEl = document.getElementById('showcaseTitle');
  const descEl = document.getElementById('showcaseDesc');
  const dotsEl = document.getElementById('showcaseDots');

  FEATURES.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'showcase-dot';
    dot.setAttribute('aria-label', `Feature ${i + 1}`);
    dot.dataset.index = i;
    dot.addEventListener('click', () => goTo(i));
    dotsEl.appendChild(dot);
  });

  let current = 0;
  let next = 1;
  let timer = null;
  let transitioning = false;

  function goTo(index) {
    if (transitioning || index === current) return;
    next = index;
    clearTimeout(timer);
    transition();
  }

  function transition() {
    transitioning = true;
    const feat = FEATURES[next];

    iconEl.style.opacity = '0';
    iconEl.style.transform = 'translateY(20px) scale(0.5)';
    titleEl.style.opacity = '0';
    titleEl.style.transform = 'translateY(20px)';
    descEl.style.opacity = '0';
    descEl.style.transform = 'translateY(20px)';

    setTimeout(() => {
      iconEl.innerHTML = feat.icon;
      titleEl.textContent = feat.title;
      descEl.textContent = feat.desc;

      iconEl.style.transition = `opacity ${TRANSITION}ms cubic-bezier(0.34, 1.56, 0.64, 1), transform ${TRANSITION}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
      titleEl.style.transition = `opacity ${TRANSITION}ms ease, transform ${TRANSITION}ms ease`;
      descEl.style.transition = `opacity ${TRANSITION}ms ease, transform ${TRANSITION}ms ease`;

      requestAnimationFrame(() => {
        iconEl.style.opacity = '1';
        iconEl.style.transform = 'translateY(0) scale(1)';
        titleEl.style.opacity = '1';
        titleEl.style.transform = 'translateY(0)';
        descEl.style.opacity = '1';
        descEl.style.transform = 'translateY(0)';
      });
    }, 50);

    const dots = dotsEl.querySelectorAll('.showcase-dot');
    dots.forEach((d, i) => d.classList.toggle('active', i === next));

    current = next;
    next = (current + 1) % FEATURES.length;

    setTimeout(() => {
      transitioning = false;
      timer = setTimeout(transition, INTERVAL);
    }, TRANSITION + 100);
  }

  iconEl.innerHTML = FEATURES[0].icon;
  titleEl.textContent = FEATURES[0].title;
  descEl.textContent = FEATURES[0].desc;
  iconEl.style.opacity = '1';
  iconEl.style.transform = 'translateY(0) scale(1)';
  titleEl.style.opacity = '1';
  titleEl.style.transform = 'translateY(0)';
  descEl.style.opacity = '1';
  descEl.style.transform = 'translateY(0)';

  dotsEl.querySelector('.showcase-dot').classList.add('active');
  next = 1;
  timer = setTimeout(transition, INTERVAL);

  return () => {
    clearTimeout(timer);
  };
}
