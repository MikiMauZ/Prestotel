// ====================================================
// MÓDULO DE ADMINISTRACIÓN CORREGIDO - js/modules/admin.js
// ====================================================

// Variables globales del módulo
let adminView;
let currentHotelId = null;
let currentPoolTypeId = null;
let currentUserId = null;

// ====================================================
// INICIALIZACIÓN PRINCIPAL
// ====================================================

function initAdminModule() {
    console.log('🔧 Inicializando módulo de administración...');
    
    // Buscar o crear la vista del módulo
    adminView = document.getElementById('admin-view');
    if (!adminView) {
        console.log('Vista de administración no encontrada. Creándola...');
        adminView = document.createElement('div');
        adminView.id = 'admin-view';
        adminView.className = 'module-view hidden';
        const contentContainer = document.querySelector('.content');
        if (contentContainer) {
            contentContainer.appendChild(adminView);
        } else {
            console.error('ERROR: No se encontró el contenedor .content');
            return;
        }
    }
    
    // ⭐ VERIFICACIÓN DE PERMISOS CORREGIDA
    if (!checkAdminAccess()) {
        return;
    }
    
    // Cargar datos necesarios
    loadConfigurationData();
    
    // Renderizar estructura del módulo
    renderModuleStructure();
    
    // Configurar eventos
    setupAdminEvents();
    
    console.log('✅ Módulo de administración inicializado correctamente');
}

// ====================================================
// VERIFICACIÓN DE PERMISOS CORREGIDA
// ====================================================

function checkAdminAccess() {
    console.log('🔐 Verificando acceso de administración...');
    
    const currentUser = AppState.get('currentUser');
    
    // Verificar si el usuario existe
    if (!currentUser) {
        console.warn('⚠️ No hay usuario actual definido');
        renderAccessDenied('No hay sesión activa');
        return false;
    }
    
    console.log(`👤 Usuario detectado: ${currentUser.name} (${currentUser.userLevel})`);
    
    // ⭐ SUPER ADMIN = ACCESO TOTAL SIN RESTRICCIONES
    if (currentUser.userLevel === 'super_admin') {
        console.log('👑 SUPER ADMIN detectado - Acceso total garantizado');
        return true;
    }
    
    // ⭐ CLIENT ADMIN = VERIFICAR PERMISOS Y LICENCIAS
    if (currentUser.userLevel === 'client_admin') {
        console.log('🏢 CLIENT ADMIN detectado - Verificando licencias...');
        
        // Verificar si tiene módulo admin habilitado
        if (typeof LicensingModule !== 'undefined') {
            if (!LicensingModule.isModuleEnabled('admin')) {
                console.warn('⚠️ Módulo admin no habilitado en licencia del cliente');
                renderAccessDenied('Módulo no habilitado en tu plan');
                return false;
            }
        }
        
        console.log('✅ CLIENT ADMIN autorizado');
        return true;
    }
    
    // ⭐ OTROS NIVELES = SIN ACCESO
    console.warn(`❌ Nivel de usuario sin permisos de admin: ${currentUser.userLevel}`);
    renderAccessDenied('Permisos insuficientes');
    return false;
}

function renderAccessDenied(reason) {
    console.log(`🚫 Renderizando acceso denegado: ${reason}`);
    
    adminView.innerHTML = `
        <div class="access-denied">
            <div class="access-denied-content">
                <i class="fas fa-lock"></i>
                <h2>Acceso Denegado</h2>
                <p>No tienes permisos para acceder al panel de administración.</p>
                <p><strong>Motivo:</strong> ${reason}</p>
                <button id="go-to-dashboard" class="btn btn-primary">
                    <i class="fas fa-arrow-left"></i> Volver al Panel Principal
                </button>
            </div>
        </div>
    `;
    
    // Configurar botón para volver al dashboard
    const btnGoToDashboard = document.getElementById('go-to-dashboard');
    if (btnGoToDashboard) {
        btnGoToDashboard.addEventListener('click', () => {
            showModule('dashboard-view');
        });
    }
}

// ====================================================
// ESTRUCTURA PRINCIPAL DEL MÓDULO
// ====================================================

