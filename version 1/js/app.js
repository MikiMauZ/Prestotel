// app.js - Código principal de la aplicación
document.addEventListener('DOMContentLoaded', function() {
  console.log('Iniciando aplicación Prestotel...');
  
  // ⭐ VERIFICAR SI FIREBASE ESTÁ DISPONIBLE
  if (typeof firebase === 'undefined') {
    console.error('❌ Firebase no está cargado');
    alert('Error: Firebase no está disponible. Verifica la conexión.');
    return;
  }
  
  // ⭐ INICIALIZAR FIREBASE AUTH PRIMERO
  if (typeof FirebaseAuthModule !== 'undefined') {
    FirebaseAuthModule.init();
    console.log('🔐 Firebase Auth inicializado, esperando estado de autenticación...');
    
    // Esperar a que Firebase determine el estado de autenticación
    setTimeout(() => {
      const isAuthenticated = AppState.get('isAuthenticated');
      
      if (isAuthenticated) {
        console.log('✅ Usuario autenticado, inicializando aplicación...');
        initializeAuthenticatedApp();
      } else {
        console.log('❌ Usuario no autenticado, mostrando login...');
        // El login ya se muestra desde FirebaseAuthModule
      }
    }, 1000);
    
  } else {
    console.error('❌ FirebaseAuthModule no está disponible');
    alert('Error: Módulo de autenticación no disponible');
  }
});

// ⭐ NUEVA FUNCIÓN: Inicializar app para usuarios autenticados
function initializeAuthenticatedApp() {
  console.log('🚀 Inicializando aplicación para usuario autenticado...');
  
  // Inicializar el estado de la aplicación
  initializeAppState();
  
  // Configurar navegación
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
      Utils.showToast(`¡Bienvenido ${currentUser.name}!`, 4000);
    }, 1000);
  }
  
  console.log('✅ Aplicación inicializada correctamente');
}

// Inicializar AppState
function initializeAppState() {
  console.log('Inicializando estado de la aplicación...');
  
  // Intentar cargar desde localStorage
  if (typeof AppState !== 'undefined' && AppState.loadFromLocalStorage) {
    AppState.loadFromLocalStorage();
  } else {
    console.error('ERROR: AppState no está definido. Verifica que appState.js se está cargando correctamente.');
  }
  
  // Si no hay datos, cargar datos iniciales si AppState existe
  if (typeof AppState !== 'undefined' && AppState.init && (!AppState.get('tasks') || AppState.get('tasks').length === 0)) {
    AppState.init();
  }
  
  console.log('Estado de la aplicación inicializado.');
}

// Configurar navegación
// ⭐ CONFIGURAR LOGOUT CON FIREBASE
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      console.log('🚪 Iniciando logout...');
      
      if (typeof FirebaseAuthModule !== 'undefined') {
        const result = await FirebaseAuthModule.signOut();
        
        if (!result.success) {
          Utils.showToast('Error al cerrar sesión', 'error');
        }
      } else {
        console.error('❌ FirebaseAuthModule no disponible para logout');
      }
    }
  });
}

