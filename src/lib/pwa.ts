/**
 * Version des icônes de l'appli. À incrémenter chaque fois que les fichiers de public/icons changent.
 *
 * Le numéro est ajouté à l'adresse des icônes (`?v=2`) dans le manifeste et dans les notifications :
 * l'adresse change, donc le cache du service worker, celui du navigateur et la mise à jour automatique
 * d'Android rechargent la nouvelle image au lieu de garder l'ancienne.
 *
 * Limite : sur iPhone, l'icône de l'écran d'accueil est figée à l'installation. Aucune mise à jour
 * n'est possible : il faut supprimer l'appli de l'écran d'accueil puis la rajouter.
 */
export const ICON_VERSION = "2";

export function iconUrl(file: string): string {
  return `/icons/${file}?v=${ICON_VERSION}`;
}
