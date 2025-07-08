/**
 * Configuración global de la aplicación Prestotel
 * 
 * Este archivo contiene la configuración de Firebase, inicialización de servicios
 * y definición de las colecciones principales de Firestore.
 */

// Configuración de Firebase 
const firebaseConfig = {
  apiKey: "AIzaSyBR8e4G0tEpXnUwNpxzM3nvklsbRY1zFI0",
  authDomain: "tareas-invierno.firebaseapp.com",
  projectId: "tareas-invierno",
  storageBucket: "tareas-invierno.appspot.com",
  messagingSenderId: "253712224629",
  appId: "1:253712224629:web:f11abaa587d3816e5a433c",
  measurementId: "G-4Z1W4C05LP"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Permitir persistencia para usar offline
db.enablePersistence()
  .then(() => {
    console.log('🔥 Firebase persistencia habilitada con éxito');
  })
  .catch(err => {
    if (err.code === 'failed-precondition') {
      console.warn('⚠️ La persistencia de datos falló porque múltiples pestañas están abiertas');
    } else if (err.code === 'unimplemented') {
      console.warn('⚠️ El navegador actual no soporta persistencia de datos offline');
    } else {
      console.error('❌ Error al habilitar persistencia:', err);
    }
  });

// ====================================================
// COLECCIONES DE FIRESTORE PARA SISTEMA MULTI-CLIENTE
// ====================================================

// Colecciones principales del sistema
const systemCollections = {
  // Gestión de usuarios y autenticación
  users: db.collection('users'),                    // Perfiles de usuarios
  clients: db.collection('clients'),                // Información de clientes (empresas)
  
  // Datos operativos por cliente (se concatenará client_id)
  tasks: db.collection('tasks'),                    // Tareas de todos los clientes
  hotels: db.collection('hotels'),                  // Hoteles de todos los clientes
  employees: db.collection('employees'),            // Empleados por cliente
  inventory: db.collection('inventory'),            // Inventario por cliente/hotel
  orders: db.collection('orders'),                  // Pedidos por cliente
  chemicals: db.collection('chemicals'),            // Químicos por cliente
  shifts: db.collection('shifts'),                  // Turnos por cliente
  pools: db.collection('pools'),                    // Piscinas por cliente/hotel
  poolRecords: db.collection('poolRecords'),        // Registros de piscinas
  poolIncidents: db.collection('poolIncidents'),    // Incidencias de piscinas
  winterTasks: db.collection('winterTasks'),        // Tareas de invierno
  
  // Auditoría y logs
  activityLogs: db.collection('activityLogs'),      // Logs de actividad
  licenseLogs: db.collection('licenseLogs'),        // Logs de licencias
  
  // Configuración del sistema
  systemConfig: db.collection('systemConfig')       // Configuración global
};

// ====================================================
// FUNCIONES DE ACCESO A COLECCIONES
// ====================================================

// Función para obtener colección filtrada por cliente
function getClientCollection(collectionName, clientId) {
  if (!clientId) {
    console.error('❌ clientId requerido para acceder a colección:', collectionName);
    return null;
  }
  
  return systemCollections[collectionName].where('clientId', '==', clientId);
}

// Función para obtener colección filtrada por cliente y hotel
function getHotelCollection(collectionName, clientId, hotelCode) {
  if (!clientId || !hotelCode) {
    console.error('❌ clientId y hotelCode requeridos para:', collectionName);
    return null;
  }
  
  return systemCollections[collectionName]
    .where('clientId', '==', clientId)
    .where('hotel', '==', hotelCode);
}

// ====================================================
// VARIABLES GLOBALES DEL SISTEMA
// ====================================================

// Usuario actual autenticado
let currentUser = null;
let currentUserProfile = null;
let currentClientId = null;
let isAuthenticated = false;

// Estados de usuario
let isAdmin = false;
let isSuperAdmin = false;
let isClientAdmin = false;
let isHotelManager = false;

// ====================================================
// PRODUCTOS QUÍMICOS PREDEFINIDOS
// ====================================================

const chemicalProducts = [
  { id: 1, name: "SAL DESCALCIFICADOR PASTILLAS 25KG", unit: "kg", category: "maintenance" },
  { id: 2, name: "HIPOCLORITO PISCINAS", unit: "l", category: "chemical", essential: true },
  { id: 3, name: "DISMINUIDOR PH LIQUIDO AQUA PEDROSA 23KG", unit: "kg", category: "chemical", essential: true },
  { id: 4, name: "ACIDO CLORHIDICO 32% CONS.HUMANO 23KG", unit: "kg", category: "chemical", essential: true },
  { id: 5, name: "REACTIVO FOTOMETRO DPD-1 C/250UN", unit: "un", category: "testing" },
  { id: 6, name: "REACTIVO FOTOMETRO DPD-3 C/250UN", unit: "un", category: "testing" },
  { id: 7, name: "REACTIVO FOTOMETRO PH (PHENOL RED) C/250UN", unit: "un", category: "testing" },
  { id: 8, name: "LEJIA ALIMENTARIA 40GR/L 22KG", unit: "kg", category: "cleaning", essential: true },
  { id: 9, name: "ANTIINCRUSTANTE QUIMIFOS GFA 20L", unit: "l", category: "chemical" },
  { id: 10, name: "ESTABILIZANTE CTX-400", unit: "kg", category: "chemical" },
  { id: 11, name: "DESENGRASANTE CTX-75", unit: "l", category: "cleaning" },
  { id: 12, name: "CLORO GRANULADO CTX-300", unit: "kg", category: "chemical", essential: true },
  { id: 13, name: "BROMO TABLETAS CUBO 20KG", unit: "kg", category: "chemical" },
  { id: 14, name: "COAGULANTE GOLDENFLOK GFA 5KG", unit: "kg", category: "chemical" },
  { id: 15, name: "ALGIBLACK GFA 5KG", unit: "kg", category: "chemical" },
  { id: 16, name: "REACTIVO ISOCIANURICO", unit: "un", category: "testing" },
  { id: 17, name: "NEUTRALIZANTE CTX-12", unit: "kg", category: "chemical" }
];

// ====================================================
// CONFIGURACIÓN DE LA APLICACIÓN
// ====================================================

const appConfig = {
  appName: "Prestotel",
  appVersion: "2.0.0", // ⭐ Actualizada para sistema multi-cliente
  maxUploadSize: 5, // MB
  itemsPerPage: 10,
  dateFormat: "DD/MM/YYYY",
  timeFormat: "HH:mm",
  
  // Configuración de licencias
  defaultLimits: {
    basic: {
      maxHotels: 3,
      maxUsers: 10,
      maxStorageGB: 1,
      maxTasksPerMonth: 1000
    },
    professional: {
      maxHotels: 10,
      maxUsers: 50,
      maxStorageGB: 5,
      maxTasksPerMonth: 5000
    },
    enterprise: {
      maxHotels: 50,
      maxUsers: 200,
      maxStorageGB: 20,
      maxTasksPerMonth: 20000
    }
  },
  
  // Módulos disponibles por plan
  modulesByPlan: {
    basic: ["tasks", "inventory", "employees"],
    professional: ["tasks", "inventory", "employees", "shifts", "orders"],
    enterprise: ["tasks", "inventory", "employees", "shifts", "orders", "pools", "chemicals", "winter", "admin"]
  }
};

// ====================================================
// FUNCIONES DE UTILIDAD GLOBALES
// ====================================================

// Funciones para acceder a variables globales
window.getUser = () => currentUser;
window.getUserProfile = () => currentUserProfile;
window.getCurrentClientId = () => currentClientId;
window.isUserAuthenticated = () => isAuthenticated;
window.isUserAdmin = () => isAdmin;
window.isUserSuperAdmin = () => isSuperAdmin;
window.isUserClientAdmin = () => isClientAdmin;
window.isUserHotelManager = () => isHotelManager;

// Función para establecer usuario actual
window.setCurrentUser = (user, profile) => {
  currentUser = user;
  currentUserProfile = profile;
  currentClientId = profile ? profile.clientId : null;
  isAuthenticated = !!user;
  
  // Determinar roles
  if (profile) {
    isSuperAdmin = profile.userLevel === 'super_admin';
    isClientAdmin = profile.userLevel === 'client_admin';
    isHotelManager = profile.userLevel === 'hotel_manager';
    isAdmin = isSuperAdmin || isClientAdmin;
  } else {
    isSuperAdmin = false;
    isClientAdmin = false;
    isHotelManager = false;
    isAdmin = false;
  }
  
  console.log(`👤 Usuario establecido: ${user ? user.email : 'ninguno'} (${profile ? profile.userLevel : 'sin perfil'})`);
};

// Función para limpiar usuario actual
window.clearCurrentUser = () => {
  currentUser = null;
  currentUserProfile = null;
  currentClientId = null;
  isAuthenticated = false;
  isSuperAdmin = false;
  isClientAdmin = false;
  isHotelManager = false;
  isAdmin = false;
  
  console.log('🚪 Usuario limpiado');
};

// ====================================================
// FUNCIONES DE FIRESTORE HELPERS
// ====================================================

// Función para agregar timestamp automático
window.addTimestamp = (data, isUpdate = false) => {
  const timestamp = firebase.firestore.FieldValue.serverTimestamp();
  
  if (isUpdate) {
    return { ...data, updatedAt: timestamp };
  } else {
    return { ...data, createdAt: timestamp, updatedAt: timestamp };
  }
};

// Función para agregar metadatos de usuario
window.addUserMetadata = (data, isUpdate = false) => {
  const user = window.getUser();
  const profile = window.getUserProfile();
  
  if (!user || !profile) {
    console.warn('⚠️ No hay usuario para agregar metadatos');
    return data;
  }
  
  const metadata = {
    clientId: profile.clientId,
    [isUpdate ? 'updatedBy' : 'createdBy']: user.uid,
    [isUpdate ? 'updatedByEmail' : 'createdByEmail']: user.email
  };
  
  return { ...data, ...metadata };
};

// Función para crear documento con metadatos completos
window.createDocumentWithMetadata = (data) => {
  return window.addUserMetadata(window.addTimestamp(data, false), false);
};

// Función para actualizar documento con metadatos
window.updateDocumentWithMetadata = (data) => {
  return window.addUserMetadata(window.addTimestamp(data, true), true);
};

// ====================================================
// EXPORTAR REFERENCIAS GLOBALES
// ====================================================

// Hacer disponibles las referencias de Firebase globalmente
window.db = db;
window.auth = auth;
window.systemCollections = systemCollections;
window.getClientCollection = getClientCollection;
window.getHotelCollection = getHotelCollection;
window.chemicalProducts = chemicalProducts;
window.appConfig = appConfig;

console.log('🔥 Firebase configurado correctamente para sistema multi-cliente');
console.log(`📱 Aplicación: ${appConfig.appName} v${appConfig.appVersion}`);