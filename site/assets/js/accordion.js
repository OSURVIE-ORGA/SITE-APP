document.addEventListener('DOMContentLoaded', () => {
  // Accordéon : une seule section ouverte à la fois (style e-commerce)
  document.querySelectorAll('.accordion-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.accordion-item');
      if (!item) return;
      
      const wasOpen = item.classList.contains('is-open');

      // Ferme toutes les sections
      document.querySelectorAll('.accordion-item').forEach(i => {
        i.classList.remove('is-open');
        const b = i.querySelector('.accordion-button');
        if (b) b.setAttribute('aria-expanded', 'false');
      });

      // Ré-ouvre celle cliquée si elle était fermée
      if (!wasOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
});
