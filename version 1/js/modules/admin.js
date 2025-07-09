// ====================================================
// SUPER ADMIN CON FIREBASE - CLIENTES Y USUARIOS
// ====================================================

// Variables globales del módulo
let isLoading = false;
let currentView = 'clients'; // 'clients' or 'users'

// ====================================================
// INICIALIZACIÓN PRINCIPAL
// ====================================================

function initAdminModule() {
    console.log('👑 Inicializando Super Admin con gestión de usuarios...');
    
    const adminView = document.getElementById('admin-view');
    const currentUser = AppState.get('currentUser');
    
    // Verificar que existe la vista
    if (!adminView) {
        console.error('❌ No se encontró admin-view');
        return;
    }
    
    // Verificar que es Super Admin
    if (!currentUser || currentUser.userLevel !== 'super_admin') {
        renderAccessDenied(adminView);
        return;
    }
    
    // Renderizar estado de carga
    renderLoadingState(adminView, currentUser);
    
    // Cargar datos desde Firebase
    loadAllFirebaseData(currentUser);
    
    console.log('✅ Super Admin con usuarios inicializado');
}

// ====================================================
// CARGA DE DATOS DESDE FIREBASE
// ====================================================

async function loadAllFirebaseData(currentUser) {
    try {
        isLoading = true;
        console.log('🔥 Cargando clientes y usuarios desde Firebase...');
        
        // Cargar datos en paralelo
        const [clients, users] = await Promise.all([
            loadClientsFromFirestore(),
            loadUsersFromFirestore()
        ]);
        
        console.log(`📊 Datos cargados - Clientes: ${clients.length}, Usuarios: ${users.length}`);
        
        // Actualizar AppState para compatibilidad
        AppState.update('clients', clients);
        AppState.update('allUsers', users);
        
        // Renderizar interfaz completa
        renderSuperAdminWithTabs(currentUser, clients, users);
        
        isLoading = false;
        
    } catch (error) {
        console.error('❌ Error cargando datos de Firebase:', error);
        isLoading = false;
        
        const adminView = document.getElementById('admin-view');
        renderError(adminView, error.message);
    }
}

async function loadClientsFromFirestore() {
    try {
        const snapshot = await db.collection('clients').orderBy('createdAt', 'desc').get();
        const clients = [];
        
        snapshot.forEach(doc => {
            clients.push({
                firestoreId: doc.id,
                ...doc.data()
            });
        });
        
        return clients;
        
    } catch (error) {
        console.error('❌ Error cargando clientes:', error);
        return AppState.get('clients') || [];
    }
}

async function loadUsersFromFirestore() {
    try {
        const snapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
        const users = [];
        
        snapshot.forEach(doc => {
            users.push({
                uid: doc.id,
                firestoreId: doc.id,
                ...doc.data()
            });
        });
        
        return users;
        
    } catch (error) {
        console.error('❌ Error cargando usuarios:', error);
        return [];
    }
}

// ====================================================
// RENDERIZADO DE INTERFAZ CON PESTAÑAS
// ====================================================

function renderLoadingState(adminView, currentUser) {
    adminView.innerHTML = `
        <div style="padding: 2rem; max-width: 1200px; margin: 0 auto;">
            <div style="margin-bottom: 3rem;">
                <h2 style="color: #2c3e50; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-crown" style="color: #ffc107;"></i> 
                    Panel Super Admin
                    <span style="font-size: 0.9rem; color: #6c757d; font-weight: normal;">- ${currentUser.name}</span>
                </h2>
                
                <div style="background: #d1ecf1; padding: 1rem; border-radius: 8px; border: 1px solid #bee5eb;">
                    <i class="fas fa-info-circle" style="color: #0c5460;"></i>
                    <strong>Modo Super Admin:</strong> Cargando clientes y usuarios desde Firebase...
                </div>
            </div>
            
            <div style="text-align: center; padding: 4rem 2rem; color: #6c757d;">
                <i class="fas fa-spinner fa-spin fa-3x" style="color: #007bff; margin-bottom: 1.5rem;"></i>
                <h3 style="color: #495057; margin-bottom: 1rem;">Cargando datos...</h3>
                <p>Conectando con Firestore...</p>
            </div>
        </div>
    `;
}

function renderError(adminView, errorMessage) {
    adminView.innerHTML = `
        <div style="padding: 2rem; max-width: 1200px; margin: 0 auto;">
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 1rem; border-radius: 8px; margin-bottom: 2rem;">
                <i class="fas fa-exclamation-triangle"></i>
                <strong>Error de Conexión:</strong> ${errorMessage}
            </div>
            
            <div style="text-align: center; padding: 2rem;">
                <button onclick="initAdminModule()" style="background: #007bff; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>
        </div>
    `;
}

