// ============================================================
// Beheerder: inloggen, bestellingen lijst, detail (met status
// wijzigen en verwijderen), en chat per bestelling
// ============================================================

const SESSIE_SLEUTEL = "beheerder-ingelogd";

// -------- Elementen --------

const loginScherm = document.getElementById("login-scherm");
const loginFormulier = document.getElementById("login-formulier");
const wachtwoordVeld = document.getElementById("wachtwoord");
const loginFout = document.getElementById("login-fout");

const weergaveLijst = document.getElementById("weergave-lijst");
const weergaveDetail = document.getElementById("weergave-detail");
const weergaveChat = document.getElementById("weergave-chat");

const bestellingenLijst = document.getElementById("bestellingen-lijst");
const tellingEl = document.getElementById("telling");
const uitlogKnop = document.getElementById("uitlog-knop");

const detailTerug = document.getElementById("detail-terug");
const detailKaart = document.getElementById("detail-kaart");
const statusKnoppen = document.getElementById("status-knoppen");

const chatTerug = document.getElementById("chat-terug");
const chatTitel = document.getElementById("chat-titel");
const chatBerichten = document.getElementById("chat-berichten");
const chatFormulier = document.getElementById("chat-formulier");
const chatInvoerveld = document.getElementById("chat-invoerveld");

let huidigeBestellingId = null;
let lijstListenerActief = false;
let detailListenerId = null;
let chatListenerId = null;

// -------- Inloggen --------
// Zodra er is ingelogd, wordt het wachtwoordscherm volledig uit de
// pagina verwijderd (niet alleen verborgen) — het komt deze sessie
// niet meer terug.

function toonDashboard() {
  if (loginScherm && loginScherm.parentNode) {
    loginScherm.parentNode.removeChild(loginScherm);
  }
  toonWeergave("lijst");
}

if (sessionStorage.getItem(SESSIE_SLEUTEL) === "ja") {
  toonDashboard();
}

if (loginFormulier) {
  loginFormulier.addEventListener("submit", (event) => {
    event.preventDefault();

    if (wachtwoordVeld.value === BEHEERDER_WACHTWOORD) {
      sessionStorage.setItem(SESSIE_SLEUTEL, "ja");
      toonDashboard();
    } else {
      loginFout.textContent = "Onjuist wachtwoord. Probeer het opnieuw.";
      wachtwoordVeld.value = "";
      wachtwoordVeld.focus();
    }
  });
}

uitlogKnop.addEventListener("click", () => {
  sessionStorage.removeItem(SESSIE_SLEUTEL);
  window.location.reload();
});

// -------- Weergave wisselen --------

function stopListeners() {
  if (lijstListenerActief) {
    window.db.ref("bestellingen").off();
    lijstListenerActief = false;
  }
  if (detailListenerId) {
    window.db.ref("bestellingen/" + detailListenerId).off();
    detailListenerId = null;
  }
  if (chatListenerId) {
    window.db.ref("bestellingen/" + chatListenerId + "/chat").off();
    chatListenerId = null;
  }
}

function toonWeergave(naam, id) {
  weergaveLijst.hidden = naam !== "lijst";
  weergaveDetail.hidden = naam !== "detail";
  weergaveChat.hidden = naam !== "chat";

  if (naam === "lijst") {
    if (detailListenerId) { window.db.ref("bestellingen/" + detailListenerId).off(); detailListenerId = null; }
    if (chatListenerId) { window.db.ref("bestellingen/" + chatListenerId + "/chat").off(); chatListenerId = null; }
    laadLijst();
  }
  if (naam === "detail") {
    if (lijstListenerActief) { window.db.ref("bestellingen").off(); lijstListenerActief = false; }
    if (chatListenerId) { window.db.ref("bestellingen/" + chatListenerId + "/chat").off(); chatListenerId = null; }
    laadDetail(id);
  }
  if (naam === "chat") {
    laadChat(id);
  }
}

detailTerug.addEventListener("click", () => toonWeergave("lijst"));
chatTerug.addEventListener("click", () => toonWeergave("detail", huidigeBestellingId));

// -------- Helpers --------

function formatteerDatum(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status) {
  const labels = { nieuw: "Nieuw", "in-behandeling": "In behandeling", afgerond: "Afgerond" };
  return labels[status] || "Nieuw";
}

// -------- Lijst (klikbare kaarten, niet meer inline beheren) --------

