# Cahier des charges — App Coloc

Oct 17, 2026 · @tobias

## Contexte et objectifs

L'app remplace les échanges WhatsApp dispersés par un seul outil pour organiser la vie à 4 dans une maison de 92 m² : le ménage du weekend, les achats communs et les discussions du quotidien.

Aujourd'hui, les sujets de la coloc (qui fait le ménage, ce qui manque, ce qui ne va pas) se perdent dans le groupe WhatsApp. L'app doit permettre de savoir en un coup d'œil qui doit faire quoi, et garder une trace des échanges liés à chaque sujet.

**Objectifs**

- Chaque coloc sait, sans demander, quand c'est son tour de faire le ménage.
- Les consommables communs manquants sont signalés en un tap, avec la personne qui s'en charge.
- Les remarques et les râleries ont un espace dédié, rattaché au bon sujet quand c'est pertinent.
- L'app est utilisée par les 4 colocs au moins une fois par semaine, un mois après la mise en service.

## Périmètre

La V1 couvre le ménage hebdomadaire, une liste partagée hors alimentation, les projets à 4, un fil de discussion et des notifications ciblées.

| Inclus | Exclu |
| --- | --- |
| Rotation hebdomadaire du ménage des espaces communs (balai et serpillière) | Ménage des toilettes et douches, qui sont séparées |
| Liste des consommables communs (PQ, liquide vaisselle, éponges…) | Courses alimentaires, gérées individuellement |
| Projets à 4 (achat, travaux, organisation) avec commentaires | Gestion des dépenses et remboursements (Tricount si besoin) |
| Fil de discussion général, avec tags et réactions | Messagerie privée entre deux colocs |
| Mentions `@pseudo` et notifications push | Application native sur les stores |
| Connexion par identifiant et mot de passe, comptes créés à l'avance | Inscription publique, connexion par mail |

## Utilisateurs et rôles

L'app compte 4 colocs, dont un administrateur, et un propriétaire au rôle limité, dans un seul foyer.

| Rôle | Qui | Droits |
| --- | --- | --- |
| Coloc | Les 4 colocataires | Voir et valider ses tâches, proposer et accepter des échanges, gérer la liste, créer des projets, commenter, poster dans le fil, réagir, répondre aux annonces, régler ses notifications |
| Admin | Tobias (en plus de son rôle de coloc) | Créer les comptes, générer et régénérer les liens d'invitation, définir l'ordre de rotation, ajouter ou retirer un coloc ou le propriétaire |
| Propriétaire | Le propriétaire de la maison, compte créé par l'admin avec un lien d'invitation | Publier une annonce ou une demande (réunion, visite, travaux, information) notifiée à tous les colocs, voir les réponses et commenter ses annonces. Pas d'accès au ménage, à la liste, aux projets ni au fil |

## Fonctionnalités

Huit modules, du plus prioritaire au moins prioritaire : connexion, ménage, liste, projets, fil, mentions et notifications, administration, annonces du propriétaire.

### F1. Connexion et invitation

- L'admin crée les 4 comptes à l'avance. Il n'existe aucune page d'inscription publique.
- Chaque compte a un lien d'invitation unique, partagé dans le groupe WhatsApp.
- Le lien est à usage unique, expire après quelques jours et ne correspond qu'à un compte précis.
- Sur la page d'invitation, la personne choisit son identifiant et crée son mot de passe, puis le lien est invalidé.
- Connexion par identifiant et mot de passe. Session de 30 jours pour ne pas se reconnecter chaque semaine.
- Mot de passe oublié : l'admin régénère un lien d'invitation pour le compte.

### F2. Ménage hebdomadaire

- Une personne par semaine s'occupe du balai et de la serpillière des espaces communs.
- La semaine de planning va du samedi au vendredi, car le ménage se fait le samedi matin.
- Rotation automatique sur 4 semaines selon l'ordre défini par l'admin.
- Planning visible sur les 4 prochaines semaines.
- Bouton « fait » qui valide la semaine en un tap.
- Échange de semaine : un coloc propose un échange à un autre, qui accepte ou refuse dans l'app.
- Une semaine non validée s'affiche « pas encore fait », sans message culpabilisant.
- Commentaires possibles sur la semaine.

### F3. Liste partagée

- Deux catégories : consommables communs et achats liés à un projet.
- Bouton « il en faut » en un tap sur un consommable déjà connu.
- Champ « qui s'en charge » sur chaque item.
- Un item acheté est coché et disparaît de la liste active.
- Pas de montant ni de remboursement en V1.

### F4. Projets à 4

- Un projet a un titre, une description, un statut (idée, en cours, terminé) et ses items de liste.
- Fil de commentaires propre à chaque projet (devis, avis, décisions).

