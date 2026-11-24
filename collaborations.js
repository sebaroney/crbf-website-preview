const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let playing = !reducedMotion.matches;
let track;
let duplicate;
let position = 0;
let previousTime = 0;
let resumeAt = 0;
let moving = false;

function setupTrack(slides) {
  track = slides;
  duplicate = undefined;
  position = slides?.scrollLeft ?? 0;
  moving = false;
  if (!slides || slides.children.length < 2) return;

  let copies = [...slides.querySelectorAll('[data-collaboration-copy]')];
  if (!copies.length) {
    copies = [...slides.children].map(card => {
      const copy = card.cloneNode(true);
      copy.setAttribute('data-collaboration-copy', '');
      copy.setAttribute('aria-hidden', 'true');
      copy.querySelectorAll('a').forEach(link => { link.tabIndex = -1; });
      return copy;
    });
    slides.append(...copies);
  }
  duplicate = copies[0];
}

function loopWidth() {
  return duplicate.getBoundingClientRect().left -
    track.firstElementChild.getBoundingClientRect().left;
}

function animatePartners(time) {
  requestAnimationFrame(animatePartners);
  const elapsed = Math.min(time - previousTime, 50);
  previousTime = time;

  const slides = document.getElementById('collaboration-slides');
  if (slides !== track) setupTrack(slides);
  const button = document.querySelector('[data-collaboration-playback]');
  const label = playing ? 'Pause' : 'Play';
  if (button && button.textContent !== label) button.textContent = label;
  if (!duplicate) return;

  const bounds = track.getBoundingClientRect();
  const inView = bounds.bottom > 0 && bounds.top < innerHeight;
  const focused = track.contains(document.activeElement) &&
    document.activeElement.matches(':focus-visible');
  const shouldMove = playing && inView && !document.hidden && !focused && time >= resumeAt;

  if (shouldMove !== moving) {
    moving = shouldMove;
    position = track.scrollLeft;
    track.style.scrollSnapType = moving ? 'none' : '';
  }
  if (!moving) return;

  const width = loopWidth();
  if (width > 0) {
    position = (position + elapsed * .042) % width;
    track.scrollTo({ left: position, behavior: 'instant' });
  }
}

document.addEventListener('pointerdown', event => {
  if (event.target.closest('#collaboration-slides')) resumeAt = performance.now() + 5000;
}, { passive: true });

document.addEventListener('wheel', event => {
  if (event.deltaX && event.target.closest('#collaboration-slides')) {
    resumeAt = performance.now() + 5000;
  }
}, { passive: true });

document.addEventListener('click', event => {
  const button = event.target.closest('[data-collaboration-direction], [data-collaboration-playback]');
  if (!button || !duplicate) return;

  if (button.hasAttribute('data-collaboration-playback')) {
    playing = !playing;
    resumeAt = 0;
    return;
  }

  resumeAt = performance.now() + 2500;
  moving = false;
  track.style.scrollSnapType = '';
  const width = loopWidth();
  const [first, second] = track.children;
  const stride = second.getBoundingClientRect().left - first.getBoundingClientRect().left;
  if (width <= 0 || stride <= 0) return;
  const count = Math.round(width / stride);
  const index = Math.round((track.scrollLeft % width) / stride);
  const delta = button.dataset.collaborationDirection === 'next' ? 1 : -1;
  const next = (index + delta + count) % count;
  track.scrollTo({ left: next * stride, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
});

reducedMotion.addEventListener('change', event => {
  if (event.matches) playing = false;
});

if (document.readyState === 'complete') {
  requestAnimationFrame(animatePartners);
} else {
  window.addEventListener('load', () => requestAnimationFrame(animatePartners), { once: true });
}
