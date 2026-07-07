document.addEventListener('DOMContentLoaded', () => {
  // Affichage automatique entre novembre et février avec effet d'apparition
  const mois = new Date().getMonth(); // 0 = janvier, 11 = décembre
  const blocs = [
    document.getElementById('collecte-vetements'),
    document.getElementById('stand-noel')
  ];

  if ([10, 11, 0, 1].includes(mois)) { // novembre à février
    blocs.forEach(bloc => {
      if (bloc) { // sécurité si l'élément existe
        bloc.style.display = 'block';
        setTimeout(() => bloc.classList.add('visible'), 100);
      }
    });
  }
});
