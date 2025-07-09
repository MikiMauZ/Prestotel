// Módulo de gestión de empleados
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en la página de empleados
    const employeesView = document.getElementById('employees-view');
    if (!employeesView) return;
    
    // Variables globales
    let currentEmployeeId = null;
    
    // Inicializar módulo
    function initEmployeesModule() {
      console.log('Inicializando módulo de empleados...');
      
      // Renderizar estructura base
      renderModuleStructure();
      
      // Inicializar datos
      loadMockEmployeesData();
      
      // Configurar eventos
      setupEventListeners();
      
      // Suscribirse a cambios en empleados
      AppState.subscribe('employees', renderEmployees);
      
      // Actualizamos los filtros con los valores de nuestros empleados
      updateFilterOptions();
      
      // Renderizar empleados sin filtros
      renderEmployees(AppState.get('employees'));
      
      // Revisar filtros al cargar
      ensureNoFiltersActive();
      
      console.log('Módulo de empleados inicializado.');
    }
    
    // Asegurarse de que no hay filtros activos inicialmente
    function ensureNoFiltersActive() {
      const departmentFilter = document.getElementById('filter-department');
      const hotelFilter = document.getElementById('filter-hotel');
      const statusFilter = document.getElementById('filter-status');
      const searchFilter = document.getElementById('search-employee');
      
      if (departmentFilter) departmentFilter.value = '';
      if (hotelFilter) hotelFilter.value = '';
      if (statusFilter) statusFilter.value = '';
      if (searchFilter) searchFilter.value = '';
      
      // Refrescar la vista
      renderEmployees(AppState.get('employees'));
    }
    
    // Cargar datos mock si no existen
    function loadMockEmployeesData() {
      if (AppState.get('employees').length === 0) {
        console.log('Cargando datos de ejemplo para empleados...');
        
        const mockEmployees = [];
        
        // Guardar en AppState
        AppState.data.employees = mockEmployees;
        AppState.saveToLocalStorage();
        console.log(`Cargados ${mockEmployees.length} empleados de ejemplo`);
      } else {
        console.log(`Ya existen ${AppState.get('employees').length} empleados en AppState`);
      }
    }
    
    // Actualizar las opciones de filtro basadas en los datos
    function updateFilterOptions() {
      console.log('Actualizando opciones de filtro...');
      
      // Obtener todos los empleados
      const employees = AppState.get('employees');
      
      // Extraer valores únicos para los filtros
      const departments = [...new Set(employees.map(emp => emp.department))];
      const hotels = [...new Set(employees.map(emp => emp.hotel))];
      const statuses = [...new Set(employees.map(emp => emp.status))];
      
      console.log(`Departamentos encontrados: ${departments.join(', ')}`);
      console.log(`Hoteles encontrados: ${hotels.join(', ')}`);
      console.log(`Estados encontrados: ${statuses.join(', ')}`);
      
      // Actualizar el select de departamentos
      updateSelectOptions('filter-department', departments, {
        'mantenimiento': 'Mantenimiento',
        'limpieza': 'Limpieza',
        'recepcion': 'Recepción',
        'cocina': 'Cocina',
        'administracion': 'Administración'
      }, 'Todos los departamentos');
      
      // Actualizar el select de hoteles
      updateSelectOptions('filter-hotel', hotels, {}, 'Todos los hoteles');
      
      // Actualizar el select de estados
      updateSelectOptions('filter-status', statuses, {
        'active': 'Activos',
        'inactive': 'Inactivos'
      }, 'Todos los estados');
    }
    
    // Función auxiliar para actualizar las opciones de un select
    function updateSelectOptions(selectId, values, translations, defaultText) {
      const select = document.getElementById(selectId);
      if (!select) return;
      
      // Guardar valor actual
      const currentValue = select.value;
      
      // Limpiar opciones
      select.innerHTML = `<option value="">${defaultText}</option>`;
      
      // Añadir nuevas opciones
      values.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = translations[value] || value;
        select.appendChild(option);
      });
      
      // Restaurar valor si existía y sigue siendo válido
      if (currentValue && values.includes(currentValue)) {
        select.value = currentValue;
      }
    }
    
    // Renderizar estructura base del módulo
    function renderModuleStructure() {
      employeesView.innerHTML = `
        <h2 class="section-title"><i class="fas fa-users"></i> Gestión de Personal</h2>
        
        <div class="action-bar">
          <button id="btn-new-employee" class="btn btn-primary"><i class="fas fa-plus"></i> Nuevo Empleado</button>
          <div class="filters">
            <select id="filter-department" class="form-control">
              <option value="">Todos los departamentos</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="limpieza">Limpieza</option>
              <option value="recepcion">Recepción</option>
              <option value="cocina">Cocina</option>
              <option value="administracion">Administración</option>
            </select>
            <select id="filter-hotel" class="form-control">
              <option value="">Todos los hoteles</option>
              <option value="Wave">Wave</option>
              <option value="Sky">Sky</option>
              <option value="Palm">Palm</option>
            </select>
            <select id="filter-status" class="form-control">
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
            <div class="search-box">
              <i class="fas fa-search"></i>
              <input type="text" id="search-employee" class="form-control" placeholder="Buscar empleado...">
            </div>
          </div>
        </div>
        
        <!-- Formulario de empleado -->
        <div id="employee-form" class="form-container hidden">
          <h3 class="form-title" id="form-title">Nuevo Empleado</h3>
          <div class="form-group">
            <label for="employee-name">Nombre completo</label>
            <input type="text" id="employee-name" class="form-control" placeholder="Nombre y apellidos">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="employee-position">Cargo</label>
              <input type="text" id="employee-position" class="form-control" placeholder="Puesto de trabajo">
            </div>
            <div class="form-group">
              <label for="employee-department">Departamento</label>
              <select id="employee-department" class="form-control">
                <option value="mantenimiento">Mantenimiento</option>
                <option value="limpieza">Limpieza</option>
                <option value="recepcion">Recepción</option>
                <option value="cocina">Cocina</option>
                <option value="administracion">Administración</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="employee-hotel">Hotel</label>
              <select id="employee-hotel" class="form-control">
                <option value="Wave">Wave</option>
                <option value="Sky">Sky</option>
                <option value="Palm">Palm</option>
              </select>
            </div>
            <div class="form-group">
              <label for="employee-status">Estado</label>
              <select id="employee-status" class="form-control">
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="employee-phone">Teléfono</label>
              <input type="tel" id="employee-phone" class="form-control" placeholder="Número de teléfono">
            </div>
            <div class="form-group">
              <label for="employee-email">Email</label>
              <input type="email" id="employee-email" class="form-control" placeholder="Correo electrónico">
            </div>
          </div>
          <div class="form-group">
            <label for="employee-notes">Notas</label>
            <textarea id="employee-notes" class="form-control" placeholder="Información adicional..."></textarea>
          </div>
          <div class="form-actions">
            <button id="cancel-employee-btn" class="btn btn-secondary">Cancelar</button>
            <button id="save-employee-btn" class="btn btn-primary">Guardar Empleado</button>
          </div>
        </div>
        
        <!-- Resumen de empleados -->
        <div class="employee-summary">
          <div class="summary-card bg-info">
            <div class="summary-icon"><i class="fas fa-user-check"></i></div>
            <div class="summary-content">
              <h3>Empleados Activos</h3>
              <p id="employees-active-count">0</p>
            </div>
          </div>
          <div class="summary-card bg-secondary">
            <div class="summary-icon"><i class="fas fa-user-times"></i></div>
            <div class="summary-content">
              <h3>Empleados Inactivos</h3>
              <p id="employees-inactive-count">0</p>
            </div>
          </div>
          <div class="summary-card bg-primary">
            <div class="summary-icon"><i class="fas fa-users-cog"></i></div>
            <div class="summary-content">
              <h3>Total Empleados</h3>
              <p id="employees-total-count">0</p>
            </div>
          </div>
        </div>
        
        <!-- Lista de empleados -->
        <div id="employees-list" class="employees-list">
          <!-- Se llenará dinámicamente -->
        </div>
      `;
    }
    
    // Configurar listeners de eventos
    function setupEventListeners() {
      console.log('Configurando eventos del módulo de empleados...');
      
      // Filtros
      const filterDept = document.getElementById('filter-department');
      const filterHotel = document.getElementById('filter-hotel');
      const filterStatus = document.getElementById('filter-status');
      const searchEmployee = document.getElementById('search-employee');
      
      if (filterDept) filterDept.addEventListener('change', () => {
        console.log(`Filtro departamento cambiado a: ${filterDept.value}`);
        renderEmployees(AppState.get('employees'));
      });
      
      if (filterHotel) filterHotel.addEventListener('change', () => {
        console.log(`Filtro hotel cambiado a: ${filterHotel.value}`);
        renderEmployees(AppState.get('employees'));
      });
      
      if (filterStatus) filterStatus.addEventListener('change', () => {
        console.log(`Filtro estado cambiado a: ${filterStatus.value}`);
        renderEmployees(AppState.get('employees'));
      });
      
      if (searchEmployee) searchEmployee.addEventListener('input', () => {
        console.log(`Búsqueda cambiada a: ${searchEmployee.value}`);
        renderEmployees(AppState.get('employees'));
      });
      
      // Botón nuevo empleado
      const btnNewEmployee = document.getElementById('btn-new-employee');
      if (btnNewEmployee) {
        btnNewEmployee.addEventListener('click', () => {
          resetForm();
          document.getElementById('form-title').textContent = 'Nuevo Empleado';
          document.getElementById('employee-form').classList.remove('hidden');
          document.getElementById('employee-name').focus();
        });
      }
      
      // Botón cancelar
      const cancelBtn = document.getElementById('cancel-employee-btn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          document.getElementById('employee-form').classList.add('hidden');
        });
      }
      
      // Botón guardar
      const saveBtn = document.getElementById('save-employee-btn');
      if (saveBtn) {
        saveBtn.addEventListener('click', saveEmployee);
      }
      
      // Añadir un botón para limpiar filtros si no existe
      if (!document.getElementById('clear-employee-filters')) {
        const filtersContainer = document.querySelector('.filters');
        if (filtersContainer) {
          const clearBtn = document.createElement('button');
          clearBtn.id = 'clear-employee-filters';
          clearBtn.className = 'btn btn-secondary';
          clearBtn.innerHTML = '<i class="fas fa-eraser"></i> Limpiar filtros';
          clearBtn.addEventListener('click', clearFilters);
          
          filtersContainer.appendChild(clearBtn);
        }
      }
      
      console.log('Eventos configurados correctamente');
    }
    
    // Limpiar todos los filtros
    function clearFilters() {
      console.log('Limpiando todos los filtros...');
      
      const departmentFilter = document.getElementById('filter-department');
      const hotelFilter = document.getElementById('filter-hotel');
      const statusFilter = document.getElementById('filter-status');
      const searchFilter = document.getElementById('search-employee');
      
      if (departmentFilter) departmentFilter.value = '';
      if (hotelFilter) hotelFilter.value = '';
      if (statusFilter) statusFilter.value = '';
      if (searchFilter) searchFilter.value = '';
      
      // Renderizar sin filtros
      renderEmployees(AppState.get('employees'));
      
      Utils.showToast('Filtros limpiados', 'info');
    }
    
    // Renderizar lista de empleados
    function renderEmployees(employees) {
      console.log(`Renderizando ${employees.length} empleados...`);
      
      const employeesList = document.getElementById('employees-list');
      if (!employeesList) {
        console.error('ERROR: No se encontró el contenedor de empleados (#employees-list)');
        return;
      }
      
      // Actualizar contadores
      updateEmployeeCounts(employees);
      
      // Aplicar filtros
      const filteredEmployees = applyFilters();
      console.log(`Después de filtrar: ${filteredEmployees.length} empleados coinciden`);
      
      // Limpiar lista
      employeesList.innerHTML = '';
      
      // Si no hay empleados que coincidan con los filtros
      if (filteredEmployees.length === 0) {
        // Verificar si hay filtros aplicados
        const department = document.getElementById('filter-department').value;
        const hotel = document.getElementById('filter-hotel').value;
        const status = document.getElementById('filter-status').value;
        const search = document.getElementById('search-employee').value;
        
        const hasFilters = department || hotel || status || search;
        
        if (hasFilters) {
          // Hay filtros aplicados, mostrar botón para limpiarlos
          employeesList.innerHTML = `
            <div class="no-results">
              <p>No hay empleados que coincidan con los filtros</p>
              <button id="reset-filters-btn" class="btn btn-primary">
                <i class="fas fa-eraser"></i> Limpiar filtros
              </button>
            </div>
          `;
          
          // Configurar evento del botón
          const resetBtn = document.getElementById('reset-filters-btn');
          if (resetBtn) {
            resetBtn.addEventListener('click', clearFilters);
          }
        } else {
          // No hay filtros, simplemente no hay empleados
          employeesList.innerHTML = `
            <div class="no-results">
              <p>No hay empleados registrados</p>
              <button id="add-employee-btn" class="btn btn-primary">
                <i class="fas fa-plus"></i> Añadir empleado
              </button>
            </div>
          `;
          
          // Configurar evento del botón
          const addBtn = document.getElementById('add-employee-btn');
          if (addBtn) {
            addBtn.addEventListener('click', () => {
              resetForm();
              document.getElementById('form-title').textContent = 'Nuevo Empleado';
              document.getElementById('employee-form').classList.remove('hidden');
              document.getElementById('employee-name').focus();
            });
          }
        }
        
        return;
      }
      
      // Ordenar: activos primero, luego por departamento y nombre
      const sortedEmployees = [...filteredEmployees].sort((a, b) => {
        // Por estado (activos primero)
        if (a.status !== b.status) {
          return a.status === 'active' ? -1 : 1;
        }
        
        // Por departamento
        if (a.department !== b.department) {
          return a.department.localeCompare(b.department);
        }
        
        // Por nombre
        return a.name.localeCompare(b.name);
      });
      
      console.log(`Renderizando ${sortedEmployees.length} tarjetas de empleados...`);
      
      sortedEmployees.forEach(employee => {
        const statusText = employee.status === 'active' ? 'Activo' : 'Inactivo';
        const statusClass = employee.status === 'active' ? 'status-active' : 'status-inactive';
        
        // Formatear departamento
        const deptText = {
          'mantenimiento': 'Mantenimiento',
          'limpieza': 'Limpieza',
          'recepcion': 'Recepción',
          'cocina': 'Cocina',
          'administracion': 'Administración'
        }[employee.department] || employee.department;
        
        // Obtener iniciales para avatar
        const initials = employee.name.split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase();
        
        const card = document.createElement('div');
        card.className = `employee-card ${statusClass}`;
        card.setAttribute('data-id', employee.id);
        
        card.innerHTML = `
          <div class="employee-header">
            <div class="employee-avatar">${initials}</div>
            <div class="employee-info">
              <h3 class="employee-name">${Utils.sanitizeHTML(employee.name)}</h3>
              <div class="employee-position">${Utils.sanitizeHTML(employee.position || '')}</div>
              <div class="employee-tags">
                <span class="employee-department">${deptText}</span>
                <span class="employee-hotel">${employee.hotel}</span>
                <span class="employee-status-tag ${statusClass}-tag">${statusText}</span>
              </div>
            </div>
          </div>
          <div class="employee-body">
            <div class="employee-contact">
              ${employee.phone ? `<div class="employee-phone"><i class="fas fa-phone"></i> ${Utils.sanitizeHTML(employee.phone)}</div>` : ''}
              ${employee.email ? `<div class="employee-email"><i class="fas fa-envelope"></i> ${Utils.sanitizeHTML(employee.email)}</div>` : ''}
            </div>
            ${employee.notes ? `<div class="employee-notes">${Utils.sanitizeHTML(employee.notes)}</div>` : ''}
            <div class="employee-footer">
              <span class="employee-since">Desde: ${Utils.formatDate(employee.createdAt)}</span>
              <div class="employee-actions">
                <button class="btn-edit-employee" data-id="${employee.id}"><i class="fas fa-edit"></i></button>
                <button class="btn-delete-employee" data-id="${employee.id}"><i class="fas fa-trash"></i></button>
                <button class="btn-toggle-status" data-id="${employee.id}">
                  <i class="fas fa-${employee.status === 'active' ? 'user-slash' : 'user-check'}"></i>
                </button>
              </div>
            </div>
          </div>
        `;
        
        employeesList.appendChild(card);
      });
      
      // Configurar eventos para botones
      setupEmployeeCardButtons();
      
      console.log('Renderizado de empleados completado');
    }
    
    // Configurar botones de las tarjetas de empleados
    function setupEmployeeCardButtons() {
      // Botón de editar
      document.querySelectorAll('.btn-edit-employee').forEach(btn => {
        btn.addEventListener('click', () => {
          const employeeId = parseInt(btn.getAttribute('data-id'));
          editEmployee(employeeId);
        });
      });
      
      // Botón de eliminar
      document.querySelectorAll('.btn-delete-employee').forEach(btn => {
        btn.addEventListener('click', () => {
          const employeeId = parseInt(btn.getAttribute('data-id'));
          deleteEmployee(employeeId);
        });
      });
      
      // Botón de cambiar estado
      document.querySelectorAll('.btn-toggle-status').forEach(btn => {
        btn.addEventListener('click', () => {
          const employeeId = parseInt(btn.getAttribute('data-id'));
          toggleEmployeeStatus(employeeId);
        });
      });
    }
    
    // Actualizar contadores de empleados
    function updateEmployeeCounts(employees) {
      // Contar por estado
      const activeCount = employees.filter(emp => emp.status === 'active').length;
      const inactiveCount = employees.filter(emp => emp.status === 'inactive').length;
      const totalCount = employees.length;
      
      console.log(`Contadores: ${activeCount} activos, ${inactiveCount} inactivos, ${totalCount} total`);
      
      // Actualizar en el DOM
      const activeCountEl = document.getElementById('employees-active-count');
      const inactiveCountEl = document.getElementById('employees-inactive-count');
      const totalCountEl = document.getElementById('employees-total-count');
      
      if (activeCountEl) activeCountEl.textContent = activeCount;
      if (inactiveCountEl) inactiveCountEl.textContent = inactiveCount;
      if (totalCountEl) totalCountEl.textContent = totalCount;
    }
    
    // Aplicar filtros
    function applyFilters() {
      console.log('Aplicando filtros...');
      
      // Obtener valores de los filtros
      const department = document.getElementById('filter-department')?.value || '';
      const hotel = document.getElementById('filter-hotel')?.value || '';
      const status = document.getElementById('filter-status')?.value || '';
      const search = document.getElementById('search-employee')?.value?.toLowerCase() || '';
      
      // Verificar si hay filtros activos
      const hasFilters = department || hotel || status || search;
      if (hasFilters) {
        console.log(`Filtros activos: departamento=${department}, hotel=${hotel}, status=${status}, search=${search}`);
      }
      
      const employees = AppState.get('employees');
      console.log(`Total empleados antes de filtrar: ${employees.length}`);
      
      // Si no hay filtros, devolver todos
      if (!hasFilters) {
        return employees;
      }
      
      // Aplicar filtros
      return employees.filter(employee => {
        // Comprobar cada criterio solo si está establecido
        const matchesDepartment = !department || employee.department === department;
        const matchesHotel = !hotel || employee.hotel === hotel;
        const matchesStatus = !status || employee.status === status;
        
        // Búsqueda más flexible
        const matchesSearch = !search || 
                             employee.name.toLowerCase().includes(search) ||
                             (employee.position && employee.position.toLowerCase().includes(search)) ||
                             (employee.email && employee.email.toLowerCase().includes(search)) ||
                             (employee.department && employee.department.toLowerCase().includes(search)) ||
                             (employee.hotel && employee.hotel.toLowerCase().includes(search));
        
        // Debe cumplir TODOS los criterios activos
        return matchesDepartment && matchesHotel && matchesStatus && matchesSearch;
      });
    }
    
    // Editar empleado
    function editEmployee(employeeId) {
      console.log(`Editando empleado ID: ${employeeId}`);
      
      const employees = AppState.get('employees');
      const employee = employees.find(emp => emp.id === employeeId);
      
      if (!employee) {
        Utils.showToast('Empleado no encontrado', 'error');
        return;
      }
      
      // Llenar formulario
      document.getElementById('employee-name').value = employee.name || '';
      document.getElementById('employee-position').value = employee.position || '';
      document.getElementById('employee-department').value = employee.department || 'mantenimiento';
      document.getElementById('employee-hotel').value = employee.hotel || 'Wave';
      document.getElementById('employee-status').value = employee.status || 'active';
      document.getElementById('employee-phone').value = employee.phone || '';
      document.getElementById('employee-email').value = employee.email || '';
      document.getElementById('employee-notes').value = employee.notes || '';
      
      // Actualizar título
      document.getElementById('form-title').textContent = 'Editar Empleado';
      
      // Guardar ID del empleado actual
      currentEmployeeId = employeeId;
      
      // Mostrar formulario
      document.getElementById('employee-form').classList.remove('hidden');
      document.getElementById('employee-name').focus();
    }
    
    // Eliminar empleado
    function deleteEmployee(employeeId) {
      console.log(`Solicitando eliminación de empleado ID: ${employeeId}`);
      
      Utils.confirmAction(
        '¿Estás seguro de que deseas eliminar este empleado? Esta acción no se puede deshacer.',
        () => {
          const employees = AppState.get('employees');
          const employeeToDelete = employees.find(emp => emp.id === employeeId);
          
          if (!employeeToDelete) {
            Utils.showToast('Empleado no encontrado', 'error');
            return;
          }
          
          console.log(`Eliminando empleado: ${employeeToDelete.name}`);
          
          const newEmployees = employees.filter(emp => emp.id !== employeeId);
          
          AppState.update('employees', newEmployees);
          Utils.showToast('Empleado eliminado correctamente', 'success');
        }
      );
    }
    
    // Cambiar estado de empleado (activo/inactivo)
    function toggleEmployeeStatus(employeeId) {
      console.log(`Cambiando estado de empleado ID: ${employeeId}`);
      
      const employees = AppState.get('employees');
      const employeeIndex = employees.findIndex(emp => emp.id === employeeId);
      
      if (employeeIndex === -1) {
        Utils.showToast('Empleado no encontrado', 'error');
        return;
      }
      
      // Cambiar estado
      const currentStatus = employees[employeeIndex].status;
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const statusText = newStatus === 'active' ? 'activado' : 'desactivado';
      
      console.log(`Cambiando estado de ${currentStatus} a ${newStatus}`);
      
      // Actualizar empleado
      employees[employeeIndex].status = newStatus;
      employees[employeeIndex].updatedAt = new Date();
      
      // Guardar cambios
      AppState.update('employees', employees);
      
      // Notificar
      Utils.showToast(`Empleado ${statusText} correctamente`, 'success');
    }
    
    // Guardar empleado (nuevo o existente)
   function saveEmployee() {
    console.log('Guardando datos de empleado...');
    
    // Obtener datos del formulario
    const nameEl = document.getElementById('employee-name');
    const positionEl = document.getElementById('employee-position');
    const departmentEl = document.getElementById('employee-department');
    const hotelEl = document.getElementById('employee-hotel');
    const statusEl = document.getElementById('employee-status');
    const phoneEl = document.getElementById('employee-phone');
    const emailEl = document.getElementById('employee-email');
    const notesEl = document.getElementById('employee-notes');
    
    // Validar campos obligatorios
    if (!nameEl.value.trim()) {
      Utils.showToast('El nombre es obligatorio', 'error');
      nameEl.focus();
      return;
    }
    
    // Preparar datos
    const employeeData = {
      name: nameEl.value.trim(),
      position: positionEl.value.trim(),
      department: departmentEl.value,
      hotel: hotelEl.value,
      status: statusEl.value,
      phone: phoneEl.value.trim(),
      email: emailEl.value.trim(),
      notes: notesEl.value.trim(),
      updatedAt: new Date()
    };
    
    const employees = [...AppState.get('employees')];
    
    if (currentEmployeeId) {
      // Actualizar existente
      console.log(`Actualizando empleado existente ID: ${currentEmployeeId}`);
      
      const index = employees.findIndex(emp => emp.id === currentEmployeeId);
      if (index !== -1) {
        // Mantener campos que no están en el formulario
        employees[index] = { 
          ...employees[index], 
          ...employeeData 
        };
        
        AppState.update('employees', employees);
        Utils.showToast('Empleado actualizado correctamente', 'success');
      } else {
        console.error(`Error: No se encontró el empleado ID: ${currentEmployeeId}`);
        Utils.showToast('Error al actualizar el empleado', 'error');
      }
    } else {
      // Crear nuevo
      console.log('Creando nuevo empleado');
      
      const maxId = employees.reduce((max, emp) => Math.max(max, emp.id || 0), 0);
      const newEmployee = {
        ...employeeData,
        id: maxId + 1,
        createdAt: new Date()
      };
      
      console.log(`Nuevo empleado con ID: ${newEmployee.id}`);
      
      employees.push(newEmployee);
      AppState.update('employees', employees);
      Utils.showToast('Empleado creado correctamente', 'success');
    }
    
    // Actualizar las opciones de filtro con los nuevos datos
    updateFilterOptions();
    
    // Resetear formulario
    resetForm();
    document.getElementById('employee-form').classList.add('hidden');
  }
  
  // Resetear formulario
  function resetForm() {
    document.getElementById('employee-name').value = '';
    document.getElementById('employee-position').value = '';
    document.getElementById('employee-department').value = 'mantenimiento';
    document.getElementById('employee-hotel').value = 'Wave';
    document.getElementById('employee-status').value = 'active';
    document.getElementById('employee-phone').value = '';
    document.getElementById('employee-email').value = '';
    document.getElementById('employee-notes').value = '';
    
    currentEmployeeId = null;
  }
  
  // Función de diagnóstico para debuggear filtros
  function debugFilters() {
    console.group('Debug de filtros');
    
    const department = document.getElementById('filter-department')?.value || '';
    const hotel = document.getElementById('filter-hotel')?.value || '';
    const status = document.getElementById('filter-status')?.value || '';
    const search = document.getElementById('search-employee')?.value || '';
    
    console.log('Estado actual de los filtros:');
    console.log(`- Departamento: "${department}"`);
    console.log(`- Hotel: "${hotel}"`);
    console.log(`- Estado: "${status}"`);
    console.log(`- Búsqueda: "${search}"`);
    
    const allEmployees = AppState.get('employees');
    console.log(`Total de empleados sin filtrar: ${allEmployees.length}`);
    
    const filteredEmployees = applyFilters();
    console.log(`Empleados después de filtrar: ${filteredEmployees.length}`);
    
    console.log('Detalle de los empleados:');
    allEmployees.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.name} - Dept: ${emp.department}, Hotel: ${emp.hotel}, Status: ${emp.status}`);
      
      // Verificar si pasa los filtros
      const matchesDepartment = !department || emp.department === department;
      const matchesHotel = !hotel || emp.hotel === hotel;
      const matchesStatus = !status || emp.status === status;
      const matchesSearch = !search || 
                           emp.name.toLowerCase().includes(search.toLowerCase()) ||
                           (emp.position && emp.position.toLowerCase().includes(search.toLowerCase()));
      
      console.log(`   Pasa filtros: Dept=${matchesDepartment}, Hotel=${matchesHotel}, Status=${matchesStatus}, Search=${matchesSearch}`);
      console.log(`   Pasa todos los filtros: ${matchesDepartment && matchesHotel && matchesStatus && matchesSearch}`);
    });
    
    console.groupEnd();
  }
  
  // Añadir un botón de debug en desarrollo
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    console.log('Modo desarrollo: añadiendo botón de debug');
    
    // Llamar después de que se haya renderizado el módulo
    setTimeout(() => {
      const filtersContainer = document.querySelector('.filters');
      if (filtersContainer && !document.getElementById('debug-filters-btn')) {
        const debugBtn = document.createElement('button');
        debugBtn.id = 'debug-filters-btn';
        debugBtn.className = 'btn btn-secondary';
        debugBtn.style.marginLeft = '10px';
        debugBtn.style.background = '#ffcccc';
        debugBtn.innerHTML = '<i class="fas fa-bug"></i> Debug';
        debugBtn.addEventListener('click', debugFilters);
        
        filtersContainer.appendChild(debugBtn);
      }
    }, 1000);
  }
  
  // Inicializar módulo
  initEmployeesModule();
});