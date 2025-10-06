let ALL_DIGIMON_DATA = [];
let digimonNames = [];
let navigationHistory = [];

const searchInput = document.getElementById("search");
const resultadoDiv = document.getElementById("resultado");
const historyContainer = document.getElementById("history-container");
const favoritesContainer = document.getElementById("favorites-container");
const scrollLeftBtn = document.getElementById("scroll-left-btn");
const scrollRightBtn = document.getElementById("scroll-right-btn");
let awesomplete;

// --- FUNÇÕES DE LÓGICA ---
function handleImageError(element, digimonName) {
    element.style.display = 'none';
    console.warn(`A imagem para o Digimon "${digimonName}" não foi encontrada.`);
}

// --- LÓGICA DO HISTÓRICO ---
const getHistory = () => JSON.parse(localStorage.getItem('digimonHistory')) || [];
const saveHistory = (history) => localStorage.setItem('digimonHistory', JSON.stringify(history));
const addToHistory = (name) => {
    let history = getHistory();
    history = history.filter(item => item.toLowerCase() !== name.toLowerCase());
    history.unshift(name);
    saveHistory(history.slice(0, 10));
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

// --- LÓGICA DOS FAVORITOS ---
const getFavorites = () => JSON.parse(localStorage.getItem('digimonFavorites')) || [];
const saveFavorites = (favorites) => localStorage.setItem('digimonFavorites', JSON.stringify(favorites));

const isFavorite = (name) => {
    const favorites = getFavorites();
    return favorites.some(fav => fav.toLowerCase() === name.toLowerCase());
};

const toggleFavorite = (name) => {
    let favorites = getFavorites();
    const digimonIndex = favorites.findIndex(item => item.toLowerCase() === name.toLowerCase());

    if (digimonIndex > -1) {
        favorites.splice(digimonIndex, 1); // Remove
    } else {
        favorites.unshift(name); // Adiciona no início
    }
    saveFavorites(favorites);

    const currentStar = resultadoDiv.querySelector('.favorite-star');
    if (currentStar && currentStar.dataset.name.toLowerCase() === name.toLowerCase()) {
        currentStar.classList.toggle('favorited', digimonIndex === -1);
    }
    renderFavorites();
};

const removeFromFavorites = (name) => {
    event.stopPropagation();
    let favorites = getFavorites();
    favorites = favorites.filter(item => item.toLowerCase() !== name.toLowerCase());
    saveFavorites(favorites);
    renderFavorites();
};

const updateScrollButtons = () => {
    setTimeout(() => {
        const hasOverflow = favoritesContainer.scrollWidth > favoritesContainer.clientWidth;
        scrollLeftBtn.style.display = hasOverflow ? 'block' : 'none';
        scrollRightBtn.style.display = hasOverflow ? 'block' : 'none';

        if (!hasOverflow) return;

        scrollLeftBtn.disabled = favoritesContainer.scrollLeft < 1;
        scrollRightBtn.disabled = favoritesContainer.scrollLeft + favoritesContainer.clientWidth >= favoritesContainer.scrollWidth - 1;
    }, 100);
};

const renderFavorites = () => {
    const favorites = getFavorites();
    favoritesContainer.innerHTML = '';
    if (favorites.length === 0) {
        favoritesContainer.innerHTML = '<p class="text-muted small">Nenhum favorito adicionado.</p>';
    } else {
        favorites.forEach(name => {
            const imageUrl = `https://digimon-api.com/images/digimon/w/${name.replace(/\s/g, '_')}.png`;
            const card = document.createElement('div');
            card.className = 'favorite-card';
            card.onclick = () => performSearch(name);
            card.innerHTML = `
                <button class="favorite-delete-btn" onclick="removeFromFavorites('${name.replace(/'/g, "\\'")}')" title="Remover dos Favoritos">×</button>
                <img src="${imageUrl}" alt="${name}" onerror="handleImageError(this, '${name.replace(/'/g, "\\'")}')">
                <span>${name}</span>
            `;
            favoritesContainer.appendChild(card);
        });
    }
    updateScrollButtons();
};

// --- FETCH INICIAL E CONFIGURAÇÃO ---
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
    });
    searchInput.addEventListener("awesomplete-selectcomplete", () => performSearch(searchInput.value));
    
    renderHistory();
    renderFavorites();

    // Listeners para os botões de rolagem dos favoritos
    scrollLeftBtn.addEventListener('click', () => favoritesContainer.scrollBy({ left: -200 }));
    scrollRightBtn.addEventListener('click', () => favoritesContainer.scrollBy({ left: 200 }));
    favoritesContainer.addEventListener('scroll', updateScrollButtons);
    window.addEventListener('resize', updateScrollButtons);
  });

