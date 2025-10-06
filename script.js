let ALL_DIGIMON_DATA = [];
let digimonNames = [];
let navigationHistory = [];

const searchInput = document.getElementById("search");
const resultadoDiv = document.getElementById("resultado");
const historyContainer = document.getElementById("history-container");
let awesomplete;

// --- FUNÇÕES DE LÓGICA ---

// Função para lidar com erros de carregamento de imagem
function handleImageError(element, digimonName) {
    // Esconde o elemento da imagem para não mostrar um ícone quebrado
    element.style.display = 'none';
    // Registra um aviso no console do desenvolvedor com o nome do Digimon
    console.warn(`A imagem para o Digimon "${digimonName}" não foi encontrada na API.`);
}

// --- LÓGICA DO HISTÓRICO ---
const getHistory = () => JSON.parse(localStorage.getItem('digimonHistory')) || [];
const saveHistory = (history) => localStorage.setItem('digimonHistory', JSON.stringify(history));
const addToHistory = (name) => {
    let history = getHistory();
    history = history.filter(item => item.toLowerCase() !== name.toLowerCase());
    history.unshift(name);
    const slicedHistory = history.slice(0, 10);
    saveHistory(slicedHistory);
};
const removeFromHistory = (name) => {
    event.stopPropagation();
    let history = getHistory();
    history = history.filter(item => item.toLowerCase() !== name.toLowerCase());
    saveHistory(history);
    renderHistory();
};
const renderHistory = () => {
    const history = getHistory();
    historyContainer.innerHTML = '';
    if (history.length === 0) {
        historyContainer.innerHTML = '<p class="text-muted small">Nenhuma busca recente.</p>';
        return;
    }
    history.forEach(name => {
        const imageUrl = `https://digimon-api.com/images/digimon/w/${name.replace(/\s/g, '_')}.png`;
        const card = document.createElement('div');
        card.className = 'history-card';
        card.onclick = () => performSearch(name);
        card.innerHTML = `
            <img src="${imageUrl}" alt="${name}" onerror="handleImageError(this, '${name.replace(/'/g, "\\'")}')">
            <span>${name}</span>
            <button class="history-delete-btn" onclick="removeFromHistory('${name.replace(/'/g, "\\'")}')" title="Remover do histórico">×</button>
        `;
        historyContainer.appendChild(card);
    });
};

// --- FIM DA LÓGICA DO HISTÓRICO ---

fetch("digimon_data.json")
  .then(res => res.json())
  .then(data => {
    ALL_DIGIMON_DATA = data;
    digimonNames = data.map(d => d.Name);
    awesomplete = new Awesomplete(searchInput, {
        list: digimonNames,
        minChars: 1,
        autoFirst: true,
        filter: (text, input) => new RegExp(input.trim(), "i").test(text.toString()),
        sort: (a, b) => {
            const inputVal = searchInput.value.toLowerCase();
            const aStartsWith = a.value.toLowerCase().startsWith(inputVal);
            const bStartsWith = b.value.toLowerCase().startsWith(inputVal);
            if (aStartsWith && !bStartsWith) return -1;
            if (!aStartsWith && bStartsWith) return 1;
            return a.value.localeCompare(b.value);
        }
    });
    searchInput.addEventListener("awesomplete-selectcomplete", () => performSearch(searchInput.value));
    
    renderHistory();
  });

function performSearch(name) {
    navigationHistory = [name];
    addToHistory(name);
    renderHistory();
    buscarDigimon(name);
}

function navigateTo(name) {
    navigationHistory.push(name);
    buscarDigimon(name);
}

function navigateBack() {
    if (navigationHistory.length > 1) {
        navigationHistory.pop();
        const previousDigimonName = navigationHistory[navigationHistory.length - 1];
        buscarDigimon(previousDigimonName);
    }
}

function buscarDigimon(name) {
    const nomeNormalizado = name.trim().toLowerCase();
    resultadoDiv.innerHTML = "";
    const encontrado = ALL_DIGIMON_DATA.find(d => d.Name.trim().toLowerCase() === nomeNormalizado);
    
    if (encontrado) {
        let evolucoesHTML = "";
        const imageUrl = `https://digimon-api.com/images/digimon/w/${encontrado.Name.replace(/\s/g, '_')}.png`;

        if (Array.isArray(encontrado.EvolutionsList) && encontrado.EvolutionsList.length > 0) {
            const evolucoesCards = encontrado.EvolutionsList.map(evoName => {
                const evoImageUrl = `https://digimon-api.com/images/digimon/w/${evoName.replace(/\s/g, '_')}.png`;
                
                const evoDigimon = ALL_DIGIMON_DATA.find(d => d.Name === evoName);
                const evoAttribute = evoDigimon ? (evoDigimon.Attribute || 'None') : 'None';
                const attributeClass = evoAttribute.toLowerCase();

                return `
                    <div class="evolution-card" onclick="navigateTo('${evoName.replace(/'/g, "\\'")}')">
                        <img src="${evoImageUrl}" alt="${evoName}" onerror="handleImageError(this, '${evoName.replace(/'/g, "\\'")}')">
                        <p class="card-title">${evoName}</p>
                        <p class="evolution-attribute attr-${attributeClass}">${evoAttribute}</p>
                    </div>
                `;
            }).join('');
            evolucoesHTML = `<div class="evolutions-grid">${evolucoesCards}</div>`;
        } else {
            evolucoesHTML = "<p class='text-muted'>Nenhuma evolução cadastrada.</p>";
        }

        resultadoDiv.innerHTML = `
        <div class="card border-info">
            <div class="card-header bg-info text-white position-relative">
            <h2 class="h4 mb-0">${encontrado.Name}</h2>
            </div>
            <div class="card-body">
                <img src="${imageUrl}" alt="${encontrado.Name}" class="digimon-image" onerror="handleImageError(this, '${encontrado.Name.replace(/'/g, "\\'")}')">
                <p><strong>Número:</strong> ${encontrado.Number || "Desconhecido"}</p>
                <p><strong>Estágio:</strong> ${encontrado.Stage || "Desconhecido"}</p>
                <p class="mb-2"><strong>Atributo:</strong> ${encontrado.Attribute || "Desconhecido"}</p>
                <div style="clear: both;"></div>
                <h5 class="mt-4">Evoluções</h5>
                ${evolucoesHTML}
            </div>
        </div>
        `;

        if (navigationHistory.length > 1) {
            const cardHeader = resultadoDiv.querySelector('.card-header');
            const backButton = document.createElement('button');
            backButton.className = 'btn btn-sm btn-light position-absolute top-50 end-0 translate-middle-y me-2';
            backButton.innerText = '‹ Voltar';
            backButton.onclick = navigateBack;
            cardHeader.appendChild(backButton);
        }
        
    } else {
        resultadoDiv.innerHTML = `<p class="alert alert-danger">Nenhum Digimon encontrado com o nome exato "${name}".</p>`;
    }
}

function limparBusca() {
  searchInput.value = "";
  resultadoDiv.innerHTML = `<p class="text-muted text-center">Digite o nome de um Digimon para começar a busca.</p>`;
  navigationHistory = [];
  searchInput.focus();
}