function renderAccessDenied(adminView) {
    adminView.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 60vh; text-align: center;">
            <div style="max-width: 400px; padding: 2rem;">
                <i class="fas fa-crown" style="font-size: 3rem; color: #dc3545; margin-bottom: 1rem;"></i>
                <h2 style="color: #dc3545;">Acceso Restringido</h2>
                <p>Esta área es solo para Super Administradores de Prestotel</p>
                <button onclick="showModule('dashboard-view')" class="btn btn-primary">
                    Volver al Dashboard
                </button>
            </div>
        </div>
    `;
}

function renderSuperAdminWithTabs(currentUser, clients, users) {
    const adminView = document.getElementById('admin-view');
    
    // Calcular estadísticas
    const clientUsers = users.filter(u => u.clientId); // Usuarios que pertenecen a clientes
    const activeUsers = users.filter(u => u.active);
    
    adminView.innerHTML = `
        <div style="padding: 2rem; max-width: 1200px; margin: 0 auto;">
            <!-- HEADER -->
            <div style="margin-bottom: 3rem;">
                <h2 style="color: #2c3e50; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-crown" style="color: #ffc107;"></i> 
                    Panel Super Admin
                    <span style="font-size: 0.9rem; color: #6c757d; font-weight: normal;">- ${currentUser.name}</span>
                </h2>
                
                <div style="background: #d4edda; padding: 1rem; border-radius: 8px; border: 1px solid #c3e6cb;">
                    <i class="fas fa-check-circle" style="color: #155724;"></i>
                    <strong>Sistema Multi-Cliente:</strong> Gestión completa de clientes y usuarios en Firebase.
                </div>
            </div>
            
            <!-- ESTADÍSTICAS CONSOLIDADAS -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">
                ${renderConsolidatedStats(clients, users)}
            </div>
            
            <!-- NAVEGACIÓN DE PESTAÑAS -->
            <div style="background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); overflow: hidden;">
                <!-- HEADER CON PESTAÑAS -->
                <div style="background: linear-gradient(135deg, #2c3e50, #34495e); color: white; padding: 1.5rem 2rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-cogs"></i> Gestión del Sistema
                            <i class="fas fa-cloud" style="font-size: 0.8rem; color: #17a2b8;" title="Conectado a Firebase"></i>
                        </h3>
                        <button onclick="refreshAllData()" style="background: #17a2b8; color: white; padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer;">
                            <i class="fas fa-sync-alt"></i> Actualizar
                        </button>
                    </div>
                    
                    <!-- PESTAÑAS -->
                    <div style="display: flex; gap: 1rem;">
                        <button onclick="switchTab('clients')" id="tab-clients" style="background: ${currentView === 'clients' ? '#007bff' : 'transparent'}; color: white; padding: 0.75rem 1.5rem; border: ${currentView === 'clients' ? 'none' : '2px solid rgba(255,255,255,0.3)'}; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-building"></i> Clientes (${clients.length})
                        </button>
                        <button onclick="switchTab('users')" id="tab-users" style="background: ${currentView === 'users' ? '#007bff' : 'transparent'}; color: white; padding: 0.75rem 1.5rem; border: ${currentView === 'users' ? 'none' : '2px solid rgba(255,255,255,0.3)'}; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-users"></i> Usuarios (${users.length})
                        </button>
                    </div>
                </div>
                
                <!-- CONTENIDO DE PESTAÑAS -->
                <div style="padding: 2rem;">
                    <div id="content-clients" style="display: ${currentView === 'clients' ? 'block' : 'none'};">
                        ${renderClientsContent(clients)}
                    </div>
                    
                    <div id="content-users" style="display: ${currentView === 'users' ? 'block' : 'none'};">
                        ${renderUsersContent(users, clients)}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    setupAllEvents();
}

// ====================================================
// ESTADÍSTICAS CONSOLIDADAS
// ====================================================

function renderConsolidatedStats(clients, users) {
    const activeClients = clients.filter(c => c.status === 'active').length;
    const totalRevenue = clients.reduce((sum, c) => sum + (c.status === 'active' ? c.monthlyPrice : 0), 0);
    const totalHotels = clients.reduce((sum, c) => sum + (c.stats ? c.stats.hotelsCount : 0), 0);
    const clientUsers = users.filter(u => u.clientId).length;
    const activeUsers = users.filter(u => u.active).length;
    
    return `
        <div style="background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.08); display: flex; align-items: center; gap: 1rem;">
            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #007bff, #0056b3); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem;">
                <i class="fas fa-building"></i>
            </div>
            <div>
                <h3 style="font-size: 1.8rem; font-weight: 700; margin: 0; color: #2c3e50;">${clients.length}</h3>
                <p style="font-size: 0.85rem; color: #6c757d; margin: 0;">Clientes</p>
                <small style="font-size: 0.75rem; color: #95a5a6;">${activeClients} activos</small>
            </div>
        </div>
        
        <div style="background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.08); display: flex; align-items: center; gap: 1rem;">
            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #28a745, #1e7e34); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem;">
                <i class="fas fa-users"></i>
            </div>
            <div>
                <h3 style="font-size: 1.8rem; font-weight: 700; margin: 0; color: #2c3e50;">${users.length}</h3>
                <p style="font-size: 0.85rem; color: #6c757d; margin: 0;">Usuarios</p>
                <small style="font-size: 0.75rem; color: #95a5a6;">${activeUsers} activos</small>
            </div>
        </div>
        
        <div style="background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.08); display: flex; align-items: center; gap: 1rem;">
            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #17a2b8, #117a8b); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem;">
                <i class="fas fa-hotel"></i>
            </div>
            <div>
                <h3 style="font-size: 1.8rem; font-weight: 700; margin: 0; color: #2c3e50;">${totalHotels}</h3>
                <p style="font-size: 0.85rem; color: #6c757d; margin: 0;">Hoteles</p>
                <small style="font-size: 0.75rem; color: #95a5a6;">En gestión</small>
            </div>
        </div>
        
        <div style="background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.08); display: flex; align-items: center; gap: 1rem;">
            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #ffc107, #e0a800); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem;">
                <i class="fas fa-euro-sign"></i>
            </div>
            <div>
                <h3 style="font-size: 1.8rem; font-weight: 700; margin: 0; color: #2c3e50;">€${totalRevenue}</h3>
                <p style="font-size: 0.85rem; color: #6c757d; margin: 0;">Ingresos</p>
                <small style="font-size: 0.75rem; color: #95a5a6;">Mensuales</small>
            </div>
        </div>
        
        <div style="background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.08); display: flex; align-items: center; gap: 1rem;">
            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #6f42c1, #5a2d91); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem;">
                <i class="fas fa-user-tie"></i>
            </div>
            <div>
                <h3 style="font-size: 1.8rem; font-weight: 700; margin: 0; color: #2c3e50;">${clientUsers}</h3>
                <p style="font-size: 0.85rem; color: #6c757d; margin: 0;">Usuarios Cliente</p>
                <small style="font-size: 0.75rem; color: #95a5a6;">Con empresa</small>
            </div>
        </div>
    `;
}

