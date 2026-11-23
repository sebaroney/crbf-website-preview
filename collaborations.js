document.addEventListener('click', event => {
  const button = event.target.closest('[data-collaboration-direction]');
  if (!button) return;

  const slides = document.getElementById(button.getAttribute('aria-controls'));
  const [first, second] = slides?.children ?? [];
  if (!second) return;

  const stride = second.getBoundingClientRect().left - first.getBoundingClientRect().left;
  const end = slides.scrollWidth - slides.clientWidth;
  const current = slides.scrollLeft;
  const next = button.dataset.collaborationDirection === 'next';
  const position = next
    ? (current >= end - 2 ? 0 : Math.min(end, current + stride))
    : (current <= 2 ? end : Math.max(0, current - stride));
  const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  slides.scrollTo({ left: position, behavior });
});
