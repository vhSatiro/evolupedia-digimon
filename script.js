let ALL_DIGIMON_DATA = [];
let digimonNames = [];
let navigationHistory = [];

// --- CONSTANTES DE ELEMENTOS DO DOM ---
const searchInput = document.getElementById("search");
const resultadoDiv = document.getElementById("resultado");
const historyContainer = document.getElementById("history-container");
const favoritesContainer = document.getElementById("favorites-container");
const scrollLeftBtn = document.getElementById("scroll-left-btn");
const scrollRightBtn = document.getElementById("scroll-right-btn");
const digimonListContainer = document.getElementById("digimon-list-container");
const paginationContainer = document.getElementById("pagination-container");
const attributeFilter = document.getElementById("attribute-filter");
const stageFilter = document.getElementById("stage-filter");
const filterResultsCount = document.getElementById("filter-results-count");
let awesomplete;

// --- ESTADO DA APLICAÇÃO ---
let currentPage = 1;
const itemsPerPage = 18;
let currentFilters = { attribute: 'All', stage: 'All' };

// --- FUNÇÃO GLOBAL PARA MUDANÇA DE PÁGINA ---
// Precisa ser global para ser chamada pelo onclick="" no HTML da paginação
function changePage(page) {
    const totalPages = Math.ceil(getFilteredDigimon().length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderDigimonList();
}


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
const isFavorite = (name) => getFavorites().some(fav => fav.toLowerCase() === name.toLowerCase());

const toggleFavorite = (name) => {
    let favorites = getFavorites();
    const digimonIndex = favorites.findIndex(item => item.toLowerCase() === name.toLowerCase());
    if (digimonIndex > -1) {
        favorites.splice(digimonIndex, 1);
    } else {
        favorites.unshift(name);
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

// --- LÓGICA DA LISTAGEM GERAL DE DIGIMONS ---
function populateFilters() {
    const attributes = [...new Set(ALL_DIGIMON_DATA.map(d => d.Attribute).filter(Boolean))];
    attributeFilter.innerHTML = '<option value="All">Todos os Atributos</option>';
    attributes.sort().forEach(attr => {
        attributeFilter.innerHTML += `<option value="${attr}">${attr}</option>`;
    });

    const stages = [...new Set(ALL_DIGIMON_DATA.map(d => d.Stage).filter(Boolean))];
    stageFilter.innerHTML = '<option value="All">Todos os Estágios</option>';
    const stageOrder = ["I", "II", "III", "IV", "V", "VI", "VI+", "Armor", "Golden Armor", "Hybrid", "Human Hybrid", "Beast Hybrid", "Fusion Hybrid", "Transcendent Hybrid", "Free", "Unknown"];
    stages.sort((a, b) => {
        const indexA = stageOrder.indexOf(a);
        const indexB = stageOrder.indexOf(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    }).forEach(stage => {
        stageFilter.innerHTML += `<option value="${stage}">${stage}</option>`;
    });
}
const getFilteredDigimon = () => {
    return ALL_DIGIMON_DATA.filter(digimon => {
        const attributeMatch = currentFilters.attribute === 'All' || digimon.Attribute === currentFilters.attribute;
        const stageMatch = currentFilters.stage === 'All' || digimon.Stage === currentFilters.stage;
        return attributeMatch && stageMatch;
    });
};
function renderDigimonList() {
    const filteredDigimon = getFilteredDigimon();
    filterResultsCount.textContent = `${filteredDigimon.length} Digimon encontrados.`;

    const totalPages = Math.ceil(filteredDigimon.length / itemsPerPage);
    const paginatedDigimon = filteredDigimon.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    digimonListContainer.innerHTML = '';
    if (paginatedDigimon.length === 0) {
        digimonListContainer.innerHTML = '<p class="text-muted text-center col-12">Nenhum Digimon encontrado com os filtros selecionados.</p>';
    } else {
         paginatedDigimon.forEach(digimon => {
            const imageUrl = `https://digimon-api.com/images/digimon/w/${digimon.Name.replace(/\s/g, '_')}.png`;
            const card = document.createElement('div');
            card.className = 'digimon-list-card';
            card.onclick = () => {
                performSearch(digimon.Name);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
            card.innerHTML = `
                <img src="${imageUrl}" alt="${digimon.Name}" onerror="handleImageError(this, '${digimon.Name.replace(/'/g, "\\'")}')">
                <p class="digimon-name">${digimon.Name}</p>
                <p class="digimon-stage">Estágio: ${digimon.Stage || 'N/A'}</p>
            `;
            digimonListContainer.appendChild(card);
        });
    }
    renderPagination(totalPages);
}
function renderPagination(totalPages) {
    paginationContainer.innerHTML = '';
    if (totalPages <= 1) return;

    let paginationHTML = '<ul class="pagination">';
    paginationHTML += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" onclick="changePage(${currentPage - 1})">Anterior</a></li>`;

    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow) startPage = Math.max(1, endPage - maxPagesToShow + 1);

    if (startPage > 1) {
        paginationHTML += `<li class="page-item"><a class="page-link" onclick="changePage(1)">1</a></li>`;
        if (startPage > 2) paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `<li class="page-item ${i === currentPage ? 'active' : ''}"><a class="page-link" onclick="changePage(${i})">${i}</a></li>`;
    }
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        paginationHTML += `<li class="page-item"><a class="page-link" onclick="changePage(${totalPages})">${totalPages}</a></li>`;
    }
    paginationHTML += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" onclick="changePage(${currentPage + 1})">Próxima</a></li>`;
    paginationHTML += '</ul>';
    paginationContainer.innerHTML = paginationHTML;
}

// --- FETCH INICIAL E CONFIGURAÇÃO ---
fetch("digimon_data.json")
  .then(res => res.json())
  .then(data => {
    ALL_DIGIMON_DATA = data;
    digimonNames = data.map(d => d.Name);
    awesomplete = new Awesomplete(searchInput, { list: digimonNames, minChars: 1, autoFirst: true, filter: (text, input) => new RegExp(input.trim(), "i").test(text.toString()) });
    
    searchInput.addEventListener("awesomplete-selectcomplete", () => performSearch(searchInput.value));
    scrollLeftBtn.addEventListener('click', () => favoritesContainer.scrollBy({ left: -200 }));
    scrollRightBtn.addEventListener('click', () => favoritesContainer.scrollBy({ left: 200 }));
    favoritesContainer.addEventListener('scroll', updateScrollButtons);
    window.addEventListener('resize', updateScrollButtons);

    attributeFilter.addEventListener('change', (e) => {
        currentPage = 1;
        currentFilters.attribute = e.target.value;
        renderDigimonList();
    });
    stageFilter.addEventListener('change', (e) => {
        currentPage = 1;
        currentFilters.stage = e.target.value;
        renderDigimonList();
    });

    renderHistory();
    renderFavorites();
    populateFilters();
    renderDigimonList();
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

        let evolucoesHTML = "<p class='text-muted'>Nenhuma evolução cadastrada.</p>";
        if (Array.isArray(encontrado.EvolutionsList) && encontrado.EvolutionsList.length > 0) {
            evolucoesHTML = `<div class="evolutions-grid">${encontrado.EvolutionsList.map(evoName => {
                const evoImageUrl = `https://digimon-api.com/images/digimon/w/${evoName.replace(/\s/g, '_')}.png`;
                const evoDigimon = ALL_DIGIMON_DATA.find(d => d.Name === evoName);
                const evoAttribute = evoDigimon ? (evoDigimon.Attribute || 'None') : 'None';
                return `
                    <div class="evolution-card" onclick="navigateTo('${evoName.replace(/'/g, "\\'")}')">
                        <img src="${evoImageUrl}" alt="${evoName}" onerror="handleImageError(this, '${evoName.replace(/'/g, "\\'")}')">
                        <p class="card-title">${evoName}</p>
                        <p class="evolution-attribute attr-${evoAttribute.toLowerCase()}">${evoAttribute}</p>
                    </div>
                `;
            }).join('')}</div>`;
        }

        let preEvolucoesHTML = "<p class='text-muted'>Nenhuma pré-evolução cadastrada.</p>";
        const preEvolutionsList = ALL_DIGIMON_DATA.filter(d => d.EvolutionsList && d.EvolutionsList.includes(encontrado.Name));
        if (preEvolutionsList.length > 0) {
            preEvolucoesHTML = `<div class="evolutions-grid">${preEvolutionsList.map(preEvo => {
                const preEvoImageUrl = `https://digimon-api.com/images/digimon/w/${preEvo.Name.replace(/\s/g, '_')}.png`;
                return `
                    <div class="evolution-card" onclick="navigateTo('${preEvo.Name.replace(/'/g, "\\'")}')">
                        <img src="${preEvoImageUrl}" alt="${preEvo.Name}" onerror="handleImageError(this, '${preEvo.Name.replace(/'/g, "\\'")}')">
                        <p class="card-title">${preEvo.Name}</p>
                        <p class="evolution-attribute attr-${(preEvo.Attribute || 'None').toLowerCase()}">${preEvo.Attribute || 'None'}</p>
                    </div>
                `;
            }).join('')}</div>`;
        }

        resultadoDiv.innerHTML = `
        <div class="card border-info">
            <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
                <h2 class="h4 mb-0">${encontrado.Name}</h2>
                <div class="d-flex align-items-center">
                    <span class="favorite-star ${isFav ? 'favorited' : ''}" data-name="${encontrado.Name.replace(/'/g, "\\'")}" onclick="toggleFavorite('${encontrado.Name.replace(/'/g, "\\'")}')" title="Adicionar/Remover dos Favoritos">★</span>
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
        </div>`;

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