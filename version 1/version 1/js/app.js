// ====================================================
// APLICACIÓN PRINCIPAL PRESTOTEL - js/app.js
// ====================================================
// Sistema de gestión hotelera con autenticación Firebase

// ====================================================
// INICIALIZACIÓN PRINCIPAL
// ====================================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Iniciando aplicación Prestotel...');
  
  // Verificar Firebase
  if (typeof firebase === 'undefined') {
    console.error('❌ Firebase no disponible');
    alert('Error: Firebase no está disponible. Verifica la conexión.');
    return;
  }
  
  console.log('🔥 Firebase disponible');
  
  // ⭐ INICIALIZAR FIREBASE AUTH MODULE
  if (typeof FirebaseAuthModule !== 'undefined') {
    console.log('🔐 Inicializando FirebaseAuthModule...');
    FirebaseAuthModule.init();
  } else {
    console.error('❌ FirebaseAuthModule no disponible');
    alert('Error: Sistema de autenticación no disponible');
    return;
  }
  
  console.log('✅ Aplicación inicializada, esperando autenticación...');
});

// ====================================================
// FUNCIONES PRINCIPALES DE LA APLICACIÓN
// ====================================================

// Inicializar aplicación para usuarios autenticados
function initializeAuthenticatedApp() {
  console.log('🚀 Inicializando aplicación para usuario autenticado...');
  
  try {
    // Inicializar el estado de la aplicación
    initializeAppState();
    
    // ⭐ CONFIGURAR NAVEGACIÓN CORREGIDA
    setupNavigation();
    
    // Inicializar el dashboard
    initializeDashboard();
    
    // Configurar notificaciones
    setupNotifications();
    
    // Actualizar contador de notificaciones
    updateNotificationCount();
    
    // Mostrar notificación de bienvenida
    const currentUser = AppState.get('currentUser');
    if (currentUser) {
      setTimeout(() => {
        console.log(`🎉 Bienvenido ${currentUser.name}!`);
      }, 1000);
    }
    
    console.log('✅ Aplicación inicializada correctamente');
    
  } catch (error) {
    console.error('❌ Error al inicializar aplicación:', error);
    alert('Error al inicializar la aplicación. Recargando...');
    window.location.reload();
  }
}

// Inicializar AppState
function initializeAppState() {
  console.log('📊 Inicializando estado de la aplicación...');
  
  // Intentar cargar desde localStorage
  if (typeof AppState !== 'undefined' && AppState.loadFromLocalStorage) {
    AppState.loadFromLocalStorage();
  } else {
    console.error('ERROR: AppState no está definido. Verifica que appState.js se está cargando correctamente.');
    return;
  }
  
  // Si no hay datos, cargar datos iniciales si AppState existe
  if (typeof AppState !== 'undefined' && AppState.init && (!AppState.get('tasks') || AppState.get('tasks').length === 0)) {
    AppState.init();
  }
  
  console.log('✅ Estado de la aplicación inicializado.');
}

// ====================================================
// CONFIGURACIÓN DE NAVEGACIÓN CORREGIDA
// ====================================================

function setupNavigation() {
  console.log('🧭 Configurando navegación...');
  
  try {
    // ⭐ CONFIGURACIÓN ESPECÍFICA PARA TU HTML
    const menuLinks = [
      { href: '#dashboard-view', module: 'dashboard-view' },
      { href: '#tasks-view', module: 'tasks-view' },
      { href: '#inventory-view', module: 'inventory-view' },
      { href: '#orders-view', module: 'orders-view' },
      { href: '#chemicals-view', module: 'chemicals-view' },
      { href: '#employees-view', module: 'employees-view' },
      { href: '#shifts-view', module: 'shifts-view' },
      { href: '#winter-view', module: 'winter-view' },
      { href: '#pools-view', module: 'pools-view' },
      { href: '#admin-view', module: 'admin-view' }
    ];

    // Configurar cada link del menú
    menuLinks.forEach(item => {
      const link = document.querySelector(`a[href="${item.href}"]`);
      if (link) {
        // Remover listeners existentes
        link.replaceWith(link.cloneNode(true));
        const newLink = document.querySelector(`a[href="${item.href}"]`);
        
        newLink.addEventListener('click', (e) => {
          e.preventDefault();
          console.log(`🖱️ Click en: ${newLink.textContent.trim()} → ${item.module}`);
          
          // Navegación
          showModule(item.module);
          
          // Actualizar menú activo
          document.querySelectorAll('.menu a').forEach(l => l.classList.remove('active'));
          newLink.classList.add('active');
          
          console.log(`✅ Navegado a ${item.module}`);
        });
        
        console.log(`✅ ${newLink.textContent.trim()} configurado`);
      } else {
        console.warn(`⚠️ No encontrado link: ${item.href}`);
      }
    });
    
    // ⭐ CONFIGURAR LOGOUT
    setupLogout();
    
    console.log('✅ Navegación configurada completamente');
    
  } catch (error) {
    console.error('❌ Error configurando navegación:', error);
  }
}

function setupLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  console.log('🚪 Configurando logout, botón encontrado:', !!logoutBtn);
  
  if (logoutBtn) {
    // Limpiar listeners existentes
    const newLogoutBtn = logoutBtn.cloneNode(true);
    logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
    
    newLogoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      console.log('🚪 Logout clickeado');
      
      // ⭐ MOSTRAR MODAL PERSONALIZADO
      const confirmed = await showLogoutModal();
      
      if (confirmed) {
        try {
          console.log('🔐 Iniciando logout con FirebaseAuthModule...');
          
          if (typeof FirebaseAuthModule !== 'undefined' && FirebaseAuthModule.signOut) {
            const result = await FirebaseAuthModule.signOut();
            
            if (result.success) {
              console.log('✅ Logout exitoso');
            } else {
              console.error('❌ Error en logout:', result.error);
              throw new Error(result.error);
            }
          } else {
            console.warn('⚠️ FirebaseAuthModule no disponible, usando auth directo...');
            await auth.signOut();
            console.log('✅ Logout directo exitoso');
          }
          
        } catch (error) {
          console.error('❌ Error en logout:', error);
          AppState.update('currentUser', null);
          AppState.update('isAuthenticated', false);
          alert('Error al cerrar sesión, recargando página...');
          window.location.reload();
        }
      } else {
        console.log('🚫 Logout cancelado por el usuario');
      }
    });
    
    console.log('✅ Logout con modal personalizado configurado');
  } else {
    console.warn('⚠️ Botón logout no encontrado en el DOM');
  }
}

// ====================================================
// GESTIÓN DE MÓDULOS
// ====================================================

// Mostrar un módulo específico
function showModule(moduleId) {
  console.log(`📱 Mostrando módulo: ${moduleId}`);
  
  try {
    // Verificar si el módulo existe
    const moduleElement = document.getElementById(moduleId);
    
    if (!moduleElement) {
      console.error(`ERROR: No se encontró el módulo con ID: ${moduleId}`);
      
      // Intentar mostrar el dashboard como alternativa
      console.log('Intentando mostrar el dashboard como alternativa...');
      const dashboard = document.getElementById('dashboard-view');
      
      if (dashboard) {
        showDashboard();
        return;
      } else {
        console.error('ERROR CRÍTICO: No se pudo encontrar el dashboard.');
        return;
      }
    }
    
    // Ocultar todos los módulos
    document.querySelectorAll('.module-view').forEach(view => {
      view.classList.add('hidden');
    });
    
    // Mostrar el módulo seleccionado
    moduleElement.classList.remove('hidden');
    
    // Actualizar título de la página
    updatePageTitle(moduleId);
    
    // Actualizar estado
    if (typeof AppState !== 'undefined') {
      AppState.update('currentModule', moduleId);
    }
    
    // Si es admin, verificar permisos
    if (moduleId === 'admin-view') {
      initializeAdminIfNeeded();
    }
    
    // Si es dashboard, actualizar contenido
    if (moduleId === 'dashboard-view') {
      setTimeout(() => {
        updateDashboardContentWithAlerts();
      }, 100);
    }
    
    console.log(`✅ Módulo ${moduleId} mostrado correctamente.`);
    
  } catch (error) {
    console.error('❌ Error mostrando módulo:', error);
    showDashboard(); // Fallback al dashboard
  }
}

// Mostrar dashboard específicamente
function showDashboard() {
  const dashboardView = document.getElementById('dashboard-view');
  
  if (dashboardView) {
    // Ocultar todos los módulos
    document.querySelectorAll('.module-view').forEach(view => {
      view.classList.add('hidden');
    });
    
    // Mostrar dashboard
    dashboardView.classList.remove('hidden');
    updatePageTitle('dashboard-view');
    
    if (typeof AppState !== 'undefined') {
      AppState.update('currentModule', 'dashboard-view');
    }
    
    // Actualizar contenido del dashboard
    updateDashboardContentWithAlerts();
    
    console.log('✅ Dashboard mostrado');
  } else {
    console.error('❌ Dashboard no encontrado');
  }
}

// Inicializar módulo admin si es necesario
function initializeAdminIfNeeded() {
  if (typeof initAdminModule === 'function') {
    console.log('🔧 Inicializando módulo admin...');
    initAdminModule();
  } else {
    console.warn('⚠️ Módulo admin no disponible');
  }
}

// Actualizar título de la página
function updatePageTitle(moduleId) {
  const pageTitle = document.getElementById('page-title');
  if (!pageTitle) return;
  
  // Obtener el título según el módulo
  let title;
  switch (moduleId) {
    case 'dashboard-view':
      title = 'Panel de Control';
      break;
    case 'tasks-view':
      title = 'Gestión de Tareas';
      break;
    case 'inventory-view':
      title = 'Inventario / Stock';
      break;
    case 'orders-view':
      title = 'Gestión de Pedidos';
      break;
    case 'chemicals-view':
      title = 'Productos Químicos';
      break;
    case 'employees-view':
      title = 'Gestión de Personal';
      break;
    case 'shifts-view':
      title = 'Turnos de Personal';
      break;
    case 'winter-view':
      title = 'Tareas de Invierno';
      break;
    case 'pools-view':
      title = 'Gestión de Piscinas';
      break;
    case 'admin-view':
      title = 'Administración';
      break;
    default:
      title = 'Prestotel';
  }
  
  pageTitle.textContent = title;
}

// ====================================================
// GESTIÓN DEL DASHBOARD
// ====================================================

// Inicializar el dashboard
function initializeDashboard() {
  console.log('📊 Inicializando el dashboard...');
  
  try {
    // Verificar si ya existe el dashboard
    let dashboardView = document.getElementById('dashboard-view');
    
    if (dashboardView) {
      console.log('Dashboard encontrado, actualizando contenido...');
      updateDashboardContentWithAlerts();
    } else {
      console.warn('⚠️ Dashboard no encontrado en HTML');
    }
    
    // Mostrar dashboard por defecto
    showDashboard();
    
  } catch (error) {
    console.error('❌ Error inicializando dashboard:', error);
  }
}

