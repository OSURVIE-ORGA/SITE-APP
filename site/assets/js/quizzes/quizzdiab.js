const form = document.getElementById('quizForm');
  const resultDiv = document.getElementById('result');

  form.addEventListener('submit', function(event) {
    event.preventDefault();

    let score = 0;
    const formData = new FormData(form);
    for (let value of formData.values()) {
      score += parseInt(value);
    }

    let message = '';
    if(score >= 14) {
      message = `
      <h3>Bravo ! Vous avez déjà de très bonnes habitudes.</h3>
      <p>Continuez ainsi pour préserver votre santé et prévenir le diabète. Nos ateliers culinaires vous permettront d’approfondir vos connaissances et d’explorer de nouvelles recettes saines et savoureuses, adaptées à vos besoins.</p>
      <p>Nous organisons également des sorties conviviales pour encourager l’activité physique et le bien-être.</p>
      <p><strong>Rejoignez-nous pour partager ces moments de convivialité et de santé !</strong></p>
      `;
    } else if(score >= 9) {
      message = `
      <h3>Vous êtes sur la bonne voie !</h3>
      <p>Quelques ajustements peuvent vous aider à améliorer votre alimentation et votre bien-être.</p>
      <ul>
        <li>Augmentez la consommation de fruits, légumes et légumineuses.</li>
        <li>Limitez les boissons sucrées et les aliments trop gras.</li>
        <li>Privilégiez une cuisson douce des aliments.</li>
        <li>Intégrez une activité physique régulière et des moments de détente.</li>
        <li>Lisez les étiquettes pour mieux choisir vos aliments.</li>
      </ul>
      <p>Nos ateliers culinaires et nos sorties vous accompagnent pour adopter ces bonnes pratiques avec plaisir et simplicité.</p>
      <p><strong>Nous serions ravis de vous accueillir !</strong></p>
      `;
    } else {
      message = `
      <h3>Il y a des points importants à améliorer pour votre santé.</h3>
      <p>Voici quelques conseils pour commencer :</p>
      <ul>
        <li>Consommez plus de fruits, légumes frais et légumineuses.</li>
        <li>Évitez les boissons sucrées et les aliments trop gras ou frits.</li>
        <li>Favorisez les cuissons douces comme la vapeur ou le grill léger.</li>
        <li>Essayez d’intégrer une activité physique régulière, même une simple marche quotidienne.</li>
        <li>Prenez le temps de vous détendre et de gérer le stress.</li>
      </ul>
      <p>Nos ateliers culinaires sont spécialement conçus pour vous apprendre à cuisiner sainement et facilement.</p>
      <p>Nous organisons aussi des sorties pour bouger ensemble dans la bonne humeur.</p>
      <p><strong>N’hésitez pas à nous rejoindre, chaque petit pas compte !</strong></p>
      `;
    }

    resultDiv.innerHTML = message;
    resultDiv.style.display = 'block';
    resultDiv.focus();
  });