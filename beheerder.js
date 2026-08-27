const loginScherm = document.getElementById("login-scherm");
const loginFormulier = document.getElementById("login-formulier");
const wachtwoordVeld = document.getElementById("wachtwoord");
const loginFout = document.getElementById("login-fout");
const dashboard = document.getElementById("dashboard");
const bestellingenLijst = document.getElementById("bestellingen-lijst");
const tellingEl = document.getElementById("telling");
const uitlogKnop = document.getElementById("uitlog-knop");

const SESSIE_SLEUTEL = "beheerder-ingelogd";

// -------- Inloggen --------

function toonDashboard() {
  loginScherm.hidden = true;
  dashboard.hidden = false;
  laadBestellingen();
}

// Als er deze browser-sessie al is ingelogd, sla het wachtwoordscherm over.
if (sessionStorage.getItem(SESSIE_SLEUTEL) === "ja") {
  toonDashboard();
}

loginFormulier.addEventListener("submit", (event) => {
  event.preventDefault();

  if (wachtwoordVeld.value === BEHEERDER_WACHTWOORD) {
    sessionStorage.setItem(SESSIE_SLEUTEL, "ja");
    loginFout.textContent = "";
    toonDashboard();
  } else {
    loginFout.textContent = "Onjuist wachtwoord. Probeer het opnieuw.";
    wachtwoordVeld.value = "";
    wachtwoordVeld.focus();
  }
});

uitlogKnop.addEventListener("click", () => {
  sessionStorage.removeItem(SESSIE_SLEUTEL);
  window.db.ref("bestellingen").off(); // stop met live meeluisteren
  dashboard.hidden = true;
  loginScherm.hidden = false;
  wachtwoordVeld.value = "";
  wachtwoordVeld.focus();
});

// -------- Bestellingen live laden en tonen --------

function formatteerDatum(timestamp) {
  if (!timestamp) return "";
  const datum = new Date(timestamp);
  return datum.toLocaleString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status) {
  const labels = {
    nieuw: "Nieuw",
    "in-behandeling": "In behandeling",
    afgerond: "Afgerond",
  };
  return labels[status] || "Nieuw";
}

function maakBestellingKaart(id, bestelling) {
  const kaart = document.createElement("article");
  kaart.className = "bestelling-kaart";

  const status = bestelling.status || "nieuw";

  kaart.innerHTML = `
    <div class="bestelling-kaart-kop">
      <h2></h2>
      <span class="bestelling-datum"></span>
    </div>
    <p class="bestelling-omschrijving"></p>
    <div class="bestelling-acties">
      <span class="status-badge" data-status="${status}"></span>
      <select class="status-select" aria-label="Status wijzigen">
        <option value="nieuw">Nieuw</option>
        <option value="in-behandeling">In behandeling</option>
        <option value="afgerond">Afgerond</option>
      </select>
    </div>
  `;

  // Tekst via textContent invullen i.p.v. innerHTML, zodat bestelinhoud
  // nooit als HTML wordt geïnterpreteerd.
  kaart.querySelector("h2").textContent = bestelling.titel || "(zonder titel)";
  kaart.querySelector(".bestelling-datum").textContent = formatteerDatum(bestelling.aangemaaktOp);
  kaart.querySelector(".bestelling-omschrijving").textContent = bestelling.omschrijving || "";
  kaart.querySelector(".status-badge").textContent = statusLabel(status);

  const select = kaart.querySelector(".status-select");
  select.value = status;
  select.addEventListener("change", () => {
    window.db.ref("bestellingen/" + id).update({ status: select.value });
  });

  return kaart;
}

function laadBestellingen() {
  const ref = window.db.ref("bestellingen").orderByChild("aangemaaktOp");

  ref.on("value", (snapshot) => {
    bestellingenLijst.innerHTML = "";

    if (!snapshot.exists()) {
      bestellingenLijst.innerHTML = '<p class="leeg-melding">Nog geen bestellingen binnengekomen.</p>';
      tellingEl.textContent = "0 bestellingen";
      return;
    }

    const items = [];
    snapshot.forEach((kind) => {
      items.push({ id: kind.key, data: kind.val() });
    });

    // Nieuwste bestelling bovenaan
    items.reverse();

    items.forEach((item) => {
      bestellingenLijst.appendChild(maakBestellingKaart(item.id, item.data));
    });

    tellingEl.textContent =
      items.length === 1 ? "1 bestelling" : items.length + " bestellingen";
  }, (fout) => {
    console.error(fout);
    bestellingenLijst.innerHTML =
      '<p class="leeg-melding">Kon bestellingen niet laden. Controleer de Firebase-instellingen en databaseregels.</p>';
  });
}