// ====================================================
// DASHBOARD MEJORADO CON CONTEXTO DE HOTEL
// ====================================================

function updateDashboardContentWithAlerts() {
  const dashboardView = document.getElementById('dashboard-view');
  if (!dashboardView) return;
  
  console.log('🚨 Actualizando dashboard con sistema de alertas y contexto...');
  
  try {
    // ⭐ OBTENER DATOS FILTRADOS POR CONTEXTO DE HOTEL
    const tasks = (typeof HotelContextModule !== 'undefined' && HotelContextModule.getFilteredData) 
      ? HotelContextModule.getFilteredData('tasks') 
      : AppState.get('tasks') || [];
      
    const employees = (typeof HotelContextModule !== 'undefined' && HotelContextModule.getFilteredData) 
      ? HotelContextModule.getFilteredData('employees') 
      : AppState.get('employees') || [];
      
    const inventory = (typeof HotelContextModule !== 'undefined' && HotelContextModule.getFilteredData) 
      ? HotelContextModule.getFilteredData('inventory') 
      : AppState.get('inventory') || [];
    
    console.log(`📊 Datos filtrados - Tareas: ${tasks.length}, Empleados: ${employees.length}, Inventario: ${inventory.length}`);
    
    // Generar alertas con datos filtrados
    const systemAlerts = generateSystemAlertsWithContext(tasks, employees, inventory);
    const criticalAlerts = systemAlerts.filter(alert => alert.priority === 'critical');
    const importantAlerts = systemAlerts.filter(alert => alert.priority === 'important');
    const infoAlerts = systemAlerts.filter(alert => alert.priority === 'info');
    
    // ⭐ OBTENER INFORMACIÓN DE CONTEXTO ACTUAL
    const currentUser = AppState.get('currentUser');
    const context = currentUser ? currentUser.currentHotelContext : 'ALL';
    const hotelInfo = (typeof HotelContextModule !== 'undefined' && HotelContextModule.getCurrentHotelInfo) 
      ? HotelContextModule.getCurrentHotelInfo() 
      : null;
    
    // ⭐ GENERAR TÍTULO DINÁMICO SEGÚN CONTEXTO
    let contextTitle = "Centro de Control";
    let contextSubtitle = "";
    
    if (hotelInfo) {
      if (hotelInfo.isConsolidated) {
        contextTitle = `Centro de Control - Vista Consolidada`;
        contextSubtitle = `Supervisando ${hotelInfo.hotelCount} hoteles`;
      } else {
        contextTitle = `Centro de Control - ${hotelInfo.name}`;
        contextSubtitle = hotelInfo.location ? `${hotelInfo.location}` : `Hotel específico`;
      }
    }
    
    // ⭐ CALCULAR MÉTRICAS ESPECÍFICAS DEL CONTEXTO
    const metrics = calculateContextMetrics(tasks, employees, inventory);
    
    // Generar HTML para el dashboard mejorado
    dashboardView.innerHTML = `
      <div class="dashboard-header">
        <h2 class="section-title">
          <i class="fas fa-tachometer-alt"></i> ${contextTitle}
          ${criticalAlerts.length > 0 ? `<span class="alert-badge critical">${criticalAlerts.length}</span>` : ''}
        </h2>
        ${contextSubtitle ? `<p class="dashboard-subtitle">${contextSubtitle}</p>` : ''}
      </div>
      
      <!-- PANEL DE ALERTAS CRÍTICAS -->
      ${criticalAlerts.length > 0 ? `
      <div class="alert-panel critical-alerts">
        <h3 class="alert-panel-title">
          <i class="fas fa-exclamation-triangle"></i>
          ALERTAS CRÍTICAS - Acción Inmediata Requerida
        </h3>
        <div class="alert-list">
          ${criticalAlerts.map(alert => renderAlert(alert)).join('')}
        </div>
      </div>
      ` : ''}
      
      <!-- MÉTRICAS INTELIGENTES POR CONTEXTO -->
      <div class="dashboard-cards">
        ${renderContextualMetricCards(metrics, context)}
      </div>
      
      <div class="dashboard-row">
        <div class="dashboard-column">
          <!-- ALERTAS IMPORTANTES -->
          ${importantAlerts.length > 0 ? `
          <div class="widget">
            <h3 class="widget-title">
              <i class="fas fa-exclamation-circle text-warning"></i>
              Requieren Atención (${importantAlerts.length})
            </h3>
            <div class="alert-list">
              ${importantAlerts.slice(0, 5).map(alert => renderAlert(alert)).join('')}
            </div>
          </div>
          ` : ''}
          
          <!-- TAREAS RECIENTES DEL CONTEXTO -->
          <div class="widget">
            <h3 class="widget-title">
              <i class="fas fa-tasks"></i>
              Tareas Recientes ${context !== 'ALL' ? `- ${hotelInfo ? hotelInfo.name : context}` : ''}
            </h3>
            <div class="task-list-widget">
              ${renderContextualRecentTasks(tasks)}
            </div>
          </div>
          
          <!-- ALERTAS INFORMATIVAS -->
          ${infoAlerts.length > 0 ? `
          <div class="widget">
            <h3 class="widget-title">
              <i class="fas fa-info-circle text-info"></i>
              Información del Sistema (${infoAlerts.length})
            </h3>
            <div class="alert-list">
              ${infoAlerts.slice(0, 3).map(alert => renderAlert(alert)).join('')}
            </div>
          </div>
          ` : ''}
        </div>
        
        <div class="dashboard-column">
          <!-- WIDGET DE LICENCIA (Solo si es vista consolidada o admin) -->
          ${(currentUser && currentUser.userLevel === 'client_admin') ? `
            ${typeof LicensingModule !== 'undefined' ? LicensingModule.renderLicenseWidget() : ''}
          ` : ''}
          
          <!-- ACCIONES RÁPIDAS CONTEXTUALES -->
          <div class="widget">
            <h3 class="widget-title">
              <i class="fas fa-bolt"></i>
              Acciones Rápidas
            </h3>
            <div class="quick-actions">
              ${renderContextualQuickActions(context, hotelInfo)}
            </div>
          </div>
          
          <!-- EMPLEADOS ACTIVOS DEL CONTEXTO -->
          <div class="widget">
            <h3 class="widget-title">
              <i class="fas fa-users"></i>
              Personal Activo ${context !== 'ALL' ? `- ${hotelInfo ? hotelInfo.name : context}` : ''}
            </h3>
            <div class="employee-list-widget">
              ${renderContextualActiveEmployees(employees)}
            </div>
          </div>
          
          <!-- RESUMEN CONTEXTUAL -->
          <div class="widget">
            <h3 class="widget-title">
              <i class="fas fa-chart-line"></i>
              Resumen ${context !== 'ALL' ? 'del Hotel' : 'Consolidado'}
            </h3>
            <div class="daily-summary">
              ${renderContextualSummary(metrics, context)}
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Configurar eventos para alertas
    setupAlertEvents();
    
    console.log(`✅ Dashboard actualizado con contexto: ${context}`);
    
  } catch (error) {
    console.error('❌ Error actualizando dashboard:', error);
    
    // Fallback básico
    dashboardView.innerHTML = `
      <div class="dashboard-header">
        <h2 class="section-title">
          <i class="fas fa-tachometer-alt"></i> Panel de Control
        </h2>
        <p class="dashboard-subtitle">Cargando datos...</p>
      </div>
      
      <div class="dashboard-cards">
        <div class="card bg-info">
          <div class="card-content">
            <h3 class="card-title">Sistema</h3>
            <p class="card-value">Iniciando...</p>
          </div>
        </div>
      </div>
    `;
  }
}

// ====================================================
// SISTEMA DE NOTIFICACIONES
// ====================================================

function setupNotifications() {
  console.log('🔔 Configurando sistema de notificaciones...');
  
  try {
    // Verificar si existe el contenedor
    if (!document.getElementById('notification-container')) {
      const container = document.createElement('div');
      container.id = 'notification-container';
      document.body.appendChild(container);
    }
    
    // Botón de notificaciones en la topbar
    const notificationsBtn = document.getElementById('notifications-btn');
    const notificationsPanel = document.getElementById('notifications-panel');
    
    if (notificationsBtn && notificationsPanel) {
      notificationsBtn.addEventListener('click', () => {
        notificationsPanel.classList.toggle('hidden');
      });
      
      // Cerrar panel al hacer clic fuera
      document.addEventListener('click', (e) => {
        if (!notificationsPanel.classList.contains('hidden') && 
            !notificationsPanel.contains(e.target) && 
            e.target !== notificationsBtn) {
          notificationsPanel.classList.add('hidden');
        }
      });
    }
    
    console.log('✅ Sistema de notificaciones configurado.');
    
  } catch (error) {
    console.error('❌ Error configurando notificaciones:', error);
  }
}

function updateNotificationCount() {
  console.log('🔢 Actualizando contador de notificaciones...');
  
  try {
    // Obtener datos
    const lowStockCount = typeof AppState !== 'undefined' ? 
      (AppState.get('inventory') || []).filter(item => item.status === 'low').length : 0;
      
    const pendingOrdersCount = typeof AppState !== 'undefined' ? 
      (AppState.get('orders') || []).filter(order => order.status === 'pending').length : 0;
    
    // Actualizar contador (badge)
    const notificationsBtn = document.getElementById('notifications-btn');
    if (notificationsBtn) {
      let badge = notificationsBtn.querySelector('.badge');
      
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'badge';
        notificationsBtn.appendChild(badge);
      }
      
      const count = lowStockCount + pendingOrdersCount;
      
      if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
    
    // Actualizar panel de notificaciones
    updateNotificationsPanel(lowStockCount, pendingOrdersCount);
    
  } catch (error) {
    console.error('❌ Error actualizando notificaciones:', error);
  }
}

function updateNotificationsPanel(lowStockCount, pendingOrdersCount) {
  const panel = document.getElementById('notifications-panel');
  if (!panel) return;
  
  const listContainer = panel.querySelector('.notification-list');
  if (!listContainer) return;
  
  // Limpiar lista
  listContainer.innerHTML = '';
  
  // Añadir notificaciones
  if (lowStockCount > 0) {
    const stockNotification = document.createElement('div');
    stockNotification.className = 'notification-item';
    stockNotification.innerHTML = `
      <i class="fas fa-exclamation-circle text-warning"></i>
      <div class="notification-content">
        <p>Stock bajo: ${lowStockCount} producto${lowStockCount !== 1 ? 's' : ''}</p>
        <small>Revisar inventario</small>
      </div>
    `;
    listContainer.appendChild(stockNotification);
  }
  
  if (pendingOrdersCount > 0) {
    const ordersNotification = document.createElement('div');
    ordersNotification.className = 'notification-item';
    ordersNotification.innerHTML = `
      <i class="fas fa-shopping-cart text-info"></i>
      <div class="notification-content">
        <p>Pedidos pendientes: ${pendingOrdersCount}</p>
        <small>Revisar pedidos</small>
      </div>
    `;
    listContainer.appendChild(ordersNotification);
  }
  
  // Si no hay notificaciones
  if (lowStockCount === 0 && pendingOrdersCount === 0) {
    const emptyNotification = document.createElement('div');
    emptyNotification.className = 'notification-item empty';
    emptyNotification.innerHTML = `
      <i class="fas fa-check-circle text-success"></i>
      <div class="notification-content">
        <p>No hay notificaciones pendientes</p>
        <small>Todo está al día</small>
      </div>
    `;
    listContainer.appendChild(emptyNotification);
  }
}

// ====================================================
// FUNCIONES DE UTILIDAD
// ====================================================

function checkAuthentication() {
  console.log('🔐 Verificando autenticación...');
  
  const isAuthenticated = AppState.get('isAuthenticated');
  const currentUser = AppState.get('currentUser');
  
  if (!isAuthenticated || !currentUser) {
    console.log('❌ Usuario no autenticado');
    return false;
  }
  
  console.log(`✅ Usuario autenticado: ${currentUser.name} (${currentUser.userLevel})`);
  return true;
}

// ====================================================
// FUNCIONES DE DASHBOARD - HELPERS
// ====================================================

function generateSystemAlertsWithContext(tasks, employees, inventory) {
  const alerts = [];
  
  try {
    // Usar las funciones existentes pero con datos filtrados
    const pools = typeof HotelContextModule !== 'undefined' && HotelContextModule.getFilteredData ? 
      HotelContextModule.getFilteredData('pools') : AppState.get('pools') || [];
    const poolRecords = typeof HotelContextModule !== 'undefined' && HotelContextModule.getFilteredData ? 
      HotelContextModule.getFilteredData('poolRecords') : AppState.get('poolRecords') || [];
    const poolIncidents = typeof HotelContextModule !== 'undefined' && HotelContextModule.getFilteredData ? 
      HotelContextModule.getFilteredData('poolIncidents') : AppState.get('poolIncidents') || [];
    
    // Reutilizar funciones existentes
    alerts.push(...getCriticalAlerts(tasks, inventory, pools, poolRecords, poolIncidents));
    alerts.push(...getImportantAlerts(tasks, employees, inventory));
    alerts.push(...getInfoAlerts(tasks, employees, inventory));
    
    // Ordenar por prioridad
    return alerts.sort((a, b) => {
      const priorityOrder = { 'critical': 0, 'important': 1, 'info': 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
  } catch (error) {
    console.error('❌ Error generando alertas:', error);
    return [];
  }
}

function getCriticalAlerts(tasks, inventory, pools, poolRecords, poolIncidents) {
  const alerts = [];
  const now = new Date();
  
  try {
    // 1. Stock crítico agotado
    const outOfStock = inventory.filter(item => 
      item.currentQuantity <= 0 && 
      (item.category === 'chemical' || item.essential)
    );
    
    outOfStock.forEach(item => {
      alerts.push({
        id: `stock-out-${item.id}`,
        type: 'stock',
        priority: 'critical',
        title: `¡AGOTADO! ${item.name}`,
        description: `Producto esencial sin stock`,
        action: 'Realizar pedido urgente',
        module: 'orders-view',
        icon: 'fas fa-exclamation-triangle',
        timestamp: now
      });
    });
    
    // 2. Tareas escaladas sin resolver
    const escalatedTasks = tasks.filter(task => 
      task.escalated && 
      task.status !== 'done'
    );
    
    escalatedTasks.forEach(task => {
      alerts.push({
        id: `escalated-${task.id}`,
        type: 'task-escalated',
        priority: 'critical',
        title: `TAREA ESCALADA: ${task.title}`,
        description: `Hotel ${task.hotel} - ${task.area}`,
        action: 'Supervisar resolución',
        module: 'tasks-view',
        icon: 'fas fa-arrow-up',
        timestamp: new Date(task.updatedAt)
      });
    });
    
    return alerts;
    
  } catch (error) {
    console.error('❌ Error en getCriticalAlerts:', error);
    return [];
  }
}

function getImportantAlerts(tasks, employees, inventory) {
  const alerts = [];
  const now = new Date();
  
  try {
    // 1. Stock bajo (no crítico pero importante)
    const lowStock = inventory.filter(item => 
      item.status === 'low' && 
      item.currentQuantity > 0
    );
    
    lowStock.forEach(item => {
      alerts.push({
        id: `stock-low-${item.id}`,
        type: 'stock',
        priority: 'important',
        title: `Stock bajo: ${item.name}`,
        description: `Quedan ${item.currentQuantity} ${item.unit}`,
        action: 'Programar pedido',
        module: 'inventory-view',
        icon: 'fas fa-boxes',
        timestamp: now
      });
    });
    
    // 2. Tareas atrasadas (más de 1 día)
    const overdueTasks = tasks.filter(task => {
      if (task.status === 'done' || !task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate < new Date(now - 24 * 60 * 60 * 1000);
    });
    
    overdueTasks.forEach(task => {
      const daysOverdue = Math.floor((now - new Date(task.dueDate)) / (24 * 60 * 60 * 1000));
      alerts.push({
        id: `overdue-${task.id}`,
        type: 'task-overdue',
        priority: 'important',
        title: `Tarea atrasada: ${task.title}`,
        description: `${daysOverdue} día(s) de retraso - ${task.employee}`,
        action: 'Contactar responsable',
        module: 'tasks-view',
        icon: 'fas fa-clock',
        timestamp: new Date(task.dueDate)
      });
    });
    
    return alerts;
    
  } catch (error) {
    console.error('❌ Error en getImportantAlerts:', error);
    return [];
  }
}

function getInfoAlerts(tasks, employees, inventory) {
  const alerts = [];
  const now = new Date();
  
  try {
    // 1. Tareas programadas para hoy
    const todayTasks = tasks.filter(task => {
      if (task.status === 'done' || !task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate.toDateString() === now.toDateString();
    });
    
    if (todayTasks.length > 0) {
      alerts.push({
        id: 'today-tasks',
        type: 'tasks-due-today',
        priority: 'info',
        title: `${todayTasks.length} tareas programadas para hoy`,
        description: 'Revisar calendario de actividades',
        action: 'Ver tareas del día',
        module: 'tasks-view',
        icon: 'fas fa-calendar-day',
        timestamp: now
      });
    }
    
    // 2. Resumen de empleados activos
    const activeEmployees = employees.filter(emp => emp.status === 'active');
    if (activeEmployees.length > 0) {
      alerts.push({
        id: 'active-employees',
        type: 'employee-summary',
        priority: 'info',
        title: `${activeEmployees.length} empleados activos`,
        description: 'Personal disponible para asignaciones',
        action: 'Ver plantilla',
        module: 'employees-view',
        icon: 'fas fa-users',
        timestamp: now
      });
    }
    
    return alerts;
    
  } catch (error) {
    console.error('❌ Error en getInfoAlerts:', error);
    return [];
  }
}

function calculateContextMetrics(tasks, employees, inventory) {
  const now = new Date();
  const today = now.toDateString();
  
  try {
    return {
      // Métricas de tareas
      activeTasks: tasks.filter(t => t.status === 'active').length,
      pausedTasks: tasks.filter(t => t.status === 'paused').length,
      completedToday: tasks.filter(t => 
        t.status === 'done' && 
        new Date(t.updatedAt).toDateString() === today
      ).length,
      overdueTasks: tasks.filter(t => {
        if (t.status === 'done' || !t.dueDate) return false;
        return new Date(t.dueDate) < now;
      }).length,
      escalatedTasks: tasks.filter(t => t.escalated && t.status !== 'done').length,
      
      // Métricas de personal
      activeEmployees: employees.filter(e => e.status === 'active').length,
      totalEmployees: employees.length,
      employeesWithTasks: employees.filter(e => 
        tasks.some(t => t.employeeId === e.id && t.status === 'active')
      ).length,
      
      // Métricas de inventario
      totalItems: inventory.length,
      lowStockItems: inventory.filter(i => i.status === 'low').length,
      outOfStockItems: inventory.filter(i => i.currentQuantity <= 0).length,
      goodStockItems: inventory.filter(i => i.status === 'good').length,
      
      // Estado general
      criticalIssues: 0,
      operationalStatus: 'normal'
    };
  } catch (error) {
    console.error('❌ Error calculando métricas:', error);
    return {
      activeTasks: 0, pausedTasks: 0, completedToday: 0, overdueTasks: 0, escalatedTasks: 0,
      activeEmployees: 0, totalEmployees: 0, employeesWithTasks: 0,
      totalItems: 0, lowStockItems: 0, outOfStockItems: 0, goodStockItems: 0,
      criticalIssues: 0, operationalStatus: 'normal'
    };
  }
}

function renderAlert(alert) {
  const priorityClass = `alert-${alert.priority}`;
  const timeAgo = getTimeAgo(alert.timestamp);
  
  return `
    <div class="dashboard-alert ${priorityClass}" data-alert-id="${alert.id}" data-module="${alert.module}">
      <div class="alert-icon">
        <i class="${alert.icon}"></i>
      </div>
      <div class="alert-content">
        <div class="alert-title">${alert.title}</div>
        <div class="alert-description">${alert.description}</div>
        <div class="alert-action">
          <i class="fas fa-arrow-right"></i> ${alert.action}
        </div>
      </div>
      <div class="alert-time">${timeAgo}</div>
    </div>
  `;
}

function setupAlertEvents() {
  try {
    // Hacer clickeables las alertas para navegar al módulo correspondiente
    document.querySelectorAll('.dashboard-alert').forEach(alertEl => {
      alertEl.addEventListener('click', () => {
        const moduleId = alertEl.getAttribute('data-module');
        const alertId = alertEl.getAttribute('data-alert-id');
        
        console.log(`🔔 Clic en alerta: ${alertId}, navegando a ${moduleId}`);
        
        // Navegar al módulo
        showModule(moduleId);
        
        // Opcional: marcar alerta como vista
        alertEl.classList.add('viewed');
      });
    });
    
    // Hacer clickeables las tarjetas de métricas
    document.querySelectorAll('.card[onclick]').forEach(card => {
      card.style.cursor = 'pointer';
    });
  } catch (error) {
    console.error('❌ Error configurando eventos de alertas:', error);
  }
}

function getTimeAgo(timestamp) {
  try {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `hace ${minutes} min`;
    return 'ahora';
  } catch (error) {
    return 'N/A';
  }
}

function renderContextualMetricCards(metrics, context) {
  try {
    // Determinar estado operativo
    let operationalStatus = 'normal';
    let operationalClass = 'bg-success';
    let operationalText = 'NORMAL';
    
    if (metrics.escalatedTasks > 0 || metrics.outOfStockItems > 0) {
      operationalStatus = 'critical';
      operationalClass = 'bg-danger';
      operationalText = 'CRÍTICO';
    } else if (metrics.overdueTasks > 0 || metrics.lowStockItems > 0) {
      operationalStatus = 'warning';
      operationalClass = 'bg-warning';
      operationalText = 'ATENCIÓN';
    }
    
    return `
      <div class="card ${operationalClass}" onclick="showModule('tasks-view')">
        <div class="card-icon">
          <i class="fas fa-shield-alt"></i>
        </div>
        <div class="card-content">
          <h3 class="card-title">Estado Operativo</h3>
          <p class="card-value">${operationalText}</p>
          ${metrics.escalatedTasks > 0 ? `<small>${metrics.escalatedTasks} escalada(s)</small>` : ''}
        </div>
      </div>
      
      <div class="card bg-primary" onclick="showModule('tasks-view')">
        <div class="card-icon">
          <i class="fas fa-clipboard-check"></i>
        </div>
        <div class="card-content">
          <h3 class="card-title">Tareas Activas</h3>
          <p class="card-value">${metrics.activeTasks}</p>
          ${metrics.overdueTasks > 0 ? `<small class="text-warning">${metrics.overdueTasks} atrasada(s)</small>` : ''}
        </div>
      </div>
      
      <div class="card ${metrics.lowStockItems > 0 ? 'bg-warning' : 'bg-success'}" onclick="showModule('inventory-view')">
        <div class="card-icon">
          <i class="fas fa-boxes"></i>
        </div>
        <div class="card-content">
          <h3 class="card-title">Inventario</h3>
          <p class="card-value">${metrics.lowStockItems === 0 ? 'OK' : 'REVISAR'}</p>
          ${metrics.lowStockItems > 0 ? `<small>${metrics.lowStockItems} producto(s) bajo</small>` : ''}
        </div>
      </div>
      
      <div class="card bg-info" onclick="showModule('employees-view')">
        <div class="card-icon">
          <i class="fas fa-users"></i>
        </div>
        <div class="card-content">
          <h3 class="card-title">Personal</h3>
          <p class="card-value">${metrics.activeEmployees}</p>
          <small>${metrics.employeesWithTasks} con tareas</small>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('❌ Error renderizando tarjetas:', error);
    return '<div class="card bg-secondary"><div class="card-content"><p>Error cargando métricas</p></div></div>';
  }
}

