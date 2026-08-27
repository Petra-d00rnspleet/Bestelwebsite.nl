const formulier = document.getElementById("bestel-formulier");
const titelVeld = document.getElementById("titel");
const omschrijvingVeld = document.getElementById("omschrijving");
const verzendKnop = document.getElementById("verzend-knop");
const statusTekst = document.getElementById("status-tekst");
const ontvangenStempel = document.getElementById("ontvangen-stempel");
const bonNummerEl = document.getElementById("bon-nummer");

// Toon een voorlopig volgnummer zodra de pagina laadt, puur cosmetisch —
// het echte record krijgt zijn eigen unieke id van Firebase.
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
    await window.db.ref("bestellingen").push({
      titel: titel,
      omschrijving: omschrijving,
      status: "nieuw",
      aangemaaktOp: firebase.database.ServerValue.TIMESTAMP,
    });

    statusTekst.textContent = "Verstuurd — de beheerder heeft je bestelling ontvangen.";
    statusTekst.className = "status-tekst goed";
    ontvangenStempel.classList.add("zichtbaar");
    formulier.reset();
    bonNummerEl.textContent = "nr. " + Math.floor(1000 + Math.random() * 9000);

    setTimeout(() => {
      ontvangenStempel.classList.remove("zichtbaar");
    }, 3000);
  } catch (fout) {
    console.error(fout);
    statusTekst.textContent =
      "Verzenden is mislukt. Controleer je internetverbinding en de Firebase-instellingen.";
    statusTekst.className = "status-tekst fout";
  } finally {
    verzendKnop.disabled = false;
  }
});
