# Rapport de Réorganisation du Projet

Ce document explique les modifications effectuées lors de la réorganisation du projet, conformément à votre demande de ne pas modifier le code tout en gardant le site entièrement fonctionnel.

## Problème initial
En inspectant le dossier racine du projet, plusieurs fichiers semblaient désorganisés ou en double. 
Le site appelait déjà correctement les fichiers rangés dans les dossiers `pages/` et `assets/css/`, mais des versions obsolètes ou en double de ces mêmes fichiers traînaient à la racine du projet.

## Ce qui a été fait

Un dossier `archives` a été créé à la racine du projet, et les fichiers orphelins ou redondants y ont été déplacés pour nettoyer l'espace de travail. 

Voici le détail des fichiers déplacés :
1. **`DONS.html`** : Ce fichier était à la racine. Or, le site utilise en réalité `pages/dons.html` pour la page de dons. L'ancien fichier a donc été déplacé.
2. **`benevolat.html`** : Tout comme pour la page des dons, le site fonctionnel pointe vers `pages/benevolat.html`. Le fichier de la racine a été archivé.
3. **`style.css`** : Un fichier CSS se trouvait à la racine, alors que toutes les pages HTML du site sont liées à `assets/css/style.css`. Le fichier à la racine était donc inutilisé et a été archivé.

## Ce qui a été conservé tel quel (pour ne pas "casser" le site)
- **`flavicon.html`** : Bien que ce soit une icône avec une extension inhabituelle (`.html`), ce fichier est explicitement lié dans la balise `<head>` du fichier `index.html`. Le déplacer aurait nécessité de modifier le code de `index.html`, ce fichier est donc resté à la racine.
- **Le dossier `photos/`** : De nombreuses balises `<img>` dans vos fichiers HTML (ex. dans `pages/sortie.html` ou `pages/actions/orecup.html`) font référence au chemin `../photos/...` ou `../../photos/...`. Déplacer ce dossier dans `assets/images/` aurait nécessité de réécrire les chemins dans le code HTML. Il a donc été conservé à la racine.

## Conclusion
Le projet est désormais plus propre, sans fichiers redondants à la racine. **Aucun code n'a été modifié**, et le site reste 100% fonctionnel tel qu'il l'était avant cette intervention.