function renderModuleStructure() {
    console.log('🏗️ Renderizando estructura del módulo admin...');
    
    const currentUser = AppState.get('currentUser');
    
    // ⭐ RENDERIZADO DIFERENTE SEGÚN TIPO DE USUARIO
    if (currentUser.userLevel === 'super_admin') {
        renderSuperAdminView(currentUser);
    } else if (currentUser.userLevel === 'client_admin') {
        renderClientAdminView(currentUser);
    }
}

// ⭐ VISTA PARA SUPER ADMIN
function renderSuperAdminView(currentUser) {
    adminView.innerHTML = `
        <h2 class="section-title">
            <i class="fas fa-crown"></i> Administración - Super Admin
            <span class="admin-user-info">- ${currentUser.name}</span>
        </h2>
        
        <div class="alert alert-info">
            <i class="fas fa-info-circle"></i>
            <strong>Modo Super Admin:</strong> Tienes acceso completo al sistema. Aquí puedes gestionar todos los clientes y sus configuraciones.
        </div>
        
        <!-- Navegación de pestañas Super Admin -->
        <div class="admin-tabs">
            <ul class="nav-tabs">
                <li class="nav-item">
                    <a class="nav-link active" data-tab="clients-tab">
                        <i class="fas fa-building"></i> Clientes
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" data-tab="system-tab">
                        <i class="fas fa-server"></i> Sistema
                    </a>
                </li>
            </ul>
            
            <div class="tab-content">
                <!-- Pestaña de Clientes -->
                <div id="clients-tab" class="tab-pane active">
                    ${renderClientsTab()}
                </div>
                
                <!-- Pestaña de Sistema -->
                <div id="system-tab" class="tab-pane">
                    ${renderSystemTab()}
                </div>
            </div>
        </div>
    `;
}

// ⭐ VISTA PARA CLIENT ADMIN
function renderClientAdminView(currentUser) {
    const licenseInfo = getLicenseInfoSafe();
    
    adminView.innerHTML = `
        <h2 class="section-title">
            <i class="fas fa-cogs"></i> Administración
            <span class="admin-user-info">- ${currentUser.name}</span>
        </h2>
        
        <!-- Información de Licencia -->
        <div class="admin-license-info">
            ${renderLicenseWidgetSafe()}
        </div>
        
        <!-- Navegación de pestañas Client Admin -->
        <div class="admin-tabs">
            <ul class="nav-tabs">
                <li class="nav-item">
                    <a class="nav-link active" data-tab="hotels-tab">
                        <i class="fas fa-hotel"></i> Hoteles
                        <span class="tab-counter">${licenseInfo.hotelsUsed}/${licenseInfo.hotelsLimit}</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" data-tab="settings-tab">
                        <i class="fas fa-sliders-h"></i> Configuración
                    </a>
                </li>
            </ul>
            
            <div class="tab-content">
                <!-- Pestaña de Hoteles -->
                <div id="hotels-tab" class="tab-pane active">
                    ${renderHotelsTab()}
                </div>
                
                <!-- Pestaña de Configuración -->
                <div id="settings-tab" class="tab-pane">
                    ${renderSettingsTab()}
                </div>
            </div>
        </div>
    `;
}

// ====================================================
// PESTAÑAS PARA SUPER ADMIN
// ====================================================

function renderClientsTab() {
    return `
        <div class="tab-header">
            <h3>Gestión de Clientes</h3>
            <button id="btn-new-client" class="btn btn-primary">
                <i class="fas fa-plus"></i> Nuevo Cliente
            </button>
        </div>
        
        <div class="panel">
            <p>Como Super Admin, aquí puedes gestionar todos los clientes del sistema Prestotel.</p>
            
            <div class="empty-state">
                <i class="fas fa-building fa-3x"></i>
                <h3>Gestión de Clientes</h3>
                <p>Esta funcionalidad se desarrollará próximamente.</p>
                <p>Aquí podrás crear, editar y gestionar las licencias de todos tus clientes.</p>
            </div>
        </div>
    `;
}

