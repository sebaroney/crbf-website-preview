const partnerReducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let partnerAutoplay = !partnerReducedMotion.matches;

function movePartnerCarousel(slides, forward) {
  const [first, second] = slides.children;
  if (!second) return;

  const start = first.offsetLeft - slides.offsetLeft;
  const stride = second.offsetLeft - first.offsetLeft;
  const end = slides.scrollWidth - slides.clientWidth;
  const current = slides.scrollLeft;
  const position = forward
    ? (current >= end - 2 ? 0 : Math.min(end, current + stride))
    : (current <= start + 2 ? end : Math.max(0, current - stride));
  slides.scrollTo({ left: position, behavior: partnerReducedMotion.matches ? 'auto' : 'smooth' });
}

function syncPartnerPlayback() {
  const button = document.querySelector('[data-collaboration-playback]');
  const label = partnerAutoplay ? 'Pause' : 'Play';
  if (button && button.textContent !== label) button.textContent = label;
}

document.addEventListener('click', event => {
  const button = event.target.closest('[data-collaboration-direction], [data-collaboration-playback]');
  if (!button) return;
  const slides = document.getElementById(button.getAttribute('aria-controls'));
  if (!slides) return;

  if (button.hasAttribute('data-collaboration-playback')) {
    partnerAutoplay = !partnerAutoplay;
    syncPartnerPlayback();
    if (partnerAutoplay) movePartnerCarousel(slides, true);
  } else {
    movePartnerCarousel(slides, button.dataset.collaborationDirection === 'next');
  }
});

partnerReducedMotion.addEventListener('change', event => {
  if (event.matches) partnerAutoplay = false;
  syncPartnerPlayback();
});

setInterval(() => {
  syncPartnerPlayback();
  const slides = document.getElementById('collaboration-slides');
  if (!partnerAutoplay || !slides || document.hidden) return;
  const section = slides.closest('.collaboration-section');
  if (section?.matches(':hover, :focus-within')) return;
  const bounds = slides.getBoundingClientRect();
  if (bounds.bottom > 0 && bounds.top < innerHeight) movePartnerCarousel(slides, true);
}, 4000);