### F5. Fil de discussion

- Un fil unique, chronologique, distinct des tâches et des projets.
- Tag optionnel au moment de poster : Ménage, Bruit, Argent, Général. Filtrage par tag.
- Réaction « moi aussi » avec compteur sur chaque message.
- L'auteur est toujours affiché, pas de message anonyme.
- Modification possible pendant quelques minutes. Un message qui a des réactions ne peut plus être supprimé.
- Les 3 derniers messages s'affichent sur l'accueil, avec un lien « voir tout ».

### F6. Mentions et notifications

- Mention `@pseudo` dans le fil, les commentaires de ménage et les commentaires de projet.
- Saisie de `@` : l'app propose la liste des colocs.
- Une seule notification par personne et par message, pas d'auto-mention.
- Le clic sur une notification ouvre le message ou l'écran concerné.

| Notification | Destinataire | Moment |
| --- | --- | --- |
| Annonce ou demande du propriétaire | Tous les colocs (notification globale) | Immédiat |
| C'est ton tour pour le ménage | La personne de la semaine | Samedi vers 9h |
| Rappel ménage non validé | La personne de la semaine | Dimanche vers 19h, si non validé |
| Demande d'échange de semaine | Le coloc sollicité | Immédiat |
| Réponse à une demande d'échange | Le demandeur | Immédiat |
| Mention `@pseudo` | La personne mentionnée | Immédiat |
| Réponses à une annonce | Le propriétaire | Quand tous les colocs ont répondu, ou récapitulatif le soir |

- Pas de notification pour chaque message, réaction ou item ajouté.
- Chacun peut couper les rappels de ménage tout en gardant les mentions et les échanges. Les annonces du propriétaire ne peuvent pas être coupées.

### F7. Profil et administration

- Profil : changer son mot de passe, régler ses notifications, voir sa couleur ou ses initiales.
- Admin : liste des comptes, statut des invitations, régénération d'un lien, ordre de rotation du ménage.

### F8. Annonces du propriétaire

- Le propriétaire publie une annonce : titre, message, type (réunion, visite, travaux, information, autre) et date proposée facultative.
- Chaque annonce envoie une notification globale immédiate à tous les colocs.
- Pour une réunion ou une visite, chaque coloc répond « disponible » ou « pas disponible », et peut proposer un autre créneau en commentaire.
- Le propriétaire voit qui a lu l'annonce et qui a répondu.
- Les annonces en cours s'affichent en haut de l'accueil des colocs jusqu'à la date de l'événement ou leur archivage.
- Commentaires sous chaque annonce, visibles par le propriétaire et les colocs.

## Pages et navigation

L'app tient en 9 pages et s'utilise aussi bien sur téléphone que sur ordinateur, avec une mise en page qui s'adapte à la largeur de l'écran.

| Page | Route | Contenu |
| --- | --- | --- |
| Connexion | `/connexion` | Identifiant et mot de passe |
| Invitation | `/invitation/[token]` | Choix de l'identifiant et du mot de passe |
| Accueil | `/` | Annonces en cours, ma tâche de la semaine, consommables manquants, 3 derniers messages du fil, activité récente |
| Ménage | `/menage` | Planning des 4 prochaines semaines, bouton « fait », demandes d'échange |
| Liste | `/liste` | Consommables et achats de projet, « il en faut », « qui s'en charge » |
| Projets | `/projets` et `/projets/[id]` | Liste des projets, puis items et commentaires d'un projet |
| Fil | `/fil` | Fil complet, filtre par tag |
| Annonces | `/annonces` et `/annonces/[id]` | Annonces du propriétaire, réponses et commentaires |
| Profil | `/profil` | Mot de passe, notifications, couleur |
| Admin | `/admin` | Comptes, invitations, ordre de rotation (Tobias uniquement) |

**Navigation selon l'écran**

- **Téléphone** (moins de 768 px) : barre fixe en bas avec 4 onglets (Accueil, Ménage, Liste, Projets). Le fil est accessible depuis l'accueil, le profil depuis l'en-tête.
- **Ordinateur et laptop** (768 px et plus) : barre latérale à gauche avec tous les onglets, fil compris. Contenu centré avec une largeur maximale d'environ 1 100 px pour rester lisible.
- **Accueil sur ordinateur** : deux colonnes. À gauche, la tâche de la semaine et la liste ; à droite, le fil et l'activité récente.
- **Projet sur ordinateur** : les items à gauche, les commentaires à droite, visibles en même temps.

Le propriétaire a une interface réduite : la liste de ses annonces, un bouton « nouvelle annonce », les réponses des colocs et son profil, sans les onglets des colocs.

