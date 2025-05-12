// Módulo de gestión de turnos de personal
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en la página de turnos
    const shiftsView = document.getElementById('shifts-view');
    if (!shiftsView) return;
    
    // Variables globales
    let currentWeekStart = null;
    let editingShiftId = null;
    
    // Colecciones
    let shiftsCollection = null;
    let employeesCollection = null;
    
    // Referencias a elementos DOM
    let currentWeekDisplay;
    let scheduleBody;
    let filterDepartment;
    let filterHotel;
    let editShiftForm;
    
    // Turno en edición
    let currentShift = null;
    
    // Inicializar módulo
    function initShiftsModule() {
      // Renderizar la estructura base del módulo
      renderModuleStructure();
      
      // Obtener referencias a elementos DOM
      currentWeekDisplay = document.getElementById('current-week-display');
      scheduleBody = document.getElementById('schedule-body');
      filterDepartment = document.getElementById('filter-shift-department');
      filterHotel = document.getElementById('filter-shift-hotel');
      editShiftForm = document.getElementById('edit-shift-form');
      
      // Inicializar colecciones virtuales
      initCollections();
      
      // Configurar eventos
      setupEventListeners();
      
      // Inicializar la semana actual
      initCurrentWeek();
      
      // Cargar datos iniciales si es necesario
      loadMockShiftsData();
      
      // Cargar empleados y turnos
      loadEmployees().then(() => {
        loadShifts();
      });
    }
    
    // Inicializar colecciones virtuales
    function initCollections() {
      // Si usamos AppState en lugar de Firestore:
      
      // Verificar/crear colección de turnos si no existe
      if (!AppState.get('shifts')) {
        AppState.data.shifts = [];
        AppState.saveToLocalStorage();
      }
      
      // Asociar a los datos de AppState
      shiftsCollection = {
        get: () => Promise.resolve(AppState.get('shifts')),
        add: (data) => {
          const shifts = [...AppState.get('shifts')];
          const maxId = shifts.reduce((max, shift) => Math.max(max, shift.id || 0), 0);
          const newShift = { ...data, id: maxId + 1 };
          shifts.push(newShift);
          AppState.update('shifts', shifts);
          return Promise.resolve({ id: newShift.id });
        },
        doc: (id) => ({
          get: () => {
            const shift = AppState.get('shifts').find(s => s.id === parseInt(id));
            return Promise.resolve({ exists: !!shift, data: () => shift, id });
          },
          update: (data) => {
            const shifts = [...AppState.get('shifts')];
            const index = shifts.findIndex(s => s.id === parseInt(id));
            if (index !== -1) {
              shifts[index] = { ...shifts[index], ...data };
              AppState.update('shifts', shifts);
            }
            return Promise.resolve();
          },
          delete: () => {
            const shifts = AppState.get('shifts').filter(s => s.id !== parseInt(id));
            AppState.update('shifts', shifts);
            return Promise.resolve();
          }
        })
      };
      
      // Usar los empleados de AppState
      employeesCollection = {
        orderBy: () => ({
          get: () => {
            const employees = [...AppState.get('employees')];
            // Ordenar por nombre
            employees.sort((a, b) => a.name.localeCompare(b.name));
            return Promise.resolve({
              docs: employees.map(e => ({ id: e.id, data: () => e }))
            });
          }
        }),
        where: (field, op, value) => ({
          get: () => {
            let employees = [...AppState.get('employees')];
            
            // Filtrar según criterio
            if (field === 'department' && op === '==') {
              employees = employees.filter(e => e.department === value);
            } else if (field === 'hotel' && op === '==') {
              employees = employees.filter(e => e.hotel === value);
            }
            
            // Ordenar por nombre
            employees.sort((a, b) => a.name.localeCompare(b.name));
            
            return Promise.resolve({
              docs: employees.map(e => ({ id: e.id, data: () => e }))
            });
          }
        }),
        doc: (id) => ({
          get: () => {
            const employee = AppState.get('employees').find(e => e.id === parseInt(id));
            return Promise.resolve({ exists: !!employee, data: () => employee, id });
          }
        })
      };
    }
    
    // Renderizar estructura base del módulo
    function renderModuleStructure() {
        shiftsView.innerHTML = `
          <h2 class="section-title"><i class="fas fa-calendar-alt"></i> Turnos de Personal</h2>
          
          <div class="panel">
            <div class="week-navigation">
              <button id="prev-week-btn" class="btn btn-icon"><i class="fas fa-chevron-left"></i> Semana anterior</button>
              <div id="current-week-display" class="week-display">12/05 - 18/05</div>
              <button id="next-week-btn" class="btn btn-icon">Semana siguiente <i class="fas fa-chevron-right"></i></button>
            </div>
            
            <div class="filters-row">
              <div class="filter-group">
                <label>Departamento</label>
                <select id="filter-shift-department" class="form-control">
                  <option value="">Todos los departamentos</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="limpieza">Limpieza</option>
                  <option value="recepcion">Recepción</option>
                  <option value="cocina">Cocina</option>
                  <option value="administracion">Administración</option>
                </select>
              </div>
              <div class="filter-group">
                <label>Hotel</label>
                <select id="filter-shift-hotel" class="form-control">
                  <option value="">Todos los hoteles</option>
                  <option value="Wave">Wave</option>
                  <option value="Sky">Sky</option>
                  <option value="Palm">Palm</option>
                </select>
              </div>
            </div>
            
            <div class="schedule-container">
              <table class="schedule-table">
                <thead>
                  <tr>
                    <th class="employee-col">Empleado</th>
                    <th>Lunes<br><span class="date-small">12/05</span></th>
                    <th>Martes<br><span class="date-small">13/05</span></th>
                    <th>Miércoles<br><span class="date-small">14/05</span></th>
                    <th>Jueves<br><span class="date-small">15/05</span></th>
                    <th>Viernes<br><span class="date-small">16/05</span></th>
                    <th class="weekend">Sábado<br><span class="date-small">17/05</span></th>
                    <th class="weekend">Domingo<br><span class="date-small">18/05</span></th>
                  </tr>
                </thead>
                <tbody id="schedule-body">
                  <!-- Las filas se llenarán dinámicamente -->
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Formulario para nuevo turno -->
          <div class="panel" id="new-shift-panel">
            <h3 class="panel-title">Nuevo Turno</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label for="shift-employee">Empleado</label>
                <select id="shift-employee" class="form-control">
                  <!-- Se llenará dinámicamente -->
                </select>
              </div>
              <div class="form-group">
                <label for="shift-date">Fecha</label>
                <input type="date" id="shift-date" class="form-control">
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="shift-type">Tipo de turno</label>
                <select id="shift-type" class="form-control">
                  <option value="morning">Mañana (7-15h)</option>
                  <option value="afternoon">Tarde (15-23h)</option>
                  <option value="night">Noche (23-7h)</option>
                  <option value="off">Descanso</option>
                  <option value="vacation">Vacaciones</option>
                </select>
              </div>
              <div class="form-group">
                <label for="shift-notes">Notas</label>
                <input type="text" id="shift-notes" class="form-control" placeholder="Información adicional...">
              </div>
            </div>
            
            <div class="form-actions">
              <button id="cancel-shift-btn" class="btn btn-secondary">Cancelar</button>
              <button id="save-shift-btn" class="btn btn-primary">Guardar</button>
              <button id="delete-shift-btn" class="btn btn-danger" style="display: none;">Eliminar</button>
            </div>
          </div>
        `;
      }
    
    // Inicializar semana actual
    function initCurrentWeek() {
      // Obtener fecha actual
      const today = new Date();
      
      // Obtener el día de la semana (0 = domingo, 1 = lunes, etc.)
      const dayOfWeek = today.getDay();
      
      // Ajustar al lunes de la semana actual
      // Si hoy es domingo (0), retroceder 6 días; si es lunes (1), no ajustar; etc.
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      currentWeekStart = new Date(today);
      currentWeekStart.setDate(today.getDate() + diff);
      
      // Resetear la hora para evitar problemas con horario de verano, etc.
      currentWeekStart.setHours(0, 0, 0, 0);
      
      // Actualizar visualización de la semana
      updateWeekDisplay();
    }
    
    // Actualizar visualización de la semana
    // Modificación a la función updateWeekDisplay
    function updateWeekDisplay() {
        if (!currentWeekDisplay) return;
        
        // Formato de fecha corto
        const formatShortDate = (date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${day}/${month}`;
        };
        
        // Calcular fecha de fin de semana (domingo)
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        // Actualizar texto
        currentWeekDisplay.textContent = `${formatShortDate(currentWeekStart)} - ${formatShortDate(weekEnd)}`;
        
        // Actualizar fechas en las celdas de encabezado
        const tableHeaders = document.querySelectorAll('.schedule-table th:not(.employee-col) .date-small');
        if (tableHeaders && tableHeaders.length > 0) {
        for (let i = 0; i < tableHeaders.length; i++) {
            const date = new Date(currentWeekStart);
            date.setDate(date.getDate() + i);
            tableHeaders[i].textContent = formatShortDate(date);
        }
        }
    }
    
    // Configurar eventos
    function setupEventListeners() {
      // Navegación de semanas
      const prevWeekBtn = document.getElementById('prev-week-btn');
      const nextWeekBtn = document.getElementById('next-week-btn');
      
      if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', () => {
          currentWeekStart.setDate(currentWeekStart.getDate() - 7);
          updateWeekDisplay();
          loadShifts();
        });
      }
      
      if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', () => {
          currentWeekStart.setDate(currentWeekStart.getDate() + 7);
          updateWeekDisplay();
          loadShifts();
        });
      }
      
      // Filtros
      if (filterDepartment) {
        filterDepartment.addEventListener('change', loadEmployeesAndShifts);
      }
      
      if (filterHotel) {
        filterHotel.addEventListener('change', loadEmployeesAndShifts);
      }
      
      // Formulario de turnos
      const addShiftBtn = document.getElementById('add-shift-btn');
      const cancelShiftBtn = document.getElementById('cancel-shift-btn');
      const saveShiftBtn = document.getElementById('save-shift-btn');
      const deleteShiftBtn = document.getElementById('delete-shift-btn');
      
      if (addShiftBtn) {
        addShiftBtn.addEventListener('click', () => {
          showNewShiftForm();
        });
      }
      
      if (cancelShiftBtn) {
        cancelShiftBtn.addEventListener('click', () => {
          hideShiftForm();
        });
      }
      
      if (saveShiftBtn) {
        saveShiftBtn.addEventListener('click', saveShift);
      }
      
      if (deleteShiftBtn) {
        deleteShiftBtn.addEventListener('click', deleteCurrentShift);
      }
      
      // Exportar
      const exportBtn = document.getElementById('export-schedule-btn');
      if (exportBtn) {
        exportBtn.addEventListener('click', exportSchedule);
      }
    }
    
    // Cargar empleados y turnos juntos (para filtros)
    function loadEmployeesAndShifts() {
      loadEmployees().then(() => {
        loadShifts();
      });
    }
    
    // Cargar empleados
    function loadEmployees() {
      const department = filterDepartment ? filterDepartment.value : '';
      const hotel = filterHotel ? filterHotel.value : '';
      
      let query;
      
      if (department && hotel) {
        query = employeesCollection.where('department', '==', department).where('hotel', '==', hotel);
      } else if (department) {
        query = employeesCollection.where('department', '==', department);
      } else if (hotel) {
        query = employeesCollection.where('hotel', '==', hotel);
      } else {
        query = employeesCollection.orderBy('name');
      }
      
      return query.get().then(snapshot => {
        const employees = [];
        snapshot.docs.forEach(doc => {
          const employee = doc.data();
          employees.push({ id: doc.id, ...employee });
        });
        
        // Actualizar selector de empleados en el formulario
        updateEmployeeSelect(employees);
        
        return employees;
      });
    }
    
    // Actualizar selector de empleados
    function updateEmployeeSelect(employees) {
      const select = document.getElementById('shift-employee');
      if (!select) return;
      
      // Guardar valor seleccionado actual
      const currentValue = select.value;
      
      // Limpiar opciones actuales
      select.innerHTML = '';
      
      // Añadir empleados
      employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = `${employee.name} (${employee.department}, ${employee.hotel})`;
        select.appendChild(option);
      });
      
      // Restaurar valor si sigue siendo válido
      if (currentValue && employees.some(e => e.id == currentValue)) {
        select.value = currentValue;
      }
    }
    
    // Cargar turnos
    function loadShifts() {
      if (!currentWeekStart || !scheduleBody) return;
      
      // Calcular fin de semana
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      // Primero cargar los empleados según filtros
      return loadEmployees().then(employees => {
        // Luego cargar todos los turnos de la semana
        return shiftsCollection.get().then(shifts => {
          // Filtrar los turnos que corresponden a la semana actual
          const weekShifts = shifts.filter(shift => {
            const shiftDate = new Date(shift.date);
            return shiftDate >= currentWeekStart && shiftDate < weekEnd;
          });
          
          // Renderizar horario
          renderSchedule(employees, weekShifts);
        });
      });
    }
    
    // Renderizar horario
    function renderSchedule(employees, shifts) {
      if (!scheduleBody) return;
      
      // Limpiar tabla
      scheduleBody.innerHTML = '';
      
      // Si no hay empleados
      if (employees.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 8; // Una columna para empleados + 7 días
        cell.className = 'text-center';
        cell.textContent = 'No hay empleados que coincidan con los filtros';
        row.appendChild(cell);
        scheduleBody.appendChild(row);
        return;
      }
      
      // Crear filas para cada empleado
      employees.forEach(employee => {
        const row = document.createElement('tr');
        
        // Celda con nombre de empleado
        const employeeCell = document.createElement('td');
        employeeCell.className = 'employee-col';
        employeeCell.innerHTML = `
          <div class="employee-name">${Utils.sanitizeHTML(employee.name)}</div>
          <div class="employee-dept">${Utils.sanitizeHTML(employee.department)}</div>
        `;
        row.appendChild(employeeCell);
        
        // Celdas para cada día de la semana
        for (let i = 0; i < 7; i++) {
          const day = new Date(currentWeekStart);
          day.setDate(day.getDate() + i);
          
          const cell = document.createElement('td');
          if (i >= 5) cell.className = 'weekend'; // Sábado y domingo
          
          // Buscar turno para este empleado y día
          const dayShift = shifts.find(shift => {
            const shiftDate = new Date(shift.date);
            return shift.employeeId == employee.id && 
                  shiftDate.getDate() === day.getDate() &&
                  shiftDate.getMonth() === day.getMonth() &&
                  shiftDate.getFullYear() === day.getFullYear();
          });
          
          if (dayShift) {
            // Hay un turno asignado
            const shiftDiv = document.createElement('div');
            shiftDiv.className = `shift shift-${dayShift.type}`;
            shiftDiv.setAttribute('data-shift-id', dayShift.id);
            
            // Texto según tipo de turno
            let shiftText = '';
            switch (dayShift.type) {
                case 'morning': shiftText = 'Mañana (7-15h)'; break;
                case 'afternoon': shiftText = 'Tarde (15-23h)'; break;
                case 'night': shiftText = 'Noche (23-7h)'; break;
                case 'off': shiftText = 'Descanso'; break;
                case 'vacation': shiftText = 'Vacaciones'; break;
                default: shiftText = 'Turno'; break;
              }
              
              // Agregar tooltip con notas si existen
              if (dayShift.notes) {
                shiftDiv.setAttribute('title', dayShift.notes);
              }
              
              shiftDiv.textContent = shiftText;
              
              // Configurar evento de clic para editar
              shiftDiv.addEventListener('click', () => {
                editShift(dayShift.id);
              });
              
              cell.appendChild(shiftDiv);
            } else {
              // No hay turno, permitir crear uno
              cell.addEventListener('click', () => {
                showNewShiftForm(employee.id, day);
              });
            }
            
            row.appendChild(cell);
          }
          
          scheduleBody.appendChild(row);
        });
      }
      
      // Cargar datos mock si es necesario
      function loadMockShiftsData() {
        if (AppState.get('shifts').length === 0) {
          // Simulamos algunos turnos para esta semana
          const mockShifts = [
            {
              id: 1,
              employeeId: 1, // Juan Pérez
              date: new Date(currentWeekStart.getTime()),
              type: 'morning',
              notes: '',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 2,
              employeeId: 1, // Juan Pérez
              date: new Date(currentWeekStart.getTime() + 24 * 60 * 60 * 1000), // Martes
              type: 'morning',
              notes: '',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 3,
              employeeId: 1, // Juan Pérez
              date: new Date(currentWeekStart.getTime() + 2 * 24 * 60 * 60 * 1000), // Miércoles
              type: 'morning',
              notes: '',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 4,
              employeeId: 1, // Juan Pérez
              date: new Date(currentWeekStart.getTime() + 3 * 24 * 60 * 60 * 1000), // Jueves
              type: 'morning',
              notes: '',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 5,
              employeeId: 1, // Juan Pérez
              date: new Date(currentWeekStart.getTime() + 4 * 24 * 60 * 60 * 1000), // Viernes
              type: 'off',
              notes: 'Día libre compensatorio',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 6,
              employeeId: 2, // Lucía Gómez
              date: new Date(currentWeekStart.getTime() + 4 * 24 * 60 * 60 * 1000), // Viernes
              type: 'afternoon',
              notes: '',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ];
          
          AppState.data.shifts = mockShifts;
          AppState.saveToLocalStorage();
        }
      }
      
      // Mostrar formulario para nuevo turno
      function showNewShiftForm(employeeId = null, date = null) {
        const shiftPanel = document.getElementById('new-shift-panel');
        if (!shiftPanel) return;
        
        // Resetear valores
        if (employeeId && document.getElementById('shift-employee')) {
          document.getElementById('shift-employee').value = employeeId;
        }
        
        if (date && document.getElementById('shift-date')) {
          // Formatear fecha para input type="date" (YYYY-MM-DD)
          const year = date.getFullYear();
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const day = date.getDate().toString().padStart(2, '0');
          document.getElementById('shift-date').value = `${year}-${month}-${day}`;
        } else {
          // Poner fecha actual
          const today = new Date();
          const year = today.getFullYear();
          const month = (today.getMonth() + 1).toString().padStart(2, '0');
          const day = today.getDate().toString().padStart(2, '0');
          document.getElementById('shift-date').value = `${year}-${month}-${day}`;
        }
        
        // Resetear resto de campos
        document.getElementById('shift-type').value = 'morning';
        document.getElementById('shift-notes').value = '';
        
        // Ocultar botón de eliminar para nuevos turnos
        document.getElementById('delete-shift-btn').style.display = 'none';
        
        // Mostrar panel
        shiftPanel.style.display = 'block';
        
        // Título del panel
        const panelTitle = shiftPanel.querySelector('.panel-title');
        if (panelTitle) {
          panelTitle.textContent = 'Nuevo Turno';
        }
        
        // Enfocar el primer campo
        document.getElementById('shift-employee').focus();
        
        // Scroll al formulario
        shiftPanel.scrollIntoView({ behavior: 'smooth' });
        
        // Reset variables
        editingShiftId = null;
        currentShift = null;
      }
      
      // Editar turno existente
      function editShift(shiftId) {
        // Buscar el turno en la colección
        shiftsCollection.doc(shiftId).get()
          .then(doc => {
            if (doc.exists) {
              const shift = doc.data();
              currentShift = { id: shiftId, ...shift };
              
              // Obtener panel
              const shiftPanel = document.getElementById('new-shift-panel');
              if (!shiftPanel) return;
              
              // Actualizar título
              const panelTitle = shiftPanel.querySelector('.panel-title');
              if (panelTitle) {
                panelTitle.textContent = 'Editar Turno';
              }
              
              // Llenar campos
              document.getElementById('shift-employee').value = shift.employeeId;
              
              // Formatear fecha para input type="date" (YYYY-MM-DD)
              const date = new Date(shift.date);
              const year = date.getFullYear();
              const month = (date.getMonth() + 1).toString().padStart(2, '0');
              const day = date.getDate().toString().padStart(2, '0');
              document.getElementById('shift-date').value = `${year}-${month}-${day}`;
              
              document.getElementById('shift-type').value = shift.type;
              document.getElementById('shift-notes').value = shift.notes || '';
              
              // Mostrar botón de eliminar
              document.getElementById('delete-shift-btn').style.display = 'inline-block';
              
              // Mostrar panel
              shiftPanel.style.display = 'block';
              
              // Scroll al formulario
              shiftPanel.scrollIntoView({ behavior: 'smooth' });
              
              // Enfocar el primer campo
              document.getElementById('shift-employee').focus();
              
              // Guardar ID del turno
              editingShiftId = shiftId;
            } else {
              Utils.showToast('No se encontró el turno solicitado', 'error');
            }
          })
          .catch(error => {
            console.error('Error al cargar el turno:', error);
            Utils.showToast('Error al cargar el turno', 'error');
          });
      }
      
      // Ocultar formulario de turno
      function hideShiftForm() {
        const shiftPanel = document.getElementById('new-shift-panel');
        if (shiftPanel) {
          shiftPanel.style.display = 'none';
        }
        editingShiftId = null;
        currentShift = null;
      }
      
      // Guardar turno
      function saveShift() {
        // Obtener valores del formulario
        const employeeId = document.getElementById('shift-employee').value;
        const dateStr = document.getElementById('shift-date').value;
        const type = document.getElementById('shift-type').value;
        const notes = document.getElementById('shift-notes').value;
        
        // Validar campos requeridos
        if (!employeeId) {
          Utils.showToast('Por favor selecciona un empleado', 'error');
          return;
        }
        
        if (!dateStr) {
          Utils.showToast('Por favor selecciona una fecha', 'error');
          return;
        }
        
        // Convertir fecha
        const date = new Date(dateStr);
        
        // Preparar datos
        const shiftData = {
          employeeId: parseInt(employeeId),
          date: date,
          type: type,
          notes: notes,
          updatedAt: new Date()
        };
        
        // Si es un nuevo turno
        if (!editingShiftId) {
          shiftData.createdAt = new Date();
          
          // Verificar si ya existe un turno para este empleado en esta fecha
          shiftsCollection.get()
            .then(shifts => {
              const existingShift = shifts.find(shift => {
                const shiftDate = new Date(shift.date);
                return shift.employeeId == employeeId && 
                      shiftDate.getDate() === date.getDate() &&
                      shiftDate.getMonth() === date.getMonth() &&
                      shiftDate.getFullYear() === date.getFullYear();
              });
              
              if (existingShift) {
                Utils.showToast('Ya existe un turno para este empleado en esta fecha', 'error');
                return;
              }
              
              // Crear nuevo turno
              shiftsCollection.add(shiftData)
                .then(() => {
                  Utils.showToast('Turno creado correctamente', 'success');
                  hideShiftForm();
                  loadShifts();
                })
                .catch(error => {
                  console.error('Error al crear el turno:', error);
                  Utils.showToast('Error al crear el turno', 'error');
                });
            });
        } else {
          // Actualizar turno existente
          shiftsCollection.doc(editingShiftId).update(shiftData)
            .then(() => {
              Utils.showToast('Turno actualizado correctamente', 'success');
              hideShiftForm();
              loadShifts();
            })
            .catch(error => {
              console.error('Error al actualizar el turno:', error);
              Utils.showToast('Error al actualizar el turno', 'error');
            });
        }
      }
      
      // Eliminar turno actual
      function deleteCurrentShift() {
        if (!editingShiftId) return;
        
        Utils.confirmAction(
          '¿Estás seguro de que deseas eliminar este turno?',
          () => {
            shiftsCollection.doc(editingShiftId).delete()
              .then(() => {
                Utils.showToast('Turno eliminado correctamente', 'success');
                hideShiftForm();
                loadShifts();
              })
              .catch(error => {
                console.error('Error al eliminar el turno:', error);
                Utils.showToast('Error al eliminar el turno', 'error');
              });
          }
        );
      }
      
      // Exportar horario a Excel
      function exportSchedule() {
        // Primero cargar los empleados según filtros
        loadEmployees().then(employees => {
          // Luego cargar todos los turnos de la semana
          shiftsCollection.get().then(allShifts => {
            // Calcular fin de semana
            const weekEnd = new Date(currentWeekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);
            
            // Filtrar los turnos que corresponden a la semana actual
            const weekShifts = allShifts.filter(shift => {
              const shiftDate = new Date(shift.date);
              return shiftDate >= currentWeekStart && shiftDate < weekEnd;
            });
            
            // Preparar datos para Excel
            const data = [];
            
            // Fila de encabezado
            const headerRow = ['Empleado', 'Departamento', 'Hotel'];
            
            for (let i = 0; i < 7; i++) {
              const day = new Date(currentWeekStart);
              day.setDate(day.getDate() + i);
              
              // Formato: "Lunes 01/05"
              const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
              const dayName = dayNames[day.getDay()];
              const dayNumber = day.getDate().toString().padStart(2, '0');
              const monthNumber = (day.getMonth() + 1).toString().padStart(2, '0');
              
              headerRow.push(`${dayName} ${dayNumber}/${monthNumber}`);
            }
            
            data.push(headerRow);
            
            // Filas para cada empleado
            employees.forEach(employee => {
              const row = [
                employee.name,
                employee.department,
                employee.hotel
              ];
              
              // Añadir turnos para cada día
              for (let i = 0; i < 7; i++) {
                const day = new Date(currentWeekStart);
                day.setDate(day.getDate() + i);
                
                // Buscar turno para este empleado y día
                const dayShift = weekShifts.find(shift => {
                  const shiftDate = new Date(shift.date);
                  return shift.employeeId == employee.id && 
                        shiftDate.getDate() === day.getDate() &&
                        shiftDate.getMonth() === day.getMonth() &&
                        shiftDate.getFullYear() === day.getFullYear();
                });
                
                if (dayShift) {
                  // Texto según tipo de turno
                  let shiftText = '';
                  switch (dayShift.type) {
                    case 'morning': shiftText = 'Mañana (7-15h)'; break;
                    case 'afternoon': shiftText = 'Tarde (15-23h)'; break;
                    case 'night': shiftText = 'Noche (23-7h)'; break;
                    case 'off': shiftText = 'Descanso'; break;
                    case 'vacation': shiftText = 'Vacaciones'; break;
                    default: shiftText = 'Turno'; break;
                  }
                  
                  // Añadir notas si existen
                  if (dayShift.notes) {
                    shiftText += ` - ${dayShift.notes}`;
                  }
                  
                  row.push(shiftText);
                } else {
                  row.push('');
                }
              }
              
              data.push(row);
            });
            
            // Generar Excel
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(data);
            
            // Configurar estilos (ancho de columna)
            const colWidths = [
              { wch: 20 }, // Empleado
              { wch: 15 }, // Departamento
              { wch: 10 }, // Hotel
              { wch: 18 }, // Lunes
              { wch: 18 }, // Martes
              { wch: 18 }, // Miércoles
              { wch: 18 }, // Jueves
              { wch: 18 }, // Viernes
              { wch: 18 }, // Sábado
              { wch: 18 }  // Domingo
            ];
            
            ws['!cols'] = colWidths;
            
            // Nombre de la hoja: "Turnos 01-07 Mayo"
            const startDay = currentWeekStart.getDate().toString().padStart(2, '0');
            const endDay = new Date(weekEnd);
            endDay.setDate(endDay.getDate() - 1); // El fin de semana es exclusivo
            const endDayFormatted = endDay.getDate().toString().padStart(2, '0');
            
            const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            const monthName = monthNames[currentWeekStart.getMonth()];
            
            const sheetName = `Turnos ${startDay}-${endDayFormatted} ${monthName}`;
            
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            
            // Generar el archivo Excel
            XLSX.writeFile(wb, `Turnos_${startDay}-${endDayFormatted}_${monthName}.xlsx`);
            
            Utils.showToast('Horario exportado correctamente', 'success');
          });
        });
      }
      
      // Inicializar módulo
      initShiftsModule();
    });