# SIMAC G1 — planning modifiable gratuitement avec GitHub Pages

Cette version garde GitHub Pages pour le site public. La sauvegarde des modifications est faite gratuitement avec **Google Apps Script**.

## 1. Mettre le projet sur GitHub

Envoie le contenu de ce dossier dans ton dépôt GitHub Pages.

## 2. Créer le mini-backend gratuit

1. Va sur Google Apps Script : https://script.google.com/
2. Crée un nouveau projet.
3. Remplace le contenu de `Code.gs` par le fichier `Code.gs` de ce dossier.
4. Dans `Code.gs`, remplace `CHANGE-MOI-AVANT-DE-DEPLOYER` par une longue clé secrète de ton choix.
5. Clique **Déployer → Nouveau déploiement**.
6. Type : **Application Web**.
7. Exécuter en tant que : **Moi**.
8. Qui a accès : **Tout le monde**.
9. Déploie et copie l'URL `/exec`.

## 3. Connecter GitHub Pages

Dans `config.js` :

```js
const API_URL = "TON_URL_APPS_SCRIPT/exec";
```

Commit/push.

## 4. Utilisation

- `index.html` : planning public.
- `admin.html` : interface d'administration.
- Entre la clé secrète définie dans `Code.gs`.
- Modifie les cours, horaires et types.
- Clique **Enregistrer**.
- Le planning public récupère les nouvelles données.

## Important

Ne mets **jamais** la clé administrateur dans `config.js`, `index.html` ou `app.js`. Elle reste uniquement dans `Code.gs`.

Le stockage est fait dans les Script Properties du projet Google Apps Script. Aucun serveur payant n'est nécessaire.
