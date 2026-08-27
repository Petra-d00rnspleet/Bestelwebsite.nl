// ============================================================
// FIREBASE CONFIGURATIE
// ============================================================
// Vul hieronder de gegevens in die je krijgt uit de Firebase Console:
// Projectinstellingen (tandwiel-icoon) > Algemeen > "Je apps" > Web-app
//
// Zorg dat je project een REALTIME DATABASE heeft aangemaakt
// (niet Firestore) — zie README.md stap 2.
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyB_gIvmh07gYLw6kbb9-EWaxm_MnDavfmA",
  authDomain: "bestelwebsitenl.firebaseapp.com",
  databaseURL: "https://bestelwebsitenl-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "bestelwebsitenl",
  storageBucket: "bestelwebsitenl.firebasestorage.app",
  messagingSenderId: "298628785707",
  appId: "1:298628785707:web:fad0248548d7a371e1ec6e",
};

// ============================================================
// BEHEERDER-WACHTWOORD
// ============================================================
// Dit is een eenvoudige, aan de voorkant (client-side) gecontroleerde
// toegangscode. Dat betekent: iedereen die naar de broncode kijkt kan
// dit wachtwoord vinden. Prima voor een klein/informeel projectje,
// maar gebruik dit NIET om echt gevoelige bestellingen te beschermen.
// Zie README.md "Over de beveiliging" voor een stevigere aanpak
// (Firebase Authentication) als je dit serieuzer wilt maken.
// ============================================================

const BEHEERDER_WACHTWOORD = "Snoeptroep111!@#";
