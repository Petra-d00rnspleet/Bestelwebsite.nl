// ============================================================
// Besteller: formulier, "mijn bestellingen", detail en chat
// ============================================================

const LOKALE_SLEUTEL = "mijn-bestelling-ids";

// -------- Elementen --------

const tabNieuw = document.getElementById("tab-nieuw");
const tabMijn = document.getElementById("tab-mijn");

const weergaveFormulier = document.getElementById("weergave-formulier");
const weergaveMijn = document.getElementById("weergave-mijn");
const weergaveDetail = document.getElementById("weergave-detail");
const weergaveChat = document.getElementById("weergave-chat");

const formulier = document.getElementById("bestel-formulier");
const titelVeld = document.getElementById("titel");
const omschrijvingVeld = document.getElementById("omschrijving");
const verzendKnop = document.getElementById("verzend-knop");
const statusTekst = document.getElementById("status-tekst");
const ontvangenStempel = document.getElementById("ontvangen-stempel");
const bonNummerEl = document.getElementById("bon-nummer");

const mijnLijst = document.getElementById("mijn-lijst");
const detailKaart = document.getElementById("detail-kaart");
const detailTerug = document.getElementById("detail-terug");
const chatTerug = document.getElementById("chat-terug");
const chatTitel = document.getElementById("chat-titel");
const chatBerichten = document.getElementById("chat-berichten");
const chatFormulier = document.getElementById("chat-formulier");
const chatInvoerveld = document.getElementById("chat-invoerveld");

let huidigeBestellingId = null;
let huidigeDetailListener = null;
let huidigeChatListener = null;

// -------- Lokale opslag van "mijn" bestelling-ids --------

function haalMijnIds() {
  try {
    const ruw = localStorage.getItem(LOKALE_SLEUTEL);
    return ruw ? JSON.parse(ruw) : [];
  } catch (fout) {
    return [];
  }
}

function voegMijnIdToe(id) {
  const ids = haalMijnIds();
  if (!ids.includes(id)) {
    ids.unshift(id);
    localStorage.setItem(LOKALE_SLEUTEL, JSON.stringify(ids));
  }
}

function verwijderMijnId(id) {
  const ids = haalMijnIds().filter((x) => x !== id);
  localStorage.setItem(LOKALE_SLEUTEL, JSON.stringify(ids));
}

// -------- Weergave wisselen --------

function stopListeners() {
  if (huidigeDetailListener) {
    window.db.ref("bestellingen/" + huidigeDetailListener).off();
    huidigeDetailListener = null;
  }
  if (huidigeChatListener) {
    window.db.ref("bestellingen/" + huidigeChatListener + "/chat").off();
    huidigeChatListener = null;
  }
}

function toonWeergave(naam, id) {
  stopListeners();
  weergaveFormulier.hidden = naam !== "formulier";
  weergaveMijn.hidden = naam !== "mijn";
  weergaveDetail.hidden = naam !== "detail";
  weergaveChat.hidden = naam !== "chat";

  tabNieuw.classList.toggle("actief", naam === "formulier");
  tabMijn.classList.toggle("actief", naam === "mijn" || naam === "detail" || naam === "chat");

  if (naam === "mijn") laadMijnBestellingen();
  if (naam === "detail") laadDetail(id);
  if (naam === "chat") laadChat(id);
}

tabNieuw.addEventListener("click", () => toonWeergave("formulier"));
tabMijn.addEventListener("click", () => toonWeergave("mijn"));
detailTerug.addEventListener("click", () => toonWeergave("mijn"));
chatTerug.addEventListener("click", () => toonWeergave("detail", huidigeBestellingId));

// -------- Formulier verzenden --------

bonNummerEl.textContent = "nr. " + Math.floor(1000 + Math.random() * 9000);

formulier.addEventListener("submit", async (event) => {
  event.preventDefault();

  const titel = titelVeld.value.trim();
  const omschrijving = omschrijvingVeld.value.trim();

  if (!titel || !omschrijving) {
    statusTekst.textContent = "Vul zowel een titel als een omschrijving in.";
    statusTekst.className = "status-tekst fout";
    return;
  }

  verzendKnop.disabled = true;
  statusTekst.textContent = "Bezig met verzenden...";
  statusTekst.className = "status-tekst";

  try {
    const nieuweRef = await window.db.ref("bestellingen").push({
      titel: titel,
      omschrijving: omschrijving,
      status: "nieuw",
      aangemaaktOp: firebase.database.ServerValue.TIMESTAMP,
    });

    voegMijnIdToe(nieuweRef.key);

    statusTekst.textContent = "Verstuurd — de beheerder heeft je bestelling ontvangen.";
    statusTekst.className = "status-tekst goed";
    ontvangenStempel.classList.add("zichtbaar");
    formulier.reset();
    bonNummerEl.textContent = "nr. " + Math.floor(1000 + Math.random() * 9000);

    setTimeout(() => ontvangenStempel.classList.remove("zichtbaar"), 3000);
  } catch (fout) {
    console.error(fout);
    statusTekst.textContent =
      "Verzenden is mislukt. Controleer je internetverbinding en de Firebase-instellingen.";
    statusTekst.className = "status-tekst fout";
  } finally {
    verzendKnop.disabled = false;
  }
});