// Mostrar un módulo específico
function showModule(moduleId) {
  console.log(`Intentando mostrar módulo: ${moduleId}`);
  
  // Si no tiene el sufijo "-view", añadirlo
  if (!moduleId.endsWith('-view')) {
    moduleId = `${moduleId}-view`;
  }
  
  // Verificar si el módulo existe
  const moduleElement = document.getElementById(moduleId);
  
  if (!moduleElement) {
    console.error(`ERROR: No se encontró el módulo con ID: ${moduleId}`);
    
    // Intentar mostrar el dashboard como alternativa
    console.log('Intentando mostrar el dashboard como alternativa...');
    const dashboard = document.getElementById('dashboard-view');
    
    if (dashboard) {
      // Ocultar todos los demás módulos
      document.querySelectorAll('.module-view').forEach(view => {
        view.classList.add('hidden');
      });
      
      // Mostrar el dashboard
      dashboard.classList.remove('hidden');
      
      // Actualizar título si es posible
      updatePageTitle('dashboard-view');
      
      // Actualizar estado
      if (typeof AppState !== 'undefined') {
        AppState.update('currentModule', 'dashboard-view');
      }
      
      console.log('Dashboard mostrado como alternativa.');
      return;
    } else {
      console.error('ERROR CRÍTICO: No se pudo encontrar el dashboard. Creándolo...');
      // Crear el dashboard si no existe
      createDashboardView();
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
  
  console.log(`Módulo ${moduleId} mostrado correctamente.`);
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
    default:
      title = 'Prestotel';
  }
  
  pageTitle.textContent = title;
}

// Inicializar el dashboard
function initializeDashboard() {
  console.log('Inicializando el dashboard...');
  
  // Verificar si ya existe el dashboard
  let dashboardView = document.getElementById('dashboard-view');
  
  if (!dashboardView) {
    console.log('El dashboard no existe, creándolo...');
    createDashboardView();
  } else {
    console.log('Dashboard existente encontrado, actualizando contenido...');
    updateDashboardContentWithAlerts();
  }
}

// Crear la vista del dashboard si no existe
function createDashboardView() {
  console.log('Creando la vista del dashboard...');
  
  // Verificar si existe el contenedor content
  const contentContainer = document.querySelector('.content');
  if (!contentContainer) {
    console.error('ERROR: No se encontró el contenedor .content');
    return;
  }
  
  // Crear el elemento para el dashboard
  const dashboardView = document.createElement('div');
  dashboardView.id = 'dashboard-view';
  dashboardView.className = 'module-view';
  
  // Insertar al principio del contenedor
  contentContainer.insertBefore(dashboardView, contentContainer.firstChild);
  
  // Actualizar el contenido
  updateDashboardContentWithAlerts();
  
  // Mostrar el dashboard
  showModule('dashboard-view');
  
  console.log('Vista del dashboard creada exitosamente.');
}

// Actualizar el contenido del dashboard
function updateDashboardContent() {
  const dashboardView = document.getElementById('dashboard-view');
  if (!dashboardView) return;
  
  console.log('Actualizando contenido del dashboard...');
  
  // Obtener datos de AppState
  const tasks = typeof AppState !== 'undefined' ? AppState.get('tasks') || [] : [];
  const employees = typeof AppState !== 'undefined' ? AppState.get('employees') || [] : [];
  const inventory = typeof AppState !== 'undefined' ? AppState.get('inventory') || [] : [];
  
  // Calcular contadores
  const activeTasks = tasks.filter(task => task.status === 'active').length;
  const pausedTasks = tasks.filter(task => task.status === 'paused').length;
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;
  const lowStockItems = inventory.filter(item => item.status === 'low').length;
  const winterTasks = 6; // Mock para ejemplo
  
  // Generar HTML para el dashboard
  dashboardView.innerHTML = `
    <h2 class="section-title"><i class="fas fa-tachometer-alt"></i> Panel de Control</h2>
    <p>Este es tu panel de control.</p>
    
    <div class="dashboard-cards">
      <div class="card bg-success">
        <div class="card-icon">
          <i class="fas fa-tasks"></i>
        </div>
        <div class="card-content">
          <h3 class="card-title">Tareas activas</h3>
          <p class="card-value">${activeTasks}</p>
        </div>
      </div>
      
      <div class="card bg-warning">
        <div class="card-icon">
          <i class="fas fa-pause-circle"></i>
        </div>
        <div class="card-content">
          <h3 class="card-title">En pausa</h3>
          <p class="card-value">${pausedTasks}</p>
        </div>
      </div>
      
      <div class="card bg-primary">
        <div class="card-icon">
          <i class="fas fa-users"></i>
        </div>
        <div class="card-content">
          <h3 class="card-title">Empleados activos</h3>
          <p class="card-value">${activeEmployees}</p>
        </div>
      </div>
      
      <div class="card bg-danger">
        <div class="card-icon">
          <i class="fas fa-boxes"></i>
        </div>
        <div class="card-content">
          <h3 class="card-title">Stock bajo</h3>
          <p class="card-value">${lowStockItems} producto${lowStockItems !== 1 ? 's' : ''}</p>
        </div>
      </div>
      
      <div class="card bg-info">
        <div class="card-icon">
          <i class="fas fa-snowflake"></i>
        </div>
        <div class="card-content">
          <h3 class="card-title">Invierno</h3>
          <p class="card-value">${winterTasks} tarea${winterTasks !== 1 ? 's' : ''}</p>
        </div>
      </div>
    </div>

    <div class="dashboard-row">
      <div class="dashboard-column">
        <div class="widget">
          <h3 class="widget-title">Tareas Recientes</h3>
          <div class="task-list-widget" id="recent-tasks">
            ${renderRecentTasks(tasks)}
          </div>
        </div>
      </div>
      <div class="dashboard-column">
        <div class="widget">
          <h3 class="widget-title">Empleados Activos</h3>
          <div class="employee-list-widget" id="active-employees">
            ${renderActiveEmployees(employees)}
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Configurar eventos para las tareas y empleados recientes
  setupDashboardEvents();
  
  console.log('Contenido del dashboard actualizado.');
}

// Generar HTML para tareas recientes
function renderRecentTasks(tasks) {
  if (!tasks || tasks.length === 0) {
    return '<p class="text-center">No hay tareas recientes</p>';
  }
  
  // Ordenar por fecha de actualización, más recientes primero
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 5); // Mostrar solo las 5 más recientes
  
  let html = '';
  
  recentTasks.forEach(task => {
    const statusClass = task.status === 'active' ? 'status-active' : 
                       task.status === 'paused' ? 'status-paused' : 'status-done';
    
    html += `
      <div class="dashboard-task-item" data-id="${task.id}">
        <div class="dashboard-task-status ${statusClass}"></div>
        <div class="dashboard-task-title">${task.title}</div>
        <div class="dashboard-task-date">${formatDate(task.updatedAt || task.createdAt)}</div>
      </div>
    `;
  });
  
  return html;
}

// Generar HTML para empleados activos
function renderActiveEmployees(employees) {
  if (!employees || employees.length === 0) {
    return '<p class="text-center">No hay empleados activos</p>';
  }
  
  // Filtrar solo empleados activos
  const activeEmployees = employees
    .filter(emp => emp.status === 'active')
    .slice(0, 5); // Mostrar solo los 5 primeros
  
  if (activeEmployees.length === 0) {
    return '<p class="text-center">No hay empleados activos</p>';
  }
  
  let html = '';
  
  activeEmployees.forEach(employee => {
    // Obtener iniciales para avatar
    const initials = employee.name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
    
    html += `
      <div class="dashboard-employee-item" data-id="${employee.id}">
        <div class="dashboard-employee-avatar">${initials}</div>
        <div class="dashboard-employee-info">
          <div class="dashboard-employee-name">${employee.name}</div>
          <div class="dashboard-employee-position">${employee.position || ''}</div>
        </div>
        <div class="dashboard-employee-status">Activo</div>
      </div>
    `;
  });
  
  return html;
}

// Configurar eventos para elementos del dashboard
function setupDashboardEvents() {
  // Eventos para tareas recientes
  document.querySelectorAll('.dashboard-task-item').forEach(taskEl => {
    taskEl.addEventListener('click', () => {
      const taskId = taskEl.getAttribute('data-id');
      console.log(`Clic en tarea ID: ${taskId}`);
      
      // Navegar al módulo de tareas
      showModule('tasks-view');
    });
  });
  
  // Eventos para empleados activos
  document.querySelectorAll('.dashboard-employee-item').forEach(empEl => {
    empEl.addEventListener('click', () => {
      const empId = empEl.getAttribute('data-id');
      console.log(`Clic en empleado ID: ${empId}`);
      
      // Navegar al módulo de empleados
      showModule('employees-view');
    });
  });
}

// Función auxiliar para formatear fechas
function formatDate(date) {
  if (!date) return 'N/A';
  
  const d = new Date(date);
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// ====================================================
// SISTEMA DE ALERTAS INTELIGENTES PARA DASHBOARD PMS
// ====================================================

// FUNCIÓN PRINCIPAL: Generar todas las alertas del sistema
function generateSystemAlerts() {
  const alerts = [];
  
  // Obtener datos de AppState
  const tasks = AppState.get('tasks') || [];
  const employees = AppState.get('employees') || [];
  const inventory = AppState.get('inventory') || [];
  const pools = AppState.get('pools') || [];
  const poolRecords = AppState.get('poolRecords') || [];
  const poolIncidents = AppState.get('poolIncidents') || [];
  
  // 🔴 ALERTAS CRÍTICAS (Requieren acción inmediata)
  alerts.push(...getCriticalAlerts(tasks, inventory, pools, poolRecords, poolIncidents));
  
  // 🟡 ALERTAS IMPORTANTES (Requieren atención hoy)
  alerts.push(...getImportantAlerts(tasks, employees, inventory));
  
  // 🔵 ALERTAS INFORMATIVAS (Seguimiento recomendado)
  alerts.push(...getInfoAlerts(tasks, employees, inventory));
  
  // Ordenar por prioridad (críticas primero)
  return alerts.sort((a, b) => {
    const priorityOrder = { 'critical': 0, 'important': 1, 'info': 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// 🔴 ALERTAS CRÍTICAS
function getCriticalAlerts(tasks, inventory, pools, poolRecords, poolIncidents) {
  const alerts = [];
  const now = new Date();
  
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
  
  // 2. Incidencias de piscina abiertas (críticas)
  const criticalIncidents = poolIncidents.filter(incident => 
    incident.status === 'open' && 
    incident.severity === 'critical'
  );
  
  criticalIncidents.forEach(incident => {
    alerts.push({
      id: `incident-${incident.id}`,
      type: 'pool-safety',
      priority: 'critical',
      title: `¡PISCINA CERRADA! ${incident.poolName}`,
      description: `${incident.type} - ${incident.description}`,
      action: 'Revisar protocolo aplicado',
      module: 'pools-view',
      icon: 'fas fa-swimming-pool',
      timestamp: new Date(incident.createdAt)
    });
  });
  
  // 3. Tareas escaladas sin resolver
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
  
  // 4. Parámetros químicos peligrosos (simulado)
  const recentRecords = poolRecords.filter(record => 
    new Date(record.date) > new Date(now - 24 * 60 * 60 * 1000)
  );
  
  recentRecords.forEach(record => {
    // pH muy alto o muy bajo
    if (record.ph < 6.8 || record.ph > 8.2) {
      alerts.push({
        id: `ph-danger-${record.id}`,
        type: 'chemical-danger',
        priority: 'critical',
        title: `¡pH PELIGROSO! ${record.poolName}`,
        description: `pH: ${record.ph} (límites: 6.8-8.2)`,
        action: 'Ajustar pH inmediatamente',
        module: 'pools-view',
        icon: 'fas fa-flask',
        timestamp: new Date(record.date)
      });
    }
    
    // Cloro muy alto
    if (record.chlorine > 5.0) {
      alerts.push({
        id: `chlorine-high-${record.id}`,
        type: 'chemical-danger',
        priority: 'critical',
        title: `¡CLORO EXCESIVO! ${record.poolName}`,
        description: `Cloro: ${record.chlorine} ppm (máx: 5.0)`,
        action: 'Reducir cloro y ventilar área',
        module: 'pools-view',
        icon: 'fas fa-flask',
        timestamp: new Date(record.date)
      });
    }
  });
  
  return alerts;
}

// 🟡 ALERTAS IMPORTANTES
function getImportantAlerts(tasks, employees, inventory) {
  const alerts = [];
  const now = new Date();
  
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
  
  // 3. Empleados inactivos sin tareas
  const inactiveEmployees = employees.filter(emp => {
    if (emp.status !== 'active') return false;
    const empTasks = tasks.filter(task => 
      task.employeeId === emp.id && 
      task.status === 'active'
    );
    return empTasks.length === 0;
  });
  
  inactiveEmployees.forEach(emp => {
    alerts.push({
      id: `inactive-emp-${emp.id}`,
      type: 'employee-idle',
      priority: 'important',
      title: `${emp.name} sin tareas asignadas`,
      description: `Empleado activo disponible`,
      action: 'Asignar nueva tarea',
      module: 'employees-view',
      icon: 'fas fa-user-clock',
      timestamp: now
    });
  });
  
  return alerts;
}

// 🔵 ALERTAS INFORMATIVAS
function getInfoAlerts(tasks, employees, inventory) {
  const alerts = [];
  const now = new Date();
  
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
  
  // 2. Stock medio (preventivo)
  const mediumStock = inventory.filter(item => item.status === 'medium');
  if (mediumStock.length > 0) {
    alerts.push({
      id: 'medium-stock',
      type: 'stock',
      priority: 'info',
      title: `${mediumStock.length} productos en stock medio`,
      description: 'Considera hacer pedido preventivo',
      action: 'Revisar inventario',
      module: 'inventory-view',
      icon: 'fas fa-chart-line',
      timestamp: now
    });
  }
  
  // 3. Resumen de empleados activos
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
}

// ====================================================
// FUNCIÓN DE DASHBOARD MEJORADO CON ALERTAS
// ====================================================

// ====================================================
// DASHBOARD MEJORADO CON CONTEXTO DE HOTEL
// ====================================================
// Reemplazar en js/app.js

function updateDashboardContentWithAlerts() {
  const dashboardView = document.getElementById('dashboard-view');
  if (!dashboardView) return;
  
  console.log('🚨 Actualizando dashboard con sistema de alertas y contexto...');
  
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
        ${(context === 'ALL' || (currentUser && currentUser.userLevel === 'client_admin')) ? `
          ${LicensingModule ? LicensingModule.renderLicenseWidget() : ''}
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
}

// ====================================================
// FUNCIONES DE RENDERIZADO Y EVENTOS
// ====================================================

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
}

