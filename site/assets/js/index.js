document.addEventListener("DOMContentLoaded", () => {
  // --- 1. Animation des compteurs ---
  const counters = document.querySelectorAll('.counter');
  
  function animateCount(el, target, isPercent = false) {
    let count = 0;
    const duration = 2000;
    const steps = 80;
    const increment = target / steps;
    const interval = duration / steps;

    const update = () => {
      count += increment;
      if (count >= target) {
        el.textContent = isPercent ? target + '%' : target.toLocaleString('fr-FR');
      } else {
        el.textContent = isPercent
          ? Math.floor(count) + '%'
          : Math.floor(count).toLocaleString('fr-FR');
        setTimeout(update, interval);
      }
    };
    update();
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.classList.contains('started')) {
        entry.target.classList.add('started');
        const target = parseInt(entry.target.dataset.target, 10);
        const isPercent = entry.target.textContent.includes('%');
        animateCount(entry.target, target, isPercent);
      }
    });
  }, { threshold: 0.8 });

  counters.forEach(counter => observer.observe(counter));

  // --- 2. Animation du carrousel de partenaires ---
  const track = document.querySelector('.carousel-track');
  const nextBtn = document.querySelector('.carousel-btn.next');
  const prevBtn = document.querySelector('.carousel-btn.prev');
  
  if (track) {
    track.innerHTML += track.innerHTML; // Duplique le contenu pour effet infini
    let x = 0;
    let speed = 0.7;

    function animateCarousel() {
      x -= speed;
      if (Math.abs(x) >= track.scrollWidth / 2) x = 0;
      track.style.transform = `translateX(${x}px)`;
      requestAnimationFrame(animateCarousel);
    }

    animateCarousel();

    if(nextBtn) nextBtn.addEventListener("click", () => x -= 200);
    if(prevBtn) prevBtn.addEventListener("click", () => x += 200);
  }
});
