// ====================================================
// MÓDULO DE CONTEXTO DE HOTEL - js/modules/hotel-context.js
// ====================================================
// Sistema para cambiar entre hoteles y filtrar datos

const HotelContextModule = {
  
  // ====================================================
  // INICIALIZACIÓN DEL SELECTOR
  // ====================================================
  
  // Inicializar selector en topbar
  initHotelSelector() {
    console.log('🏨 Inicializando selector de contexto de hotel...');
    
    const topbar = document.querySelector('.topbar');
    if (!topbar) {
      console.error('❌ No se encontró la topbar para agregar el selector');
      return;
    }
    
    // Crear selector si no existe
    if (!document.getElementById('hotel-context-selector')) {
      const selectorHTML = `
        <div id="hotel-context-selector" class="hotel-context-selector">
          <label for="hotel-context-dropdown">
            <i class="fas fa-hotel"></i> Viendo:
          </label>
          <select id="hotel-context-dropdown" class="hotel-context-dropdown">
            <!-- Se llenará dinámicamente -->
          </select>
        </div>
      `;
      
      // Insertar antes de topbar-actions
      const topbarActions = topbar.querySelector('.topbar-actions');
      if (topbarActions) {
        topbarActions.insertAdjacentHTML('beforebegin', selectorHTML);
      } else {
        // Fallback: insertar al final de topbar
        topbar.insertAdjacentHTML('beforeend', selectorHTML);
      }
      
      // Configurar evento de cambio
      const dropdown = document.getElementById('hotel-context-dropdown');
      if (dropdown) {
        dropdown.addEventListener('change', (e) => {
          this.switchToHotel(e.target.value);
        });
      }
      
      console.log('✅ Selector de hotel agregado al topbar');
    }
    
    // Actualizar opciones del selector
    this.updateHotelSelectorOptions();
    
    // Actualizar título del dashboard según contexto
    this.updatePageTitleWithContext();
  },
  
  // Actualizar opciones del selector
  updateHotelSelectorOptions() {
    const selector = document.getElementById('hotel-context-dropdown');
    if (!selector) return;
    
    const currentUser = AppState.get('currentUser');
    if (!currentUser) {
      console.warn('⚠️ No hay usuario actual definido');
      return;
    }
    
    const userHotels = AppState.getHotelOptions();
    console.log('🏨 Actualizando selector con hoteles:', userHotels.map(h => h.name));
    
    // Limpiar y reconstruir opciones
    selector.innerHTML = '';
    
    // Opción "Vista Consolidada" si tiene acceso a múltiples hoteles
    if (userHotels.length > 1) {
      const option = document.createElement('option');
      option.value = 'ALL';
      option.textContent = `📊 Vista Consolidada (${userHotels.length} hoteles)`;
      selector.appendChild(option);
    }
    
    // Opciones de hoteles individuales
    userHotels.forEach(hotel => {
      const option = document.createElement('option');
      option.value = hotel.code;
      option.textContent = `🏨 ${hotel.name}`;
      
      // Agregar información adicional si está disponible
      if (hotel.location) {
        option.textContent += ` (${hotel.location})`;
      }
      
      selector.appendChild(option);
    });
    
    // Establecer valor actual
    const currentContext = currentUser.currentHotelContext || 'ALL';
    selector.value = currentContext;
    
    // Si no hay hoteles, mostrar mensaje
    if (userHotels.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Sin hoteles asignados';
      option.disabled = true;
      selector.appendChild(option);
    }
  },
  
  // ====================================================
  // CAMBIO DE CONTEXTO
  // ====================================================
  
  // Cambiar contexto de hotel
  switchToHotel(hotelCode) {
    const currentUser = AppState.get('currentUser');
    if (!currentUser) {
      console.error('❌ No hay usuario actual para cambiar contexto');
      return;
    }
    
    console.log(`🔄 Cambiando contexto de hotel a: ${hotelCode}`);
    
    // Verificar que el usuario tiene acceso al hotel
    if (hotelCode !== 'ALL') {
      const userHotels = AppState.getHotelOptions();
      const hasAccess = userHotels.some(h => h.code === hotelCode);
      
      if (!hasAccess) {
        console.error(`❌ Usuario no tiene acceso al hotel: ${hotelCode}`);
        Utils.showToast('No tienes acceso a ese hotel', 'error');
        
        // Revertir selector al valor anterior
        const selector = document.getElementById('hotel-context-dropdown');
        if (selector) {
          selector.value = currentUser.currentHotelContext;
        }
        return;
      }
    }
    
    // Actualizar contexto en el estado
    currentUser.currentHotelContext = hotelCode;
    AppState.update('currentUser', currentUser);

    // DEBUG: Verificar que el cambio se está guardando
console.log(`✅ Contexto actualizado en AppState: ${currentUser.currentHotelContext}`);
console.log(`📊 Datos disponibles - Tasks: ${AppState.get('tasks').length}, Hotels: ${AppState.getHotelOptions().length}`);
    
    // Refrescar vista actual con nuevo contexto
    this.refreshCurrentView();
    
    // Actualizar título de página
    this.updatePageTitleWithContext();
    
    // Log para debugging
    console.log(`✅ Contexto cambiado exitosamente a: ${hotelCode}`);
    
    // Mostrar notificación de cambio
    const hotelName = this.getHotelDisplayName(hotelCode);
    Utils.showToast(`Vista cambiada a: ${hotelName}`, 'info', 2000);
  },
  
  // Obtener nombre para mostrar del hotel
  getHotelDisplayName(hotelCode) {
    if (hotelCode === 'ALL') {
      const hotelCount = AppState.getHotelOptions().length;
      return `Vista Consolidada (${hotelCount} hoteles)`;
    }
    
    const hotel = AppState.getHotelOptions().find(h => h.code === hotelCode);
    return hotel ? hotel.name : hotelCode;
  },
  
  // ====================================================
  // FILTRADO DE DATOS POR CONTEXTO
  // ====================================================
  
  // Obtener datos filtrados por contexto actual
  getFilteredData(dataType) {
    const currentUser = AppState.get('currentUser');
    const context = currentUser ? currentUser.currentHotelContext : 'ALL';
    const allData = AppState.get(dataType) || [];
    
    console.log(`🔍 Filtrando ${dataType} por contexto: ${context}`);
    
    if (context === 'ALL') {
      // Vista consolidada: todos los hoteles del usuario
      const userHotelCodes = AppState.getHotelOptions().map(h => h.code);
      const filtered = allData.filter(item => {
        const itemHotel = item.hotel || item.hotelCode || item.hotelId;
        return userHotelCodes.includes(itemHotel);
      });
      
      console.log(`📊 Vista consolidada: ${filtered.length}/${allData.length} registros`);
      return filtered;
    } else {
      // Hotel específico
      const filtered = allData.filter(item => {
        const itemHotel = item.hotel || item.hotelCode || item.hotelId;
        return itemHotel === context;
      });
      
      console.log(`🏨 Hotel específico (${context}): ${filtered.length}/${allData.length} registros`);
      return filtered;
    }
  },
  
  // Verificar si un item pertenece al contexto actual
  isInCurrentContext(item) {
    const currentUser = AppState.get('currentUser');
    const context = currentUser ? currentUser.currentHotelContext : 'ALL';
    
    if (context === 'ALL') {
      const userHotelCodes = AppState.getHotelOptions().map(h => h.code);
      const itemHotel = item.hotel || item.hotelCode || item.hotelId;
      return userHotelCodes.includes(itemHotel);
    } else {
      const itemHotel = item.hotel || item.hotelCode || item.hotelId;
      return itemHotel === context;
    }
  },
  
  // ====================================================
  // ACTUALIZACIÓN DE VISTAS
  // ====================================================
  
  // Refrescar vista actual
  // Refrescar vista actual
refreshCurrentView() {
  const currentModule = AppState.get('currentModule') || 'dashboard-view';
  
  console.log(`🔄 Refrescando vista actual: ${currentModule}`);
  
  if (currentModule === 'dashboard-view') {
    // Refrescar dashboard con un pequeño delay para asegurar que el contexto se haya actualizado
    setTimeout(() => {
      if (typeof updateDashboardContentWithAlerts === 'function') {
        console.log('📊 Actualizando dashboard después de cambio de contexto...');
        updateDashboardContentWithAlerts();
      } else {
        console.error('❌ Función updateDashboardContentWithAlerts no encontrada');
      }
    }, 50);
  } else {
    // Disparar evento personalizado para otros módulos
    this.dispatchContextChangeEvent(currentModule);
  }
  
  // Actualizar selectores de hotel en la vista actual
  this.updateCurrentViewSelectors();
},
  
  // Disparar evento de cambio de contexto
  dispatchContextChangeEvent(moduleId) {
    const currentUser = AppState.get('currentUser');
    const context = currentUser ? currentUser.currentHotelContext : 'ALL';
    
    const event = new CustomEvent('hotelContextChanged', {
      detail: { 
        newContext: context,
        moduleId: moduleId,
        filteredData: {
          tasks: this.getFilteredData('tasks'),
          employees: this.getFilteredData('employees'),
          inventory: this.getFilteredData('inventory')
        }
      }
    });
    
    document.dispatchEvent(event);
    console.log(`📡 Evento hotelContextChanged disparado para: ${moduleId}`);
  },
  
  // Actualizar selectores de hotel en la vista actual
  updateCurrentViewSelectors() {
    // Buscar selectores de hotel en la vista actual y actualizarlos
    const hotelSelectors = document.querySelectorAll('select[id*="hotel"]:not(#hotel-context-dropdown)');
    
    hotelSelectors.forEach(selector => {
      const currentValue = selector.value;
      
      // Mantener opciones que no son de hoteles específicos
      const nonHotelOptions = Array.from(selector.options).filter(option => 
        option.value === '' || option.value === 'Ambos' || !AppState.getHotelOptions().some(h => h.code === option.value)
      );
      
      // Limpiar selector
      selector.innerHTML = '';
      
      // Restaurar opciones no hoteleras
      nonHotelOptions.forEach(option => selector.appendChild(option));
      
      // Agregar hoteles disponibles según contexto
      const availableHotels = AppState.getHotelOptions();
      availableHotels.forEach(hotel => {
        const option = document.createElement('option');
        option.value = hotel.code;
        option.textContent = hotel.name;
        selector.appendChild(option);
      });
      
      // Restaurar valor si es válido
      if (currentValue) {
        selector.value = currentValue;
      }
    });
  },
  
  // Actualizar título de página con contexto
  updatePageTitleWithContext() {
    const pageTitle = document.getElementById('page-title');
    if (!pageTitle) return;
    
    const currentModule = AppState.get('currentModule') || 'dashboard-view';
    const currentUser = AppState.get('currentUser');
    const context = currentUser ? currentUser.currentHotelContext : 'ALL';
    
    // Obtener título base del módulo
    let baseTitle = 'Prestotel';
    switch (currentModule) {
      case 'dashboard-view':
        baseTitle = 'Panel de Control';
        break;
      case 'tasks-view':
        baseTitle = 'Gestión de Tareas';
        break;
      case 'inventory-view':
        baseTitle = 'Inventario / Stock';
        break;
      case 'orders-view':
        baseTitle = 'Gestión de Pedidos';
        break;
      case 'chemicals-view':
        baseTitle = 'Productos Químicos';
        break;
      case 'employees-view':
        baseTitle = 'Gestión de Personal';
        break;
      case 'shifts-view':
        baseTitle = 'Turnos de Personal';
        break;
      case 'winter-view':
        baseTitle = 'Tareas de Invierno';
        break;
      case 'pools-view':
        baseTitle = 'Gestión de Piscinas';
        break;
      case 'admin-view':
        baseTitle = 'Administración';
        break;
    }
    
    // Agregar contexto de hotel al título
    if (context === 'ALL') {
      const hotelCount = AppState.getHotelOptions().length;
      if (hotelCount > 1) {
        pageTitle.textContent = `${baseTitle} - Vista Consolidada`;
      } else {
        pageTitle.textContent = baseTitle;
      }
    } else {
      const hotelName = this.getHotelDisplayName(context);
      pageTitle.textContent = `${baseTitle} - ${hotelName}`;
    }
  },
  
  // ====================================================
  // FUNCIONES DE UTILIDAD
  // ====================================================
  
  // Obtener contexto actual
  getCurrentContext() {
    const currentUser = AppState.get('currentUser');
    return currentUser ? currentUser.currentHotelContext : 'ALL';
  },
  
  // Verificar si está en vista consolidada
  isConsolidatedView() {
    return this.getCurrentContext() === 'ALL';
  },
  
  // Obtener información del hotel actual
  getCurrentHotelInfo() {
    const context = this.getCurrentContext();
    
    if (context === 'ALL') {
      return {
        code: 'ALL',
        name: 'Vista Consolidada',
        isConsolidated: true,
        hotelCount: AppState.getHotelOptions().length
      };
    }
    
    const hotel = AppState.getHotelOptions().find(h => h.code === context);
    return hotel ? { ...hotel, isConsolidated: false } : null;
  },
  
  // ====================================================
  // EVENTOS Y LISTENERS
  // ====================================================
  
  // Configurar listeners para eventos del sistema
  setupEventListeners() {
    // Listener para cambios en el estado de AppState
    AppState.subscribe('currentUser', (user) => {
      if (user && user.currentHotelContext) {
        console.log('👤 Usuario actualizado, refrescando selector de hotel');
        this.updateHotelSelectorOptions();
      }
    });
    
    AppState.subscribe('hotels', (hotels) => {
      console.log('🏨 Hoteles actualizados, refrescando selector');
      this.updateHotelSelectorOptions();
    });
    
    // Listener para cambios de módulo
    AppState.subscribe('currentModule', (moduleId) => {
      console.log(`📱 Módulo cambiado a: ${moduleId}`);
      setTimeout(() => {
        this.updatePageTitleWithContext();
        this.updateCurrentViewSelectors();
      }, 100); // Pequeño delay para que el módulo se cargue
    });
  },
  
  // ====================================================
  // INICIALIZACIÓN
  // ====================================================
  
  // Inicializar módulo completo
  init() {
    console.log('🚀 Inicializando módulo de contexto de hotel...');
    
    // Configurar listeners
    this.setupEventListeners();
    
    // Inicializar selector en topbar
    this.initHotelSelector();
    
    // Verificar contexto inicial
    const currentUser = AppState.get('currentUser');
    if (currentUser && !currentUser.currentHotelContext) {
      // Establecer contexto por defecto
      currentUser.currentHotelContext = 'ALL';
      AppState.update('currentUser', currentUser);
    }
    
    console.log('✅ Módulo de contexto de hotel inicializado');
    console.log(`🏨 Contexto actual: ${this.getCurrentContext()}`);
  },
  
  // Cleanup para testing o reset
  destroy() {
    const selector = document.getElementById('hotel-context-selector');
    if (selector) {
      selector.remove();
    }
    console.log('🧹 Módulo de contexto de hotel limpiado');
  }
};

// Inicializar automáticamente cuando se carga el script
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    HotelContextModule.init();
  });
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.HotelContextModule = HotelContextModule;
}