function renderContextualQuickActions(context, hotelInfo) {
  const isConsolidated = context === 'ALL';
  
  return `
    <button class="quick-action-btn" onclick="showModule('tasks-view')">
      <i class="fas fa-plus"></i> Nueva Tarea${!isConsolidated ? ` en ${hotelInfo ? hotelInfo.name : context}` : ''}
    </button>
    <button class="quick-action-btn" onclick="showModule('pools-view')">
      <i class="fas fa-swimming-pool"></i> Registro Piscina
    </button>
    <button class="quick-action-btn" onclick="showModule('inventory-view')">
      <i class="fas fa-boxes"></i> Revisar Stock${!isConsolidated ? ` - ${hotelInfo ? hotelInfo.name : context}` : ''}
    </button>
    <button class="quick-action-btn" onclick="showModule('orders-view')">
      <i class="fas fa-shopping-cart"></i> Hacer Pedido
    </button>
    ${isConsolidated ? `
      <button class="quick-action-btn" onclick="showModule('admin-view')">
        <i class="fas fa-cogs"></i> Administración
      </button>
    ` : ''}
  `;
}

function renderContextualRecentTasks(tasks) {
  if (!tasks || tasks.length === 0) {
    return `
      <div class="empty-state-small">
        <i class="fas fa-tasks"></i>
        <p>No hay tareas en este contexto</p>
      </div>
    `;
  }
  
  try {
    const recentTasks = [...tasks]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 5);
    
    let html = '';
    
    recentTasks.forEach(task => {
      const statusClass = task.status === 'active' ? 'status-active' : 
                         task.status === 'paused' ? 'status-paused' : 'status-done';
      
      const hotelInfo = task.hotelName || task.hotel || '';
      const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
      
      html += `
        <div class="dashboard-task-item ${isOverdue ? 'overdue' : ''}" data-id="${task.id}">
          <div class="dashboard-task-status ${statusClass}"></div>
          <div class="dashboard-task-content">
            <div class="dashboard-task-title">
              ${task.title}
              ${task.escalated ? '<i class="fas fa-arrow-up text-danger" title="Escalada"></i>' : ''}
              ${isOverdue ? '<i class="fas fa-clock text-warning" title="Atrasada"></i>' : ''}
            </div>
            <div class="dashboard-task-meta">
              <span class="task-hotel">${hotelInfo}</span>
              <span class="task-area">${task.area || ''}</span>
              <span class="task-date">${formatDate(task.updatedAt || task.createdAt)}</span>
            </div>
          </div>
        </div>
      `;
    });
    
    return html;
  } catch (error) {
    console.error('❌ Error renderizando tareas:', error);
    return '<p>Error cargando tareas</p>';
  }
}

