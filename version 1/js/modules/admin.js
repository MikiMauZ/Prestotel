// modules/admin.js - Módulo de administración para configuración del sistema

document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en la página de administración
    const adminView = document.getElementById('admin-view');
    if (!adminView) return;
    
    // Referencias a elementos DOM
    let hotelsList;
    let poolTypesList;
    let usersList;
    
    // Variables de estado
    let currentHotelId = null;
    let currentPoolTypeId = null;
    let currentUserId = null;
    
    // Inicializar módulo
    function initAdminModule() {
        // Verificar permisos de administrador
        checkAdminPermissions();
        
        // Renderizar la estructura base del módulo
        renderModuleStructure();
        
        // Obtener referencias a elementos DOM
        hotelsList = document.getElementById('hotels-list');
        poolTypesList = document.getElementById('pool-types-list');
        usersList = document.getElementById('users-list');
        
        // Inicializar AppState para las configuraciones si no existen
        if (!AppState.get('hotels')) {
            AppState.data.hotels = [];
            AppState.saveToLocalStorage();
        }
        
        if (!AppState.get('poolTypes')) {
            AppState.data.poolTypes = [];
            AppState.saveToLocalStorage();
        }
        
        if (!AppState.get('adminUsers')) {
            AppState.data.adminUsers = [];
            AppState.saveToLocalStorage();
        }
        
        // Suscribirse a cambios
        AppState.subscribe('hotels', renderHotels);
        AppState.subscribe('poolTypes', renderPoolTypes);
        AppState.subscribe('adminUsers', renderUsers);
        
        // Configurar eventos
        setupEventListeners();
        
        // Cargar datos iniciales si es necesario
        loadMockConfigurationData();
        
        // Renderizar datos
        renderHotels(AppState.get('hotels'));
        renderPoolTypes(AppState.get('poolTypes'));
        renderUsers(AppState.get('adminUsers'));
    }
    // Verificar permisos de administrador
    function checkAdminPermissions() {
        const userRole = AppState.get('userRole');
        
        if (userRole !== 'admin') {
            // Mostrar mensaje de acceso denegado
            adminView.innerHTML = `
                <div class="access-denied">
                    <i class="fas fa-lock"></i>
                    <h2>Acceso Denegado</h2>
                    <p>No tienes permisos para acceder al panel de administración.</p>
                    <p>Contacta con un administrador si necesitas acceso.</p>
                    <button id="go-to-dashboard" class="btn btn-primary">Volver al Panel Principal</button>
                </div>
            `;
            
            // Configurar botón para volver al dashboard
            const btnGoToDashboard = document.getElementById('go-to-dashboard');
            if (btnGoToDashboard) {
                btnGoToDashboard.addEventListener('click', () => {
                    showModule('dashboard-view');
                });
            }
            
            return false;
        }
        
        return true;
    }
    
    // Cargar datos mock si es necesario
    function loadMockConfigurationData() {
        // Cargar hoteles si no existen
        if (AppState.get('hotels').length === 0) {
            const mockHotels = [
                {
                    id: 1,
                    name: "Wave Hotel",
                    code: "Wave",
                    address: "Av. del Mar 123, Calvià",
                    phoneNumber: "971123456",
                    email: "info@wavehotel.com",
                    active: true,
                    createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000)
                },
                {
                    id: 2,
                    name: "Sky Hotel",
                    code: "Sky",
                    address: "C/ Vista 45, Calvià",
                    phoneNumber: "971234567",
                    email: "info@skyhotel.com",
                    active: true,
                    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
                },
                {
                    id: 3,
                    name: "Palm Hotel",
                    code: "Palm",
                    address: "Paseo Marítimo 78, Calvià",
                    phoneNumber: "971345678",
                    email: "info@palmhotel.com",
                    active: true,
                    createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000)
                }
            ];
            
            AppState.data.hotels = mockHotels;
            AppState.saveToLocalStorage();
        }
        // Cargar tipos de piscina si no existen
        if (AppState.get('poolTypes').length === 0) {
            const mockPoolTypes = [
                {
                    id: 1,
                    name: "Piscina Exterior",
                    code: "Exterior",
                    description: "Piscina ubicada al aire libre",
                    active: true,
                    defaultTreatment: "Cloración salina",
                    createdAt: new Date(Date.now() - 190 * 24 * 60 * 60 * 1000)
                },
                {
                    id: 2,
                    name: "Piscina Interior",
                    code: "Interior",
                    description: "Piscina cubierta climatizada",
                    active: true,
                    defaultTreatment: "Bromo",
                    createdAt: new Date(Date.now() - 185 * 24 * 60 * 60 * 1000)
                },
                {
                    id: 3,
                    name: "Piscina Infantil",
                    code: "Infantil",
                    description: "Piscina de poca profundidad para niños",
                    active: true,
                    defaultTreatment: "Cloración manual",
                    createdAt: new Date(Date.now() - 170 * 24 * 60 * 60 * 1000)
                },
                {
                    id: 4,
                    name: "Jacuzzi",
                    code: "Jacuzzi",
                    description: "Piscina de hidromasaje a temperatura elevada",
                    active: true,
                    defaultTreatment: "Bromo",
                    createdAt: new Date(Date.now() - 160 * 24 * 60 * 60 * 1000)
                }
            ];
            
            AppState.data.poolTypes = mockPoolTypes;
            AppState.saveToLocalStorage();
        }
        
        // Cargar usuarios de administración si no existen
        if (AppState.get('adminUsers').length === 0) {
            const mockAdminUsers = [
                {
                    id: 1,
                    username: "admin",
                    name: "Administrador Principal",
                    email: "admin@prestotel.com",
                    role: "admin",
                    active: true,
                    lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                    createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000)
                },
                {
                    id: 2,
                    username: "mantenimiento",
                    name: "Jefe de Mantenimiento",
                    email: "mantenimiento@prestotel.com",
                    role: "maintenance",
                    active: true,
                    lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                    createdAt: new Date(Date.now() - 190 * 24 * 60 * 60 * 1000)
                },
                {
                    id: 3,
                    username: "operador",
                    name: "Operador de Piscinas",
                    email: "operador@prestotel.com",
                    role: "operator",
                    active: true,
                    lastLogin: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
                }
            ];
            
            AppState.data.adminUsers = mockAdminUsers;
            AppState.saveToLocalStorage();
        }
    }
    // Renderizar estructura base del módulo
    function renderModuleStructure() {
        adminView.innerHTML = `
            <h2 class="section-title"><i class="fas fa-cogs"></i> Panel de Administración</h2>
            
            <div class="admin-tabs">
                <ul class="nav nav-tabs">
                    <li class="nav-item">
                        <a class="nav-link active" data-tab="hotels-tab">
                            <i class="fas fa-hotel"></i> Hoteles
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
                        <div class="tab-header">
                            <h3>Gestión de Hoteles</h3>
                            <button id="btn-new-hotel" class="btn btn-primary">
                                <i class="fas fa-plus"></i> Nuevo Hotel
                            </button>
                        </div>
                        
                        <div class="panel">
                            <p>Configura los hoteles que gestionará la aplicación. Cada hotel debe tener un código único que se utilizará internamente.</p>
                        
                            <!-- Formulario para añadir/editar hotel -->
                            <div id="hotel-form" class="form-container hidden">
                                <h4 class="form-title" id="hotel-form-title">Nuevo Hotel</h4>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="hotel-name">Nombre del hotel *</label>
                                        <input type="text" id="hotel-name" class="form-control" placeholder="Nombre completo">
                                    </div>
                                    <div class="form-group">
                                        <label for="hotel-code">Código *</label>
                                        <input type="text" id="hotel-code" class="form-control" placeholder="Código corto (3-10 caracteres)">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="hotel-address">Dirección</label>
                                    <input type="text" id="hotel-address" class="form-control" placeholder="Dirección completa">
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
                                    <button id="cancel-hotel-btn" class="btn btn-secondary">Cancelar</button>
                                    <button id="save-hotel-btn" class="btn btn-primary">Guardar</button>
                                </div>
                            </div>
                            <!-- Pestaña de Tipos de Piscina -->
                    <div id="pool-types-tab" class="tab-pane">
                        <div class="tab-header">
                            <h3>Gestión de Tipos de Piscina</h3>
                            <button id="btn-new-pool-type" class="btn btn-primary">
                                <i class="fas fa-plus"></i> Nuevo Tipo de Piscina
                            </button>
                        </div>
                        
                        <div class="panel">
                            <p>Define los diferentes tipos de piscinas que se pueden configurar en el sistema. Cada tipo debe tener un código único.</p>
                        
                            <!-- Formulario para añadir/editar tipo de piscina -->
                            <div id="pool-type-form" class="form-container hidden">
                                <h4 class="form-title" id="pool-type-form-title">Nuevo Tipo de Piscina</h4>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="pool-type-name">Nombre *</label>
                                        <input type="text" id="pool-type-name" class="form-control" placeholder="Nombre del tipo de piscina">
                                    </div>
                                    <div class="form-group">
                                        <label for="pool-type-code">Código *</label>
                                        <input type="text" id="pool-type-code" class="form-control" placeholder="Código único">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="pool-type-description">Descripción</label>
                                    <textarea id="pool-type-description" class="form-control" placeholder="Descripción del tipo de piscina"></textarea>
                                </div>
                                <div class="form-group">
                                    <label for="pool-type-treatment">Tratamiento predeterminado</label>
                                    <select id="pool-type-treatment" class="form-control">
                                        <option value="Cloración manual">Cloración manual</option>
                                        <option value="Cloración salina">Cloración salina</option>
                                        <option value="Bromo">Bromo</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-check-label">
                                        <input type="checkbox" id="pool-type-active" checked> Tipo activo
                                    </label>
                                </div>
                                <div class="form-actions">
                                    <button id="cancel-pool-type-btn" class="btn btn-secondary">Cancelar</button>
                                    <button id="save-pool-type-btn" class="btn btn-primary">Guardar</button>
                                </div>
                            </div>
                            
                            <!-- Listado de tipos de piscina -->
                            <div id="pool-types-list" class="admin-list">
                                <!-- Se llenará dinámicamente -->
                            </div>
                        </div>
                    </div>
                    <!-- Pestaña de Usuarios -->
                    <div id="users-tab" class="tab-pane">
                        <div class="tab-header">
                            <h3>Gestión de Usuarios</h3>
                            <button id="btn-new-user" class="btn btn-primary">
                                <i class="fas fa-plus"></i> Nuevo Usuario
                            </button>
                        </div>
                        
                        <div class="panel">
                            <p>Administra los usuarios que tendrán acceso al sistema. Cada usuario puede tener diferentes niveles de acceso según su rol.</p>
                        
                            <!-- Formulario para añadir/editar usuario -->
                            <div id="user-form" class="form-container hidden">
                                <h4 class="form-title" id="user-form-title">Nuevo Usuario</h4>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="user-name">Nombre completo *</label>
                                        <input type="text" id="user-name" class="form-control" placeholder="Nombre y apellidos">
                                    </div>
                                    <div class="form-group">
                                        <label for="user-username">Nombre de usuario *</label>
                                        <input type="text" id="user-username" class="form-control" placeholder="Username para login">
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="user-email">Email *</label>
                                        <input type="email" id="user-email" class="form-control" placeholder="Email de contacto">
                                    </div>
                                    <div class="form-group">
                                        <label for="user-role">Rol *</label>
                                        <select id="user-role" class="form-control">
                                            <option value="admin">Administrador</option>
                                            <option value="maintenance">Mantenimiento</option>
                                            <option value="operator">Operador</option>
                                            <option value="viewer">Visualizador</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="user-password">Contraseña</label>
                                        <input type="password" id="user-password" class="form-control" placeholder="Solo necesario para nuevos usuarios">
                                    </div>
                                    <div class="form-group">
                                        <label for="user-confirm-password">Confirmar contraseña</label>
                                        <input type="password" id="user-confirm-password" class="form-control" placeholder="Confirmar contraseña">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="form-check-label">
                                        <input type="checkbox" id="user-active" checked> Usuario activo
                                    </label>
                                </div>
                                <div class="form-actions">
                                    <button id="cancel-user-btn" class="btn btn-secondary">Cancelar</button>
                                    <button id="save-user-btn" class="btn btn-primary">Guardar</button>
                                </div>
                            </div>
                            
                            <!-- Listado de usuarios -->
                            <div id="users-list" class="admin-list">
                                <!-- Se llenará dinámicamente -->
                            </div>
                        </div>
                    </div>
                    <!-- Pestaña de Configuración General -->
                    <div id="settings-tab" class="tab-pane">
                        <div class="tab-header">
                            <h3>Configuración General</h3>
                            <button id="btn-save-settings" class="btn btn-primary">
                                <i class="fas fa-save"></i> Guardar Configuración
                            </button>
                        </div>
                        
                        <div class="panel">
                            <p>Configura los parámetros generales del sistema.</p>
                            
                            <div class="settings-form">
                                <h4>Configuración de Piscinas</h4>
                                
                                <div class="form-group">
                                    <label for="setting-ph-min">pH mínimo permitido</label>
                                    <input type="number" id="setting-ph-min" class="form-control" value="7.2" min="0" max="14" step="0.1">
                                </div>
                                
                                <div class="form-group">
                                    <label for="setting-ph-max">pH máximo permitido</label>
                                    <input type="number" id="setting-ph-max" class="form-control" value="8.0" min="0" max="14" step="0.1">
                                </div>
                                
                                <div class="form-group">
                                    <label for="setting-cl-min">Cloro libre mínimo (mg/L)</label>
                                    <input type="number" id="setting-cl-min" class="form-control" value="0.5" min="0" step="0.1">
                                </div>
                                
                                <div class="form-group">
                                    <label for="setting-cl-max">Cloro libre máximo (mg/L)</label>
                                    <input type="number" id="setting-cl-max" class="form-control" value="2.0" min="0" step="0.1">
                                </div>
                                
                                <div class="form-group">
                                    <label for="setting-daily-records">Registros diarios requeridos</label>
                                    <input type="number" id="setting-daily-records" class="form-control" value="2" min="1" step="1">
                                </div>
                                
                                <h4>Configuración de Notificaciones</h4>
                                
                                <div class="form-group">
                                    <label class="form-check-label">
                                        <input type="checkbox" id="setting-email-alerts" checked> Activar alertas por email
                                    </label>
                                </div>
                                
                                <div class="form-group">
                                    <label for="setting-alert-email">Email para alertas</label>
                                    <input type="email" id="setting-alert-email" class="form-control" placeholder="Email para recibir alertas">
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-check-label">
                                        <input type="checkbox" id="setting-sms-alerts"> Activar alertas por SMS
                                    </label>
                                </div>
                                
                                <div class="form-group">
                                    <label for="setting-alert-phone">Teléfono para SMS</label>
                                    <input type="tel" id="setting-alert-phone" class="form-control" placeholder="Número de teléfono para SMS">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    // Configurar eventos
    function setupEventListeners() {
        // Navegación por pestañas
        document.querySelectorAll('.admin-tabs .nav-link').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Desactivar todas las pestañas
                document.querySelectorAll('.admin-tabs .nav-link').forEach(t => {
                    t.classList.remove('active');
                });
                
                // Ocultar todos los paneles
                document.querySelectorAll('.admin-tabs .tab-pane').forEach(p => {
                    p.classList.remove('active');
                });
                
                // Activar la pestaña seleccionada
                tab.classList.add('active');
                
                // Mostrar el panel correspondiente
                const tabId = tab.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
            });
        });
        
        // Botones de crear nuevos elementos
        const btnNewHotel = document.getElementById('btn-new-hotel');
        if (btnNewHotel) {
            btnNewHotel.addEventListener('click', () => {
                showHotelForm();
            });
        }
        
        const btnNewPoolType = document.getElementById('btn-new-pool-type');
        if (btnNewPoolType) {
            btnNewPoolType.addEventListener('click', () => {
                showPoolTypeForm();
            });
        }
        
        const btnNewUser = document.getElementById('btn-new-user');
        if (btnNewUser) {
            btnNewUser.addEventListener('click', () => {
                showUserForm();
            });
        }
        
        // Botones de cancelar
        const cancelHotelBtn = document.getElementById('cancel-hotel-btn');
        if (cancelHotelBtn) {
            cancelHotelBtn.addEventListener('click', () => {
                document.getElementById('hotel-form').classList.add('hidden');
            });
        }
        
        const cancelPoolTypeBtn = document.getElementById('cancel-pool-type-btn');
        if (cancelPoolTypeBtn) {
            cancelPoolTypeBtn.addEventListener('click', () => {
                document.getElementById('pool-type-form').classList.add('hidden');
            });
        }
        
        const cancelUserBtn = document.getElementById('cancel-user-btn');
        if (cancelUserBtn) {
            cancelUserBtn.addEventListener('click', () => {
                document.getElementById('user-form').classList.add('hidden');
            });
        }
        
        // Botones de guardar
        const saveHotelBtn = document.getElementById('save-hotel-btn');
        if (saveHotelBtn) {
            saveHotelBtn.addEventListener('click', saveHotel);
        }
        
        const savePoolTypeBtn = document.getElementById('save-pool-type-btn');
        if (savePoolTypeBtn) {
            savePoolTypeBtn.addEventListener('click', savePoolType);
        }
        
        const saveUserBtn = document.getElementById('save-user-btn');
        if (saveUserBtn) {
            saveUserBtn.addEventListener('click', saveUser);
        }
        
        const saveSettingsBtn = document.getElementById('btn-save-settings');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', saveSettings);
        }
    }
    // Mostrar formulario de hotel
    function showHotelForm(hotelId = null) {
        const hotelForm = document.getElementById('hotel-form');
        if (!hotelForm) return;
        
        if (hotelId) {
            // Editar hotel existente
            const hotels = AppState.get('hotels');
            const hotel = hotels.find(h => h.id === hotelId);
            
            if (!hotel) {
                Utils.showToast('Hotel no encontrado', 'error');
                return;
            }
            
            // Llenar formulario
            document.getElementById('hotel-name').value = hotel.name;
            document.getElementById('hotel-code').value = hotel.code;
            document.getElementById('hotel-address').value = hotel.address || '';
            document.getElementById('hotel-phone').value = hotel.phoneNumber || '';
            document.getElementById('hotel-email').value = hotel.email || '';
            document.getElementById('hotel-active').checked = hotel.active;
            
            // Actualizar título
            document.getElementById('hotel-form-title').textContent = 'Editar Hotel';
            
            // Guardar ID
            currentHotelId = hotelId;
        } else {
            // Nuevo hotel
            document.getElementById('hotel-name').value = '';
            document.getElementById('hotel-code').value = '';
            document.getElementById('hotel-address').value = '';
            document.getElementById('hotel-phone').value = '';
            document.getElementById('hotel-email').value = '';
            document.getElementById('hotel-active').checked = true;
            
            // Actualizar título
            document.getElementById('hotel-form-title').textContent = 'Nuevo Hotel';
            
            // Limpiar ID
            currentHotelId = null;
        }
        
        // Mostrar formulario
        hotelForm.classList.remove('hidden');
        document.getElementById('hotel-name').focus();
    }
    // Mostrar formulario de tipo de piscina
    function showPoolTypeForm(poolTypeId = null) {
        const poolTypeForm = document.getElementById('pool-type-form');
        if (!poolTypeForm) return;
        
        if (poolTypeId) {
            // Editar tipo de piscina existente
            const poolTypes = AppState.get('poolTypes');
            const poolType = poolTypes.find(pt => pt.id === poolTypeId);
            
            if (!poolType) {
                Utils.showToast('Tipo de piscina no encontrado', 'error');
                return;
            }
            
            // Llenar formulario
            document.getElementById('pool-type-name').value = poolType.name;
            document.getElementById('pool-type-code').value = poolType.code;
            document.getElementById('pool-type-description').value = poolType.description || '';
            document.getElementById('pool-type-treatment').value = poolType.defaultTreatment || 'Cloración manual';
            document.getElementById('pool-type-active').checked = poolType.active;
            
            // Actualizar título
            document.getElementById('pool-type-form-title').textContent = 'Editar Tipo de Piscina';
            
            // Guardar ID
            currentPoolTypeId = poolTypeId;
        } else {
            // Nuevo tipo de piscina
            document.getElementById('pool-type-name').value = '';
            document.getElementById('pool-type-code').value = '';
            document.getElementById('pool-type-description').value = '';
            document.getElementById('pool-type-treatment').value = 'Cloración manual';
            document.getElementById('pool-type-active').checked = true;
            
            // Actualizar título
            document.getElementById('pool-type-form-title').textContent = 'Nuevo Tipo de Piscina';
            
            // Limpiar ID
            currentPoolTypeId = null;
        }
        
        // Mostrar formulario
        poolTypeForm.classList.remove('hidden');
        document.getElementById('pool-type-name').focus();
    }
    
    // Mostrar formulario de usuario
    function showUserForm(userId = null) {
        const userForm = document.getElementById('user-form');
        if (!userForm) return;
        
        if (userId) {
            // Editar usuario existente
            const users = AppState.get('adminUsers');
            const user = users.find(u => u.id === userId);
            
            if (!user) {
                Utils.showToast('Usuario no encontrado', 'error');
                return;
            }
            
            // Llenar formulario
            document.getElementById('user-name').value = user.name;
            document.getElementById('user-username').value = user.username;
            document.getElementById('user-email').value = user.email;
            document.getElementById('user-role').value = user.role;
            document.getElementById('user-active').checked = user.active;
            
            // Limpiar campos de contraseña en edición
            document.getElementById('user-password').value = '';
            document.getElementById('user-confirm-password').value = '';
            
            // Actualizar título
            document.getElementById('user-form-title').textContent = 'Editar Usuario';
            
            // Guardar ID
            currentUserId = userId;
        } else {
            // Nuevo usuario
            document.getElementById('user-name').value = '';
            document.getElementById('user-username').value = '';
            document.getElementById('user-email').value = '';
            document.getElementById('user-role').value = 'operator';
            document.getElementById('user-active').checked = true;
            document.getElementById('user-password').value = '';
            document.getElementById('user-confirm-password').value = '';
            
            // Actualizar título
            document.getElementById('user-form-title').textContent = 'Nuevo Usuario';
            
            // Limpiar ID
            currentUserId = null;
        }
        
        // Mostrar formulario
        userForm.classList.remove('hidden');
        document.getElementById('user-name').focus();
    }
    // Guardar hotel
    function saveHotel() {
        // Obtener valores del formulario
        const name = document.getElementById('hotel-name').value.trim();
        const code = document.getElementById('hotel-code').value.trim();
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
        
        // Preparar datos
        const hotelData = {
            name,
            code,
            address,
            phoneNumber: phone,
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
            } else {
                Utils.showToast('Error al actualizar el hotel', 'error');
            }
        } else {
            // Crear nuevo hotel
            const maxId = hotels.reduce((max, hotel) => Math.max(max, hotel.id || 0), 0);
            
            const newHotel = {
                ...hotelData,
                id: maxId + 1,
                createdAt: new Date()
            };
            
            hotels.push(newHotel);
            AppState.update('hotels', hotels);
            Utils.showToast('Hotel creado correctamente', 'success');
        }
        
        // Cerrar formulario
        document.getElementById('hotel-form').classList.add('hidden');
    }
    
    // Guardar tipo de piscina
    function savePoolType() {
        // Obtener valores del formulario
        const name = document.getElementById('pool-type-name').value.trim();
        const code = document.getElementById('pool-type-code').value.trim();
        const description = document.getElementById('pool-type-description').value.trim();
        const treatment = document.getElementById('pool-type-treatment').value;
        const active = document.getElementById('pool-type-active').checked;
        
        // Validar campos obligatorios
        if (!name) {
            Utils.showToast('Por favor introduce un nombre para el tipo de piscina', 'error');
            document.getElementById('pool-type-name').focus();
            return;
        }
        
        if (!code) {
            Utils.showToast('Por favor introduce un código para el tipo de piscina', 'error');
            document.getElementById('pool-type-code').focus();
            return;
        }
        
        // Preparar datos
        const poolTypeData = {
            name,
            code,
            description,
            defaultTreatment: treatment,
            active,
            updatedAt: new Date()
        };
        
        const poolTypes = [...AppState.get('poolTypes')];
        
        // Verificar si el código ya existe (excepto para el tipo actual en caso de edición)
        const codeExists = poolTypes.some(pt => 
            pt.code.toLowerCase() === code.toLowerCase() && 
            (!currentPoolTypeId || pt.id !== currentPoolTypeId)
        );
        
        if (codeExists) {
            Utils.showToast('El código ya está en uso por otro tipo de piscina. Por favor usa uno diferente.', 'error');
            document.getElementById('pool-type-code').focus();
            return;
        }
        
        if (currentPoolTypeId) {
            // Actualizar tipo de piscina existente
            const index = poolTypes.findIndex(pt => pt.id === currentPoolTypeId);
            
            if (index !== -1) {
                poolTypes[index] = {
                    ...poolTypes[index],
                    ...poolTypeData
                };
                
                AppState.update('poolTypes', poolTypes);
                Utils.showToast('Tipo de piscina actualizado correctamente', 'success');
            } else {
                Utils.showToast('Error al actualizar el tipo de piscina', 'error');
            }
        } else {
            // Crear nuevo tipo de piscina
            const maxId = poolTypes.reduce((max, pt) => Math.max(max, pt.id || 0), 0);
            
            const newPoolType = {
                ...poolTypeData,
                id: maxId + 1,
                createdAt: new Date()
            };
            
            poolTypes.push(newPoolType);
            AppState.update('poolTypes', poolTypes);
            Utils.showToast('Tipo de piscina creado correctamente', 'success');
        }
        
        // Cerrar formulario
        document.getElementById('pool-type-form').classList.add('hidden');
    }
    // Guardar usuario
    function saveUser() {
        // Obtener valores del formulario
        const name = document.getElementById('user-name').value.trim();
        const username = document.getElementById('user-username').value.trim();
        const email = document.getElementById('user-email').value.trim();
        const role = document.getElementById('user-role').value;
        const password = document.getElementById('user-password').value;
        const confirmPassword = document.getElementById('user-confirm-password').value;
        const active = document.getElementById('user-active').checked;
        
        // Validar campos obligatorios
        if (!name) {
            Utils.showToast('Por favor introduce un nombre para el usuario', 'error');
            document.getElementById('user-name').focus();
            return;
        }
        
        if (!username) {
            Utils.showToast('Por favor introduce un nombre de usuario', 'error');
            document.getElementById('user-username').focus();
            return;
        }
        
        if (!email) {
            Utils.showToast('Por favor introduce un email', 'error');
            document.getElementById('user-email').focus();
            return;
        }
        
        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Utils.showToast('Por favor introduce un email válido', 'error');
            document.getElementById('user-email').focus();
            return;
        }
        
        // Validar contraseña solo para nuevos usuarios o si se está cambiando
        if (!currentUserId || password) {
            if (!password) {
                Utils.showToast('Por favor introduce una contraseña', 'error');
                document.getElementById('user-password').focus();
                return;
            }
            
            if (password.length < 6) {
                Utils.showToast('La contraseña debe tener al menos 6 caracteres', 'error');
                document.getElementById('user-password').focus();
                return;
            }
            
            if (password !== confirmPassword) {
                Utils.showToast('Las contraseñas no coinciden', 'error');
                document.getElementById('user-confirm-password').focus();
                return;
            }
        }
        
        // Preparar datos
        const userData = {
            name,
            username,
            email,
            role,
            active,
            updatedAt: new Date()
        };
        
        // Agregar contraseña si se ha introducido una nueva
        if (password) {
            // En un sistema real, aquí se codificaría la contraseña
            userData.password = password;
        }
        
        const users = [...AppState.get('adminUsers')];
        
        // Verificar si el nombre de usuario ya existe (excepto para el usuario actual en caso de edición)
        const usernameExists = users.some(u => 
            u.username.toLowerCase() === username.toLowerCase() && 
            (!currentUserId || u.id !== currentUserId)
        );
        
        if (usernameExists) {
            Utils.showToast('El nombre de usuario ya está en uso. Por favor usa uno diferente.', 'error');
            document.getElementById('user-username').focus();
            return;
        }
        
        // Verificar si el email ya existe (excepto para el usuario actual en caso de edición)
        const emailExists = users.some(u => 
            u.email.toLowerCase() === email.toLowerCase() && 
            (!currentUserId || u.id !== currentUserId)
        );
        
        if (emailExists) {
            Utils.showToast('El email ya está en uso por otro usuario. Por favor usa uno diferente.', 'error');
            document.getElementById('user-email').focus();
            return;
        }
        
        if (currentUserId) {
            // Actualizar usuario existente
            const index = users.findIndex(u => u.id === currentUserId);
            
            if (index !== -1) {
                users[index] = {
                    ...users[index],
                    ...userData
                };
                
                AppState.update('adminUsers', users);
                Utils.showToast('Usuario actualizado correctamente', 'success');
            } else {
                Utils.showToast('Error al actualizar el usuario', 'error');
            }
        } else {
            // Crear nuevo usuario
            const maxId = users.reduce((max, user) => Math.max(max, user.id || 0), 0);
            
            const newUser = {
                ...userData,
                id: maxId + 1,
                createdAt: new Date(),
                lastLogin: null
            };
            
            users.push(newUser);
            AppState.update('adminUsers', users);
            Utils.showToast('Usuario creado correctamente', 'success');
        }
        
        // Cerrar formulario
        document.getElementById('user-form').classList.add('hidden');
    }
    
    // Guardar configuración general
    function saveSettings() {
        const phMin = parseFloat(document.getElementById('setting-ph-min').value);
        const phMax = parseFloat(document.getElementById('setting-ph-max').value);
        const clMin = parseFloat(document.getElementById('setting-cl-min').value);
        const clMax = parseFloat(document.getElementById('setting-cl-max').value);
        const dailyRecords = parseInt(document.getElementById('setting-daily-records').value);
        const emailAlerts = document.getElementById('setting-email-alerts').checked;
        const alertEmail = document.getElementById('setting-alert-email').value.trim();
        const smsAlerts = document.getElementById('setting-sms-alerts').checked;
        const alertPhone = document.getElementById('setting-alert-phone').value.trim();
        
        // Validar valores
        if (isNaN(phMin) || phMin < 0 || phMin > 14) {
            Utils.showToast('El pH mínimo debe estar entre 0 y 14', 'error');
            document.getElementById('setting-ph-min').focus();
            return;
        }
        
        if (isNaN(phMax) || phMax < 0 || phMax > 14 || phMax <= phMin) {
            Utils.showToast('El pH máximo debe estar entre 0 y 14 y ser mayor que el pH mínimo', 'error');
            document.getElementById('setting-ph-max').focus();
            return;
        }
        
        if (isNaN(clMin) || clMin < 0) {
            Utils.showToast('El cloro libre mínimo debe ser un valor positivo', 'error');
            document.getElementById('setting-cl-min').focus();
            return;
        }
        
        if (isNaN(clMax) || clMax < 0 || clMax <= clMin) {
            Utils.showToast('El cloro libre máximo debe ser un valor positivo y mayor que el mínimo', 'error');
            document.getElementById('setting-cl-max').focus();
            return;
        }
        
        if (isNaN(dailyRecords) || dailyRecords < 1) {
            Utils.showToast('El número de registros diarios debe ser al menos 1', 'error');
            document.getElementById('setting-daily-records').focus();
            return;
        }
        
        // Validar email de alertas si está activado
        if (emailAlerts && alertEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(alertEmail)) {
                Utils.showToast('Por favor introduce un email válido para las alertas', 'error');
                document.getElementById('setting-alert-email').focus();
                return;
            }
        }
        
        // Crear objeto de configuración
        const settings = {
            pool: {
                phMin,
                phMax,
                clMin,
                clMax,
                dailyRecords
            },
            notifications: {
                emailAlerts,
                alertEmail,
                smsAlerts,
                alertPhone
            },
            updatedAt: new Date()
        };
        
        // Guardar en AppState
        AppState.update('settings', settings);
        Utils.showToast('Configuración guardada correctamente', 'success');
    }
    // Renderizar hoteles
    function renderHotels(hotels) {
        if (!hotelsList) return;
        
        // Limpiar lista
        hotelsList.innerHTML = '';
        
        // Si no hay hoteles
        if (hotels.length === 0) {
            hotelsList.innerHTML = '<p class="text-center">No hay hoteles configurados</p>';
            return;
        }
        
        // Crear tabla
        const table = document.createElement('table');
        table.className = 'admin-table';
        
        // Encabezado
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Código</th>
                    <th>Dirección</th>
                    <th>Teléfono</th>
                    <th>Email</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                <!-- Se llenará dinámicamente -->
            </tbody>
        `;
        
        const tbody = table.querySelector('tbody');
        
        // Ordenar por nombre
        const sortedHotels = [...hotels].sort((a, b) => a.name.localeCompare(b.name));
        
        // Llenar la tabla
        sortedHotels.forEach(hotel => {
            const row = document.createElement('tr');
            row.className = hotel.active ? '' : 'row-inactive';
            
            row.innerHTML = `
                <td>${Utils.sanitizeHTML(hotel.name)}</td>
                <td><code>${Utils.sanitizeHTML(hotel.code)}</code></td>
                <td>${Utils.sanitizeHTML(hotel.address || '-')}</td>
                <td>${Utils.sanitizeHTML(hotel.phoneNumber || '-')}</td>
                <td>${Utils.sanitizeHTML(hotel.email || '-')}</td>
                <td>
                    <span class="status-badge ${hotel.active ? 'status-active' : 'status-inactive'}">
                        ${hotel.active ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td class="actions-cell">
                    <button class="btn-edit-hotel" data-id="${hotel.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-toggle-hotel" data-id="${hotel.id}">
                        <i class="fas fa-${hotel.active ? 'power-off' : 'check'}"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Añadir tabla a la lista
        hotelsList.appendChild(table);
        
        // Configurar eventos para botones
        document.querySelectorAll('.btn-edit-hotel').forEach(btn => {
            btn.addEventListener('click', () => {
                const hotelId = parseInt(btn.getAttribute('data-id'));
                showHotelForm(hotelId);
            });
        });
        
        document.querySelectorAll('.btn-toggle-hotel').forEach(btn => {
            btn.addEventListener('click', () => {
                const hotelId = parseInt(btn.getAttribute('data-id'));
                toggleHotelStatus(hotelId);
            });
        });
    }
    
    // Cambiar estado de un hotel
    function toggleHotelStatus(hotelId) {
        const hotels = [...AppState.get('hotels')];
        const index = hotels.findIndex(h => h.id === hotelId);
        
        if (index === -1) {
            Utils.showToast('Hotel no encontrado', 'error');
            return;
        }
        
        // Invertir estado
        hotels[index].active = !hotels[index].active;
        hotels[index].updatedAt = new Date();
        
        // Actualizar en AppState
        AppState.update('hotels', hotels);
        
        // Notificar
        Utils.showToast(
            `Hotel ${hotels[index].active ? 'activado' : 'desactivado'} correctamente`,
            'success'
        );
    }
    
    // Renderizar tipos de piscina
    function renderPoolTypes(poolTypes) {
        if (!poolTypesList) return;
        
        // Limpiar lista
        poolTypesList.innerHTML = '';
        
        // Si no hay tipos de piscina
        if (poolTypes.length === 0) {
            poolTypesList.innerHTML = '<p class="text-center">No hay tipos de piscina configurados</p>';
            return;
        }
        
        // Crear tabla
        const table = document.createElement('table');
        table.className = 'admin-table';
        
        // Encabezado
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Código</th>
                    <th>Descripción</th>
                    <th>Tratamiento</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                <!-- Se llenará dinámicamente -->
            </tbody>
        `;
        
        const tbody = table.querySelector('tbody');
        
        // Ordenar por nombre
        const sortedPoolTypes = [...poolTypes].sort((a, b) => a.name.localeCompare(b.name));
        
        // Llenar la tabla
        sortedPoolTypes.forEach(poolType => {
            const row = document.createElement('tr');
            row.className = poolType.active ? '' : 'row-inactive';
            
            row.innerHTML = `
                <td>${Utils.sanitizeHTML(poolType.name)}</td>
                <td><code>${Utils.sanitizeHTML(poolType.code)}</code></td>
                <td>${Utils.sanitizeHTML(poolType.description || '-')}</td>
                <td>${Utils.sanitizeHTML(poolType.defaultTreatment || 'No especificado')}</td>
                <td>
                    <span class="status-badge ${poolType.active ? 'status-active' : 'status-inactive'}">
                        ${poolType.active ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td class="actions-cell">
                    <button class="btn-edit-pool-type" data-id="${poolType.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-toggle-pool-type" data-id="${poolType.id}">
                        <i class="fas fa-${poolType.active ? 'power-off' : 'check'}"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Añadir tabla a la lista
        poolTypesList.appendChild(table);
        
        // Configurar eventos para botones
        document.querySelectorAll('.btn-edit-pool-type').forEach(btn => {
            btn.addEventListener('click', () => {
                const poolTypeId = parseInt(btn.getAttribute('data-id'));
                showPoolTypeForm(poolTypeId);
            });
        });
        
        document.querySelectorAll('.btn-toggle-pool-type').forEach(btn => {
            btn.addEventListener('click', () => {
                const poolTypeId = parseInt(btn.getAttribute('data-id'));
                togglePoolTypeStatus(poolTypeId);
            });
        });
    }
    
    // Cambiar estado de un tipo de piscina
    function togglePoolTypeStatus(poolTypeId) {
        const poolTypes = [...AppState.get('poolTypes')];
        const index = poolTypes.findIndex(pt => pt.id === poolTypeId);
        
        if (index === -1) {
            Utils.showToast('Tipo de piscina no encontrado', 'error');
            return;
        }
        
        // Invertir estado
        poolTypes[index].active = !poolTypes[index].active;
        poolTypes[index].updatedAt = new Date();
        
        // Actualizar en AppState
        AppState.update('poolTypes', poolTypes);
        
        // Notificar
        Utils.showToast(
            `Tipo de piscina ${poolTypes[index].active ? 'activado' : 'desactivado'} correctamente`,
            'success'
        );
    }
    
    // Renderizar usuarios
    function renderUsers(users) {
        if (!usersList) return;
        
        // Limpiar lista
        usersList.innerHTML = '';
        
        // Si no hay usuarios
        if (users.length === 0) {
            usersList.innerHTML = '<p class="text-center">No hay usuarios configurados</p>';
            return;
        }
        
        // Crear tabla
        const table = document.createElement('table');
        table.className = 'admin-table';
        
        // Encabezado
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Último acceso</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                <!-- Se llenará dinámicamente -->
            </tbody>
        `;
        
        const tbody = table.querySelector('tbody');
        
        // Ordenar por nombre
        const sortedUsers = [...users].sort((a, b) => a.name.localeCompare(b.name));
        
        // Traducir roles
        const roleTranslations = {
            'admin': 'Administrador',
            'maintenance': 'Mantenimiento',
            'operator': 'Operador',
            'viewer': 'Visualizador'
        };
        
        // Llenar la tabla
        sortedUsers.forEach(user => {
            const row = document.createElement('tr');
            row.className = user.active ? '' : 'row-inactive';
            
            row.innerHTML = `
                <td>${Utils.sanitizeHTML(user.name)}</td>
                <td><code>${Utils.sanitizeHTML(user.username)}</code></td>
                <td>${Utils.sanitizeHTML(user.email)}</td>
                <td>${Utils.sanitizeHTML(roleTranslations[user.role] || user.role)}</td>
                <td>${user.lastLogin ? Utils.formatDateTime(user.lastLogin) : 'Nunca'}</td>
                <td>
                    <span class="status-badge ${user.active ? 'status-active' : 'status-inactive'}">
                        ${user.active ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td class="actions-cell">
                    <button class="btn-edit-user" data-id="${user.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-toggle-user" data-id="${user.id}">
                        <i class="fas fa-${user.active ? 'power-off' : 'check'}"></i>
                    </button>
                    ${user.id !== 1 ? `<button class="btn-reset-password" data-id="${user.id}"><i class="fas fa-key"></i></button>` : ''}
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Añadir tabla a la lista
        usersList.appendChild(table);
        
        // Configurar eventos para botones
        document.querySelectorAll('.btn-edit-user').forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = parseInt(btn.getAttribute('data-id'));
                showUserForm(userId);
            });
        });
        
        document.querySelectorAll('.btn-toggle-user').forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = parseInt(btn.getAttribute('data-id'));
                
                // No permitir desactivar al usuario administrador principal
                if (userId === 1) {
                    Utils.showToast('No se puede desactivar al administrador principal', 'warning');
                    return;
                }
                
                toggleUserStatus(userId);
            });
        });
        
        document.querySelectorAll('.btn-reset-password').forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = parseInt(btn.getAttribute('data-id'));
                resetUserPassword(userId);
            });
        });
    }
    
    // Cambiar estado de un usuario
    function toggleUserStatus(userId) {
        const users = [...AppState.get('adminUsers')];
        const index = users.findIndex(u => u.id === userId);
        
        if (index === -1) {
            Utils.showToast('Usuario no encontrado', 'error');
            return;
        }
        
        // Invertir estado
        users[index].active = !users[index].active;
        users[index].updatedAt = new Date();
        
        // Actualizar en AppState
        AppState.update('adminUsers', users);
        
        // Notificar
        Utils.showToast(
            `Usuario ${users[index].active ? 'activado' : 'desactivado'} correctamente`,
            'success'
        );
    }
    
    // Resetear contraseña de usuario
    function resetUserPassword(userId) {
        const users = [...AppState.get('adminUsers')];
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            Utils.showToast('Usuario no encontrado', 'error');
            return;
        }
        
        // Confirmación
        Utils.confirmAction(
            `¿Estás seguro de que deseas restablecer la contraseña de ${user.name}?`,
            () => {
                // Generar contraseña temporal
                const tempPassword = generateRandomPassword();
                
                // Actualizar usuario
                const index = users.findIndex(u => u.id === userId);
                users[index].password = tempPassword; // En un sistema real, se codificaría
                users[index].updatedAt = new Date();
                
                // Actualizar en AppState
                AppState.update('adminUsers', users);
                
                // Mostrar contraseña temporal
                Utils.showToast(`Contraseña restablecida. Nueva contraseña: ${tempPassword}`, 'success', 10000);
            }
        );
    }
    
    // Generar contraseña aleatoria
    function generateRandomPassword(length = 8) {
        const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ123456789';
        let password = '';
        
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * chars.length);
            password += chars[randomIndex];
        }
        
        return password;
    }
    
    // Inicializar módulo
    initAdminModule();
});