// Módulo de gestión de tareas - VERSIÓN FINAL CORREGIDA
(function() {
  'use strict';
  
  // 🔑 CRÍTICO: Verificar si ya está inicializado
  if (window.TasksModuleInitialized) {
    console.log('✅ Módulo de tareas ya inicializado, saltando...');
    return;
  }
  
  console.log('🚀 Inicializando módulo de tareas por primera vez...');
  
  // Marcar como inicializado INMEDIATAMENTE
  window.TasksModuleInitialized = true;

  // Variables globales del módulo
  let isAdmin = false;
  let currentTaskId = null;
  let currentUser = null;

  // Referencias DOM
  let taskList;
  let filterStatus;
  let filterHotel;
  let filterArea;
  let searchInput;
  let taskForm;
  let btnNewTask;
  let createBtn;
  let cancelBtn;

  // Verificar estado de administrador
  function checkAdminStatus() {
    isAdmin = AppState.get('userRole') === 'admin';
    return isAdmin;
  }
  
  // 🎯 ESPERAR A QUE EL DOM ESTÉ LISTO
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeModule);
  } else {
    initializeModule();
  }
  
  function initializeModule() {
    console.log('📋 Inicializando módulo de tareas...');
    
    // Verificar si estamos en la página de tareas
    let tasksView = document.getElementById('tasks-view');
    
    // Si no existe el elemento, crearlo
    if (!tasksView) {
      console.warn('No se encontró el contenedor del módulo de tareas. Creándolo...');
      tasksView = document.createElement('div');
      tasksView.id = 'tasks-view';
      tasksView.className = 'module-view hidden';
      const contentContainer = document.querySelector('.content');
      if (contentContainer) {
        contentContainer.appendChild(tasksView);
      } else {
        console.error('ERROR: No se encontró el contenedor .content');
        return;
      }
    }
    
    checkAdminStatus();
    
    // Establecer estructura HTML base
    renderModuleStructure(tasksView);
    
    // Configurar eventos y cargar datos UNA SOLA VEZ
    setupTaskEvents();
    loadTasksData();
    
    console.log('✅ Módulo de tareas inicializado correctamente');
  }

  // Renderizar estructura HTML completa - SIN CONTADORES INÚTILES
  function renderModuleStructure(tasksView) {
    tasksView.innerHTML = `
      <h2 class="section-title"><i class="fas fa-tasks"></i> Gestión de Tareas</h2>

      <div class="action-bar">
        <button id="btn-new-task" class="btn btn-primary">
          <i class="fas fa-plus"></i> Nueva Tarea
        </button>
        <div class="filters">
          <select id="filter-task-status" class="form-control">
  <option value="active_paused">Activas y En Pausa</option>
  <option value="all">Todas</option>
  <option value="active">Solo Activas</option>
  <option value="paused">Solo En Pausa</option>
  <option value="done">Solo Completadas</option>
</select>
          <select id="filter-hotel" class="form-control">
            <option value="">Todos los hoteles</option>
            <option value="Wave">Wave</option>
            <option value="Sky">Sky</option>
            <option value="Beach">Beach</option>
          </select>
          <select id="filter-area" class="form-control">
            <option value="">Todas las áreas</option>
            <option value="Recepción">Recepción</option>
            <option value="Habitaciones">Habitaciones</option>
            <option value="Piscina">Piscina</option>
            <option value="Mantenimiento">Mantenimiento</option>
            <option value="Cocina">Cocina</option>
            <option value="Limpieza">Limpieza</option>
            <option value="Jardines">Jardines</option>
          </select>
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input type="text" id="search-task" class="form-control" placeholder="Buscar tarea...">
          </div>
        </div>
      </div>

      <!-- Formulario para crear/editar tarea -->
      <div id="task-form" class="form-container hidden">
        <h3 class="form-title">Nueva Tarea</h3>
        <div class="form-group">
          <label for="new-task-title">Título *</label>
          <input type="text" id="new-task-title" class="form-control" placeholder="Título de la tarea" required />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="new-task-status">Estado</label>
            <select id="new-task-status" class="form-control">
              <option value="active">Activa</option>
              <option value="paused">En pausa</option>
              <option value="done">Finalizada</option>
            </select>
          </div>
          <div class="form-group">
            <label for="new-task-priority">Prioridad</label>
            <select id="new-task-priority" class="form-control">
              <option value="Baja">Baja</option>
              <option value="Media" selected>Media</option>
              <option value="Alta">Alta</option>
            </select>
          </div>
          <div class="form-group">
            <label for="new-task-employee">Asignado a</label>
            <select id="new-task-employee" class="form-control">
              <option value="">Sin asignar</option>
              <!-- Se llenarán dinámicamente -->
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="new-task-hotel">Hotel *</label>
            <select id="new-task-hotel" class="form-control" required>
              <option value="Wave">Wave</option>
              <option value="Sky">Sky</option>
              <option value="Beach">Beach</option>
            </select>
          </div>
          <div class="form-group">
            <label for="new-task-area">Área *</label>
            <select id="new-task-area" class="form-control" required>
              <option value="Recepción">Recepción</option>
              <option value="Habitaciones">Habitaciones</option>
              <option value="Piscina">Piscina</option>
              <option value="Mantenimiento">Mantenimiento</option>
              <option value="Cocina">Cocina</option>
              <option value="Limpieza">Limpieza</option>
              <option value="Jardines">Jardines</option>
            </select>
          </div>
          <div class="form-group">
            <label for="new-task-cost">Coste estimado (€)</label>
            <input type="number" id="new-task-cost" class="form-control" placeholder="0.00" step="0.01" min="0">
          </div>
        </div>
        <div class="form-group">
          <label for="new-task-description">Descripción</label>
          <textarea id="new-task-description" class="form-control" rows="4" placeholder="Describe la tarea..."></textarea>
        </div>
        <div class="form-actions">
          <button id="cancel-task-btn" class="btn btn-secondary">
            <i class="fas fa-times"></i> Cancelar
          </button>
          <button id="create-task-btn" class="btn btn-primary">
            <i class="fas fa-save"></i> Crear tarea
          </button>
        </div>
      </div>

      <!-- Lista de tareas -->
      <div class="tasks-container">
        <div class="tasks-header">
          <h3>Lista de Tareas</h3>
          <div class="tasks-actions">
            <button id="clear-filters-btn" class="btn btn-outline">
              <i class="fas fa-filter"></i> Limpiar Filtros
            </button>
            <button id="export-tasks-btn" class="btn btn-outline">
              <i class="fas fa-download"></i> Exportar
            </button>
          </div>
        </div>
        <div id="task-list" class="tasks-grid">
          <!-- Las tareas se cargarán aquí -->
          <p class="text-center">Cargando tareas...</p>
        </div>
      </div>
    `;
  }
  
  function setupTaskEvents() {
    console.log('🔧 Configurando eventos del módulo de tareas...');
    
    // Referencias a elementos DOM
    taskList = document.getElementById('task-list');
    filterStatus = document.getElementById('filter-task-status'); // 🔧 CAMBIO
    filterHotel = document.getElementById('filter-hotel');
    filterArea = document.getElementById('filter-area');
    searchInput = document.getElementById('search-task');
    taskForm = document.getElementById('task-form');
    btnNewTask = document.getElementById('btn-new-task');
    createBtn = document.getElementById('create-task-btn');
    cancelBtn = document.getElementById('cancel-task-btn');
    
    if (!btnNewTask || !createBtn || !cancelBtn) {
      console.error('ERROR: No se encontraron los botones necesarios en el módulo de tareas');
      return;
    }
    
    // Filtros
    if (filterStatus) {
      filterStatus.addEventListener('change', applyTaskFilters);
    }
    if (filterHotel) {
      filterHotel.addEventListener('change', applyTaskFilters);
    }
    if (filterArea) {
      filterArea.addEventListener('change', applyTaskFilters);
    }
    if (searchInput) {
      searchInput.addEventListener('input', applyTaskFilters);
    }
    
    // Botón nueva tarea
    btnNewTask.addEventListener('click', () => {
      showTaskForm();
    });
    
    // Botón cancelar
    cancelBtn.addEventListener('click', () => {
      hideTaskForm();
    });
    
    // Botón crear/actualizar tarea
    createBtn.addEventListener('click', saveTask);
    
    // Botón limpiar filtros
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', clearAllFilters);
    }
    
    // Botón exportar
    const exportBtn = document.getElementById('export-tasks-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportTasks);
    }
  }
  
  function loadTasksData() {
    console.log('📥 Cargando datos de tareas...');
    
    // 🔑 SUSCRIPCIONES UNA SOLA VEZ - SOLUCIÓN DEFINITIVA
    AppState.subscribe('tasks', (tasks) => {
      console.log(`📋 Tareas actualizadas: ${tasks.length} tareas recibidas`);
      
      // Aplicar filtros con las nuevas tareas y renderizar
      const filteredTasks = filterTasks(tasks);
      renderTasks(filteredTasks);
    });
    
    // Suscribirse a cambios en empleados para el selector
    AppState.subscribe('employees', (employees) => {
      console.log(`👥 Empleados actualizados: ${employees.length} empleados`);
      fillEmployeeSelect(employees);
    });
    
    // Cargar datos iniciales si están vacíos
    const currentTasks = AppState.get('tasks') || [];
    if (currentTasks.length === 0) {
      console.log('📝 No hay tareas existentes, cargando datos de ejemplo...');
      loadMockTasksData();
    } else {
      // Renderizado inicial
      console.log('🎨 Renderizando tareas existentes...');
      const filteredTasks = filterTasks(currentTasks);
      renderTasks(filteredTasks);
    }
    
    // Llenar selector de empleados
    fillEmployeeSelect(AppState.get('employees') || []);
    
    console.log('✅ Datos de tareas cargados correctamente');
  }

  // Cargar datos mock
  function loadMockTasksData() {
    const mockTasks = [
      { 
        id: 1, 
        title: "Revisión sistema calefacción", 
        description: "Revisar presión y temperaturas del sistema central",
        status: "active", 
        priority: "Alta",
        employee: "Juan Pérez", 
        employeeId: 1,
        hotel: "Wave",
        area: "Mantenimiento",
        cost: 150,
        escalated: false,
        createdAt: new Date(Date.now() - 86400000), // Ayer
        updatedAt: new Date()
      },
      { 
        id: 2, 
        title: "Cambiar filtros piscina principal", 
        description: "Reemplazar filtros de arena de la piscina principal",
        status: "paused", 
        priority: "Media",
        employee: "Lucía Gómez", 
        employeeId: 2,
        hotel: "Sky",
        area: "Piscina",
        cost: 300,
        escalated: false,
        createdAt: new Date(Date.now() - 172800000), // Hace 2 días
        updatedAt: new Date(Date.now() - 43200000) // Hace 12 horas
      },
      { 
        id: 3, 
        title: "Pintura fachada recepción", 
        description: "Repintar pared de la zona de recepción",
        status: "done", 
        priority: "Baja",
        employee: "Mario Ruiz", 
        employeeId: 3,
        hotel: "Beach",
        area: "Recepción",
        cost: 250,
        escalated: false,
        createdAt: new Date(Date.now() - 259200000), // Hace 3 días
        updatedAt: new Date(Date.now() - 21600000) // Hace 6 horas
      },
      { 
        id: 4, 
        title: "Desinfección completa cocina", 
        description: "Limpieza profunda y desinfección de campanas extractoras",
        status: "active", 
        priority: "Alta",
        employee: null, 
        employeeId: null,
        hotel: "Wave",
        area: "Cocina",
        cost: 400,
        escalated: true,
        createdAt: new Date(Date.now() - 43200000), // Hace 12 horas
        updatedAt: new Date()
      },
      { 
        id: 5, 
        title: "Reparar aire acondicionado hab. 201", 
        description: "El A/C de la habitación 201 no enfría correctamente",
        status: "active", 
        priority: "Media",
        employee: "Ana Torres", 
        employeeId: 4,
        hotel: "Sky",
        area: "Habitaciones",
        cost: 200,
        escalated: false,
        createdAt: new Date(Date.now() - 21600000), // Hace 6 horas
        updatedAt: new Date()
      }
    ];
    
    AppState.update('tasks', mockTasks);
  }
  
  // Función para llenar el selector de empleados
  function fillEmployeeSelect(employees) {
    const taskEmployeeSelect = document.getElementById('new-task-employee');
    if (!taskEmployeeSelect) return;
    
    // Guardar valor actual
    const currentValue = taskEmployeeSelect.value;
    
    // Limpiar opciones actuales excepto la primera
    taskEmployeeSelect.innerHTML = '<option value="">Sin asignar</option>';
    
    // Añadir empleados activos
    const activeEmployees = employees.filter(emp => emp.status === 'active');
    
    activeEmployees.forEach(employee => {
      const option = document.createElement('option');
      option.value = employee.id;
      option.textContent = `${employee.name} (${employee.position || employee.department || 'Sin cargo'})`;
      taskEmployeeSelect.appendChild(option);
    });
    
    // Restaurar valor si existía
    if (currentValue) {
      taskEmployeeSelect.value = currentValue;
    }
  }
  
  // Aplicar todos los filtros
  function applyTaskFilters() {
    console.log('🔄 === APLICANDO FILTROS ===');
    
    // 🔑 OBTENER TAREAS DE FORMA ROBUSTA
    let allTasks = [];
    try {
        allTasks = AppState.get('tasks') || [];
        console.log(`📊 Tareas en AppState: ${allTasks.length}`);
    } catch (error) {
        console.error('❌ Error obteniendo tareas:', error);
        allTasks = [];
    }
    
    if (allTasks.length === 0) {
        console.warn('⚠️ No hay tareas en AppState');
        renderTasks([]);
        return;
    }
    
    // 🔑 APLICAR FILTROS
    const filteredTasks = filterTasks(allTasks);
    
    console.log(`📊 Resultado: ${filteredTasks.length} tareas después del filtro`);
    
    // 🔑 RENDERIZAR
    renderTasks(filteredTasks);
    
    console.log('✅ === FILTROS APLICADOS ===');
}

  // Función para filtrar tareas según criterios
  function filterTasks(tasks) {
    if (!tasks || !Array.isArray(tasks)) {
        console.warn('⚠️ filterTasks: No se recibieron tareas válidas');
        return [];
    }
    
    console.log(`📋 Filtrando ${tasks.length} tareas...`);
    
    // 🔑 OBTENER VALORES DE FILTROS DE FORMA ROBUSTA
    let status = 'active_paused'; // 🎯 NUEVO: Por defecto mostrar activas y pausadas
    let hotel = '';
    let area = '';
    let search = '';
    
    try {
        const statusEl = document.getElementById('filter-task-status');
        const hotelEl = document.getElementById('filter-hotel');
        const areaEl = document.getElementById('filter-area');
        const searchEl = document.getElementById('search-task');
        
        status = statusEl ? statusEl.value : 'active_paused';
        hotel = hotelEl ? hotelEl.value : '';
        area = areaEl ? areaEl.value : '';
        search = searchEl ? searchEl.value.toLowerCase().trim() : '';
        
        console.log(`🔍 FILTROS OBTENIDOS: status="${status}", hotel="${hotel}", area="${area}", search="${search}"`);
        
    } catch (error) {
        console.error('❌ Error obteniendo valores de filtros:', error);
        status = 'active_paused'; // Fallback seguro
    }
    
    const filtered = tasks.filter(task => {
        // 🔑 NUEVA LÓGICA DE FILTRO DE ESTADO
        let matchesStatus = true;
        
        switch (status) {
            case 'all':
                matchesStatus = true; // Mostrar todas
                break;
            case 'active':
                matchesStatus = task.status === 'active'; // Solo activas
                break;
            case 'paused':
                matchesStatus = task.status === 'paused'; // Solo pausadas
                break;
            case 'done':
                matchesStatus = task.status === 'done'; // Solo completadas
                break;
            case 'active_paused':
            default:
                // 🎯 POR DEFECTO: Mostrar activas Y pausadas (ocultar completadas)
                matchesStatus = task.status === 'active' || task.status === 'paused';
                break;
        }
        
        // 🔑 FILTRO DE HOTEL
        let matchesHotel = true;
        if (hotel && hotel.trim() !== '') {
            matchesHotel = task.hotel === hotel;
        }
        
        // 🔑 FILTRO DE ÁREA
        let matchesArea = true;
        if (area && area.trim() !== '') {
            matchesArea = task.area === area;
        }
        
        // 🔑 FILTRO DE BÚSQUEDA
        let matchesSearch = true;
        if (search && search.trim() !== '') {
            matchesSearch = (
                (task.title && task.title.toLowerCase().includes(search)) ||
                (task.description && task.description.toLowerCase().includes(search)) ||
                (task.employee && task.employee.toLowerCase().includes(search)) ||
                (task.hotel && task.hotel.toLowerCase().includes(search)) ||
                (task.area && task.area.toLowerCase().includes(search))
            );
        }
        
        const matches = matchesStatus && matchesHotel && matchesArea && matchesSearch;
        
        // 🔍 DEBUG DETALLADO
        console.log(`Tarea ${task.id} "${task.title}":`, {
            status: task.status,
            filterStatus: status,
            matchesStatus,
            finalMatch: matches
        });
        
        return matches;
    });
    
    console.log(`✅ RESULTADO FILTRO: ${filtered.length} de ${tasks.length} tareas`);
    return filtered;
}
  
  // Renderizar lista de tareas
  function renderTasks(tasks) {
    console.log('🎨 === INICIANDO RENDERIZADO ===');
    console.log('📊 Tareas a renderizar:', tasks.length);
    
    if (!taskList) {
        console.error('❌ ERROR: taskList no encontrado');
        return;
    }
    
    // Limpiar lista
    taskList.innerHTML = '';
    console.log('🧹 Lista limpiada');
    
    // Verificar si hay tareas
    if (!tasks || tasks.length === 0) {
        console.log('📭 No hay tareas, mostrando estado vacío');
        taskList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <h3>No hay tareas</h3>
                <p>No se encontraron tareas que coincidan con los filtros actuales.</p>
                <button class="btn btn-primary" onclick="document.getElementById('btn-new-task').click()">
                    <i class="fas fa-plus"></i> Nueva Tarea
                </button>
            </div>
        `;
        return;
    }
    
    console.log(`🎨 Renderizando ${tasks.length} tareas`);
    
    // Ordenar tareas
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.escalated !== b.escalated) return b.escalated ? 1 : -1;
        
        const priorityOrder = { 'Alta': 0, 'Media': 1, 'Baja': 2 };
        const priorityA = priorityOrder[a.priority] ?? 1;
        const priorityB = priorityOrder[b.priority] ?? 1;
        
        if (priorityA !== priorityB) return priorityA - priorityB;
        
        return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });
    
    console.log('📋 Tareas ordenadas:', sortedTasks.map(t => ({ id: t.id, title: t.title, status: t.status })));
    
    // Renderizar cada tarea
    sortedTasks.forEach((task, index) => {
        console.log(`🎨 Renderizando tarea ${index + 1}: ${task.title}`);
        const taskElement = createTaskElement(task);
        taskList.appendChild(taskElement);
    });
    
    console.log('✅ Todas las tareas renderizadas');
    
    // Configurar eventos para los botones
    setupTaskButtonEvents();
    
    console.log('🎨 === RENDERIZADO COMPLETADO ===');
}
  
  // Crear elemento HTML para una tarea
  function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = `task-item task-${task.status} priority-${task.priority?.toLowerCase() || 'media'}`;
    if (task.escalated) {
      div.classList.add('task-escalated');
    }
    div.setAttribute('data-id', task.id);
    
    // Determinar clase y texto de estado
    const statusClass = task.status === 'active' ? 'tag-active' : 
                       task.status === 'paused' ? 'tag-paused' : 'tag-done';
    
    const statusText = task.status === 'active' ? 'Activa' : 
                      task.status === 'paused' ? 'En pausa' : 'Finalizada';
    
    const priorityClass = `tag-priority-${task.priority?.toLowerCase() || 'media'}`;
    
    div.innerHTML = `
      <div class="task-header">
        <div class="task-title-wrapper">
          <h3 class="task-title">${Utils.sanitizeHTML(task.title)}</h3>
          ${task.escalated ? '<span class="escalated-badge"><i class="fas fa-exclamation-triangle"></i> ESCALADA</span>' : ''}
        </div>
        <div class="task-tags">
          <span class="task-tag ${statusClass}">${statusText}</span>
          <span class="task-tag ${priorityClass}">${task.priority || 'Media'}</span>
        </div>
      </div>
      
      <div class="task-meta">
        <div class="task-meta-item">
          <i class="fas fa-building"></i>
          <span>${Utils.sanitizeHTML(task.hotel || 'Sin hotel')}</span>
        </div>
        <div class="task-meta-item">
          <i class="fas fa-map-marker-alt"></i>
          <span>${Utils.sanitizeHTML(task.area || 'Sin área')}</span>
        </div>
        <div class="task-meta-item">
          <i class="fas fa-user"></i>
          <span>${Utils.sanitizeHTML(task.employee || 'Sin asignar')}</span>
        </div>
        <div class="task-meta-item">
          <i class="fas fa-euro-sign"></i>
          <span>${task.cost ? Utils.formatCurrency(task.cost) : '0,00 €'}</span>
        </div>
      </div>
      
      ${task.description ? 
        `<div class="task-description">${Utils.sanitizeHTML(task.description)}</div>` : ''}
      
      <div class="task-footer">
        <div class="task-dates">
          <small><i class="fas fa-clock"></i> ${Utils.formatDate(task.updatedAt || task.createdAt)}</small>
        </div>
        <div class="task-actions">
          <button class="btn-task-edit" data-id="${task.id}" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          ${task.status !== 'done' ? 
            `<button class="btn-task-complete" data-id="${task.id}" title="Completar">
              <i class="fas fa-check"></i>
            </button>` : 
            `<button class="btn-task-reopen" data-id="${task.id}" title="Reabrir">
              <i class="fas fa-undo"></i>
            </button>`
          }
          ${task.status === 'active' ? 
            `<button class="btn-task-pause" data-id="${task.id}" title="Pausar">
              <i class="fas fa-pause"></i>
            </button>` : task.status === 'paused' ?
            `<button class="btn-task-resume" data-id="${task.id}" title="Reanudar">
              <i class="fas fa-play"></i>
            </button>` : ''
          }
          <button class="btn-task-escalate ${task.escalated ? 'escalated' : ''}" data-id="${task.id}" title="${task.escalated ? 'Desescalar' : 'Escalar'}">
            <i class="fas fa-exclamation-triangle"></i>
          </button>
          <button class="btn-task-winter" data-id="${task.id}" title="Mover a invierno">
            <i class="fas fa-snowflake"></i>
          </button>
          <button class="btn-task-delete" data-id="${task.id}" title="Eliminar">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
    
    return div;
  }

  // Configurar eventos para botones de tareas
  function setupTaskButtonEvents() {
    // Botones de editar
    document.querySelectorAll('.btn-task-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = parseInt(btn.getAttribute('data-id'));
        editTask(taskId);
      });
    });
    
    // Botones de completar
    document.querySelectorAll('.btn-task-complete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = parseInt(btn.getAttribute('data-id'));
        updateTaskStatus(taskId, 'done');
      });
    });
    
    // Botones de reabrir
    document.querySelectorAll('.btn-task-reopen').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = parseInt(btn.getAttribute('data-id'));
        updateTaskStatus(taskId, 'active');
      });
    });
    
    // Botones de pausar
    document.querySelectorAll('.btn-task-pause').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = parseInt(btn.getAttribute('data-id'));
        updateTaskStatus(taskId, 'paused');
      });
    });
    
    // Botones de reanudar
    document.querySelectorAll('.btn-task-resume').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = parseInt(btn.getAttribute('data-id'));
        updateTaskStatus(taskId, 'active');
      });
    });
    
    // Botones de escalar
    document.querySelectorAll('.btn-task-escalate').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = parseInt(btn.getAttribute('data-id'));
        toggleTaskEscalation(taskId);
      });
    });
    
    // Botones de mover a invierno
    document.querySelectorAll('.btn-task-winter').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = parseInt(btn.getAttribute('data-id'));
        moveTaskToWinter(taskId);
      });
    });
    
    // Botones de eliminar
    document.querySelectorAll('.btn-task-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = parseInt(btn.getAttribute('data-id'));
        deleteTask(taskId);
      });
    });
  }

  // Mostrar formulario
  function showTaskForm(taskData = null) {
    if (!taskForm) return;
    
    // Actualizar título del formulario
    const formTitle = taskForm.querySelector('.form-title');
    if (formTitle) {
      formTitle.textContent = taskData ? 'Editar Tarea' : 'Nueva Tarea';
    }
    
    // Rellenar formulario si hay datos
    if (taskData) {
      currentTaskId = taskData.id;
      document.getElementById('new-task-title').value = taskData.title || '';
      document.getElementById('new-task-status').value = taskData.status || 'active';
      document.getElementById('new-task-priority').value = taskData.priority || 'Media';
      document.getElementById('new-task-employee').value = taskData.employeeId || '';
      document.getElementById('new-task-hotel').value = taskData.hotel || 'Wave';
      document.getElementById('new-task-area').value = taskData.area || 'Recepción';
      document.getElementById('new-task-cost').value = taskData.cost || '';
      document.getElementById('new-task-description').value = taskData.description || '';
      
      // Cambiar texto del botón
      if (createBtn) {
        createBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar tarea';
      }
    } else {
      resetTaskForm();
    }
    
    // Mostrar formulario
    taskForm.classList.remove('hidden');
    taskForm.scrollIntoView({ behavior: 'smooth' });
    
    // Focus en el primer campo
    const titleInput = document.getElementById('new-task-title');
    if (titleInput) {
      titleInput.focus();
    }
  }

  // Ocultar formulario
  function hideTaskForm() {
    if (!taskForm) return;
    
    taskForm.classList.add('hidden');
    resetTaskForm();
  }
  
  // Resetear formulario
  function resetTaskForm() {
    document.getElementById('new-task-title').value = '';
    document.getElementById('new-task-status').value = 'active';
    document.getElementById('new-task-priority').value = 'Media';
    document.getElementById('new-task-employee').value = '';
    document.getElementById('new-task-hotel').value = 'Wave';
    document.getElementById('new-task-area').value = 'Recepción';
    document.getElementById('new-task-cost').value = '';
    document.getElementById('new-task-description').value = '';
    
    currentTaskId = null;
    
    // Restaurar texto del botón
    if (createBtn) {
      createBtn.innerHTML = '<i class="fas fa-save"></i> Crear tarea';
    }
  }
  
  // Guardar una tarea (nueva o actualizada)
  function saveTask() {
    try {
      // Obtener valores del formulario
      const titleEl = document.getElementById('new-task-title');
     const statusEl = document.getElementById('new-task-status');
     const priorityEl = document.getElementById('new-task-priority');
     const employeeEl = document.getElementById('new-task-employee');
     const hotelEl = document.getElementById('new-task-hotel');
     const areaEl = document.getElementById('new-task-area');
     const costEl = document.getElementById('new-task-cost');
     const descriptionEl = document.getElementById('new-task-description');
     
     // Validar campos obligatorios
     if (!titleEl.value.trim()) {
       Utils.showToast('Por favor ingresa un título para la tarea', 'error');
       titleEl.focus();
       return;
     }
     
     if (!hotelEl.value) {
       Utils.showToast('Por favor selecciona un hotel', 'error');
       hotelEl.focus();
       return;
     }
     
     if (!areaEl.value) {
       Utils.showToast('Por favor selecciona un área', 'error');
       areaEl.focus();
       return;
     }
     
     // Obtener información del empleado seleccionado
     let employeeName = null;
     let employeeId = null;
     
     if (employeeEl.value) {
       employeeId = parseInt(employeeEl.value);
       const employee = AppState.get('employees').find(e => e.id === employeeId);
       if (employee) {
         employeeName = employee.name;
       }
     }
     
     // Preparar datos de la tarea
     const taskData = {
       title: titleEl.value.trim(),
       status: statusEl.value,
       priority: priorityEl.value,
       description: descriptionEl.value.trim(),
       employee: employeeName,
       employeeId: employeeId,
       hotel: hotelEl.value,
       area: areaEl.value,
       cost: costEl.value ? parseFloat(costEl.value) : 0,
       updatedAt: new Date()
     };
     
     // Verificar si es una edición o una nueva tarea
     if (currentTaskId) {
       // Actualizar tarea existente
       const tasks = [...AppState.get('tasks')];
       const taskIndex = tasks.findIndex(t => t.id === currentTaskId);
       
       if (taskIndex !== -1) {
         // Mantener campos que no están en el formulario
         const updatedTask = {
           ...tasks[taskIndex],
           ...taskData
         };
         
         tasks[taskIndex] = updatedTask;
         
         // Actualizar en AppState
         AppState.update('tasks', tasks);
         
         // Notificar
         Utils.showToast('Tarea actualizada correctamente', 'success');
       } else {
         Utils.showToast('Error: Tarea no encontrada', 'error');
         return;
       }
     } else {
       // Crear nueva tarea
       const tasks = [...AppState.get('tasks')];
       
       // Encontrar el ID más alto y sumar 1
       const maxId = tasks.reduce((max, task) => Math.max(max, task.id || 0), 0);
       
       const newTask = {
         ...taskData,
         id: maxId + 1,
         escalated: false,
         createdAt: new Date(),
         createdBy: currentUser ? currentUser.uid : 'sistema',
         createdByEmail: currentUser ? currentUser.email : 'admin@prestotel.com'
       };
       
       // Añadir a la lista
       tasks.push(newTask);
       
       // Actualizar en AppState
       AppState.update('tasks', tasks);
       
       // Notificar
       Utils.showToast('Tarea creada correctamente', 'success');
     }
     
     // Ocultar formulario
     hideTaskForm();
     
   } catch (error) {
     console.error('Error al guardar tarea:', error);
     Utils.showToast('Error al guardar la tarea. Inténtalo de nuevo.', 'error');
   }
 }
 
 // Editar una tarea existente
 function editTask(taskId) {
   const tasks = AppState.get('tasks');
   const task = tasks.find(t => t.id === taskId);
   
   if (!task) {
     Utils.showToast('Tarea no encontrada', 'error');
     return;
   }
   
   showTaskForm(task);
 }
 
 // Actualizar estado de una tarea
 function updateTaskStatus(taskId, newStatus) {
   const tasks = [...AppState.get('tasks')];
   const taskIndex = tasks.findIndex(t => t.id === taskId);
   
   if (taskIndex === -1) {
     Utils.showToast('Tarea no encontrada', 'error');
     return;
   }
   
   // Confirmar acción si es importante
   const statusMessages = {
     'done': '¿Marcar esta tarea como completada?',
     'active': '¿Reactivar esta tarea?',
     'paused': '¿Pausar esta tarea?'
   };
   
   const confirmMessage = statusMessages[newStatus] || '¿Cambiar el estado de esta tarea?';
   
   Utils.confirmAction(confirmMessage, () => {
     // Actualizar estado
     tasks[taskIndex].status = newStatus;
     tasks[taskIndex].updatedAt = new Date();
     
     // Si se completa, quitar escalación
     if (newStatus === 'done' && tasks[taskIndex].escalated) {
       tasks[taskIndex].escalated = false;
     }
     
     // Actualizar en AppState
     AppState.update('tasks', tasks);
     
     // Notificar
     const message = newStatus === 'done' ? 'Tarea completada' : 
                    newStatus === 'paused' ? 'Tarea pausada' : 'Tarea reactivada';
     Utils.showToast(message, 'success');
   });
 }
 
 // Cambiar estado de escalación de una tarea
 function toggleTaskEscalation(taskId) {
   const tasks = [...AppState.get('tasks')];
   const taskIndex = tasks.findIndex(t => t.id === taskId);
   
   if (taskIndex === -1) {
     Utils.showToast('Tarea no encontrada', 'error');
     return;
   }
   
   const task = tasks[taskIndex];
   const action = task.escalated ? 'desescalar' : 'escalar';
   
   Utils.confirmAction(
     `¿Estás seguro de que quieres ${action} la tarea "${task.title}"?`,
     () => {
       // Cambiar estado de escalación
       tasks[taskIndex].escalated = !tasks[taskIndex].escalated;
       tasks[taskIndex].updatedAt = new Date();
       
       // Actualizar en AppState
       AppState.update('tasks', tasks);
       
       // Notificar
       Utils.showToast(
         tasks[taskIndex].escalated ? 'Tarea escalada' : 'Tarea desescalada', 
         'success'
       );
     }
   );
 }
 
 // Mover tarea al módulo de invierno
 function moveTaskToWinter(taskId) {
   const tasks = AppState.get('tasks');
   const task = tasks.find(t => t.id === taskId);
   
   if (!task) {
     Utils.showToast('Tarea no encontrada', 'error');
     return;
   }
   
   Utils.confirmAction(
     `¿Mover la tarea "${task.title}" al módulo de invierno?\n\nEsto creará una nueva tarea en el módulo de invierno basada en esta tarea.`,
     () => {
       try {
         // Crear una nueva tarea de invierno basada en la tarea original
         const winterTasks = [...(AppState.get('winterTasks') || [])];
         const maxId = winterTasks.reduce((max, t) => Math.max(max, t.id || 0), 0);
         
         const winterTask = {
           id: maxId + 1,
           title: task.title,
           description: task.description || '',
           hotel: task.hotel || 'Wave',
           area: task.area || 'Mantenimiento',
           priority: task.priority || 'Media',
           cost: task.cost || 0,
           status: 'pending',
           createdAt: new Date(),
           updatedAt: new Date(),
           movedFrom: {
             moduleId: 'tasks',
             taskId: task.id,
             movedAt: new Date(),
             movedBy: currentUser ? currentUser.email : 'admin@prestotel.com'
           }
         };
         
         // Añadir a winterTasks
         winterTasks.push(winterTask);
         AppState.update('winterTasks', winterTasks);
         
         // Preguntar si eliminar la tarea original
         Utils.confirmAction(
           'Tarea movida a invierno exitosamente.\n\n¿Deseas eliminar la tarea original del módulo de tareas?',
           () => {
             // Eliminar la tarea original
             const newTasks = tasks.filter(t => t.id !== taskId);
             AppState.update('tasks', newTasks);
             
             Utils.showToast('Tarea movida a invierno y eliminada del módulo de tareas', 'success');
           },
           () => {
             // No eliminar la tarea original
             Utils.showToast('Tarea copiada a invierno. La tarea original permanece en el módulo de tareas.', 'info');
           }
         );
         
       } catch (error) {
         console.error('Error al mover tarea a invierno:', error);
         Utils.showToast('Error al mover la tarea al módulo de invierno', 'error');
       }
     }
   );
 }
 
 // Eliminar una tarea
 function deleteTask(taskId) {
   const tasks = AppState.get('tasks');
   const task = tasks.find(t => t.id === taskId);
   
   if (!task) {
     Utils.showToast('Tarea no encontrada', 'error');
     return;
   }
   
   Utils.confirmAction(
     `¿Estás seguro de que deseas eliminar la tarea "${task.title}"?\n\nEsta acción no se puede deshacer.`,
     () => {
       const newTasks = tasks.filter(t => t.id !== taskId);
       
       // Actualizar en AppState
       AppState.update('tasks', newTasks);
       
       // Notificar
       Utils.showToast('Tarea eliminada correctamente', 'success');
     }
   );
 }

 // Limpiar todos los filtros
 function clearAllFilters() {
    const taskStatusFilter = document.getElementById('filter-task-status'); // 🔧 CAMBIO
    if (taskStatusFilter) taskStatusFilter.value = 'active_paused';
    if (filterHotel) filterHotel.value = '';
    if (filterArea) filterArea.value = '';
    if (searchInput) searchInput.value = '';
    
    applyTaskFilters();
    Utils.showToast('Filtros limpiados', 'info');
}

 // Exportar tareas
 function exportTasks() {
   const tasks = AppState.get('tasks');
   
   if (!tasks || tasks.length === 0) {
     Utils.showToast('No hay tareas para exportar', 'warning');
     return;
   }
   
   try {
     // Preparar datos para exportación
     const data = tasks.map(task => ({
       'ID': task.id,
       'Título': task.title,
       'Estado': task.status === 'active' ? 'Activa' : 
                task.status === 'paused' ? 'En pausa' : 'Finalizada',
       'Prioridad': task.priority || 'Media',
       'Hotel': task.hotel || '',
       'Área': task.area || '',
       'Empleado': task.employee || 'Sin asignar',
       'Coste (€)': task.cost || 0,
       'Escalada': task.escalated ? 'Sí' : 'No',
       'Descripción': task.description || '',
       'Creada': Utils.formatDate(task.createdAt),
       'Actualizada': Utils.formatDate(task.updatedAt)
     }));
     
     // Verificar si existe la función de exportar en Utils
     if (typeof Utils.exportToExcel === 'function') {
       Utils.exportToExcel(data, 'Tareas.xlsx', 'Gestión de Tareas');
     } else {
       // Implementación básica de exportación CSV
       exportToCSV(data, 'Tareas.csv');
     }
     
     Utils.showToast('Tareas exportadas correctamente', 'success');
     
   } catch (error) {
     console.error('Error al exportar tareas:', error);
     Utils.showToast('Error al exportar las tareas', 'error');
   }
 }

 // Implementación básica de exportación a CSV
 function exportToCSV(data, filename) {
   if (!data || data.length === 0) {
     throw new Error('No hay datos para exportar');
   }
   
   // Obtener headers
   const headers = Object.keys(data[0]);
   
   // Crear contenido CSV
   let csvContent = headers.join(',') + '\n';
   
   data.forEach(row => {
     const values = headers.map(header => {
       let value = row[header] || '';
       // Escapar comillas y agregar comillas si contiene comas
       if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
         value = '"' + value.replace(/"/g, '""') + '"';
       }
       return value;
     });
     csvContent += values.join(',') + '\n';
   });
   
   // Crear y descargar archivo
   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
   const link = document.createElement('a');
   const url = URL.createObjectURL(blob);
   
   link.setAttribute('href', url);
   link.setAttribute('download', filename);
   link.style.visibility = 'hidden';
   
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
   
   URL.revokeObjectURL(url);
 }

})(); // FIN DEL MÓDULO IIFE