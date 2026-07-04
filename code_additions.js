// ============================================================
// ADDITIONS À AJOUTER AU code.js EXISTANT
// ============================================================

// Dans FOLDERS, ajouter ces lignes (utiliser le même dossier Drive par défaut) :
// 'Contrat_reservation_autre_animal': DRIVE_FOLDER_ID,  // ← ou un dossier spécifique
// 'Pret_Materiel':                    DRIVE_FOLDER_ID,
// 'CBS_Absent':                       DRIVE_FOLDER_ID,
// 'Decharge_Vaccin':                  DRIVE_FOLDER_ID,

// Dans lireDonnees(), dans le tableau ongletsCibles, ajouter :
// 'Contrat_reservation_autre_animal', 'Pret_Materiel', 'CBS_Absent', 'Decharge_Vaccin'

// Exemple de libellesOnglet à ajouter dans construireCorpsMail() et sendMailBrevo() :
// 'Contrat_reservation_autre_animal': 'Réservation Autre animal',
// 'Pret_Materiel':                    'Prêt de matériel',
// 'CBS_Absent':                       'Attestation CBS Absent',
// 'Decharge_Vaccin':                  'Décharge adoption avant 2ème vaccin',
