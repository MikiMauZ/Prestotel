// modules/pools.js - Módulo híbrido de gestión de piscinas con protocolos integrados

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
    
    // Variables específicas para protocolos
    let currentSection = null;
    let currentProtocol = null;
    let currentCalculation = null;
    
    // Base de datos de productos químicos - integrada con tu módulo chemicals
    const PRODUCTS = {
        chlorine: {
            'AQUACLOR 180 PEDROSA': { concentration: 12, type: 'liquid', density: 1.12 },
            'CLA LEJÍA PEDROSA': { concentration: 5, type: 'liquid', density: 1.05 },
            'Hipoclorito cálcico 70%': { concentration: 70, type: 'solid', density: 1 },
            'Hipoclorito cálcico 65%': { concentration: 65, type: 'solid', density: 1 }
        },
        phUp: {
            'Carbonato sódico': { type: 'solid', factor: 0.015 },
            'Hidróxido sódico': { type: 'solid', factor: 0.012 }
        },
        phDown: {
            'AQUA-PEDROSA': { type: 'liquid', factor: 0.01, concentration: 38 },
            'Ácido Clorhídrico 33%': { type: 'liquid', factor: 0.008, concentration: 33 },
            'Bisulfato sódico': { type: 'solid', factor: 0.018 }
        }
    };
    
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
        
        // Inicializar AppState para incidencias y protocolos
        if (!AppState.get('poolIncidents')) {
            AppState.data.poolIncidents = [];
            AppState.saveToLocalStorage();
        }
        
        if (!AppState.get('protocolCalculations')) {
            AppState.data.protocolCalculations = [];
            AppState.saveToLocalStorage();
        }
        
        // Suscribirse a cambios
        AppState.subscribe('pools', renderPools);
        AppState.subscribe('poolRecords', updateRecordsTable);
        AppState.subscribe('poolIncidents', renderIncidents);
        
        // Configurar eventos
        setupEventListeners();
        
        // Cargar datos iniciales
        loadMockPoolsData();
        loadMockPoolRecordsData();
        
        // Renderizar datos iniciales
        renderPools(AppState.get('pools'));
        updatePoolSelect();
        updateRecordsTable();
        
        // Configurar tabs
        setupTabNavigation();
    }
    
    // Renderizar la estructura base del módulo con pestañas
    function renderModuleStructure() {
        poolsView.innerHTML = `
            <h2 class="section-title"><i class="fas fa-swimming-pool"></i> Gestión de Piscinas</h2>
            
            <!-- Navigation Tabs -->
            <div class="nav-tabs">
                <ul class="nav-tabs-list">
                    <li class="nav-item">
                        <a class="nav-link active" data-tab="pools-tab">
                            <i class="fas fa-swimming-pool"></i> Piscinas
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-tab="records-tab">
                            <i class="fas fa-chart-line"></i> Registros
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-tab="protocols-tab">
                            <i class="fas fa-shield-alt"></i> Protocolos
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-tab="incidents-tab">
                            <i class="fas fa-exclamation-triangle"></i> Incidencias
                        </a>
                    </li>
                </ul>
            </div>
            
            <!-- Tab Content -->
            <div class="tab-content">
                <!-- Pestaña Piscinas -->
                <div id="pools-tab" class="tab-pane active">
                    ${renderPoolsTabContent()}
                </div>
                
                <!-- Pestaña Registros -->
                <div id="records-tab" class="tab-pane">
                    ${renderRecordsTabContent()}
                </div>
                
                <!-- Pestaña Protocolos -->
                <div id="protocols-tab" class="tab-pane">
                    ${renderProtocolsTabContent()}
                </div>
                
                <!-- Pestaña Incidencias -->
                <div id="incidents-tab" class="tab-pane">
                    ${renderIncidentsTabContent()}
                </div>
            </div>
        `;
    }
    
    // Contenido de la pestaña Piscinas (tu código existente)
    function renderPoolsTabContent() {
        return `
            <div class="action-bar">
                <button id="btn-new-pool" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Nueva Piscina
                </button>
                <div class="filters">
                    <select id="filter-pool-hotel" class="form-control">
                        <option value="">Todos los hoteles</option>
                        <option value="Wave">Wave</option>
                        <option value="Sky">Sky</option>
                    </select>
                    <select id="filter-pool-status" class="form-control">
                        <option value="">Todos los estados</option>
                        <option value="active">Activa</option>
                        <option value="maintenance">Mantenimiento</option>
                        <option value="closed">Cerrada</option>
                    </select>
                </div>
            </div>
            
            <!-- Formulario para crear/editar piscina -->
            <div id="pool-form" class="form-container hidden">
                <h3 class="form-title">Nueva Piscina</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label for="pool-name">Nombre de la piscina *</label>
                        <input type="text" id="pool-name" class="form-control" placeholder="Ej: Piscina Principal">
                    </div>
                    <div class="form-group">
                        <label for="pool-hotel">Hotel *</label>
                        <select id="pool-hotel" class="form-control" required>
                            <option value="">Seleccionar hotel</option>
                            <option value="Wave">Wave</option>
                            <option value="Sky">Sky</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="pool-volume">Volumen (m³) *</label>
                        <input type="number" id="pool-volume" class="form-control" step="0.01" min="0.01" placeholder="Ej: 250.5">
                    </div>
                    <div class="form-group">
                        <label for="pool-type">Tipo de piscina</label>
                        <select id="pool-type" class="form-control">
                            <option value="outdoor">Exterior</option>
                            <option value="indoor">Interior</option>
                            <option value="spa">SPA</option>
                            <option value="kids">Infantil</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="pool-treatment">Tratamiento</label>
                        <select id="pool-treatment" class="form-control">
                            <option value="chlorine">Cloro</option>
                            <option value="salt">Sal electrólisis</option>
                            <option value="bromine">Bromo</option>
                            <option value="uv">UV + Cloro</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="pool-status">Estado inicial</label>
                        <select id="pool-status" class="form-control">
                            <option value="active">Activa</option>
                            <option value="maintenance">En mantenimiento</option>
                            <option value="closed">Cerrada</option>
                        </select>
                    </div>
                </div>
                <div class="form-actions">
                    <button id="cancel-pool-btn" type="button" class="btn btn-secondary">Cancelar</button>
                    <button id="save-pool-btn" type="button" class="btn btn-primary">Guardar</button>
                </div>
            </div>
            
            <!-- Lista de piscinas -->
            <div id="pools-list" class="pools-grid">
                <!-- Las piscinas se generarán dinámicamente -->
            </div>
        `;
    }
    
    // Contenido de la pestaña Registros (tu código existente)
    function renderRecordsTabContent() {
        return `
            <div class="action-bar">
                <button id="btn-new-record" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Nueva Lectura
                </button>
                <div class="filters">
                    <select id="filter-pool" class="form-control">
                        <option value="">Todas las piscinas</option>
                    </select>
                    <input type="date" id="filter-date" class="form-control">
                </div>
            </div>
            
            <!-- Tabla de registros -->
            <div class="records-table">
                <div class="table-container">
                    <table id="pool-records-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Piscina</th>
                                <th>Hotel</th>
                                <th>Cloro Libre</th>
                                <th>pH</th>
                                <th>Temperatura</th>
                                <th>Estado Agua</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Los registros se generarán dinámicamente -->
                        </tbody>
                    </table>
                </div>
                
                <!-- Paginación -->
                <div class="pagination">
                    <button id="prev-page" class="btn btn-secondary">Anterior</button>
                    <span id="page-info">Página 1</span>
                    <button id="next-page" class="btn btn-secondary">Siguiente</button>
                </div>
            </div>
            
            <!-- Modal para nueva lectura -->
            <div id="record-modal-overlay" class="modal-overlay hidden">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Nueva Lectura de Piscina</h3>
                        <button id="close-record-modal" class="btn-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="record-form">
                            <!-- Formulario de lectura existente -->
                        </form>
                    </div>
                </div>
            </div>
        `;
    }
    
    // ===============================================
    // NUEVA SECCIÓN: PROTOCOLOS DE ACTUACIÓN
    // ===============================================
    
    function renderProtocolsTabContent() {
        return `
            <div class="protocols-header">
                <h3>🏊 Protocolos de Actuación Piscinas</h3>
                <p>Calculadora Automática - Productos Pedrosa | Cumplimiento Normativo RD 742/2013</p>
            </div>
            
            <!-- Section Selector -->
            <div class="section-selector">
                <div class="section-card emergency" data-section="emergency">
                    <span class="card-icon">🚨</span>
                    <div class="card-title">Protocolos de Emergencia</div>
                    <div class="card-description">Heces sólidas/líquidas, vómitos, Pseudomonas aeruginosa con cálculos automáticos</div>
                </div>
                <div class="section-card correction" data-section="correction">
                    <span class="card-icon">⚖️</span>
                    <div class="card-title">Correcciones Diarias</div>
                    <div class="card-description">Ajuste de cloro libre y pH con dosis exactas de productos Pedrosa</div>
                </div>
                <div class="section-card report" data-section="report">
                    <span class="card-icon">📋</span>
                    <div class="card-title">Memorias de Actuación</div>
                    <div class="card-description">Generar documentos oficiales de registro de incidencias según normativa</div>
                </div>
            </div>
            
            <!-- Protocol Selectors -->
            <div class="protocol-selector" id="emergency-selector">
                <h4>Seleccionar Protocolo de Emergencia</h4>
                <div class="protocol-buttons">
                    <div class="protocol-btn solid-feces" data-protocol="solid-feces">
                        <h5>🟤 Heces Sólidas</h5>
                        <p>2 ppm × 30 minutos | pH &lt;7.5</p>
                    </div>
                    <div class="protocol-btn liquid-feces" data-protocol="liquid-feces">
                        <h5>💧 Heces Líquidas/Diarrea</h5>
                        <p>20 ppm × 13 horas | Hipercloración</p>
                    </div>
                    <div class="protocol-btn vomit" data-protocol="vomit">
                        <h5>🤮 Vómitos</h5>
                        <p>Evaluación + protocolo específico</p>
                    </div>
                    <div class="protocol-btn pseudomonas" data-protocol="pseudomonas">
                        <h5>🦠 Pseudomonas Aeruginosa</h5>
                        <p>12.5 ppm × 24-48 horas</p>
                    </div>
                </div>
            </div>
            
            <div class="correction-selector" id="correction-selector">
                <h4>Seleccionar Tipo de Corrección</h4>
                <div class="protocol-buttons">
                    <div class="protocol-btn" data-correction="chlorine">
                        <h5>💧 Corrección Cloro Libre</h5>
                        <p>Ajuste de concentración con productos Pedrosa</p>
                    </div>
                    <div class="protocol-btn" data-correction="ph-up">
                        <h5>📈 Subir pH</h5>
                        <p>Carbonato sódico / Hidróxido sódico</p>
                    </div>
                    <div class="protocol-btn" data-correction="ph-down">
                        <h5>📉 Bajar pH</h5>
                        <p>AQUA-PEDROSA / Ácido Clorhídrico</p>
                    </div>
                </div>
            </div>
            
            <!-- Forms Container -->
            <div class="form-container" id="calculation-form">
                <h4 id="form-title">Formulario de Cálculo</h4>
                <form id="calculator-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="pool-select">Piscina *</label>
                            <select id="pool-select" name="pool-select" required>
                                <option value="">Seleccionar piscina...</option>
                            </select>
                        </div>
                        <div class="form-group" id="product-group">
                            <label for="product">Producto Pedrosa *</label>
                            <select id="product" name="product" required>
                                <option value="">Seleccionar producto...</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row" id="current-values">
                        <div class="form-group" id="current-chlorine-group">
                            <label for="current-chlorine">Cloro libre actual (ppm)</label>
                            <input type="number" id="current-chlorine" name="current-chlorine" min="0" step="0.1">
                        </div>
                        <div class="form-group" id="target-chlorine-group">
                            <label for="target-chlorine">Cloro libre deseado (ppm)</label>
                            <input type="number" id="target-chlorine" name="target-chlorine" min="0" step="0.1">
                        </div>
                        <div class="form-group" id="current-ph-group">
                            <label for="current-ph">pH actual</label>
                            <input type="number" id="current-ph" name="current-ph" min="6.0" max="9.0" step="0.1">
                        </div>
                        <div class="form-group" id="target-ph-group">
                            <label for="target-ph">pH deseado</label>
                            <input type="number" id="target-ph" name="target-ph" min="6.0" max="9.0" step="0.1">
                        </div>
                    </div>

                    <button type="submit" class="calculate-btn">
                        <span>🧮 Calcular Dosis y Protocolo</span>
                        <span class="loading hidden"></span>
                    </button>
                </form>
            </div>
            
            <!-- Results Section -->
            <div class="results" id="results-section">
                <div id="calculation-results"></div>
                <div id="protocol-steps"></div>
            </div>
            
            <!-- Export Section -->
            <div class="export-section" id="export-section">
                <h4>📋 Generar Memoria de Actuación</h4>
                <p>Exportar protocolo y cálculos realizados:</p>
                <div class="export-buttons">
                    <button class="export-btn" onclick="exportProtocolToPDF()">
                        📄 Exportar PDF
                    </button>
                    <button class="export-btn" onclick="copyProtocolToClipboard()">
                        📋 Copiar Texto
                    </button>
                    <button class="export-btn" onclick="saveToIncidents()">
                        💾 Guardar Incidencia
                    </button>
                </div>
            </div>
        `;
    }
    
    // Contenido de la pestaña Incidencias
    function renderIncidentsTabContent() {
        return `
            <div class="action-bar">
                <button id="btn-new-incident" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Nueva Incidencia
                </button>
                <div class="filters">
                    <select id="filter-incident-pool" class="form-control">
                        <option value="">Todas las piscinas</option>
                    </select>
                    <select id="filter-incident-type" class="form-control">
                        <option value="">Todos los tipos</option>
                        <option value="solid-feces">Heces Sólidas</option>
                        <option value="liquid-feces">Heces Líquidas</option>
                        <option value="vomit">Vómitos</option>
                        <option value="pseudomonas">Pseudomonas</option>
                        <option value="correction">Corrección</option>
                    </select>
                    <input type="date" id="filter-incident-date" class="form-control">
                </div>
            </div>
            
            <!-- Lista de incidencias -->
            <div id="incidents-list" class="incidents-container">
                <!-- Las incidencias se generarán dinámicamente -->
            </div>
        `;
    }
    
    // ===============================================
    // FUNCIONES DE PROTOCOLOS
    // ===============================================
    
    function setupTabNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetTab = this.getAttribute('data-tab');
                
                // Actualizar tabs activos
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                
                this.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
                
                // Inicializar contenido específico del tab
                if (targetTab === 'protocols-tab') {
                    initProtocolsTab();
                } else if (targetTab === 'incidents-tab') {
                    initIncidentsTab();
                }
            });
        });
    }
    
    function initProtocolsTab() {
        // Llenar selector de piscinas
        updatePoolSelector();
        
        // Event listeners para protocolos
        setupProtocolEventListeners();
    }
    
    function setupProtocolEventListeners() {
        // Section selection
        document.querySelectorAll('.section-card').forEach(card => {
            card.addEventListener('click', function() {
                selectSection(this.dataset.section);
            });
        });

        // Protocol selection
        document.querySelectorAll('.protocol-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                if (this.dataset.protocol) {
                    selectProtocol(this.dataset.protocol);
                } else if (this.dataset.correction) {
                    selectCorrection(this.dataset.correction);
                }
            });
        });

        // Form submission
        const calculatorForm = document.getElementById('calculator-form');
        if (calculatorForm) {
            calculatorForm.addEventListener('submit', function(e) {
                e.preventDefault();
                calculateDose();
            });
        }
    }
    
    function updatePoolSelector() {
        const poolSelect = document.getElementById('pool-select');
        if (!poolSelect) return;
        
        const pools = AppState.get('pools');
        poolSelect.innerHTML = '<option value="">Seleccionar piscina...</option>';
        
        pools.forEach(pool => {
            const option = document.createElement('option');
            option.value = pool.id;
            option.textContent = `${pool.name} (${pool.hotel}) - ${pool.volume} m³`;
            option.dataset.volume = pool.volume;
            poolSelect.appendChild(option);
        });
    }
    
    function selectSection(section) {
        currentSection = section;
        
        // Update active section card
        document.querySelectorAll('.section-card').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Show appropriate selector
        document.querySelectorAll('.protocol-selector, .correction-selector').forEach(sel => {
            sel.classList.remove('active');
        });
        
        if (section === 'emergency') {
            document.getElementById('emergency-selector').classList.add('active');
        } else if (section === 'correction') {
            document.getElementById('correction-selector').classList.add('active');
        }

        // Hide form and results
        hideFormAndResults();
    }
    
    function selectProtocol(protocol) {
        currentProtocol = protocol;
        
        // Update active protocol button
        document.querySelectorAll('.protocol-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-protocol="${protocol}"]`).classList.add('active');

        setupEmergencyForm(protocol);
        showForm();
    }
    
    function selectCorrection(correction) {
        currentProtocol = correction;
        
        // Update active correction button
        document.querySelectorAll('.protocol-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-correction="${correction}"]`).classList.add('active');

        setupCorrectionForm(correction);
        showForm();
    }
    
    function setupEmergencyForm(protocol) {
        const formTitle = document.getElementById('form-title');
        const productSelect = document.getElementById('product');
        
        // Set form title
        const titles = {
            'solid-feces': '🟤 Protocolo Heces Sólidas - Cálculo de Dosis',
            'liquid-feces': '💧 Protocolo Heces Líquidas/Diarrea - Hipercloración',
            'vomit': '🤮 Protocolo Vómitos - Evaluación y Tratamiento',
            'pseudomonas': '🦠 Protocolo Pseudomonas Aeruginosa - Tratamiento Específico'
        };
        formTitle.textContent = titles[protocol];

        // Setup product options
        productSelect.innerHTML = '<option value="">Seleccionar producto...</option>';
        Object.keys(PRODUCTS.chlorine).forEach(product => {
            const option = document.createElement('option');
            option.value = product;
            option.textContent = product;
            productSelect.appendChild(option);
        });

        // Show/hide form fields
        document.getElementById('current-chlorine-group').style.display = 'none';
        document.getElementById('target-chlorine-group').style.display = 'none';
        document.getElementById('current-ph-group').style.display = 'block';
        document.getElementById('target-ph-group').style.display = 'none';
    }
    
    function setupCorrectionForm(correction) {
        const formTitle = document.getElementById('form-title');
        const productSelect = document.getElementById('product');
        
        // Set form title
        const titles = {
            'chlorine': '💧 Corrección Cloro Libre - Cálculo de Dosis',
            'ph-up': '📈 Corrección pH - Subir pH',
            'ph-down': '📉 Corrección pH - Bajar pH'
        };
        formTitle.textContent = titles[correction];

        // Setup product options
        productSelect.innerHTML = '<option value="">Seleccionar producto...</option>';
        
        let products = {};
        if (correction === 'chlorine') {
            products = PRODUCTS.chlorine;
        } else if (correction === 'ph-up') {
            products = PRODUCTS.phUp;
        } else if (correction === 'ph-down') {
            products = PRODUCTS.phDown;
        }

        Object.keys(products).forEach(product => {
            const option = document.createElement('option');
            option.value = product;
            option.textContent = product;
            productSelect.appendChild(option);
        });

        // Show/hide form fields based on correction type
        if (correction === 'chlorine') {
            document.getElementById('current-chlorine-group').style.display = 'block';
            document.getElementById('target-chlorine-group').style.display = 'block';
            document.getElementById('current-ph-group').style.display = 'block';
            document.getElementById('target-ph-group').style.display = 'none';
        } else {
            document.getElementById('current-chlorine-group').style.display = 'none';
            document.getElementById('target-chlorine-group').style.display = 'none';
            document.getElementById('current-ph-group').style.display = 'block';
            document.getElementById('target-ph-group').style.display = 'block';
        }
    }
    
    function showForm() {
        document.getElementById('calculation-form').classList.add('active');
        document.getElementById('results-section').classList.remove('active');
        document.getElementById('export-section').classList.remove('active');
        
        // Scroll to form
        document.getElementById('calculation-form').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    function hideFormAndResults() {
        document.getElementById('calculation-form').classList.remove('active');
        document.getElementById('results-section').classList.remove('active');
        document.getElementById('export-section').classList.remove('active');
    }
    
    function calculateDose() {
        // Show loading
        const loadingSpinner = document.querySelector('.loading');
        const buttonText = document.querySelector('.calculate-btn span:first-child');
        loadingSpinner.classList.remove('hidden');
        buttonText.textContent = 'Calculando...';

        // Get form data
        const formData = new FormData(document.getElementById('calculator-form'));
        const data = Object.fromEntries(formData.entries());

        // Get pool volume
        const poolSelect = document.getElementById('pool-select');
        const selectedOption = poolSelect.options[poolSelect.selectedIndex];
        const volume = selectedOption ? parseFloat(selectedOption.dataset.volume) : null;

        // Validate required fields
        if (!data['pool-select'] || !data.product || !volume) {
            showAlert('Por favor, completa todos los campos obligatorios.', 'error');
            resetButton();
            return;
        }

        try {
            // Add volume to data
            data.volume = volume;
            
            // Perform calculation based on current protocol
            if (currentSection === 'emergency') {
                currentCalculation = calculateEmergencyProtocol(data);
            } else if (currentSection === 'correction') {
                currentCalculation = calculateCorrection(data);
            }

            // Display results
            displayResults(currentCalculation);
            
            // Show export section
            document.getElementById('export-section').classList.add('active');

        } catch (error) {
            showAlert(`Error en el cálculo: ${error.message}`, 'error');
        }

        resetButton();
    }

    function calculateEmergencyProtocol(data) {
        const volume = parseFloat(data.volume);
        const product = data.product;
        const currentpH = parseFloat(data['current-ph']) || 7.0;
        
        const productData = PRODUCTS.chlorine[product];
        if (!productData) {
            throw new Error('Producto no encontrado');
        }

        let targetPpm = 0;
        let treatmentTime = '';
        let protocolSteps = [];
        let alerts = [];

        // Check pH condition
        if (currentpH >= 7.5) {
            alerts.push({
                type: 'critical',
                message: `⚠️ ATENCIÓN: pH actual (${currentpH}) debe ser <7.5 para máxima eficacia del cloro. Ajustar pH antes del tratamiento.`
            });
        }

        // Set target concentration based on protocol
        switch (currentProtocol) {
            case 'solid-feces':
                targetPpm = 2;
                treatmentTime = '30 minutos';
                protocolSteps = getSolidFecesSteps();
                break;
            case 'liquid-feces':
                targetPpm = 20;
                treatmentTime = '13 horas (o 40 ppm × 7 horas)';
                protocolSteps = getLiquidFecesSteps();
                break;
            case 'vomit':
                targetPpm = 2;
                treatmentTime = '30 minutos (si no infeccioso)';
                protocolSteps = getVomitSteps();
                break;
            case 'pseudomonas':
                targetPpm = 12.5;
                treatmentTime = '24-48 horas';
                protocolSteps = getPseudomonasSteps();
                break;
        }

        // Calculate required amount
        const chlorineNeeded = (targetPpm * volume) / 1000; // kg of pure chlorine
        const productNeeded = chlorineNeeded / (productData.concentration / 100);
        
        let amount, unit, dosePerM3;
        if (productData.type === 'liquid') {
            amount = productNeeded / productData.density; // Convert to liters
            unit = 'L';
            dosePerM3 = amount / volume;
        } else {
            amount = productNeeded;
            unit = 'kg';
            dosePerM3 = amount / volume;
        }

        return {
            protocol: currentProtocol,
            poolId: data['pool-select'],
            volume: volume,
            product: product,
            targetPpm: targetPpm,
            amount: Math.round(amount * 100) / 100,
            unit: unit,
            dosePerM3: Math.round(dosePerM3 * 1000) / 1000,
            chlorineActive: Math.round(chlorineNeeded * 1000) / 1000,
            treatmentTime: treatmentTime,
            steps: protocolSteps,
            alerts: alerts,
            currentpH: currentpH,
            timestamp: new Date()
        };
    }

    function calculateCorrection(data) {
        const volume = parseFloat(data.volume);
        const product = data.product;
        const currentpH = parseFloat(data['current-ph']) || 7.0;
        
        let amount, unit, dosePerM3, targetValue, currentValue, increment;
        let steps = [];
        let alerts = [];

        if (currentProtocol === 'chlorine') {
            currentValue = parseFloat(data['current-chlorine']) || 0;
            targetValue = parseFloat(data['target-chlorine']) || 0;
            
            if (targetValue <= currentValue) {
                throw new Error('El valor deseado debe ser mayor que el actual');
            }

            increment = targetValue - currentValue;
            const productData = PRODUCTS.chlorine[product];
            const chlorineNeeded = (increment * volume) / 1000;
            const productNeeded = chlorineNeeded / (productData.concentration / 100);
            
            if (productData.type === 'liquid') {
                amount = productNeeded / productData.density;
                unit = 'L';
            } else {
                amount = productNeeded;
                unit = 'kg';
            }
            
            dosePerM3 = amount / volume;
            steps = getChlorineSteps();
            
            if (currentpH >= 7.5) {
                alerts.push({
                    type: 'warning',
                    message: `💡 RECOMENDACIÓN: pH actual (${currentpH}) es alto. Para mejor eficacia, considera ajustar pH a <7.5`
                });
            }

        } else if (currentProtocol === 'ph-up') {
            currentValue = currentpH;
            targetValue = parseFloat(data['target-ph']) || 7.0;
            
            if (targetValue <= currentValue) {
                throw new Error('El pH deseado debe ser mayor que el actual');
            }

            increment = targetValue - currentValue;
            const productData = PRODUCTS.phUp[product];
            amount = (increment * 10) * productData.factor * volume;
            unit = 'kg';
            dosePerM3 = amount / volume;
            steps = getpHUpSteps();

        } else if (currentProtocol === 'ph-down') {
            currentValue = currentpH;
            targetValue = parseFloat(data['target-ph']) || 7.0;
            
            if (targetValue >= currentValue) {
                throw new Error('El pH deseado debe ser menor que el actual');
            }

            increment = currentValue - targetValue;
            const productData = PRODUCTS.phDown[product];
            
            if (productData.type === 'liquid') {
                amount = (increment * 10) * productData.factor * volume;
                unit = 'L';
            } else {
                amount = (increment * 10) * productData.factor * volume;
                unit = 'kg';
            }
            
            dosePerM3 = amount / volume;
            steps = getpHDownSteps();
        }

        return {
            protocol: currentProtocol,
            poolId: data['pool-select'],
            volume: volume,
            product: product,
            amount: Math.round(amount * 100) / 100,
            unit: unit,
            dosePerM3: Math.round(dosePerM3 * 1000) / 1000,
            currentValue: currentValue,
            targetValue: targetValue,
            increment: Math.round(increment * 100) / 100,
            treatmentTime: '2-4 horas',
            steps: steps,
            alerts: alerts,
            currentpH: currentpH,
            timestamp: new Date()
        };
    }

    function displayResults(calculation) {
        const resultsContainer = document.getElementById('calculation-results');
        const protocolContainer = document.getElementById('protocol-steps');
        
        // Get pool name
        const pools = AppState.get('pools');
        const pool = pools.find(p => p.id == calculation.poolId);
        const poolName = pool ? `${pool.name} (${pool.hotel})` : 'Piscina desconocida';
        
        // Display alerts first
        let alertsHtml = '';
        calculation.alerts.forEach(alert => {
            alertsHtml += `<div class="alert ${alert.type === 'critical' ? 'critical' : ''}">${alert.message}</div>`;
        });

        // Display calculation results
        let resultsHtml = `
            ${alertsHtml}
            <div class="result-card">
                <div class="result-title">📊 Resultados del Cálculo</div>
                <div class="result-content">
                    <p><strong>Piscina:</strong> ${poolName}</p>
                    <p><strong>Volumen:</strong> ${calculation.volume} m³</p>
                    <p><strong>Producto seleccionado:</strong> ${calculation.product}</p>
                    <p><strong>Cantidad necesaria:</strong> ${calculation.amount} ${calculation.unit}</p>
                    <p><strong>Dosis por m³:</strong> ${calculation.dosePerM3} ${calculation.unit}/m³</p>
        `;

        if (currentSection === 'emergency') {
            resultsHtml += `
                    <p><strong>Concentración objetivo:</strong> ${calculation.targetPpm} ppm</p>
                    <p><strong>Cloro activo:</strong> ${calculation.chlorineActive} kg</p>
            `;
        } else {
            resultsHtml += `
                    <p><strong>Valor actual:</strong> ${calculation.currentValue} ${currentProtocol === 'chlorine' ? 'ppm' : 'pH'}</p>
                    <p><strong>Valor objetivo:</strong> ${calculation.targetValue} ${currentProtocol === 'chlorine' ? 'ppm' : 'pH'}</p>
                    <p><strong>Incremento:</strong> +${calculation.increment} ${currentProtocol === 'chlorine' ? 'ppm' : 'unidades pH'}</p>
            `;
        }

        resultsHtml += `
                    <p><strong>Tiempo de tratamiento:</strong> ${calculation.treatmentTime}</p>
                    <div class="highlight">
                        <strong>💡 Equivalencia práctica:</strong> ${Math.round(calculation.amount * 1000)} mL / ${Math.ceil(calculation.amount * 10) / 10} ${calculation.unit}
                    </div>
                </div>
            </div>
        `;

        resultsContainer.innerHTML = resultsHtml;

        // Display protocol steps
        let stepsHtml = `
            <div class="result-card">
                <div class="result-title">📋 Protocolo de Actuación Paso a Paso</div>
                <div class="protocol-steps">
        `;

        calculation.steps.forEach((step, index) => {
            stepsHtml += `
                <div class="protocol-step">
                    <div class="step-number">${index + 1}</div>
                    <div class="step-content">${step}</div>
                </div>
            `;
        });

        stepsHtml += `
                </div>
            </div>
        `;

        protocolContainer.innerHTML = stepsHtml;

        // Show results
        document.getElementById('results-section').classList.add('active');
        
        // Scroll to results
        document.getElementById('results-section').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    function resetButton() {
        const loadingSpinner = document.querySelector('.loading');
        const buttonText = document.querySelector('.calculate-btn span:first-child');
        loadingSpinner.classList.add('hidden');
        buttonText.textContent = '🧮 Calcular Dosis y Protocolo';
    }

    function showAlert(message, type = 'warning') {
        // Use Utils.showToast if available, otherwise create simple alert
        if (typeof Utils !== 'undefined' && Utils.showToast) {
            Utils.showToast(message, type);
        } else {
            alert(message);
        }
    }

    // Protocol Steps Functions
    function getSolidFecesSteps() {
        return [
            "🚨 <strong>Cerrar piscina</strong> inmediatamente y desalojar a todos los bañistas",
            "🥄 <strong>Retirar heces</strong> con cesta/red (NUNCA aspirar directamente)",
            "🧽 <strong>Desinfectar utensilios</strong> utilizados con lejía al 1%",
            "⚗️ <strong>Ajustar parámetros</strong>: Aplicar dosis calculada para alcanzar 2 ppm de cloro libre",
            "🕐 <strong>Mantener tratamiento</strong> durante 30 minutos con recirculación activa",
            "✅ <strong>Verificar y reabrir</strong>: Confirmar niveles correctos antes de permitir el acceso"
        ];
    }

    function getLiquidFecesSteps() {
        return [
            "🚨 <strong>Cerrar piscina</strong> inmediatamente y desalojar a todos los bañistas",
            "🥄 <strong>Retirar heces visibles</strong> con red/cubo (NO aspirar)",
            "⚙️ <strong>Desconectar sistema</strong> de desinfección automática",
            "⚗️ <strong>Elevar cloro libre a 20 ppm</strong>: Aplicar dosis calculada + ajustar pH <7.5",
            "🕐 <strong>Mantener hipercloración</strong> durante 13 horas (o 40 ppm × 7 horas)",
            "📊 <strong>Controlar cada 2 horas</strong> los niveles de cloro y pH",
            "🧹 <strong>Aspirar fondo y paredes</strong> → dirigir agua directamente al alcantarillado",
            "🔄 <strong>Contralavado de filtros</strong> → agua al alcantarillado",
            "⚖️ <strong>Neutralizar cloro</strong> gradualmente hasta 0.5-2 ppm",
            "🔌 <strong>Reconectar sistema</strong> de dosificación automática"
        ];
    }

    function getVomitSteps() {
        return [
            "🤮 <strong>Evaluar naturaleza</strong>: Determinar si los vómitos parecen infecciosos",
            "⚠️ <strong>Si parecen infecciosos</strong>: Aplicar protocolo completo de heces líquidas",
            "✅ <strong>Si NO infecciosos</strong>: Continuar con protocolo reducido",
            "🚨 <strong>Desalojar temporalmente</strong> el área afectada",
            "🥄 <strong>Retirar material visible</strong> con utensilios desechables",
            "⚗️ <strong>Aplicar tratamiento</strong>: 2 ppm cloro libre + pH <7.5 durante 30 minutos"
        ];
    }

    function getPseudomonasSteps() {
        return [
            "🚨 <strong>CIERRE INMEDIATO</strong> de piscina/SPA al detectar en análisis",
            "🧽 <strong>Vaciar skimmers</strong> completamente y raspar interior con cepillo duro",
            "🪣 <strong>Raspar bordes del vaso</strong> en toda la superficie perimetral",
            "🧹 <strong>Limpiar rebosaderos</strong> y canales perimetrales completamente",
            "🪥 <strong>Cepillar paredes</strong> especialmente en zona de línea de flotación",
            "💧 <strong>Renovar agua superficial</strong>: Eliminar 10-15 cm de superficie",
            "🔄 <strong>Rellenar con agua nueva</strong> hasta nivel normal",
            "⚗️ <strong>Hipercloración específica</strong>: Aplicar dosis para 12.5 ppm cloro libre",
            "📊 <strong>Ajustar pH</strong> entre 7.0-7.5 para máxima eficacia",
            "🕐 <strong>Mantener 24-48 horas</strong> con recirculación continua",
            "🔄 <strong>Contralavados cada 6-8 horas</strong> durante el tratamiento",
            "🔬 <strong>Tomar nueva muestra</strong> para análisis tras finalizar tratamiento",
            "✅ <strong>Esperar resultado negativo</strong> antes de reapertura"
        ];
    }

    function getChlorineSteps() {
        return [
            "📊 <strong>Medir parámetros actuales</strong>: Confirmar cloro libre y pH",
            "⚗️ <strong>Aplicar dosis calculada</strong> distribuyendo uniformemente por la piscina",
            "🔄 <strong>Activar recirculación</strong> para homogeneizar el tratamiento",
            "🕐 <strong>Esperar 15-30 minutos</strong> para completa disolución y mezcla",
            "📊 <strong>Verificar concentración final</strong>: Confirmar nivel objetivo alcanzado"
        ];
    }

    function getpHUpSteps() {
        return [
            "📊 <strong>Medir pH actual</strong>: Confirmar valor de partida",
            "⚗️ <strong>Aplicar dosis calculada</strong> distribuyendo el producto sólido uniformemente",
            "🔄 <strong>Activar recirculación</strong> para acelerar disolución",
            "🕐 <strong>Esperar 2-4 horas</strong> para estabilización completa",
            "📊 <strong>Verificar pH final</strong>: Confirmar valor objetivo alcanzado"
        ];
    }

    function getpHDownSteps() {
        return [
            "📊 <strong>Medir pH actual</strong>: Confirmar valor de partida",
            "⚗️ <strong>Aplicar dosis calculada</strong> con precaución y distribución uniforme",
            "🔄 <strong>Activar recirculación</strong> para homogeneización",
            "🕐 <strong>Esperar 2-4 horas</strong> para estabilización completa",
            "📊 <strong>Verificar pH final</strong>: Confirmar valor objetivo alcanzado"
        ];
    }

    // ===============================================
    // FUNCIONES DE EXPORT Y GUARDADO
    // ===============================================

    window.exportProtocolToPDF = function() {
        if (!currentCalculation) {
            showAlert('No hay cálculos para exportar', 'error');
            return;
        }

        // Simple export to text for now - you can integrate jsPDF later
        const content = generateProtocolText();
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `protocolo-piscina-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    window.copyProtocolToClipboard = function() {
        if (!currentCalculation) {
            showAlert('No hay cálculos para copiar', 'error');
            return;
        }

        const content = generateProtocolText();
        navigator.clipboard.writeText(content).then(() => {
            showAlert('Protocolo copiado al portapapeles', 'success');
        }).catch(() => {
            showAlert('Error al copiar al portapapeles', 'error');
        });
    };

    window.saveToIncidents = function() {
        if (!currentCalculation) {
            showAlert('No hay cálculos para guardar', 'error');
            return;
        }

        const incidents = AppState.get('poolIncidents') || [];
        const pools = AppState.get('pools');
        const pool = pools.find(p => p.id == currentCalculation.poolId);

        const newIncident = {
            id: Date.now(),
            poolId: currentCalculation.poolId,
            poolName: pool ? pool.name : 'Desconocida',
            hotel: pool ? pool.hotel : 'Desconocido',
            type: currentCalculation.protocol,
            protocol: currentCalculation,
            createdAt: new Date(),
            createdBy: 'usuario-actual', // You can get this from your auth system
            status: 'aplicado'
        };

        incidents.push(newIncident);
        AppState.update('poolIncidents', incidents);
        
        showAlert('Incidencia guardada correctamente', 'success');
        
        // Switch to incidents tab
        document.querySelector('[data-tab="incidents-tab"]').click();
    };

    function generateProtocolText() {
        const pools = AppState.get('pools');
        const pool = pools.find(p => p.id == currentCalculation.poolId);
        const poolName = pool ? `${pool.name} (${pool.hotel})` : 'Piscina desconocida';

        const protocolNames = {
            'solid-feces': 'Heces Sólidas',
            'liquid-feces': 'Heces Líquidas/Diarrea - Hipercloración',
            'vomit': 'Vómitos',
            'pseudomonas': 'Pseudomonas Aeruginosa',
            'chlorine': 'Corrección Cloro Libre',
            'ph-up': 'Corrección pH - Subir',
            'ph-down': 'Corrección pH - Bajar'
        };

        let content = `MEMORIA DE ACTUACIÓN - PISCINA
============================================

Fecha: ${new Date().toLocaleDateString('es-ES')}
Hora: ${new Date().toLocaleTimeString('es-ES')}

PROTOCOLO: ${protocolNames[currentCalculation.protocol]}
PISCINA: ${poolName}

DATOS DEL CÁLCULO:
- Volumen de la piscina: ${currentCalculation.volume} m³
- Producto utilizado: ${currentCalculation.product}
- Cantidad necesaria: ${currentCalculation.amount} ${currentCalculation.unit}
- Dosis por m³: ${currentCalculation.dosePerM3} ${currentCalculation.unit}/m³
- Tiempo de tratamiento: ${currentCalculation.treatmentTime}

PROTOCOLO DE ACTUACIÓN:
`;

        currentCalculation.steps.forEach((step, index) => {
            content += `${index + 1}. ${step.replace(/<[^>]*>/g, '')}\n`;
        });

        content += `
TÉCNICO RESPONSABLE:
Nombre: ________________________
Firma: ________________________
Fecha: ________________________

============================================
Documento generado por Sistema Prestotel
`;

        return content;
    }

    // ===============================================
    // FUNCIONES DE INCIDENCIAS
    // ===============================================

    function initIncidentsTab() {
        updateIncidentFilters();
        renderIncidents(AppState.get('poolIncidents') || []);
    }

    function updateIncidentFilters() {
        const poolFilter = document.getElementById('filter-incident-pool');
        if (!poolFilter) return;

        const pools = AppState.get('pools');
        poolFilter.innerHTML = '<option value="">Todas las piscinas</option>';
        
        pools.forEach(pool => {
            const option = document.createElement('option');
            option.value = pool.id;
            option.textContent = `${pool.name} (${pool.hotel})`;
            poolFilter.appendChild(option);
        });
    }

    function renderIncidents(incidents) {
        const incidentsList = document.getElementById('incidents-list');
        if (!incidentsList) return;

        if (incidents.length === 0) {
            incidentsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list fa-3x"></i>
                    <h3>No hay incidencias registradas</h3>
                    <p>Las incidencias de protocolos aplicados aparecerán aquí</p>
                </div>
            `;
            return;
        }

        const incidentsHtml = incidents.map(incident => {
            const protocolNames = {
                'solid-feces': 'Heces Sólidas',
                'liquid-feces': 'Heces Líquidas',
                'vomit': 'Vómitos',
                'pseudomonas': 'Pseudomonas',
                'chlorine': 'Corrección Cloro',
                'ph-up': 'Subir pH',
                'ph-down': 'Bajar pH'
            };

            const typeClass = {
                'solid-feces': 'warning',
                'liquid-feces': 'danger',
                'vomit': 'warning',
                'pseudomonas': 'danger',
                'chlorine': 'info',
                'ph-up': 'info',
                'ph-down': 'info'
            };

            return `
                <div class="incident-card">
                    <div class="incident-header">
                        <div class="incident-type ${typeClass[incident.type]}">
                            ${protocolNames[incident.type] || incident.type}
                        </div>
                        <div class="incident-date">
                            ${new Date(incident.createdAt).toLocaleDateString('es-ES')}
                        </div>
                    </div>
                    <div class="incident-body">
                        <h4>${incident.poolName} - ${incident.hotel}</h4>
                        <p><strong>Producto usado:</strong> ${incident.protocol.product}</p>
                        <p><strong>Cantidad:</strong> ${incident.protocol.amount} ${incident.protocol.unit}</p>
                        <p><strong>Tiempo de tratamiento:</strong> ${incident.protocol.treatmentTime}</p>
                    </div>
                    <div class="incident-actions">
                        <button class="btn btn-sm btn-secondary" onclick="viewIncidentDetails(${incident.id})">
                            <i class="fas fa-eye"></i> Ver detalles
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="exportIncident(${incident.id})">
                            <i class="fas fa-download"></i> Exportar
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        incidentsList.innerHTML = incidentsHtml;
    }

    window.viewIncidentDetails = function(incidentId) {
        const incidents = AppState.get('poolIncidents') || [];
        const incident = incidents.find(i => i.id === incidentId);
        if (!incident) return;

        // Show incident details in a modal or expand the card
        alert(`Detalles de la incidencia:\n\n${JSON.stringify(incident.protocol, null, 2)}`);
    };

    window.exportIncident = function(incidentId) {
        const incidents = AppState.get('poolIncidents') || [];
        const incident = incidents.find(i => i.id === incidentId);
        if (!incident) return;

        // Set current calculation to this incident and export
        currentCalculation = incident.protocol;
        exportProtocolToPDF();
    };

    // ===============================================
    // CÓDIGO EXISTENTE DE PISCINAS Y REGISTROS
    // ===============================================

    function loadMockPoolsData() {
        if (AppState.get('pools').length === 0) {
            const mockPools = [
                {
                    id: 1,
                    name: "Piscina Principal",
                    hotel: "Wave",
                    volume: 250.5,
                    type: "outdoor",
                    treatment: "chlorine",
                    status: "active",
                    lastInspection: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                    notes: "Piscina principal del hotel Wave",
                    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                },
                {
                    id: 2,
                    name: "SPA Termal",
                    hotel: "Sky",
                    volume: 45.2,
                    type: "spa",
                    treatment: "bromine",
                    status: "active",
                    lastInspection: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                    notes: "SPA con tratamiento especial",
                    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
                },
                {
                    id: 3,
                    name: "Piscina Infantil",
                    hotel: "Wave",
                    volume: 15.8,
                    type: "kids",
                    treatment: "chlorine",
                    status: "maintenance",
                    lastInspection: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                    notes: "En mantenimiento preventivo",
                    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
                }
            ];
            
            AppState.data.pools = mockPools;
            AppState.saveToLocalStorage();
        }
    }

    function loadMockPoolRecordsData() {
        if (AppState.get('poolRecords').length === 0) {
            const pools = AppState.get('pools');
            const mockRecords = [];
            
            // Generate records for the last 30 days
            for (let i = 0; i < 30; i++) {
                const recordDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
                
                pools.forEach(pool => {
                    if (Math.random() > 0.2) { // 80% chance of having a record
                        mockRecords.push({
                            id: mockRecords.length + 1,
                            poolId: pool.id,
                            poolName: pool.name,
                            hotel: pool.hotel,
                            date: recordDate,
                            chlorineFree: Math.round((Math.random() * 2 + 0.5) * 10) / 10,
                            pH: Math.round((Math.random() * 1.5 + 7.0) * 10) / 10,
                            temperature: Math.round((Math.random() * 8 + 22) * 10) / 10,
                            waterCondition: Math.random() > 0.7 ? "Óptima" : "Aceptable",
                            observations: "",
                            createdBy: "sistema",
                            createdAt: recordDate
                        });
                    }
                });
            }
            
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
        
        // Botón guardar piscina
        const savePoolBtn = document.getElementById('save-pool-btn');
        if (savePoolBtn) {
            savePoolBtn.addEventListener('click', savePool);
        }
        
        // Botón cancelar piscina
        const cancelPoolBtn = document.getElementById('cancel-pool-btn');
        if (cancelPoolBtn) {
            cancelPoolBtn.addEventListener('click', () => {
                document.getElementById('pool-form').classList.add('hidden');
            });
        }
        
        // Filtros de incidencias
        const filterIncidentPool = document.getElementById('filter-incident-pool');
        const filterIncidentType = document.getElementById('filter-incident-type');
        const filterIncidentDate = document.getElementById('filter-incident-date');
        
        if (filterIncidentPool) {
            filterIncidentPool.addEventListener('change', filterIncidents);
        }
        if (filterIncidentType) {
            filterIncidentType.addEventListener('change', filterIncidents);
        }
        if (filterIncidentDate) {
            filterIncidentDate.addEventListener('change', filterIncidents);
        }
    }

    function filterIncidents() {
        const poolFilter = document.getElementById('filter-incident-pool')?.value || '';
        const typeFilter = document.getElementById('filter-incident-type')?.value || '';
        const dateFilter = document.getElementById('filter-incident-date')?.value || '';
        
        let incidents = AppState.get('poolIncidents') || [];
        
        // Apply filters
        if (poolFilter) {
            incidents = incidents.filter(incident => incident.poolId == poolFilter);
        }
        
        if (typeFilter) {
            incidents = incidents.filter(incident => incident.type === typeFilter);
        }
        
        if (dateFilter) {
            const filterDate = new Date(dateFilter);
            incidents = incidents.filter(incident => {
                const incidentDate = new Date(incident.createdAt);
                return incidentDate.toDateString() === filterDate.toDateString();
            });
        }
        
        renderIncidents(incidents);
    }

    function showPoolForm(poolId = null) {
        currentPoolId = poolId;
        const form = document.getElementById('pool-form');
        const formTitle = document.querySelector('#pool-form .form-title');
        
        if (poolId) {
            // Edit mode
            const pools = AppState.get('pools');
            const pool = pools.find(p => p.id === poolId);
            
            if (pool) {
                formTitle.textContent = 'Editar Piscina';
                document.getElementById('pool-name').value = pool.name;
                document.getElementById('pool-hotel').value = pool.hotel;
                document.getElementById('pool-volume').value = pool.volume;
                document.getElementById('pool-type').value = pool.type;
                document.getElementById('pool-treatment').value = pool.treatment;
                document.getElementById('pool-status').value = pool.status;
            }
        } else {
            // Create mode
            formTitle.textContent = 'Nueva Piscina';
            document.getElementById('pool-name').value = '';
            document.getElementById('pool-hotel').value = '';
            document.getElementById('pool-volume').value = '';
            document.getElementById('pool-type').value = 'outdoor';
            document.getElementById('pool-treatment').value = 'chlorine';
            document.getElementById('pool-status').value = 'active';
        }
        
        form.classList.remove('hidden');
        document.getElementById('pool-name').focus();
    }

    function savePool() {
        // Get form values
        const poolName = document.getElementById('pool-name').value.trim();
        const poolHotel = document.getElementById('pool-hotel').value;
        const poolVolume = parseFloat(document.getElementById('pool-volume').value);
        const poolType = document.getElementById('pool-type').value;
        const poolTreatment = document.getElementById('pool-treatment').value;
        const poolStatus = document.getElementById('pool-status').value;
        
        // Validate required fields
        if (!poolName) {
            showAlert('Por favor, introduce un nombre para la piscina', 'error');
            document.getElementById('pool-name').focus();
            return;
        }
        
        if (!poolHotel) {
            showAlert('Por favor, selecciona un hotel', 'error');
            document.getElementById('pool-hotel').focus();
            return;
        }
        
        if (!poolVolume || poolVolume <= 0) {
            showAlert('Por favor, introduce un volumen válido', 'error');
            document.getElementById('pool-volume').focus();
            return;
        }
        
        // Prepare pool data
        const poolData = {
            name: poolName,
            hotel: poolHotel,
            volume: poolVolume,
            type: poolType,
            treatment: poolTreatment,
            status: poolStatus,
            updatedAt: new Date()
        };
        
        // Get current pools
        const pools = [...AppState.get('pools')];
        
        if (currentPoolId) {
            // Update existing pool
            const poolIndex = pools.findIndex(p => p.id === currentPoolId);
            
            if (poolIndex !== -1) {
                pools[poolIndex] = {
                    ...pools[poolIndex],
                    ...poolData
                };
                
                AppState.update('pools', pools);
                showAlert('Piscina actualizada correctamente', 'success');
            } else {
                showAlert('Error al actualizar la piscina', 'error');
            }
        } else {
            // Create new pool
            const maxId = pools.reduce((max, p) => Math.max(max, p.id || 0), 0);
            
            const newPool = {
                ...poolData,
                id: maxId + 1,
                createdAt: new Date(),
                lastInspection: null,
                notes: ''
            };
            
            pools.push(newPool);
            AppState.update('pools', pools);
            showAlert('Piscina creada correctamente', 'success');
        }
        
        // Close form and update displays
        document.getElementById('pool-form').classList.add('hidden');
        renderPools(AppState.get('pools'));
        updatePoolSelect();
        updatePoolSelector(); // For protocols
    }

    function renderPools(pools) {
        if (!poolsList) return;
        
        // Apply filters
        const hotel = filterHotel ? filterHotel.value : '';
        const status = filterStatus ? filterStatus.value : '';
        
        let filteredPools = pools;
        
        if (hotel) {
            filteredPools = filteredPools.filter(pool => pool.hotel === hotel);
        }
        
        if (status) {
            filteredPools = filteredPools.filter(pool => pool.status === status);
        }
        
        if (filteredPools.length === 0) {
            poolsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-swimming-pool fa-3x"></i>
                    <h3>No hay piscinas</h3>
                    <p>Agrega la primera piscina para comenzar</p>
                </div>
            `;
            return;
        }
        
        poolsList.innerHTML = '';
        
        filteredPools.forEach(pool => {
            const statusIcons = {
                active: { icon: 'fas fa-play-circle', color: 'success', text: 'Activa' },
                maintenance: { icon: 'fas fa-tools', color: 'warning', text: 'Mantenimiento' },
                closed: { icon: 'fas fa-times-circle', color: 'danger', text: 'Cerrada' }
            };
            
            const statusInfo = statusIcons[pool.status] || statusIcons.active;
            
            const poolCard = document.createElement('div');
            poolCard.className = 'pool-card';
            poolCard.innerHTML = `
                <div class="pool-header">
                    <h3>${pool.name}</h3>
                    <div class="pool-status ${statusInfo.color}">
                        <i class="${statusInfo.icon}"></i>
                        ${statusInfo.text}
                    </div>
                </div>
                <div class="pool-info">
                    <div class="pool-detail">
                        <strong>Hotel:</strong> ${pool.hotel}
                    </div>
                    <div class="pool-detail">
                        <strong>Volumen:</strong> ${pool.volume} m³
                    </div>
                    <div class="pool-detail">
                        <strong>Tipo:</strong> ${pool.type}
                    </div>
                    <div class="pool-detail">
                        <strong>Tratamiento:</strong> ${pool.treatment}
                    </div>
                    ${pool.lastInspection ? `
                        <div class="pool-detail">
                            <strong>Última inspección:</strong> ${new Date(pool.lastInspection).toLocaleDateString('es-ES')}
                        </div>
                    ` : ''}
                </div>
                <div class="pool-actions">
                    <button class="btn btn-sm btn-secondary btn-edit-pool" data-id="${pool.id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-primary btn-view-records" data-id="${pool.id}">
                        <i class="fas fa-chart-line"></i> Ver registros
                    </button>
                    <div class="status-change">
                        <select class="form-control form-control-sm status-change-select" data-id="${pool.id}">
                            <option value="">Cambiar estado...</option>
                            <option value="active" ${pool.status === 'active' ? 'disabled' : ''}>Activar</option>
                            <option value="maintenance" ${pool.status === 'maintenance' ? 'disabled' : ''}>Poner en mantenimiento</option>
                            <option value="closed" ${pool.status === 'closed' ? 'disabled' : ''}>Cerrar</option>
                        </select>
                    </div>
                </div>
            `;
            
            poolsList.appendChild(poolCard);
        });
        
        // Setup event listeners for pool cards
        setupPoolCardButtons();
    }

    function setupPoolCardButtons() {
        // Edit button
        document.querySelectorAll('.btn-edit-pool').forEach(btn => {
            btn.addEventListener('click', () => {
                const poolId = parseInt(btn.getAttribute('data-id'));
                showPoolForm(poolId);
            });
        });
        
        // View records button
        document.querySelectorAll('.btn-view-records').forEach(btn => {
            btn.addEventListener('click', () => {
                const poolId = parseInt(btn.getAttribute('data-id'));
                // Switch to records tab
                document.querySelector('[data-tab="records-tab"]').click();
                
                // Filter by this pool
                setTimeout(() => {
                    const poolSelect = document.getElementById('filter-pool');
                    if (poolSelect) {
                        poolSelect.value = poolId;
                        updateRecordsTable();
                    }
                }, 100);
            });
        });
        
        // Status change selector
        document.querySelectorAll('.status-change-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const newStatus = e.target.value;
                if (!newStatus) return;
                
                const poolId = parseInt(e.target.getAttribute('data-id'));
                updatePoolStatus(poolId, newStatus);
                
                // Reset selector
                e.target.value = '';
            });
        });
    }

    function updatePoolStatus(poolId, newStatus) {
        const pools = AppState.get('pools');
        const poolIndex = pools.findIndex(p => p.id === poolId);
        
        if (poolIndex === -1) {
            showAlert('Piscina no encontrada', 'error');
            return;
        }
        
        pools[poolIndex].status = newStatus;
        pools[poolIndex].updatedAt = new Date();
        
        AppState.update('pools', pools);
        
        const statusMessages = {
            active: 'Piscina activada correctamente',
            maintenance: 'Piscina puesta en mantenimiento',
            closed: 'Piscina cerrada'
        };
        
        showAlert(statusMessages[newStatus] || 'Estado actualizado', 'success');
        renderPools(AppState.get('pools'));
    }

    function updatePoolSelect() {
        if (!poolSelect) return;
        
        const pools = AppState.get('pools');
        const hotel = filterHotel ? filterHotel.value : '';
        
        let filteredPools = pools;
        if (hotel) {
            filteredPools = pools.filter(pool => pool.hotel === hotel);
        }
        
        poolSelect.innerHTML = '<option value="">Todas las piscinas</option>';
        
        filteredPools.forEach(pool => {
            const option = document.createElement('option');
            option.value = pool.id;
            option.textContent = `${pool.name} (${pool.hotel})`;
            poolSelect.appendChild(option);
        });
    }

    function updateRecordsTable() {
        if (!poolRecordsList) return;
        
        const poolId = poolSelect ? poolSelect.value : '';
        const date = dateControl ? dateControl.value : '';
        
        let records = AppState.get('poolRecords') || [];
        
        // Apply filters
        if (poolId) {
            records = records.filter(record => record.poolId == poolId);
        }
        
        if (date) {
            const filterDate = new Date(date);
            records = records.filter(record => {
                const recordDate = new Date(record.date);
                return recordDate.toDateString() === filterDate.toDateString();
            });
        }
        
        // Sort by date (most recent first)
        records.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Pagination
        const startIndex = (currentPage - 1) * recordsPerPage;
        const endIndex = startIndex + recordsPerPage;
        const paginatedRecords = records.slice(startIndex, endIndex);
        
        const tbody = poolRecordsList.querySelector('tbody');
        if (!tbody) return;
        
        if (paginatedRecords.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <i class="fas fa-chart-line fa-2x"></i>
                        <p>No hay registros disponibles</p>
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = paginatedRecords.map(record => `
                <tr>
                    <td>${new Date(record.date).toLocaleDateString('es-ES')}</td>
                    <td>${record.poolName}</td>
                    <td>${record.hotel}</td>
                    <td>${record.chlorineFree} ppm</td>
                    <td>${record.pH}</td>
                    <td>${record.temperature}°C</td>
                    <td>
                        <span class="badge ${record.waterCondition === 'Óptima' ? 'success' : 'warning'}">
                            ${record.waterCondition}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-secondary" onclick="viewRecord(${record.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
        
        // Update pagination info
        const pageInfo = document.getElementById('page-info');
        if (pageInfo) {
            const totalPages = Math.ceil(records.length / recordsPerPage);
            pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        }
    }

    function openRecordModal() {
        if (recordModal) {
            recordModal.classList.remove('hidden');
        }
    }

    function hideRecordModal() {
        if (recordModal) {
            recordModal.classList.add('hidden');
        }
    }

    window.viewRecord = function(recordId) {
        const records = AppState.get('poolRecords') || [];
        const record = records.find(r => r.id === recordId);
        if (!record) return;
        
        alert(`Detalles del registro:\n\nFecha: ${new Date(record.date).toLocaleDateString('es-ES')}\nPiscina: ${record.poolName}\nCloro: ${record.chlorineFree} ppm\npH: ${record.pH}\nTemperatura: ${record.temperature}°C\nEstado: ${record.waterCondition}`);
    };

    // Initialize the module
    initPoolsModule();
});