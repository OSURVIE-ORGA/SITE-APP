const quizForm = document.getElementById('quizForm');
    const resultsDiv = document.getElementById('results');
    const encouragementDiv = document.getElementById('encouragement');

    quizForm.addEventListener('submit', function(event) {
      event.preventDefault();

      const formData = new FormData(quizForm);
      const answers = {
        q1: formData.get('q1'),
        q2: formData.get('q2'),
        q3: formData.get('q3'),
        q4: formData.get('q4'),
        q5: formData.get('q5'),
        q6: formData.get('q6'),
        q7: formData.get('q7')
      };

      let score = 0;
      if (answers.q1 === 'correct') score++;
      if (answers.q2 === 'correct') score++;
      if (answers.q3 === 'correct') score++;
      if (answers.q4 === 'correct') score++;
      if (answers.q5 === 'correct') score++;
      if (answers.q6 === 'correct') score++;

      const correctAnswersText = `
        <h2>Voici les bonnes réponses :</h2>
        <p><strong>1.</strong> Contacter rapidement la caisse concernée pour comprendre et faire un recours si besoin.</p>
        <p><strong>2.</strong> Un médiateur numérique ou un professionnel habilité dans une Maison France Services peut vous aider.</p>
        <p><strong>3.</strong> Oui, la confidentialité est respectée quand un professionnel habilité vous aide.</p>
        <p><strong>4.</strong> On trouve une aide gratuite dans les Maisons France Services ou associations locales.</p>
        <p><strong>5.</strong> Un médiateur numérique aide à faire les démarches en ligne.</p>
        <p><strong>6.</strong> Demander de l’aide si on ne comprend pas un courrier administratif.</p>
        <p><strong>7.</strong> Connaître les aides près de chez soi est important pour bien faire ses démarches.</p>
      `;

      resultsDiv.innerHTML = `
        <p>Vous avez obtenu <strong>${score} / 6</strong> pour les questions à choix simples.</p>
        ${correctAnswersText}
      `;
      resultsDiv.style.display = 'block';
      encouragementDiv.style.display = 'block';

      resultsDiv.scrollIntoView({behavior: "smooth"});
    });