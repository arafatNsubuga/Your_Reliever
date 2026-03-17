document.addEventListener('DOMContentLoaded', () => {
  const circle = document.querySelector('.breathing-circle');
  const instruction = document.querySelector('.breathing-instruction');
  const btnStart = document.getElementById('breath-start');
  const btnStop = document.getElementById('breath-stop');

  // FAQ toggle
  document.querySelectorAll('.faq-question').forEach((btn) => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      const targetId = btn.getAttribute('aria-controls');
      const answer = document.getElementById(targetId);
      btn.setAttribute('aria-expanded', String(!expanded));
      if (answer) {
        if (expanded) {
          answer.hidden = true;
        } else {
          answer.hidden = false;
        }
      }
    });
  });

  // Reviews carousel
  const track = document.querySelector('.reviews-track');
  const viewport = document.querySelector('.reviews-viewport');
  const prevBtn = document.querySelector('.reviews-prev');
  const nextBtn = document.querySelector('.reviews-next');
  if (!track || !viewport || !prevBtn || !nextBtn) return;

  const cards = Array.from(track.querySelectorAll('.review-card'));
  let index = 0;

  const getStep = () => {
    if (cards.length === 0) return 0;
    const card = cards[0];
    const style = window.getComputedStyle(track);
    const gap = parseFloat(style.columnGap || style.gap || '16');
    return card.getBoundingClientRect().width + gap;
  };

  const update = () => {
    const step = getStep();
    const maxIndex = Math.max(0, cards.length - Math.floor(viewport.clientWidth / (step || 1)));
    if (index > maxIndex) index = maxIndex;
    track.style.transform = `translateX(${-index * step}px)`;
  };

  prevBtn.addEventListener('click', () => {
    index = Math.max(0, index - 1);
    update();
  });

  nextBtn.addEventListener('click', () => {
    index = Math.min(cards.length - 1, index + 1);
    update();
  });

  window.addEventListener('resize', update);
  update();

  if (!circle || !instruction || !btnStart || !btnStop) return;

  let running = false;
  let cyclePromise = null;

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const setPhase = (label, scale, seconds) => {
    instruction.textContent = label;
    circle.style.transition = `transform ${seconds}s ease-in-out`;
    circle.style.transform = `scale(${scale})`;
    return wait(seconds * 1000);
  };

  const run = async () => {
    while (running) {
      await setPhase('Inhale', 1.25, 4);
      if (!running) break;
      await setPhase('Hold', 1.25, 2);
      if (!running) break;
      await setPhase('Exhale', 0.85, 6);
      if (!running) break;
      await wait(500);
    }
  };

  const start = () => {
    if (running) return;
    running = true;
    btnStart.disabled = true;
    instruction.textContent = 'Get ready...';
    circle.style.transition = 'transform 300ms ease';
    circle.style.transform = 'scale(1)';
    cyclePromise = run().finally(() => {
      btnStart.disabled = false;
    });
  };

  const stop = () => {
    running = false;
    instruction.textContent = 'Press Start';
    circle.style.transition = 'transform 300ms ease';
    circle.style.transform = 'scale(1)';
  };

  btnStart.addEventListener('click', start);
  btnStop.addEventListener('click', stop);
});
