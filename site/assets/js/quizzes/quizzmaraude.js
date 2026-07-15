const quizData = [
      {
        question: "1. Quel est le premier besoin essentiel d'une personne sans-abri en maraude ?",
        answers: [
          "Un hébergement ou un abri sécurisé",
          "Un emploi stable",
          "Un smartphone",
          "Un diplôme"
        ],
        correctIndex: 0,
        explanation: "L'accès à un lieu sûr et protégé est le besoin le plus urgent pour une personne à la rue."
      },
      {
        question: "2. Pourquoi est-il important de respecter la dignité des personnes rencontrées en maraude ?",
        answers: [
          "Pour éviter les conflits",
          "Parce qu’elles ont besoin de se sentir écoutées et respectées",
          "Pour qu’elles donnent plus facilement de l'argent",
          "Parce que la loi l’oblige"
        ],
        correctIndex: 1,
        explanation: "Le respect et l’écoute permettent de créer un lien de confiance essentiel."
      },
      {
        question: "3. Quelle action simple peut-on faire en maraude pour aider les personnes à la rue ?",
        answers: [
          "Distribuer des repas ou des boissons chaudes",
          "Offrir des billets de loterie",
          "Les convaincre d'aller en prison",
          "Les obliger à venir dans un centre"
        ],
        correctIndex: 0,
        explanation: "Offrir un repas chaud ou une boisson est un geste concret et réconfortant."
      },
      {
        question: "4. Lors d’une maraude, quelle attitude est recommandée envers les personnes rencontrées ?",
        answers: [
          "Être patient et bienveillant",
          "Être pressé pour finir vite",
          "Poser des questions indiscrètes",
          "Ignorer leurs demandes"
        ],
        correctIndex: 0,
        explanation: "La patience et la bienveillance sont essentielles pour créer un contact humain sincère."
      },
      {
        question: "5. Quel est l’objectif principal d’une maraude ?",
        answers: [
          "Informer les autorités",
          "Distribuer de l’argent",
          "Offrir un soutien matériel et un lien humain",
          "Faire de la publicité pour l’association"
        ],
        correctIndex: 2,
        explanation: "La maraude vise à apporter aide matérielle et soutien moral aux personnes en difficulté."
      },
      {
        question: "6. Pourquoi les maraudes sont-elles souvent organisées la nuit ou en hiver ?",
        answers: [
          "Parce que c’est plus facile pour les bénévoles",
          "Parce que c’est à ces moments que les personnes sans-abri sont les plus vulnérables",
          "Pour éviter les passants",
          "Pour distribuer des repas chauds uniquement"
        ],
        correctIndex: 1,
        explanation: "Les températures froides et la nuit augmentent les risques pour les personnes sans-abri."
      },
      {
        question: "7. Quel type d’aide ne doit pas être imposé lors d’une maraude ?",
        answers: [
          "Offrir une couverture ou des vêtements chauds",
          "Obliger une personne à accepter un hébergement ou un traitement",
          "Distribuer de la nourriture",
          "Écouter la personne sans jugement"
        ],
        correctIndex: 1,
        explanation: "Le respect du choix et du consentement des personnes est fondamental."
      }
    ];

    const container = document.getElementById('quiz-container');
    let currentQuestionIndex = 0;
    let score = 0;

    function renderQuestion() {
      const q = quizData[currentQuestionIndex];
      container.innerHTML = `
        <div class="question">${q.question}</div>
        <ul class="answers">
          ${q.answers.map((answer, i) => `
            <li>
              <label>
                <input type="radio" name="answer" value="${i}">
                ${answer}
              </label>
            </li>
          `).join('')}
        </ul>
        <button id="validate-btn">Valider</button>
        <div id="feedback" class="feedback" style="display:none;"></div>
        <div id="explanation" class="explanation" style="display:none;"></div>
      `;

      document.getElementById('validate-btn').addEventListener('click', validateAnswer);
    }

    function validateAnswer() {
      const selectedOption = document.querySelector('input[name="answer"]:checked');
      if (!selectedOption) {
        alert("Veuillez sélectionner une réponse avant de valider.");
        return;
      }

      const answerValue = parseInt(selectedOption.value);
      const q = quizData[currentQuestionIndex];
      const feedbackEl = document.getElementById('feedback');
      const explanationEl = document.getElementById('explanation');
      const validateBtn = document.getElementById('validate-btn');

      if (answerValue === q.correctIndex) {
        feedbackEl.textContent = "Bonne réponse ! 🎉";
        feedbackEl.className = "feedback correct";
        score++;
      } else {
        feedbackEl.textContent = "Mauvaise réponse. ❌";
        feedbackEl.className = "feedback incorrect";
      }

      explanationEl.textContent = q.explanation;
      feedbackEl.style.display = "block";
      explanationEl.style.display = "block";

      // Désactiver radios et bouton valider
      document.querySelectorAll('input[name="answer"]').forEach(input => input.disabled = true);
      validateBtn.disabled = true;

      // Ajouter bouton suivant ou résultat
      const nextBtn = document.createElement('button');
      nextBtn.style.marginTop = '15px';
      nextBtn.textContent = (currentQuestionIndex < quizData.length - 1) ? 'Question suivante' : 'Voir le score';
      nextBtn.addEventListener('click', () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < quizData.length) {
          renderQuestion();
        } else {
          showScore();
        }
      });
      container.appendChild(nextBtn);
    }

    function showScore() {
      container.innerHTML = `
        <div class="score">Votre score : ${score} / ${quizData.length}</div>
        <button class="restart-btn">Recommencer le quiz</button>
      `;

      document.querySelector('.restart-btn').addEventListener('click', () => {
        currentQuestionIndex = 0;
        score = 0;
        renderQuestion();
      });
    }

    // Démarrage du quiz
    renderQuestion();