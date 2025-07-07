// ====================================================
// MÓDULO DE ADMINISTRACIÓN COMPLETO - js/modules/admin.js
// ====================================================
// Sistema de administración con control de licencias integrado

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
    
    // Verificar permisos de administración
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
// VERIFICACIÓN DE PERMISOS
// ====================================================

function checkAdminAccess() {
    const currentUser = AppState.get('currentUser');
    
    // Verificar si el usuario existe y tiene permisos de admin
    if (!currentUser) {
        console.warn('⚠️ No hay usuario actual definido');
        renderAccessDenied('No hay sesión activa');
        return false;
    }
    
    // Verificar nivel de usuario (client_admin o super_admin)
    const allowedLevels = ['client_admin', 'super_admin'];
    if (!allowedLevels.includes(currentUser.userLevel)) {
        console.warn(`⚠️ Usuario sin permisos de admin: ${currentUser.userLevel}`);
        renderAccessDenied('Permisos insuficientes');
        return false;
    }
    
    // Verificar que el módulo admin esté habilitado en la licencia
    if (!LicensingModule.isModuleEnabled('admin')) {
        console.warn('⚠️ Módulo de administración no habilitado en la licencia');
        renderAccessDenied('Módulo no habilitado en tu plan');
        return false;
    }
    
    console.log(`✅ Acceso de administración verificado para: ${currentUser.name} (${currentUser.userLevel})`);
    return true;
}

