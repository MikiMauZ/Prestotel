// Correcciones para el módulo de gestión de pedidos
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en la página de pedidos
    const ordersView = document.getElementById('orders-view');
    if (!ordersView) return;
    
    // Elementos DOM
    let ordersList;
    let filterStatus;
    let filterSupplier;
    let searchInput;
    let orderForm;
    let btnNewOrder;
    let saveOrderBtn;
    
    // Variables de estado
    let currentOrderId = null;
    
    // Inicializar módulo
    function initOrdersModule() {
        console.log('Inicializando módulo de pedidos...');
        
        // Renderizar la estructura base del módulo
        renderModuleStructure();
        
        // Obtener referencias a elementos DOM
        ordersList = document.getElementById('orders-list');
        filterStatus = document.getElementById('filter-status');
        filterSupplier = document.getElementById('filter-supplier');
        searchInput = document.getElementById('search-order');
        orderForm = document.getElementById('order-form');
        btnNewOrder = document.getElementById('btn-new-order');
        saveOrderBtn = document.getElementById('save-order-btn');
        
        // Verificar si hay datos de pedidos en AppState
        if (!AppState.get('orders') || AppState.get('orders').length === 0) {
            console.log('No hay pedidos en AppState, cargando datos de ejemplo...');
            loadMockOrdersData();
        }
        
        // Suscribirse a cambios en pedidos
        AppState.subscribe('orders', renderOrders);
        
        // Configurar eventos
        setupEventListeners();
        
        // IMPORTANTE: Renderizar pedidos inmediatamente
        console.log('Renderizando pedidos iniciales...');
        renderOrders(AppState.get('orders'));
    }
    
    // Crear mock data para pedidos si no existe
    function loadMockOrdersData() {
      if (AppState.get('orders').length === 0) {
        const mockOrders = [
          {
            id: 1,
            title: "Reposición de toallas",
            supplier: "Textil Hotelera S.L.",
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Una semana en el futuro
            amount: 1250.50,
            items: "50 toallas grandes blancas\n30 toallas medianas blancas\n20 alfombrillas de baño",
            status: "pending",
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Hace 2 días
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          },
          {
            id: 2,
            title: "Productos de limpieza",
            supplier: "Limpieza Industrial",
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 días en el futuro
            amount: 780.25,
            items: "20 litros de desinfectante\n10 litros de limpiador multiusos\n5 cajas de guantes desechables",
            status: "requested",
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Hace 5 días
            updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // Hace 1 día
          },
          {
            id: 3,
            title: "Bombillas LED",
            supplier: "ElectroSuministros",
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 días en el pasado
            amount: 350.00,
            items: "100 bombillas LED 9W\n50 bombillas LED 12W",
            status: "completed",
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // Hace 15 días
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // Hace 2 días
          },
          {
            id: 4,
            title: "Artículos de oficina",
            supplier: "Office Supply",
            date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 días en el futuro
            amount: 120.75,
            items: "5 cajas de papel A4\n10 bolígrafos\n3 cartuchos de tinta",
            status: "pending",
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Hace 1 día
            updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          },
          {
            id: 5,
            title: "Productos de cafetería",
            supplier: "DistCafé",
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 días en el pasado
            amount: 425.30,
            items: "10 kg de café en grano\n200 cápsulas variadas\n5 kg de azúcar",
            status: "rejected",
            rejectionReason: "Proveedor sin stock actual",
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Hace 10 días
            updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // Hace 5 días
          }
        ];
        
        // Guardar en AppState
        AppState.data.orders = mockOrders;
        AppState.saveToLocalStorage();
        console.log('Datos de ejemplo de pedidos cargados en AppState:', mockOrders.length);
      }
    }
    
    // Renderizar la estructura base del módulo
    function renderModuleStructure() {
        ordersView.innerHTML = `
          <h2 class="section-title"><i class="fas fa-shopping-cart"></i> Gestión de Pedidos</h2>
          
          <div class="action-bar">
            <button id="btn-new-order" class="btn btn-primary"><i class="fas fa-plus"></i> Nuevo Pedido</button>
            <div class="filters">
              <select id="filter-status" class="form-control">
                <option value="">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="requested">Pedidos</option>
                <option value="completed">Completados</option>
                <option value="rejected">Rechazados</option>
              </select>
              <select id="filter-supplier" class="form-control">
                <option value="">Todos los proveedores</option>
                <!-- Se llenará dinámicamente -->
              </select>
              <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" id="search-order" class="form-control" placeholder="Buscar pedido...">
              </div>
            </div>
          </div>
          
          <!-- Formulario para añadir/editar pedido -->
          <div id="order-form" class="form-container hidden">
            <h3 class="form-title" id="form-title">Nuevo Pedido</h3>
            <div class="form-group">
              <label for="order-title">Título del pedido *</label>
              <input type="text" id="order-title" class="form-control" placeholder="Título descriptivo">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="order-supplier">Proveedor *</label>
                <input type="text" id="order-supplier" class="form-control" placeholder="Nombre del proveedor">
              </div>
              <div class="form-group">
                <label for="order-date">Fecha necesaria (opcional)</label>
                <input type="date" id="order-date" class="form-control">
              </div>
            </div>
            <div class="form-group">
              <label for="order-items">Elementos a pedir</label>
              <textarea id="order-items" class="form-control" placeholder="Lista detallada de artículos..."></textarea>
            </div>
            <div class="form-group">
              <label for="order-amount">Importe estimado (€) (opcional)</label>
              <input type="number" id="order-amount" class="form-control" step="0.01" min="0" placeholder="0.00">
            </div>
            <div class="form-actions">
              <button id="cancel-order-btn" class="btn btn-secondary">Cancelar</button>
              <button id="save-order-btn" class="btn btn-primary">Guardar Pedido</button>
            </div>
          </div>
          
          <!-- Lista de pedidos -->
          <div id="orders-list" class="orders-list">
            <!-- Se llenará dinámicamente -->
            <p class="text-center" id="no-orders-message">Cargando pedidos...</p>
          </div>
        `;
    }
    
    // Configurar eventos
    function setupEventListeners() {
      // Filtros
      filterStatus.addEventListener('change', () => {
        renderOrders(applyFilters());
      });
      
      filterSupplier.addEventListener('change', () => {
        renderOrders(applyFilters());
      });
      
      searchInput.addEventListener('input', () => {
        renderOrders(applyFilters());
      });
      
      // Nuevo pedido
      btnNewOrder.addEventListener('click', () => {
        resetForm();
        document.getElementById('form-title').textContent = 'Nuevo Pedido';
        
        // Establecer fecha mínima (hoy)
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('order-date').min = today;
        
        orderForm.classList.remove('hidden');
        document.getElementById('order-title').focus();
      });
      
      // Cancelar
      document.getElementById('cancel-order-btn').addEventListener('click', () => {
        orderForm.classList.add('hidden');
      });
      
      // Guardar pedido
      saveOrderBtn.addEventListener('click', saveOrder);
    }
    
    // Renderizar lista de pedidos
    function renderOrders(orders) {
        if (!ordersList) return;
        
        // Actualizar selector de proveedores
        updateSupplierFilter(orders);
        
        // Aplicar filtros
        const filteredOrders = Array.isArray(orders) ? orders : applyFilters();
        
        // Limpiar lista
        ordersList.innerHTML = '';
        
        if (filteredOrders.length === 0) {
          ordersList.innerHTML = '<p class="text-center">No hay pedidos que coincidan con los filtros</p>';
          return;
        }
      
      // Ordenar: primero pendientes y solicitados, por fecha
      const sortedOrders = [...filteredOrders].sort((a, b) => {
        // Status priority: pending > requested > completed > rejected
        const statusOrder = { pending: 0, requested: 1, completed: 2, rejected: 3 };
        
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        
        // Para pendientes y solicitados, ordenar por fecha (más próxima primero)
        if (a.status === 'pending' || a.status === 'requested') {
          return new Date(a.date) - new Date(b.date);
        }
        
        // Para completados y rechazados, por fecha de actualización (más reciente primero)
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
      
      sortedOrders.forEach(order => {
        // Determinar clase CSS y texto según estado
        const statusClass = {
          pending: 'status-pending',
          requested: 'status-requested',
          completed: 'status-completed',
          rejected: 'status-rejected'
        }[order.status] || 'status-pending';
        
        const statusText = {
          pending: 'Pendiente',
          requested: 'Pedido',
          completed: 'Completado',
          rejected: 'Rechazado'
        }[order.status] || 'Pendiente';
        
        const card = document.createElement('div');
        card.className = `order-item ${statusClass}`;
        card.setAttribute('data-id', order.id);
        
        // Verificar si la fecha ha pasado
        const today = new Date();
        const orderDate = new Date(order.date);
        const isOverdue = orderDate < today && (order.status === 'pending' || order.status === 'requested');
        
        // Formatear cantidad con 2 decimales
        const formattedAmount = order.amount ? order.amount.toFixed(2).replace('.', ',') : '0,00';
        
        // Formatear fecha de creación
        const createdDate = Utils.formatDate(order.createdAt);
        
        card.innerHTML = `
          <div class="order-item-header">
            <h3 class="order-item-title">${Utils.sanitizeHTML(order.title)}</h3>
            <div>
              <span class="task-tag ${statusClass}-tag">${statusText}</span>
            </div>
          </div>
          <div class="order-item-body">
            <div class="order-meta">
              <div class="order-supplier">
                <i class="fas fa-building"></i> ${Utils.sanitizeHTML(order.supplier)}
              </div>
              ${order.date ? `
              <div class="order-date ${isOverdue ? 'overdue' : ''}">
                <i class="fas fa-calendar-alt"></i> Fecha necesaria: ${Utils.formatDate(order.date)}
                ${isOverdue ? '<span class="overdue-badge">Vencido</span>' : ''}
              </div>
              ` : ''}
              <div class="order-created">
                <i class="fas fa-calendar-check"></i> Fecha creación: ${createdDate}
              </div>
              <div class="order-amount">
                <i class="fas fa-euro-sign"></i> ${formattedAmount} €
              </div>
            </div>
            <div class="order-content">
              <h4>Artículos:</h4>
              <pre class="order-items">${Utils.sanitizeHTML(order.items || '')}</pre>
            </div>
            ${order.rejectionReason ? `
              <div class="rejection-reason">
                <i class="fas fa-exclamation-circle"></i> Motivo de rechazo: ${Utils.sanitizeHTML(order.rejectionReason)}
              </div>
            ` : ''}
          </div>
          <div class="order-item-actions">
            <button class="btn-edit-order" data-id="${order.id}"><i class="fas fa-edit"></i> Editar</button>
            ${order.status === 'pending' ? `
              <button class="btn-request-order" data-id="${order.id}"><i class="fas fa-paper-plane"></i> Pedir</button>
              <button class="btn-reject-order" data-id="${order.id}"><i class="fas fa-times"></i> Rechazar</button>
            ` : ''}
            ${order.status === 'requested' ? `
              <button class="btn-complete-order" data-id="${order.id}"><i class="fas fa-check"></i> Completar</button>
              <button class="btn-reject-order" data-id="${order.id}"><i class="fas fa-times"></i> Rechazar</button>
            ` : ''}
            <button class="btn-delete-order" data-id="${order.id}"><i class="fas fa-trash"></i> Eliminar</button>
          </div>
        `;
        
        ordersList.appendChild(card);
      });
      
      // Configurar eventos para botones
      document.querySelectorAll('.btn-edit-order').forEach(btn => {
        btn.addEventListener('click', () => {
          const orderId = parseInt(btn.getAttribute('data-id'));
          editOrder(orderId);
        });
      });
      
      document.querySelectorAll('.btn-request-order').forEach(btn => {
        btn.addEventListener('click', () => {
          const orderId = parseInt(btn.getAttribute('data-id'));
          updateOrderStatus(orderId, 'requested');
        });
      });
      
      document.querySelectorAll('.btn-complete-order').forEach(btn => {
        btn.addEventListener('click', () => {
          const orderId = parseInt(btn.getAttribute('data-id'));
          updateOrderStatus(orderId, 'completed');
        });
      });
      
      document.querySelectorAll('.btn-reject-order').forEach(btn => {
        btn.addEventListener('click', () => {
          const orderId = parseInt(btn.getAttribute('data-id'));
          openRejectDialog(orderId);
        });
      });
      
      document.querySelectorAll('.btn-delete-order').forEach(btn => {
        btn.addEventListener('click', () => {
          const orderId = parseInt(btn.getAttribute('data-id'));
          deleteOrder(orderId);
        });
      });
    }
    
    // Actualizar el selector de proveedores
    function updateSupplierFilter(orders) {
      // Guardar valor actual
      const currentValue = filterSupplier.value;
      
      // Extraer proveedores únicos
      const suppliers = [...new Set(orders.map(order => order.supplier))].sort();
      
      // Limpiar opciones actuales (excepto la primera)
      while (filterSupplier.options.length > 1) {
        filterSupplier.remove(1);
      }
      
      // Añadir opciones
      suppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier;
        option.textContent = supplier;
        filterSupplier.appendChild(option);
      });
      
      // Restaurar valor si existía
      if (currentValue && suppliers.includes(currentValue)) {
        filterSupplier.value = currentValue;
      }
    }
    
    // Aplicar filtros
    function applyFilters() {
      const status = filterStatus ? filterStatus.value : '';
      const supplier = filterSupplier ? filterSupplier.value : '';
      const search = searchInput ? searchInput.value.toLowerCase() : '';
      
      const orders = AppState.get('orders') || [];
      
      return orders.filter(order => {
        const matchesStatus = !status || order.status === status;
        const matchesSupplier = !supplier || order.supplier === supplier;
        const matchesSearch = !search || 
                             order.title.toLowerCase().includes(search) ||
                             order.supplier.toLowerCase().includes(search) ||
                             (order.items && order.items.toLowerCase().includes(search));
        
        return matchesStatus && matchesSupplier && matchesSearch;
      });
    }
    
    // Editar pedido
    function editOrder(orderId) {
      const orders = AppState.get('orders');
      const order = orders.find(o => o.id === orderId);
      
      if (!order) {
        Utils.showToast('Pedido no encontrado', 'error');
        return;
      }
      
      // No permitir editar pedidos completados o rechazados
      if (order.status === 'completed' || order.status === 'rejected') {
        Utils.showToast('No se pueden editar pedidos completados o rechazados', 'warning');
        return;
      }
      
      // Llenar formulario
      document.getElementById('order-title').value = order.title;
      document.getElementById('order-supplier').value = order.supplier;
      
      // Formatear fecha (YYYY-MM-DD) solo si existe
      if (order.date) {
        const dateObj = new Date(order.date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        document.getElementById('order-date').value = `${year}-${month}-${day}`;
      } else {
        document.getElementById('order-date').value = '';
      }
      
      document.getElementById('order-items').value = order.items || '';
      document.getElementById('order-amount').value = order.amount || '';
      
      // Actualizar título y ID actual
      document.getElementById('form-title').textContent = 'Editar Pedido';
      currentOrderId = orderId;
      
      // Mostrar formulario
      orderForm.classList.remove('hidden');
      document.getElementById('order-title').focus();
    }
    
    // Abrir diálogo para rechazar pedido
    function openRejectDialog(orderId) {
      const orders = AppState.get('orders');
      const order = orders.find(o => o.id === orderId);
      
      if (!order) {
        Utils.showToast('Pedido no encontrado', 'error');
        return;
      }
      
      // Crear diálogo modal
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Rechazar Pedido</h3>
            <span class="close-modal">&times;</span>
          </div>
          <div class="modal-body">
            <p>Pedido: <strong>${Utils.sanitizeHTML(order.title)}</strong></p>
            <div class="form-group">
              <label for="rejection-reason">Motivo del rechazo</label>
              <textarea id="rejection-reason" class="form-control" placeholder="Indica el motivo del rechazo..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button id="cancel-reject" class="btn btn-secondary">Cancelar</button>
            <button id="confirm-reject" class="btn btn-danger">Confirmar Rechazo</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Configurar eventos
      modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
      });
      
      modal.querySelector('#cancel-reject').addEventListener('click', () => {
        modal.remove();
      });
      
      modal.querySelector('#confirm-reject').addEventListener('click', () => {
        const reason = modal.querySelector('#rejection-reason').value.trim();
        
        if (!reason) {
          alert('Por favor, indica el motivo del rechazo');
          return;
        }
        
        // Actualizar estado y guardar motivo
        updateOrderStatus(orderId, 'rejected', reason);
        
        // Cerrar modal
        modal.remove();
      });
      
      // Abrir modal
      setTimeout(() => {
        modal.style.opacity = '1';
        modal.querySelector('#rejection-reason').focus();
      }, 10);
    }
    
    // Actualizar estado de un pedido
    function updateOrderStatus(orderId, newStatus, rejectionReason = '') {
      const orders = AppState.get('orders');
      const orderIndex = orders.findIndex(o => o.id === orderId);
      
      if (orderIndex === -1) {
        Utils.showToast('Pedido no encontrado', 'error');
        return;
      }
      
      // Actualizar estado
      orders[orderIndex].status = newStatus;
      orders[orderIndex].updatedAt = new Date();
      
      // Si es un rechazo, guardar motivo
      if (newStatus === 'rejected' && rejectionReason) {
        orders[orderIndex].rejectionReason = rejectionReason;
      }
      
      // Actualizar en AppState
      AppState.update('orders', orders);
      
      // Mostrar notificación
      const statusText = {
        pending: 'pendiente',
        requested: 'solicitado',
        completed: 'completado',
        rejected: 'rechazado'
      }[newStatus] || newStatus;
      
      Utils.showToast(`Pedido marcado como ${statusText}`, 'success');
    }
    
    // Eliminar pedido
    function deleteOrder(orderId) {
      Utils.confirmAction(
        '¿Estás seguro de que deseas eliminar este pedido?',
        () => {
          const orders = AppState.get('orders');
          const newOrders = orders.filter(o => o.id !== orderId);
          
          AppState.update('orders', newOrders);
          Utils.showToast('Pedido eliminado correctamente', 'success');
        }
      );
    }
    
    // Guardar o actualizar pedido
    function saveOrder() {
        // Obtener valores del formulario
        const titleEl = document.getElementById('order-title');
        const supplierEl = document.getElementById('order-supplier');
        const dateEl = document.getElementById('order-date');
        const itemsEl = document.getElementById('order-items');
        const amountEl = document.getElementById('order-amount');
        
        // Validar campos obligatorios
        if (!titleEl.value.trim()) {
            Utils.showToast('Por favor introduce un título para el pedido', 'error');
            titleEl.focus();
            return;
        }
        
        if (!supplierEl.value.trim()) {
            Utils.showToast('Por favor introduce el nombre del proveedor', 'error');
            supplierEl.focus();
            return;
        }
        
        // Preparar datos del pedido
        const orderData = {
            title: titleEl.value.trim(),
            supplier: supplierEl.value.trim(),
            // Fecha necesaria (opcional)
            date: dateEl.value ? new Date(dateEl.value) : null,
            items: itemsEl.value.trim(),
            // Importe (opcional) - si no hay valor, usamos 0
            amount: amountEl.value ? Number(amountEl.value) : 0,
            updatedAt: new Date()
        };
        
        // Si es un nuevo pedido, añadir campos adicionales
        if (!currentOrderId) {
            orderData.status = 'pending';
            orderData.createdAt = new Date(); // Fecha de creación automática
        }
        
        // Deshabilitar botón para evitar múltiples clics
        saveOrderBtn.disabled = true;
        
        // Guardar en AppState
        const orders = [...AppState.get('orders')];
        
        if (currentOrderId) {
            // Actualizar existente
            const index = orders.findIndex(o => o.id === currentOrderId);
            if (index !== -1) {
                orders[index] = { ...orders[index], ...orderData };
                AppState.update('orders', orders);
                Utils.showToast('Pedido actualizado correctamente', 'success');
            }
        } else {
            // Crear nuevo
            const maxId = orders.reduce((max, o) => Math.max(max, o.id || 0), 0);
            const newOrder = {
                ...orderData,
                id: maxId + 1
            };
            
            orders.push(newOrder);
            AppState.update('orders', orders);
            Utils.showToast('Pedido creado correctamente', 'success');
        }
        
        // Restablecer el formulario
        resetForm();
        orderForm.classList.add('hidden');
        saveOrderBtn.disabled = false;
        
        // Renderizar pedidos actualizados
        renderOrders(orders);
    }
    
    // Resetear formulario
    function resetForm() {
      document.getElementById('order-title').value = '';
      document.getElementById('order-supplier').value = '';
      document.getElementById('order-date').value = '';
      document.getElementById('order-items').value = '';
      document.getElementById('order-amount').value = '';
      
      currentOrderId = null;
    }
    
    // Iniciar módulo
    initOrdersModule();

    // Exportar funciones necesarias para botones inline
    window.editOrder = editOrder;
    window.deleteOrder = deleteOrder;
    window.updateOrderStatus = updateOrderStatus;
  });