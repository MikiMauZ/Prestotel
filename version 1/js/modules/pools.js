// modules/pools.js - Módulo híbrido de gestión de piscinas

document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en la página de piscinas
    const poolsView = document.getElementById('pools-view');
    if (!poolsView) return;
    
    // Referencias a elementos DOM
    let poolsList;
    let poolRecordsList;
    let poolSelect;
    let dateControl;
    let filterHotel;
    let filterStatus;
    let recordModal;
    
    // Variables de estado
    let currentPoolId = null;
    let currentRecordId = null;
    let currentPage = 1;
    const recordsPerPage = 20;
    
    // Inicializar módulo
    function initPoolsModule() {
        // Renderizar la estructura base del módulo
        renderModuleStructure();
        
        // Obtener referencias a elementos DOM
        poolsList = document.getElementById('pools-list');
        poolRecordsList = document.getElementById('pool-records-table');
        poolSelect = document.getElementById('filter-pool');
        dateControl = document.getElementById('filter-date');
        filterHotel = document.getElementById('filter-pool-hotel');
        filterStatus = document.getElementById('filter-pool-status');
        recordModal = document.getElementById('record-modal-overlay');
        
        // Inicializar AppState para piscinas si no existe
        if (!AppState.get('pools')) {
            AppState.data.pools = [];
            AppState.saveToLocalStorage();
        }
        
        // Inicializar AppState para registros de piscinas si no existe
        if (!AppState.get('poolRecords')) {
            AppState.data.poolRecords = [];
            AppState.saveToLocalStorage();
        }
        
        // Suscribirse a cambios
        AppState.subscribe('pools', renderPools);
        AppState.subscribe('poolRecords', updateRecordsTable);
        
        // Configurar eventos
        setupEventListeners();
        
        // Cargar datos iniciales si es necesario
        loadMockPoolsData();
        
        // Renderizar piscinas y actualizar selector
        renderPools(AppState.get('pools'));
        updatePoolSelect();
        
        // Establecer fecha actual en el control de fecha
        const today = new Date().toISOString().split('T')[0];
        if (dateControl) dateControl.value = today;
        
        // Inicializar tabla de registros
        updateRecordsTable();
    }
    
    // Cargar datos mock para piscinas si no existen
    function loadMockPoolsData() {
        if (AppState.get('pools').length === 0) {
            const mockPools = [
                {
                    id: 1,
                    name: "Piscina Principal",
                    hotel: "Wave",
                    type: "Exterior",
                    volume: 280,
                    maxBathers: 80,
                    lastInspection: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    status: "active",
                    waterTreatment: "Cloración salina",
                    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
                },
                {
                    id: 2,
                    name: "Piscina Infantil",
                    hotel: "Wave",
                    type: "Exterior",
                    volume: 60,
                    maxBathers: 25,
                    lastInspection: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    status: "active",
                    waterTreatment: "Cloro",
                    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
                },
                {
                    id: 3,
                    name: "Piscina Spa",
                    hotel: "Sky",
                    type: "Interior",
                    volume: 120,
                    maxBathers: 30,
                    lastInspection: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
                    status: "maintenance",
                    waterTreatment: "Bromo",
                    createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000)
                },
                {
                    id: 4,
                    name: "Piscina Principal",
                    hotel: "Palm",
                    type: "Exterior",
                    volume: 320,
                    maxBathers: 95,
                    lastInspection: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
                    status: "active",
                    waterTreatment: "Cloración salina",
                    createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000)
                }
            ];
            
            // Guardar en AppState
            AppState.data.pools = mockPools;
            AppState.saveToLocalStorage();
        }
        
        // Cargar datos mock para registros de piscinas
        if (AppState.get('poolRecords').length === 0) {
            const mockRecords = [];
            const pools = AppState.get('pools');
            
            // Generar registros para los últimos 7 días para cada piscina
            pools.forEach(pool => {
                for (let i = 0; i < 7; i++) {
                    const recordDate = new Date();
                    recordDate.setDate(recordDate.getDate() - i);
                    
                    // Solo generar registros para piscinas activas
                    if (pool.status === 'active') {
                        // Valores normales con pequeñas variaciones
                        const baseTemp = pool.type === 'Interior' ? 28 : 24;
                        const baseCloro = 1.0;
                        const basePh = 7.2;
                        
                        mockRecords.push({
                            id: mockRecords.length + 1,
                            poolId: pool.id,
                            date: new Date(recordDate.setHours(9, 0, 0, 0)),
                            temperature: baseTemp + (Math.random() * 2 - 1),
                            ph: basePh + (Math.random() * 0.6 - 0.3),
                            freeChlorine: baseCloro + (Math.random() * 0.4 - 0.2),
                            combinedChlorine: 0.2 + (Math.random() * 0.2),
                            turbidity: Math.random() < 0.9 ? "Óptima" : "Aceptable",
                            observations: i === 3 ? "Se ha reemplazado el filtro" : "",
                            createdBy: "sistema",
                            createdAt: recordDate
                        });
                        
                        // Registro de la tarde
                        mockRecords.push({
                            id: mockRecords.length + 1,
                            poolId: pool.id,
                            date: new Date(recordDate.setHours(16, 0, 0, 0)),
                            temperature: baseTemp + (Math.random() * 2 - 0.5),
                            ph: basePh + (Math.random() * 0.6 - 0.3),
                            freeChlorine: baseCloro + (Math.random() * 0.4 - 0.2),
                            combinedChlorine: 0.2 + (Math.random() * 0.2),
                            turbidity: Math.random() < 0.9 ? "Óptima" : "Aceptable",
                            observations: "",
                            createdBy: "sistema",
                            createdAt: recordDate
                        });
                    }
                }
            });
            
            // Guardar en AppState
            AppState.data.poolRecords = mockRecords;
            AppState.saveToLocalStorage();
        }
    }
    
    // Configurar eventos
    function setupEventListeners() {
        // Filtros de piscinas
        if (filterHotel) {
            filterHotel.addEventListener('change', () => {
                renderPools(AppState.get('pools'));
                updatePoolSelect();
            });
        }
        
        if (filterStatus) {
            filterStatus.addEventListener('change', () => {
                renderPools(AppState.get('pools'));
                updatePoolSelect();
            });
        }
        
        // Selector de piscina para filtrar registros
        if (poolSelect) {
            poolSelect.addEventListener('change', updateRecordsTable);
        }
        
        // Control de fecha para filtrar registros
        if (dateControl) {
            dateControl.addEventListener('change', updateRecordsTable);
        }
        
        // Botón nueva piscina
        const btnNewPool = document.getElementById('btn-new-pool');
        if (btnNewPool) {
            btnNewPool.addEventListener('click', () => {
                showPoolForm();
            });
        }
        
        // Botón nueva lectura
        const btnNewRecord = document.getElementById('btn-new-record');
        if (btnNewRecord) {
            btnNewRecord.addEventListener('click', (e) => {
                e.preventDefault();
                openRecordModal();
            });
        }
        
        // Botón cerrar modal
        const closeModalBtn = document.getElementById('close-record-modal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', (e) => {
                e.preventDefault();
                hideRecordModal();
            });
        }
        
        // Cerrar modal al hacer clic en el fondo
        const modalOverlay = document.getElementById('record-modal-overlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                // Solo cierra si el clic fue directamente en el overlay, no en su contenido
                if (e.target === modalOverlay) {
                    hideRecordModal();
                }
            });
        }
        
        // Botón guardar en modal
        const saveRecordBtn = document.getElementById('save-record-btn');
        if (saveRecordBtn) {
            saveRecordBtn.addEventListener('click', (e) => {
                e.preventDefault();
                saveRecordFromModal();
            });
        }
        
        // Botón cancelar piscina
        const cancelPoolBtn = document.getElementById('cancel-pool-btn');
        if (cancelPoolBtn) {
            cancelPoolBtn.addEventListener('click', () => {
                document.getElementById('pool-form').classList.add('hidden');
            });
        }
        
        // Botón guardar piscina
        const savePoolBtn = document.getElementById('save-pool-btn');
        if (savePoolBtn) {
            savePoolBtn.addEventListener('click', savePool);
        }
        
        // Botón exportar registros
        const exportRecordsBtn = document.getElementById('export-records-btn');
        if (exportRecordsBtn) {
            exportRecordsBtn.addEventListener('click', exportPoolRecords);
        }
    }
    
    // Renderizar estructura base del módulo
    function renderModuleStructure() {
        poolsView.innerHTML = `
            <h2 class="section-title"><i class="fas fa-swimming-pool"></i> Gestión de Piscinas</h2>
            
            <div class="action-bar">
                <button id="btn-new-pool" class="btn btn-primary"><i class="fas fa-plus"></i> Nueva Piscina</button>
                <div class="filters">
                    <select id="filter-pool-hotel" class="form-control">
                        <option value="">Todos los hoteles</option>
                        <option value="Wave">Wave</option>
                        <option value="Sky">Sky</option>
                        <option value="Palm">Palm</option>
                    </select>
                    <select id="filter-pool-status" class="form-control">
                        <option value="">Todos los estados</option>
                        <option value="active">Activas</option>
                        <option value="maintenance">En mantenimiento</option>
                        <option value="closed">Cerradas</option>
                    </select>
                </div>
            </div>
            
            <!-- Formulario para añadir/editar piscina -->
            <div id="pool-form" class="form-container hidden">
                <h3 class="form-title" id="pool-form-title">Nueva Piscina</h3>
                <div class="form-group">
                    <label for="pool-name">Nombre de la piscina</label>
                    <input type="text" id="pool-name" class="form-control" placeholder="Nombre de la piscina">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="pool-hotel">Hotel</label>
                        <select id="pool-hotel" class="form-control">
                            <option value="Wave">Wave</option>
                            <option value="Sky">Sky</option>
                            <option value="Palm">Palm</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="pool-type">Tipo</label>
                        <select id="pool-type" class="form-control">
                            <option value="Exterior">Exterior</option>
                            <option value="Interior">Interior</option>
                            <option value="Infantil">Infantil</option>
                            <option value="Spa">Spa</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="pool-volume">Volumen (m³)</label>
                        <input type="number" id="pool-volume" class="form-control" min="1" step="1">
                    </div>
                    <div class="form-group">
                        <label for="pool-max-bathers">Aforo máximo</label>
                        <input type="number" id="pool-max-bathers" class="form-control" min="1" step="1">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="pool-treatment">Tipo de tratamiento</label>
                        <select id="pool-treatment" class="form-control">
                            <option value="Cloro">Cloro</option>
                            <option value="Cloración salina">Cloración salina</option>
                            <option value="Bromo">Bromo</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="pool-status">Estado</label>
                        <select id="pool-status" class="form-control">
                            <option value="active">Activa</option>
                            <option value="maintenance">En mantenimiento</option>
                            <option value="closed">Cerrada</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="pool-inspection">Última inspección</label>
                    <input type="date" id="pool-inspection" class="form-control">
                </div>
                <div class="form-group">
                    <label for="pool-notes">Notas adicionales</label>
                    <textarea id="pool-notes" class="form-control" placeholder="Información adicional..."></textarea>
                </div>
                <div class="form-actions">
                    <button id="cancel-pool-btn" class="btn btn-secondary">Cancelar</button>
                    <button id="save-pool-btn" class="btn btn-primary">Guardar</button>
                </div>
            </div>
            
            <!-- Lista de piscinas -->
            <div id="pools-list" class="pools-grid">
                <!-- Se llenará dinámicamente -->
            </div>
            
            <h3 class="section-title mt-4"><i class="fas fa-clipboard-list"></i> Registros Diarios</h3>
            
            <div class="action-bar">
                <button id="btn-new-record" class="btn btn-primary"><i class="fas fa-plus"></i> Nueva Lectura</button>
                <button id="export-records-btn" class="btn btn-success"><i class="fas fa-file-excel"></i> Exportar</button>
                <div class="filters">
                    <select id="filter-pool" class="form-control">
                        <option value="">Selecciona una piscina</option>
                        <!-- Se llenará dinámicamente -->
                    </select>
                    <input type="date" id="filter-date" class="form-control">
                </div>
            </div>
            
            <!-- Tabla de registros (estilo EISI) -->
            <div class="table-responsive">
                <table class="records-table" id="pool-records-table">
    <thead>
        <tr>
            <th>Fecha</th>
            <th>Hora</th>
            <th>pH</th>
            <th>T(°C)</th>
            <th>Cl L</th>
            <th>Cl C</th>
            <th>Turbidez</th>
            <th>Por</th>
            <th>Acciones</th>
        </tr>
    </thead>
    <tbody>
        <!-- Se llenará dinámicamente -->
    </tbody>
</table>
                
                <!-- Controles de paginación -->
                <div id="pagination-controls" class="pagination-controls">
                    <!-- Se llenará dinámicamente -->
                </div>
            </div>
            
            <!-- Modal para añadir/editar registros -->
            <div id="record-modal-overlay" class="modal-overlay hidden">
                <div id="record-modal" class="modal-container">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 id="record-modal-title">Nueva lectura</h3>
                            <button id="close-record-modal" class="modal-close-btn">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="record-pool-select">Piscina</label>
                                    <select id="record-pool-select" class="form-control">
                                        <!-- Se llenará dinámicamente -->
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group col-6">
                                    <label for="record-date-input">Fecha</label>
                                    <input type="date" id="record-date-input" class="form-control">
                                </div>
                                <div class="form-group col-6">
                                    <label for="record-time-input">Hora</label>
                                    <input type="time" id="record-time-input" class="form-control">
                                </div>
                            </div>
                            
                            <div class="records-grid">
                                <div class="form-group">
                                    <label for="record-ph">pH</label>
                                    <input type="number" id="record-ph" class="form-control" min="0" max="14" step="0.1">
                                </div>
                                
                                <div class="form-group">
                                    <label for="record-temperature">Temperatura (°C)</label>
                                    <input type="number" id="record-temperature" class="form-control" min="0" step="0.1">
                                </div>
                                
                                <div class="form-group">
                                    <label for="record-free-chlorine">Cloro libre (mg/L)</label>
                                    <input type="number" id="record-free-chlorine" class="form-control" min="0" step="0.1">
                                </div>
                                
                                <div class="form-group">
                                    <label for="record-combined-chlorine">Cloro combinado (mg/L)</label>
                                    <input type="number" id="record-combined-chlorine" class="form-control" min="0" step="0.01">
                                </div>
                                
                                <div class="form-group">
                                    <label for="record-turbidity">Turbidez</label>
                                    <select id="record-turbidity" class="form-control">
                                        <option value="Óptima">Óptima</option>
                                        <option value="Aceptable">Aceptable</option>
                                        <option value="Deficiente">Deficiente</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="record-observations">Observaciones</label>
                                <textarea id="record-observations" class="form-control" placeholder="Observaciones adicionales..."></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button id="save-record-btn" class="btn btn-primary">Guardar datos</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Función para resetear paginación
    function resetPagination() {
        currentPage = 1;
        const paginationControls = document.getElementById('pagination-controls');
        if (paginationControls) {
            paginationControls.innerHTML = '';
        }
    }
    
    // Actualizar el selector de piscinas
    function updatePoolSelect() {
        const pools = AppState.get('pools');
        const poolSelects = [
            document.getElementById('filter-pool'),
            document.getElementById('record-pool-select')
        ];
        
        // Aplicar filtros
        const hotel = filterHotel ? filterHotel.value : '';
        const status = filterStatus ? filterStatus.value : '';
        
        // Filtrar piscinas
        let filteredPools = pools;
        if (hotel) {
            filteredPools = filteredPools.filter(pool => pool.hotel === hotel);
        }
        if (status) {
            filteredPools = filteredPools.filter(pool => pool.status === status);
        }
        
        // Actualizar cada selector
        poolSelects.forEach(select => {
            if (!select) return;
            
            // Guardar valor actual
            const currentValue = select.value;
            
            // Limpiar opciones
            select.innerHTML = '<option value="">Selecciona una piscina</option>';
            
            // Añadir opciones filtradas
            filteredPools.forEach(pool => {
                const option = document.createElement('option');
                option.value = pool.id;
                option.textContent = `${pool.name} (${pool.hotel})`;
                select.appendChild(option);
            });
            
            // Restaurar valor si sigue siendo válido
            if (currentValue && filteredPools.some(p => p.id == currentValue)) {
                select.value = currentValue;
            }
        });
    }
    
    // Mostrar formulario de piscina
    function showPoolForm(poolId = null) {
        const poolForm = document.getElementById('pool-form');
        if (!poolForm) return;
        
        if (poolId) {
            // Editar piscina existente
            const pools = AppState.get('pools');
            const pool = pools.find(p => p.id === poolId);
            
            if (!pool) {
                Utils.showToast('Piscina no encontrada', 'error');
                return;
            }
            
            // Llenar formulario
            document.getElementById('pool-name').value = pool.name;
            document.getElementById('pool-hotel').value = pool.hotel;
            document.getElementById('pool-type').value = pool.type;
            document.getElementById('pool-volume').value = pool.volume;
            document.getElementById('pool-max-bathers').value = pool.maxBathers;
            document.getElementById('pool-treatment').value = pool.waterTreatment || 'Cloro';
            document.getElementById('pool-status').value = pool.status;
            
            // Formatear fecha de inspección
            if (pool.lastInspection) {
                const date = new Date(pool.lastInspection);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                document.getElementById('pool-inspection').value = `${year}-${month}-${day}`;
            } else {
                document.getElementById('pool-inspection').value = '';
            }
            
            document.getElementById('pool-notes').value = pool.notes || '';
            
            // Actualizar título
            document.getElementById('pool-form-title').textContent = 'Editar Piscina';
            
            // Guardar ID
            currentPoolId = poolId;
        } else {
            // Nueva piscina
            document.getElementById('pool-name').value = '';
            document.getElementById('pool-hotel').value = 'Wave';
            document.getElementById('pool-type').value = 'Exterior';
            document.getElementById('pool-volume').value = '';
            document.getElementById('pool-max-bathers').value = '';
            document.getElementById('pool-treatment').value = 'Cloro';
            document.getElementById('pool-status').value = 'active';
            
            // Fecha de hoy para inspección
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('pool-inspection').value = today;
            
            document.getElementById('pool-notes').value = '';
            
            // Actualizar título
            document.getElementById('pool-form-title').textContent = 'Nueva Piscina';
            
            // Limpiar ID
            currentPoolId = null;
        }
        
        // Mostrar formulario
        poolForm.classList.remove('hidden');
        document.getElementById('pool-name').focus();
    }
    
    // Abrir modal para nuevo registro
    function openRecordModal(recordId = null) {
        const modalOverlay = document.getElementById('record-modal-overlay');
        if (!modalOverlay) {
            console.error('Error: Overlay del modal no encontrado');
            return;
        }
        
        // Establecer título
        const modalTitle = document.getElementById('record-modal-title');
        if (!modalTitle) {
            console.error('Error: Título del modal no encontrado');
            return;
        }
        
        // Preprocesar valores de formulario dependiendo de si es nuevo o edición
        if (recordId) {
            // Editar registro existente
            modalTitle.textContent = 'Editar lectura';
            
            const records = AppState.get('poolRecords');
            const record = records.find(r => r.id === recordId);
            
            if (!record) {
                Utils.showToast('Registro no encontrado', 'error');
                return;
            }
            
            // Llenar formulario
            const poolSelect = document.getElementById('record-pool-select');
            if (poolSelect) poolSelect.value = record.poolId;
            
            // Formatear fecha y hora
            const date = new Date(record.date);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            
            const dateInput = document.getElementById('record-date-input');
            const timeInput = document.getElementById('record-time-input');
            if (dateInput) dateInput.value = `${year}-${month}-${day}`;
            if (timeInput) timeInput.value = `${hours}:${minutes}`;
            
            // Establecer otros valores del formulario
            const phInput = document.getElementById('record-ph');
            const tempInput = document.getElementById('record-temperature');
            const freeClInput = document.getElementById('record-free-chlorine');
            const combClInput = document.getElementById('record-combined-chlorine');
            const turbidityInput = document.getElementById('record-turbidity');
            const obsInput = document.getElementById('record-observations');
            
            if (phInput) phInput.value = record.ph.toFixed(1);
            if (tempInput) tempInput.value = record.temperature.toFixed(1);
            if (freeClInput) freeClInput.value = record.freeChlorine.toFixed(2);
            if (combClInput) combClInput.value = record.combinedChlorine.toFixed(2);
            if (turbidityInput) turbidityInput.value = record.turbidity || 'Óptima';
            if (obsInput) obsInput.value = record.observations || '';
            
            currentRecordId = recordId;
        } else {
            // Nuevo registro
            modalTitle.textContent = 'Nueva lectura';
            
            // Usar piscina seleccionada en el filtro si hay una
            const selectedPool = document.getElementById('filter-pool')?.value;
            const poolSelect = document.getElementById('record-pool-select');
            if (poolSelect && selectedPool) {
                poolSelect.value = selectedPool;
            } else if (poolSelect) {
                poolSelect.value = '';
            }
            
            // Fecha y hora actuales
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            
            const dateInput = document.getElementById('record-date-input');
            const timeInput = document.getElementById('record-time-input');
            if (dateInput) dateInput.value = `${year}-${month}-${day}`;
            if (timeInput) timeInput.value = `${hours}:${minutes}`;
            
            // Valores predeterminados
            const phInput = document.getElementById('record-ph');
            const tempInput = document.getElementById('record-temperature');
            const freeClInput = document.getElementById('record-free-chlorine');
            const combClInput = document.getElementById('record-combined-chlorine');
            const turbidityInput = document.getElementById('record-turbidity');
            const obsInput = document.getElementById('record-observations');
            
            if (phInput) phInput.value = '7.2';
            if (tempInput) tempInput.value = '25.0';
            if (freeClInput) freeClInput.value = '1.00';
            if (combClInput) combClInput.value = '0.20';
            if (turbidityInput) turbidityInput.value = 'Óptima';
            if (obsInput) obsInput.value = '';
            
            currentRecordId = null;
        }
        
        // Mostrar el modal eliminando la clase 'hidden'
        modalOverlay.classList.remove('hidden');
        
        // Enfocar el primer campo después de mostrar el modal
        setTimeout(() => {
            const poolSelect = document.getElementById('record-pool-select');
            if (poolSelect) poolSelect.focus();
        }, 100);
    }
    
    // Ocultar modal
    function hideRecordModal() {
        const modalOverlay = document.getElementById('record-modal-overlay');
        if (modalOverlay) {
            modalOverlay.classList.add('hidden');
        }
    }
    
    // Guardar registro desde modal
    function saveRecordFromModal() {
        // Obtener valores del formulario
        const poolId = parseInt(document.getElementById('record-pool-select').value);
        const dateStr = document.getElementById('record-date-input').value;
        const timeStr = document.getElementById('record-time-input').value;
        const ph = parseFloat(document.getElementById('record-ph').value);
        const temperature = parseFloat(document.getElementById('record-temperature').value);
        const freeChlorine = parseFloat(document.getElementById('record-free-chlorine').value);
        const combinedChlorine = parseFloat(document.getElementById('record-combined-chlorine').value);
        const turbidity = document.getElementById('record-turbidity').value;
        const observations = document.getElementById('record-observations').value;
        
        // Validar campos requeridos
        if (!poolId) {
            Utils.showToast('Por favor selecciona una piscina', 'error');
            return;
        }
        
        if (!dateStr || !timeStr) {
            Utils.showToast('Por favor introduce la fecha y hora', 'error');
            return;
        }
        
        if (isNaN(ph) || ph < 0 || ph > 14) {
            Utils.showToast('Por favor introduce un valor de pH válido (0-14)', 'error');
            return;
        }
        
        if (isNaN(temperature) || temperature < 0) {
            Utils.showToast('Por favor introduce una temperatura válida', 'error');
            return;
        }
        
        if (isNaN(freeChlorine) || freeChlorine < 0) {
            Utils.showToast('Por favor introduce un valor de cloro libre válido', 'error');
            return;
        }
        
        if (isNaN(combinedChlorine) || combinedChlorine < 0) {
            Utils.showToast('Por favor introduce un valor de cloro combinado válido', 'error');
            return;
        }
        
        // Combinar fecha y hora
        const date = new Date(`${dateStr}T${timeStr}`);
        
        // Preparar datos
        const recordData = {
            poolId: poolId,
            date: date,
            ph: ph,
            temperature: temperature,
            freeChlorine: freeChlorine,
            combinedChlorine: combinedChlorine,
            turbidity: turbidity,
            observations: observations.trim(),
            createdBy: "admin", // En una aplicación real, esto vendría del usuario autenticado
            updatedAt: new Date()
        };
        
        // Obtener registros actuales
        const records = [...AppState.get('poolRecords')];
        
        if (currentRecordId) {
            // Actualizar registro existente
            const recordIndex = records.findIndex(r => r.id === currentRecordId);
            
            if (recordIndex !== -1) {
                // Mantener campos que no están en el formulario
                records[recordIndex] = {
                    ...records[recordIndex],
                    ...recordData
                };
                
                AppState.update('poolRecords', records);
                Utils.showToast('Registro actualizado correctamente', 'success');
            } else {
                Utils.showToast('Error al actualizar el registro', 'error');
            }
        } else {
            // Crear nuevo registro
            const maxId = records.reduce((max, r) => Math.max(max, r.id || 0), 0);
            
            const newRecord = {
                ...recordData,
                id: maxId + 1,
                createdAt: new Date()
            };
            
            records.push(newRecord);
            AppState.update('poolRecords', records);
            Utils.showToast('Registro creado correctamente', 'success');
        }
        
        // Cerrar modal y actualizar tabla
        hideRecordModal();
        updateRecordsTable();
    }
    
    // Guardar piscina
    function savePool() {
        // Obtener valores del formulario
        const nameEl = document.getElementById('pool-name');
        const hotelEl = document.getElementById('pool-hotel');
        const typeEl = document.getElementById('pool-type');
        const volumeEl = document.getElementById('pool-volume');
        const maxBathersEl = document.getElementById('pool-max-bathers');
        const treatmentEl = document.getElementById('pool-treatment');
        const statusEl = document.getElementById('pool-status');
        const inspectionEl = document.getElementById('pool-inspection');
        const notesEl = document.getElementById('pool-notes');
        
        // Validar campos obligatorios
        if (!nameEl.value.trim()) {
            Utils.showToast('Por favor introduce un nombre para la piscina', 'error');
            nameEl.focus();
            return;
        }
        
        if (!volumeEl.value || isNaN(parseInt(volumeEl.value)) || parseInt(volumeEl.value) <= 0) {
            Utils.showToast('Por favor introduce un volumen válido', 'error');
            volumeEl.focus();
            return;
        }
        
        if (!maxBathersEl.value || isNaN(parseInt(maxBathersEl.value)) || parseInt(maxBathersEl.value) <= 0) {
            Utils.showToast('Por favor introduce un aforo máximo válido', 'error');
            maxBathersEl.focus();
            return;
        }
        
        // Preparar datos
        const poolData = {
            name: nameEl.value.trim(),
            hotel: hotelEl.value,
            type: typeEl.value,
            volume: parseInt(volumeEl.value),
            maxBathers: parseInt(maxBathersEl.value),
            waterTreatment: treatmentEl.value,
            status: statusEl.value,
            lastInspection: inspectionEl.value ? new Date(inspectionEl.value) : null,
            notes: notesEl.value.trim(),
            updatedAt: new Date()
        };
        
        // Obtener piscinas actuales
        const pools = [...AppState.get('pools')];
        
        if (currentPoolId) {
            // Actualizar piscina existente
            const poolIndex = pools.findIndex(p => p.id === currentPoolId);
            
            if (poolIndex !== -1) {
                // Mantener campos que no están en el formulario
                pools[poolIndex] = {
                    ...pools[poolIndex],
                    ...poolData
                };
                
                AppState.update('pools', pools);
                Utils.showToast('Piscina actualizada correctamente', 'success');
            } else {
                Utils.showToast('Error al actualizar la piscina', 'error');
            }
        } else {
            // Crear nueva piscina
            const maxId = pools.reduce((max, p) => Math.max(max, p.id || 0), 0);
            
            const newPool = {
                ...poolData,
                id: maxId + 1,
                createdAt: new Date()
            };
            
            pools.push(newPool);
            AppState.update('pools', pools);
            Utils.showToast('Piscina creada correctamente', 'success');
        }
        
        // Cerrar formulario y actualizar lista
        document.getElementById('pool-form').classList.add('hidden');
        renderPools(AppState.get('pools'));
        updatePoolSelect();
    }
    
    // Renderizar lista de piscinas
    function renderPools(pools) {
        const poolsList = document.getElementById('pools-list');
        if (!poolsList) return;
        
        // Aplicar filtros
        const hotel = filterHotel ? filterHotel.value : '';
        const status = filterStatus ? filterStatus.value : '';
        
        // Filtrar piscinas
        let filteredPools = pools;
        if (hotel) {
            filteredPools = filteredPools.filter(pool => pool.hotel === hotel);
        }
        if (status) {
            filteredPools = filteredPools.filter(pool => pool.status === status);
        }
        
        // Limpiar lista
        poolsList.innerHTML = '';
        
        // Verificar si hay piscinas
        if (filteredPools.length === 0) {
            poolsList.innerHTML = '<p class="text-center">No hay piscinas que coincidan con los filtros</p>';
            return;
        }
        
        // Ordenar piscinas por hotel y nombre
        const sortedPools = [...filteredPools].sort((a, b) => {
            if (a.hotel !== b.hotel) {
                return a.hotel.localeCompare(b.hotel);
            }
            return a.name.localeCompare(b.name);
        });
        
        // Renderizar cada piscina
        sortedPools.forEach(pool => {
            // Determinar clase según estado
            let statusClass, statusLabel;
            switch (pool.status) {
                case 'active':
                    statusClass = 'status-active';
                    statusLabel = 'Activa';
                    break;
                case 'maintenance':
                    statusClass = 'status-maintenance';
                    statusLabel = 'En mantenimiento';
                    break;
                case 'closed':
                    statusClass = 'status-closed';
                    statusLabel = 'Cerrada';
                    break;
                default:
                    statusClass = '';
                    statusLabel = pool.status;
            }
            
            const poolCard = document.createElement('div');
            poolCard.className = `pool-card ${statusClass}`;
            poolCard.setAttribute('data-id', pool.id);
            
            // Generar HTML de la tarjeta
            poolCard.innerHTML = `
                <div class="pool-card-header">
                    <h3 class="pool-name">${Utils.sanitizeHTML(pool.name)}</h3>
                    <span class="pool-status">${statusLabel}</span>
                </div>
                <div class="pool-card-content">
                    <div class="pool-info">
                        <div class="pool-property">
                            <span class="property-label">Hotel:</span>
                            <span class="property-value">${pool.hotel}</span>
                        </div>
                        <div class="pool-property">
                            <span class="property-label">Tipo:</span>
                            <span class="property-value">${pool.type}</span>
                        </div>
                        <div class="pool-property">
                            <span class="property-label">Volumen:</span>
                            <span class="property-value">${pool.volume} m³</span>
                        </div>
                        <div class="pool-property">
                            <span class="property-label">Aforo máximo:</span>
                            <span class="property-value">${pool.maxBathers} personas</span>
                        </div>
                        <div class="pool-property">
                            <span class="property-label">Tratamiento:</span>
                            <span class="property-value">${pool.waterTreatment || 'No especificado'}</span>
                        </div>
                        <div class="pool-property">
                            <span class="property-label">Última inspección:</span>
                            <span class="property-value">${Utils.formatDate(pool.lastInspection) || 'No registrada'}</span>
                        </div>
                    </div>
                    ${pool.notes ? `<div class="pool-notes">${Utils.sanitizeHTML(pool.notes)}</div>` : ''}
                </div>
                <div class="pool-card-actions">
                    <button class="btn-edit-pool" data-id="${pool.id}"><i class="fas fa-edit"></i> Editar</button>
                    <button class="btn-view-records" data-id="${pool.id}"><i class="fas fa-clipboard-list"></i> Ver registros</button>
                    <div class="pool-status-actions">
                        <select class="status-change-select form-control" data-id="${pool.id}">
                            <option value="">Cambiar estado</option>
                            <option value="active" ${pool.status === 'active' ? 'disabled' : ''}>Activar</option>
                            <option value="maintenance" ${pool.status === 'maintenance' ? 'disabled' : ''}>Poner en mantenimiento</option>
                            <option value="closed" ${pool.status === 'closed' ? 'disabled' : ''}>Cerrar</option>
                        </select>
                    </div>
                </div>
            `;
            
            poolsList.appendChild(poolCard);
        });
        
        // Configurar eventos para botones y selectores
        setupPoolCardButtons();
    }
    
    // Configurar botones de las tarjetas de piscina
    function setupPoolCardButtons() {
        // Botón editar
        document.querySelectorAll('.btn-edit-pool').forEach(btn => {
            btn.addEventListener('click', () => {
                const poolId = parseInt(btn.getAttribute('data-id'));
                showPoolForm(poolId);
            });
        });
        
        // Botón ver registros
        document.querySelectorAll('.btn-view-records').forEach(btn => {
            btn.addEventListener('click', () => {
                const poolId = parseInt(btn.getAttribute('data-id'));
                // Actualizar selector de piscina y filtrar registros
                const poolSelect = document.getElementById('filter-pool');
                if (poolSelect) {
                    poolSelect.value = poolId;
                    resetPagination();
                    updateRecordsTable();
                    
                    // Scroll a la sección de registros
                    const recordsTable = document.querySelector('.records-table');
                    if (recordsTable) {
                        recordsTable.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        });
        
        // Selector de cambio de estado
        document.querySelectorAll('.status-change-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const newStatus = e.target.value;
                if (!newStatus) return; // No se ha seleccionado ningún cambio
                
                const poolId = parseInt(e.target.getAttribute('data-id'));
                updatePoolStatus(poolId, newStatus);
                
                // Resetear selector
                e.target.value = '';
            });
        });
    }
    
    // Actualizar estado de una piscina
    function updatePoolStatus(poolId, newStatus) {
        const pools = AppState.get('pools');
        const poolIndex = pools.findIndex(p => p.id === poolId);
        
        if (poolIndex === -1) {
            Utils.showToast('Piscina no encontrada', 'error');
            return;
        }
        
        // Determinar mensaje según el cambio de estado
        let message;
        if (newStatus === 'active') {
            message = pools[poolIndex].status === 'maintenance' ? 
                'La piscina ha sido reactivada tras el mantenimiento' : 
                'La piscina ha sido reabierta';
        } else if (newStatus === 'maintenance') {
            message = 'La piscina ha sido puesta en mantenimiento';
        } else if (newStatus === 'closed') {
            message = 'La piscina ha sido cerrada';
        } else {
            message = 'Estado de la piscina actualizado';
        }
        
        // Actualizar estado
        pools[poolIndex].status = newStatus;
        pools[poolIndex].updatedAt = new Date();
        
        // Guardar cambios
        AppState.update('pools', pools);
        
        // Notificar
        Utils.showToast(message, 'success');
        
        // Actualizar vista
        renderPools(pools);
        updatePoolSelect();
    }
    
    // Actualizar tabla de registros
    function updateRecordsTable() {
        const poolRecordsTable = document.getElementById('pool-records-table');
        if (!poolRecordsTable) return;
        
        const poolRecordsBody = poolRecordsTable.querySelector('tbody');
        if (!poolRecordsBody) return;
        
        // Obtener valores de filtro
        const poolId = document.getElementById('filter-pool')?.value || '';
        const dateStr = document.getElementById('filter-date')?.value || '';
        
        // Limpiar tabla
        poolRecordsBody.innerHTML = '';
        
        // Si no hay piscina seleccionada
        if (!poolId) {
            poolRecordsBody.innerHTML = '<tr><td colspan="9" class="text-center">Selecciona una piscina para ver sus registros</td></tr>';
            return;
        }
        
        // Obtener todos los registros
        const records = AppState.get('poolRecords') || [];
        
        // Filtrar por piscina y fecha
        let filteredRecords = records.filter(r => r.poolId == poolId);
        
        if (dateStr) {
            // Filtrar por fecha específica
            const filterDate = new Date(dateStr);
            filterDate.setHours(0, 0, 0, 0);
            
            const nextDay = new Date(filterDate);
            nextDay.setDate(nextDay.getDate() + 1);
            
            filteredRecords = filteredRecords.filter(r => {
                const recordDate = new Date(r.date);
                return recordDate >= filterDate && recordDate < nextDay;
            });
        }
        
        // Si no hay registros
        if (filteredRecords.length === 0) {
            poolRecordsBody.innerHTML = '<tr><td colspan="9" class="text-center">No hay registros para esta piscina en la fecha seleccionada</td></tr>';
            return;
        }
        
        // Ordenar registros por fecha (más reciente primero)
        const sortedRecords = [...filteredRecords].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        // Implementar paginación
        const totalRecords = sortedRecords.length;
        const totalPages = Math.ceil(totalRecords / recordsPerPage);
        
        // Verificar página actual
        if (currentPage > totalPages) {
            currentPage = totalPages;
        }
        
        // Filtrar solo registros de la página actual
        const startIndex = (currentPage - 1) * recordsPerPage;
        const endIndex = Math.min(startIndex + recordsPerPage, totalRecords);
        const pageRecords = sortedRecords.slice(startIndex, endIndex);
        
        // Renderizar registros
    pageRecords.forEach(record => {
        const date = new Date(record.date);
        
        // Formatear fecha y hora de forma más compacta
        const formattedDate = Utils.formatDate(date);
        const formattedTime = date.toTimeString().substring(0, 5);
        
        // Determinar clases para celdas según valores
        let phClass = '', chlorineClass = '';
        
        // pH: 7.2 - 7.6 óptimo, <7.0 o >8.0 deficiente
        if (record.ph < 7.0 || record.ph > 8.0) {
            phClass = 'value-warning';
        } else if (record.ph < 7.2 || record.ph > 7.6) {
            phClass = 'value-alert';
        }
        
        // Cloro libre: 0.5 - 2.0 mg/L óptimo, <0.3 o >3.0 deficiente
        if (record.freeChlorine < 0.3 || record.freeChlorine > 3.0) {
            chlorineClass = 'value-warning';
        } else if (record.freeChlorine < 0.5 || record.freeChlorine > 2.0) {
            chlorineClass = 'value-alert';
        }
        
        // Usar iconos para dispositivos móviles
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${formattedTime}</td>
            <td class="${phClass}">${record.ph.toFixed(1)}</td>
            <td>${record.temperature.toFixed(1)}</td>
            <td class="${chlorineClass}">${record.freeChlorine.toFixed(2)}</td>
            <td>${record.combinedChlorine.toFixed(2)}</td>
            <td>${record.turbidity}</td>
            <td>${record.createdBy ? (window.innerWidth <= 768 ? record.createdBy.substring(0, 3) : record.createdBy) : 'Sys'}</td>
            <td class="record-actions">
                <button class="btn-edit-record" data-id="${record.id}" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="btn-delete-record" data-id="${record.id}" title="Eliminar"><i class="fas fa-trash"></i></button>
            </td>
        `;
        
        poolRecordsBody.appendChild(row);
    });
        
        // Configurar eventos para botones
        setupRecordButtons();
        
        // Actualizar controles de paginación
        updatePaginationControls(totalPages);
    }
    
    // Configurar botones de los registros
    function setupRecordButtons() {
        // Botón editar registro
        document.querySelectorAll('.btn-edit-record').forEach(btn => {
            btn.addEventListener('click', () => {
                const recordId = parseInt(btn.getAttribute('data-id'));
                openRecordModal(recordId);
            });
        });
        
        // Botón eliminar registro
        document.querySelectorAll('.btn-delete-record').forEach(btn => {
            btn.addEventListener('click', () => {
                const recordId = parseInt(btn.getAttribute('data-id'));
                deleteRecord(recordId);
            });
        });
    }
    
    // Eliminar un registro
    function deleteRecord(recordId) {
        Utils.confirmAction(
            '¿Estás seguro de que deseas eliminar este registro?',
            () => {
                const records = AppState.get('poolRecords');
                const newRecords = records.filter(r => r.id !== recordId);
                
                // Guardar cambios
                AppState.update('poolRecords', newRecords);
                
                // Notificar
                Utils.showToast('Registro eliminado correctamente', 'success');
                
                // Actualizar tabla
                updateRecordsTable();
            }
        );
    }
    
    // Actualizar controles de paginación
    function updatePaginationControls(totalPages) {
        const paginationControls = document.getElementById('pagination-controls');
        if (!paginationControls) return;
        
        paginationControls.innerHTML = '';
        
        // Si solo hay una página, no mostrar controles
        if (totalPages <= 1) return;
        
        // Botón página anterior
        const prevBtn = document.createElement('button');
        prevBtn.className = `pagination-btn prev ${currentPage === 1 ? 'disabled' : ''}`;
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i> Anterior';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                updateRecordsTable();
            }
        });
        
        // Botón página siguiente
        const nextBtn = document.createElement('button');
        nextBtn.className = `pagination-btn next ${currentPage === totalPages ? 'disabled' : ''}`;
        nextBtn.innerHTML = 'Siguiente <i class="fas fa-chevron-right"></i>';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                updateRecordsTable();
            }
        });
        
        // Información de página
        const pageInfo = document.createElement('span');
        pageInfo.className = 'pagination-info';
        pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        
        // Añadir a controles
        paginationControls.appendChild(prevBtn);
        paginationControls.appendChild(pageInfo);
        paginationControls.appendChild(nextBtn);
    }
    
    // Exportar registros a Excel
    function exportPoolRecords() {
        // Obtener valores de filtro
        const poolId = document.getElementById('filter-pool')?.value || '';
        const dateStr = document.getElementById('filter-date')?.value || '';
        
        if (!poolId) {
            Utils.showToast('Por favor selecciona una piscina para exportar sus registros', 'error');
            return;
        }
        
        // Obtener la piscina
        const pools = AppState.get('pools');
        const pool = pools.find(p => p.id == poolId);
        
        if (!pool) {
            Utils.showToast('Piscina no encontrada', 'error');
            return;
        }
        
        // Obtener todos los registros
        const records = AppState.get('poolRecords');
        
        // Filtrar por piscina y fecha
        let filteredRecords = records.filter(r => r.poolId == poolId);
        
        if (dateStr) {
            // Filtrar por fecha específica
            const filterDate = new Date(dateStr);
            filterDate.setHours(0, 0, 0, 0);
            
            const nextDay = new Date(filterDate);
            nextDay.setDate(nextDay.getDate() + 1);
            
            filteredRecords = filteredRecords.filter(r => {
                const recordDate = new Date(r.date);
                return recordDate >= filterDate && recordDate < nextDay;
            });
        }
        
        // Si no hay registros
        if (filteredRecords.length === 0) {
            Utils.showToast('No hay registros para exportar con los filtros seleccionados', 'warning');
            return;
        }
        
        // Ordenar registros por fecha (más antiguo primero)
        const sortedRecords = [...filteredRecords].sort((a, b) => 
            new Date(a.date) - new Date(b.date)
        );
        
        // Preparar datos para Excel
        const excelData = sortedRecords.map(record => {
            const date = new Date(record.date);
            
            return {
                'Fecha': Utils.formatDate(date),
                'Hora': date.toTimeString().substring(0, 5),
                'pH': record.ph.toFixed(1),
                'Temperatura (°C)': record.temperature.toFixed(1),
                'Cloro libre (mg/L)': record.freeChlorine.toFixed(2),
                'Cloro combinado (mg/L)': record.combinedChlorine.toFixed(2),
                'Turbidez': record.turbidity,
                'Observaciones': record.observations || '',
                'Realizado por': record.createdBy || 'Sistema'
            };
        });
        
        // Fecha para el nombre del archivo
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        
        // Generar nombre del archivo
        const fileName = `Registros_${pool.name.replace(/\s+/g, '_')}_${pool.hotel}_${formattedDate}.xlsx`;
        
        // Exportar a Excel
        Utils.exportToExcel(excelData, fileName, `Registros ${pool.name}`);
        
        // Notificar
        Utils.showToast('Registros exportados correctamente', 'success');
    }
    
    // Inicializar módulo
    initPoolsModule();
});