function renderAccessDenied(reason) {
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
    const currentUser = AppState.get('currentUser');
    const licenseInfo = LicensingModule.getLicenseStatus();
    
    adminView.innerHTML = `
        <h2 class="section-title">
            <i class="fas fa-cogs"></i> Administración
            <span class="admin-user-info">- ${currentUser.name} (${currentUser.userLevel})</span>
        </h2>
        
        <!-- Información de Licencia (Widget Superior) -->
        <div class="admin-license-info">
            ${LicensingModule.renderLicenseWidget()}
        </div>
        
        <!-- Navegación de pestañas -->
        <div class="admin-tabs">
            <ul class="nav-tabs">
                <li class="nav-item">
                    <a class="nav-link active" data-tab="hotels-tab">
                        <i class="fas fa-hotel"></i> Hoteles
                        <span class="tab-counter">${licenseInfo.hotelsUsed}/${licenseInfo.hotelsLimit}</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" data-tab="pool-types-tab">
                        <i class="fas fa-swimming-pool"></i> Tipos de Piscina
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" data-tab="users-tab">
                        <i class="fas fa-users-cog"></i> Usuarios
                        <span class="tab-counter">${licenseInfo.usersUsed}/${licenseInfo.usersLimit}</span>
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
                
                <!-- Pestaña de Tipos de Piscina -->
                <div id="pool-types-tab" class="tab-pane">
                    ${renderPoolTypesTab()}
                </div>
                
                <!-- Pestaña de Usuarios -->
                <div id="users-tab" class="tab-pane">
                    ${renderUsersTab()}
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
// PESTAÑA DE HOTELES
// ====================================================

function renderHotelsTab() {
    const hotels = AppState.get('hotels') || [];
    const licenseInfo = LicensingModule.getLicenseStatus();
    
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
            <p>Configura los hoteles que gestionará la aplicación. Cada hotel debe tener un código único que se utilizará internamente.</p>
            
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
                        <input type="text" id="hotel-code" class="form-control" placeholder="Código corto (3-10 caracteres)" required>
                        <small class="form-text">Código único para identificar el hotel internamente</small>
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
                        <input type="tel" id="hotel-phone" class="form-control" placeholder="Teléfono de contacto">
                    </div>
                    <div class="form-group">
                        <label for="hotel-email">Email</label>
                        <input type="email" id="hotel-email" class="form-control" placeholder="Email de contacto">
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
                                <th>Creado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${hotels.map(hotel => `
                                <tr class="${hotel.active ? '' : 'inactive'}">
                                    <td>
                                        <strong>${hotel.name}</strong>
                                        ${hotel.email ? `<br><small class="text-muted">${hotel.email}</small>` : ''}
                                    </td>
                                    <td><code>${hotel.code}</code></td>
                                    <td>${hotel.location || '-'}</td>
                                    <td>
                                        <span class="badge ${hotel.active ? 'badge-success' : 'badge-secondary'}">
                                            ${hotel.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td>${hotel.createdAt ? new Date(hotel.createdAt).toLocaleDateString() : '-'}</td>
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

function renderPoolTypesTab() {
    return `
        <div class="tab-header">
            <h3>Gestión de Tipos de Piscina</h3>
            <button id="btn-new-pool-type" class="btn btn-primary">
                <i class="fas fa-plus"></i> Nuevo Tipo de Piscina
            </button>
        </div>
        
        <div class="panel">
            <p>Define los diferentes tipos de piscinas que se pueden configurar en el sistema.</p>
            <!-- Contenido de tipos de piscina -->
            <div class="empty-state">
                <i class="fas fa-swimming-pool fa-3x"></i>
                <h3>Gestión de Tipos de Piscina</h3>
                <p>Esta funcionalidad se implementará próximamente</p>
            </div>
        </div>
    `;
}

function renderUsersTab() {
    return `
        <div class="tab-header">
            <h3>Gestión de Usuarios</h3>
            <button id="btn-new-user" class="btn btn-primary">
                <i class="fas fa-plus"></i> Nuevo Usuario
            </button>
        </div>
        
        <div class="panel">
            <p>Gestiona los usuarios que tienen acceso al sistema.</p>
            <!-- Contenido de usuarios -->
            <div class="empty-state">
                <i class="fas fa-users-cog fa-3x"></i>
                <h3>Gestión de Usuarios</h3>
                <p>Esta funcionalidad se implementará próximamente</p>
            </div>
        </div>
    `;
}

function renderSettingsTab() {
    const clientLicense = AppState.get('clientLicense');
    
    return `
        <div class="tab-header">
            <h3>Configuración del Sistema</h3>
        </div>
        
        <div class="panel">
            <h4>Información de la Empresa</h4>
            <div class="settings-section">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nombre de la empresa</label>
                        <input type="text" class="form-control" value="${clientLicense.clientName}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Plan actual</label>
                        <input type="text" class="form-control" value="${clientLicense.plan.toUpperCase()}" readonly>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Estado de la licencia</label>
                        <input type="text" class="form-control" value="${clientLicense.status.toUpperCase()}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Vencimiento</label>
                        <input type="text" class="form-control" value="${new Date(clientLicense.expiryDate).toLocaleDateString()}" readonly>
                    </div>
                </div>
            </div>
            
            <h4>Límites del Plan</h4>
            <div class="settings-section">
                <div class="limits-grid">
                    <div class="limit-item">
                        <span class="limit-label">Hoteles máximos:</span>
                        <span class="limit-value">${clientLicense.limits.maxHotels}</span>
                    </div>
                    <div class="limit-item">
                        <span class="limit-label">Usuarios máximos:</span>
                        <span class="limit-value">${clientLicense.limits.maxUsers}</span>
                    </div>
                    <div class="limit-item">
                        <span class="limit-label">Almacenamiento:</span>
                        <span class="limit-value">${clientLicense.limits.maxStorageGB} GB</span>
                    </div>
                    <div class="limit-item">
                        <span class="limit-label">Tareas/mes:</span>
                        <span class="limit-value">${clientLicense.limits.maxTasksPerMonth.toLocaleString()}</span>
                    </div>
                </div>
            </div>
            
            <h4>Módulos Habilitados</h4>
            <div class="settings-section">
                <div class="modules-grid">
                    ${clientLicense.enabledModules.map(module => `
                        <div class="module-item enabled">
                            <i class="fas fa-check-circle"></i>
                            <span>${getModuleDisplayName(module)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="settings-actions">
                <button class="btn btn-primary" onclick="LicensingModule.contactPrestotel()">
                    <i class="fas fa-phone"></i> Contactar con Prestotel
                </button>
            </div>
        </div>
    `;
}

// ====================================================
// GESTIÓN DE HOTELES - FUNCIONES PRINCIPALES
// ====================================================

function showHotelForm() {
    // ⭐ NUEVA VALIDACIÓN DE LÍMITES ANTES DE MOSTRAR FORMULARIO
    const validation = LicensingModule.canCreateHotel();
    
    if (!validation.allowed) {
        console.warn('🚫 Intento de crear hotel bloqueado:', validation.message);
        Utils.showToast(validation.message, 'error');
        
        if (validation.needsUpgrade) {
            // Mostrar modal de upgrade después de un breve delay
            setTimeout(() => {
                LicensingModule.showUpgradeModal('hotels');
            }, 500);
        }
        
        return; // ❌ BLOQUEAR CREACIÓN DE HOTEL
    }
    
    // ✅ PERMITIR CREACIÓN - Mostrar advertencia si está cerca del límite
    if (validation.warning) {
        console.warn('⚠️ Cerca del límite de hoteles:', validation.message);
        Utils.showToast(validation.message, 'warning', 4000);
    }
    
    // 📊 LOG DE ACCIÓN PERMITIDA
    LicensingModule.logLicenseAction('hotel_form_opened', {
        currentHotels: validation.currentCount,
        maxHotels: validation.maxCount,
        nearLimit: validation.warning || false
    });
    
    // Limpiar formulario para nuevo hotel
    document.getElementById('hotel-name').value = '';
    document.getElementById('hotel-code').value = '';
    document.getElementById('hotel-location').value = '';
    document.getElementById('hotel-address').value = '';
    document.getElementById('hotel-phone').value = '';
    document.getElementById('hotel-email').value = '';
    document.getElementById('hotel-active').checked = true;
    
    // Actualizar título del formulario
    document.getElementById('hotel-form-title').textContent = 'Nuevo Hotel';
    
    // Limpiar ID actual
    currentHotelId = null;
    
    // Mostrar formulario
    const hotelForm = document.getElementById('hotel-form');
    if (hotelForm) {
        hotelForm.classList.remove('hidden');
        document.getElementById('hotel-name').focus();
    }
    
    console.log('📋 Formulario de nuevo hotel mostrado');
}

function editHotel(hotelId) {
    const hotels = AppState.get('hotels');
    const hotel = hotels.find(h => h.id === hotelId);
    
    if (!hotel) {
        Utils.showToast('Hotel no encontrado', 'error');
        return;
    }
    
    // Llenar formulario con datos existentes
    document.getElementById('hotel-name').value = hotel.name || '';
    document.getElementById('hotel-code').value = hotel.code || '';
    document.getElementById('hotel-location').value = hotel.location || '';
    document.getElementById('hotel-address').value = hotel.address || '';
    document.getElementById('hotel-phone').value = hotel.phone || '';
    document.getElementById('hotel-email').value = hotel.email || '';
    document.getElementById('hotel-active').checked = hotel.active !== false;
    
    // Actualizar título del formulario
    document.getElementById('hotel-form-title').textContent = 'Editar Hotel';
    
    // Guardar ID para actualización
    currentHotelId = hotelId;
    
    // Mostrar formulario
    const hotelForm = document.getElementById('hotel-form');
    if (hotelForm) {
        hotelForm.classList.remove('hidden');
        document.getElementById('hotel-name').focus();
    }
    
    console.log(`✏️ Editando hotel ID: ${hotelId}`);
}

function saveHotel() {
    // Obtener valores del formulario
    const name = document.getElementById('hotel-name').value.trim();
    const code = document.getElementById('hotel-code').value.trim();
    const location = document.getElementById('hotel-location').value.trim();
    const address = document.getElementById('hotel-address').value.trim();
    const phone = document.getElementById('hotel-phone').value.trim();
    const email = document.getElementById('hotel-email').value.trim();
    const active = document.getElementById('hotel-active').checked;
    
    // Validar campos obligatorios
    if (!name) {
        Utils.showToast('Por favor introduce un nombre para el hotel', 'error');
        document.getElementById('hotel-name').focus();
        return;
    }
    
    if (!code) {
        Utils.showToast('Por favor introduce un código para el hotel', 'error');
        document.getElementById('hotel-code').focus();
        return;
    }
    
    // Validar longitud del código
    if (code.length < 3 || code.length > 10) {
        Utils.showToast('El código debe tener entre 3 y 10 caracteres', 'error');
        document.getElementById('hotel-code').focus();
        return;
    }
    
    // Validar email si se proporciona
    if (email && !isValidEmail(email)) {
        Utils.showToast('Por favor introduce un email válido', 'error');
        document.getElementById('hotel-email').focus();
        return;
    }
    
    // Preparar datos del hotel
    const hotelData = {
        name,
        code: code.toUpperCase(),
        location,
        address,
        phone,
        email,
        active,
        updatedAt: new Date()
    };
    
    const hotels = [...AppState.get('hotels')];
    
    // Verificar si el código ya existe (excepto para el hotel actual en caso de edición)
    const codeExists = hotels.some(h => 
        h.code.toLowerCase() === code.toLowerCase() && 
        (!currentHotelId || h.id !== currentHotelId)
    );
    
    if (codeExists) {
        Utils.showToast('El código ya está en uso por otro hotel. Por favor usa uno diferente.', 'error');
        document.getElementById('hotel-code').focus();
        return;
    }
    
    if (currentHotelId) {
        // Actualizar hotel existente
        const index = hotels.findIndex(h => h.id === currentHotelId);
        
        if (index !== -1) {
            hotels[index] = {
                ...hotels[index],
                ...hotelData
            };
            
            AppState.update('hotels', hotels);
            Utils.showToast('Hotel actualizado correctamente', 'success');
            
            // Log de actualización
            LicensingModule.logLicenseAction('hotel_updated', {
                hotelId: currentHotelId,
                hotelName: name,
                hotelCode: code
            });
            
            console.log(`✅ Hotel actualizado: ${name} (${code})`);
        } else {
            Utils.showToast('Error al actualizar el hotel', 'error');
        }
    } else {
        // ⭐ VERIFICACIÓN FINAL DE LÍMITES ANTES DE CREAR
        const validation = LicensingModule.canCreateHotel();
        if (!validation.allowed) {
            Utils.showToast(validation.message, 'error');
            LicensingModule.showUpgradeModal('hotels');
            return;
        }
        
        // Crear nuevo hotel
        const maxId = hotels.reduce((max, hotel) => Math.max(max, hotel.id || 0), 0);
        const currentUser = AppState.get('currentUser');
        
        const newHotel = {
            ...hotelData,
            id: maxId + 1,
            createdAt: new Date(),
            createdBy: currentUser ? currentUser.email : 'admin',
            settings: {
                timezone: 'Europe/Madrid',
                currency: 'EUR',
                language: 'es'
            }
        };
        
        hotels.push(newHotel);
        AppState.update('hotels', hotels);
        Utils.showToast('Hotel creado correctamente', 'success');
        
        // Log de creación
        LicensingModule.logLicenseAction('hotel_created', {
            hotelId: newHotel.id,
            hotelName: name,
            hotelCode: code,
            totalHotels: hotels.filter(h => h.active).length
        });
        
        console.log(`✅ Hotel creado: ${name} (${code})`);
    }
    
    // Cerrar formulario y actualizar vista
    hideHotelForm();
    
    // Actualizar selectores de hotel en toda la aplicación
    if (typeof updateAllHotelSelectors === 'function') {
        updateAllHotelSelectors();
    }
    
    // Actualizar selector de contexto
    if (typeof HotelContextModule !== 'undefined') {
        HotelContextModule.updateHotelSelectorOptions();
    }
    
    // Recargar pestaña de hoteles
    const hotelsTab = document.getElementById('hotels-tab');
    if (hotelsTab) {
        hotelsTab.innerHTML = renderHotelsTab();
        setupHotelEvents();
    }
}

function deleteHotel(hotelId) {
    const hotels = AppState.get('hotels');
    const hotel = hotels.find(h => h.id === hotelId);
    
    if (!hotel) {
        Utils.showToast('Hotel no encontrado', 'error');
        return;
    }
    
    // Confirmación de eliminación
    if (!confirm(`¿Estás seguro de que quieres eliminar el hotel "${hotel.name}"?\n\nEsta acción no se puede deshacer y eliminará todos los datos asociados al hotel.`)) {
        return;
    }
    
    // Eliminar hotel
    const updatedHotels = hotels.filter(h => h.id !== hotelId);
    AppState.update('hotels', updatedHotels);
    
    // TODO: Eliminar datos relacionados (tareas, empleados, etc.)
    // cleanupHotelData(hotelId);
    
    Utils.showToast(`Hotel "${hotel.name}" eliminado correctamente`, 'success');
    
    // Log de eliminación
    LicensingModule.logLicenseAction('hotel_deleted', {
        hotelId: hotelId,
        hotelName: hotel.name,
        hotelCode: hotel.code,
        totalHotels: updatedHotels.filter(h => h.active).length
    });
    
    // Actualizar selectores y recargar vista
    if (typeof updateAllHotelSelectors === 'function') {
        updateAllHotelSelectors();
    }
    
    if (typeof HotelContextModule !== 'undefined') {
        HotelContextModule.updateHotelSelectorOptions();
    }
    
    // Recargar pestaña de hoteles
    const hotelsTab = document.getElementById('hotels-tab');
    if (hotelsTab) {
        hotelsTab.innerHTML = renderHotelsTab();
        setupHotelEvents();
    }
    
    console.log(`🗑️ Hotel eliminado: ${hotel.name} (${hotel.code})`);
}

function hideHotelForm() {
    const hotelForm = document.getElementById('hotel-form');
    if (hotelForm) {
        hotelForm.classList.add('hidden');
    }
    currentHotelId = null;
}

// ====================================================
// CONFIGURACIÓN DE EVENTOS
// ====================================================

function setupAdminEvents() {
    // Eventos de navegación entre pestañas
    setupTabNavigation();
    
    // Eventos específicos de hoteles
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
            
            console.log(`📑 Pestaña cambiada a: ${tabId}`);
        });
    });
}

function setupHotelEvents() {
    // Botón nuevo hotel
    const btnNewHotel = document.getElementById('btn-new-hotel');
    if (btnNewHotel) {
        btnNewHotel.addEventListener('click', showHotelForm);
    }
    
    // Botón cancelar hotel
    const btnCancelHotel = document.getElementById('cancel-hotel-btn');
    if (btnCancelHotel) {
        btnCancelHotel.addEventListener('click', hideHotelForm);
    }
    
    // Botón guardar hotel
    const btnSaveHotel = document.getElementById('save-hotel-btn');
    if (btnSaveHotel) {
        btnSaveHotel.addEventListener('click', saveHotel);
    }
    
    // Validación en tiempo real del código del hotel
    const hotelCodeInput = document.getElementById('hotel-code');
    if (hotelCodeInput) {
        hotelCodeInput.addEventListener('input', (e) => {
            // Convertir a mayúsculas y eliminar espacios
            let value = e.target.value.toUpperCase().replace(/\s/g, '');
            
            // Limitar a caracteres alfanuméricos
            value = value.replace(/[^A-Z0-9]/g, '');
            
            // Limitar longitud
            if (value.length > 10) {
                value = value.substring(0, 10);
            }
            
            e.target.value = value;
            
            // Validar unicidad si hay valor
            if (value.length >= 3) {
                validateHotelCodeUniqueness(value);
            }
        });
    }
    
    // Eventos de otros botones
    const btnNewPoolType = document.getElementById('btn-new-pool-type');
    if (btnNewPoolType) {
        btnNewPoolType.addEventListener('click', () => {
            Utils.showToast('Funcionalidad en desarrollo', 'info');
        });
    }
    
    const btnNewUser = document.getElementById('btn-new-user');
    if (btnNewUser) {
        btnNewUser.addEventListener('click', () => {
            Utils.showToast('Funcionalidad en desarrollo', 'info');
        });
    }
}

// ====================================================
// FUNCIONES DE VALIDACIÓN
// ====================================================

function validateHotelCodeUniqueness(code) {
    const hotels = AppState.get('hotels');
    const exists = hotels.some(h => 
        h.code.toLowerCase() === code.toLowerCase() && 
        (!currentHotelId || h.id !== currentHotelId)
    );
    
    const codeInput = document.getElementById('hotel-code');
    const saveBtn = document.getElementById('save-hotel-btn');
    
    if (exists) {
        codeInput.classList.add('is-invalid');
        if (saveBtn) saveBtn.disabled = true;
        
        // Mostrar mensaje de error
        let errorMsg = document.getElementById('code-error-msg');
        if (!errorMsg) {
            errorMsg = document.createElement('div');
            errorMsg.id = 'code-error-msg';
            errorMsg.className = 'invalid-feedback';
            codeInput.parentNode.appendChild(errorMsg);
        }
        errorMsg.textContent = 'Este código ya está en uso';
    } else {
        codeInput.classList.remove('is-invalid');
        if (saveBtn) saveBtn.disabled = false;
        
        // Eliminar mensaje de error
        const errorMsg = document.getElementById('code-error-msg');
        if (errorMsg) {
            errorMsg.remove();
        }
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ====================================================
// FUNCIONES DE UTILIDAD
// ====================================================

function getModuleDisplayName(moduleCode) {
    const moduleNames = {
        'tasks': 'Gestión de Tareas',
        'inventory': 'Inventario',
        'orders': 'Pedidos',
        'chemicals': 'Productos Químicos',
        'employees': 'Personal',
        'shifts': 'Turnos',
        'pools': 'Piscinas',
        'winter': 'Tareas de Invierno',
        'admin': 'Administración'
    };
    
    return moduleNames[moduleCode] || moduleCode;
}

function loadConfigurationData() {
    console.log('📊 Cargando datos de configuración...');
    
    // Cargar hoteles si no existen (datos mock)
    if (AppState.get('hotels').length === 0) {
        console.log('🏨 Cargando hoteles de ejemplo...');
        const mockHotels = [
            {
                id: 1,
                name: "Meliá Palma Bay",
                code: "MELIA_PALMA",
                location: "Mallorca, España",
                address: "Paseo Marítimo 11, 07014 Palma",
                phone: "+34 971 268 500",
                email: "palmabay@melia.com",
                active: true,
                createdBy: "admin@melia.com",
                createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
                settings: {
                    timezone: "Europe/Madrid",
                    currency: "EUR",
                    language: "es"
                }
            },
            {
                id: 2,
                name: "Meliá Costa del Sol",
                code: "MELIA_COSTA",
                location: "Torremolinos, España",
                address: "Av. Carlota Alessandri 109, 29620 Torremolinos",
                phone: "+34 952 386 677",
                email: "costadelsol@melia.com",
                active: true,
                createdBy: "admin@melia.com",
                createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
                settings: {
                    timezone: "Europe/Madrid",
                    currency: "EUR",
                    language: "es"
                }
            }
        ];
        
        AppState.update('hotels', mockHotels);
    }
    
    console.log('✅ Datos de configuración cargados');
}

// ====================================================
// FUNCIONES GLOBALES (Expuestas al window)
// ====================================================

// Hacer funciones disponibles globalmente para eventos onclick
if (typeof window !== 'undefined') {
    window.editHotel = editHotel;
    window.deleteHotel = deleteHotel;
    window.showHotelForm = showHotelForm;
    window.hideHotelForm = hideHotelForm;
    window.saveHotel = saveHotel;
}

// ====================================================
// INICIALIZACIÓN AUTOMÁTICA
// ====================================================

// Inicializar cuando se carga el DOM
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Verificar si estamos en la vista de administración
        const adminView = document.getElementById('admin-view');
        if (adminView && !adminView.classList.contains('hidden')) {
            initAdminModule();
        }
    });
}

// Escuchar cambios de módulo para inicializar cuando se navega a admin
if (typeof AppState !== 'undefined') {
    AppState.subscribe('currentModule', (moduleId) => {
        if (moduleId === 'admin-view') {
            // Pequeño delay para asegurar que la vista esté lista
            setTimeout(() => {
                initAdminModule();
            }, 100);
        }
    });
}

// ====================================================
// EXPORTACIÓN DEL MÓDULO
// ====================================================

// Objeto principal del módulo para exportación
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

console.log('📋 Módulo de administración cargado');