// --- LÓGICA DE BUSCA E NAVEGAÇÃO ---
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
        const imageUrl = `https://digimon-api.com/images/digimon/w/${encontrado.Name.replace(/\s/g, '_')}.png`;
        const isFav = isFavorite(encontrado.Name);

        // LÓGICA DAS EVOLUÇÕES (sem alteração)
        let evolucoesHTML = "<p class='text-muted'>Nenhuma evolução cadastrada.</p>";
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
        }

        // LÓGICA DAS PRÉ-EVOLUÇÕES (sem alteração)
        let preEvolucoesHTML = "<p class='text-muted'>Nenhuma pré-evolução cadastrada.</p>";
        const preEvolutionsList = ALL_DIGIMON_DATA.filter(digimon => 
            digimon.EvolutionsList && digimon.EvolutionsList.includes(encontrado.Name)
        );
        if (preEvolutionsList.length > 0) {
            const preEvolucoesCards = preEvolutionsList.map(preEvoDigimon => {
                const preEvoName = preEvoDigimon.Name;
                const preEvoImageUrl = `https://digimon-api.com/images/digimon/w/${preEvoName.replace(/\s/g, '_')}.png`;
                const preEvoAttribute = preEvoDigimon.Attribute || 'None';
                const attributeClass = preEvoAttribute.toLowerCase();
                return `
                    <div class="evolution-card" onclick="navigateTo('${preEvoName.replace(/'/g, "\\'")}')">
                        <img src="${preEvoImageUrl}" alt="${preEvoName}" onerror="handleImageError(this, '${preEvoName.replace(/'/g, "\\'")}')">
                        <p class="card-title">${preEvoName}</p>
                        <p class="evolution-attribute attr-${attributeClass}">${preEvoAttribute}</p>
                    </div>
                `;
            }).join('');
            preEvolucoesHTML = `<div class="evolutions-grid">${preEvolucoesCards}</div>`;
        }

        // --- TEMPLATE HTML ATUALIZADO COM ÍCONE DE FAVORITO ---
        resultadoDiv.innerHTML = `
        <div class="card border-info">
            <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
                <h2 class="h4 mb-0">${encontrado.Name}</h2>
                <div class="d-flex align-items-center">
                    <span 
                        class="favorite-star ${isFav ? 'favorited' : ''}" 
                        data-name="${encontrado.Name.replace(/'/g, "\\'")}"
                        onclick="toggleFavorite('${encontrado.Name.replace(/'/g, "\\'")}')"
                        title="Adicionar/Remover dos Favoritos"
                    >★</span>
                </div>
            </div>
            <div class="card-body">
                <img src="${imageUrl}" alt="${encontrado.Name}" class="digimon-image" onerror="handleImageError(this, '${encontrado.Name.replace(/'/g, "\\'")}')">
                <p><strong>Número:</strong> ${encontrado.Number || "Desconhecido"}</p>
                <p><strong>Estágio:</strong> ${encontrado.Stage || "Desconhecido"}</p>
                <p class="mb-2"><strong>Atributo:</strong> ${encontrado.Attribute || "Desconhecido"}</p>
                <div style="clear: both;"></div>
                <h5 class="mt-4">Evoluções</h5>
                ${evolucoesHTML}
                <h5 class="pre-evolutions-title">Pré-evoluções</h5>
                ${preEvolucoesHTML}
            </div>
        </div>
        `;

        if (navigationHistory.length > 1) {
            const headerDiv = resultadoDiv.querySelector('.card-header > div');
            const backButton = document.createElement('button');
            backButton.className = 'btn btn-sm btn-light ms-3';
            backButton.innerText = '‹ Voltar';
            backButton.onclick = navigateBack;
            headerDiv.appendChild(backButton);
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