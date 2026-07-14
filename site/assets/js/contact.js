document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const confirmation = document.getElementById('confirmationMessage');

  if (!form || !confirmation) return;

  form.addEventListener('submit', function(event) {
    event.preventDefault(); // Bloquer le comportement par défaut

    const formData = new FormData(form);

    fetch(form.action, {
      method: form.method,
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    }).then(response => {
      if (response.ok) {
        form.style.display = 'none';  // Cacher le formulaire
        confirmation.style.display = 'block'; // Afficher le message de confirmation
      } else {
        response.json().then(data => {
          if (data.errors) {
            alert(data.errors.map(error => error.message).join(", "));
          } else {
            alert("Une erreur est survenue lors de l'envoi.");
          }
        });
      }
    }).catch(error => {
      alert("Erreur réseau, veuillez réessayer plus tard.");
    });
  });
});
