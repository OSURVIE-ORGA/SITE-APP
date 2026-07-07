# Architecture globale du projet O'SURVIE

Ce document explique de manière simple la structure du projet et la façon dont les différents fichiers fonctionnent ensemble.

## 1. Structure des dossiers

Le projet est organisé de manière logique pour séparer le contenu (HTML), le style (CSS) et le comportement (JavaScript) :

```text
SITE-APP/
├── index.html                 # Page d'accueil principale du site
├── architecture.md            # Ce document explicatif
├── reorganisation_rapport.md  # Résumé des travaux de restructuration
├── assets/                    # Dossier contenant toutes les ressources (images, styles, scripts)
│   ├── css/                   # Feuilles de style pour le design du site
│   ├── js/                    # Scripts JavaScript pour l'interactivité
│   ├── images/                # Photos et illustrations
│   ├── logos/                 # Logos des partenaires
│   └── videos/                # Fichiers vidéo
└── pages/                     # Dossier contenant toutes les autres pages du site
    ├── actions/               # Pages décrivant chaque action (O'Partage, Maraude, etc.)
    ├── legal/                 # Pages légales (CGU, Mentions légales, etc.)
    └── quizzes/               # Pages interactives de quiz
```

## 2. Comment fonctionnent les pages (HTML)

Chaque page du site est un fichier `.html`. 
La particularité de ce projet est que **le menu de navigation (en haut) et le pied de page (en bas) ne sont pas écrits en dur dans chaque fichier HTML**.

À la place, on utilise des "balises vides" (des conteneurs) :
* `<div id="site-nav-mount"></div>` : Indique où la barre de navigation doit apparaître.
* `<div id="site-footer-mount"></div>` : Indique où le pied de page doit apparaître.

## 3. Comment fonctionne le JavaScript (JS)

Les fichiers JavaScript ajoutent de l'interactivité au site.

### Le fichier clé : `components.js`
C'est le chef d'orchestre du site. Il est chargé sur toutes les pages et a deux rôles principaux :
1. Il détecte sur quelle page on se trouve pour calculer les bons chemins vers les liens (ex: `../` ou `../../`).
2. Il injecte automatiquement le code HTML de la navigation et du footer dans les balises vides mentionnées ci-dessus. 
*Avantage : Si on veut ajouter un lien au menu, on ne le modifie qu'une seule fois dans `components.js` !*

### Les autres fichiers JS
Ils sont spécifiques à certaines pages ou fonctionnalités :
* `carousel.js` : Gère le défilement des images sur les pages d'actions.
* `accordion.js` : Permet d'ouvrir/fermer des blocs de texte (FAQ sur la page des dons).
* `contact.js` : S'occupe de l'envoi du formulaire de contact sans recharger la page.
* Les fichiers dans `assets/js/quizzes/` : Gèrent la logique des questions, des points et des résultats pour chaque quiz.

## 4. Comment fonctionne le Design (CSS)

L'apparence du site est gérée par plusieurs fichiers CSS pour éviter d'avoir un seul fichier gigantesque.

### Le fichier principal : `style.css`
Il est chargé sur **toutes** les pages. Il contient :
* Les **variables de couleurs** (les couleurs de base du site pour rester cohérent).
* Le design global de la page (police d'écriture, marges).
* Le style de la barre de navigation et du pied de page.
* Le style des éléments communs (boutons classiques).

### Les fichiers spécifiques
Chaque page (ou groupe de pages) possède son propre fichier CSS qui se charge de son design spécifique. Par exemple :
* `home.css` n'est chargé que sur `index.html`.
* `dons.css` gère la mise en page spécifique de la page des dons.
* `shared-action.css` (dans le dossier `css/actions/`) est un style partagé utilisé par toutes les pages décrivant une action de l'association.
* Les fichiers dans `assets/css/quizzes/` gèrent le style individuel de chaque quiz (couleurs adaptées au thème).

## En résumé
Quand un visiteur ouvre une page :
1. Le navigateur charge la structure **HTML**.
2. Il applique le design global (`style.css`) puis le design spécifique de la page (ex: `dons.css`).
3. Il exécute `components.js` qui vient "dessiner" le menu et le footer.
4. Il exécute les éventuels autres scripts (comme un carrousel d'images) si la page en a besoin.
