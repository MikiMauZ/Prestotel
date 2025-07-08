// Módulo de tareas de invierno (mejoras y previsiones)
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en la página de invierno
    const winterView = document.getElementById('winter-view');
    if (!winterView) return;
    
    console.log('Inicializando módulo de tareas de invierno...');
    
    // Referencias a elementos DOM
    let tasksList;
    let filterHotel;
    let filterArea;
    let filterPriority;
    let searchInput;
    let winterForm;
    let btnNewWinterTask;
    let saveWinterTaskBtn;
    let cancelWinterTaskBtn;
    
    // Variables de estado
    let currentTaskId = null;
    let currentUser = null; // Se puede obtener del sistema de auth
    
    // Inicializar módulo
    function initWinterModule() {
        console.log('Renderizando estructura del módulo de invierno...');
        
        // Renderizar la estructura base del módulo
        renderModuleStructure();
        
        // Obtener referencias a elementos DOM
        tasksList = document.getElementById('winter-tasks-list');
        filterHotel = document.getElementById('filter-winter-hotel');
        filterArea = document.getElementById('filter-winter-area');
        filterPriority = document.getElementById('filter-winter-priority');
        searchInput = document.getElementById('search-winter-task');
        winterForm = document.getElementById('winter-task-form');
        btnNewWinterTask = document.getElementById('btn-new-winter-task');
        saveWinterTaskBtn = document.getElementById('save-winter-task-btn');
        cancelWinterTaskBtn = document.getElementById('cancel-winter-task-btn');
        
        // Verificar si hay datos de tareas de invierno en AppState
        if (AppState.get('winterTasks') === undefined) {
            AppState.data.winterTasks = [];
            AppState.saveToLocalStorage();
        }
        
        // Suscribirse a cambios en las tareas de invierno
        AppState.subscribe('winterTasks', renderWinterTasks);
        
        // Configurar eventos
        setupEventListeners();
        
        // Cargar datos iniciales si es necesario
        if (AppState.get('winterTasks').length === 0) {
            loadMockWinterTasks();
        }
        
        // Renderizar tareas
        renderWinterTasks(AppState.get('winterTasks'));
    }
    
    // Renderizar la estructura base del módulo
    function renderModuleStructure() {
        winterView.innerHTML = `
            <h2 class="section-title"><i class="fas fa-snowflake"></i> Mejoras de Invierno</h2>
            
            <div class="action-bar">
                <button id="btn-new-winter-task" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Nueva Tarea
                </button>
                <div class="filters">
                    <select id="filter-winter-hotel" class="form-control">
                        <option value="">Todos los hoteles</option>
                        <option value="Wave">Wave</option>
                        <option value="Sky">Sky</option>
                        <option value="Beach">Beach</option>
                    </select>
                    <select id="filter-winter-area" class="form-control">
                        <option value="">Todas las áreas</option>
                        <option value="Recepción">Recepción</option>
                        <option value="Habitaciones">Habitaciones</option>
                        <option value="Piscina">Piscina</option>
                        <option value="Mantenimiento">Mantenimiento</option>
                        <option value="Cocina">Cocina</option>
                        <option value="Limpieza">Limpieza</option>
                        <option value="Jardines">Jardines</option>
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

            <!-- Dashboard de resumen -->
            <div class="winter-dashboard">
                <div class="winter-summary">
                    <div class="summary-card priority-alta">
                        <div class="card-icon"><i class="fas fa-exclamation-triangle"></i></div>
                        <div class="card-content">
                            <h3>Prioridad Alta</h3>
                            <p id="winter-high-count">0 tareas</p>
                        </div>
                    </div>
                    <div class="summary-card priority-media">
                        <div class="card-icon"><i class="fas fa-clock"></i></div>
                        <div class="card-content">
                            <h3>Prioridad Media</h3>
                            <p id="winter-medium-count">0 tareas</p>
                        </div>
                    </div>
                    <div class="summary-card priority-baja">
                        <div class="card-icon"><i class="fas fa-check-circle"></i></div>
                        <div class="card-content">
                            <h3>Prioridad Baja</h3>
                            <p id="winter-low-count">0 tareas</p>
                        </div>
                    </div>
                    <div class="summary-card">
                        <div class="card-icon"><i class="fas fa-snowflake"></i></div>
                        <div class="card-content">
                            <h3>Total Tareas</h3>
                            <p id="winter-total-count">0 tareas</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Formulario para crear/editar tarea -->
            <div id="winter-task-form" class="form-container hidden">
                <h3 class="form-title">Nueva Tarea de Invierno</h3>
                <div class="form-group">
                    <label for="winter-task-title">Título *</label>
                    <input type="text" id="winter-task-title" class="form-control" placeholder="Título de la tarea" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="winter-task-hotel">Hotel *</label>
                        <select id="winter-task-hotel" class="form-control" required>
                            <option value="Wave">Wave</option>
                            <option value="Sky">Sky</option>
                            <option value="Beach">Beach</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="winter-task-area">Área *</label>
                        <select id="winter-task-area" class="form-control" required>
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
                        <label for="winter-task-priority">Prioridad</label>
                        <select id="winter-task-priority" class="form-control">
                            <option value="Baja">Baja</option>
                            <option value="Media" selected>Media</option>
                            <option value="Alta">Alta</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="winter-task-cost">Coste estimado (€)</label>
                        <input type="number" id="winter-task-cost" class="form-control" placeholder="0.00" step="0.01" min="0">
                    </div>
                    <div class="form-group">
                        <label for="winter-task-deadline">Fecha límite</label>
                        <input type="date" id="winter-task-deadline" class="form-control">
                    </div>
                </div>
                <div class="form-group">
                    <label for="winter-task-description">Descripción</label>
                    <textarea id="winter-task-description" class="form-control" rows="4" placeholder="Describe la tarea de mejora..."></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" id="save-winter-task-btn" class="btn btn-primary">
                        <i class="fas fa-save"></i> Guardar
                    </button>
                    <button type="button" id="cancel-winter-task-btn" class="btn btn-secondary">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                </div>
            </div>

            <!-- Lista de tareas -->
            <div class="tasks-container">
                <div class="tasks-header">
                    <h3>Tareas de Invierno</h3>
                    <button id="export-winter-tasks" class="btn btn-outline">
                        <i class="fas fa-download"></i> Exportar
                    </button>
                </div>
                <div id="winter-tasks-list" class="tasks-grid">
                    <!-- Las tareas se cargarán dinámicamente -->
                </div>
            </div>
        `;
    }
    
    // Configurar eventos
    function setupEventListeners() {
        console.log('Configurando eventos del módulo de invierno...');
        
        // Botón nueva tarea
        if (btnNewWinterTask) {
            btnNewWinterTask.addEventListener('click', () => {
                showWinterTaskForm();
            });
        }
        
        // Botón guardar tarea
        if (saveWinterTaskBtn) {
            saveWinterTaskBtn.addEventListener('click', () => {
                saveWinterTask();
            });
        }
        
        // Botón cancelar
        if (cancelWinterTaskBtn) {
            cancelWinterTaskBtn.addEventListener('click', () => {
                hideWinterTaskForm();
            });
        }
        
        // Filtros
        if (filterHotel) {
            filterHotel.addEventListener('change', applyWinterFilters);
        }
        if (filterArea) {
            filterArea.addEventListener('change', applyWinterFilters);
        }
        if (filterPriority) {
            filterPriority.addEventListener('change', applyWinterFilters);
        }
        
        // Búsqueda
        if (searchInput) {
            searchInput.addEventListener('input', applyWinterFilters);
        }
        
        // Exportar
        const exportBtn = document.getElementById('export-winter-tasks');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportWinterTasksToExcel);
        }
    }
    
    // Cargar datos mock
    function loadMockWinterTasks() {
        const mockWinterTasks = [
            {
                id: 1,
                title: "Renovación sistema de calefacción",
                hotel: "Wave",
                area: "Mantenimiento",
                priority: "Alta",
                cost: 15000,
                description: "Sustituir sistema de calefacción obsoleto por uno más eficiente",
                status: "pending",
                deadline: new Date(2025, 2, 15), // Marzo 2025
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: "admin",
                createdByEmail: "admin@prestotel.com"
            },
            {
                id: 2,
                title: "Pintura fachada exterior",
                hotel: "Sky",
                area: "Mantenimiento",
                priority: "Media",
                cost: 8500,
                description: "Repintar fachada exterior para mejorar imagen del hotel",
                status: "pending",
                deadline: new Date(2025, 1, 28), // Febrero 2025
                createdAt: new Date(Date.now() - 86400000),
                updatedAt: new Date(Date.now() - 86400000),
                createdBy: "admin",
                createdByEmail: "admin@prestotel.com"
            },
            {
                id: 3,
                title: "Renovación mobiliario lobby",
                hotel: "Wave",
                area: "Recepción",
                priority: "Media",
                cost: 12000,
                description: "Renovar mobiliario del lobby para temporada alta",
                status: "pending",
                deadline: new Date(2025, 2, 1), // Marzo 2025
                createdAt: new Date(Date.now() - 172800000),
                updatedAt: new Date(Date.now() - 172800000),
                createdBy: "admin",
                createdByEmail: "admin@prestotel.com"
            },
            {
                id: 4,
                title: "Instalación sistema de riego automático",
                hotel: "Beach",
                area: "Jardines",
                priority: "Baja",
                cost: 4500,
                description: "Instalar sistema de riego automático en jardines",
                status: "pending",
                deadline: new Date(2025, 3, 15), // Abril 2025
                createdAt: new Date(Date.now() - 259200000),
                updatedAt: new Date(Date.now() - 259200000),
                createdBy: "admin",
                createdByEmail: "admin@prestotel.com"
            },
            {
                id: 5,
                title: "Reforma cocina principal",
                hotel: "Sky",
                area: "Cocina",
                priority: "Alta",
                cost: 25000,
                description: "Reforma completa de la cocina principal incluyendo equipos",
                status: "completed",
                deadline: new Date(2025, 0, 30), // Enero 2025
                createdAt: new Date(Date.now() - 345600000),
                updatedAt: new Date(Date.now() - 86400000),
                createdBy: "admin",
                createdByEmail: "admin@prestotel.com"
            }
        ];
        
        AppState.update('winterTasks', mockWinterTasks);
        console.log('Datos mock de tareas de invierno cargados.');
    }
    
    // Renderizar tareas de invierno
    function renderWinterTasks(tasks) {
        console.log('Renderizando tareas de invierno:', tasks);
        
        if (!tasksList) return;
        
        // Limpiar lista
        tasksList.innerHTML = '';
        
        // Aplicar filtros
        const filteredTasks = getFilteredWinterTasks(tasks);
        
        // Actualizar contadores
        updateWinterCounts(filteredTasks);
        
        if (filteredTasks.length === 0) {
            tasksList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-snowflake"></i>
                    <h3>No hay tareas de invierno</h3>
                    <p>Añade tu primera tarea de mejora para la temporada de invierno.</p>
                    <button class="btn btn-primary" onclick="document.getElementById('btn-new-winter-task').click()">
                        <i class="fas fa-plus"></i> Nueva Tarea
                    </button>
                </div>
            `;
            return;
        }
        
        // Renderizar cada tarea
        filteredTasks.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.className = `task-item winter-task priority-${task.priority.toLowerCase()} ${task.status === 'completed' ? 'completed' : ''}`;
            
            const deadlineText = task.deadline ? 
                `<div class="task-deadline"><i class="fas fa-calendar"></i> ${Utils.formatDate(task.deadline)}</div>` : '';
            
            taskCard.innerHTML = `
                <div class="task-header">
                    <div class="task-title">${Utils.sanitizeHTML(task.title)}</div>
                    <div class="task-priority">
                        <span class="tag tag-${task.priority.toLowerCase()}">${task.priority}</span>
                    </div>
                </div>
                <div class="task-meta">
                    <div class="task-hotel"><i class="fas fa-building"></i> ${task.hotel}</div>
                    <div class="task-area"><i class="fas fa-map-marker-alt"></i> ${task.area}</div>
                    <div class="task-status">
                        <span class="status-badge status-${task.status}">
                            ${task.status === 'completed' ? 'Completada' : 'Pendiente'}
                        </span>
                    </div>
                </div>
                ${deadlineText}
                ${task.description ? 
                    `<div class="task-description">${Utils.sanitizeHTML(task.description)}</div>` : ''}
                <div class="task-cost">
                    <i class="fas fa-euro-sign"></i> ${Utils.formatCurrency(task.cost)}
                </div>
                <div class="task-footer">
                    <div class="task-dates">
                        <small>Creada: ${Utils.formatDate(task.createdAt)}</small>
                    </div>
                    <div class="task-actions">
                        <button class="btn-edit-winter" data-id="${task.id}" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete-winter" data-id="${task.id}" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                        ${task.status !== 'completed' ? 
                            `<button class="btn-complete-winter" data-id="${task.id}" title="Completar">
                                <i class="fas fa-check"></i>
                            </button>` : 
                            `<button class="btn-reopen-winter" data-id="${task.id}" title="Reabrir">
                                <i class="fas fa-undo"></i>
                            </button>`
                        }
                    </div>
                </div>
            `;
            
            tasksList.appendChild(taskCard);
        });
        
        // Configurar eventos para botones
        setupWinterTaskButtons();
    }
    
    // Obtener tareas filtradas
    function getFilteredWinterTasks(tasks) {
        if (!tasks) return [];
        
        let filtered = [...tasks];
        
        // Filtro por hotel
        const hotelFilter = filterHotel ? filterHotel.value : '';
        if (hotelFilter) {
            filtered = filtered.filter(task => task.hotel === hotelFilter);
        }
        
        // Filtro por área
        const areaFilter = filterArea ? filterArea.value : '';
        if (areaFilter) {
            filtered = filtered.filter(task => task.area === areaFilter);
        }
        
        // Filtro por prioridad
        const priorityFilter = filterPriority ? filterPriority.value : '';
        if (priorityFilter) {
            filtered = filtered.filter(task => task.priority === priorityFilter);
        }
        
        // Filtro por búsqueda
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        if (searchTerm) {
            filtered = filtered.filter(task => 
                task.title.toLowerCase().includes(searchTerm) ||
                task.description.toLowerCase().includes(searchTerm) ||
                task.area.toLowerCase().includes(searchTerm)
            );
        }
        
        return filtered;
    }
    
    // Aplicar filtros
    function applyWinterFilters() {
        const winterTasks = AppState.get('winterTasks');
        renderWinterTasks(winterTasks);
    }
    
    // Configurar botones de las tareas
    function setupWinterTaskButtons() {
        // Botones de editar
        document.querySelectorAll('.btn-edit-winter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = parseInt(btn.getAttribute('data-id'));
                editWinterTask(taskId);
            });
        });
        
        // Botones de eliminar
        document.querySelectorAll('.btn-delete-winter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = parseInt(btn.getAttribute('data-id'));
                deleteWinterTask(taskId);
            });
        });
        
        // Botones de completar
        document.querySelectorAll('.btn-complete-winter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = parseInt(btn.getAttribute('data-id'));
                completeWinterTask(taskId);
            });
        });
        
        // Botones de reabrir
        document.querySelectorAll('.btn-reopen-winter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = parseInt(btn.getAttribute('data-id'));
                reopenWinterTask(taskId);
            });
        });
    }
    
    // Mostrar formulario
    function showWinterTaskForm(taskData = null) {
        if (!winterForm) return;
        
        // Actualizar título del formulario
        const formTitle = winterForm.querySelector('.form-title');
        if (formTitle) {
            formTitle.textContent = taskData ? 'Editar Tarea de Invierno' : 'Nueva Tarea de Invierno';
        }
        
        // Rellenar formulario si hay datos
        if (taskData) {
            currentTaskId = taskData.id;
            document.getElementById('winter-task-title').value = taskData.title || '';
            document.getElementById('winter-task-hotel').value = taskData.hotel || 'Wave';
            document.getElementById('winter-task-area').value = taskData.area || 'Recepción';
            document.getElementById('winter-task-priority').value = taskData.priority || 'Media';
            document.getElementById('winter-task-cost').value = taskData.cost || '';
            document.getElementById('winter-task-description').value = taskData.description || '';
            
            // Fecha límite
            const deadlineInput = document.getElementById('winter-task-deadline');
            if (deadlineInput && taskData.deadline) {
                const deadline = new Date(taskData.deadline);
                deadlineInput.value = deadline.toISOString().split('T')[0];
            }
        } else {
            resetWinterForm();
        }
        
        // Mostrar formulario
        winterForm.classList.remove('hidden');
        winterForm.scrollIntoView({ behavior: 'smooth' });
        
        // Focus en el primer campo
        const titleInput = document.getElementById('winter-task-title');
        if (titleInput) {
            titleInput.focus();
        }
    }
    
    // Ocultar formulario
    function hideWinterTaskForm() {
        if (!winterForm) return;
        
        winterForm.classList.add('hidden');
        resetWinterForm();
    }
    
    // Resetear formulario
    function resetWinterForm() {
        document.getElementById('winter-task-title').value = '';
        document.getElementById('winter-task-hotel').value = 'Wave';
        document.getElementById('winter-task-area').value = 'Recepción';
        document.getElementById('winter-task-priority').value = 'Media';
        document.getElementById('winter-task-cost').value = '';
        document.getElementById('winter-task-description').value = '';
        document.getElementById('winter-task-deadline').value = '';
        
        currentTaskId = null;
    }
    
    // Guardar tarea de invierno
    function saveWinterTask() {
        try {
            // Obtener valores del formulario
            const title = document.getElementById('winter-task-title').value.trim();
            const hotel = document.getElementById('winter-task-hotel').value;
            const area = document.getElementById('winter-task-area').value;
            const priority = document.getElementById('winter-task-priority').value;
            const costStr = document.getElementById('winter-task-cost').value;
            const description = document.getElementById('winter-task-description').value.trim();
            const deadlineStr = document.getElementById('winter-task-deadline').value;
            
            // Validar campos obligatorios
            if (!title) {
                Utils.showToast('Por favor introduce un título para la tarea', 'error');
                document.getElementById('winter-task-title').focus();
                return;
            }
            
            if (!hotel) {
                Utils.showToast('Por favor selecciona un hotel', 'error');
                document.getElementById('winter-task-hotel').focus();
                return;
            }
            
            if (!area) {
                Utils.showToast('Por favor selecciona un área', 'error');
                document.getElementById('winter-task-area').focus();
                return;
            }
            
            // Convertir valores
            const cost = costStr ? parseFloat(costStr) : 0;
            const deadline = deadlineStr ? new Date(deadlineStr) : null;
            
            // Validar coste
            if (cost < 0) {
                Utils.showToast('El coste no puede ser negativo', 'error');
                document.getElementById('winter-task-cost').focus();
                return;
            }
            
            // Preparar datos
            const taskData = {
                title,
                hotel,
                area,
                priority,
                cost,
                description,
                deadline,
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
                } else {
                    Utils.showToast('Error: Tarea no encontrada', 'error');
                    return;
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
            
            // Ocultar formulario
            hideWinterTaskForm();
            
        } catch (error) {
            console.error('Error al guardar tarea de invierno:', error);
            Utils.showToast('Error al guardar la tarea. Inténtalo de nuevo.', 'error');
        }
    }
    
    // Editar tarea de invierno
    function editWinterTask(taskId) {
        const winterTasks = AppState.get('winterTasks');
        const task = winterTasks.find(t => t.id === taskId);
        
        if (!task) {
            Utils.showToast('Tarea no encontrada', 'error');
            return;
        }
        
        showWinterTaskForm(task);
    }
    
    // Eliminar tarea de invierno
    function deleteWinterTask(taskId) {
        const winterTasks = AppState.get('winterTasks');
        const task = winterTasks.find(t => t.id === taskId);
        
        if (!task) {
            Utils.showToast('Tarea no encontrada', 'error');
            return;
        }
        
        Utils.confirmAction(
            `¿Estás seguro de que quieres eliminar la tarea "${task.title}"?\nEsta acción no se puede deshacer.`,
            () => {
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
        
        Utils.confirmAction(
            `¿Marcar la tarea "${winterTasks[index].title}" como completada?`,
            () => {
                // Actualizar estado
                winterTasks[index].status = 'completed';
                winterTasks[index].updatedAt = new Date();
                winterTasks[index].completedAt = new Date();
                winterTasks[index].completedBy = currentUser ? currentUser.uid : 'sistema';
                
                // Guardar
                AppState.update('winterTasks', winterTasks);
                Utils.showToast('Tarea marcada como completada', 'success');
            }
        );
    }
    
    // Reabrir tarea de invierno
    function reopenWinterTask(taskId) {
        const winterTasks = [...AppState.get('winterTasks')];
        const index = winterTasks.findIndex(task => task.id === taskId);
        
        if (index === -1) {
            Utils.showToast('Tarea no encontrada', 'error');
            return;
        }
        
        Utils.confirmAction(
            `¿Reabrir la tarea "${winterTasks[index].title}"?`,
            () => {
                // Actualizar estado
                winterTasks[index].status = 'pending';
                winterTasks[index].updatedAt = new Date();
                delete winterTasks[index].completedAt;
                delete winterTasks[index].completedBy;
                
                // Guardar
                AppState.update('winterTasks', winterTasks);
               Utils.showToast('Tarea reabierta correctamente', 'success');
           }
       );
   }
   
   // Actualizar contadores
   function updateWinterCounts(tasks) {
       const highCount = tasks.filter(task => task.priority === 'Alta' && task.status !== 'completed').length;
       const mediumCount = tasks.filter(task => task.priority === 'Media' && task.status !== 'completed').length;
       const lowCount = tasks.filter(task => task.priority === 'Baja' && task.status !== 'completed').length;
       const totalCount = tasks.length;
       const completedCount = tasks.filter(task => task.status === 'completed').length;
       const pendingCount = totalCount - completedCount;
       
       // Actualizar textos de contadores
       const highCountEl = document.getElementById('winter-high-count');
       const mediumCountEl = document.getElementById('winter-medium-count');
       const lowCountEl = document.getElementById('winter-low-count');
       const totalCountEl = document.getElementById('winter-total-count');
       
       if (highCountEl) {
           highCountEl.textContent = `${highCount} tarea${highCount !== 1 ? 's' : ''}`;
       }
       if (mediumCountEl) {
           mediumCountEl.textContent = `${mediumCount} tarea${mediumCount !== 1 ? 's' : ''}`;
       }
       if (lowCountEl) {
           lowCountEl.textContent = `${lowCount} tarea${lowCount !== 1 ? 's' : ''}`;
       }
       if (totalCountEl) {
           totalCountEl.textContent = `${pendingCount} pendiente${pendingCount !== 1 ? 's' : ''} / ${totalCount} total`;
       }
   }
   
   // Exportar a Excel
   function exportWinterTasksToExcel() {
       const winterTasks = AppState.get('winterTasks');
       
       if (winterTasks.length === 0) {
           Utils.showToast('No hay tareas para exportar', 'warning');
           return;
       }
       
       try {
           // Preparar datos para Excel
           const data = winterTasks.map(task => ({
               'ID': task.id,
               'Título': task.title,
               'Hotel': task.hotel,
               'Área': task.area,
               'Prioridad': task.priority,
               'Estado': task.status === 'completed' ? 'Completada' : 'Pendiente',
               'Coste (€)': task.cost || 0,
               'Fecha Límite': task.deadline ? Utils.formatDate(task.deadline) : 'Sin fecha',
               'Descripción': task.description || '',
               'Creada': Utils.formatDate(task.createdAt),
               'Actualizada': Utils.formatDate(task.updatedAt),
               'Creada por': task.createdByEmail || 'N/A'
           }));
           
           // Verificar si existe la función de exportar en Utils
           if (typeof Utils.exportToExcel === 'function') {
               Utils.exportToExcel(data, 'Tareas_Invierno.xlsx', 'Tareas de Invierno');
           } else {
               // Implementación básica de exportación si no existe en Utils
               exportToCSV(data, 'Tareas_Invierno.csv');
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
   
   // Función para obtener estadísticas
   function getWinterTasksStats() {
       const winterTasks = AppState.get('winterTasks');
       
       if (!winterTasks || winterTasks.length === 0) {
           return {
               total: 0,
               pending: 0,
               completed: 0,
               totalCost: 0,
               averageCost: 0,
               byPriority: { Alta: 0, Media: 0, Baja: 0 },
               byHotel: {},
               byArea: {}
           };
       }
       
       const stats = {
           total: winterTasks.length,
           pending: winterTasks.filter(t => t.status !== 'completed').length,
           completed: winterTasks.filter(t => t.status === 'completed').length,
           totalCost: winterTasks.reduce((sum, t) => sum + (t.cost || 0), 0),
           byPriority: { Alta: 0, Media: 0, Baja: 0 },
           byHotel: {},
           byArea: {}
       };
       
       stats.averageCost = stats.total > 0 ? stats.totalCost / stats.total : 0;
       
       // Estadísticas por prioridad
       winterTasks.forEach(task => {
           if (task.priority && stats.byPriority.hasOwnProperty(task.priority)) {
               stats.byPriority[task.priority]++;
           }
           
           // Por hotel
           if (task.hotel) {
               stats.byHotel[task.hotel] = (stats.byHotel[task.hotel] || 0) + 1;
           }
           
           // Por área
           if (task.area) {
               stats.byArea[task.area] = (stats.byArea[task.area] || 0) + 1;
           }
       });
       
       return stats;
   }
   
   // Función para limpiar filtros
   function clearWinterFilters() {
       if (filterHotel) filterHotel.value = '';
       if (filterArea) filterArea.value = '';
       if (filterPriority) filterPriority.value = '';
       if (searchInput) searchInput.value = '';
       
       applyWinterFilters();
       Utils.showToast('Filtros limpiados', 'info');
   }
   
   // Función para validar fechas
   function validateDeadline(deadline) {
       if (!deadline) return true; // Fecha opcional
       
       const deadlineDate = new Date(deadline);
       const today = new Date();
       today.setHours(0, 0, 0, 0); // Eliminar tiempo para comparar solo fechas
       
       if (deadlineDate < today) {
           return 'La fecha límite no puede ser anterior a hoy';
       }
       
       // Verificar que no sea más de 2 años en el futuro
       const maxDate = new Date();
       maxDate.setFullYear(maxDate.getFullYear() + 2);
       
       if (deadlineDate > maxDate) {
           return 'La fecha límite no puede ser más de 2 años en el futuro';
       }
       
       return true;
   }
   
   // Función para buscar tareas por texto
   function searchWinterTasks(searchTerm) {
       if (!searchTerm || typeof searchTerm !== 'string') {
           return AppState.get('winterTasks');
       }
       
       const term = searchTerm.toLowerCase().trim();
       const winterTasks = AppState.get('winterTasks');
       
       return winterTasks.filter(task => 
           task.title.toLowerCase().includes(term) ||
           task.description.toLowerCase().includes(term) ||
           task.area.toLowerCase().includes(term) ||
           task.hotel.toLowerCase().includes(term) ||
           task.priority.toLowerCase().includes(term)
       );
   }
   
   // Función para ordenar tareas
   function sortWinterTasks(tasks, sortBy = 'createdAt', order = 'desc') {
       if (!tasks || !Array.isArray(tasks)) return [];
       
       return [...tasks].sort((a, b) => {
           let valueA = a[sortBy];
           let valueB = b[sortBy];
           
           // Manejar fechas
           if (sortBy.includes('At') || sortBy === 'deadline') {
               valueA = valueA ? new Date(valueA) : new Date(0);
               valueB = valueB ? new Date(valueB) : new Date(0);
           }
           
           // Manejar números
           if (sortBy === 'cost') {
               valueA = valueA || 0;
               valueB = valueB || 0;
           }
           
           // Manejar strings
           if (typeof valueA === 'string') {
               valueA = valueA.toLowerCase();
               valueB = valueB.toLowerCase();
           }
           
           let result = 0;
           if (valueA < valueB) result = -1;
           if (valueA > valueB) result = 1;
           
           return order === 'desc' ? result * -1 : result;
       });
   }
   
   // Función de inicialización llamada automáticamente
   initWinterModule();
   
   // Exponer funciones públicas si es necesario
   window.WinterModule = {
       clearFilters: clearWinterFilters,
       exportTasks: exportWinterTasksToExcel,
       getStats: getWinterTasksStats,
       searchTasks: searchWinterTasks,
       sortTasks: sortWinterTasks
   };
   
   console.log('Módulo de tareas de invierno inicializado correctamente.');
});