// ====================================================
// CONTENIDO DE PESTAÑAS
// ====================================================

function renderClientsContent(clients) {
    return `
        <div style="margin-bottom: 2rem; display: flex; justify-content: between; align-items: center;">
            <h4 style="margin: 0; color: #2c3e50; display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-building"></i> Gestión de Clientes
            </h4>
            <button onclick="showCreateClientForm()" style="background: #28a745; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-plus"></i> Nuevo Cliente
            </button>
        </div>
        
        <!-- FORMULARIO CREAR CLIENTE -->
        <div id="create-client-form" style="display: none; margin-bottom: 2rem; border: 2px solid #e9ecef; border-radius: 12px; overflow: hidden;">
            ${renderCreateClientForm()}
        </div>
        
        <!-- LISTA DE CLIENTES -->
        ${renderClientsList(clients)}
    `;
}

function renderUsersContent(users, clients) {
    return `
        <div style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center;">
            <h4 style="margin: 0; color: #2c3e50; display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-users"></i> Gestión de Usuarios
            </h4>
            <button onclick="showCreateUserForm()" style="background: #17a2b8; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-user-plus"></i> Nuevo Usuario
            </button>
        </div>
        
        <!-- FORMULARIO CREAR USUARIO -->
        <div id="create-user-form" style="display: none; margin-bottom: 2rem; border: 2px solid #e9ecef; border-radius: 12px; overflow: hidden;">
            ${renderCreateUserForm(clients)}
        </div>
        
        <!-- LISTA DE USUARIOS -->
        ${renderUsersList(users, clients)}
    `;
}

// ====================================================
// FUNCIONES DE NAVEGACIÓN
// ====================================================

function switchTab(tabName) {
    currentView = tabName;
    
    // Actualizar botones
    document.getElementById('tab-clients').style.background = tabName === 'clients' ? '#007bff' : 'transparent';
    document.getElementById('tab-clients').style.border = tabName === 'clients' ? 'none' : '2px solid rgba(255,255,255,0.3)';
    
    document.getElementById('tab-users').style.background = tabName === 'users' ? '#007bff' : 'transparent';
    document.getElementById('tab-users').style.border = tabName === 'users' ? 'none' : '2px solid rgba(255,255,255,0.3)';
    
    // Mostrar/ocultar contenido
    document.getElementById('content-clients').style.display = tabName === 'clients' ? 'block' : 'none';
    document.getElementById('content-users').style.display = tabName === 'users' ? 'block' : 'none';
    
    console.log('📱 Cambiando a pestaña:', tabName);
}

async function refreshAllData() {
    if (isLoading) return;
    
    const currentUser = AppState.get('currentUser');
    if (currentUser && currentUser.userLevel === 'super_admin') {
        await loadAllFirebaseData(currentUser);
    }
}

// ====================================================
// GESTIÓN DE USUARIOS - FORMULARIOS
// ====================================================