function renderContextualActiveEmployees(employees) {
  if (!employees || employees.length === 0) {
    return `
      <div class="empty-state-small">
        <i class="fas fa-users"></i>
        <p>No hay empleados en este contexto</p>
      </div>
    `;
  }
  
  try {
    const activeEmployees = employees
      .filter(emp => emp.status === 'active')
      .slice(0, 5);
    
    if (activeEmployees.length === 0) {
      return `
        <div class="empty-state-small">
          <i class="fas fa-users"></i>
          <p>No hay empleados activos</p>
        </div>
      `;
    }
    
    let html = '';
    
    activeEmployees.forEach(employee => {
      const initials = employee.name.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase();
      
      const hotelInfo = employee.hotelName || employee.hotel || '';
      
      html += `
        <div class="dashboard-employee-item" data-id="${employee.id}">
          <div class="dashboard-employee-avatar">${initials}</div>
          <div class="dashboard-employee-info">
            <div class="dashboard-employee-name">${employee.name}</div>
            <div class="dashboard-employee-details">
              <span class="employee-position">${employee.position || ''}</span>
              ${hotelInfo ? `<span class="employee-hotel">${hotelInfo}</span>` : ''}
            </div>
          </div>
          <div class="dashboard-employee-status">Activo</div>
        </div>
      `;
    });
    
    return html;
  } catch (error) {
    console.error('❌ Error renderizando empleados:', error);
    return '<p>Error cargando empleados</p>';
  }
}

