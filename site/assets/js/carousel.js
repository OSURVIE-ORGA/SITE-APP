document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector('.carousel-container');
  if (!container) return;

  const slides = container.querySelectorAll('.carousel-slide');
  const carousel = document.getElementById('carousel');
  const captionEl = document.getElementById('caption');
  
  if (!slides.length || !carousel) return;

  const prevBtn = container.querySelector('.carousel-btn.prev');
  const nextBtn = container.querySelector('.carousel-btn.next');

  let currentIndex = 0;

  // Extraire les légendes depuis l'attribut "alt" des images (DRY)
  const captionsList = Array.from(slides).map(slide => {
    const img = slide.querySelector('img');
    return img && img.hasAttribute('alt') ? img.getAttribute('alt') : "";
  });

  function updateCarousel() {
    carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
    if (captionEl) {
      captionEl.textContent = captionsList[currentIndex] || "";
    }
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % slides.length;
    updateCarousel();
  }

  function prevSlide() {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    updateCarousel();
  }

  if (nextBtn) nextBtn.addEventListener('click', nextSlide);
  if (prevBtn) prevBtn.addEventListener('click', prevSlide);

  let autoSlide = setInterval(nextSlide, 6000);
  
  container.addEventListener('mouseenter', () => clearInterval(autoSlide));
  container.addEventListener('mouseleave', () => autoSlide = setInterval(nextSlide, 6000));

  updateCarousel();
});
