// app.js - Código principal de la aplicación
document.addEventListener('DOMContentLoaded', function() {
  console.log('Iniciando aplicación Prestotel...');
  
  // Inicializar el estado de la aplicación
  initializeAppState();
  
  // Configurar navegación
  setupNavigation();
  
  // Inicializar el dashboard (AÑADIDO)
  initializeDashboard();
  
  // Configurar notificaciones
  setupNotifications();
  
  // Comprobar autenticación
  checkAuthentication();
  
  // Actualizar contador de notificaciones
  updateNotificationCount();
  
  // Mostrar notificación de bienvenida
  setTimeout(() => {
    Utils.showToast('¡Bienvenido a Prestotel!', 4000);
  }, 1000);
});

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
function setupNavigation() {
  console.log('Configurando navegación...');
  
  // Toggle sidebar en móviles
  const toggleBtn = document.getElementById('toggle-menu');
  const sidebar = document.getElementById('sidebar');
  
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
  }
  
  // Enlaces del menú
  document.querySelectorAll('.menu a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Quitar clase activa de todos los enlaces
      document.querySelectorAll('.menu a').forEach(a => a.classList.remove('active'));
      
      // Añadir clase activa al enlace clicado
      link.classList.add('active');
      
      // Obtener el ID del módulo a mostrar
      let moduleId = link.getAttribute('href');
      if (moduleId.startsWith('#')) {
        moduleId = moduleId.substring(1);
      }
      
      console.log(`Navegación: Clic en enlace para ${moduleId}`);
      
      // Mostrar el módulo correspondiente
      showModule(moduleId);
      
      // Cerrar el menú en móviles
      if (window.innerWidth <= 768 && sidebar) {
        sidebar.classList.remove('active');
      }
    });
  });
  
  console.log('Navegación configurada.');
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
    updateDashboardContent();
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
  updateDashboardContent();
  
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
  console.log('Simulando verificación de autenticación...');
  // Para desarrollo, asumimos que el usuario está autenticado
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