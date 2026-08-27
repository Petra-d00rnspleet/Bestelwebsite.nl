# Website Bestellen

Een simpel bestelsysteem: een **besteller** vult een titel en omschrijving
in voor de website die hij wil, en een **beheerder** logt in met een
wachtwoord om alle bestellingen live te zien (via Firebase Realtime
Database).

## Bestanden

```
index.html          Startscherm — kies "Besteller" of "Beheerder"
besteller.html       Bestelformulier
besteller.js         Stuurt de bestelling naar Firebase
beheerder.html        Wachtwoordscherm + overzicht van bestellingen
beheerder.js          Login-logica + live ophalen/bijwerken van bestellingen
firebase-config.js    Hier vul je jouw Firebase-gegevens en het wachtwoord in
firebase-init.js      Initialiseert Firebase (hoef je niet aan te passen)
style.css             Alle vormgeving
```

## Stap 1 — Zet dit op GitHub

1. Maak een nieuwe (lege) repository aan op GitHub.
2. Zet deze bestanden erin en push ze:
   ```bash
   git init
   git add .
   git commit -m "Eerste versie: website bestellen"
   git branch -M main
   git remote add origin https://github.com/JOUW-GEBRUIKERSNAAM/JOUW-REPO.git
   git push -u origin main
   ```

## Stap 2 — Maak een Firebase-project met Realtime Database

1. Ga naar [console.firebase.google.com](https://console.firebase.google.com)
   en klik op **Project toevoegen**.
2. Ga in het menu links naar **Build > Realtime Database** en klik op
   **Database maken**. Kies een locatie (bijv. Europe) en start in
   **testmodus** (zie de beveiligingsnotitie hieronder).
3. Ga naar het tandwiel-icoon > **Projectinstellingen** > tab
   **Algemeen** > scroll naar **Je apps** > klik op het web-icoon
   (`</>`) om een nieuwe web-app te registreren.
4. Kopieer het `firebaseConfig`-object dat Firebase je geeft.

## Stap 3 — Vul `firebase-config.js` in

Open `firebase-config.js` en plak jouw eigen gegevens in het
`firebaseConfig`-object. Let vooral op `databaseURL` — die moet
overeenkomen met de Realtime Database die je in stap 2 hebt gemaakt.

Verander ook meteen:

```js
const BEHEERDER_WACHTWOORD = "verander-dit-wachtwoord";
```

naar een wachtwoord naar keuze.

Commit en push deze wijziging naar GitHub.

## Stap 4 — Zet de website online (GitHub Pages)

1. Ga in je GitHub-repository naar **Settings > Pages**.
2. Kies bij **Branch**: `main` en map `/ (root)`. Klik op **Save**.
3. Na een minuutje is je site live op
   `https://JOUW-GEBRUIKERSNAAM.github.io/JOUW-REPO/`.

Je kunt de site ook lokaal testen zonder GitHub Pages: open
`index.html` gewoon in je browser, of start een simpel lokaal
servertje (`npx serve` of Python's `python3 -m http.server`).

## Stap 5 — Databaseregels instellen

In **testmodus** mag iedereen ter wereld de database lezen én
schrijven — prima om snel te testen, niet om te laten staan. Ga naar
**Realtime Database > Regels** en gebruik op zijn minst dit, zodat
alleen het pad `bestellingen` gebruikt kan worden:

```json
{
  "rules": {
    "bestellingen": {
      ".read": true,
      ".write": true
    },
    ".read": false,
    ".write": false
  }
}
```

Dit is nog steeds open voor iedereen (zowel besteller als beheerder
gebruiken hier geen Firebase-login), maar beperkt schade tot alleen
het bestellingen-pad.

## Over de beveiliging van het beheerderswachtwoord

Het wachtwoord in `firebase-config.js` wordt **in de browser**
gecontroleerd. Dat betekent dat iedereen die de broncode van de
pagina bekijkt (of het bestand op GitHub opent) het wachtwoord kan
vinden. Voor een klein, informeel bestelsysteem is dat vaak
acceptabel — maar het is geen echte beveiliging.

Wil je het steviger maken? Twee opties, van eenvoudig naar grondig:

- **Snel**: zet de repository op GitHub op **privé**, zodat niet
  iedereen de broncode kan inzien.
- **Grondig**: gebruik [Firebase
  Authentication](https://firebase.google.com/docs/auth) met een
  e-mail/wachtwoord-account voor de beheerder, en beperk de
  databaseregels tot ingelogde gebruikers
  (`".read": "auth != null"`). Dat is een grotere aanpassing, maar
  dan ligt de controle bij Firebase zelf in plaats van in de
  broncode.

## Bestellingen bekijken, chatten en verwijderen

- **Besteller**: naast "Nieuwe bestelling" staat de tab **Mijn
  bestellingen**. Dit onthoudt (in de browser, via `localStorage`)
  welke bestellingen jij hebt geplaatst. Klik op een bestelling voor
  de details en de knop **Chat met de beheerder**.
- **Beheerder**: elke bestelling in de lijst is een losse, klikbare
  kaart. Klik erop voor een eigen detailpagina met knoppen om de
  status te wijzigen (**Nieuw / In behandeling / Afgerond**), de
  bestelling te **verwijderen**, of te **chatten met de besteller**.
- De chat van een bestelling wordt opgeslagen onder
  `bestellingen/{id}/chat` in de database en is voor beide kanten
  live zichtbaar — geen pagina-ververs nodig.
- Let op: omdat de besteller niet inlogt, wordt "wie ben ik"
  bijgehouden per browser (`localStorage`). Op een ander apparaat of
  in een incognitovenster zie je "Mijn bestellingen" dus niet
  terug — de bestelling zelf blijft wel gewoon in Firebase staan.

## Bestandsoverzicht (bijgewerkt)

```
index.html          Startscherm — kies "Besteller" of "Beheerder"
besteller.html       Tabs: nieuwe bestelling / mijn bestellingen / detail / chat
besteller.js          Formulier, "mijn bestellingen" (localStorage), detail, chat
beheerder.html         Wachtwoordscherm; daarna lijst / detail / chat
beheerder.js            Login, klikbare bestellingen, status, verwijderen, chat
firebase-config.js      Firebase-gegevens + beheerderswachtwoord
firebase-init.js        Initialiseert Firebase
style.css                Alle vormgeving
```
