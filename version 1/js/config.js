/**
 * Configuración global de la aplicación Prestotel
 * 
 * Este archivo contiene la configuración de Firebase, inicialización de servicios
 * y definición de las colecciones principales de Firestore.
 */

// Configuración de Firebase (reemplazar con tus propias credenciales en producción)
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
    console.log('Persistencia habilitada con éxito');
  })
  .catch(err => {
    if (err.code === 'failed-precondition') {
      console.warn('La persistencia de datos falló porque múltiples pestañas están abiertas');
    } else if (err.code === 'unimplemented') {
      console.warn('El navegador actual no soporta persistencia de datos offline');
    } else {
      console.error('Error al habilitar persistencia:', err);
    }
  });

// Colecciones de Firestore
const tasksCollection = db.collection('tasks');
const stockCollection = db.collection('stock');
const ordersCollection = db.collection('orders');
const usersCollection = db.collection('users');
const chemicalsCollection = db.collection('chemicals');
const shiftsCollection = db.collection('shifts');
const employeesCollection = db.collection('employees');
const activityCollection = db.collection('activity');

// Variables globales
let currentUser = null;
let isAdmin = false;

// Lista predefinida de productos químicos para el módulo de pedidos químicos
const chemicalProducts = [
  { id: 1, name: "SAL DESCALSFICADOR PASTILLAS 25KG", unit: "kg" },
  { id: 2, name: "HIPOCLORITO PISCINAS", unit: "l" },
  { id: 3, name: "DISMINUIDOR PH LIQUIDO AQUA PEDROSA 23KG", unit: "kg" },
  { id: 4, name: "ACIDO CLORHIDICO 32% CONS.HUMANO 23KG", unit: "kg" },
  { id: 5, name: "REACTIVO FOTOMETRO DPD-1 C/250UN", unit: "un" },
  { id: 6, name: "REACTIVO FOTOMETRO DPD-3 C/250UN", unit: "un" },
  { id: 7, name: "REACTIVO FOTOMETRO PH (PHENOL RED) C/250UN", unit: "un" },
  { id: 8, name: "LEJIA ALIMENTARIA 40GR/L 22KG", unit: "kg" },
  { id: 9, name: "ANTIINCRUSTANTE QUIMIFOS GFA 20L", unit: "l" },
  { id: 10, name: "ESTABILIZANTE CTX-400", unit: "kg" },
  { id: 11, name: "DESENGRASANTE CTX-75", unit: "l" },
  { id: 12, name: "CLORO GRANULADO CTX-300", unit: "kg" },
  { id: 13, name: "BROMO TABLETAS CUBO 20KG", unit: "kg" },
  { id: 14, name: "COAGULANTE GOLDENFLOK GFA 5KG", unit: "kg" },
  { id: 15, name: "ALGIBLACK GFA 5KG", unit: "kg" },
  { id: 16, name: "REACTIVO ISOCIANURICO", unit: "un" },
  { id: 17, name: "NEUTRALIZANTE CTX-12", unit: "kg" }
];

// Configuración de la aplicación
const appConfig = {
  appName: "Prestotel",
  appVersion: "1.2.0",
  maxUploadSize: 5, // MB
  itemsPerPage: 10,
  dateFormat: "DD/MM/YYYY",
  timeFormat: "HH:mm",
};

// Funciones de utilidad para acceder a variables globales
window.getUser = () => currentUser;
window.isUserAdmin = () => isAdmin;