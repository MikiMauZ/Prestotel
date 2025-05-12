// Módulo de gestión de tareas
document.addEventListener('DOMContentLoaded', () => {
  console.log('Inicializando módulo de tareas...');
  
  // Verificar si estamos en la página de tareas
  let tasksView = document.getElementById('tasks-view');
  
  // Si no existe el elemento, crearlo
  if (!tasksView) {
    console.warn('No se encontró el contenedor del módulo de tareas. Creándolo...');
    tasksView = document.createElement('div');
    tasksView.id = 'tasks-view';
    tasksView.className = 'module-view hidden';
    document.querySelector('.content').appendChild(tasksView);
  }

  // Determinar si el usuario actual es administrador
  let isAdmin = false;

  // Verificar estado de administrador
  function checkAdminStatus() {
    // Si usamos AppState
    isAdmin = AppState.get('userRole') === 'admin';
    return isAdmin;
  }


  
  // Inicializar estructura del módulo
  initTasksModule();
  
  // Funciones del módulo
  function initTasksModule() {
    console.log('Generando estructura del módulo de tareas...');

    checkAdminStatus();
    
    // Establecer estructura HTML base
    tasksView.innerHTML = `
      <h2 class="section-title"><i class="fas fa-tasks"></i> Gestión de Tareas</h2>

      <div class="action-bar">
        <button id="btn-new-task" class="btn btn-primary"><i class="fas fa-plus"></i> Nueva Tarea</button>
        <div class="filters">
          <select id="filter-status" class="form-control">
            <option value="all">Todas</option>
            <option value="active">Activas</option>
            <option value="paused">En pausa</option>
            <option value="done">Finalizadas</option>
          </select>
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input type="text" id="search-task" class="form-control" placeholder="Buscar tarea...">
          </div>
        </div>
      </div>

      <!-- Formulario para crear nueva tarea -->
      <div id="task-form" class="form-container hidden">
        <h3 class="form-title">Nueva Tarea</h3>
        <div class="form-group">
          <label for="new-task-title">Título</label>
          <input type="text" id="new-task-title" class="form-control" placeholder="Título de la tarea" />
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
            <label for="new-task-employee">Asignado a</label>
            <select id="new-task-employee" class="form-control">
              <option value="">Sin asignar</option>
              <!-- Se llenarán dinámicamente -->
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="new-task-description">Descripción</label>
          <textarea id="new-task-description" class="form-control" placeholder="Describe la tarea..."></textarea>
        </div>
        <div class="form-actions">
          <button id="cancel-task-btn" class="btn btn-secondary">Cancelar</button>
          <button id="create-task-btn" class="btn btn-primary">Crear tarea</button>
        </div>
      </div>

      <div id="task-list" class="task-list">
        <!-- Las tareas se cargarán aquí -->
        <p class="text-center">Cargando tareas...</p>
      </div>
    `;
    
    // Configurar eventos y cargar datos
    setupTaskEvents();
    loadTasksData();
  }
  
  function setupTaskEvents() {
    console.log('Configurando eventos del módulo de tareas...');
    
    // Referencias a elementos DOM
    const taskList = document.getElementById('task-list');
    const filterStatus = document.getElementById('filter-status');
    const searchInput = document.getElementById('search-task');
    const taskForm = document.getElementById('task-form');
    const btnNewTask = document.getElementById('btn-new-task');
    const createBtn = document.getElementById('create-task-btn');
    const cancelBtn = document.getElementById('cancel-task-btn');
    
    if (!btnNewTask || !createBtn || !cancelBtn) {
      console.error('ERROR: No se encontraron los botones necesarios en el módulo de tareas');
      return;
    }
    
    // Filtros
    if (filterStatus) {
      filterStatus.addEventListener('change', () => {
        renderTasks(filterTasks());
      });
    }
    
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        renderTasks(filterTasks());
      });
    }
    
    // Botón nueva tarea
    btnNewTask.addEventListener('click', () => {
      if (taskForm) {
        taskForm.classList.remove('hidden');
        const titleInput = document.getElementById('new-task-title');
        if (titleInput) titleInput.focus();
      }
    });
    
    // Cancelar
    cancelBtn.addEventListener('click', () => {
      if (taskForm) taskForm.classList.add('hidden');
    });
    
    // Crear tarea
    createBtn.addEventListener('click', saveTask);
  }
  
  function loadTasksData() {
    console.log('Cargando datos de tareas...');
    
    // Suscribirse a cambios en tareas
    AppState.subscribe('tasks', tasks => {
      console.log(`Recibidas ${tasks.length} tareas del AppState`);
      renderTasks(filterTasks());
    });
    
    // Suscribirse a cambios en empleados para el selector
    AppState.subscribe('employees', fillEmployeeSelect);
    
    // Cargar datos iniciales si están vacíos
    if (AppState.get('tasks').length === 0) {
      console.log('No hay tareas existentes, cargando datos de ejemplo...');
      const mockTasks = [
        { 
          id: 1, 
          title: "Revisión caldera", 
          description: "Revisar presión y temperaturas",
          status: "active", 
          employee: "Juan Pérez", 
          employeeId: 1,
          hotel: "Wave",
          area: "Mantenimiento",
          escalated: false,
          createdAt: new Date(Date.now() - 86400000), // Ayer
          updatedAt: new Date()
        },
        { 
          id: 2, 
          title: "Cambiar filtros piscina", 
          description: "Reemplazar filtros de arena",
          status: "paused", 
          employee: "Lucía Gómez", 
          employeeId: 2,
          hotel: "Sky",
          area: "Piscina",
          escalated: false,
          createdAt: new Date(Date.now() - 172800000), // Hace 2 días
          updatedAt: new Date(Date.now() - 43200000) // Hace 12 horas
        },
        { 
          id: 3, 
          title: "Pintar fachada interior", 
          description: "Pintar pared zona recepción",
          status: "done", 
          employee: "Mario Ruiz", 
          employeeId: 3,
          hotel: "Palm",
          area: "Recepción",
          escalated: false,
          createdAt: new Date(Date.now() - 259200000), // Hace 3 días
          updatedAt: new Date(Date.now() - 21600000) // Hace 6 horas
        },
        { 
          id: 4, 
          title: "Desinfección cocina", 
          description: "Limpieza profunda de campanas",
          status: "active", 
          employee: null, 
          employeeId: null,
          hotel: "Wave",
          area: "Cocina",
          escalated: true,
          createdAt: new Date(Date.now() - 43200000), // Hace 12 horas
          updatedAt: new Date()
        }
      ];
      
      AppState.data.tasks = mockTasks;
      AppState.saveToLocalStorage();
      AppState.notifyAll();
    } else {
      // Si ya hay tareas, simplemente renderizamos
      renderTasks(filterTasks());
    }
    
    console.log('Datos de tareas cargados');
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
      option.textContent = `${employee.name} (${employee.position || employee.department})`;
      taskEmployeeSelect.appendChild(option);
    });
    
    // Restaurar valor si existía
    if (currentValue) {
      taskEmployeeSelect.value = currentValue;
    }
  }
  
  // Función para filtrar tareas según criterios
  function filterTasks() {
    const filterStatus = document.getElementById('filter-status');
    const searchInput = document.getElementById('search-task');
    
    if (!filterStatus || !searchInput) return AppState.get('tasks');
    
    const status = filterStatus.value;
    const search = searchInput.value.toLowerCase();
    
    return AppState.get('tasks').filter(task => {
      const matchesStatus = status === "all" || task.status === status;
      const matchesSearch = !search || 
                           task.title.toLowerCase().includes(search) ||
                           (task.description && task.description.toLowerCase().includes(search)) ||
                           (task.employee && task.employee.toLowerCase().includes(search));
      return matchesStatus && matchesSearch;
    });
  }
  
  // Renderizar lista de tareas
  function renderTasks(tasks) {
    const taskList = document.getElementById('task-list');
    if (!taskList) {
      console.error('ERROR: No se encontró el contenedor de la lista de tareas');
      return;
    }
    
    // Limpiar lista
    taskList.innerHTML = '';
    
    // Verificar si hay tareas
    if (!tasks || tasks.length === 0) {
      taskList.innerHTML = '<p class="text-center">No hay tareas que coincidan con los filtros</p>';
      return;
    }
    
    console.log(`Renderizando ${tasks.length} tareas`);
    
    // Renderizar cada tarea
    tasks.forEach(task => {
      const taskElement = createTaskElement(task);
      taskList.appendChild(taskElement);
    });
    
    // Configurar eventos para los botones
    setupTaskButtonEvents();
  }
  
  // Crear elemento HTML para una tarea
  function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = 'task-item';
    div.setAttribute('data-id', task.id);
    
    // Determinar clase de estado
    const statusClass = task.status === 'active' ? 'tag-active' : 
                       task.status === 'paused' ? 'tag-paused' : 'tag-done';
    
    // Texto de estado
    const statusText = task.status === 'active' ? 'Activa' : 
                      task.status === 'paused' ? 'En pausa' : 'Finalizada';
    
    div.innerHTML = `
      <div class="task-header">
        <h3 class="task-title">${Utils.sanitizeHTML(task.title)}</h3>
        <div>
          <span class="task-tag ${statusClass}">${statusText}</span>
          ${task.escalated ? '<span class="task-tag tag-escalated">ESCALADA</span>' : ''}
        </div>
      </div>
      <div class="task-meta">
        ${task.hotel ? `<div class="task-hotel"><i class="fas fa-hotel"></i> ${Utils.sanitizeHTML(task.hotel)}</div>` : ''}
        ${task.area ? `<div class="task-area"><i class="fas fa-map-marker-alt"></i> ${Utils.sanitizeHTML(task.area)}</div>` : ''}
        ${task.employee ? `<div class="task-assignee"><i class="fas fa-user"></i> ${Utils.sanitizeHTML(task.employee)}</div>` : ''}
        <div class="task-date"><i class="fas fa-calendar-alt"></i> ${Utils.formatDate(task.createdAt)}</div>
      </div>
      ${task.description ? `<div class="task-description">${Utils.sanitizeHTML(task.description)}</div>` : ''}
      <div class="task-actions">
        <button class="task-button btn-escalate" data-id="${task.id}">
          <i class="fas fa-${task.escalated ? 'arrow-down' : 'arrow-up'}"></i>
          ${task.escalated ? "Desescalar" : "Escalar"}
        </button>
        <button class="task-button btn-edit" data-id="${task.id}">
          <i class="fas fa-edit"></i> Editar
        </button>
        ${task.status !== 'done' ? `
          <button class="task-button btn-complete" data-id="${task.id}">
            <i class="fas fa-check"></i> Completar
          </button>
        ` : ''}
        ${task.status === 'active' ? `
          <button class="task-button btn-pause" data-id="${task.id}">
            <i class="fas fa-pause"></i> Pausar
          </button>
        ` : ''}
        ${task.status === 'paused' ? `
          <button class="task-button btn-resume" data-id="${task.id}">
            <i class="fas fa-play"></i> Reanudar
          </button>
        ` : ''}
        ${isAdmin ? `
          <button class="task-button btn-move-to-winter" data-id="${task.id}">
            <i class="fas fa-snowflake"></i> Mover a Invierno
          </button>
        ` : ''}
        <button class="task-button btn-delete" data-id="${task.id}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    
    return div;
  }
  
  // Configurar eventos para los botones de tareas
  function setupTaskButtonEvents() {
    // Botones de escalación
    document.querySelectorAll('.btn-escalate').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const taskId = parseInt(btn.getAttribute('data-id'));
        toggleTaskEscalation(taskId);
      });
    });
    
    // Botones de editar
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const taskId = parseInt(btn.getAttribute('data-id'));
        editTask(taskId);
      });
    });
    
    // Botones de completar
    document.querySelectorAll('.btn-complete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const taskId = parseInt(btn.getAttribute('data-id'));
        updateTaskStatus(taskId, 'done');
      });
    });
    
    // Botones de pausar
    document.querySelectorAll('.btn-pause').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const taskId = parseInt(btn.getAttribute('data-id'));
        updateTaskStatus(taskId, 'paused');
      });
    });
    
    // Botones de reanudar
    document.querySelectorAll('.btn-resume').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const taskId = parseInt(btn.getAttribute('data-id'));
        updateTaskStatus(taskId, 'active');
      });
    });
    
    // Botones de eliminar
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const taskId = parseInt(btn.getAttribute('data-id'));
        deleteTask(taskId);
      });
    });

     // Botones de mover a invierno (para administradores)
    document.querySelectorAll('.btn-move-to-winter').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const taskId = parseInt(btn.getAttribute('data-id'));
        moveTaskToWinter(taskId);
      });
    });
  }
  // Función para mover una tarea al módulo de invierno
  function moveTaskToWinter(taskId) {
    // Comprobar si el usuario es administrador
    if (!isAdmin) {
      Utils.showToast('Solo los administradores pueden mover tareas al módulo de invierno', 'error');
      return;
    }
    
    Utils.confirmAction(
      '¿Estás seguro de que deseas mover esta tarea al módulo de invierno?',
      () => {
        // Obtener la tarea original
        const tasks = AppState.get('tasks');
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) {
          Utils.showToast('Tarea no encontrada', 'error');
          return;
        }
        
        const task = tasks[taskIndex];
        
        // Crear una nueva tarea de invierno basada en la tarea original
        const winterTasks = [...AppState.get('winterTasks') || []];
        const maxId = winterTasks.reduce((max, t) => Math.max(max, t.id || 0), 0);
        
        const winterTask = {
          id: maxId + 1,
          title: task.title,
          description: task.description,
          hotel: task.hotel || 'Wave',
          area: task.area || 'Otra',
          priority: task.priority || 'Media',
          cost: task.cost || 0,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
          movedFrom: {
            moduleId: 'tasks',
            taskId: task.id,
            movedAt: new Date(),
            movedBy: currentUser ? currentUser.email : 'admin'
          }
        };
        
        // Añadir a winterTasks
        winterTasks.push(winterTask);
        AppState.update('winterTasks', winterTasks);
        
        // Eliminar la tarea original si se confirma
        Utils.confirmAction(
          '¿Deseas eliminar la tarea original ahora que se ha movido a invierno?',
          () => {
            // Eliminar la tarea original
            const newTasks = tasks.filter(t => t.id !== taskId);
            AppState.update('tasks', newTasks);
            
            Utils.showToast('Tarea movida a invierno y eliminada del módulo de tareas', 'success');
            
            // Recargar la lista de tareas
            renderTasks(applyTaskFilters());
          },
          () => {
            // No eliminar la tarea original
            Utils.showToast('Tarea copiada a invierno. La tarea original sigue en el módulo de tareas.', 'info');
          }
        );
      }
    );
  }
  
  // Cambiar estado de escalación de una tarea
  function toggleTaskEscalation(taskId) {
    const tasks = AppState.get('tasks');
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      Utils.showToast('Tarea no encontrada', 'error');
      return;
    }
    
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
  
  // Editar una tarea existente
  function editTask(taskId) {
    const tasks = AppState.get('tasks');
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) {
      Utils.showToast('Tarea no encontrada', 'error');
      return;
    }
    
    // Llenar el formulario
    document.getElementById('new-task-title').value = task.title;
    document.getElementById('new-task-status').value = task.status;
    document.getElementById('new-task-employee').value = task.employeeId || '';
    document.getElementById('new-task-description').value = task.description || '';
    
    // Cambiar texto del botón
    document.getElementById('create-task-btn').textContent = 'Actualizar tarea';
    
    // Guardar ID de la tarea
    document.getElementById('create-task-btn').setAttribute('data-task-id', taskId);
    
    // Mostrar formulario
    document.getElementById('task-form').classList.remove('hidden');
    document.getElementById('new-task-title').focus();
  }
  
  // Actualizar estado de una tarea
  function updateTaskStatus(taskId, newStatus) {
    const tasks = AppState.get('tasks');
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      Utils.showToast('Tarea no encontrada', 'error');
      return;
    }
    
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
                   newStatus === 'paused' ? 'Tarea pausada' : 'Tarea activada';
    Utils.showToast(message, 'success');
  }
  
  // Eliminar una tarea
  function deleteTask(taskId) {
    Utils.confirmAction(
      '¿Estás seguro de que deseas eliminar esta tarea?',
      () => {
        const tasks = AppState.get('tasks');
        const newTasks = tasks.filter(t => t.id !== taskId);
        
        // Actualizar en AppState
        AppState.update('tasks', newTasks);
        
        // Notificar
        Utils.showToast('Tarea eliminada', 'success');
      }
    );
  }
  
  // Guardar una tarea (nueva o actualizada)
  function saveTask() {
    // Obtener valores del formulario
    const titleEl = document.getElementById('new-task-title');
    const statusEl = document.getElementById('new-task-status');
    const employeeEl = document.getElementById('new-task-employee');
    const descriptionEl = document.getElementById('new-task-description');
    
    // Validar título
    if (!titleEl.value.trim()) {
      Utils.showToast('Por favor ingresa un título para la tarea', 'error');
      titleEl.focus();
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
      description: descriptionEl.value.trim(),
      employee: employeeName,
      employeeId: employeeId,
      updatedAt: new Date()
    };
    
    // Verificar si es una edición o una nueva tarea
    const taskIdToUpdate = document.getElementById('create-task-btn').getAttribute('data-task-id');
    
    if (taskIdToUpdate) {
      // Actualizar tarea existente
      const tasks = AppState.get('tasks');
      const taskIndex = tasks.findIndex(t => t.id === parseInt(taskIdToUpdate));
      
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
        Utils.showToast('Tarea actualizada', 'success');
      } else {
        Utils.showToast('Error al actualizar la tarea', 'error');
      }
    } else {
      // Crear nueva tarea
      const tasks = AppState.get('tasks');
      
      // Encontrar el ID más alto y sumar 1
      const maxId = tasks.reduce((max, task) => Math.max(max, task.id || 0), 0);
      
      const newTask = {
        ...taskData,
        id: maxId + 1,
        hotel: "Wave", // Valores por defecto
        area: "Mantenimiento",
        escalated: false,
        createdAt: new Date()
      };
      
      // Añadir a la lista
      tasks.push(newTask);
      
      // Actualizar en AppState
      AppState.update('tasks', tasks);
      
      // Notificar
      Utils.showToast('Tarea creada', 'success');
    }
    
    // Resetear formulario
    resetTaskForm();
    document.getElementById('task-form').classList.add('hidden');
  }
  
  // Resetear formulario
  function resetTaskForm() {
    document.getElementById('new-task-title').value = '';
    document.getElementById('new-task-status').value = 'active';
    document.getElementById('new-task-employee').value = '';
    document.getElementById('new-task-description').value = '';
    
    // Quitar ID de tarea en edición
    document.getElementById('create-task-btn').removeAttribute('data-task-id');
    
    // Restaurar texto del botón
    document.getElementById('create-task-btn').textContent = 'Crear tarea';
  }
  
  console.log('Módulo de tareas inicializado correctamente');
});