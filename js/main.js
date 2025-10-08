import { initializeTheme } from './theme.js';
import * as render from './render.js';

// --- INICIALIZAÇÃO DO TEMA ---
initializeTheme();

// --- ESTADO DA APLICAÇÃO ---
let ALL_DIGIMON_DATA = [];
let digimonNames = [];
let navigationHistory = [];
let currentPage = 1;
const itemsPerPage = 18;
let currentFilters = { attribute: 'All', stage: 'All' };

// --- ELEMENTOS DO DOM ---
const searchInput = document.getElementById("search");
const attributeFilter = document.getElementById("attribute-filter");
const stageFilter = document.getElementById("stage-filter");
const clearSearchBtn = document.getElementById("clear-search-btn");

// --- LÓGICA DE DADOS (HISTÓRICO E FAVORITOS) ---
const getHistory = () => JSON.parse(localStorage.getItem('digimonHistory')) || [];
const saveHistory = (history) => localStorage.setItem('digimonHistory', JSON.stringify(history));
const addToHistory = (name) => {
    let history = getHistory();
    history = history.filter(item => item.toLowerCase() !== name.toLowerCase());
    history.unshift(name);
    saveHistory(history.slice(0, 10));
    render.renderHistory(getHistory, performSearch, removeFromHistory);
};
const removeFromHistory = (name) => {
    let history = getHistory();
    history = history.filter(item => item.toLowerCase() !== name.toLowerCase());
    saveHistory(history);
    render.renderHistory(getHistory, performSearch, removeFromHistory);
};

const getFavorites = () => JSON.parse(localStorage.getItem('digimonFavorites')) || [];
const saveFavorites = (favorites) => localStorage.setItem('digimonFavorites', JSON.stringify(favorites));
const isFavorite = (name) => getFavorites().some(fav => fav.toLowerCase() === name.toLowerCase());
const toggleFavorite = (name) => {
    let favorites = getFavorites();
    const isFav = isFavorite(name);
    if (isFav) {
        favorites = favorites.filter(item => item.toLowerCase() !== name.toLowerCase());
    } else {
        favorites.unshift(name);
    }
    saveFavorites(favorites);
    render.renderFavorites(getFavorites, performSearch, removeFromFavorites);
    // Re-renderiza o card principal se ele estiver visível
    if (navigationHistory.length > 0 && navigationHistory[navigationHistory.length - 1].toLowerCase() === name.toLowerCase()) {
        buscarDigimon(name);
    }
};
const removeFromFavorites = (name) => {
    let favorites = getFavorites();
    favorites = favorites.filter(item => item.toLowerCase() !== name.toLowerCase());
    saveFavorites(favorites);
    render.renderFavorites(getFavorites, performSearch, removeFromFavorites);
};


// --- LÓGICA DE NAVEGAÇÃO E BUSCA ---
function performSearch(name) {
    navigationHistory = [name];
    addToHistory(name);
    buscarDigimon(name);
}
function navigateTo(name) {
    navigationHistory.push(name);
    buscarDigimon(name);
}
function navigateBack() {
    if (navigationHistory.length > 1) {
        navigationHistory.pop();
        buscarDigimon(navigationHistory[navigationHistory.length - 1]);
    }
}
function buscarDigimon(name) {
    render.buscarDigimon(name, ALL_DIGIMON_DATA, navigationHistory, isFavorite, toggleFavorite, navigateTo, navigateBack);
}
function limparBusca() {
    const resultadoDiv = document.getElementById("resultado");
    searchInput.value = "";
    resultadoDiv.innerHTML = `<p class="text-muted text-center">Digite o nome de um Digimon para começar a busca.</p>`;
    navigationHistory = [];
    searchInput.focus();
}

// --- LÓGICA DA LISTAGEM E PAGINAÇÃO ---
function getFilteredDigimon() {
    return ALL_DIGIMON_DATA.filter(digimon => {
        const attributeMatch = currentFilters.attribute === 'All' || digimon.Attribute === currentFilters.attribute;
        const stageMatch = currentFilters.stage === 'All' || digimon.Stage === currentFilters.stage;
        return attributeMatch && stageMatch;
    });
}
function updateAndRenderList() {
    const filtered = getFilteredDigimon();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    document.getElementById("filter-results-count").textContent = `${filtered.length} Digimon encontrados.`;
    render.renderDigimonList(paginated);
    render.renderPagination(totalPages, currentPage, changePage);
}
function changePage(page) {
    currentPage = page;
    updateAndRenderList();
}


// --- INICIALIZAÇÃO DA APLICAÇÃO ---
async function initializeApp() {
    try {
        const res = await fetch("data/digimon_data.json");
        ALL_DIGIMON_DATA = await res.json();
        digimonNames = ALL_DIGIMON_DATA.map(d => d.Name);
        
        // Inicializa o autocomplete
        new Awesomplete(searchInput, { list: digimonNames, minChars: 1, autoFirst: true });

        // Popula filtros e renderiza listas iniciais
        render.populateFilters(ALL_DIGIMON_DATA);
        render.renderHistory(getHistory, performSearch, removeFromHistory);
        render.renderFavorites(getFavorites, performSearch, removeFromFavorites);
        updateAndRenderList();
        
        // Configura eventos
        setupEventListeners();

    } catch (error) {
        console.error("Falha ao carregar os dados dos Digimons:", error);
        document.getElementById("resultado").innerHTML = `<p class="alert alert-danger">Não foi possível carregar os dados. Tente recarregar a página.</p>`;
    }
}

function setupEventListeners() {
    searchInput.addEventListener("awesomplete-selectcomplete", (e) => performSearch(e.text.value));
    
    document.getElementById("scroll-left-btn").addEventListener('click', () => document.getElementById("favorites-container").scrollBy({ left: -200 }));
    document.getElementById("scroll-right-btn").addEventListener('click', () => document.getElementById("favorites-container").scrollBy({ left: 200 }));
    document.getElementById("favorites-container").addEventListener('scroll', render.updateScrollButtons);
    window.addEventListener('resize', render.updateScrollButtons);

    attributeFilter.addEventListener('change', (e) => {
        currentPage = 1;
        currentFilters.attribute = e.target.value;
        updateAndRenderList();
    });
    stageFilter.addEventListener('change', (e) => {
        currentPage = 1;
        currentFilters.stage = e.target.value;
        updateAndRenderList();
    });

    clearSearchBtn.addEventListener('click', limparBusca);

    // Evento customizado para permitir que os cards da lista chamem a busca
    document.addEventListener('performSearch', (e) => performSearch(e.detail));
}

// Inicia a aplicação
initializeApp();