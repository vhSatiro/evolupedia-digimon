let digimons = [];

async function loadData() {
  const response = await fetch("digimon_data.json");
  digimons = await response.json();
}

// Similaridade simples
function similarity(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();
  if (a === b) return 0;
  if (b.includes(a)) return 1;
  if (a.includes(b)) return 1;
  return Math.abs(a.length - b.length) + 2;
}

function updateSuggestions() {
  const query = document.getElementById("searchInput").value.trim().toLowerCase();
  const suggestionBox = document.getElementById("suggestions");

  if (!query) {
    suggestionBox.style.display = "none";
    return;
  }

  const regex = new RegExp(query, "i");
  let results = digimons
    .filter(d => regex.test(d.Name))
    .map(d => ({ name: d.Name, score: similarity(query, d.Name) }))
    .sort((a, b) => a.score - b.score)
    .map(d => d.name);

  if (results.length > 0) {
    suggestionBox.innerHTML = results.map(r => `<option value="${r}">${r}</option>`).join("");
    suggestionBox.style.display = "block";
  } else {
    suggestionBox.style.display = "none";
  }
}

function selectSuggestion(value) {
  document.getElementById("searchInput").value = value;
  document.getElementById("suggestions").style.display = "none";
  searchDigimon();
}

function handleKey(event) {
  const suggestionBox = document.getElementById("suggestions");

  if (event.key === "Enter") {
    event.preventDefault();
    if (suggestionBox.style.display !== "none" && suggestionBox.value) {
      selectSuggestion(suggestionBox.value);
    } else {
      searchDigimon();
    }
  }
  if (event.key === "ArrowDown" && suggestionBox.style.display !== "none") {
    suggestionBox.focus();
  }
}

function searchDigimon() {
  const query = document.getElementById("searchInput").value.trim().toLowerCase();
  const resultBox = document.getElementById("result");

  const digimon = digimons.find(d => d.Name.toLowerCase() === query);

  if (digimon) {
    resultBox.style.display = "block";
    resultBox.innerHTML = `
      <h2>${digimon.Name}</h2>
      <p><strong>Atributo:</strong> ${digimon.Attribute || "Desconhecido"}</p>
      <p><strong>Stage:</strong> ${digimon.Stage}</p>
      <div class="evolutions">
        <strong>Evoluções:</strong><br>
        ${digimon.EvolutionsList.map(e => `<span>${e}</span>`).join(" ")}
      </div>
    `;
  } else {
    resultBox.style.display = "block";
    resultBox.innerHTML = `<p>❌ Digimon não encontrado.</p>`;
  }
}

loadData();
