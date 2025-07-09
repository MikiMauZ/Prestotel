// ====================================================
// GESTIÓN DE ESTADO CENTRALIZADA - SISTEMA LIMPIO
// ====================================================

const AppState = {
    // Datos de la aplicación - INICIADOS VACÍOS
    data: {
        currentModule: 'dashboard-view',
        isAuthenticated: false,
        
        // ⭐ INFORMACIÓN DE LICENCIAS (Configurado por Super Admin)
        clientLicense: null, // Se carga desde Firebase cuando el usuario se autentica
        
        // ⭐ USUARIO ACTUAL (Se establece desde Firebase Auth)
        currentUser: null, // Se establece al hacer login
        
        // ⭐ DATOS OPERATIVOS - VACÍOS PARA EMPEZAR LIMPIO
        hotels: [],           // Sin hoteles hardcodeados
        tasks: [],            // Sin tareas de ejemplo
        employees: [],        // Sin empleados demo
        inventory: [],        // Sin productos ficticios
        orders: [],           // Sin pedidos falsos
        chemicals: [],        // Sin químicos demo
        shifts: [],           // Sin turnos hardcodeados
        winterTasks: [],      // Sin tareas de invierno demo
        pools: [],            // Sin piscinas falsas
        poolRecords: [],      // Sin registros demo
        poolIncidents: [],    // Sin incidencias falsas
        protocolCalculations: [] // Sin cálculos demo
    },
    
    // Observadores de cambios
    listeners: {},
    
    // ⭐ FUNCIÓN: Obtener hoteles según permisos del usuario
    getHotelOptions: function() {
        const currentUser = this.get('currentUser');
        const allHotels = this.get('hotels').filter(h => h.active);
        
        // Si no hay usuario actual, devolver array vacío
        if (!currentUser) {
            return [];
        }
        
        // Super admin ve todos los hoteles de todos los clientes
        if (currentUser.userLevel === 'super_admin') {
            return allHotels;
        }
        
        // Si tiene acceso a todos los hoteles del cliente
        if (currentUser.assignedHotels && currentUser.assignedHotels[0] === 'ALL') {
            return allHotels;
        }
        
        // Filtrar por hoteles específicos asignados
        if (currentUser.assignedHotels && currentUser.assignedHotels.length > 0) {
            return allHotels.filter(h => currentUser.assignedHotels.includes(h.code));
        }
        
        // Por defecto, no mostrar hoteles
        return [];
    },
    
    // ⭐ FUNCIÓN: Verificar permisos del usuario
    hasPermission: function(permission) {
        const currentUser = this.get('currentUser');
        
        if (!currentUser) return false;
        
        // Super admin puede todo
        if (currentUser.userLevel === 'super_admin') return true;
        
        // Verificar permisos específicos
        return currentUser.permissions && currentUser.permissions[permission] === true;
    },
    
    // ⭐ FUNCIÓN: Obtener información de licencia
    getLicenseInfo: function() {
        const license = this.get('clientLicense');
        const hotels = this.get('hotels').filter(h => h.active);
        
        if (!license) {
            return {
                clientName: 'Sin cliente',
                plan: 'none',
                status: 'inactive',
                hotelsUsed: 0,
                hotelsLimit: 0,
                usagePercent: 0,
                daysUntilExpiry: 0,
                nearLimit: false
            };
        }
        
        return {
            clientName: license.clientName,
            plan: license.plan,
            status: license.status,
            hotelsUsed: hotels.length,
            hotelsLimit: license.limits.maxHotels,
            usagePercent: Math.round((hotels.length / license.limits.maxHotels) * 100),
            daysUntilExpiry: Math.ceil((new Date(license.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)),
            nearLimit: hotels.length >= (license.limits.maxHotels * 0.8)
        };
    },
    
    // ⭐ INICIALIZACIÓN LIMPIA - SIN DATOS DEMO
    init: function() {
        console.log('🧹 Inicializando AppState LIMPIO (sin datos demo)...');
        
        // ⭐ NO CARGAR DATOS DEMO - Sistema empieza vacío
        // Los datos se cargarán desde Firebase o se crearán por el usuario
        
        console.log('✅ AppState inicializado limpio y listo para datos reales');
        console.log('📊 Sistema listo para crear datos desde cero');
        console.log('🏨 Hoteles: 0 (usar Admin para crear)');
        console.log('📋 Tareas: 0 (usar módulo Tareas para crear)');
        console.log('👥 Empleados: 0 (usar módulo Empleados para crear)');
        console.log('📦 Inventario: 0 (usar módulo Stock para crear)');
    },
    
    // ⭐ FUNCIÓN: Limpiar todos los datos (para testing)
    clearAllData: function() {
        console.log('🗑️ Limpiando todos los datos...');
        
        this.data.hotels = [];
        this.data.tasks = [];
        this.data.employees = [];
        this.data.inventory = [];
        this.data.orders = [];
        this.data.chemicals = [];
        this.data.shifts = [];
        this.data.winterTasks = [];
        this.data.pools = [];
        this.data.poolRecords = [];
        this.data.poolIncidents = [];
        this.data.protocolCalculations = [];
        
        // Guardar estado limpio
        this.saveToLocalStorage();
        
        console.log('✅ Todos los datos limpiados');
    },
    
    // ⭐ FUNCIÓN: Crear datos de ejemplo (opcional para testing)
    createSampleData: function() {
        console.log('🎭 Creando datos de ejemplo para testing...');
        
        // Solo crear si no existen datos
        if (this.data.hotels.length === 0) {
            this.data.hotels = [
                {
                    id: 1,
                    name: "Hotel Test",
                    code: "TEST_01",
                    location: "Ciudad Test",
                    address: "Calle Test 123",
                    phone: "+34 900 000 000",
                    email: "test@hotel.com",
                    active: true,
                    createdBy: "test@user.com",
                    createdAt: new Date(),
                    settings: {
                        timezone: "Europe/Madrid",
                        currency: "EUR",
                        language: "es"
                    }
                }
            ];
        }
        
        if (this.data.tasks.length === 0) {
            this.data.tasks = [
                {
                    id: 1,
                    title: "Tarea de Prueba",
                    description: "Esta es una tarea de ejemplo",
                    status: "active",
                    employee: "Usuario Test",
                    employeeId: 1,
                    hotel: "TEST_01",
                    hotelName: "Hotel Test",
                    area: "Mantenimiento",
                    escalated: false,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];
        }
        
        console.log('✅ Datos de ejemplo creados');
    },
    
    // Obtener datos
    get: function(key) {
        const keys = key.split('.');
        let value = this.data;
        for (const k of keys) {
            value = value ? value[k] : undefined;
        }
        return value;
    },
    
    // Actualizar datos
    update: function(key, value) {
        const keys = key.split('.');
        let target = this.data;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!target[keys[i]]) {
                target[keys[i]] = {};
            }
            target = target[keys[i]];
        }
        
        target[keys[keys.length - 1]] = value;
        
        // Notificar a los observadores
        this.notifyListeners(key, value);
        
        // Guardar en localStorage automáticamente
        this.saveToLocalStorage();
    },
    
    // Suscribirse a cambios
    subscribe: function(key, callback) {
        if (!this.listeners[key]) {
            this.listeners[key] = [];
        }
        this.listeners[key].push(callback);
    },
    
    // Notificar cambios
    notifyListeners: function(key, value) {
        if (this.listeners[key]) {
            this.listeners[key].forEach(callback => {
                try {
                    callback(value);
                } catch (error) {
                    console.warn(`Error en listener de ${key}:`, error);
                }
            });
        }
    },
    
    // ⭐ FUNCIÓN NOTIFYALL (Para evitar errores)
    notifyAll: function() {
        console.log('📢 Notificando a todos los listeners...');
        for (const [key, callbacks] of Object.entries(this.listeners)) {
            const value = this.get(key);
            callbacks.forEach(callback => {
                try {
                    callback(value);
                } catch (error) {
                    console.warn(`Error en listener de ${key}:`, error);
                }
            });
        }
    },
    
    // Guardar en localStorage
    saveToLocalStorage: function() {
        try {
            // ⭐ SOLO GUARDAR DATOS IMPORTANTES (sin datos sensibles)
            const dataToSave = {
                currentModule: this.data.currentModule,
                hotels: this.data.hotels,
                tasks: this.data.tasks,
                employees: this.data.employees,
                inventory: this.data.inventory,
                orders: this.data.orders,
                chemicals: this.data.chemicals,
                shifts: this.data.shifts,
                winterTasks: this.data.winterTasks,
                pools: this.data.pools,
                poolRecords: this.data.poolRecords,
                poolIncidents: this.data.poolIncidents,
                protocolCalculations: this.data.protocolCalculations
            };
            
            localStorage.setItem('prestotel_state', JSON.stringify(dataToSave));
        } catch (error) {
            console.error('❌ Error al guardar en localStorage:', error);
        }
    },
    
    // Cargar desde localStorage
    loadFromLocalStorage: function() {
        try {
            const saved = localStorage.getItem('prestotel_state');
            if (saved) {
                const parsedData = JSON.parse(saved);
                
                // ⭐ MERGEAR SOLO DATOS OPERATIVOS (no usuario ni licencia)
                Object.keys(parsedData).forEach(key => {
                    if (key !== 'currentUser' && key !== 'clientLicense' && key !== 'isAuthenticated') {
                        this.data[key] = parsedData[key];
                    }
                });
                
                console.log('✅ Datos operativos cargados desde localStorage');
                return true;
            }
        } catch (error) {
            console.error('❌ Error al cargar desde localStorage:', error);
        }
        return false;
    },
    
    // ⭐ FUNCIÓN: Limpiar localStorage
    clearLocalStorage: function() {
        try {
            localStorage.removeItem('prestotel_state');
            console.log('🗑️ localStorage limpiado');
        } catch (error) {
            console.error('❌ Error al limpiar localStorage:', error);
        }
    }
};

// ====================================================
// FUNCIONES GLOBALES DE UTILIDAD
// ====================================================

// Hacer disponible globalmente para debug
window.AppState = AppState;

// Función para limpiar todo (para testing)
window.clearAllData = function() {
    if (confirm('🗑️ ¿Seguro que quieres limpiar TODOS los datos?')) {
        AppState.clearAllData();
        AppState.clearLocalStorage();
        console.log('✅ Sistema completamente limpio');
        // Opcional: recargar página
        if (confirm('🔄 ¿Recargar página para ver cambios?')) {
            window.location.reload();
        }
    }
};

// Función para crear datos de ejemplo (para testing)
window.createSampleData = function() {
    AppState.createSampleData();
    console.log('✅ Datos de ejemplo creados');
    // Opcional: recargar dashboard
    if (typeof updateDashboardContentWithAlerts === 'function') {
        updateDashboardContentWithAlerts();
    }
};

console.log('🧹 AppState limpio cargado - Sistema listo para datos reales');