function renderContextualSummary(metrics, context) {
  const isConsolidated = context === 'ALL';
  
  return `
    <div class="summary-item">
      <span class="summary-label">Tareas completadas hoy:</span>
      <span class="summary-value">${metrics.completedToday}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Tareas pendientes:</span>
      <span class="summary-value">${metrics.activeTasks + metrics.pausedTasks}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Personal activo:</span>
      <span class="summary-value">${metrics.activeEmployees}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Productos en stock:</span>
      <span class="summary-value">${metrics.goodStockItems}/${metrics.totalItems}</span>
    </div>
    ${metrics.overdueTasks > 0 ? `
      <div class="summary-item warning">
        <span class="summary-label">Tareas atrasadas:</span>
        <span class="summary-value text-warning">${metrics.overdueTasks}</span>
      </div>
    ` : ''}
    ${isConsolidated && typeof AppState !== 'undefined' && AppState.getHotelOptions ? `
      <div class="summary-item">
        <span class="summary-label">Hoteles supervisados:</span>
        <span class="summary-value">${AppState.getHotelOptions().length}</span>
      </div>
    ` : ''}
  `;
}

function formatDate(date) {
  if (!date) return 'N/A';
  
  try {
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return 'N/A';
  }
}

// ====================================================
// LISTENERS DE EVENTOS GLOBALES
// ====================================================