// -------- Mijn bestellingen (lijst) --------

function formatteerDatum(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleString("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status) {
  const labels = { nieuw: "Nieuw", "in-behandeling": "In behandeling", afgerond: "Afgerond" };
  return labels[status] || "Nieuw";
}

async function laadMijnBestellingen() {
  const ids = haalMijnIds();

  if (ids.length === 0) {
    mijnLijst.innerHTML = '<p class="leeg-melding">Je hebt nog geen bestellingen geplaatst.</p>';
    return;
  }

  mijnLijst.innerHTML = '<p class="leeg-melding">Bestellingen laden...</p>';

  const resultaten = await Promise.all(
    ids.map((id) =>
      window.db
        .ref("bestellingen/" + id)
        .once("value")
        .then((snap) => ({ id, data: snap.val() }))
    )
  );

  // Bestellingen die inmiddels verwijderd zijn opruimen uit de lokale lijst
  resultaten
    .filter((r) => !r.data)
    .forEach((r) => verwijderMijnId(r.id));

  const bestaande = resultaten.filter((r) => r.data);

  if (bestaande.length === 0) {
    mijnLijst.innerHTML = '<p class="leeg-melding">Je hebt nog geen bestellingen geplaatst.</p>';
    return;
  }

  mijnLijst.innerHTML = "";
  bestaande.forEach(({ id, data }) => {
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
        <span class="pijl">Bekijken &rarr;</span>
      </div>
    `;
    knop.querySelector("h2").textContent = data.titel || "(zonder titel)";
    knop.querySelector(".mini-kaart-datum").textContent = formatteerDatum(data.aangemaaktOp);
    knop.querySelector(".mini-kaart-voorbeeld").textContent = data.omschrijving || "";
    knop.querySelector(".status-badge").textContent = statusLabel(data.status);
    knop.addEventListener("click", () => toonWeergave("detail", id));
    mijnLijst.appendChild(knop);
  });
}

// -------- Detail --------

function laadDetail(id) {
  huidigeBestellingId = id;
  huidigeDetailListener = id;
  detailKaart.innerHTML = '<p class="leeg-melding">Laden...</p>';

  window.db.ref("bestellingen/" + id).on("value", (snap) => {
    const data = snap.val();

    if (!data) {
      verwijderMijnId(id);
      detailKaart.innerHTML =
        '<p class="leeg-melding">Deze bestelling bestaat niet meer.</p>';
      return;
    }

    detailKaart.innerHTML = `
      <div class="detail-kop">
        <div>
          <h2></h2>
          <span class="mini-kaart-datum"></span>
        </div>
        <span class="status-badge" data-status="${data.status || "nieuw"}"></span>
      </div>
      <p class="detail-omschrijving"></p>
      <div class="detail-acties">
        <button type="button" class="chat-knop">&#128172; Chat met de beheerder</button>
      </div>
    `;
    detailKaart.querySelector("h2").textContent = data.titel || "(zonder titel)";
    detailKaart.querySelector(".mini-kaart-datum").textContent = formatteerDatum(data.aangemaaktOp);
    detailKaart.querySelector(".status-badge").textContent = statusLabel(data.status);
    detailKaart.querySelector(".detail-omschrijving").textContent = data.omschrijving || "";
    detailKaart.querySelector(".chat-knop").addEventListener("click", () => toonWeergave("chat", id));
  });
}

// -------- Chat --------

function maakChatBericht(data) {
  const bubbel = document.createElement("div");
  const isEigen = data.afzender === "besteller";
  bubbel.className = "chat-bericht " + (isEigen ? "eigen" : "ander");
  bubbel.innerHTML = `<span class="chat-afzender"></span><span class="chat-tekst"></span>`;
  bubbel.querySelector(".chat-afzender").textContent = isEigen ? "Jij" : "Beheerder";
  bubbel.querySelector(".chat-tekst").textContent = data.tekst || "";
  return bubbel;
}

function laadChat(id) {
  huidigeBestellingId = id;
  huidigeChatListener = id;
  chatTitel.textContent = "Chat over bestelling";
  chatBerichten.innerHTML = '<p class="chat-leeg">Bericht laden...</p>';

  window.db.ref("bestellingen/" + id + "/titel").once("value", (snap) => {
    if (snap.exists()) chatTitel.textContent = "Chat over: " + snap.val();
  });

  window.db.ref("bestellingen/" + id + "/chat").on("value", (snap) => {
    chatBerichten.innerHTML = "";
    if (!snap.exists()) {
      chatBerichten.innerHTML = '<p class="chat-leeg">Nog geen berichten. Stel gerust een vraag!</p>';
      return;
    }
    snap.forEach((kind) => {
      chatBerichten.appendChild(maakChatBericht(kind.val()));
    });
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
      afzender: "besteller",
      tekst: tekst,
      tijdstip: firebase.database.ServerValue.TIMESTAMP,
    });
  } catch (fout) {
    console.error(fout);
    chatInvoerveld.value = tekst;
  }
});
