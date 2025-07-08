// modules/pools.js - Módulo híbrido de gestión de piscinas con protocolos integrados - VERSIÓN CORREGIDA

document.addEventListener('DOMContentLoaded', () => {
  // Verificar si estamos en la página de piscinas
  const poolsView = document.getElementById('pools-view');
  if (!poolsView) return;
  
  console.log('Inicializando módulo de piscinas con protocolos...');
  
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
  
  // Variable para controlar eventos duplicados
  let eventListenersSetup = {
      records: false,
      incidents: false,
      protocols: false
  };
  
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
      console.log('Renderizando estructura del módulo...');
      
      // Renderizar la estructura base del módulo
      renderModuleStructure();
      
      // Configurar navegación de tabs ANTES de obtener referencias DOM
      setupTabNavigation();
      
      // Obtener referencias a elementos DOM después de renderizar
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
      
      console.log('Módulo de piscinas inicializado correctamente');
  }
  
  // Renderizar la estructura base del módulo con pestañas
  function renderModuleStructure() {
      poolsView.innerHTML = `
          <h2 class="section-title"><i class="fas fa-swimming-pool"></i> Gestión de Piscinas</h2>
          
          <!-- Navigation Tabs -->
          <div class="tabs-nav">
              <button class="tab-btn active" data-tab="pools-tab">
                  <i class="fas fa-swimming-pool"></i> Piscinas
              </button>
              <button class="tab-btn" data-tab="records-tab">
                  <i class="fas fa-chart-line"></i> Registros
              </button>
              <button class="tab-btn" data-tab="protocols-tab">
                  <i class="fas fa-shield-alt"></i> Protocolos
              </button>
              <button class="tab-btn" data-tab="incidents-tab">
                  <i class="fas fa-exclamation-triangle"></i> Incidencias
              </button>
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
  
  // Contenido de la pestaña Piscinas (mantener tu estructura existente)
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
              <h3 id="pool-form-title" class="form-title">Nueva Piscina</h3>
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
                          <option value="Exterior">Exterior</option>
                          <option value="Interior">Interior</option>
                          <option value="SPA">SPA</option>
                          <option value="Infantil">Infantil</option>
                      </select>
                  </div>
              </div>
              <div class="form-row">
                  <div class="form-group">
                      <label for="pool-treatment">Tratamiento</label>
                      <select id="pool-treatment" class="form-control">
                          <option value="Cloro">Cloro</option>
                          <option value="Sal">Sal electrólisis</option>
                          <option value="Bromo">Bromo</option>
                          <option value="UV">UV + Cloro</option>
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
              <div class="form-group">
                  <label for="pool-inspection">Última inspección</label>
                  <input type="date" id="pool-inspection" class="form-control">
              </div>
              <div class="form-group">
                  <label for="pool-notes">Notas</label>
                  <textarea id="pool-notes" class="form-control" placeholder="Observaciones adicionales..."></textarea>
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
  
  // Contenido de la pestaña Registros - CORREGIDO
  function renderRecordsTabContent() {
      return `
          <div class="action-bar">
              <button id="btn-new-record" class="btn btn-primary">
                  <i class="fas fa-plus"></i> Nueva Lectura
              </button>
              <button id="export-records-btn" class="btn btn-success">
                  <i class="fas fa-file-excel"></i> Exportar
              </button>
              <div class="filters">
                  <select id="filter-pool" class="form-control">
                      <option value="">Selecciona una piscina</option>
                  </select>
                  <input type="date" id="filter-date" class="form-control">
              </div>
          </div>
          
          <!-- Tabla de registros -->
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
                          <th>Incidencias</th>
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
          
          <!-- Modal para añadir/editar registros - CORREGIDO -->
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
                                  <label for="record-pool-select">Piscina *</label>
                                  <select id="record-pool-select" class="form-control" required>
                                      <option value="">Seleccionar piscina</option>
                                  </select>
                              </div>
                              <div class="form-group">
                                  <label for="record-date">Fecha *</label>
                                  <input type="date" id="record-date" class="form-control" required>
                              </div>
                          </div>
                          <div class="form-row">
                              <div class="form-group">
                                  <label for="record-time">Hora *</label>
                                  <input type="time" id="record-time" class="form-control" required>
                              </div>
                              <div class="form-group">
                                  <label for="record-ph">pH *</label>
                                  <input type="number" id="record-ph" class="form-control" min="6" max="9" step="0.1" required>
                              </div>
                          </div>
                          <div class="form-row">
                              <div class="form-group">
                                  <label for="record-temperature">Temperatura (°C)</label>
                                  <input type="number" id="record-temperature" class="form-control" step="0.1">
                              </div>
                              <div class="form-group">
                                  <label for="record-free-chlorine">Cloro libre (mg/L)</label>
                                  <input type="number" id="record-free-chlorine" class="form-control" min="0" step="0.01">
                              </div>
                          </div>
                          <div class="form-row">
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
                          
                          <!-- Sección de incidencia - NUEVA -->
                          <div id="incident-section" class="hidden">
                              <hr>
                              <h4>Información de Incidencia</h4>
                              <div class="form-group">
                                  <label for="record-incident-type">Tipo de incidencia</label>
                                  <select id="record-incident-type" class="form-control">
                                      <option value="">Sin incidencia</option>
                                      <option value="solid-feces">Heces Sólidas</option>
                                      <option value="liquid-feces">Heces Líquidas</option>
                                      <option value="vomit">Vómitos</option>
                                      <option value="pseudomonas">Pseudomonas</option>
                                      <option value="other">Otra</option>
                                  </select>
                              </div>
                              <div class="form-group">
                                  <label for="record-incident-description">Descripción de la incidencia</label>
                                  <textarea id="record-incident-description" class="form-control" placeholder="Describe la incidencia..."></textarea>
                              </div>
                              <div class="form-group">
                                  <label for="record-incident-severity">Gravedad</label>
                                  <select id="record-incident-severity" class="form-control">
                                      <option value="low">Baja</option>
                                      <option value="medium" selected>Media</option>
                                      <option value="high">Alta</option>
                                      <option value="critical">Crítica</option>
                                  </select>
                              </div>
                              <div class="form-group">
                                  <label for="record-incident-actions">Acciones tomadas</label>
                                  <textarea id="record-incident-actions" class="form-control" placeholder="Acciones realizadas para resolver la incidencia..."></textarea>
                              </div>
                          </div>
                      </div>
                      <div class="modal-footer">
                          <button id="add-incident-btn" class="btn btn-warning">
                              <i class="fas fa-exclamation-triangle"></i> Añadir Incidencia
                          </button>
                          <button id="save-record-btn" class="btn btn-primary">Guardar datos</button>
                      </div>
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
          <div class="protocol-sections">
              <div class="section-card emergency" data-section="emergency">
                  <div class="card-icon">🚨</div>
                  <div class="card-content">
                      <h4>Protocolos de Emergencia</h4>
                      <p>Heces sólidas/líquidas, vómitos, Pseudomonas aeruginosa con cálculos automáticos</p>
                  </div>
              </div>
              <div class="section-card correction" data-section="correction">
                  <div class="card-icon">⚖️</div>
                  <div class="card-content">
                      <h4>Correcciones Diarias</h4>
                      <p>Ajuste de cloro libre y pH con dosis exactas de productos Pedrosa</p>
                  </div>
              </div>
              <div class="section-card report" data-section="report">
                  <div class="card-icon">📋</div>
                  <div class="card-content">
                      <h4>Memorias de Actuación</h4>
                      <p>Generar documentos oficiales de registro de incidencias según normativa</p>
                  </div>
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
          
          <div class="protocol-selector" id="correction-selector">
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
          <div class="form-container hidden" id="calculation-form">
              <h4 id="form-title">Formulario de Cálculo</h4>
              <form id="calculator-form">
                  <div class="form-row">
                      <div class="form-group">
                          <label for="pool-select">Piscina *</label>
                          <select id="pool-select" name="pool-select" class="form-control" required>
                              <option value="">Seleccionar piscina...</option>
                          </select>
                      </div>
                      <div class="form-group" id="product-group">
                          <label for="product">Producto Pedrosa *</label>
                          <select id="product" name="product" class="form-control" required>
                              <option value="">Seleccionar producto...</option>
                          </select>
                      </div>
                  </div>
                  
                  <div class="form-row" id="current-values">
                      <div class="form-group" id="current-chlorine-group">
                          <label for="current-chlorine">Cloro libre actual (ppm)</label>
                          <input type="number" id="current-chlorine" name="current-chlorine" class="form-control" min="0" step="0.1">
                      </div>
                      <div class="form-group" id="target-chlorine-group">
                          <label for="target-chlorine">Cloro libre deseado (ppm)</label>
                          <input type="number" id="target-chlorine" name="target-chlorine" class="form-control" min="0" step="0.1">
                      </div>
                      <div class="form-group" id="current-ph-group">
                          <label for="current-ph">pH actual</label>
                          <input type="number" id="current-ph" name="current-ph" class="form-control" min="6.0" max="9.0" step="0.1">
                      </div>
                      <div class="form-group" id="target-ph-group">
                          <label for="target-ph">pH deseado</label>
                          <input type="number" id="target-ph" name="target-ph" class="form-control" min="6.0" max="9.0" step="0.1">
                      </div>
                  </div>

                  <button type="submit" class="btn btn-primary calculate-btn" style="width: 100%; margin-top: 1rem;">
                      🧮 Calcular Dosis y Protocolo
                      <span class="loading hidden"></span>
                  </button>
              </form>
          </div>
          
          <!-- Results Section -->
          <div class="results hidden" id="results-section">
              <div id="calculation-results"></div>
              <div id="protocol-steps"></div>
          </div>
          
          <!-- Export Section -->
          <div class="export-section hidden" id="export-section">
              <h4>📋 Generar Memoria de Actuación</h4>
              <p>Exportar protocolo y cálculos realizados:</p>
              <div class="export-buttons">
                  <button class="btn btn-primary" onclick="exportProtocolToPDF()">
                      📄 Exportar PDF
                  </button>
                  <button class="btn btn-secondary" onclick="copyProtocolToClipboard()">
                      📋 Copiar Texto
                  </button>
                  <button class="btn btn-primary" onclick="saveToIncidents()">
                      💾 Guardar Incidencia
                  </button>
              </div>
          </div>
      `;
  }
  
  // Contenido de la pestaña Incidencias - CORREGIDO
  function renderIncidentsTabContent() {
      return `
          <div class="action-bar">
              <button id="btn-new-incident" class="btn btn-primary">
                  <i class="fas fa-plus"></i> Nueva Incidencia + Lectura
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
                      <option value="other">Otra</option>
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
  // SETUP DE NAVEGACIÓN Y EVENTOS - CORREGIDO
  // ===============================================
  
  function setupTabNavigation() {
      console.log('Configurando navegación de tabs...');
      
      // Usar delegación de eventos para asegurar que funcione
      document.addEventListener('click', function(e) {
          if (e.target.matches('.tab-btn') || e.target.closest('.tab-btn')) {
              const button = e.target.matches('.tab-btn') ? e.target : e.target.closest('.tab-btn');
              const targetTab = button.getAttribute('data-tab');
              console.log('Cambiando a tab:', targetTab);
              
              // Actualizar tabs activos
              document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
              document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
              
              button.classList.add('active');
              const targetPane = document.getElementById(targetTab);
              if (targetPane) {
                  targetPane.classList.add('active');
                  
                  // Resetear estado de event listeners
                  eventListenersSetup.records = false;
                  eventListenersSetup.incidents = false;
                  eventListenersSetup.protocols = false;
                  
                  // Inicializar contenido específico del tab
                  if (targetTab === 'protocols-tab') {
                      initProtocolsTab();
                  } else if (targetTab === 'incidents-tab') {
                      initIncidentsTab();
                  } else if (targetTab === 'records-tab') {
                      initRecordsTab();
                  }
              } else {
                  console.error('No se encontró el panel del tab:', targetTab);
              }
          }
      });
  }
  
  function initRecordsTab() {
      console.log('Inicializando tab de registros...');
      
      // Obtener referencias de elementos del tab de registros
      poolSelect = document.getElementById('filter-pool');
      dateControl = document.getElementById('filter-date');
      poolRecordsList = document.getElementById('pool-records-table');
      
      // Actualizar selector de piscinas y tabla
      updatePoolSelect();
      updateRecordsTable();
      
      // Configurar eventos específicos de registros solo una vez
      if (!eventListenersSetup.records) {
          setupRecordsEventListeners();
          eventListenersSetup.records = true;
      }
  }
  
  function setupRecordsEventListeners() {
      console.log('Configurando eventos de registros...');
      
      // Botón nueva lectura
      const btnNewRecord = document.getElementById('btn-new-record');
      if (btnNewRecord) {
          btnNewRecord.addEventListener('click', (e) => {
              e.preventDefault();
              console.log('Botón nueva lectura clickeado');
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
       
       // Botón añadir incidencia
       const addIncidentBtn = document.getElementById('add-incident-btn');
       if (addIncidentBtn) {
           addIncidentBtn.addEventListener('click', (e) => {
               e.preventDefault();
               toggleIncidentSection();
           });
       }
       
       // Selector de piscina para filtrar registros
       if (poolSelect) {
           poolSelect.addEventListener('change', updateRecordsTable);
       }
       
       // Control de fecha para filtrar registros
       if (dateControl) {
           dateControl.addEventListener('change', function() {
               updateRecordsTable();
           });
           
           // Añadir botón para limpiar filtro de fecha (solo si no existe)
           if (!dateControl.parentNode.querySelector('.clear-date-btn')) {
               const clearDateBtn = document.createElement('button');
               clearDateBtn.className = 'btn btn-secondary btn-sm clear-date-btn';
               clearDateBtn.innerHTML = '<i class="fas fa-times"></i>';
               clearDateBtn.title = 'Limpiar filtro de fecha';
               clearDateBtn.style.marginLeft = '5px';
               
               clearDateBtn.addEventListener('click', function() {
                   dateControl.value = '';
                   updateRecordsTable();
               });
               
               dateControl.parentNode.appendChild(clearDateBtn);
           }
       }
       
       // Botón exportar registros
       const exportRecordsBtn = document.getElementById('export-records-btn');
       if (exportRecordsBtn) {
           exportRecordsBtn.addEventListener('click', exportPoolRecords);
       }
   }
   
   function initProtocolsTab() {
       console.log('Inicializando tab de protocolos...');
       
       if (!eventListenersSetup.protocols) {
           // Llenar selector de piscinas
           updatePoolSelector();
           
           // Event listeners para protocolos
           setupProtocolEventListeners();
           eventListenersSetup.protocols = true;
       }
   }
   
   function setupProtocolEventListeners() {
       console.log('Configurando eventos de protocolos...');
       
       // Section selection
       document.querySelectorAll('.section-card').forEach(card => {
           card.addEventListener('click', function() {
               console.log('Seleccionando sección:', this.dataset.section);
               selectSection(this.dataset.section);
           });
       });

       // Protocol selection
       document.querySelectorAll('.protocol-btn').forEach(btn => {
           btn.addEventListener('click', function() {
               if (this.dataset.protocol) {
                   console.log('Seleccionando protocolo:', this.dataset.protocol);
                   selectProtocol(this.dataset.protocol);
               } else if (this.dataset.correction) {
                   console.log('Seleccionando corrección:', this.dataset.correction);
                   selectCorrection(this.dataset.correction);
               }
           });
       });

       // Form submission
       const calculatorForm = document.getElementById('calculator-form');
       if (calculatorForm) {
           calculatorForm.addEventListener('submit', function(e) {
               e.preventDefault();
               console.log('Calculando dosis...');
               calculateDose();
           });
       }
   }
   
   function initIncidentsTab() {
       console.log('Inicializando tab de incidencias...');
       updateIncidentFilters();
       renderIncidents(AppState.get('poolIncidents') || []);
       
       if (!eventListenersSetup.incidents) {
           setupIncidentsEventListeners();
           eventListenersSetup.incidents = true;
       }
   }
   
   function setupIncidentsEventListeners() {
       // Botón nueva incidencia - CORREGIDO
       const btnNewIncident = document.getElementById('btn-new-incident');
       if (btnNewIncident) {
           btnNewIncident.addEventListener('click', (e) => {
               e.preventDefault();
               console.log('Botón nueva incidencia clickeado');
               openRecordModalWithIncident();
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
   
   // ===============================================
   // FUNCIONES DE MODAL DE REGISTROS - CORREGIDAS
   // ===============================================
   
   // Función para mostrar/ocultar sección de incidencia
   function toggleIncidentSection() {
       const incidentSection = document.getElementById('incident-section');
       const addIncidentBtn = document.getElementById('add-incident-btn');
       
       if (incidentSection.classList.contains('hidden')) {
           incidentSection.classList.remove('hidden');
           addIncidentBtn.innerHTML = '<i class="fas fa-minus"></i> Quitar Incidencia';
           addIncidentBtn.className = 'btn btn-secondary';
       } else {
           incidentSection.classList.add('hidden');
           addIncidentBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Añadir Incidencia';
           addIncidentBtn.className = 'btn btn-warning';
           
           // Limpiar campos de incidencia
           document.getElementById('record-incident-type').value = '';
           document.getElementById('record-incident-description').value = '';
           document.getElementById('record-incident-severity').value = 'medium';
           document.getElementById('record-incident-actions').value = '';
       }
   }
   
   // Abrir modal de registro con incidencia preactivada
   function openRecordModalWithIncident() {
       console.log('Abriendo modal de registro con incidencia...');
       
       // Cambiar a la pestaña de registros
       document.querySelector('[data-tab="records-tab"]').click();
       
       // Esperar a que se inicialice la pestaña
       setTimeout(() => {
           openRecordModal();
           
           // Activar la sección de incidencia
           setTimeout(() => {
               const incidentSection = document.getElementById('incident-section');
               const addIncidentBtn = document.getElementById('add-incident-btn');
               
               if (incidentSection && addIncidentBtn) {
                   incidentSection.classList.remove('hidden');
                   addIncidentBtn.innerHTML = '<i class="fas fa-minus"></i> Quitar Incidencia';
                   addIncidentBtn.className = 'btn btn-secondary';
               }
           }, 100);
       }, 100);
   }
   
   // Abrir modal para nuevo registro - VERSIÓN CORREGIDA
   function openRecordModal(recordId = null) {
       console.log('Intentando abrir modal de registro...');
       
       let modalOverlay = document.getElementById('record-modal-overlay');
       
       if (!modalOverlay) {
           console.error('Modal de registro no encontrado en el DOM');
           Utils.showToast('Error: No se pudo abrir el formulario de registro', 'error');
           return;
       }
       
       currentRecordId = recordId;
       
       // Llenar selector de piscinas
       const recordPoolSelect = document.getElementById('record-pool-select');
       if (recordPoolSelect) {
           const pools = AppState.get('pools');
           recordPoolSelect.innerHTML = '<option value="">Seleccionar piscina</option>';
           
           pools.forEach(pool => {
               const option = document.createElement('option');
               option.value = pool.id;
               option.textContent = `${pool.name} (${pool.hotel})`;
               recordPoolSelect.appendChild(option);
           });
       }

       // Preseleccionar piscina si hay una seleccionada en el filtro
       const currentPoolFilter = document.getElementById('filter-pool');
       if (currentPoolFilter && currentPoolFilter.value && !recordId) {
           recordPoolSelect.value = currentPoolFilter.value;
       }
       
       if (recordId) {
           // Modo edición - cargar datos del registro
           const records = AppState.get('poolRecords');
           const record = records.find(r => r.id === recordId);
           
           if (record) {
               document.getElementById('record-modal-title').textContent = 'Editar Registro';
               
               // Llenar campos
               if (recordPoolSelect) recordPoolSelect.value = record.poolId;
               
               const recordDate = new Date(record.date);
               document.getElementById('record-date').value = recordDate.toISOString().split('T')[0];
               document.getElementById('record-time').value = recordDate.toTimeString().substr(0, 5);
               document.getElementById('record-ph').value = record.pH || '';
               document.getElementById('record-temperature').value = record.temperature || '';
               document.getElementById('record-free-chlorine').value = record.freeChlorine || '';
               document.getElementById('record-combined-chlorine').value = record.combinedChlorine || '';
               document.getElementById('record-turbidity').value = record.turbidity || 'Óptima';
               document.getElementById('record-observations').value = record.observations || '';
               
               // Verificar si hay incidencia asociada
               const incidents = AppState.get('poolIncidents') || [];
               const relatedIncident = incidents.find(i => 
                   i.poolId === record.poolId && 
                   new Date(i.createdAt).toDateString() === recordDate.toDateString()
               );
               
               if (relatedIncident) {
                   // Mostrar sección de incidencia y llenar datos
                   const incidentSection = document.getElementById('incident-section');
                   const addIncidentBtn = document.getElementById('add-incident-btn');
                   
                   incidentSection.classList.remove('hidden');
                   addIncidentBtn.innerHTML = '<i class="fas fa-minus"></i> Quitar Incidencia';
                   addIncidentBtn.className = 'btn btn-secondary';
                   
                   document.getElementById('record-incident-type').value = relatedIncident.type;
                   document.getElementById('record-incident-description').value = relatedIncident.description;
                   document.getElementById('record-incident-severity').value = relatedIncident.severity;
                   document.getElementById('record-incident-actions').value = relatedIncident.actions || '';
               }
           }
       } else {
           // Modo nuevo registro
           document.getElementById('record-modal-title').textContent = 'Nueva Lectura';
           
           // Llenar fecha y hora actuales
           const now = new Date();
           document.getElementById('record-date').value = now.toISOString().split('T')[0];
           document.getElementById('record-time').value = now.toTimeString().substr(0, 5);
           
           // Limpiar campos
           document.getElementById('record-ph').value = '';
           document.getElementById('record-temperature').value = '';
           document.getElementById('record-free-chlorine').value = '';
           document.getElementById('record-combined-chlorine').value = '';
           document.getElementById('record-turbidity').value = 'Óptima';
           document.getElementById('record-observations').value = '';
           
           // Asegurar que la sección de incidencia esté oculta por defecto
           const incidentSection = document.getElementById('incident-section');
           const addIncidentBtn = document.getElementById('add-incident-btn');
           
           if (incidentSection && addIncidentBtn) {
               incidentSection.classList.add('hidden');
               addIncidentBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Añadir Incidencia';
               addIncidentBtn.className = 'btn btn-warning';
           }
       }
       
       // Mostrar modal
       modalOverlay.classList.remove('hidden');
       
       // Dar foco al primer campo
       if (recordPoolSelect) {
           recordPoolSelect.focus();
       }
   }
   
   // Ocultar modal de registro
   function hideRecordModal() {
       const modalOverlay = document.getElementById('record-modal-overlay');
       if (modalOverlay) {
           modalOverlay.classList.add('hidden');
       }
       currentRecordId = null;
       
       // Resetear sección de incidencia
       const incidentSection = document.getElementById('incident-section');
       const addIncidentBtn = document.getElementById('add-incident-btn');
       
       if (incidentSection && addIncidentBtn) {
           incidentSection.classList.add('hidden');
           addIncidentBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Añadir Incidencia';
           addIncidentBtn.className = 'btn btn-warning';
       }
   }
   
   // Guardar registro desde modal - CORREGIDO
   function saveRecordFromModal() {
       console.log('Guardando registro desde modal...');
       
       // Obtener valores del formulario
       const poolId = document.getElementById('record-pool-select').value;
       const date = document.getElementById('record-date').value;
       const time = document.getElementById('record-time').value;
       const pH = parseFloat(document.getElementById('record-ph').value);
       const temperature = parseFloat(document.getElementById('record-temperature').value) || null;
       const freeChlorine = parseFloat(document.getElementById('record-free-chlorine').value) || null;
       const combinedChlorine = parseFloat(document.getElementById('record-combined-chlorine').value) || null;
       const turbidity = document.getElementById('record-turbidity').value;
       const observations = document.getElementById('record-observations').value.trim();
       
       // Datos de incidencia (si están presentes)
       const incidentSection = document.getElementById('incident-section');
       const hasIncident = incidentSection && !incidentSection.classList.contains('hidden');
       let incidentData = null;
       
       if (hasIncident) {
           const incidentType = document.getElementById('record-incident-type').value;
           const incidentDescription = document.getElementById('record-incident-description').value.trim();
           const incidentSeverity = document.getElementById('record-incident-severity').value;
           const incidentActions = document.getElementById('record-incident-actions').value.trim();
           
           if (incidentType && incidentDescription) {
               incidentData = {
                   type: incidentType,
                   description: incidentDescription,
                   severity: incidentSeverity,
                   actions: incidentActions
               };
           }
       }
       
       // Validar campos obligatorios
       if (!poolId) {
           Utils.showToast('Por favor selecciona una piscina', 'error');
           return;
       }
       
       if (!date) {
           Utils.showToast('Por favor selecciona una fecha', 'error');
           return;
       }
       
       if (!time) {
           Utils.showToast('Por favor selecciona una hora', 'error');
           return;
       }
       
       if (!pH || pH < 6 || pH > 9) {
           Utils.showToast('Por favor introduce un pH válido (6.0 - 9.0)', 'error');
           return;
       }
       
       // Obtener información de la piscina
       const pools = AppState.get('pools');
       const pool = pools.find(p => p.id == poolId);
       
       if (!pool) {
           Utils.showToast('Piscina no encontrada', 'error');
           return;
       }
       
       // Crear fecha completa
       const fullDate = new Date(`${date}T${time}`);
       
       // Evitar duplicación - comprobar si ya existe (solo para nuevos registros)
       if (!currentRecordId) {
           const records = AppState.get('poolRecords');
           const existingIndex = records.findIndex(r => 
               r.poolId === parseInt(poolId) && 
               Math.abs(new Date(r.date).getTime() - fullDate.getTime()) < 60000 && // Mismo minuto
               Math.abs(new Date() - new Date(r.createdAt)) < 5000 // Creado hace menos de 5 segundos
           );

           if (existingIndex !== -1) {
               Utils.showToast('Ya existe un registro muy similar reciente', 'warning');
               return;
           }
       }
       
       // Preparar datos del registro
       const recordData = {
           poolId: parseInt(poolId),
           poolName: pool.name,
           hotel: pool.hotel,
           date: fullDate,
           pH: pH,
           temperature: temperature,
           freeChlorine: freeChlorine,
           combinedChlorine: combinedChlorine,
           turbidity: turbidity,
           observations: observations,
           createdBy: 'usuario-actual',
           createdAt: new Date()
       };
       
       // Obtener registros actuales
       const records = [...AppState.get('poolRecords')];
       
       if (currentRecordId) {
           // Actualizar registro existente
           const recordIndex = records.findIndex(r => r.id === currentRecordId);
           if (recordIndex !== -1) {
               records[recordIndex] = {
                   ...records[recordIndex],
                   ...recordData,
                   updatedAt: new Date()
               };
               
               Utils.showToast('Registro actualizado correctamente', 'success');
           } else {
               Utils.showToast('Error al actualizar el registro', 'error');
               return;
           }
       } else {
           // Crear nuevo registro
           const maxId = records.reduce((max, r) => Math.max(max, r.id || 0), 0);
           
           const newRecord = {
               ...recordData,
               id: maxId + 1
           };
           
           records.push(newRecord);
           Utils.showToast('Registro creado correctamente', 'success');
       }
       
       // Guardar en AppState
       AppState.update('poolRecords', records);
       
       // Si hay datos de incidencia, crear o actualizar la incidencia
       if (incidentData) {
           const incidents = [...(AppState.get('poolIncidents') || [])];
           
           // Evitar duplicación de incidencias
           const existingIncident = incidents.find(i => 
               i.poolId === parseInt(poolId) && 
               i.type === incidentData.type && 
               i.description === incidentData.description &&
               Math.abs(new Date() - new Date(i.createdAt)) < 5000 // Menos de 5 segundos
           );

           if (!existingIncident) {
               const maxIncidentId = incidents.reduce((max, i) => Math.max(max, i.id || 0), 0);
               
               const newIncident = {
                   id: maxIncidentId + 1,
                   poolId: parseInt(poolId),
                   poolName: pool.name,
                   hotel: pool.hotel,
                   type: incidentData.type,
                   description: incidentData.description,
                   severity: incidentData.severity,
                   actions: incidentData.actions,
                   status: 'open',
                   createdBy: 'usuario-actual',
                   createdAt: fullDate // Usar la misma fecha/hora del registro
               };
               
               incidents.push(newIncident);
               AppState.update('poolIncidents', incidents);
               
               Utils.showToast('Incidencia registrada junto con la lectura', 'success');
           }
       }
       
       // Cerrar modal y actualizar tabla
       hideRecordModal();
       updateRecordsTable();
   }
   
   // ===============================================
   // FUNCIONES PRINCIPALES DEL MÓDULO
   // ===============================================
   
   function loadMockPoolsData() {
       if (AppState.get('pools').length === 0) {
           const mockPools = [
               {
                   id: 1,
                   name: "Piscina Principal",
                   hotel: "Wave",
                   volume: 250.5,
                   type: "Exterior",
                   treatment: "Cloro",
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
                   type: "SPA",
                   treatment: "Bromo",
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
                   type: "Infantil",
                   treatment: "Cloro",
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
                           pH: Math.round((Math.random() * 1.5 + 7.0) * 10) / 10,
                           temperature: Math.round((Math.random() * 8 + 22) * 10) / 10,
                           freeChlorine: Math.round((Math.random() * 2 + 0.5) * 10) / 10,
                           combinedChlorine: Math.round((Math.random() * 0.5) * 100) / 100,
                           turbidity: Math.random() > 0.7 ? "Óptima" : "Aceptable",
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

   // Configurar eventos principales
   function setupEventListeners() {
       // Filtros de piscinas
       const filterHotelEl = document.getElementById('filter-pool-hotel');
       const filterStatusEl = document.getElementById('filter-pool-status');
       
       if (filterHotelEl) {
           filterHotelEl.addEventListener('change', () => {
               renderPools(AppState.get('pools'));
               updatePoolSelect();
           });
       }
       
       if (filterStatusEl) {
           filterStatusEl.addEventListener('change', () => {
               renderPools(AppState.get('pools'));
               updatePoolSelect();
           });
       }
       
       // Botón nueva piscina
       const btnNewPool = document.getElementById('btn-new-pool');
       if (btnNewPool) {
           btnNewPool.addEventListener('click', () => {
               showPoolForm();
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
   }

   function showPoolForm(poolId = null) {
       currentPoolId = poolId;
       const form = document.getElementById('pool-form');
       const formTitle = document.getElementById('pool-form-title');
       
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
           }
       } else {
           // Create mode
           formTitle.textContent = 'Nueva Piscina';
           document.getElementById('pool-name').value = '';
           document.getElementById('pool-hotel').value = '';
           document.getElementById('pool-volume').value = '';
           document.getElementById('pool-type').value = 'Exterior';
           document.getElementById('pool-treatment').value = 'Cloro';
           document.getElementById('pool-status').value = 'active';
           
           // Fecha de hoy para inspección
           const today = new Date().toISOString().split('T')[0];
           document.getElementById('pool-inspection').value = today;
           
           document.getElementById('pool-notes').value = '';
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
       const poolInspection = document.getElementById('pool-inspection').value;
       const poolNotes = document.getElementById('pool-notes').value.trim();
       
       // Validate required fields
       if (!poolName) {
           Utils.showToast('Por favor, introduce un nombre para la piscina', 'error');
           document.getElementById('pool-name').focus();
           return;
       }
       
       if (!poolHotel) {
           Utils.showToast('Por favor, selecciona un hotel', 'error');
           document.getElementById('pool-hotel').focus();
           return;
       }
       
       if (!poolVolume || poolVolume <= 0) {
           Utils.showToast('Por favor, introduce un volumen válido', 'error');
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
           lastInspection: poolInspection ? new Date(poolInspection) : null,
           notes: poolNotes,
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
               Utils.showToast('Piscina actualizada correctamente', 'success');
           } else {
               Utils.showToast('Error al actualizar la piscina', 'error');
           }
       } else {
           // Create new pool
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
           poolCard.className = `pool-card status-${pool.status}`;
           poolCard.innerHTML = `
               <div class="pool-card-header">
                   <h3 class="pool-name">${pool.name}</h3>
                   <div class="pool-status">
                       ${statusInfo.text}
                   </div>
               </div>
               <div class="pool-card-content">
                   <div class="pool-info">
                       <div class="pool-property">
                           <span class="property-label">Hotel</span>
                           <span class="property-value">${pool.hotel}</span>
                       </div>
                       <div class="pool-property">
                           <span class="property-label">Volumen</span>
                           <span class="property-value">${pool.volume} m³</span>
                       </div>
                       <div class="pool-property">
                           <span class="property-label">Tipo</span>
                           <span class="property-value">${pool.type}</span>
                       </div>
                       <div class="pool-property">
                           <span class="property-label">Tratamiento</span>
                           <span class="property-value">${pool.treatment}</span>
                       </div>
                       ${pool.lastInspection ? `
                           <div class="pool-property">
                               <span class="property-label">Última inspección</span>
                               <span class="property-value">${new Date(pool.lastInspection).toLocaleDateString('es-ES')}</span>
                           </div>
                       ` : ''}
                   </div>
                   ${pool.notes ? `
                       <div class="pool-notes">
                           <strong>Notas:</strong> ${pool.notes}
                       </div>
                   ` : ''}
               </div>
               <div class="pool-card-actions">
                   <button class="btn-edit-pool" data-id="${pool.id}">
                       <i class="fas fa-edit"></i> Editar
                   </button>
                   <button class="btn-view-records" data-id="${pool.id}">
                       <i class="fas fa-chart-line"></i> Ver registros
                   </button>
                   <div class="pool-status-actions">
                       <select class="status-change-select" data-id="${pool.id}">
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
           Utils.showToast('Piscina no encontrada', 'error');
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
       
       Utils.showToast(statusMessages[newStatus] || 'Estado actualizado', 'success');
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
       
       poolSelect.innerHTML = '<option value="">Selecciona una piscina</option>';
       
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
       const dateStr = dateControl ? dateControl.value : '';
       
       if (!poolId) {
           const poolRecordsBody = poolRecordsList.querySelector('tbody');
           if (poolRecordsBody) {
               poolRecordsBody.innerHTML = '<tr><td colspan="10" class="text-center">Por favor selecciona una piscina para ver sus registros</td></tr>';
           }
           
           // Limpiar controles de paginación
           const paginationControls = document.getElementById('pagination-controls');
           if (paginationControls) {
               paginationControls.innerHTML = '';
           }
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
       
       const poolRecordsBody = poolRecordsList.querySelector('tbody');
       if (!poolRecordsBody) return;
       
       // Si no hay registros
       if (filteredRecords.length === 0) {
           poolRecordsBody.innerHTML = '<tr><td colspan="10" class="text-center">No hay registros para esta piscina en la fecha seleccionada</td></tr>';
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
           currentPage = totalPages || 1;
       }
       
       // Filtrar solo registros de la página actual
       const startIndex = (currentPage - 1) * recordsPerPage;
       const endIndex = Math.min(startIndex + recordsPerPage, totalRecords);
       const paginatedRecords = sortedRecords.slice(startIndex, endIndex);
       
       // Renderizar registros
       poolRecordsBody.innerHTML = '';
       
       paginatedRecords.forEach(record => {
           const row = document.createElement('tr');
           
           // Formatear fecha y hora
           const recordDate = new Date(record.date);
           const dateStr = recordDate.toLocaleDateString('es-ES');
           const timeStr = recordDate.toLocaleTimeString('es-ES', { 
               hour: '2-digit', 
               minute: '2-digit' 
           });
           
           // Aplicar clases CSS para valores fuera de rango
           const phClass = (record.pH < 7.2 || record.pH > 7.6) ? 'value-alert' : '';
           const chlorineClass = (record.freeChlorine < 0.5 || record.freeChlorine > 2.0) ? 'value-alert' : '';
           const tempClass = (record.temperature < 24 || record.temperature > 30) ? 'value-alert' : '';
           
           row.innerHTML = `
               <td>${dateStr}</td>
               <td>${timeStr}</td>
               <td class="${phClass}">${record.pH || '-'}</td>
               <td class="${tempClass}">${record.temperature ? record.temperature + '°C' : '-'}</td>
               <td class="${chlorineClass}">${record.freeChlorine || '-'}</td>
               <td>${record.combinedChlorine || '-'}</td>
               <td>${record.turbidity || '-'}</td>
               <td>${record.createdBy ? (window.innerWidth <= 768 ? record.createdBy.substring(0, 3) : record.createdBy) : 'Sys'}</td>
               <td class="record-incidents">
                   ${getIncidentsForDate(recordDate, record.poolId)}
               </td>
               <td class="record-actions">
                   <button class="btn-edit-record" data-id="${record.id}" title="Editar"><i class="fas fa-edit"></i></button>
                   ${record.observations ? `<button class="btn-view-observations" data-id="${record.id}" title="Ver observaciones"><i class="fas fa-eye"></i></button>` : ''}
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

   function getIncidentsForDate(recordDate, poolId) {
       const incidents = AppState.get('poolIncidents') || [];
       const dayIncidents = incidents.filter(incident => {
           const incidentDate = new Date(incident.createdAt);
           return incidentDate.toDateString() === recordDate.toDateString() && 
                  incident.poolId === poolId;
       });
       
       if (dayIncidents.length === 0) {
           return '-';
       }
       
       return dayIncidents.map(incident => 
           `<button class="btn-view-incident" data-id="${incident.id}" title="Ver incidencia: ${incident.type}">
               <i class="fas fa-exclamation-triangle" style="color: orange;"></i>
           </button>`
       ).join(' ');
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

       // Botón ver incidencia
       document.querySelectorAll('.btn-view-incident').forEach(btn => {
           btn.addEventListener('click', () => {
               const incidentId = parseInt(btn.getAttribute('data-id'));
               viewIncidentDetails(incidentId);
           });
       });

       // Botón ver observaciones
       document.querySelectorAll('.btn-view-observations').forEach(btn => {
           btn.addEventListener('click', () => {
               const recordId = parseInt(btn.getAttribute('data-id'));
               const records = AppState.get('poolRecords');
               const record = records.find(r => r.id === recordId);
               if (record && record.observations) {
                   Utils.confirmAction(
                       `Observaciones del registro:\n\n"${record.observations}"`,
                       () => {}, // No hacer nada en confirm
                       () => {} // No hacer nada en cancel
                   );
               }
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
       
       // Obtener registros filtrados
       let records = AppState.get('poolRecords').filter(r => r.poolId == poolId);
       
       if (dateStr) {
           const filterDate = new Date(dateStr);
           records = records.filter(r => {
               const recordDate = new Date(r.date);
               return recordDate.toDateString() === filterDate.toDateString();
           });
       }
       
       if (records.length === 0) {
           Utils.showToast('No hay registros para exportar', 'warning');
           return;
       }
       
       // Preparar datos para exportación
       const exportData = records.map(record => ({
           'Fecha': new Date(record.date).toLocaleDateString('es-ES'),
           'Hora': new Date(record.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
           'Piscina': record.poolName,
           'Hotel': record.hotel,
           'pH': record.pH || '',
           'Temperatura (°C)': record.temperature || '',
           'Cloro Libre (mg/L)': record.freeChlorine || '',
           'Cloro Combinado (mg/L)': record.combinedChlorine || '',
           'Turbidez': record.turbidity || '',
           'Observaciones': record.observations || '',
           'Creado por': record.createdBy || ''
       }));
       
       // Generar nombre del archivo
       const fileName = `registros-${pool.name.replace(/\s+/g, '-')}-${dateStr || new Date().toISOString().split('T')[0]}.xlsx`;
       
       // Exportar usando Utils
       if (typeof Utils !== 'undefined' && Utils.exportToExcel) {
           Utils.exportToExcel(exportData, fileName, 'Registros de Piscina');
       } else {
           Utils.showToast('Función de exportación no disponible', 'error');
       }
   }

   // ===============================================
   // FUNCIONES DE PROTOCOLOS (simplificadas para este ejemplo)
   // ===============================================
   
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
       console.log('Seleccionando sección:', section);
       currentSection = section;
       
       // Update active section card
       document.querySelectorAll('.section-card').forEach(card => {
           card.classList.remove('active');
       });
       const sectionCard = document.querySelector(`[data-section="${section}"]`);
       if (sectionCard) {
           sectionCard.classList.add('active');
       }

       // Show appropriate selector
       document.querySelectorAll('.protocol-selector').forEach(sel => {
           sel.classList.remove('active');
       });
       
       if (section === 'emergency') {
           const emergencySelector = document.getElementById('emergency-selector');
           if (emergencySelector) {
               emergencySelector.classList.add('active');
           }
       } else if (section === 'correction') {
           const correctionSelector = document.getElementById('correction-selector');
           if (correctionSelector) {
               correctionSelector.classList.add('active');
           }
       }

       // Hide form and results
       hideFormAndResults();
   }
   
   function selectProtocol(protocol) {
       console.log('Seleccionando protocolo:', protocol);
       currentProtocol = protocol;
       
       // Update active protocol button
       document.querySelectorAll('.protocol-btn').forEach(btn => {
           btn.classList.remove('active');
       });
       const protocolBtn = document.querySelector(`[data-protocol="${protocol}"]`);
       if (protocolBtn) {
           protocolBtn.classList.add('active');
       }

       setupEmergencyForm(protocol);
       showForm();
   }
   
   function selectCorrection(correction) {
       console.log('Seleccionando corrección:', correction);
       currentProtocol = correction;
       
       // Update active correction button
       document.querySelectorAll('.protocol-btn').forEach(btn => {
           btn.classList.remove('active');
       });
       const correctionBtn = document.querySelector(`[data-correction="${correction}"]`);
       if (correctionBtn) {
           correctionBtn.classList.add('active');
       }

       setupCorrectionForm(correction);
       showForm();
   }
   
   function setupEmergencyForm(protocol) {
       const formTitle = document.getElementById('form-title');
       const productSelect = document.getElementById('product');
       
       if (!formTitle || !productSelect) {
           console.error('No se encontraron elementos del formulario');
           return;
       }
       
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
      const currentChlorineGroup = document.getElementById('current-chlorine-group');
      const targetChlorineGroup = document.getElementById('target-chlorine-group');
      const currentPhGroup = document.getElementById('current-ph-group');
      const targetPhGroup = document.getElementById('target-ph-group');
      
      if (currentChlorineGroup) currentChlorineGroup.style.display = 'none';
      if (targetChlorineGroup) targetChlorineGroup.style.display = 'none';
      if (currentPhGroup) currentPhGroup.style.display = 'block';
      if (targetPhGroup) targetPhGroup.style.display = 'none';
  }
  
  function setupCorrectionForm(correction) {
      const formTitle = document.getElementById('form-title');
      const productSelect = document.getElementById('product');
      
      if (!formTitle || !productSelect) {
          console.error('No se encontraron elementos del formulario');
          return;
      }
      
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
      const currentChlorineGroup = document.getElementById('current-chlorine-group');
      const targetChlorineGroup = document.getElementById('target-chlorine-group');
      const currentPhGroup = document.getElementById('current-ph-group');
      const targetPhGroup = document.getElementById('target-ph-group');
      
      if (correction === 'chlorine') {
          if (currentChlorineGroup) currentChlorineGroup.style.display = 'block';
          if (targetChlorineGroup) targetChlorineGroup.style.display = 'block';
          if (currentPhGroup) currentPhGroup.style.display = 'block';
          if (targetPhGroup) targetPhGroup.style.display = 'none';
      } else {
          if (currentChlorineGroup) currentChlorineGroup.style.display = 'none';
          if (targetChlorineGroup) targetChlorineGroup.style.display = 'none';
          if (currentPhGroup) currentPhGroup.style.display = 'block';
          if (targetPhGroup) targetPhGroup.style.display = 'block';
      }
  }
  
  function showForm() {
      const calculationForm = document.getElementById('calculation-form');
      const resultsSection = document.getElementById('results-section');
      const exportSection = document.getElementById('export-section');
      
      if (calculationForm) {
          calculationForm.classList.remove('hidden');
      }
      if (resultsSection) {
          resultsSection.classList.add('hidden');
      }
      if (exportSection) {
          exportSection.classList.add('hidden');
      }
      
      // Scroll to form
      if (calculationForm) {
          calculationForm.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
          });
      }
  }

  function hideFormAndResults() {
      const calculationForm = document.getElementById('calculation-form');
      const resultsSection = document.getElementById('results-section');
      const exportSection = document.getElementById('export-section');
      
      if (calculationForm) calculationForm.classList.add('hidden');
      if (resultsSection) resultsSection.classList.add('hidden');
      if (exportSection) exportSection.classList.add('hidden');
  }
  
  function calculateDose() {
      // Función simplificada para el ejemplo
      console.log('Cálculo de dosis no implementado en esta versión');
      Utils.showToast('Función de cálculo en desarrollo', 'info');
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
                   <p>Las incidencias registradas aparecerán aquí</p>
               </div>
           `;
           return;
       }

       const incidentsHtml = incidents.map(incident => {
           const typeNames = {
               'solid-feces': 'Heces Sólidas',
               'liquid-feces': 'Heces Líquidas',
               'vomit': 'Vómitos',
               'pseudomonas': 'Pseudomonas',
               'other': 'Otra'
           };

           const severityClass = {
               'low': 'info',
               'medium': 'warning',
               'high': 'warning',
               'critical': 'danger'
           };

           return `
               <div class="incident-item">
                   <div class="incident-header">
                       <div class="incident-type ${severityClass[incident.severity] || 'info'}">
                           ${typeNames[incident.type] || incident.type}
                       </div>
                       <div class="incident-date">
                           ${new Date(incident.createdAt).toLocaleDateString('es-ES')}
                       </div>
                   </div>
                   <div class="incident-body">
                       <h4>${incident.poolName} - ${incident.hotel}</h4>
                       <p><strong>Descripción:</strong> ${incident.description}</p>
                       ${incident.actions ? `<p><strong>Acciones:</strong> ${incident.actions}</p>` : ''}
                       <p><strong>Gravedad:</strong> ${incident.severity}</p>
                       <p><strong>Estado:</strong> ${incident.status}</p>
                   </div>
                   <div class="incident-actions">
                       <button class="btn btn-sm btn-secondary" onclick="viewIncidentDetails(${incident.id})">
                           <i class="fas fa-eye"></i> Ver detalles
                       </button>
                       <button class="btn btn-sm btn-primary" onclick="editIncident(${incident.id})">
                           <i class="fas fa-edit"></i> Editar
                       </button>
                   </div>
               </div>
           `;
       }).join('');

       incidentsList.innerHTML = incidentsHtml;
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

   // Funciones globales para ser llamadas desde el HTML
   window.viewIncidentDetails = function(incidentId) {
       const incidents = AppState.get('poolIncidents') || [];
       const incident = incidents.find(i => i.id === incidentId);
       if (!incident) return;

       alert(`Detalles de la incidencia:\n\nTipo: ${incident.type}\nDescripción: ${incident.description}\nGravedad: ${incident.severity}\nAcciones: ${incident.actions || 'Ninguna'}`);
   };

   window.editIncident = function(incidentId) {
       // Para editar una incidencia, abrir el modal de registro con los datos de la incidencia
       const incidents = AppState.get('poolIncidents') || [];
       const incident = incidents.find(i => i.id === incidentId);
       if (!incident) return;

       // Cambiar a la pestaña de registros
       document.querySelector('[data-tab="records-tab"]').click();
       
       setTimeout(() => {
           // Buscar el registro asociado a esta incidencia
           const records = AppState.get('poolRecords') || [];
           const relatedRecord = records.find(r => 
               r.poolId === incident.poolId && 
               new Date(r.date).toDateString() === new Date(incident.createdAt).toDateString()
           );
           
           if (relatedRecord) {
               openRecordModal(relatedRecord.id);
           } else {
               // Si no hay registro asociado, crear uno nuevo con la incidencia
               openRecordModal();
               setTimeout(() => {
                   // Preseleccionar la piscina
                   const recordPoolSelect = document.getElementById('record-pool-select');
                   if (recordPoolSelect) {
                       recordPoolSelect.value = incident.poolId;
                   }
                   
                   // Preseleccionar la fecha de la incidencia
                   const incidentDate = new Date(incident.createdAt);
                   document.getElementById('record-date').value = incidentDate.toISOString().split('T')[0];
                   document.getElementById('record-time').value = incidentDate.toTimeString().substr(0, 5);
                   
                   // Activar y llenar la sección de incidencia
                   const incidentSection = document.getElementById('incident-section');
                   const addIncidentBtn = document.getElementById('add-incident-btn');
                   
                   if (incidentSection && addIncidentBtn) {
                       incidentSection.classList.remove('hidden');
                       addIncidentBtn.innerHTML = '<i class="fas fa-minus"></i> Quitar Incidencia';
                       addIncidentBtn.className = 'btn btn-secondary';
                       
                       document.getElementById('record-incident-type').value = incident.type;
                       document.getElementById('record-incident-description').value = incident.description;
                       document.getElementById('record-incident-severity').value = incident.severity;
                       document.getElementById('record-incident-actions').value = incident.actions || '';
                   }
               }, 100);
           }
       }, 100);
   };

   // Función de reseteo de paginación
   function resetPagination() {
       currentPage = 1;
       const paginationControls = document.getElementById('pagination-controls');
       if (paginationControls) {
           paginationControls.innerHTML = '';
       }
   }

   // Inicializar el módulo
   initPoolsModule();
});