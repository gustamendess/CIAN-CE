/**
 * Catálogo Mobile - Gerenciamento de Filtros e Espécies
 */

class MobileCatalog {
  constructor(speciesData) {
    this.allSpecies = speciesData;
    this.filteredSpecies = [...speciesData];
    this.activeFilters = new Map();
    this.init();
  }

  init() {
    this.detectDevice();
    if (this.isMobile()) {
      this.buildCatalogUI();
      this.attachEventListeners();
      this.renderCatalog();
    }
  }

  detectDevice() {
    this.isMobileDevice = window.matchMedia('(max-width: 767px)').matches;
  }

  isMobile() {
    return this.isMobileDevice;
  }

  // Construir interface do catálogo
  buildCatalogUI() {
    const playerDiv = document.querySelector('div#player');
    
    // Limpar conteúdo anterior
    playerDiv.innerHTML = `
      <div class="mobile-filter-panel">
        <div class="filter-group-title">🔍 Filtrar por Características</div>
        <div id="filters-container"></div>
        <button class="filter-reset-btn">🔄 Limpar Filtros</button>
      </div>
      <div class="mobile-catalog-panel">
        <div id="catalog-container"></div>
      </div>
    `;

    this.buildFilters();
  }

  // Construir filtros a partir dos dados
  buildFilters() {
    const filtersContainer = document.querySelector('#filters-container');
    const characteristics = this.extractCharacteristics();

    characteristics.forEach(characteristic => {
      const filterGroup = document.createElement('div');
      filterGroup.className = 'filter-group';
      filterGroup.innerHTML = `
        <div class="filter-group-title">${characteristic.name}</div>
        ${characteristic.values.map(value => `
          <div class="filter-option">
            <input 
              type="checkbox" 
              id="filter-${characteristic.id}-${value}"
              data-characteristic="${characteristic.id}"
              data-value="${value}"
            >
            <label for="filter-${characteristic.id}-${value}">${value}</label>
          </div>
        `).join('')}
      `;
      filtersContainer.appendChild(filterGroup);
    });
  }

  // Extrair características únicas dos dados
  extractCharacteristics() {
    const characteristics = new Map();

    this.allSpecies.forEach(species => {
      // Assumindo estrutura: species.characteristics = { tamanho: "Pequeno", ... }
      Object.entries(species.characteristics || {}).forEach(([key, value]) => {
        if (!characteristics.has(key)) {
          characteristics.set(key, { id: key, name: this.formatName(key), values: new Set() });
        }
        characteristics.get(key).values.add(value);
      });
    });

    return Array.from(characteristics.values()).map(char => ({
      ...char,
      values: Array.from(char.values).sort()
    }));
  }

  // Formatar nome da característica
  formatName(key) {
    return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
  }

  // Aplicar filtros
  applyFilters() {
    if (this.activeFilters.size === 0) {
      this.filteredSpecies = [...this.allSpecies];
    } else {
      this.filteredSpecies = this.allSpecies.filter(species => {
        return Array.from(this.activeFilters.entries()).every(([characteristic, values]) => {
          const speciesValue = species.characteristics?.[characteristic];
          return speciesValue && values.has(speciesValue);
        });
      });
    }
    this.renderCatalog();
  }

  // Renderizar catálogo
  renderCatalog() {
    const catalogContainer = document.querySelector('#catalog-container');
    
    if (this.filteredSpecies.length === 0) {
      catalogContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🦗</div>
          <div class="empty-state-text">Nenhuma espécie encontrada</div>
          <small>Tente ajustar os filtros</small>
        </div>
      `;
      return;
    }

    
    catalogContainer.innerHTML = this.filteredSpecies.map(species => `
      <div class="species-card" data-species-id="${species.id}">
        ${species.image ? `
          <img 
            src="${this.PLACEHOLDER}"
            data-src="${species.image}" 
            alt="${species.name}" 
            class="species-card-image lazy-load"
            loading="lazy"
          >
        ` : ''}
        <div class="species-card-content">
          <div class="species-card-title">${species.name}</div>
          <div class="species-card-subtitle">${species.scientificName || ''}</div>
          ${species.description ? `
            <div class="species-card-description">${species.description}</div>
          ` : ''}
          <div class="species-card-characteristics">
            ${Object.entries(species.characteristics || {}).map(([key, value]) => 
              `<span class="characteristic-badge">${value}</span>`
            ).join('')}
          </div>
        </div>
      </div>
    `).join('');

    // Ativar lazy loading
    this.initLazyLoading();
    this.attachCardListeners();
  }

  // ✨ LAZY LOADING - Carregar imagens sob demanda
  initLazyLoading() {
    const lazyImages = document.querySelectorAll('.lazy-load');

    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy-load');
            observer.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px' // Precarregar 50px antes
      });

      lazyImages.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback: carregar direto
      lazyImages.forEach(img => {
        img.src = img.dataset.src;
        img.classList.remove('lazy-load');
      });
    }
  }

  applyFilters() {
    if (this.activeFilters.size === 0) {
      this.filteredSpecies = [...this.allSpecies];
    } else {
      this.filteredSpecies = this.allSpecies.filter(species => {
        return Array.from(this.activeFilters.entries()).every(([characteristic, values]) => {
          const speciesValue = species.characteristics?.[characteristic];
          return speciesValue && values.has(speciesValue);
        });
      });
    }
    this.renderCatalog(); // Lazy loading será reinicializado
  }

  // Eventos dos filtros
  attachEventListeners() {
    // Checkboxes de filtro
    document.querySelectorAll('#filters-container input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const characteristic = e.target.dataset.characteristic;
        const value = e.target.dataset.value;

        if (!this.activeFilters.has(characteristic)) {
          this.activeFilters.set(characteristic, new Set());
        }

        if (e.target.checked) {
          this.activeFilters.get(characteristic).add(value);
        } else {
          this.activeFilters.get(characteristic).delete(value);
          if (this.activeFilters.get(characteristic).size === 0) {
            this.activeFilters.delete(characteristic);
          }
        }

        this.applyFilters();
      });
    });

    // Botão resetar filtros
    document.querySelector('.filter-reset-btn').addEventListener('click', () => {
      document.querySelectorAll('#filters-container input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
      });
      this.activeFilters.clear();
      this.applyFilters();
    });
  }

  // Eventos dos cartões
  attachCardListeners() {
    document.querySelectorAll('.species-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const speciesId = e.currentTarget.dataset.speciesId;
        const species = this.allSpecies.find(s => s.id === speciesId);
        this.showSpeciesDetail(species);
      });
    });
  }

  // Modal de detalhes da espécie
  showSpeciesDetail(species) {
    alert(`${species.name}\n${species.scientificName}\n\n${species.description}`);
    // Substituir por modal customizado conforme necessário
  }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  // Dados vêm do JSON carregado (cian-ce_2.json)
  // Adaptar conforme sua estrutura de dados
  if (typeof speciesData !== 'undefined') {
    new MobileCatalog(speciesData);
  }
});

