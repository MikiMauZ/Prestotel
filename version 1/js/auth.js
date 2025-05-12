/**
 * Módulo de autenticación para la aplicación Prestotel
 * 
 * Gestiona el inicio de sesión, cierre de sesión, y el estado de la autenticación
 */

// Elementos DOM de autenticación
const loginScreen = document.getElementById('loginScreen');
const appScreen = document.getElementById('appScreen');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const logoutBtnSidebar = document.getElementById('logoutBtnSidebar');

/**
 * Inicializa el módulo de autenticación
 */
function initAuth() {
  // Configurar eventos de los botones
  if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  if (logoutBtnSidebar) {
    logoutBtnSidebar.addEventListener('click', handleLogout);
  }
  
  // Permitir iniciar sesión con Enter
  if (passwordInput) {
    passwordInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        handleLogin();
      }
    });
  }
  
  // Escuchar cambios de sesión
  auth.onAuthStateChanged(handleAuthStateChange);
}

/**
 * Maneja el inicio de sesión
 */
function handleLogin() {
  // Ocultar mensaje de error previo
  hideLoginError();
  
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // Validar campos
  if (!email) {
    showLoginError('Por favor introduce tu correo electrónico');
    emailInput.focus();
    return;
  }
  
  if (!password) {
    showLoginError('Por favor introduce tu contraseña');
    passwordInput.focus();
    return;
  }

  // Deshabilitar botón para evitar múltiples clicks
  loginBtn.disabled = true;
  loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';

  // Intentar iniciar sesión con Firebase
  auth.signInWithEmailAndPassword(email, password)
    .catch(error => {
      console.error('Error de autenticación:', error);
      let errorMessage = 'Error al iniciar sesión';
      
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Credenciales incorrectas';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Formato de email inválido';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos. Intenta más tarde';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta cuenta ha sido deshabilitada';
          break;
      }
      
      showLoginError(errorMessage);
      
      // Resetear estado del botón
      loginBtn.disabled = false;
      loginBtn.innerHTML = 'Iniciar Sesión';
    });
}

/**
 * Maneja el cierre de sesión
 */
function handleLogout() {
  // Confirmar antes de cerrar sesión
  confirmAction('¿Estás seguro de que deseas cerrar sesión?', () => {
    auth.signOut().catch(error => {
      console.error('Error al cerrar sesión:', error);
      showNotification('Error al cerrar sesión', 'error');
    });
  }, 'Cerrar sesión');
}

/**
 * Maneja los cambios en el estado de autenticación
 * @param {Object} user - Usuario autenticado
 */
function handleAuthStateChange(user) {
  if (user) {
    // Usuario autenticado
    currentUser = user;
    sessionStorage.setItem('logged_in', 'true');
    
    // Verificar si es administrador
    usersCollection.doc(user.uid).get()
      .then(doc => {
        if (doc.exists && doc.data().role === 'admin') {
          isAdmin = true;
          document.body.classList.add('is-admin');
        } else {
          isAdmin = false;
          document.body.classList.remove('is-admin');
        }

        // Mostrar la aplicación
        showApp();

        // Registrar actividad
        logActivity('login', 'Inicio de sesión');
        
        // Inicializar módulos
        initApp();
      })
      .catch(error => {
        console.error('Error al verificar rol:', error);
        isAdmin = false;
        document.body.classList.remove('is-admin');
        
        // Mostrar la aplicación de todos modos
        showApp();
        initApp();
      });
  } else {
    // No hay usuario autenticado
    currentUser = null;
    isAdmin = false;
    document.body.classList.remove('is-admin');
    
    // Mostrar pantalla de login
    showLogin();
    
    // Limpiar sesión
    sessionStorage.removeItem('logged_in');
  }
}

/**
 * Muestra la pantalla de login
 */
function showLogin() {
  if (loginScreen) {
    loginScreen.classList.remove('hidden');
  }
  
  if (appScreen) {
    appScreen.classList.add('hidden');
  }
  
  // Resetear campos y estado
  if (emailInput) emailInput.value = '';
  if (passwordInput) passwordInput.value = '';
  if (loginBtn) {
    loginBtn.disabled = false;
    loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
  }
  
  hideLoginError();
  
  // Enfocar el email si está vacío, o la contraseña si ya hay email
  if (emailInput) {
    if (!emailInput.value) {
      emailInput.focus();
    } else {
      passwordInput.focus();
    }
  }
}

/**
 * Muestra la aplicación
 */
function showApp() {
  if (loginScreen) {
    loginScreen.classList.add('hidden');
  }
  
  if (appScreen) {
    appScreen.classList.remove('hidden');
    document.body.classList.add('app-active');
  }
}

/**
 * Muestra un mensaje de error en el login
 * @param {string} message - Mensaje de error
 */
function showLoginError(message) {
  if (!loginError) return;
  
  loginError.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
  loginError.style.display = 'flex';
}

/**
 * Oculta el mensaje de error del login
 */
function hideLoginError() {
  if (loginError) {
    loginError.style.display = 'none';
  }
}

// Iniciar módulo de autenticación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initAuth);