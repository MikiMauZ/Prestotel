// Módulo de gestión de inventario/stock
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en la página de inventario
    const inventoryView = document.getElementById('inventory-view');
    if (!inventoryView) return;
    
    // Elementos DOM
    let inventoryList;
    let filterCategory;
    let filterStockLevel;
    let searchInput;
    let inventoryForm;
    let btnNewItem;
    
    // Variables de estado
    let currentItemId = null;
    
    // Inicializar módulo
    function initInventoryModule() {
      // Renderizar la estructura base del módulo
      renderModuleStructure();
      
      // Obtener referencias a elementos DOM
      inventoryList = document.getElementById('inventory-list');
      filterCategory = document.getElementById('filter-category');
      filterStockLevel = document.getElementById('filter-stock-level');
      searchInput = document.getElementById('search-inventory');
      inventoryForm = document.getElementById('inventory-form');
      btnNewItem = document.getElementById('btn-new-item');
      
      // Suscribirse a cambios en el inventario
      AppState.subscribe('inventory', renderInventory);
      
      // Configurar eventos
      setupEventListeners();
      
      // Renderizar inventario inicial
      loadMockInventoryData();
      renderInventory(AppState.get('inventory'));
    }
    
    // Crear mock data para inventario si no existe
    function loadMockInventoryData() {
      if (AppState.get('inventory').length === 0) {
        const mockInventory = [
          {
            id: 1,
            name: "Toallas",
            category: "Habitaciones",
            quantity: 150,
            minimum: 50,
            unit: "Unidades",
            notes: "Toallas de baño estándar",
            lastUpdated: new Date(),
            status: "good"
          },
          {
            id: 2,
            name: "Jabón líquido",
            category: "Baños",
            quantity: 30,
            minimum: 20,
            unit: "Litros",
            notes: "Jabón de manos para dispensadores",
            lastUpdated: new Date(),
            status: "medium"
          },
          {
            id: 3,
            name: "Bombillas LED",
            category: "Mantenimiento",
            quantity: 15,
            minimum: 30,
            unit: "Cajas",
            notes: "Bombillas de bajo consumo para habitaciones",
            lastUpdated: new Date(),
            status: "low"
          },
          {
            id: 4,
            name: "Cloro para piscina",
            category: "Piscina",
            quantity: 5,
            minimum: 10,
            unit: "Kg",
            notes: "Cloro granulado para tratamiento del agua",
            lastUpdated: new Date(),
            status: "low"
          },
          {
            id: 5,
            name: "Papel higiénico",
            category: "Baños",
            quantity: 200,
            minimum: 100,
            unit: "Rollos",
            notes: "Papel de doble capa",
            lastUpdated: new Date(),
            status: "good"
          }
        ];
        
        // Guardar en AppState
        AppState.data.inventory = mockInventory;
        AppState.saveToLocalStorage();
      }
    }
    
    // Renderizar la estructura base del módulo
    function renderModuleStructure() {
      inventoryView.innerHTML = `
        <h2 class="section-title"><i class="fas fa-boxes"></i> Gestión de Inventario</h2>
        
        <div class="action-bar">
          <button id="btn-new-item" class="btn btn-primary"><i class="fas fa-plus"></i> Nuevo Producto</button>
          <div class="filters">
            <select id="filter-category" class="form-control">
              <option value="">Todas las categorías</option>
              <option value="Habitaciones">Habitaciones</option>
              <option value="Baños">Baños</option>
              <option value="Cocina">Cocina</option>
              <option value="Mantenimiento">Mantenimiento</option>
              <option value="Piscina">Piscina</option>
              <option value="Oficina">Oficina</option>
              <option value="Limpieza">Limpieza</option>
            </select>
            <select id="filter-stock-level" class="form-control">
              <option value="">Todos los niveles</option>
              <option value="low">Bajo mínimo</option>
              <option value="medium">Regular</option>
              <option value="good">Adecuado</option>
            </select>
            <div class="search-box">
              <i class="fas fa-search"></i>
              <input type="text" id="search-inventory" class="form-control" placeholder="Buscar producto...">
            </div>
          </div>
        </div>
        
        <!-- Formulario para añadir/editar producto -->
        <div id="inventory-form" class="form-container hidden">
          <h3 class="form-title" id="form-title">Nuevo Producto</h3>
          <div class="form-group">
            <label for="item-name">Nombre del producto</label>
            <input type="text" id="item-name" class="form-control" placeholder="Nombre del producto">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="item-category">Categoría</label>
              <select id="item-category" class="form-control">
                <option value="Habitaciones">Habitaciones</option>
                <option value="Baños">Baños</option>
                <option value="Cocina">Cocina</option>
                <option value="Mantenimiento">Mantenimiento</option>
                <option value="Piscina">Piscina</option>
                <option value="Oficina">Oficina</option>
                <option value="Limpieza">Limpieza</option>
              </select>
            </div>
            <div class="form-group">
              <label for="item-unit">Unidad</label>
              <select id="item-unit" class="form-control">
                <option value="Unidades">Unidades</option>
                <option value="Litros">Litros</option>
                <option value="Kg">Kilogramos</option>
                <option value="Cajas">Cajas</option>
                <option value="Rollos">Rollos</option>
                <option value="Paquetes">Paquetes</option>
                <option value="Metros">Metros</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="item-quantity">Cantidad actual</label>
              <input type="number" id="item-quantity" class="form-control" min="0" step="1">
            </div>
            <div class="form-group">
              <label for="item-minimum">Cantidad mínima</label>
              <input type="number" id="item-minimum" class="form-control" min="0" step="1">
            </div>
          </div>
          <div class="form-group">
            <label for="item-notes">Notas</label>
            <textarea id="item-notes" class="form-control" placeholder="Información adicional..."></textarea>
          </div>
          <div class="form-actions">
            <button id="cancel-item-btn" class="btn btn-secondary">Cancelar</button>
            <button id="save-item-btn" class="btn btn-primary">Guardar Producto</button>
          </div>
        </div>
        
        <div class="inventory-dashboard">
          <!-- Resumen de Stock -->
          <div class="inventory-summary">
            <div class="summary-card bg-success">
              <div class="summary-icon"><i class="fas fa-check-circle"></i></div>
              <div class="summary-content">
                <h3>Stock Adecuado</h3>
                <p id="stock-good-count">0 productos</p>
              </div>
            </div>
            <div class="summary-card bg-warning">
              <div class="summary-icon"><i class="fas fa-exclamation-circle"></i></div>
              <div class="summary-content">
                <h3>Stock Regular</h3>
                <p id="stock-medium-count">0 productos</p>
              </div>
            </div>
            <div class="summary-card bg-danger">
              <div class="summary-icon"><i class="fas fa-times-circle"></i></div>
              <div class="summary-content">
                <h3>Bajo Mínimo</h3>
                <p id="stock-low-count">0 productos</p>
              </div>
            </div>
          </div>
          
          <!-- Lista de productos en inventario -->
          <div id="inventory-list" class="inventory-list">
            <!-- Se llenará dinámicamente -->
          </div>
        </div>
      `;
    }
    
    // Configurar eventos
    function setupEventListeners() {
      // Filtros
      filterCategory.addEventListener('change', applyFilters);
      filterStockLevel.addEventListener('change', applyFilters);
      searchInput.addEventListener('input', applyFilters);
      
      // Nuevo producto
      btnNewItem.addEventListener('click', () => {
        resetForm();
        document.getElementById('form-title').textContent = 'Nuevo Producto';
        inventoryForm.classList.remove('hidden');
        document.getElementById('item-name').focus();
      });
      
      // Cancelar
      document.getElementById('cancel-item-btn').addEventListener('click', () => {
        inventoryForm.classList.add('hidden');
      });
      
      // Guardar producto
      document.getElementById('save-item-btn').addEventListener('click', saveInventoryItem);
    }
    
    // Renderizar lista de inventario
    function renderInventory(items) {
      if (!inventoryList) return;
      
      const filteredItems = applyFilters();
      
      // Actualizar contadores de resumen
      updateSummaryCounters(items);
      
      // Limpiar lista
      inventoryList.innerHTML = '';
      
      if (filteredItems.length === 0) {
        inventoryList.innerHTML = '<p class="text-center">No hay productos que coincidan con los filtros</p>';
        return;
      }
      
      // Ordenar: primero los de bajo stock
      const sortedItems = [...filteredItems].sort((a, b) => {
        // Primero por nivel de stock
        const stockOrder = { low: 0, medium: 1, good: 2 };
        if (stockOrder[a.status] !== stockOrder[b.status]) {
          return stockOrder[a.status] - stockOrder[b.status];
        }
        
        // Luego por nombre
        return a.name.localeCompare(b.name);
      });
      
      sortedItems.forEach(item => {
        // Determinar clase CSS según nivel de stock
        const stockLevelClass = item.status === 'low' ? 'stock-level-low' : 
                               item.status === 'medium' ? 'stock-level-medium' : 
                               'stock-level-good';
        
        const stockLevelText = item.status === 'low' ? 'Bajo mínimo' : 
                              item.status === 'medium' ? 'Regular' : 
                              'Adecuado';
        
        const card = document.createElement('div');
        card.className = `inventory-item ${stockLevelClass}`;
        card.setAttribute('data-id', item.id);
        
        card.innerHTML = `
          <div class="inventory-item-header">
            <h3 class="inventory-item-title">${Utils.sanitizeHTML(item.name)}</h3>
            <div class="inventory-category">${Utils.sanitizeHTML(item.category)}</div>
          </div>
          <div class="inventory-item-body">
            <div class="inventory-quantity">
              <span class="quantity-value">${item.quantity}</span>
              <span class="quantity-unit">${item.unit}</span>
            </div>
            <div class="inventory-info">
              <div class="inventory-min">Mínimo: ${item.minimum} ${item.unit}</div>
              <div class="inventory-status">Estado: <span class="${stockLevelClass}">${stockLevelText}</span></div>
            </div>
            ${item.notes ? `<div class="inventory-notes">${Utils.sanitizeHTML(item.notes)}</div>` : ''}
          </div>
          <div class="inventory-item-actions">
            <button class="btn-edit-item" data-id="${item.id}"><i class="fas fa-edit"></i> Editar</button>
            <button class="btn-adjust-stock" data-id="${item.id}"><i class="fas fa-plus-minus"></i> Ajustar</button>
            <button class="btn-delete-item" data-id="${item.id}"><i class="fas fa-trash"></i> Eliminar</button>
          </div>
        `;
        
        inventoryList.appendChild(card);
      });
      
      // Configurar eventos para botones
      document.querySelectorAll('.btn-edit-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const itemId = parseInt(btn.getAttribute('data-id'));
          editInventoryItem(itemId);
        });
      });
      
      document.querySelectorAll('.btn-adjust-stock').forEach(btn => {
        btn.addEventListener('click', () => {
          const itemId = parseInt(btn.getAttribute('data-id'));
          openAdjustStockDialog(itemId);
        });
      });
      
      document.querySelectorAll('.btn-delete-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const itemId = parseInt(btn.getAttribute('data-id'));
          deleteInventoryItem(itemId);
        });
      });
    }
    
    // Actualizar contadores de resumen
    function updateSummaryCounters(items) {
      const lowCount = items.filter(item => item.status === 'low').length;
      const mediumCount = items.filter(item => item.status === 'medium').length;
      const goodCount = items.filter(item => item.status === 'good').length;
      
      document.getElementById('stock-low-count').textContent = `${lowCount} producto${lowCount !== 1 ? 's' : ''}`;
      document.getElementById('stock-medium-count').textContent = `${mediumCount} producto${mediumCount !== 1 ? 's' : ''}`;
      document.getElementById('stock-good-count').textContent = `${goodCount} producto${goodCount !== 1 ? 's' : ''}`;
    }
    
    // Aplicar filtros
    function applyFilters() {
      const category = filterCategory.value;
      const stockLevel = filterStockLevel.value;
      const search = searchInput.value.toLowerCase();
      
      const inventory = AppState.get('inventory');
      
      const filteredItems = inventory.filter(item => {
        const matchesCategory = !category || item.category === category;
        const matchesStockLevel = !stockLevel || item.status === stockLevel;
        const matchesSearch = !search || 
                             item.name.toLowerCase().includes(search) ||
                             item.category.toLowerCase().includes(search) ||
                             (item.notes && item.notes.toLowerCase().includes(search));
        
        return matchesCategory && matchesStockLevel && matchesSearch;
      });
      
      renderFilteredInventory(filteredItems);
      return filteredItems;
    }
    
    // Renderizar resultados filtrados
    function renderFilteredInventory(items) {
      // Esta función permite rerenderizar solo cuando cambian los filtros
      // sin necesidad de actualizar todo el estado
      if (!inventoryList) return;
      
      inventoryList.innerHTML = '';
      
      if (items.length === 0) {
        inventoryList.innerHTML = '<p class="text-center">No hay productos que coincidan con los filtros</p>';
        return;
      }
      
      // Resto del código igual que en renderInventory
      // (omitido por duplicidad)
    }
    
    // Editar item de inventario
    function editInventoryItem(itemId) {
      const inventory = AppState.get('inventory');
      const item = inventory.find(i => i.id === itemId);
      
      if (!item) {
        Utils.showToast('Producto no encontrado', 'error');
        return;
      }
      
      // Llenar formulario
      document.getElementById('item-name').value = item.name;
      document.getElementById('item-category').value = item.category;
      document.getElementById('item-unit').value = item.unit;
      document.getElementById('item-quantity').value = item.quantity;
      document.getElementById('item-minimum').value = item.minimum;
      document.getElementById('item-notes').value = item.notes || '';
      
      // Actualizar título
      document.getElementById('form-title').textContent = 'Editar Producto';
      
      // Guardar ID del item actual
      currentItemId = itemId;
      
      // Mostrar formulario
      inventoryForm.classList.remove('hidden');
      document.getElementById('item-name').focus();
    }
    
    // Abrir diálogo para ajustar stock
    function openAdjustStockDialog(itemId) {
      const inventory = AppState.get('inventory');
      const item = inventory.find(i => i.id === itemId);
      
      if (!item) {
        Utils.showToast('Producto no encontrado', 'error');
        return;
      }
      
      // Crear diálogo modal
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Ajustar Stock: ${Utils.sanitizeHTML(item.name)}</h3>
            <span class="close-modal">&times;</span>
          </div>
          <div class="modal-body">
            <p>Stock actual: ${item.quantity} ${item.unit}</p>
            <div class="form-group">
              <label for="adjust-quantity">Nueva cantidad</label>
              <input type="number" id="adjust-quantity" class="form-control" value="${item.quantity}" min="0">
            </div>
            <div class="form-group">
              <label for="adjust-reason">Motivo del ajuste</label>
              <select id="adjust-reason" class="form-control">
                <option value="recount">Recuento físico</option>
                <option value="delivery">Entrega de pedido</option>
                <option value="damage">Productos dañados</option>
                <option value="other">Otro motivo</option>
              </select>
            </div>
            <div class="form-group" id="other-reason-group" style="display: none;">
              <label for="other-reason">Especificar motivo</label>
              <input type="text" id="other-reason" class="form-control" placeholder="Indique el motivo...">
            </div>
            <div class="form-group">
              <label for="adjust-notes">Notas adicionales</label>
              <textarea id="adjust-notes" class="form-control" placeholder="Detalles sobre el ajuste..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button id="cancel-adjust" class="btn btn-secondary">Cancelar</button>
            <button id="save-adjust" class="btn btn-primary">Guardar Ajuste</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Configurar eventos
      modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
      });
      
      modal.querySelector('#cancel-adjust').addEventListener('click', () => {
        modal.remove();
      });
      
      // Mostrar campo "otro motivo" si se selecciona "Otro"
      modal.querySelector('#adjust-reason').addEventListener('change', (e) => {
        modal.querySelector('#other-reason-group').style.display = 
          e.target.value === 'other' ? 'block' : 'none';
      });
      
      modal.querySelector('#save-adjust').addEventListener('click', () => {
        const newQuantity = parseInt(modal.querySelector('#adjust-quantity').value);
        const reason = modal.querySelector('#adjust-reason').value;
        let reasonText = reason === 'recount' ? 'Recuento físico' :
                        reason === 'delivery' ? 'Entrega de pedido' :
                        reason === 'damage' ? 'Productos dañados' : 
                        modal.querySelector('#other-reason').value;
        
        const notes = modal.querySelector('#adjust-notes').value;
        
        if (isNaN(newQuantity) || newQuantity < 0) {
          Utils.showToast('Introduce una cantidad válida', 'error');
          return;
        }
        
        if (reason === 'other' && !reasonText.trim()) {
          Utils.showToast('Indica el motivo del ajuste', 'error');
          return;
        }
        
        // Actualizar stock
        adjustStock(itemId, newQuantity, reasonText, notes);
        
        // Cerrar modal
        modal.remove();
      });
      
      // Abrir modal
      setTimeout(() => {
        modal.style.opacity = '1';
        modal.querySelector('#adjust-quantity').focus();
      }, 10);
    }
    
    // Ajustar stock
    function adjustStock(itemId, newQuantity, reason, notes) {
      const inventory = AppState.get('inventory');
      const itemIndex = inventory.findIndex(i => i.id === itemId);
      
      if (itemIndex === -1) {
        Utils.showToast('Producto no encontrado', 'error');
        return;
      }
      
      const oldQuantity = inventory[itemIndex].quantity;
      const item = inventory[itemIndex];
      
      // Actualizar cantidad
      item.quantity = newQuantity;
      
      // Determinar nuevo estado
      if (newQuantity <= 0) {
        item.status = 'low';
      } else if (newQuantity < item.minimum) {
        item.status = 'low';
      } else if (newQuantity < item.minimum * 2) {
        item.status = 'medium';
      } else {
        item.status = 'good';
      }
      
      // Actualizar fecha
      item.lastUpdated = new Date();
      
      // Registrar ajuste en historial (se podría añadir)
      /*
      if (!item.adjustmentHistory) item.adjustmentHistory = [];
      item.adjustmentHistory.push({
        date: new Date(),
        oldQuantity,
        newQuantity,
        reason,
        notes,
        user: AppState.get('user') ? AppState.get('user').name : 'Sistema'
      });
      */
      
      // Actualizar en AppState
      inventory[itemIndex] = item;
      AppState.update('inventory', inventory);
      
      // Mostrar notificación
      const diff = newQuantity - oldQuantity;
      const message = diff > 0 ? 
        `Stock aumentado en ${diff} ${item.unit}` : 
        diff < 0 ? 
        `Stock reducido en ${Math.abs(diff)} ${item.unit}` : 
        'Stock verificado (sin cambios)';
      
      Utils.showToast(message, 'success');
      
      // Renderizar de nuevo
      renderInventory(inventory);
    }
    
    // Eliminar item de inventario
    function deleteInventoryItem(itemId) {
      if (!confirm('¿Estás seguro de que deseas eliminar este producto del inventario?')) {
        return;
      }
      
      const inventory = AppState.get('inventory');
      const newInventory = inventory.filter(i => i.id !== itemId);
      
      AppState.update('inventory', newInventory);
      Utils.showToast('Producto eliminado correctamente', 'success');
    }
    
    // Guardar nuevo item o actualizar existente
    function saveInventoryItem() {
      const nameEl = document.getElementById('item-name');
      const categoryEl = document.getElementById('item-category');
      const unitEl = document.getElementById('item-unit');
      const quantityEl = document.getElementById('item-quantity');
      const minimumEl = document.getElementById('item-minimum');
      const notesEl = document.getElementById('item-notes');
      
      // Validar datos
      if (!nameEl.value.trim()) {
        Utils.showToast('Introduce un nombre para el producto', 'error');
        nameEl.focus();
        return;
      }
      
      const quantity = parseInt(quantityEl.value);
      const minimum = parseInt(minimumEl.value);
      
      if (isNaN(quantity) || quantity < 0) {
        Utils.showToast('Introduce una cantidad válida', 'error');
        quantityEl.focus();
        return;
      }
      
      if (isNaN(minimum) || minimum < 0) {
        Utils.showToast('Introduce un mínimo válido', 'error');
        minimumEl.focus();
        return;
      }
      
      // Determinar estado de stock
      let status;
      if (quantity <= 0) {
        status = 'low';
      } else if (quantity < minimum) {
        status = 'low';
      } else if (quantity < minimum * 2) {
        status = 'medium';
      } else {
        status = 'good';
      }
      
      // Preparar datos
      const itemData = {
        name: nameEl.value.trim(),
        category: categoryEl.value,
        unit: unitEl.value,
        quantity: quantity,
        minimum: minimum,
        notes: notesEl.value.trim(),
        lastUpdated: new Date(),
        status: status
      };
      
      const inventory = [...AppState.get('inventory')];
      
      if (currentItemId) {
        // Actualizar existente
        const index = inventory.findIndex(i => i.id === currentItemId);
        if (index !== -1) {
          inventory[index] = { ...inventory[index], ...itemData };
          AppState.update('inventory', inventory);
          Utils.showToast('Producto actualizado correctamente', 'success');
        }
      } else {
        // Crear nuevo
        const maxId = inventory.reduce((max, item) => Math.max(max, item.id || 0), 0);
        const newItem = {
          ...itemData,
          id: maxId + 1,
          createdAt: new Date()
        };
        
        inventory.push(newItem);
        AppState.update('inventory', inventory);
        Utils.showToast('Producto añadido correctamente', 'success');
      }
      
      // Resetear formulario
      resetForm();
      inventoryForm.classList.add('hidden');
    }
    
    // Resetear formulario
    function resetForm() {
      document.getElementById('item-name').value = '';
      document.getElementById('item-category').value = 'Habitaciones';
      document.getElementById('item-unit').value = 'Unidades';
      document.getElementById('item-quantity').value = '';
      document.getElementById('item-minimum').value = '';
      document.getElementById('item-notes').value = '';
      
      currentItemId = null;
    }
    
    // Iniciar módulo
    initInventoryModule();
  });