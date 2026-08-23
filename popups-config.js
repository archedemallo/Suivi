// ==== Réglages des pop-up de Index.html ====
// Seul fichier à modifier pour gérer les 2 pop-up. Rien d'autre à toucher.

// --- Pop-up MAINTENANCE ---
const MAINTENANCE = {
  active: false,               // true = redirige tout le monde vers Maintenance.html
  banniere: true,              // true = affiche un bandeau d'annonce même hors maintenance
  jour: "dimanche 23 août",  // Changer la date ICI
  debut: "14h30",               // Changer l'heure ICI
  fin: "15h00"                  // Changer l'heure ICI
};

// --- Pop-up MISE A JOUR ---
// S'affiche automatiquement pendant `dureeJours` jours à partir de
// `dateDebut`, puis disparaît toute seule (rien à désactiver après coup).
// Pour une nouvelle annonce : changer dateDebut (+ texte).
const MAJ = {
  active: true,                // true = pop-up active / false = désactivée
  dateDebut: "2026-08-06",     // date de mise en ligne, format AAAA-MM-JJ
  dureeJours: 7,                // nombre de jours d'affichage à partir de dateDebut
  titre: "Mise à jour",
  // Texte libre. Utiliser <br> pour un retour à la ligne.
  texte: "Une mise à jour a été effectuée.<br>Possibilité d'enregistrer un don anonyme et création des reçus fiscaux. Il ne faut donc plus utiliser les reçus manuels"
};
 
