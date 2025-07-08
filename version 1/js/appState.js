// ====================================================
// MODIFICACIONES PARA js/appState.js
// ====================================================

// Gestión de estado centralizada de la aplicación
const AppState = {
    // Datos de la aplicación
    data: {
        currentModule: 'dashboard-view',
        user: null,
        userRole: 'admin', // Valor por defecto para desarrollo
        
        // ⭐ NUEVO: Información de licencias del cliente
        clientLicense: {
            clientId: "MELIA_2025",
            clientName: "Meliá Hotels International",
            plan: "enterprise", // basic, professional, enterprise, custom
            status: "active", // active, suspended, expired
            
            // LÍMITES ESPECÍFICOS (Controlados por ti como Super Admin)
            limits: {
                maxHotels: 25,        // ⭐ CONTROL CLAVE: máximo hoteles
                maxUsers: 100,        // máximo usuarios del cliente
                maxTasksPerMonth: 10000,
                maxStorageGB: 10,
                maxPoolsPerHotel: 15,
                maxEmployeesPerHotel: 100
            },
            
            // MÓDULOS HABILITADOS (Controlados por ti)
            enabledModules: [
                "tasks", "inventory", "pools", "chemicals", 
                "employees", "shifts", "winter", "admin"
            ],
            
            // FECHAS IMPORTANTES
            startDate: "2025-01-01",
            expiryDate: "2025-12-31",
            lastPayment: "2025-06-01",
            nextBilling: "2025-07-01"
        },
        
        // ⭐ NUEVO: Usuario actual con permisos y contexto
        currentUser: {
            id: 1,
            email: "admin@melia.com",
            name: "Administrador Meliá",
            userLevel: "client_admin", // super_admin, client_admin, hotel_manager, department_head, employee
            
            // HOTELES A LOS QUE TIENE ACCESO
            assignedHotels: ["ALL"], // ["ALL"] = todos los hoteles, o ["MELIA_PALMA", "MELIA_COSTA"] = específicos
            
            // CONTEXTO ACTUAL (para selector de hotel)
            currentHotelContext: "ALL", // Hotel actualmente seleccionado en el dropdown
            
            // PERMISOS GENERALES
            permissions: {
                canCreateHotels: true,
                canManageUsers: true,
                canViewReports: true,
                canAccessAdmin: true
            },
            
            createdAt: new Date(),
            lastLogin: new Date()
        },
        
        // ⭐ MEJORADO: Hoteles con estructura completa
        hotels: [
            {
                id: 1,
                name: "Meliá Palma Bay",
                code: "MELIA_PALMA", // Código único para referencias
                location: "Mallorca, España",
                address: "Paseo Marítimo 11, 07014 Palma",
                phone: "+34 971 268 500",
                email: "palmabay@melia.com",
                active: true,
                createdBy: "admin@melia.com",
                createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // Hace 6 meses
                
                // Configuración específica del hotel
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
                createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // Hace 4 meses
                
                settings: {
                    timezone: "Europe/Madrid",
                    currency: "EUR", 
                    language: "es"
                }
            },
            {
                id: 3,
                name: "Meliá Barcelona City",
                code: "MELIA_BCN",
                location: "Barcelona, España",
                address: "Avinguda de Sarrià 50, 08017 Barcelona", 
                phone: "+34 934 106 060",
                email: "barcelona@melia.com",
                active: true,
                createdBy: "admin@melia.com",
                createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Hace 3 meses
                
                settings: {
                    timezone: "Europe/Madrid",
                    currency: "EUR",
                    language: "es"
                }
            }
        ],
        
        // Datos operativos existentes (mantenemos como están)
        tasks: [],
        poolIncidents: [], // Histórico de incidencias
        protocolCalculations: [], // Cálculos realizados
        employees: [],
        inventory: [],
        orders: [],
        chemicals: [],
        shifts: [],
        winterTasks: [], // Añadido para el módulo de invierno
        pools: [], // Añadido para el módulo de piscinas
        poolRecords: [] // Añadido para los registros de piscinas
    },
    
    // Observadores de cambios
    listeners: {},
    
    // ⭐ NUEVA FUNCIÓN: Obtener hoteles según permisos del usuario
    getHotelOptions: function() {
        const currentUser = this.get('currentUser');
        const allHotels = this.get('hotels').filter(h => h.active);
        
        // Si no hay usuario actual, devolver todos (fallback)
        if (!currentUser) {
            return allHotels;
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
    
    // ⭐ NUEVA FUNCIÓN: Verificar permisos del usuario
    hasPermission: function(permission) {
        const currentUser = this.get('currentUser');
        
        if (!currentUser) return false;
        
        // Super admin puede todo
        if (currentUser.userLevel === 'super_admin') return true;
        
        // Verificar permisos específicos
        return currentUser.permissions && currentUser.permissions[permission] === true;
    },
    
    // ⭐ NUEVA FUNCIÓN: Obtener información de licencia
    getLicenseInfo: function() {
        const license = this.get('clientLicense');
        const hotels = this.get('hotels').filter(h => h.active);
        
        return {
            clientName: license.clientName,
            plan: license.plan,
            status: license.status,
            hotelsUsed: hotels.length,
            hotelsLimit: license.limits.maxHotels,
            usagePercent: Math.round((hotels.length / license.limits.maxHotels) * 100),
            daysUntilExpiry: Math.ceil((new Date(license.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)),
            nearLimit: hotels.length >= (license.limits.maxHotels * 0.8) // Cerca del límite (80%)
        };
    },
    
    // Inicializar con datos mock para desarrollo
    init: function() {
        console.log('🔄 Inicializando AppState con datos mock...');
        
        // Solo cargar datos mock si no existen ya
        if (this.data.tasks.length === 0) {
            // Datos de ejemplo para tareas (actualizar con hoteles específicos)
            this.data.tasks = [
                { 
                    id: 1, 
                    title: "Revisión caldera", 
                    description: "Revisar presión y temperaturas",
                    status: "active", 
                    employee: "Juan Pérez", 
                    employeeId: 1,
                    hotel: "MELIA_PALMA", // ⭐ Actualizado con código de hotel
                    hotelName: "Meliá Palma Bay",
                    area: "Mantenimiento",
                    escalated: false,
                    createdAt: new Date(Date.now() - 86400000), // Ayer
                    updatedAt: new Date()
                },
                { 
                    id: 2, 
                    title: "Cambiar filtros piscina", 
                    description: "Reemplazar filtros de arena",
                    status: "paused", 
                    employee: "Lucía Gómez", 
                    employeeId: 2,
                    hotel: "MELIA_COSTA", // ⭐ Actualizado
                    hotelName: "Meliá Costa del Sol",
                    area: "Piscina",
                    escalated: false,
                    createdAt: new Date(Date.now() - 172800000), // Hace 2 días
                    updatedAt: new Date(Date.now() - 43200000) // Hace 12 horas
                },
                { 
                    id: 3, 
                    title: "Pintar fachada interior", 
                    description: "Repintar paredes del lobby principal",
                    status: "done", 
                    employee: "Carlos Mendoza", 
                    employeeId: 3,
                    hotel: "MELIA_BCN", // ⭐ Actualizado
                    hotelName: "Meliá Barcelona City",
                    area: "Mantenimiento",
                    escalated: false,
                    createdAt: new Date(Date.now() - 259200000), // Hace 3 días
                    updatedAt: new Date(Date.now() - 86400000) // Ayer
                }
            ];
        }
        
        if (this.data.employees.length === 0) {
            // Datos de empleados con hoteles específicos
            this.data.employees = [
                {
                    id: 1,
                    name: "Juan Pérez",
                    position: "Técnico de Mantenimiento",
                    department: "mantenimiento",
                    hotel: "MELIA_PALMA", // ⭐ Actualizado
                    hotelName: "Meliá Palma Bay",
                    phone: "666111222",
                    email: "juan.perez@melia.com",
                    status: "active",
                    hireDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
                    permissions: ["tasks", "inventory"]
                },
                {
                    id: 2,
                    name: "Lucía Gómez",
                    position: "Especialista en Piscinas",
                    department: "piscinas",
                    hotel: "MELIA_COSTA", // ⭐ Actualizado
                    hotelName: "Meliá Costa del Sol",
                    phone: "666333444",
                    email: "lucia.gomez@melia.com", 
                    status: "active",
                    hireDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
                    permissions: ["pools", "chemicals"]
                },
                {
                    id: 3,
                    name: "Carlos Mendoza",
                    position: "Supervisor de Mantenimiento",
                    department: "mantenimiento", 
                    hotel: "MELIA_BCN", // ⭐ Actualizado
                    hotelName: "Meliá Barcelona City",
                    phone: "666555666",
                    email: "carlos.mendoza@melia.com",
                    status: "active",
                    hireDate: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000),
                    permissions: ["tasks", "inventory", "employees"]
                }
            ];
        }
        
        if (this.data.inventory.length === 0) {
            // Datos de inventario con hoteles específicos
            this.data.inventory = [
                {
                    id: 1,
                    name: "Cloro líquido",
                    category: "chemical",
                    currentQuantity: 50,
                    minQuantity: 20,
                    maxQuantity: 100,
                    unit: "L",
                    hotel: "MELIA_PALMA", // ⭐ Actualizado
                    hotelName: "Meliá Palma Bay",
                    location: "Almacén Químicos",
                    status: "good",
                    essential: true,
                    lastUpdated: new Date()
                },
                {
                    id: 2,
                    name: "Filtros de arena",
                    category: "maintenance",
                    currentQuantity: 5,
                    minQuantity: 10,
                    maxQuantity: 25,
                    unit: "unidades",
                    hotel: "MELIA_COSTA", // ⭐ Actualizado
                    hotelName: "Meliá Costa del Sol",
                    location: "Almacén Piscina",
                    status: "low",
                    essential: true,
                    lastUpdated: new Date()
                },
                {
                    id: 3,
                    name: "Productos de limpieza",
                    category: "cleaning",
                    currentQuantity: 0, // ⭐ Stock agotado para probar alertas
                    minQuantity: 15,
                    maxQuantity: 40,
                    unit: "unidades",
                    hotel: "MELIA_BCN", // ⭐ Actualizado
                    hotelName: "Meliá Barcelona City",
                    location: "Almacén Limpieza",
                    status: "low",
                    essential: true,
                    lastUpdated: new Date()
                }
            ];
        }
        
        console.log('✅ AppState inicializado con estructura multi-cliente');
        console.log(`📊 Cliente: ${this.data.clientLicense.clientName}`);
        console.log(`🏨 Hoteles: ${this.data.hotels.length}/${this.data.clientLicense.limits.maxHotels}`);
        console.log(`👤 Usuario: ${this.data.currentUser.name} (${this.data.currentUser.userLevel})`);
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
            this.listeners[key].forEach(callback => callback(value));
        }
    },
    
    // Guardar en localStorage
    saveToLocalStorage: function() {
        try {
            localStorage.setItem('prestotel_state', JSON.stringify(this.data));
        } catch (error) {
            console.error('Error al guardar en localStorage:', error);
        }
    },
    
    // Cargar desde localStorage
    loadFromLocalStorage: function() {
        try {
            const saved = localStorage.getItem('prestotel_state');
            if (saved) {
                const parsedData = JSON.parse(saved);
                
                // Mergear datos guardados con estructura nueva
                this.data = { ...this.data, ...parsedData };
                
                // Asegurar que la estructura nueva existe
                if (!this.data.clientLicense) {
                    this.data.clientLicense = {
                        clientId: "MELIA_2025",
                        clientName: "Meliá Hotels International",
                        plan: "enterprise",
                        status: "active",
                        limits: { maxHotels: 25, maxUsers: 100 },
                        enabledModules: ["tasks", "inventory", "pools", "chemicals", "employees", "shifts", "winter", "admin"]
                    };
                }
                
                if (!this.data.currentUser) {
                    this.data.currentUser = {
                        id: 1,
                        email: "admin@melia.com",
                        name: "Administrador Meliá",
                        userLevel: "client_admin",
                        assignedHotels: ["ALL"],
                        currentHotelContext: "ALL",
                        permissions: {
                            canCreateHotels: true,
                            canManageUsers: true,
                            canViewReports: true,
                            canAccessAdmin: true
                        }
                    };
                }
                
                console.log('✅ Estado cargado desde localStorage');
                return true;
            }
        } catch (error) {
            console.error('Error al cargar desde localStorage:', error);
        }
        return false;
    }
};

// Agregar al final de appState.js
AppState.notifyAll = function() {
  // Notificar a todos los listeners
  for (const [key, callbacks] of Object.entries(this.listeners)) {
    const value = this.state[key];
    callbacks.forEach(callback => {
      try {
        callback(value);
      } catch (error) {
        console.warn(`Error en listener de ${key}:`, error);
      }
    });
  }
};