function getTimeAgo(timestamp) {
  const now = new Date();
  const diff = now - new Date(timestamp);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
  if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `hace ${minutes} min`;
  return 'ahora';
}

// ====================================================
// INTEGRACIÓN CON SISTEMA EXISTENTE
// ====================================================

// Reemplazar la función updateDashboardContent existente
// Esta nueva función debe llamarse desde app.js en lugar de la anterior

// Configurar sistema de notificaciones
function setupNotifications() {
  console.log('Configurando sistema de notificaciones...');
  
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
  
  console.log('Sistema de notificaciones configurado.');
}

// Comprobar autenticación
function checkAuthentication() {
  console.log('🔐 Verificando autenticación con Firebase...');
  
  const isAuthenticated = AppState.get('isAuthenticated');
  const currentUser = AppState.get('currentUser');
  
  if (!isAuthenticated || !currentUser) {
    console.log('❌ Usuario no autenticado');
    return false;
  }
  
  console.log(`✅ Usuario autenticado: ${currentUser.name} (${currentUser.userLevel})`);
  return true;
}

// Actualizar contador de notificaciones
function updateNotificationCount() {
  console.log('Actualizando contador de notificaciones...');
  
  // Obtener datos simulados
  const lowStockCount = typeof AppState !== 'undefined' ? 
    (AppState.get('inventory') || []).filter(item => item.status === 'low').length : 3;
    
  const pendingOrdersCount = typeof AppState !== 'undefined' ? 
    (AppState.get('orders') || []).filter(order => order.status === 'pending').length : 2;
  
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
}