function renderCreateUserForm(clients) {
    return `
        <div style="background: linear-gradient(135deg, #17a2b8, #138496); color: white; padding: 1.25rem 2rem; display: flex; justify-content: space-between; align-items: center;">
            <h4 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-user-plus"></i> Crear Nuevo Usuario
                <i class="fas fa-cloud" style="font-size: 0.8rem;" title="Se guardará en Firebase"></i>
            </h4>
            <button onclick="hideCreateUserForm()" style="background: transparent; border: none; color: white; font-size: 1.2rem; cursor: pointer;">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <div style="padding: 2rem; background: white;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                <div>
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Nombre Completo *</label>
                    <input type="text" id="user-name" placeholder="ej: María García López" 
                           style="width: 100%; padding: 0.75rem; border: 2px solid #e9ecef; border-radius: 8px;">
                </div>
                <div>
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Email *</label>
                    <input type="email" id="user-email" placeholder="ej: maria@mediteraneo.com"
                           style="width: 100%; padding: 0.75rem; border: 2px solid #e9ecef; border-radius: 8px;">
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                <div>
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Cliente *</label>
                    <select id="user-client" style="width: 100%; padding: 0.75rem; border: 2px solid #e9ecef; border-radius: 8px;">
                        <option value="">Seleccionar cliente...</option>
                        ${clients.map(client => `
                            <option value="${client.code}">${client.name} (${client.code})</option>
                        `).join('')}
                    </select>
                </div>
                <div>
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Nivel de Usuario *</label>
                    <select id="user-level" style="width: 100%; padding: 0.75rem; border: 2px solid #e9ecef; border-radius: 8px;">
                        <option value="">Seleccionar nivel...</option>
                        <option value="client_admin">Client Admin - Administrador del cliente</option>
                        <option value="hotel_manager">Hotel Manager - Gestor de hotel</option>
                        <option value="department_head">Department Head - Jefe de departamento</option>
                        <option value="employee">Employee - Empleado básico</option>
                    </select>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                <div>
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Teléfono</label>
                    <input type="tel" id="user-phone" placeholder="ej: +34 600 000 000"
                           style="width: 100%; padding: 0.75rem; border: 2px solid #e9ecef; border-radius: 8px;">
                </div>
                <div>
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Cargo/Posición</label>
                    <input type="text" id="user-position" placeholder="ej: Administrador General"
                           style="width: 100%; padding: 0.75rem; border: 2px solid #e9ecef; border-radius: 8px;">
                </div>
            </div>
            
            <div style="margin-bottom: 1.5rem;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Contraseña Temporal *</label>
                <div style="display: flex; gap: 0.5rem;">
                    <input type="text" id="user-password" placeholder="Contraseña temporal"
                           style="flex: 1; padding: 0.75rem; border: 2px solid #e9ecef; border-radius: 8px;">
                    <button onclick="generateUserPassword()" style="padding: 0.75rem 1rem; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        <i class="fas fa-dice"></i> Generar
                    </button>
                </div>
                <small style="color: #6c757d; font-size: 0.8rem;">El usuario deberá cambiarla en el primer acceso</small>
            </div>
            
            <div style="margin-bottom: 1.5rem;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Permisos</label>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem;">
                    <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: #f8f9fa; border-radius: 6px;">
                        <input type="checkbox" id="perm-hotels" value="hotels">
                        <span>Gestión de Hoteles</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: #f8f9fa; border-radius: 6px;">
                        <input type="checkbox" id="perm-tasks" value="tasks">
                        <span>Tareas</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: #f8f9fa; border-radius: 6px;">
                        <input type="checkbox" id="perm-employees" value="employees">
                        <span>Empleados</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: #f8f9fa; border-radius: 6px;">
                        <input type="checkbox" id="perm-inventory" value="inventory">
                        <span>Inventario</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: #f8f9fa; border-radius: 6px;">
                        <input type="checkbox" id="perm-admin" value="admin">
                        <span>Administración</span>
                    </label>
                </div>
            </div>
            
            <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                <button onclick="hideCreateUserForm()" style="padding: 0.75rem 1.5rem; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Cancelar
                </button>
                <button onclick="createUserInFirebase()" style="padding: 0.75rem 1.5rem; background: #17a2b8; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-cloud-upload-alt"></i> Crear Usuario
                </button>
            </div>
        </div>
    `;
}

// ====================================================
// RENDERIZADO DE LISTAS
// ====================================================