function laadLijst() {
  lijstListenerActief = true;
  const ref = window.db.ref("bestellingen").orderByChild("aangemaaktOp");

  ref.on("value", (snapshot) => {
    bestellingenLijst.innerHTML = "";

    if (!snapshot.exists()) {
      bestellingenLijst.innerHTML = '<p class="leeg-melding">Nog geen bestellingen binnengekomen.</p>';
      tellingEl.textContent = "0 bestellingen";
      return;
    }

    const items = [];
    snapshot.forEach((kind) => items.push({ id: kind.key, data: kind.val() }));
    items.reverse(); // nieuwste bovenaan

    items.forEach(({ id, data }) => {
      const knop = document.createElement("button");
      knop.type = "button";
      knop.className = "mini-kaart";
      knop.innerHTML = `
        <div class="mini-kaart-kop">
          <h2></h2>
          <span class="mini-kaart-datum"></span>
        </div>
        <p class="mini-kaart-voorbeeld"></p>
        <div class="mini-kaart-voet">
          <span class="status-badge" data-status="${data.status || "nieuw"}"></span>
          <span class="pijl">Openen &rarr;</span>
        </div>
      `;
      knop.querySelector("h2").textContent = data.titel || "(zonder titel)";
      knop.querySelector(".mini-kaart-datum").textContent = formatteerDatum(data.aangemaaktOp);
      knop.querySelector(".mini-kaart-voorbeeld").textContent = data.omschrijving || "";
      knop.querySelector(".status-badge").textContent = statusLabel(data.status);
      knop.addEventListener("click", () => toonWeergave("detail", id));
      bestellingenLijst.appendChild(knop);
    });

    tellingEl.textContent = items.length === 1 ? "1 bestelling" : items.length + " bestellingen";
  }, (fout) => {
    console.error(fout);
    bestellingenLijst.innerHTML =
      '<p class="leeg-melding">Kon bestellingen niet laden. Controleer de Firebase-instellingen en databaseregels.</p>';
  });
}

// -------- Detail (status wijzigen + verwijderen + naar chat) --------

function laadDetail(id) {
  huidigeBestellingId = id;
  detailListenerId = id;
  detailKaart.innerHTML = '<p class="leeg-melding">Laden...</p>';

  window.db.ref("bestellingen/" + id).on("value", (snap) => {
    const data = snap.val();

    if (!data) {
      detailKaart.innerHTML = '<p class="leeg-melding">Deze bestelling bestaat niet meer.</p>';
      statusKnoppen.hidden = true;
      return;
    }

    statusKnoppen.hidden = false;
    statusKnoppen.querySelectorAll(".status-knop").forEach((knop) => {
      const isActief = knop.dataset.status === (data.status || "nieuw");
      knop.classList.toggle("actief", isActief);
      knop.onclick = () => {
        window.db.ref("bestellingen/" + id).update({ status: knop.dataset.status });
      };
    });

    detailKaart.innerHTML = `
      <div class="detail-kop">
        <div>
          <h2></h2>
          <span class="mini-kaart-datum"></span>
        </div>
      </div>
      <p class="detail-omschrijving"></p>
      <div class="detail-acties">
        <button type="button" class="chat-knop">&#128172; Chat met besteller</button>
        <button type="button" class="gevaar-knop">Bestelling verwijderen</button>
      </div>
    `;
    detailKaart.querySelector("h2").textContent = data.titel || "(zonder titel)";
    detailKaart.querySelector(".mini-kaart-datum").textContent = formatteerDatum(data.aangemaaktOp);
    detailKaart.querySelector(".detail-omschrijving").textContent = data.omschrijving || "";
    detailKaart.querySelector(".chat-knop").addEventListener("click", () => toonWeergave("chat", id));
    detailKaart.querySelector(".gevaar-knop").addEventListener("click", () => verwijderBestelling(id));
  });
}

async function verwijderBestelling(id) {
  const zeker = confirm("Weet je zeker dat je deze bestelling wilt verwijderen? Dit kan niet ongedaan worden gemaakt.");
  if (!zeker) return;

  try {
    await window.db.ref("bestellingen/" + id).remove();
    toonWeergave("lijst");
  } catch (fout) {
    console.error(fout);
    alert("Verwijderen is mislukt. Probeer het opnieuw.");
  }
}

// -------- Chat --------

function maakChatBericht(data) {
  const bubbel = document.createElement("div");
  const isEigen = data.afzender === "beheerder";
  bubbel.className = "chat-bericht " + (isEigen ? "eigen" : "ander");
  bubbel.innerHTML = `<span class="chat-afzender"></span><span class="chat-tekst"></span>`;
  bubbel.querySelector(".chat-afzender").textContent = isEigen ? "Jij (beheerder)" : "Besteller";
  bubbel.querySelector(".chat-tekst").textContent = data.tekst || "";
  return bubbel;
}

function laadChat(id) {
  huidigeBestellingId = id;
  chatListenerId = id;
  chatTitel.textContent = "Chat over bestelling";
  chatBerichten.innerHTML = '<p class="chat-leeg">Bericht laden...</p>';

  window.db.ref("bestellingen/" + id + "/titel").once("value", (snap) => {
    if (snap.exists()) chatTitel.textContent = "Chat over: " + snap.val();
  });

  window.db.ref("bestellingen/" + id + "/chat").on("value", (snap) => {
    chatBerichten.innerHTML = "";
    if (!snap.exists()) {
      chatBerichten.innerHTML = '<p class="chat-leeg">Nog geen berichten.</p>';
      return;
    }
    snap.forEach((kind) => chatBerichten.appendChild(maakChatBericht(kind.val())));
    chatBerichten.scrollTop = chatBerichten.scrollHeight;
  });
}

chatFormulier.addEventListener("submit", async (event) => {
  event.preventDefault();
  const tekst = chatInvoerveld.value.trim();
  if (!tekst || !huidigeBestellingId) return;

  chatInvoerveld.value = "";
  try {
    await window.db.ref("bestellingen/" + huidigeBestellingId + "/chat").push({
      afzender: "beheerder",
      tekst: tekst,
      tijdstip: firebase.database.ServerValue.TIMESTAMP,
    });
  } catch (fout) {
    console.error(fout);
    chatInvoerveld.value = tekst;
  }
});