**Principes d'interface**

- Un tap ou un clic pour agir : « fait » et « il en faut » ne demandent aucune confirmation.
- Mise à jour immédiate de l'interface, sans attendre la réponse du serveur.
- Chaque coloc a une couleur et ses initiales, pour reconnaître qui a fait quoi.
- Sur ordinateur, tout est utilisable au clavier : `Entrée` pour envoyer un message, `Échap` pour fermer une fenêtre, focus visible.
- Les listes vides s'affichent avec un message simple, pas comme une erreur.

## Architecture technique

Une seule application Next.js, en PWA, hébergée en Docker sur le VPS OVH à côté de PostgreSQL, sert à la fois le téléphone et l'ordinateur.

&#91;embedded content: architecture · appareils, VPS, notifications\]

Les requêtes passent par le reverse proxy existant ; le cron du VPS appelle une route protégée qui déclenche les rappels, envoyés via les services push du navigateur vers chaque appareil abonné.

| Brique | Choix | Remarque |
| --- | --- | --- |
| Framework | Next.js (App Router), React, TypeScript | Server Actions pour les mutations, pas d'API REST à écrire |
| Style | Tailwind CSS | Mise en page responsive mobile et ordinateur |
| Base de données | PostgreSQL + Prisma | Même outillage que le site de Julien |
| Authentification | Auth.js, provider Credentials, sessions JWT de 30 jours | Le provider Credentials impose les sessions JWT |
| Hachage | argon2 (ou bcrypt) | Mots de passe et tokens d'invitation |
| PWA | `app/manifest.ts` + Serwist | next-pwa n'est plus maintenu |
| Notifications | Web Push, clés VAPID, librairie `web-push` | Un abonnement par appareil |
| Tâches planifiées | Cron du VPS appelant une route protégée | Samedi 9h et dimanche 19h, heure de Paris |
| Déploiement | Docker + reverse proxy du VPS | Sauvegarde quotidienne de la base |

## Modèle de données

Quinze entités Prisma suffisent ; chaque contenu porte son auteur, ce qui permet de savoir qui a fait quoi.