function renderClientsList(clients) {
    if (clients.length === 0) {
        return `
            <div style="text-align: center; padding: 4rem 2rem; color: #6c757d;">
                <i class="fas fa-building fa-3x" style="color: #dee2e6; margin-bottom: 1.5rem;"></i>
                <h3 style="color: #495057; margin-bottom: 1rem;">No hay clientes en Firebase</h3>
                <p style="margin-bottom: 1.5rem;">Comienza creando tu primer cliente.</p>
                <button onclick="showCreateClientForm()" style="background: #28a745; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-plus"></i> Crear Primer Cliente
                </button>
            </div>
        `;
    }
    
    let html = '<div style="overflow-x: auto;"><table style="width: 100%; border-collapse: collapse;">';
    html += '<thead><tr style="background: #f8f9fa;">';
    html += '<th style="padding: 1rem; text-align: left; border-bottom: 2px solid #dee2e6;">Cliente</th>';
    html += '<th style="padding: 1rem; text-align: left; border-bottom: 2px solid #dee2e6;">Plan</th>';
    html += '<th style="padding: 1rem; text-align: left; border-bottom: 2px solid #dee2e6;">Usuarios</th>';
    html += '<th style="padding: 1rem; text-align: left; border-bottom: 2px solid #dee2e6;">Estado</th>';
    html += '<th style="padding: 1rem; text-align: left; border-bottom: 2px solid #dee2e6;">Acciones</th>';
    html += '</tr></thead><tbody>';
    
    clients.forEach(client => {
        const users = AppState.get('allUsers') || [];
        const clientUsers = users.filter(u => u.clientId === client.code);
        const activeUsers = clientUsers.filter(u => u.active);
        
        html += `
            <tr style="border-bottom: 1px solid #e9ecef;">
                <td style="padding: 1rem; vertical-align: middle;">
                    <strong style="color: #2c3e50;">${client.name}</strong><br>
                    <small style="color: #6c757d;">${client.email}</small><br>
                    <code style="background: #e9ecef; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">${client.code}</code>
                </td>
                <td style="padding: 1rem; vertical-align: middle;">
                    <span style="background: #007bff; color: white; padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.8rem; text-transform: uppercase;">
                        ${client.plan}
                    </span><br>
                    <small style="color: #6c757d;">€${client.monthlyPrice}/mes</small>
                </td>
                <td style="padding: 1rem; vertical-align: middle;">
                    <strong style="color: #17a2b8;">${clientUsers.length}</strong> usuarios<br>
                    <small style="color: #6c757d;">${activeUsers.length} activos</small><br>
                    <small style="color: #6c757d;">Límite: ${client.limits.maxUsers}</small>
                </td>
                <td style="padding: 1rem; vertical-align: middle;">
                    <span style="background: ${client.status === 'active' ? '#28a745' : '#dc3545'}; color: white; padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.8rem;">
                        ${client.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td style="padding: 1rem; vertical-align: middle;">
                    <button onclick="viewClientUsers('${client.code}')" style="background: #17a2b8; color: white; padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; margin-right: 0.5rem;">
                        <i class="fas fa-users"></i> Ver Usuarios
                    </button>
                    <button onclick="viewClientFromFirebase('${client.firestoreId}')" style="background: #28a745; color: white; padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer;">
                        <i class="fas fa-eye"></i> Detalles
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    return html;
}

function renderUsersList(users, clients) {
    if (users.length === 0) {
        return `
            <div style="text-align: center; padding: 4rem 2rem; color: #6c757d;">
                <i class="fas fa-users fa-3x" style="color: #dee2e6; margin-bottom: 1.5rem;"></i>
                <h3 style="color: #495057; margin-bottom: 1rem;">No hay usuarios registrados</h3>
                <p style="margin-bottom: 1.5rem;">Comienza creando usuarios para tus clientes.</p>
                <button onclick="showCreateUserForm()" style="background: #17a2b8; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-user-plus"></i> Crear Primer Usuario
                </button>
            </div>
        `;
    }
    
    let html = '<div style="overflow-x: auto;"><table style="width: 100%; border-collapse: collapse;">';
    html += '<thead><tr style="background: #f8f9fa;">';
    html += '<th style="padding: 1rem; text-align: left; border-bottom: 2px solid #dee2e6;">Usuario</th>';
    html += '<th style="padding: 1rem; text-align: left; border-bottom: 2px solid #dee2e6;">Cliente</th>';
    html += '<th style="padding: 1rem; text-align: left; border-bottom: 2px solid #dee2e6;">Nivel</th>';
    html += '<th style="padding: 1rem; text-align: left; border-bottom: 2px solid #dee2e6;">Estado</th>';
    html += '<th style="padding: 1rem; text-align: left; border-bottom: 2px solid #dee2e6;">Acciones</th>';
    html += '</tr></thead><tbody>';
    
    users.forEach(user => {
        const client = clients.find(c => c.code === user.clientId);
        const userLevelColors = {
            super_admin: '#6f42c1',
            client_admin: '#007bff',
            hotel_manager: '#28a745',
            department_head: '#ffc107',
            employee: '#6c757d'
        };
        
        const userLevelNames = {
            super_admin: 'Super Admin',
            client_admin: 'Client Admin',
            hotel_manager: 'Hotel Manager',
            department_head: 'Jefe Departamento',
            employee: 'Empleado'
        };
        
        html += `
            <tr style="border-bottom: 1px solid #e9ecef;">
                <td style="padding: 1rem; vertical-align: middle;">
                    <strong style="color: #2c3e50;">${user.name}</strong><br>
                    <small style="color: #6c757d;">${user.email}</small><br>
                    ${user.profile?.position ? `<small style="color: #95a5a6;">${user.profile.position}</small>` : ''}
                </td>
                <td style="padding: 1rem; vertical-align: middle;">
                    ${client ? `
                        <strong style="color: #007bff;">${client.name}</strong><br>
                        <code style="background: #e9ecef; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">${client.code}</code>
                    ` : `
                        <span style="color: #6c757d;">Sistema</span>
                    `}
                </td>
                <td style="padding: 1rem; vertical-align: middle;">
                    <span style="background: ${userLevelColors[user.userLevel] || '#6c757d'}; color: white; padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.8rem;">
                        ${userLevelNames[user.userLevel] || user.userLevel}
                    </span>
                    ${user.mustChangePassword ? '<br><small style="color: #dc3545;">Debe cambiar contraseña</small>' : ''}
                </td>
                <td style="padding: 1rem; vertical-align: middle;">
                    <span style="background: ${user.active ? '#28a745' : '#dc3545'}; color: white; padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.8rem;">
                        ${user.active ? 'Activo' : 'Inactivo'}
                    </span>
                    ${user.lastLogin ? `<br><small style="color: #6c757d;">Último: ${new Date(user.lastLogin).toLocaleDateString()}</small>` : '<br><small style="color: #6c757d;">Nunca conectado</small>'}
                </td>
                <td style="padding: 1rem; vertical-align: middle;">
                    <button onclick="viewUserDetails('${user.uid}')" style="background: #17a2b8; color: white; padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; margin-right: 0.5rem;">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    <button onclick="toggleUserStatus('${user.uid}', ${!user.active})" style="background: ${user.active ? '#ffc107' : '#28a745'}; color: white; padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer;">
                        <i class="fas fa-${user.active ? 'pause' : 'play'}"></i> ${user.active ? 'Suspender' : 'Activar'}
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    return html;
}

// ====================================================
// FUNCIONES DE USUARIOS
// ====================================================

function showCreateUserForm() {
    const form = document.getElementById('create-user-form');
    if (form) {
        form.style.display = 'block';
        document.getElementById('user-name').focus();
    }
}

function hideCreateUserForm() {
    const form = document.getElementById('create-user-form');
    if (form) {
        form.style.display = 'none';
    }
    clearUserForm();
}

function clearUserForm() {
    const fields = ['user-name', 'user-email', 'user-client', 'user-level', 'user-phone', 'user-position', 'user-password'];
    fields.forEach(id => {
        const field = document.getElementById(id);
        if (field) field.value = '';
    });
    
    // Limpiar checkboxes
    const permissions = ['hotels', 'tasks', 'employees', 'inventory', 'admin'];
    permissions.forEach(perm => {
        const checkbox = document.getElementById(`perm-${perm}`);
        if (checkbox) checkbox.checked = false;
    });
}

function generateUserPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = 'Prestotel';
    for (let i = 0; i < 6; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const field = document.getElementById('user-password');
    if (field) {
        field.value = password + '!';
    }
}

async function createUserInFirebase() {
    if (isLoading) return;
    
    const data = {
        name: document.getElementById('user-name').value.trim(),
        email: document.getElementById('user-email').value.trim(),
        clientId: document.getElementById('user-client').value,
        userLevel: document.getElementById('user-level').value,
        phone: document.getElementById('user-phone').value.trim(),
        position: document.getElementById('user-position').value.trim(),
        password: document.getElementById('user-password').value.trim()
    };
    
    // Obtener permisos
    const permissions = ['hotels', 'tasks', 'employees', 'inventory', 'admin'];
    const selectedPermissions = permissions.filter(perm => {
        const checkbox = document.getElementById(`perm-${perm}`);
        return checkbox && checkbox.checked;
    });
    
    // Validaciones
    if (!data.name || !data.email || !data.clientId || !data.userLevel || !data.password) {
        alert('Por favor completa todos los campos obligatorios');
        return;
    }
    
    if (selectedPermissions.length === 0) {
        alert('Selecciona al menos un permiso para el usuario');
        return;
    }
    
    try {
        isLoading = true;
        
        // Mostrar estado de carga
        const createBtn = document.querySelector('button[onclick="createUserInFirebase()"]');
        createBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando usuario...';
        createBtn.disabled = true;
        
        // Verificar que el cliente existe
        const clients = AppState.get('clients') || [];
        const client = clients.find(c => c.code === data.clientId);
        if (!client) {
            throw new Error('Cliente no encontrado');
        }
        
        // Verificar límite de usuarios del cliente
        const users = AppState.get('allUsers') || [];
        const clientUsers = users.filter(u => u.clientId === data.clientId);
        if (clientUsers.length >= client.limits.maxUsers) {
            throw new Error(`El cliente ${client.name} ha alcanzado su límite de ${client.limits.maxUsers} usuarios`);
        }
        
        // Crear usuario en Firebase Authentication
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(data.email, data.password);
        const firebaseUser = userCredential.user;
        
        console.log('✅ Usuario creado en Firebase Auth:', firebaseUser.uid);
        
        // Crear perfil en Firestore
        const userProfile = {
            name: data.name,
            email: data.email,
            userLevel: data.userLevel,
            clientId: data.clientId,
            assignedHotels: ["ALL"], // Por defecto acceso a todos los hoteles del cliente
            permissions: selectedPermissions,
            active: true,
            mustChangePassword: true,
            createdAt: new Date().toISOString(),
            createdBy: AppState.get('currentUser').email,
            lastLogin: null,
            profile: {
                phone: data.phone,
                position: data.position,
                department: "General"
            }
        };
        
        await db.collection('users').doc(firebaseUser.uid).set(userProfile);
        console.log('✅ Perfil guardado en Firestore');
        
        // Mostrar credenciales
        alert(`🎉 Usuario "${data.name}" creado correctamente!

📧 CREDENCIALES:
Email: ${data.email}
Contraseña: ${data.password}

Cliente: ${client.name}
Nivel: ${data.userLevel}
Permisos: ${selectedPermissions.join(', ')}

⚠️ IMPORTANTE:
- Envía estas credenciales al usuario
- Deberá cambiar la contraseña en el primer acceso
- Usuario creado en Firebase Authentication y Firestore

¡Usuario listo para usar Prestotel!`);
        
        // Recargar datos
        hideCreateUserForm();
        await loadAllFirebaseData(AppState.get('currentUser'));
        
        isLoading = false;
        
    } catch (error) {
        console.error('❌ Error creando usuario:', error);
        
        let errorMessage = error.message;
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Este email ya está registrado en el sistema';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'La contraseña es demasiado débil (mínimo 6 caracteres)';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'El formato del email no es válido';
        }
        
        alert('Error creando usuario: ' + errorMessage);
        
        // Restaurar botón
        const createBtn = document.querySelector('button[onclick="createUserInFirebase()"]');
        if (createBtn) {
            createBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Crear Usuario';
            createBtn.disabled = false;
        }
        
        isLoading = false;
    }
}

async function viewUserDetails(uid) {
    try {
        const users = AppState.get('allUsers') || [];
        const user = users.find(u => u.uid === uid);
        
        if (user) {
            const clients = AppState.get('clients') || [];
            const client = clients.find(c => c.code === user.clientId);
            
            alert(`👤 Detalles del Usuario:

Nombre: ${user.name}
Email: ${user.email}
Nivel: ${user.userLevel}
Estado: ${user.active ? 'Activo' : 'Inactivo'}

Cliente: ${client ? client.name : 'Sistema'}
Código Cliente: ${user.clientId || 'N/A'}

Permisos: ${(user.permissions || []).join(', ')}
Hoteles Asignados: ${(user.assignedHotels || []).join(', ')}

Perfil:
- Teléfono: ${user.profile?.phone || 'No especificado'}
- Cargo: ${user.profile?.position || 'No especificado'}
- Departamento: ${user.profile?.department || 'No especificado'}

Contraseña: ${user.mustChangePassword ? 'Debe cambiar' : 'Configurada'}
Último acceso: ${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Nunca'}

Creado: ${new Date(user.createdAt).toLocaleString()}
Por: ${user.createdBy}
ID Firebase: ${uid}`);
        }
    } catch (error) {
        console.error('❌ Error obteniendo detalles del usuario:', error);
        alert('Error obteniendo detalles: ' + error.message);
    }
}

async function toggleUserStatus(uid, newStatus) {
    try {
        await db.collection('users').doc(uid).update({
            active: newStatus,
            updatedAt: new Date().toISOString()
        });
        
        console.log(`✅ Usuario ${newStatus ? 'activado' : 'suspendido'}:`, uid);
        
        // Recargar datos
        await loadAllFirebaseData(AppState.get('currentUser'));
        
    } catch (error) {
        console.error('❌ Error cambiando estado del usuario:', error);
        alert('Error cambiando estado: ' + error.message);
    }
}

function viewClientUsers(clientCode) {
    // Cambiar a pestaña de usuarios y filtrar por cliente
    switchTab('users');
    
    // Aquí podrías implementar un filtro visual
    setTimeout(() => {
        alert(`🔍 Mostrando usuarios del cliente: ${clientCode}\n\nEsta funcionalidad se puede expandir para filtrar la tabla.`);
    }, 100);
}

// ====================================================
// FORMULARIOS DE CLIENTES (Reutilizados)
// ====================================================

function renderCreateClientForm() {
    return `
        <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 1.25rem 2rem; display: flex; justify-content: space-between; align-items: center;">
            <h4 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-plus"></i> Crear Nuevo Cliente
            </h4>
            <button onclick="hideCreateClientForm()" style="background: transparent; border: none; color: white; font-size: 1.2rem; cursor: pointer;">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <div style="padding: 2rem; background: white;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                <div>
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Nombre de la Empresa *</label>
                    <input type="text" id="client-name" placeholder="ej: Hotel Mediterráneo S.L." 
                           style="width: 100%; padding: 0.75rem; border: 2px solid #e9ecef; border-radius: 8px;">
                </div>
                <div>
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Código Cliente *</label>
                    <input type="text" id="client-code" placeholder="ej: MEDITERR_2025"
                           style="width: 100%; padding: 0.75rem; border: 2px solid #e9ecef; border-radius: 8px;">
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                <div>
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Email de Contacto *</label>
                    <input type="email" id="client-email" placeholder="ej: admin@mediteraneo.com"
                           style="width: 100%; padding: 0.75rem; border: 2px solid #e9ecef; border-radius: 8px;">
                </div>
                <div>
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Plan de Servicio *</label>
                    <select id="client-plan" style="width: 100%; padding: 0.75rem; border: 2px solid #e9ecef; border-radius: 8px;">
                        <option value="">Seleccionar plan...</option>
                        <option value="basic">Básico - 3 hoteles (€99/mes)</option>
                        <option value="professional">Profesional - 10 hoteles (€299/mes)</option>
                        <option value="enterprise">Enterprise - 25 hoteles (€699/mes)</option>
                    </select>
                </div>
            </div>
            
            <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                <button onclick="hideCreateClientForm()" style="padding: 0.75rem 1.5rem; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Cancelar
                </button>
                <button onclick="createClientInFirebase()" style="padding: 0.75rem 1.5rem; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-cloud-upload-alt"></i> Crear Cliente
                </button>
            </div>
        </div>
    `;
}

function showCreateClientForm() {
    const form = document.getElementById('create-client-form');
    if (form) {
        form.style.display = 'block';
        document.getElementById('client-name').focus();
    }
}

function hideCreateClientForm() {
    const form = document.getElementById('create-client-form');
    if (form) {
        form.style.display = 'none';
    }
    clearClientForm();
}

function clearClientForm() {
    const fields = ['client-name', 'client-code', 'client-email', 'client-plan'];
    fields.forEach(id => {
        const field = document.getElementById(id);
        if (field) field.value = '';
    });
}

function generatePassword() {
    // Función para compatibilidad - ya no se usa en el nuevo formulario simplificado
    console.log('generatePassword: función heredada');
}

// Funciones de clientes que ya teníamos
async function createClientInFirebase() {
    // Función simplificada del cliente - reutilizar la lógica anterior
    // pero sin el formulario extendido
    
    const data = {
        name: document.getElementById('client-name').value.trim(),
        code: document.getElementById('client-code').value.trim().toUpperCase(),
        email: document.getElementById('client-email').value.trim(),
        plan: document.getElementById('client-plan').value
    };
    
    if (!data.name || !data.code || !data.email || !data.plan) {
        alert('Por favor completa todos los campos obligatorios');
        return;
    }
    
    try {
        isLoading = true;
        
        const createBtn = document.querySelector('button[onclick="createClientInFirebase()"]');
        createBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';
        createBtn.disabled = true;
        
        // Verificar código único
        const existingClient = await db.collection('clients').where('code', '==', data.code).get();
        if (!existingClient.empty) {
            throw new Error('El código de cliente ya existe');
        }
        
        // Crear cliente básico
        const planLimits = {
            basic: { maxHotels: 3, maxUsers: 10, price: 99 },
            professional: { maxHotels: 10, maxUsers: 50, price: 299 },
            enterprise: { maxHotels: 25, maxUsers: 100, price: 699 }
        };
        
        const limits = planLimits[data.plan];
        const client = {
            id: data.code,
            name: data.name,
            code: data.code,
            email: data.email,
            plan: data.plan,
            status: 'active',
            limits: {
                maxHotels: limits.maxHotels,
                maxUsers: limits.maxUsers,
                maxStorageGB: 10,
                maxTasksPerMonth: 10000
            },
            monthlyPrice: limits.price,
            startDate: new Date().toISOString(),
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 año
            createdAt: new Date().toISOString(),
            createdBy: AppState.get('currentUser').email,
            stats: {
                hotelsCount: 0,
                usersCount: 0,
                storageUsedGB: 0,
                tasksThisMonth: 0
            }
        };
        
        // Guardar en Firestore
        await db.collection('clients').add(client);
        console.log('✅ Cliente creado en Firebase');
        
        alert(`🎉 Cliente "${client.name}" creado correctamente!

Plan: ${client.plan.toUpperCase()} (€${client.monthlyPrice}/mes)
Límites: ${client.limits.maxHotels} hoteles, ${client.limits.maxUsers} usuarios

Ahora puedes crear usuarios para este cliente en la pestaña "Usuarios".`);
        
        // Recargar datos
        hideCreateClientForm();
        await loadAllFirebaseData(AppState.get('currentUser'));
        
        isLoading = false;
        
    } catch (error) {
        console.error('❌ Error creando cliente:', error);
        alert('Error creando cliente: ' + error.message);
        
        const createBtn = document.querySelector('button[onclick="createClientInFirebase()"]');
        if (createBtn) {
            createBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Crear Cliente';
            createBtn.disabled = false;
        }
        
        isLoading = false;
    }
}

async function viewClientFromFirebase(firestoreId) {
    try {
        const doc = await db.collection('clients').doc(firestoreId).get();
        
        if (doc.exists) {
            const client = doc.data();
            const users = AppState.get('allUsers') || [];
            const clientUsers = users.filter(u => u.clientId === client.code);
            
            alert(`📋 Detalles del Cliente:

Nombre: ${client.name}
Código: ${client.code}
Email: ${client.email}
Plan: ${client.plan.toUpperCase()}
Estado: ${client.status}
Precio mensual: €${client.monthlyPrice}

Límites:
- Hoteles: ${client.stats.hotelsCount}/${client.limits.maxHotels}
- Usuarios: ${clientUsers.length}/${client.limits.maxUsers}
- Almacenamiento: ${client.stats.storageUsedGB}/${client.limits.maxStorageGB} GB

Usuarios registrados: ${clientUsers.length}
Usuarios activos: ${clientUsers.filter(u => u.active).length}

Vencimiento: ${new Date(client.expiryDate).toLocaleDateString()}
Creado: ${new Date(client.createdAt).toLocaleDateString()}
ID Firebase: ${firestoreId}`);
        }
    } catch (error) {
        console.error('❌ Error obteniendo cliente:', error);
        alert('Error obteniendo detalles: ' + error.message);
    }
}

// ====================================================
// CONFIGURACIÓN DE EVENTOS
// ====================================================

function setupAllEvents() {
    // Los eventos ya están configurados inline en el HTML
    console.log('✅ Eventos configurados para gestión completa');
}

// ====================================================
// COMPATIBILIDAD Y EXPORTACIÓN
// ====================================================

// Asegurar compatibilidad con sistema existente
if (typeof AdminModule === 'undefined') {
    window.AdminModule = {
        init: initAdminModule,
        refresh: refreshAllData
    };
}

// Hacer funciones globales para eventos inline
window.switchTab = switchTab;
window.refreshAllData = refreshAllData;

// Funciones de clientes
window.showCreateClientForm = showCreateClientForm;
window.hideCreateClientForm = hideCreateClientForm;
window.createClientInFirebase = createClientInFirebase;
window.viewClientFromFirebase = viewClientFromFirebase;
window.viewClientUsers = viewClientUsers;

// Funciones de usuarios
window.showCreateUserForm = showCreateUserForm;
window.hideCreateUserForm = hideCreateUserForm;
window.generateUserPassword = generateUserPassword;
window.createUserInFirebase = createUserInFirebase;
window.viewUserDetails = viewUserDetails;
window.toggleUserStatus = toggleUserStatus;

// Función heredada para compatibilidad
window.generatePassword = generatePassword;

console.log('🔥 Super Admin con gestión completa de usuarios cargado correctamente');