// Escuchar cambios de contexto de hotel
document.addEventListener('hotelContextChanged', (event) => {
  console.log('🏨 Contexto de hotel cambiado, actualizando dashboard...');
  
  const currentModule = AppState.get('currentModule');
  if (currentModule === 'dashboard-view') {
    setTimeout(() => {
      updateDashboardContentWithAlerts();
    }, 100);
  }
});

// Escuchar cambios en AppState currentUser
if (typeof AppState !== 'undefined') {
  AppState.subscribe('currentUser', (user) => {
    console.log('👤 Usuario actualizado, verificando si necesita actualizar dashboard...');
    
    const currentModule = AppState.get('currentModule');
    if (currentModule === 'dashboard-view') {
      setTimeout(() => {
        console.log('🔄 Actualizando dashboard por cambio de usuario/contexto...');
        if (typeof updateDashboardContentWithAlerts === 'function') {
          updateDashboardContentWithAlerts();
        }
      }, 100);
    }
  });
}

// ====================================================
// FUNCIONES GLOBALES PARA USAR DESDE HTML
// ====================================================

// Hacer disponibles las funciones principales globalmente
window.showModule = showModule;
window.initializeAuthenticatedApp = initializeAuthenticatedApp;
window.updateDashboardContentWithAlerts = updateDashboardContentWithAlerts;

