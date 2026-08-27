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
  apiKey: "VUL_HIER_JE_API_KEY_IN",
  authDomain: "VUL_HIER_IN.firebaseapp.com",
  databaseURL: "https://VUL_HIER_IN-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "VUL_HIER_IN",
  storageBucket: "VUL_HIER_IN.appspot.com",
  messagingSenderId: "VUL_HIER_IN",
  appId: "VUL_HIER_IN",
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
