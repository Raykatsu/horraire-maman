# Mes heures – ساعات عملي

Pointeuse personnelle pour noter ses heures de travail, voir ses heures supp et estimer son salaire.
L'appli est en **arabe et en français** (un bouton en haut permet de changer de langue).

👉 Lien de l'appli : **https://raykatsu.github.io/horraire-maman/**

## Ce que fait l'appli

- **Semaine** : les heures de chaque jour, le total de la semaine, les heures prévues au contrat et les heures supp.
- **Ajout en 1 clic** : les créneaux favoris (ex. « Déols 22:00 → 01:00 ») s'ajoutent d'un seul appui.
- **Ajout à la main** : date, début, fin, lieu et une note. Un créneau qui finit après minuit (22:00 → 01:00) compte pour le jour où il commence.
- **Mois** : calendrier, total du mois, heures supp, salaire brut estimé et détail semaine par semaine.
- **Envoyer le mois** : fichier Excel ou PDF, à partager sur WhatsApp ou à comparer avec la fiche de paie.
- **Sauvegarde** : un fichier à garder (WhatsApp, Fichiers…) pour ne rien perdre en cas de changement de téléphone.
- Fonctionne aussi **sans internet** une fois installée.

Les heures d'octobre 2026 (101h30) et du début de novembre 2026 (12h) sont déjà remplies au premier lancement.

## Installer sur le téléphone

- **iPhone** : ouvrir le lien dans **Safari** → bouton **Partager** → **Sur l'écran d'accueil**.
- **Android** : ouvrir le lien dans **Chrome** → menu **⋮** → **Ajouter à l'écran d'accueil**.

L'icône « ساعات العمل » apparaît alors sur l'écran d'accueil, comme une vraie appli.

## Calculs

Réglages par défaut (tous modifiables dans **Réglages**), d'après le contrat et la convention collective de la propreté :

- contrat de **18h15 par semaine**, soit **79 h par mois** ;
- **heures supp** (heures complémentaires) : chaque semaine, les heures au-delà du contrat ; jusqu'à **1/10 du contrat** (1h50) à **+10 %**, au-delà à **+25 %** ;
- l'appli signale une semaine qui dépasse la **limite de 1/3 du contrat** (6h05 d'heures supp) ;
- une semaine à cheval sur deux mois compte dans le mois où elle se termine (le dimanche) ;
- **nuit** (21h → 6h) : **+20 %**, et repos compensateur de 2 % des heures de nuit ;
- **dimanche** prévu au planning : **+25 %** (+100 % s'il est exceptionnel) ;
- **jour férié** prévu : **+50 %** (+100 % s'il est exceptionnel) ; un dimanche férié compte seulement comme férié ;
- **salaire brut estimé** : calculé uniquement avec les heures saisies : heures × taux horaire du contrat (salaire de base ÷ heures du mois) + majorations des heures supp, de nuit, du dimanche et des jours fériés. Rien n'est compté à l'avance.

Le salaire n'est pas écrit dans le code : il se remplit dans **Réglages** et reste sur le téléphone.

## Où sont les données ?

Les heures restent **uniquement sur le téléphone** (stockage du navigateur). Rien n'est envoyé sur internet ni sur GitHub.
Penser à faire une **sauvegarde une fois par mois** (Réglages → Faire une sauvegarde), et la restaurer sur le nouveau téléphone si besoin.

## Pour modifier l'appli

Aucune installation nécessaire : ce sont des fichiers HTML, CSS et JavaScript simples.

| Fichier | Rôle |
|---|---|
| `index.html` | la page |
| `styles.css` | l'apparence |
| `js/core.js` | les calculs (durées, semaines, heures supp, salaire) et les heures déjà remplies |
| `js/i18n.js` | tous les textes en arabe et en français |
| `js/app.js` | les écrans et les boutons |
| `js/report.js` | le contenu des exports |
| `js/xlsx.js` | la création du fichier Excel |
| `js/pdf.js` | la création du PDF |
| `sw.js` | le fonctionnement sans internet |

Vérifier les calculs : `node tests/core.test.js`

Après une modification, changer le numéro dans `sw.js` (`heures-maman-v1` → `heures-maman-v2`) pour que les téléphones récupèrent la nouvelle version.

## Mise en ligne (GitHub Pages)

Dans le dépôt sur GitHub : **Settings → Pages → Build and deployment → Source : Deploy from a branch → Branch : `main` / `(root)` → Save**.
Après une ou deux minutes, l'appli est en ligne à l'adresse ci-dessus.
