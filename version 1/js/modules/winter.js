// Módulo de tareas de invierno (mejoras y previsiones)
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en la página de invierno
    const winterView = document.getElementById('winter-view');
    if (!winterView) return;
    
    // Referencias a elementos DOM
    let tasksList;
    let filterHotel;
    let filterArea;
    let filterPriority;
    let searchInput;
    let winterForm;
    
    // Variables de estado
    let currentTaskId = null;
    
    // Inicializar módulo
    function initWinterModule() {
      // Renderizar la estructura base del módulo
      renderModuleStructure();
      
      // Obtener referencias a elementos DOM
      tasksList = document.getElementById('winter-tasks-list');
      filterHotel = document.getElementById('filter-winter-hotel');
      filterArea = document.getElementById('filter-winter-area');
      filterPriority = document.getElementById('filter-winter-priority');
      searchInput = document.getElementById('search-winter-task');
      winterForm = document.getElementById('winter-task-form');
      
      // Suscribirse a cambios en las tareas de invierno
      if (AppState.get('winterTasks') === undefined) {
        AppState.data.winterTasks = [];
        AppState.saveToLocalStorage();
      }
      AppState.subscribe('winterTasks', renderWinterTasks);
      
      // Configurar eventos
      setupEventListeners();
      
      // Cargar datos iniciales si es necesario
      loadMockWinterTasks();
      
      // Renderizar tareas
      renderWinterTasks(AppState.get('winterTasks'));
    }
    
    // Renderizar la estructura base del módulo
    function renderModuleStructure() {
      winterView.innerHTML = `
        <h2 class="section-title"><i class="fas fa-snowflake"></i> Mejoras de Invierno</h2>
        
        <div class="action-bar">
          <button id="btn-new-winter-task" class="btn btn-primary"><i class="fas fa-plus"></i> Nueva Tarea</button>
          <div class="filters">
            <select id="filter-winter-hotel" class="form-control">
              <option value="">Todos los hoteles</option>
              <option value="Wave">Wave</option>
              <option value="Sky">Sky</option>
              <option value="Palm">Palm</option>
            </select>
            <select id="filter-winter-area" class="form-control">
              <option value="">Todas las áreas</option>
              <option value="Recepción">Recepción</option>
              <option value="Habitaciones">Habitaciones</option>
              <option value="Restaurante">Restaurante</option>
              <option value="Cocina">Cocina</option>
              <option value="Exterior">Exterior</option>
              <option value="Piscina">Piscina</option>
              <option value="Baños">Baños</option>
              <option value="Zonas Técnicas">Zonas Técnicas</option>
              <option value="Gimnasio">Gimnasio</option>
              <option value="Bar">Bar</option>
              <option value="Zonas Comunes">Zonas Comunes</option>
              <option value="Sótano">Sótano</option>
              <option value="Otra">Otra</option>
            </select>
            <select id="filter-winter-priority" class="form-control">
              <option value="">Todas las prioridades</option>
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </select>
            <div class="search-box">
              <i class="fas fa-search"></i>
              <input type="text" id="search-winter-task" class="form-control" placeholder="Buscar tarea...">
            </div>
          </div>
        </div>
        
        <!-- Dashboard de invierno -->
        <div class="winter-dashboard">
          <div class="winter-summary">
            <div class="summary-card bg-danger">
              <div class="summary-icon"><i class="fas fa-exclamation-circle"></i></div>
              <div class="summary-content">
                <h3>Prioridad Alta</h3>
                <p id="winter-high-count">0 tareas</p>
              </div>
            </div>
            <div class="summary-card bg-warning">
              <div class="summary-icon"><i class="fas fa-exclamation"></i></div>
              <div class="summary-content">
                <h3>Prioridad Media</h3>
                <p id="winter-medium-count">0 tareas</p>
              </div>
            </div>
            <div class="summary-card bg-success">
              <div class="summary-icon"><i class="fas fa-check-circle"></i></div>
              <div class="summary-content">
                <h3>Prioridad Baja</h3>
                <p id="winter-low-count">0 tareas</p>
              </div>
            </div>
            <div class="summary-card bg-info">
              <div class="summary-icon"><i class="fas fa-tasks"></i></div>
              <div class="summary-content">
                <h3>Total Tareas</h3>
                <p id="winter-total-count">0 tareas</p>
              </div>
            </div>
          </div>
          
          <!-- Formulario para nueva tarea de invierno -->
          <div id="winter-task-form" class="form-container hidden">
            <h3 class="form-title" id="winter-form-title">Nueva Tarea de Invierno</h3>
            <div class="form-group">
              <label for="winter-task-title">Título</label>
              <input type="text" id="winter-task-title" class="form-control" placeholder="Título de la tarea">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="winter-task-hotel">Hotel</label>
                <select id="winter-task-hotel" class="form-control">
                  <option value="Wave">Wave</option>
                  <option value="Sky">Sky</option>
                  <option value="Palm">Palm</option>
                </select>
              </div>
              <div class="form-group">
                <label for="winter-task-area">Área</label>
                <select id="winter-task-area" class="form-control">
                  <option value="Recepción">Recepción</option>
                  <option value="Habitaciones">Habitaciones</option>
                  <option value="Restaurante">Restaurante</option>
                  <option value="Cocina">Cocina</option>
                  <option value="Exterior">Exterior</option>
                  <option value="Piscina">Piscina</option>
                  <option value="Baños">Baños</option>
                  <option value="Zonas Técnicas">Zonas Técnicas</option>
                  <option value="Gimnasio">Gimnasio</option>
                  <option value="Bar">Bar</option>
                  <option value="Zonas Comunes">Zonas Comunes</option>
                  <option value="Sótano">Sótano</option>
                  <option value="Otra">Otra</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="winter-task-priority">Prioridad</label>
                <select id="winter-task-priority" class="form-control">
                  <option value="Alta">Alta</option>
                  <option value="Media" selected>Media</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>
              <div class="form-group">
                <label for="winter-task-cost">Coste estimado (€)</label>
                <input type="number" id="winter-task-cost" class="form-control" placeholder="0" min="0" step="0.01">
              </div>
            </div>
            <div class="form-group">
              <label for="winter-task-description">Descripción</label>
              <textarea id="winter-task-description" class="form-control" placeholder="Describe la tarea..."></textarea>
            </div>
            <div class="form-actions">
              <button id="cancel-winter-btn" class="btn btn-secondary">Cancelar</button>
              <button id="save-winter-btn" class="btn btn-primary">Guardar Tarea</button>
            </div>
          </div>
          
          <!-- Lista de tareas de invierno -->
          <div id="winter-tasks-list" class="tasks-list">
            <!-- Las tareas se cargarán aquí dinámicamente -->
          </div>
        </div>
      `;
    }
    
    // Configurar eventos
    function setupEventListeners() {
      // Filtros
      if (filterHotel) {
        filterHotel.addEventListener('change', () => renderWinterTasks(AppState.get('winterTasks')));
      }
      
      if (filterArea) {
        filterArea.addEventListener('change', () => renderWinterTasks(AppState.get('winterTasks')));
      }
      
      if (filterPriority) {
        filterPriority.addEventListener('change', () => renderWinterTasks(AppState.get('winterTasks')));
      }
      
      if (searchInput) {
        searchInput.addEventListener('input', () => renderWinterTasks(AppState.get('winterTasks')));
      }
      
      // Botón nueva tarea
      const btnNewTask = document.getElementById('btn-new-winter-task');
      if (btnNewTask) {
        btnNewTask.addEventListener('click', () => {
          resetWinterForm();
          document.getElementById('winter-form-title').textContent = 'Nueva Tarea de Invierno';
          winterForm.classList.remove('hidden');
          document.getElementById('winter-task-title').focus();
        });
      }
      
      // Botón cancelar
      const cancelBtn = document.getElementById('cancel-winter-btn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          winterForm.classList.add('hidden');
        });
      }
      
      // Botón guardar
      const saveBtn = document.getElementById('save-winter-btn');
      if (saveBtn) {
        saveBtn.addEventListener('click', saveWinterTask);
      }
      
      // Botón limpiar filtros (si existe)
      const clearFiltersBtn = document.getElementById('clear-winter-filters');
      if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearWinterFilters);
      }
      
      // Añadir botón para exportar
      const actionBar = winterView.querySelector('.action-bar');
      if (actionBar) {
        const exportBtn = document.createElement('button');
        exportBtn.id = 'export-winter-excel';
        exportBtn.className = 'btn btn-success';
        exportBtn.innerHTML = '<i class="fas fa-file-excel"></i> Exportar';
        exportBtn.addEventListener('click', exportWinterTasksToExcel);
        
        // Añadir al DOM
        actionBar.appendChild(exportBtn);
      }
    }
    
    // Cargar datos mock si es necesario
    function loadMockWinterTasks() {
      if (AppState.get('winterTasks').length === 0) {
        const mockTasks = [
          {
            id: 1,
            title: "Renovación suelo piscina",
            description: "Cambiar baldosas antideslizantes del borde de la piscina",
            hotel: "Wave",
            area: "Piscina",
            priority: "Alta",
            cost: 2500,
            status: "pending",
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          },
          {
            id: 2,
            title: "Pintar habitaciones planta 3",
            description: "Repintar todas las habitaciones de la planta 3 que presentan desperfectos",
            hotel: "Sky",
            area: "Habitaciones",
            priority: "Media",
            cost: 1800,
            status: "pending",
            createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
          },
          {
            id: 3,
            title: "Renovar mobiliario del bar",
            description: "Sustituir taburetes y mesas del bar principal",
            hotel: "Palm",
            area: "Bar",
            priority: "Baja",
            cost: 3200,
            status: "pending",
            createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
          },
          {
            id: 4,
            title: "Mantenimiento aire acondicionado",
            description: "Revisión y limpieza de todos los sistemas de A/C del hotel",
            hotel: "Wave",
            area: "Zonas Técnicas",
            priority: "Alta",
            cost: 950,
            status: "pending",
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
          }
        ];
        
        AppState.data.winterTasks = mockTasks;
        AppState.saveToLocalStorage();
      }
    }
    
    // Limpiar filtros
    function clearWinterFilters() {
      if (filterHotel) filterHotel.value = '';
      if (filterArea) filterArea.value = '';
      if (filterPriority) filterPriority.value = '';
      if (searchInput) searchInput.value = '';
      
      renderWinterTasks(AppState.get('winterTasks'));
    }
    
    // Aplicar filtros a las tareas de invierno
    function applyWinterFilters(tasks) {
      const hotel = filterHotel ? filterHotel.value : '';
      const area = filterArea ? filterArea.value : '';
      const priority = filterPriority ? filterPriority.value : '';
      const search = searchInput ? searchInput.value.toLowerCase() : '';
      
      return tasks.filter(task => {
        const matchesHotel = !hotel || task.hotel === hotel;
        const matchesArea = !area || task.area === area;
        const matchesPriority = !priority || task.priority === priority;
        const matchesSearch = !search || 
                             task.title.toLowerCase().includes(search) ||
                             (task.description && task.description.toLowerCase().includes(search));
        
        return matchesHotel && matchesArea && matchesPriority && matchesSearch;
      });
    }
    
    // Renderizar tareas de invierno
    function renderWinterTasks(tasks) {
      if (!tasksList) return;
      
      // Aplicar filtros
      const filteredTasks = applyWinterFilters(tasks);
      
      // Actualizar contadores
      updateWinterCounts(tasks);
      
      // Limpiar lista
      tasksList.innerHTML = '';
      
      if (filteredTasks.length === 0) {
        tasksList.innerHTML = '<p class="text-center">No hay tareas de invierno que coincidan con los filtros</p>';
        return;
      }
      
      // Ordenar: prioridad Alta > Media > Baja
      const sortedTasks = [...filteredTasks].sort((a, b) => {
        const priorityOrder = { 'Alta': 0, 'Media': 1, 'Baja': 2 };
        
        // Primero por prioridad
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        
        // Luego por fecha (más reciente primero)
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      // Renderizar cada tarea
      sortedTasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = `task-item priority-${task.priority.toLowerCase()}`;
        taskCard.setAttribute('data-id', task.id);
        
        taskCard.innerHTML = `
          <div class="task-header">
            <h3 class="task-title">${Utils.sanitizeHTML(task.title)}</h3>
            <span class="task-tag tag-${task.priority.toLowerCase()}">${task.priority}</span>
          </div>
          <div class="task-meta">
            <div class="task-hotel"><i class="fas fa-hotel"></i> ${Utils.sanitizeHTML(task.hotel)}</div>
            <div class="task-area"><i class="fas fa-map-marker-alt"></i> ${Utils.sanitizeHTML(task.area)}</div>
            <div class="task-date"><i class="fas fa-calendar-alt"></i> ${Utils.formatDate(task.createdAt)}</div>
          </div>
          ${task.description ? `<div class="task-description">${Utils.sanitizeHTML(task.description)}</div>` : ''}
          <div class="task-cost"><i class="fas fa-euro-sign"></i> ${Utils.formatCurrency(task.cost)}</div>
          <div class="task-actions">
            <button class="btn-edit-winter" data-id="${task.id}"><i class="fas fa-edit"></i> Editar</button>
            <button class="btn-delete-winter" data-id="${task.id}"><i class="fas fa-trash"></i> Eliminar</button>
            <button class="btn-complete-winter" data-id="${task.id}"><i class="fas fa-check"></i> Completar</button>
          </div>
        `;
        
        tasksList.appendChild(taskCard);
      });
      
      // Configurar eventos para botones
      setupWinterTaskButtons();
    }
    
    // Configurar botones de las tareas
    function setupWinterTaskButtons() {
      // Botones de editar
      document.querySelectorAll('.btn-edit-winter').forEach(btn => {
        btn.addEventListener('click', () => {
          const taskId = parseInt(btn.getAttribute('data-id'));
          editWinterTask(taskId);
        });
      });
      
      // Botones de eliminar
      document.querySelectorAll('.btn-delete-winter').forEach(btn => {
        btn.addEventListener('click', () => {
          const taskId = parseInt(btn.getAttribute('data-id'));
          deleteWinterTask(taskId);
        });
      });
      
      // Botones de completar
      document.querySelectorAll('.btn-complete-winter').forEach(btn => {
        btn.addEventListener('click', () => {
          const taskId = parseInt(btn.getAttribute('data-id'));
          completeWinterTask(taskId);
        });
      });
    }
    
    // Actualizar contadores
    function updateWinterCounts(tasks) {
      const highCount = tasks.filter(task => task.priority === 'Alta').length;
      const mediumCount = tasks.filter(task => task.priority === 'Media').length;
      const lowCount = tasks.filter(task => task.priority === 'Baja').length;
      const totalCount = tasks.length;
      
      // Actualizar textos de contadores
      document.getElementById('winter-high-count').textContent = `${highCount} tarea${highCount !== 1 ? 's' : ''}`;
      document.getElementById('winter-medium-count').textContent = `${mediumCount} tarea${mediumCount !== 1 ? 's' : ''}`;
      document.getElementById('winter-low-count').textContent = `${lowCount} tarea${lowCount !== 1 ? 's' : ''}`;
      document.getElementById('winter-total-count').textContent = `${totalCount} tarea${totalCount !== 1 ? 's' : ''}`;
    }
    
    // Resetear formulario
    function resetWinterForm() {
      document.getElementById('winter-task-title').value = '';
      document.getElementById('winter-task-hotel').value = 'Wave';
      document.getElementById('winter-task-area').value = 'Recepción';
      document.getElementById('winter-task-priority').value = 'Media';
      document.getElementById('winter-task-cost').value = '';
      document.getElementById('winter-task-description').value = '';
      
      currentTaskId = null;
    }
    
    // Guardar tarea de invierno
    function saveWinterTask() {
      // Obtener valores del formulario
      const title = document.getElementById('winter-task-title').value.trim();
      const hotel = document.getElementById('winter-task-hotel').value;
      const area = document.getElementById('winter-task-area').value;
      const priority = document.getElementById('winter-task-priority').value;
      const costStr = document.getElementById('winter-task-cost').value;
      const description = document.getElementById('winter-task-description').value.trim();
      
      // Validar campos
      if (!title) {
        Utils.showToast('Por favor introduce un título para la tarea', 'error');
        document.getElementById('winter-task-title').focus();
        return;
      }
      
      // Convertir coste a número
      const cost = costStr ? parseFloat(costStr) : 0;
      
      // Preparar datos
      const taskData = {
        title,
        hotel,
        area,
        priority,
        cost,
        description,
        status: 'pending',
        updatedAt: new Date()
      };
      
      // Obtener lista de tareas
      const winterTasks = [...AppState.get('winterTasks')];
      
      if (currentTaskId) {
        // Actualizar existente
        const index = winterTasks.findIndex(task => task.id === currentTaskId);
        
        if (index !== -1) {
          winterTasks[index] = {
            ...winterTasks[index],
            ...taskData
          };
          
          AppState.update('winterTasks', winterTasks);
          Utils.showToast('Tarea de invierno actualizada correctamente', 'success');
        }
      } else {
        // Crear nueva
        const maxId = winterTasks.reduce((max, task) => Math.max(max, task.id || 0), 0);
        
        const newTask = {
          ...taskData,
          id: maxId + 1,
          createdAt: new Date(),
          createdBy: currentUser ? currentUser.uid : 'sistema',
          createdByEmail: currentUser ? currentUser.email : 'sistema@prestotel.com'
        };
        
        winterTasks.push(newTask);
        AppState.update('winterTasks', winterTasks);
        Utils.showToast('Tarea de invierno creada correctamente', 'success');
      }
      
      // Cerrar formulario
      winterForm.classList.add('hidden');
      resetWinterForm();
    }
    
    // Editar tarea de invierno
    function editWinterTask(taskId) {
      const winterTasks = AppState.get('winterTasks');
      const task = winterTasks.find(t => t.id === taskId);
      
      if (!task) {
        Utils.showToast('Tarea no encontrada', 'error');
        return;
      }
      
      // Llenar formulario
      document.getElementById('winter-task-title').value = task.title;
      document.getElementById('winter-task-hotel').value = task.hotel;
      document.getElementById('winter-task-area').value = task.area;
      document.getElementById('winter-task-priority').value = task.priority;
      document.getElementById('winter-task-cost').value = task.cost;
      document.getElementById('winter-task-description').value = task.description || '';
      
      // Actualizar título del formulario
      document.getElementById('winter-form-title').textContent = 'Editar Tarea de Invierno';
      
      // Guardar ID de la tarea
      currentTaskId = taskId;
      
      // Mostrar formulario
      winterForm.classList.remove('hidden');
      document.getElementById('winter-task-title').focus();
      
      // Scroll al formulario
      winterForm.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Eliminar tarea de invierno
    function deleteWinterTask(taskId) {
      Utils.confirmAction(
        '¿Estás seguro de que deseas eliminar esta tarea de invierno?',
        () => {
          const winterTasks = AppState.get('winterTasks');
          const newTasks = winterTasks.filter(task => task.id !== taskId);
          
          AppState.update('winterTasks', newTasks);
          Utils.showToast('Tarea eliminada correctamente', 'success');
        }
      );
    }
    
    // Completar tarea de invierno
    function completeWinterTask(taskId) {
      const winterTasks = [...AppState.get('winterTasks')];
      const index = winterTasks.findIndex(task => task.id === taskId);
      
      if (index === -1) {
        Utils.showToast('Tarea no encontrada', 'error');
        return;
      }
      
      // Actualizar estado
      winterTasks[index].status = 'completed';
      winterTasks[index].updatedAt = new Date();
      
      // Guardar
      AppState.update('winterTasks', winterTasks);
      Utils.showToast('Tarea marcada como completada', 'success');
    }
    
    // Exportar a Excel
    function exportWinterTasksToExcel() {
      const winterTasks = AppState.get('winterTasks');
      
      if (winterTasks.length === 0) {
        Utils.showToast('No hay tareas para exportar', 'warning');
        return;
      }
      
      // Preparar datos para Excel
      const data = winterTasks.map(task => ({
        'Título': task.title,
        'Hotel': task.hotel,
        'Área': task.area,
        'Prioridad': task.priority,
        'Coste': task.cost,
        'Estado': task.status === 'completed' ? 'Completada' : 'Pendiente',
        'Descripción': task.description || '',
        'Creada': Utils.formatDate(task.createdAt)
      }));
      
      // Exportar
      Utils.exportToExcel(data, 'Tareas_Invierno.xlsx', 'Tareas de Invierno');
    }
    
    // Inicializar módulo
    initWinterModule();
  });