// Este módulo exporta funções que renderizam HTML na página.
// Ele precisa dos dados e do estado da aplicação, que são passados como argumentos.

const getDisplayStage = (stage) => {
    const stageMap = {
        'I': 'Baby 1', 'II': 'Baby 2', 'III': 'Rookie', 'IV': 'Champion',
        'V': 'Ultimate', 'VI': 'Mega', 'VI+': 'Mega+'
    };
    return stageMap[stage] || stage;
};

export function handleImageError(element, digimonName) {
    const transparentPixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    element.onerror = null; 
    element.src = transparentPixel;
    console.warn(`A imagem para o Digimon "${digimonName}" não foi encontrada. Exibindo moldura vazia.`);
}

export function renderHistory(getHistory, performSearch, removeFromHistory) {
    const historyContainer = document.getElementById("history-container");
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
            <img class="digimon-frame" src="${imageUrl}" alt="${name}" onerror="this.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; console.warn('Imagem não encontrada para ${name}')">
            <span>${name}</span>
            <button class="history-delete-btn" title="Remover do histórico">×</button>
        `;
        card.querySelector('.history-delete-btn').onclick = (e) => {
            e.stopPropagation();
            removeFromHistory(name);
        };
        historyContainer.appendChild(card);
    });
}

export function renderFavorites(getFavorites, performSearch, removeFromFavorites) {
    const favoritesContainer = document.getElementById("favorites-container");
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
                <button class="favorite-delete-btn" title="Remover dos Favoritos">×</button>
                <img class="digimon-frame" src="${imageUrl}" alt="${name}" onerror="this.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; console.warn('Imagem não encontrada para ${name}')">
                <span>${name}</span>
            `;
            card.querySelector('.favorite-delete-btn').onclick = (e) => {
                e.stopPropagation();
                removeFromFavorites(name);
            };
            favoritesContainer.appendChild(card);
        });
    }
    updateScrollButtons();
}

export function updateScrollButtons() {
    const favoritesContainer = document.getElementById("favorites-container");
    const scrollLeftBtn = document.getElementById("scroll-left-btn");
    const scrollRightBtn = document.getElementById("scroll-right-btn");
    setTimeout(() => {
        const hasOverflow = favoritesContainer.scrollWidth > favoritesContainer.clientWidth;
        scrollLeftBtn.style.display = hasOverflow ? 'block' : 'none';
        scrollRightBtn.style.display = hasOverflow ? 'block' : 'none';
        if (!hasOverflow) return;
        scrollLeftBtn.disabled = favoritesContainer.scrollLeft < 1;
        scrollRightBtn.disabled = favoritesContainer.scrollLeft + favoritesContainer.clientWidth >= favoritesContainer.scrollWidth - 1;
    }, 100);
}

export function populateFilters(ALL_DIGIMON_DATA) {
    const attributeFilter = document.getElementById("attribute-filter");
    const stageFilter = document.getElementById("stage-filter");

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
        if (indexA === -1) return 1; if (indexB === -1) return -1;
        return indexA - indexB;
    }).forEach(stage => {
        stageFilter.innerHTML += `<option value="${stage}">${getDisplayStage(stage)}</option>`;
    });
}

export function renderDigimonList(paginatedDigimon) {
    const digimonListContainer = document.getElementById("digimon-list-container");
    digimonListContainer.innerHTML = '';
    if (paginatedDigimon.length === 0) {
        digimonListContainer.innerHTML = '<p class="text-muted text-center col-12">Nenhum Digimon encontrado com os filtros selecionados.</p>';
    } else {
        paginatedDigimon.forEach(digimon => {
            const imageUrl = `https://digimon-api.com/images/digimon/w/${digimon.Name.replace(/\s/g, '_')}.png`;
            const card = document.createElement('div');
            card.className = 'digimon-list-card';
            card.innerHTML = `
                <img class="digimon-frame" src="${imageUrl}" alt="${digimon.Name}" onerror="this.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; console.warn('Imagem não encontrada para ${digimon.Name}')">
                <p class="digimon-name">${digimon.Name}</p>
                <p class="digimon-stage">Estágio: ${getDisplayStage(digimon.Stage) || 'N/A'}</p> 
            `;
            card.onclick = () => {
                // Precisamos chamar a função de busca do main.js
                // Isso será tratado pela forma como a função é chamada em main.js
                document.dispatchEvent(new CustomEvent('performSearch', { detail: digimon.Name }));
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
            digimonListContainer.appendChild(card);
        });
    }
}

export function renderPagination(totalPages, currentPage, changePage) {
    const paginationContainer = document.getElementById("pagination-container");
    paginationContainer.innerHTML = '';
    if (totalPages <= 1) return;

    let paginationHTML = '<ul class="pagination">';
    paginationHTML += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#">Anterior</a></li>`;

    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow) startPage = Math.max(1, endPage - maxPagesToShow + 1);

    if (startPage > 1) {
        paginationHTML += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
        if (startPage > 2) paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `<li class="page-item ${i === currentPage ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    }
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        paginationHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>`;
    }
    paginationHTML += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#">Próxima</a></li>`;
    paginationHTML += '</ul>';
    paginationContainer.innerHTML = paginationHTML;

    // Adiciona eventos de clique dinamicamente
    paginationContainer.querySelector('li:first-child a').onclick = (e) => { e.preventDefault(); if (currentPage > 1) changePage(currentPage - 1); };
    paginationContainer.querySelector('li:last-child a').onclick = (e) => { e.preventDefault(); if (currentPage < totalPages) changePage(currentPage + 1); };
    paginationContainer.querySelectorAll('a[data-page]').forEach(a => {
        a.onclick = (e) => { e.preventDefault(); changePage(parseInt(a.dataset.page)); };
    });
}

export function buscarDigimon(name, ALL_DIGIMON_DATA, navigationHistory, isFavorite, toggleFavorite, navigateTo, navigateBack) {
    const resultadoDiv = document.getElementById("resultado");
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
                    <div class="evolution-card">
                        <img class="digimon-frame" src="${evoImageUrl}" alt="${evoName}" onerror="this.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';">
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
                    <div class="evolution-card">
                        <img class="digimon-frame" src="${preEvoImageUrl}" alt="${preEvo.Name}" onerror="this.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';">
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
                    <span class="favorite-star ${isFav ? 'favorited' : ''}" title="Adicionar/Remover dos Favoritos">★</span>
                </div>
            </div>
            <div class="card-body">
                <img src="${imageUrl}" alt="${encontrado.Name}" class="digimon-image digimon-frame" onerror="this.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';">
                <p><strong>Número:</strong> ${encontrado.Number || "Desconhecido"}</p>
                <p><strong>Estágio:</strong> ${getDisplayStage(encontrado.Stage) || "Desconhecido"}</p>
                <p class="mb-2"><strong>Atributo:</strong> ${encontrado.Attribute || "Desconhecido"}</p>
                <div style="clear: both;"></div>
                <h5 class="mt-4">Evoluções</h5>
                ${evolucoesHTML}
                <h5 class="pre-evolutions-title">Pré-evoluções</h5>
                ${preEvolucoesHTML}
            </div>
        </div>`;

        resultadoDiv.querySelector('.favorite-star').onclick = () => toggleFavorite(encontrado.Name);
        resultadoDiv.querySelectorAll('.evolution-card').forEach((card, index) => {
            const digimonName = card.querySelector('.card-title').textContent;
            card.onclick = () => navigateTo(digimonName);
        });
        
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