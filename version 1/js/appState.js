// Gestión de estado centralizada de la aplicación
const AppState = {
    // Datos de la aplicación
    data: {
      currentModule: 'dashboard-view',
      user: null,
      userRole: 'admin', // Valor por defecto para desarrollo
      tasks: [],
      employees: [],
      inventory: [],
      orders: [],
      chemicals: [],
      shifts: []
    },

    data: {
        currentModule: 'dashboard-view',
        user: null,
        userRole: 'admin', // Valor por defecto para desarrollo
        tasks: [],
        employees: [],
        inventory: [],
        orders: [],
        chemicals: [],
        shifts: [],
        winterTasks: [] // Añadido para el módulo de invierno
      },
    
    // Observadores de cambios
    listeners: {},
    
    // Inicializar con datos mock para desarrollo
    init: function() {
      // Datos de ejemplo para tareas
      this.data.tasks = [
        { 
          id: 1, 
          title: "Revisión caldera", 
          description: "Revisar presión y temperaturas",
          status: "active", 
          employee: "Juan Pérez", 
          employeeId: 1,
          hotel: "Wave",
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
          hotel: "Sky",
          area: "Piscina",
          escalated: false,
          createdAt: new Date(Date.now() - 172800000), // Hace 2 días
          updatedAt: new Date(Date.now() - 43200000) // Hace 12 horas
        },
        { 
          id: 3, 
          title: "Pintar fachada interior", 
          description: "Pintar pared zona recepción",
          status: "done", 
          employee: "Mario Ruiz", 
          employeeId: 3,
          hotel: "Palm",
          area: "Recepción",
          escalated: false,
          createdAt: new Date(Date.now() - 259200000), // Hace 3 días
          updatedAt: new Date(Date.now() - 21600000) // Hace 6 horas
        },
        { 
          id: 4, 
          title: "Desinfección cocina", 
          description: "Limpieza profunda de campanas",
          status: "active", 
          employee: null, 
          employeeId: null,
          hotel: "Wave",
          area: "Cocina",
          escalated: true,
          createdAt: new Date(Date.now() - 43200000), // Hace 12 horas
          updatedAt: new Date()
        }
      ];
      
      // Datos de ejemplo para empleados
      this.data.employees = [
        {
          id: 1,
          name: "Juan Pérez",
          position: "Técnico de Mantenimiento",
          department: "mantenimiento",
          hotel: "Wave",
          phone: "678123456",
          email: "juan@example.com",
          status: "active"
        },
        {
          id: 2,
          name: "Lucía Gómez",
          position: "Limpieza Piscinas",
          department: "limpieza",
          hotel: "Sky",
          phone: "678234567",
          email: "lucia@example.com",
          status: "active"
        },
        {
          id: 3,
          name: "Mario Ruiz",
          position: "Pintor",
          department: "mantenimiento",
          hotel: "Palm",
          phone: "678345678",
          email: "mario@example.com",
          status: "active"
        },
        {
          id: 4,
          name: "Ana Martínez",
          position: "Recepcionista",
          department: "recepcion",
          hotel: "Wave",
          phone: "678456789",
          email: "ana@example.com",
          status: "active"
        }
      ];
      
      // Actualizar datos en localStorage para persistencia
      this.saveToLocalStorage();
      
      // Notificar a los componentes
      this.notifyAll();
      
      console.log('AppState initialized with mock data');
    },
    
    // Cargar datos desde localStorage
    loadFromLocalStorage: function() {
      try {
        const savedData = localStorage.getItem('prestotelAppState');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          
          // Convertir fechas de string a Date
          if (parsedData.tasks) {
            parsedData.tasks.forEach(task => {
              task.createdAt = new Date(task.createdAt);
              task.updatedAt = new Date(task.updatedAt);
            });
          }
          
          this.data = { ...this.data, ...parsedData };
          console.log('AppState loaded from localStorage');
        }
      } catch (error) {
        console.error('Error loading AppState from localStorage:', error);
      }
    },
    
    // Guardar datos en localStorage
    saveToLocalStorage: function() {
      try {
        localStorage.setItem('prestotelAppState', JSON.stringify(this.data));
      } catch (error) {
        console.error('Error saving AppState to localStorage:', error);
      }
    },
    
    // Obtener datos
    get: function(key) {
      return this.data[key];
    },
    
    // Actualizar datos y notificar a los observadores
    update: function(key, value) {
      this.data[key] = value;
      
      // Guardar en localStorage
      this.saveToLocalStorage();
      
      // Notificar a los observadores
      if (this.listeners[key]) {
        this.listeners[key].forEach(callback => callback(value));
      }
    },
    
    // Actualizar un elemento específico en un array (ej: una tarea específica)
    updateItem: function(arrayKey, itemId, updates) {
      if (!this.data[arrayKey]) return false;
      
      const index = this.data[arrayKey].findIndex(item => item.id == itemId);
      if (index === -1) return false;
      
      // Actualizar el elemento
      this.data[arrayKey][index] = {
        ...this.data[arrayKey][index],
        ...updates,
        updatedAt: new Date()
      };
      
      // Guardar en localStorage
      this.saveToLocalStorage();
      
      // Notificar a los observadores
      if (this.listeners[arrayKey]) {
        this.listeners[arrayKey].forEach(callback => callback(this.data[arrayKey]));
      }
      
      return true;
    },
    
    // Añadir un nuevo elemento a un array
    addItem: function(arrayKey, item) {
      if (!this.data[arrayKey]) this.data[arrayKey] = [];
      
      // Generar ID si no tiene
      if (!item.id) {
        const maxId = this.data[arrayKey].reduce((max, item) => Math.max(max, item.id || 0), 0);
        item.id = maxId + 1;
      }
      
      // Añadir fechas
      item.createdAt = new Date();
      item.updatedAt = new Date();
      
      // Añadir el elemento
      this.data[arrayKey].push(item);
      
      // Guardar en localStorage
      this.saveToLocalStorage();
      
      // Notificar a los observadores
      if (this.listeners[arrayKey]) {
        this.listeners[arrayKey].forEach(callback => callback(this.data[arrayKey]));
      }
      
      return item;
    },
    
    // Eliminar un elemento de un array
    removeItem: function(arrayKey, itemId) {
      if (!this.data[arrayKey]) return false;
      
      const index = this.data[arrayKey].findIndex(item => item.id == itemId);
      if (index === -1) return false;
      
      // Eliminar el elemento
      this.data[arrayKey].splice(index, 1);
      
      // Guardar en localStorage
      this.saveToLocalStorage();
      
      // Notificar a los observadores
      if (this.listeners[arrayKey]) {
        this.listeners[arrayKey].forEach(callback => callback(this.data[arrayKey]));
      }
      
      return true;
    },
    
    // Suscribirse a cambios
    subscribe: function(key, callback) {
      if (!this.listeners[key]) {
        this.listeners[key] = [];
      }
      
      this.listeners[key].push(callback);
      
      // Devolver función para cancelar suscripción
      return () => {
        this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
      };
    },
    
    // Notificar a todos los observadores (útil al inicializar)
    notifyAll: function() {
      Object.keys(this.data).forEach(key => {
        if (this.listeners[key]) {
          this.listeners[key].forEach(callback => callback(this.data[key]));
        }
      });
    }
  };
  
  // Exportar el módulo
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppState;
  }