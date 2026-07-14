const correctAnswers = {
      q1: "b",
      q2: "b",
      q3: "a",
      q4: "b",
      q5: "a",
      q6: "b",
      q7: "b",
    };

    const explanations = {
      q1: "On peut consommer un yaourt jusqu'à 3 jours après la DDM s'il a été bien conservé au frais, car la date est indicative et ne signifie pas danger immédiat.",
      q2: "Une banane noire est en réalité très mûre, sucrée et parfaite pour les smoothies ou les gâteaux, elle n’est pas toxique.",
      q3: "La DDM signifie Date de Durabilité Minimale : le produit peut être consommé après cette date sans risque, mais certaines qualités peuvent diminuer.",
      q4: "Le pain dur peut être recyclé en chapelure ou utilisé pour faire du pain perdu, évitant ainsi le gaspillage.",
      q5: "En France, environ 10 millions de tonnes de nourriture sont gaspillées chaque année, un enjeu majeur pour l'environnement et la société.",
      q6: "Congeler un yaourt modifie sa texture et son goût, il n’est donc pas conseillé si on souhaite conserver la qualité originale.",
      q7: "Les fruits trop mûrs sont parfaits pour faire des compotes, confitures ou smoothies, c’est une excellente manière de les consommer sans gaspiller.",
    };

    const form = document.getElementById('quizForm');
    const resultDiv = document.getElementById('result');

    form.addEventListener('submit', function(event) {
      event.preventDefault();

      let score = 0;
      let total = Object.keys(correctAnswers).length;
      let userAnswers = new FormData(form);
      let feedback = '';

      for (const [q, correct] of Object.entries(correctAnswers)) {
        const userAnswer = userAnswers.get(q);
        if (userAnswer === correct) {
          score++;
        }
        feedback += `<p><strong>Question ${q.slice(1)}:</strong> ${userAnswer === correct ? '✅ Bonne réponse' : '❌ Mauvaise réponse'}</p>`;
        feedback += `<p class="explanation">${explanations[q]}</p>`;
      }

      feedback = `<h2>Votre score : ${score} / ${total}</h2>` + feedback;

      if (score === total) {
        feedback = '<h2>Excellent ! Vous maîtrisez parfaitement l\'anti-gaspillage alimentaire 🥳</h2>' + feedback;
      } else if (score >= total * 0.7) {
        feedback = '<h2>Bravo ! Vous avez de bonnes connaissances sur le sujet 👍</h2>' + feedback;
      } else {
        feedback = '<h2>Merci pour votre participation. N’hésitez pas à relire les explications pour mieux connaître les gestes anti-gaspillage !</h2>' + feedback;
      }

      resultDiv.innerHTML = feedback;
      resultDiv.style.display = 'block';
      window.scrollTo({ top: resultDiv.offsetTop, behavior: 'smooth' });
    });