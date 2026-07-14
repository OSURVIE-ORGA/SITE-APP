const quizForm = document.getElementById('quiz-form');
    const quizResult = document.getElementById('quiz-result');
    const correctAnswersDiv = document.getElementById('correct-answers');

    const answers = {
      q1: 'b',
      q2: 'a',
      q3: 'b',
      q4: 'b',
      q5: 'a',
      q6: 'b',
      q7: 'b'
    };

    quizForm.addEventListener('submit', function(event) {
      event.preventDefault();

      let score = 0;
      const formData = new FormData(quizForm);

      for (let [question, userAnswer] of formData.entries()) {
        if (answers[question] === userAnswer) {
          score++;
        }
      }

      const total = Object.keys(answers).length;
      quizResult.textContent = `Vous avez obtenu ${score} / ${total} bonnes réponses !`;

      correctAnswersDiv.style.display = 'block';
      // Optionnel : scroll vers les bonnes réponses
      correctAnswersDiv.scrollIntoView({ behavior: 'smooth' });
    });