function renderSystemTab() {
    return `
        <div class="tab-header">
            <h3>Configuración del Sistema</h3>
        </div>
        
        <div class="panel">
            <h4>Información del Sistema</h4>
            <div class="settings-section">
                <div class="form-row">
                    <div class="form-group">
                        <label>Empresa</label>
                        <input type="text" class="form-control" value="Prestotel Systems" readonly>
                    </div>
                    <div class="form-group">
                        <label>Versión</label>
                        <input type="text" class="form-control" value="2.0.0" readonly>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Clientes Activos</label>
                        <input type="text" class="form-control" value="1" readonly>
                    </div>
                    <div class="form-group">
                        <label>Total Hoteles</label>
                        <input type="text" class="form-control" value="${AppState.get('hotels').length}" readonly>
                    </div>
                </div>
            </div>
            
            <div class="settings-actions">
                <button class="btn btn-secondary">
                    <i class="fas fa-download"></i> Exportar Datos
                </button>
                <button class="btn btn-warning">
                    <i class="fas fa-cog"></i> Configuración Avanzada
                </button>
            </div>
        </div>
    `;
}

// ====================================================
// PESTAÑAS PARA CLIENT ADMIN (Mantener las existentes)
// ====================================================

function renderHotelsTab() {
    const hotels = AppState.get('hotels') || [];
    const licenseInfo = getLicenseInfoSafe();
    
    return `
        <div class="tab-header">
            <h3>Gestión de Hoteles</h3>
            <div class="tab-header-actions">
                <button id="btn-new-hotel" class="btn btn-primary" ${licenseInfo.atHotelLimit ? 'disabled title="Límite de hoteles alcanzado"' : ''}>
                    <i class="fas fa-plus"></i> Nuevo Hotel
                </button>
                ${licenseInfo.nearHotelLimit ? `
                    <div class="limit-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        Cerca del límite (${licenseInfo.hotelsUsed}/${licenseInfo.hotelsLimit})
                    </div>
                ` : ''}
            </div>
        </div>
        
        <div class="panel">
            <p>Configura los hoteles que gestionará la aplicación.</p>
            
            <!-- Formulario para añadir/editar hotel -->
            <div id="hotel-form" class="form-container hidden">
                <h4 class="form-title" id="hotel-form-title">Nuevo Hotel</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="hotel-name">Nombre del hotel *</label>
                        <input type="text" id="hotel-name" class="form-control" placeholder="Nombre completo" required>
                    </div>
                    <div class="form-group">
                        <label for="hotel-code">Código *</label>
                        <input type="text" id="hotel-code" class="form-control" placeholder="Código corto" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="hotel-location">Ubicación</label>
                        <input type="text" id="hotel-location" class="form-control" placeholder="Ciudad, País">
                    </div>
                    <div class="form-group">
                        <label for="hotel-address">Dirección</label>
                        <input type="text" id="hotel-address" class="form-control" placeholder="Dirección completa">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="hotel-phone">Teléfono</label>
                        <input type="tel" id="hotel-phone" class="form-control" placeholder="Teléfono">
                    </div>
                    <div class="form-group">
                        <label for="hotel-email">Email</label>
                        <input type="email" id="hotel-email" class="form-control" placeholder="Email">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-check-label">
                        <input type="checkbox" id="hotel-active" checked> Hotel activo
                    </label>
                </div>
                <div class="form-actions">
                    <button id="cancel-hotel-btn" class="btn btn-secondary">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button id="save-hotel-btn" class="btn btn-primary">
                        <i class="fas fa-save"></i> Guardar
                    </button>
                </div>
            </div>
            
            <!-- Lista de hoteles -->
            <div class="hotels-list">
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Código</th>
                                <th>Ubicación</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${hotels.map(hotel => `
                                <tr class="${hotel.active ? '' : 'inactive'}">
                                    <td><strong>${hotel.name}</strong></td>
                                    <td><code>${hotel.code}</code></td>
                                    <td>${hotel.location || '-'}</td>
                                    <td>
                                        <span class="badge ${hotel.active ? 'badge-success' : 'badge-secondary'}">
                                            ${hotel.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary" onclick="editHotel(${hotel.id})" title="Editar">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteHotel(${hotel.id})" title="Eliminar">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    ${hotels.length === 0 ? `
                        <div class="empty-state">
                            <i class="fas fa-hotel fa-3x"></i>
                            <h3>No hay hoteles configurados</h3>
                            <p>Comienza agregando tu primer hotel</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function renderSettingsTab() {
    const currentUser = AppState.get('currentUser');
    
    return `
        <div class="tab-header">
            <h3>Configuración</h3>
        </div>
        
        <div class="panel">
            <h4>Información del Usuario</h4>
            <div class="settings-section">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nombre</label>
                        <input type="text" class="form-control" value="${currentUser.name}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="text" class="form-control" value="${currentUser.email}" readonly>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Nivel de Usuario</label>
                        <input type="text" class="form-control" value="${currentUser.userLevel.toUpperCase()}" readonly>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ====================================================
// FUNCIONES DE UTILIDAD SEGURAS
// ====================================================

function getLicenseInfoSafe() {
    try {
        if (typeof LicensingModule !== 'undefined' && LicensingModule.getLicenseStatus) {
            return LicensingModule.getLicenseStatus();
        }
    } catch (error) {
        console.warn('⚠️ Error obteniendo info de licencia:', error);
    }
    
    // Fallback seguro
    const hotels = AppState.get('hotels') || [];
    return {
        hotelsUsed: hotels.length,
        hotelsLimit: 999,
        atHotelLimit: false,
        nearHotelLimit: false
    };
}

function renderLicenseWidgetSafe() {
    try {
        if (typeof LicensingModule !== 'undefined' && LicensingModule.renderLicenseWidget) {
            return LicensingModule.renderLicenseWidget();
        }
    } catch (error) {
        console.warn('⚠️ Error renderizando widget de licencia:', error);
    }
    
    return '<div class="alert alert-info">Información de licencia no disponible</div>';
}

// ====================================================
// GESTIÓN DE HOTELES (Funciones existentes simplificadas)
// ====================================================

function showHotelForm() {
    const hotelForm = document.getElementById('hotel-form');
    if (hotelForm) {
        hotelForm.classList.remove('hidden');
        document.getElementById('hotel-name').focus();
    }
}

function hideHotelForm() {
    const hotelForm = document.getElementById('hotel-form');
    if (hotelForm) {
        hotelForm.classList.add('hidden');
    }
    currentHotelId = null;
}

function editHotel(hotelId) {
    const hotels = AppState.get('hotels');
    const hotel = hotels.find(h => h.id === hotelId);
    
    if (!hotel) {
        alert('Hotel no encontrado');
        return;
    }
    
    // Llenar formulario
    document.getElementById('hotel-name').value = hotel.name || '';
    document.getElementById('hotel-code').value = hotel.code || '';
    document.getElementById('hotel-location').value = hotel.location || '';
    document.getElementById('hotel-address').value = hotel.address || '';
    document.getElementById('hotel-phone').value = hotel.phone || '';
    document.getElementById('hotel-email').value = hotel.email || '';
    document.getElementById('hotel-active').checked = hotel.active !== false;
    
    document.getElementById('hotel-form-title').textContent = 'Editar Hotel';
    currentHotelId = hotelId;
    showHotelForm();
}

function saveHotel() {
    const name = document.getElementById('hotel-name').value.trim();
    const code = document.getElementById('hotel-code').value.trim().toUpperCase();
    
    if (!name || !code) {
        alert('Por favor completa nombre y código');
        return;
    }
    
    const hotels = [...AppState.get('hotels')];
    const hotelData = {
        name,
        code,
        location: document.getElementById('hotel-location').value.trim(),
        address: document.getElementById('hotel-address').value.trim(),
        phone: document.getElementById('hotel-phone').value.trim(),
        email: document.getElementById('hotel-email').value.trim(),
        active: document.getElementById('hotel-active').checked,
        updatedAt: new Date()
    };
    
    if (currentHotelId) {
        // Actualizar
        const index = hotels.findIndex(h => h.id === currentHotelId);
        if (index !== -1) {
            hotels[index] = { ...hotels[index], ...hotelData };
        }
    } else {
        // Crear nuevo
        const maxId = hotels.reduce((max, hotel) => Math.max(max, hotel.id || 0), 0);
        const newHotel = {
            ...hotelData,
            id: maxId + 1,
            createdAt: new Date(),
            createdBy: AppState.get('currentUser')?.email || 'admin'
        };
        hotels.push(newHotel);
    }
    
    AppState.update('hotels', hotels);
    hideHotelForm();
    
    // Recargar vista
    const hotelsTab = document.getElementById('hotels-tab');
    if (hotelsTab) {
        hotelsTab.innerHTML = renderHotelsTab();
        setupHotelEvents();
    }
    
    alert('Hotel guardado correctamente');
}

function deleteHotel(hotelId) {
    const hotels = AppState.get('hotels');
    const hotel = hotels.find(h => h.id === hotelId);
    
    if (!hotel) {
        alert('Hotel no encontrado');
        return;
    }
    
    if (confirm(`¿Eliminar hotel "${hotel.name}"?`)) {
        const updatedHotels = hotels.filter(h => h.id !== hotelId);
        AppState.update('hotels', updatedHotels);
        
        // Recargar vista
        const hotelsTab = document.getElementById('hotels-tab');
        if (hotelsTab) {
            hotelsTab.innerHTML = renderHotelsTab();
            setupHotelEvents();
        }
        
        alert('Hotel eliminado');
    }
}

// ====================================================
// CONFIGURACIÓN DE EVENTOS
// ====================================================

function setupAdminEvents() {
    setupTabNavigation();
    setupHotelEvents();
    console.log('🎛️ Eventos de administración configurados');
}

function setupTabNavigation() {
    const tabLinks = document.querySelectorAll('.nav-link[data-tab]');
    
    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const tabId = link.getAttribute('data-tab');
            
            // Actualizar navegación activa
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Mostrar contenido de pestaña
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            const targetPane = document.getElementById(tabId);
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });
}

function setupHotelEvents() {
    const btnNewHotel = document.getElementById('btn-new-hotel');
    if (btnNewHotel) {
        btnNewHotel.addEventListener('click', showHotelForm);
    }
    
    const btnCancelHotel = document.getElementById('cancel-hotel-btn');
    if (btnCancelHotel) {
        btnCancelHotel.addEventListener('click', hideHotelForm);
    }
    
    const btnSaveHotel = document.getElementById('save-hotel-btn');
    if (btnSaveHotel) {
        btnSaveHotel.addEventListener('click', saveHotel);
    }
}

// ====================================================
// DATOS MOCK (Solo para Client Admin)
// ====================================================

function loadConfigurationData() {
    console.log('📊 Cargando datos de configuración...');
    
    // NO cargar datos mock para Super Admin
    const currentUser = AppState.get('currentUser');
    if (currentUser && currentUser.userLevel === 'super_admin') {
        console.log('👑 Super Admin - Sin datos mock');
        return;
    }
    
    // Solo cargar para Client Admin si no hay hoteles
    if (AppState.get('hotels').length === 0) {
        console.log('🏨 Cargando hoteles de ejemplo para Client Admin...');
        const mockHotels = [
            {
                id: 1,
                name: "Hotel Ejemplo",
                code: "EJEMPLO",
                location: "Ciudad Ejemplo",
                address: "Calle Ejemplo 123",
                phone: "+34 900 000 000",
                email: "ejemplo@hotel.com",
                active: true,
                createdBy: "admin@ejemplo.com",
                createdAt: new Date(),
                settings: {
                    timezone: "Europe/Madrid",
                    currency: "EUR",
                    language: "es"
                }
            }
        ];
        
        AppState.update('hotels', mockHotels);
    }
}

// ====================================================
// EXPORTACIÓN Y EVENTOS GLOBALES
// ====================================================

// Hacer funciones disponibles globalmente
if (typeof window !== 'undefined') {
    window.editHotel = editHotel;
    window.deleteHotel = deleteHotel;
    window.showHotelForm = showHotelForm;
    window.hideHotelForm = hideHotelForm;
    window.saveHotel = saveHotel;
}

// Objeto principal del módulo
const AdminModule = {
    init: initAdminModule,
    checkAccess: checkAdminAccess,
    showHotelForm: showHotelForm,
    editHotel: editHotel,
    deleteHotel: deleteHotel,
    saveHotel: saveHotel,
    hideHotelForm: hideHotelForm
};

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.AdminModule = AdminModule;
}

// Escuchar cambios de módulo
if (typeof AppState !== 'undefined') {
    AppState.subscribe('currentModule', (moduleId) => {
        if (moduleId === 'admin-view') {
            setTimeout(() => {
                initAdminModule();
            }, 100);
        }
    });
}

console.log('👑 Módulo de administración corregido - Super Admin y Client Admin soportados');