// Actualizar panel de notificaciones
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
// FUNCIONES DE MÉTRICAS CONTEXTUALES
// ====================================================

function calculateContextMetrics(tasks, employees, inventory) {
  const now = new Date();
  const today = now.toDateString();
  
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
    criticalIssues: 0, // Se calculará con las alertas
    operationalStatus: 'normal' // normal, warning, critical
  };
}

function renderContextualMetricCards(metrics, context) {
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
  
  // Ordenar por fecha de actualización, más recientes primero
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 5); // Mostrar solo las 5 más recientes
  
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
            <span class="task-area">${task.area}</span>
            <span class="task-date">${formatDate(task.updatedAt || task.createdAt)}</span>
          </div>
        </div>
      </div>
    `;
  });
  
  return html;
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
  
  // Filtrar solo empleados activos y limitar a 5
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
    // Obtener iniciales para avatar
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
    ${isConsolidated && AppState.getHotelOptions().length > 1 ? `
      <div class="summary-item">
        <span class="summary-label">Hoteles supervisados:</span>
        <span class="summary-value">${AppState.getHotelOptions().length}</span>
      </div>
    ` : ''}
  `;
}

// ====================================================
// FUNCIONES DE ALERTAS MEJORADAS
// ====================================================

// Generar alertas con contexto específico
function generateSystemAlertsWithContext(tasks, employees, inventory) {
  const alerts = [];
  
  // Usar las funciones existentes pero con datos filtrados
  const pools = HotelContextModule ? HotelContextModule.getFilteredData('pools') : AppState.get('pools') || [];
  const poolRecords = HotelContextModule ? HotelContextModule.getFilteredData('poolRecords') : AppState.get('poolRecords') || [];
  const poolIncidents = HotelContextModule ? HotelContextModule.getFilteredData('poolIncidents') : AppState.get('poolIncidents') || [];
  
  // Reutilizar funciones existentes
  alerts.push(...getCriticalAlerts(tasks, inventory, pools, poolRecords, poolIncidents));
  alerts.push(...getImportantAlerts(tasks, employees, inventory));
  alerts.push(...getInfoAlerts(tasks, employees, inventory));
  
  // Ordenar por prioridad
  return alerts.sort((a, b) => {
    const priorityOrder = { 'critical': 0, 'important': 1, 'info': 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// ====================================================
// INICIALIZACIÓN Y EVENTOS
// ====================================================

// Escuchar cambios de contexto de hotel
document.addEventListener('hotelContextChanged', (event) => {
  console.log('🏨 Contexto de hotel cambiado, actualizando dashboard...');
  
  // Actualizar dashboard si está activo
  const currentModule = AppState.get('currentModule');
  if (currentModule === 'dashboard-view') {
    setTimeout(() => {
      updateDashboardContentWithAlerts();
    }, 100); // Pequeño delay para que el cambio se propague
  }
});

console.log('📊 Dashboard contextual configurado');

// ====================================================
// LISTENER ADICIONAL PARA CAMBIOS DE CONTEXTO
// ====================================================

// Escuchar cambios en AppState currentUser para actualizar dashboard
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