| Entité | Champs principaux | Rôle |
| --- | --- | --- |
| `Household` | id, nom | Le foyer (un seul en V1, prévu pour en accueillir d'autres) |
| `User` | id, householdId, username, passwordHash, displayName, color, role (coloc, admin, propriétaire), rotationOrder? | Un coloc ou le propriétaire (sans ordre de rotation) |
| `Invitation` | id, userId, tokenHash, expiresAt, usedAt | Lien d'invitation à usage unique |
| `ChoreAssignment` | id, weekStart (samedi), userId, status (à faire, fait), doneAt | Le ménage d'une semaine |
| `SwapRequest` | id, fromAssignmentId, toAssignmentId, requesterId, targetId, status (en attente, acceptée, refusée) | Échange de semaine |
| `Project` | id, title, description, status (idée, en cours, terminé), authorId | Projet à 4 |
| `ListItem` | id, name, category (consommable, projet), projectId?, needed, assigneeId?, authorId, boughtAt? | Item de la liste partagée |
| `Message` | id, authorId, body, tag?, createdAt, editedAt? | Message du fil |
| `Comment` | id, authorId, body, targetType (semaine, projet, annonce), targetId, createdAt, editedAt? | Commentaire rattaché à un sujet |
| `Reaction` | id, userId, messageId | « Moi aussi » sur un message, unique par personne |
| `Mention` | id, sourceType (message, commentaire), sourceId, userId, notifiedAt? | Personne mentionnée |
| `Announcement` | id, authorId, title, body, type (réunion, visite, travaux, information, autre), eventAt?, archivedAt?, createdAt | Annonce du propriétaire |
| `AnnouncementResponse` | id, announcementId, userId, readAt?, answer? (disponible, pas disponible), respondedAt? | Lecture et réponse d'un coloc à une annonce |
| `PushSubscription` | id, userId, endpoint, p256dh, auth, userAgent | Appareil abonné aux notifications (téléphone, ordinateur) |
| `NotificationLog` | id, userId, kind, refId, sentAt | Historique et anti-doublon des envois |

Les préférences de notification (rappels de ménage activés ou non) sont stockées sur `User`. Un utilisateur peut avoir plusieurs `PushSubscription`, une par appareil, pour recevoir les notifications sur son téléphone et son ordinateur.

## Exigences non fonctionnelles

L'app doit rester légère, sûre pour les mots de passe et fonctionner sur téléphone comme sur ordinateur.

**Sécurité**

- Mots de passe hachés avec argon2 ou bcrypt, jamais stockés en clair.
- Tokens d'invitation stockés hachés, à usage unique et avec expiration.
- Toutes les actions vérifient que l'utilisateur appartient au foyer concerné.
- Limitation des tentatives de connexion (par exemple 5 échecs puis attente).
- HTTPS obligatoire via le reverse proxy ; cookie de session `httpOnly`, `secure`, `sameSite`.
- Route du cron protégée par un secret partagé.

**Vie privée**

- Données minimales : pas d'email, pas de téléphone, pas d'adresse.
- Aucune donnée envoyée à un service tiers hors services de push du navigateur.
- Sauvegarde quotidienne de la base sur le VPS.

**Compatibilité**

- Téléphone : Android (Chrome) et iPhone (Safari, iOS 16.4 ou plus récent pour les notifications).
- Ordinateur et laptop : Chrome, Edge, Firefox et Safari récents, de 768 px à grand écran.
- Installation en PWA possible sur téléphone et sur ordinateur (Chrome et Edge).
- Sur iPhone, les notifications ne fonctionnent qu'une fois l'app ajoutée à l'écran d'accueil : un écran d'aide l'explique à la première connexion.

**Performance et disponibilité**

- Accueil affiché en moins de 2 secondes sur une connexion mobile correcte.
- Interface mise à jour immédiatement après une action, puis synchronisée.
- App shell mis en cache : l'app s'ouvre même avec une connexion faible.
- Pas d'objectif de disponibilité formel ; une coupure ponctuelle est acceptable.

## Jalons et critères d'acceptation

Le projet avance en 5 jalons ; chacun est mis en service et testé à 4 avant de passer au suivant.

1. **Socle et connexion**
   - Projet Next.js, Prisma, PostgreSQL, déploiement Docker sur le VPS.
   - Comptes, invitations, connexion, session, page admin minimale.
   - Accepté quand : les 4 colocs se connectent sur téléphone et sur ordinateur via leur lien, et un lien déjà utilisé est refusé.
2. **Ménage hebdomadaire**
   - Rotation, planning sur 4 semaines, bouton « fait », échange de semaine.
   - Accepté quand : la rotation tourne correctement sur 4 semaines et un échange accepté met à jour le planning des deux personnes.
3. **Liste et projets**
   - Consommables, « il en faut », « qui s'en charge », projets avec items et commentaires.
   - Accepté quand : un item ajouté sur un téléphone apparaît sur l'ordinateur d'un autre coloc après rafraîchissement.
4. **Fil et mentions**
   - Fil avec tags et réactions, mentions avec suggestion des colocs, compte propriétaire et annonces.
   - Accepté quand : une mention crée une seule entrée par personne et apparaît sur son accueil.
5. **PWA et notifications**
   - Manifest, service worker, abonnement push, cron du samedi et du dimanche.
   - Accepté quand : la personne de la semaine reçoit le rappel le samedi vers 9h sur au moins un appareil, une seule fois, et une mention notifie immédiatement.

Un mois après le jalon 5, on vérifie l'objectif d'usage : les 4 colocs ouvrent l'app au moins une fois par semaine.

## Risques et points ouverts

Le principal risque n'est pas technique : c'est que les colocs reviennent sur WhatsApp.

| Risque | Conséquence | Parade |
| --- | --- | --- |
| Faible adoption | L'app est abandonnée en quelques semaines | Commencer par le ménage, notifications utiles uniquement, accueil qui montre tout de suite ce qui concerne chacun |
| Maintenance à la charge de Tobias seul | Panne non réparée, lassitude | Périmètre réduit, logs et sauvegardes, déploiement identique aux autres projets du VPS |
| Notifications non reçues sur iPhone | Rappels manqués | Aide à l'installation sur l'écran d'accueil, rappel aussi visible sur l'accueil |
| Trop de notifications | Les colocs coupent tout | Aucune notification pour les messages ordinaires, réglages par type |
| Tensions dans le fil | Conflits par écrit | Auteur visible, pas de suppression après réaction, discussion de vive voix pour les vrais conflits |

**Points ouverts**

- [ ] Durée de validité des liens d'invitation (proposition : 7 jours).
- [ ] Ordre de départ de la rotation du ménage.
- [ ] Liste des tags du fil à valider avec les colocs.
- [ ] Faut-il partager le coût des consommables plus tard, ou garder Tricount à part ?
- [ ] Faut-il d'autres tâches hebdomadaires que le balai et la serpillière (poubelles, cuisine) ?

* [ ] Le propriétaire doit-il voir autre chose que ses annonces, par exemple les projets de travaux ?
* [ ] Les colocs peuvent-ils eux aussi envoyer une demande au propriétaire depuis l'app ?