console.log('✅ App.js cargado completamente - Sistema listo para autenticación');

// ====================================================
// MODAL DE LOGOUT PERSONALIZADO
// ====================================================

function showLogoutModal() {
  return new Promise((resolve) => {
    // Crear modal
    const modalHTML = `
      <div class="logout-modal-overlay" id="logout-modal-overlay">
        <div class="logout-modal">
          <div class="logout-modal-header">
            <div class="logout-modal-icon">
              <i class="fas fa-sign-out-alt"></i>
            </div>
            <h3 class="logout-modal-title">Cerrar Sesión</h3>
            <p class="logout-modal-message">
              ¿Estás seguro de que quieres cerrar tu sesión?
            </p>
          </div>
          
          <div class="logout-modal-actions">
            <button type="button" class="logout-modal-btn logout-modal-btn-cancel" id="logout-modal-cancel">
              <i class="fas fa-times"></i>
              Cancelar
            </button>
            <button type="button" class="logout-modal-btn logout-modal-btn-confirm" id="logout-modal-confirm">
              <i class="fas fa-sign-out-alt"></i>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Agregar al DOM
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);
    
    const modal = document.getElementById('logout-modal-overlay');
    const cancelBtn = document.getElementById('logout-modal-cancel');
    const confirmBtn = document.getElementById('logout-modal-confirm');
    
    // Función para cerrar modal
    function closeModal(confirmed = false) {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
      resolve(confirmed);
    }
    
    // Event listeners
    cancelBtn.addEventListener('click', () => closeModal(false));
    
    confirmBtn.addEventListener('click', async () => {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cerrando...';
      
      setTimeout(() => {
        closeModal(true);
      }, 800);
    });
    
    // Cerrar con ESC
    document.addEventListener('keydown', function handleKeyDown(e) {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', handleKeyDown);
        closeModal(false);
      }
    });
    
    // Cerrar clickeando fuera
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(false);
      }
    });
  });
}