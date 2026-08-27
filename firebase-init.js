// Initialiseert de Firebase-app en maakt de Realtime Database
// beschikbaar als `window.db` voor de andere scripts.
// Vereist dat firebase-config.js en de Firebase SDK-scripts
// vóór dit bestand zijn geladen (zie de <script>-volgorde in de HTML).

firebase.initializeApp(firebaseConfig);
window.db = firebase.database();
