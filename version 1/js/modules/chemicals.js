// Módulo de gestión de productos químicos
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en la página de productos químicos
    const chemicalsView = document.getElementById('chemicals-view');
    if (!chemicalsView) return;
    
    // Lista de productos químicos predefinida
    const chemicalProducts = [
      { id: 1, name: "SAL DESCALSFICADOR PASTILLAS 25KG", unit: "kg" },
      { id: 2, name: "HIPOCLORITO PISCINAS", unit: "l" },
      { id: 3, name: "DISMINUIDOR PH LIQUIDO AQUA PEDROSA 23KG", unit: "kg" },
      { id: 4, name: "ACIDO CLORHIDICO 32% CONS.HUMANO 23KG", unit: "kg" },
      { id: 5, name: "REACTIVO FOTOMETRO DPD-1 C/250UN", unit: "un" },
      { id: 6, name: "REACTIVO FOTOMETRO DPD-3 C/250UN", unit: "un" },
      { id: 7, name: "REACTIVO FOTOMETRO PH (PHENOL RED) C/250UN", unit: "un" },
      { id: 8, name: "LEJIA ALIMENTARIA 40GR/L 22KG", unit: "kg" },
      { id: 9, name: "ANTIINCRUSTANTE QUIMIFOS GFA 20L", unit: "l" },
      { id: 10, name: "ESTABILIZANTE CTX-400", unit: "kg" },
      { id: 11, name: "DESENGRASANTE CTX-75", unit: "l" },
      { id: 12, name: "CLORO GRANULADO CTX-300", unit: "kg" },
      { id: 13, name: "BROMO TABLETAS CUBO 20KG", unit: "kg" },
      { id: 14, name: "COAGULANTE GOLDENFLOK GFA 5KG", unit: "kg" },
      { id: 15, name: "ALGIBLACK GFA 5KG", unit: "kg" },
      { id: 16, name: "REACTIVO ISOCIANURICO", unit: "un" },
      { id: 17, name: "NEUTRALIZANTE CTX-12", unit: "kg" }
    ];
    
    // Referencias a elementos DOM
    let chemicalProductsList;
    let filterChemicalHotel;
    let chemicalContainer;
    let chemicalTitle;
    let chemicalHotel;
    let chemicalNotes;
    
    // Variables de estado
    let currentChemicalId = null;
    
    // Inicializar módulo
    function initChemicalsModule() {
      // Renderizar la estructura base del módulo
      renderModuleStructure();
      
      // Obtener referencias a elementos DOM
      chemicalProductsList = document.getElementById('chemical-products-list');
      filterChemicalHotel = document.getElementById('filter-chemical-hotel');
      chemicalContainer = document.getElementById('chemical-container');
      chemicalTitle = document.getElementById('chemical-title');
      chemicalHotel = document.getElementById('chemical-hotel');
      chemicalNotes = document.getElementById('chemical-notes');
      
      // Suscribirse a cambios en químicos
      if (AppState.get('chemicals') === undefined) {
        AppState.data.chemicals = [];
        AppState.saveToLocalStorage();
      }
      AppState.subscribe('chemicals', renderChemicals);
      
      // Inicializar tabla de productos
      initProductList();
      
      // Configurar eventos
      setupEventListeners();
      
      // Cargar datos iniciales si es necesario
      loadMockChemicalsData();
      
      // Renderizar químicos
      renderChemicals(AppState.get('chemicals'));
    }
    
    // Crear datos de ejemplo si no existen
    function loadMockChemicalsData() {
      if (AppState.get('chemicals').length === 0) {
        const mockChemicals = [
          {
            id: 1,
            title: "Pedido mensual piscina Wave",
            hotel: "Wave",
            notes: "Entrega urgente para tratamiento de agua",
            products: [
              { productId: 2, name: "HIPOCLORITO PISCINAS", unit: "l", waveQty: 100, skyQty: 0 },
              { productId: 3, name: "DISMINUIDOR PH LIQUIDO", unit: "kg", waveQty: 50, skyQty: 0 },
              { productId: 12, name: "CLORO GRANULADO CTX-300", unit: "kg", waveQty: 25, skyQty: 0 }
            ],
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Una semana atrás
            createdBy: "sistema",
            createdByEmail: "admin@prestotel.com",
            status: "Pendiente"
          },
          {
            id: 2,
            title: "Productos químicos ambos hoteles",
            hotel: "Ambos",
            notes: "Pedido bimensual programado",
            products: [
              { productId: 1, name: "SAL DESCALSFICADOR PASTILLAS 25KG", unit: "kg", waveQty: 50, skyQty: 50 },
              { productId: 9, name: "ANTIINCRUSTANTE QUIMIFOS GFA 20L", unit: "l", waveQty: 20, skyQty: 20 },
              { productId: 14, name: "COAGULANTE GOLDENFLOK GFA 5KG", unit: "kg", waveQty: 10, skyQty: 10 }
            ],
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Un mes atrás
            createdBy: "sistema",
            createdByEmail: "admin@prestotel.com",
            status: "Completado"
          }
        ];
        
        AppState.data.chemicals = mockChemicals;
        AppState.saveToLocalStorage();
        AppState.notifyAll();
      }
    }
    
    // Renderizar la estructura base del módulo
    function renderModuleStructure() {
      chemicalsView.innerHTML = `
        <h2 class="section-title"><i class="fas fa-flask"></i> Pedidos de Productos Químicos</h2>
        
        <div class="action-bar">
          <button id="btn-new-chemical" class="btn btn-primary"><i class="fas fa-plus"></i> Nuevo Pedido</button>
          <div class="filters">
            <select id="filter-chemical-hotel" class="form-control">
              <option value="">Todos los hoteles</option>
              <option value="Wave">Wave</option>
              <option value="Sky">Sky</option>
              <option value="Ambos">Ambos hoteles</option>
            </select>
            <div class="search-box">
              <i class="fas fa-search"></i>
              <input type="text" id="search-chemical" class="form-control" placeholder="Buscar pedido...">
            </div>
          </div>
        </div>
        
        <!-- Formulario para pedido de químicos -->
        <div id="chemical-form" class="form-container hidden">
          <h3 class="form-title">Nuevo Pedido de Químicos</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="chemical-title">Título del pedido</label>
              <input type="text" id="chemical-title" class="form-control" placeholder="Ej: Productos químicos mayo 2025">
            </div>
            <div class="form-group">
              <label for="chemical-hotel">Hotel</label>
              <select id="chemical-hotel" class="form-control">
                <option value="Wave">Wave</option>
                <option value="Sky">Sky</option>
                <option value="Ambos">Ambos hoteles</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Productos y cantidades</label>
            <div class="table-responsive">
              <table class="chemical-table">
                <thead>
                  <tr>
                    <th class="product-col">Producto</th>
                    <th class="qty-col">Cantidad Wave</th>
                    <th class="qty-col">Cantidad Sky</th>
                    <th class="unit-col">Unidad</th>
                  </tr>
                </thead>
                <tbody id="chemical-products-list">
                  <!-- Los productos se generarán dinámicamente aquí -->
                </tbody>
              </table>
            </div>
          </div>
          <div class="form-group">
            <label for="chemical-notes">Notas adicionales</label>
            <textarea id="chemical-notes" class="form-control" placeholder="Notas adicionales sobre el pedido..."></textarea>
          </div>
          <div class="form-actions">
            <button id="cancel-chemical-btn" class="btn btn-secondary">Cancelar</button>
            <button id="save-chemical-btn" class="btn btn-primary">Guardar Pedido</button>
            <button id="share-whatsapp-btn" class="btn btn-success">
              <i class="fab fa-whatsapp"></i> Compartir por WhatsApp
            </button>
          </div>
        </div>
        
        <!-- Lista de pedidos químicos -->
        <div id="chemical-container" class="chemicals-list">
          <!-- Los pedidos químicos se cargarán aquí dinámicamente -->
        </div>
      `;
    }
    
    // Inicializar la tabla de productos
    function initProductList() {
      if (!chemicalProductsList) return;
      
      chemicalProductsList.innerHTML = '';
      
      chemicalProducts.forEach(product => {
        const row = document.createElement('tr');
        
        // Celda para nombre del producto
        const nameCell = document.createElement('td');
        nameCell.className = 'product-col';
        nameCell.textContent = product.name;
        
        // Celda para cantidad Wave
        const waveCell = document.createElement('td');
        waveCell.className = 'qty-col';
        const waveInput = document.createElement('input');
        waveInput.type = 'number';
        waveInput.className = 'form-control wave-qty';
        waveInput.setAttribute('data-product-id', product.id);
        waveInput.min = 0;
        waveInput.value = 0;
        waveCell.appendChild(waveInput);
        
        // Celda para cantidad Sky
        const skyCell = document.createElement('td');
        skyCell.className = 'qty-col';
        const skyInput = document.createElement('input');
        skyInput.type = 'number';
        skyInput.className = 'form-control sky-qty';
        skyInput.setAttribute('data-product-id', product.id);
        skyInput.min = 0;
        skyInput.value = 0;
        skyCell.appendChild(skyInput);
        
        // Celda para unidad
        const unitCell = document.createElement('td');
        unitCell.className = 'unit-col';
        unitCell.textContent = product.unit;
        
        // Añadir celdas a la fila
        row.appendChild(nameCell);
        row.appendChild(waveCell);
        row.appendChild(skyCell);
        row.appendChild(unitCell);
        
        // Añadir fila a la tabla
        chemicalProductsList.appendChild(row);
      });
    }
    
    // Configurar eventos
    function setupEventListeners() {
      // Filtro de hotel
      const filterHotel = document.getElementById('filter-chemical-hotel');
      if (filterHotel) {
        filterHotel.addEventListener('change', () => renderChemicals(AppState.get('chemicals')));
      }
      
      // Búsqueda
      const searchInput = document.getElementById('search-chemical');
      if (searchInput) {
        searchInput.addEventListener('input', () => renderChemicals(AppState.get('chemicals')));
      }
      
      // Botón nuevo pedido
      const btnNewChemical = document.getElementById('btn-new-chemical');
      if (btnNewChemical) {
        btnNewChemical.addEventListener('click', () => {
          resetForm();
          document.getElementById('chemical-form').classList.remove('hidden');
        });
      }
      
      // Botón cancelar
      const cancelBtn = document.getElementById('cancel-chemical-btn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          document.getElementById('chemical-form').classList.add('hidden');
        });
      }
      
      // Botón guardar
      const saveBtn = document.getElementById('save-chemical-btn');
      if (saveBtn) {
        saveBtn.addEventListener('click', saveChemical);
      }
      
      // Botón compartir WhatsApp
      const shareBtn = document.getElementById('share-whatsapp-btn');
      if (shareBtn) {
        shareBtn.addEventListener('click', shareChemicalWhatsApp);
      }
    }
    
    // Renderizar pedidos químicos
    function renderChemicals(chemicals) {
      if (!chemicalContainer) return;
      
      // Aplicar filtros
      const filteredChemicals = applyFilters(chemicals);
      
      // Limpiar contenedor
      chemicalContainer.innerHTML = '';
      
      if (filteredChemicals.length === 0) {
        chemicalContainer.innerHTML = '<p class="text-center">No hay pedidos químicos que coincidan con los filtros</p>';
        return;
      }
      
      // Ordenar: pendientes primero, luego por fecha
      const sortedChemicals = [...filteredChemicals].sort((a, b) => {
        // Por estado
        if (a.status !== b.status) {
          if (a.status === 'Pendiente') return -1;
          if (b.status === 'Pendiente') return 1;
        }
        
        // Por fecha (más reciente primero)
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      sortedChemicals.forEach(chemical => {
        const card = document.createElement('div');
        card.className = 'chemical-card';
        card.setAttribute('data-id', chemical.id);
        
        // Filtrar productos con cantidades mayores a cero
        const relevantProducts = chemical.products.filter(product => 
          (chemical.hotel === 'Wave' && product.waveQty > 0) || 
          (chemical.hotel === 'Sky' && product.skyQty > 0) || 
          (chemical.hotel === 'Ambos' && (product.waveQty > 0 || product.skyQty > 0))
        );
        
        // Generar HTML para los productos
        let productsHtml = '<div class="chemical-products">';
        
        relevantProducts.forEach(product => {
          let qtyText = '';
          
          if (chemical.hotel === 'Ambos') {
            if (product.waveQty > 0 && product.skyQty > 0) {
              qtyText = `Wave: ${product.waveQty} ${product.unit}, Sky: ${product.skyQty} ${product.unit}`;
            } else if (product.waveQty > 0) {
              qtyText = `Wave: ${product.waveQty} ${product.unit}`;
            } else {
              qtyText = `Sky: ${product.skyQty} ${product.unit}`;
            }
          } else if (chemical.hotel === 'Wave' && product.waveQty > 0) {
            qtyText = `${product.waveQty} ${product.unit}`;
          } else if (chemical.hotel === 'Sky' && product.skyQty > 0) {
            qtyText = `${product.skyQty} ${product.unit}`;
          }
          
          productsHtml += `
            <div class="chemical-product-item">
              <span class="product-name">${Utils.sanitizeHTML(product.name)}</span>
              <span class="product-qty">${qtyText}</span>
            </div>
          `;
        });
        
        productsHtml += '</div>';
        
        card.innerHTML = `
          <div class="chemical-header">
            <h3 class="chemical-title">${Utils.sanitizeHTML(chemical.title)}</h3>
            <span class="badge badge-${chemical.status === 'Pendiente' ? 'warning' : 'success'}">${chemical.status}</span>
          </div>
          <div class="chemical-meta">
            <div><i class="fas fa-hotel"></i> ${chemical.hotel}</div>
            <div><i class="fas fa-calendar-alt"></i> ${Utils.formatDate(chemical.createdAt)}</div>
          </div>
          ${productsHtml}
          ${chemical.notes ? `<div class="chemical-notes">${Utils.sanitizeHTML(chemical.notes)}</div>` : ''}
          <div class="chemical-actions">
            <button class="btn btn-primary btn-share-chemical" data-id="${chemical.id}">
              <i class="fab fa-whatsapp"></i> Compartir
            </button>
            <button class="btn btn-danger btn-delete-chemical" data-id="${chemical.id}">
              <i class="fas fa-trash"></i> Eliminar
            </button>
          </div>
        `;
        
        chemicalContainer.appendChild(card);
      });
      
      // Configurar eventos para los botones
      document.querySelectorAll('.btn-share-chemical').forEach(btn => {
        btn.addEventListener('click', () => {
            const chemicalId = parseInt(btn.getAttribute('data-id'));
            shareExistingChemicalWhatsApp(chemicalId);
          });
        });
        
        document.querySelectorAll('.btn-delete-chemical').forEach(btn => {
          btn.addEventListener('click', () => {
            const chemicalId = parseInt(btn.getAttribute('data-id'));
            deleteChemical(chemicalId);
          });
        });
      }
      
      // Aplicar filtros
      function applyFilters(chemicals) {
        const hotelFilter = filterChemicalHotel ? filterChemicalHotel.value : '';
        const searchInput = document.getElementById('search-chemical');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        
        return chemicals.filter(chemical => {
          // Filtro por hotel
          const matchesHotel = !hotelFilter || 
                              chemical.hotel === hotelFilter || 
                              (hotelFilter === 'Wave' && chemical.hotel === 'Ambos') ||
                              (hotelFilter === 'Sky' && chemical.hotel === 'Ambos');
          
          // Filtro por búsqueda
          const matchesSearch = !searchTerm || 
                               chemical.title.toLowerCase().includes(searchTerm) ||
                               (chemical.notes && chemical.notes.toLowerCase().includes(searchTerm)) ||
                               chemical.products.some(p => p.name.toLowerCase().includes(searchTerm));
          
          return matchesHotel && matchesSearch;
        });
      }
      
      // Resetear formulario
      function resetForm() {
        if (chemicalTitle) chemicalTitle.value = '';
        if (chemicalHotel) chemicalHotel.value = 'Wave';
        if (chemicalNotes) chemicalNotes.value = '';
        
        // Resetear cantidades
        document.querySelectorAll('.wave-qty, .sky-qty').forEach(input => {
          input.value = 0;
        });
        
        currentChemicalId = null;
      }
      
      // Guardar pedido químico
      function saveChemical() {
        // Validar formulario
        if (!chemicalTitle.value.trim()) {
          Utils.showToast('Por favor introduce un título para el pedido', 'error');
          chemicalTitle.focus();
          return;
        }
        
        // Recopilar productos
        const productQuantities = [];
        let hasProducts = false;
        
        document.querySelectorAll('.wave-qty').forEach((input, index) => {
          const productId = parseInt(input.getAttribute('data-product-id'));
          const waveQty = parseInt(input.value) || 0;
          const skyInput = document.querySelectorAll('.sky-qty')[index];
          const skyQty = parseInt(skyInput.value) || 0;
          
          if (waveQty > 0 || skyQty > 0) {
            hasProducts = true;
            const product = chemicalProducts.find(p => p.id === productId);
            
            productQuantities.push({
              productId,
              name: product.name,
              unit: product.unit,
              waveQty,
              skyQty
            });
          }
        });
        
        if (!hasProducts) {
          Utils.showToast('Por favor introduce al menos un producto con cantidad mayor a cero', 'error');
          return;
        }
        
        // Preparar datos
        const chemicalData = {
          title: chemicalTitle.value.trim(),
          hotel: chemicalHotel.value,
          notes: chemicalNotes.value.trim(),
          products: productQuantities,
          updatedAt: new Date()
        };
        
        // Obtener lista actual
        const chemicals = [...AppState.get('chemicals')];
        
        if (currentChemicalId) {
          // Actualizar existente
          const index = chemicals.findIndex(c => c.id === currentChemicalId);
          
          if (index !== -1) {
            chemicals[index] = {
              ...chemicals[index],
              ...chemicalData
            };
            
            AppState.update('chemicals', chemicals);
            Utils.showToast('Pedido químico actualizado correctamente', 'success');
          }
        } else {
          // Crear nuevo
          const maxId = chemicals.reduce((max, c) => Math.max(max, c.id || 0), 0);
          
          const newChemical = {
            ...chemicalData,
            id: maxId + 1,
            createdAt: new Date(),
            createdBy: currentUser ? currentUser.uid : 'sistema',
            createdByEmail: currentUser ? currentUser.email : 'sistema@prestotel.com',
            status: 'Pendiente'
          };
          
          chemicals.push(newChemical);
          AppState.update('chemicals', chemicals);
          Utils.showToast('Pedido químico creado correctamente', 'success');
        }
        
        // Cerrar formulario
        document.getElementById('chemical-form').classList.add('hidden');
        resetForm();
      }
      
      // Compartir por WhatsApp (formulario actual)
      function shareChemicalWhatsApp() {
        // Validar formulario
        if (!chemicalTitle.value.trim()) {
          Utils.showToast('Por favor introduce un título para el pedido', 'error');
          chemicalTitle.focus();
          return;
        }
        
        // Recopilar productos
        let hasProducts = false;
        let messageText = `*${chemicalTitle.value.trim()}*\n\n`;
        
        if (chemicalHotel.value !== 'Ambos') {
          messageText += `Hotel: ${chemicalHotel.value}\n\n`;
        }
        
        messageText += "Productos:\n";
        
        document.querySelectorAll('.wave-qty').forEach((input, index) => {
          const productId = parseInt(input.getAttribute('data-product-id'));
          const waveQty = parseInt(input.value) || 0;
          const skyInput = document.querySelectorAll('.sky-qty')[index];
          const skyQty = parseInt(skyInput.value) || 0;
          
          if (waveQty > 0 || skyQty > 0) {
            hasProducts = true;
            const product = chemicalProducts.find(p => p.id === productId);
            
            if (chemicalHotel.value === 'Ambos') {
              if (waveQty > 0 && skyQty > 0) {
                messageText += `- ${product.name}: Wave=${waveQty} ${product.unit}, Sky=${skyQty} ${product.unit}\n`;
              } else if (waveQty > 0) {
                messageText += `- ${product.name}: Wave=${waveQty} ${product.unit}\n`;
              } else {
                messageText += `- ${product.name}: Sky=${skyQty} ${product.unit}\n`;
              }
            } else if (chemicalHotel.value === 'Wave') {
              messageText += `- ${product.name}: ${waveQty} ${product.unit}\n`;
            } else {
              messageText += `- ${product.name}: ${skyQty} ${product.unit}\n`;
            }
          }
        });
        
        if (!hasProducts) {
          Utils.showToast('Por favor introduce al menos un producto con cantidad mayor a cero', 'error');
          return;
        }
        
        if (chemicalNotes.value.trim()) {
          messageText += `\nNotas: ${chemicalNotes.value.trim()}`;
        }
        
        // Codificar mensaje para URL
        const encodedMessage = encodeURIComponent(messageText);
        
        // Abrir WhatsApp
        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
      }
      
      // Compartir pedido existente por WhatsApp
      function shareExistingChemicalWhatsApp(chemicalId) {
        const chemicals = AppState.get('chemicals');
        const chemical = chemicals.find(c => c.id === chemicalId);
        
        if (!chemical) {
          Utils.showToast('Pedido no encontrado', 'error');
          return;
        }
        
        let messageText = `*${chemical.title}*\n\n`;
        
        if (chemical.hotel !== 'Ambos') {
          messageText += `Hotel: ${chemical.hotel}\n\n`;
        }
        
        messageText += "Productos:\n";
        
        chemical.products.forEach(product => {
          if (chemical.hotel === 'Ambos') {
            if (product.waveQty > 0 && product.skyQty > 0) {
              messageText += `- ${product.name}: Wave=${product.waveQty} ${product.unit}, Sky=${product.skyQty} ${product.unit}\n`;
            } else if (product.waveQty > 0) {
              messageText += `- ${product.name}: Wave=${product.waveQty} ${product.unit}\n`;
            } else if (product.skyQty > 0) {
              messageText += `- ${product.name}: Sky=${product.skyQty} ${product.unit}\n`;
            }
          } else if (chemical.hotel === 'Wave' && product.waveQty > 0) {
            messageText += `- ${product.name}: ${product.waveQty} ${product.unit}\n`;
          } else if (chemical.hotel === 'Sky' && product.skyQty > 0) {
            messageText += `- ${product.name}: ${product.skyQty} ${product.unit}\n`;
          }
        });
        
        if (chemical.notes) {
          messageText += `\nNotas: ${chemical.notes}`;
        }
        
        // Añadir fecha y estado
        messageText += `\n\nFecha: ${Utils.formatDate(chemical.createdAt)}`;
        messageText += `\nEstado: ${chemical.status}`;
        
        // Codificar mensaje para URL
        const encodedMessage = encodeURIComponent(messageText);
        
        // Abrir WhatsApp
        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
      }
      
      // Eliminar pedido químico
      function deleteChemical(chemicalId) {
        Utils.confirmAction(
          '¿Estás seguro de que deseas eliminar este pedido de productos químicos?',
          () => {
            const chemicals = AppState.get('chemicals');
            const newChemicals = chemicals.filter(c => c.id !== chemicalId);
            
            AppState.update('chemicals', newChemicals);
            Utils.showToast('Pedido eliminado correctamente', 'success');
          }
        );
      }
      
      // Inicializar módulo
      initChemicalsModule();
    });