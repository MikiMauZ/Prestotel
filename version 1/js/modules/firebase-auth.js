// ====================================================
// MÓDULO DE AUTENTICACIÓN FIREBASE PARA PRESTOTEL
// ====================================================

const FirebaseAuthModule = {
  
  // Estado del módulo
  isInitialized: false,
  authStateListener: null,
  
  // ====================================================
  // INICIALIZACIÓN
  // ====================================================
  
  async init() {
    if (this.isInitialized) {
      console.log('🔥 Firebase Auth ya inicializado');
      return;
    }
    
    console.log('🔐 Inicializando Firebase Authentication...');
    
    try {
      // Verificar que Firebase esté disponible
      if (typeof firebase === 'undefined') {
        throw new Error('Firebase no está disponible');
      }
      
      // Configurar listener de cambios de autenticación
      this.authStateListener = auth.onAuthStateChanged(
        this.handleAuthStateChange.bind(this),
        this.handleAuthError.bind(this)
      );
      
      this.isInitialized = true;
      console.log('✅ Firebase Auth inicializado correctamente');
      
    } catch (error) {
      console.error('❌ Error al inicializar Firebase Auth:', error);
      this.showError('Error al inicializar el sistema de autenticación');
    }
  },
  
  // ====================================================
  // GESTIÓN DE ESTADOS DE AUTENTICACIÓN
  // ====================================================
  
  async handleAuthStateChange(firebaseUser) {
    console.log('🔄 Cambio de estado de autenticación...');
    
    if (firebaseUser) {
      console.log(`✅ Usuario autenticado: ${firebaseUser.email}`);
      await this.handleUserSignIn(firebaseUser);
    } else {
      console.log('❌ Usuario no autenticado');
      this.handleUserSignOut();
    }
  },
  
  async handleUserSignIn(firebaseUser) {
    try {
      // Obtener perfil del usuario desde Firestore
      const userProfile = await this.getUserProfile(firebaseUser.uid);
      
      if (!userProfile) {
        console.error('❌ Perfil de usuario no encontrado');
        this.showError('Tu cuenta no está autorizada. Contacta con el administrador.');
        await this.signOut();
        return;
      }
      
      if (!userProfile.active) {
        console.error('❌ Usuario desactivado');
        this.showError('Tu cuenta está desactivada. Contacta con el administrador.');
        await this.signOut();
        return;
      }
      
      // Establecer usuario en el sistema global
      window.setCurrentUser(firebaseUser, userProfile);
      
      // Actualizar último login
      await this.updateLastLogin(firebaseUser.uid);
      
      // Cargar datos del cliente si corresponde
      await this.loadClientData(userProfile.clientId);
      
      // Configurar AppState con el usuario
      this.updateAppState(firebaseUser, userProfile);
      
      // Inicializar aplicación
      this.initializeMainApp();
      
      console.log(`🎉 Login completado para: ${userProfile.name} (${userProfile.userLevel})`);
      
    } catch (error) {
      console.error('❌ Error en handleUserSignIn:', error);
      this.showError('Error al cargar tu perfil. Inténtalo de nuevo.');
    }
  },
  
  handleUserSignOut() {
    // Limpiar estado global
    window.clearCurrentUser();
    
    // Limpiar AppState
    AppState.update('currentUser', null);
    AppState.update('isAuthenticated', false);
    AppState.update('clientLicense', null);
    
    // Mostrar pantalla de login
    this.showLoginScreen();
    
    console.log('🚪 Usuario desconectado');
  },
  
  handleAuthError(error) {
    console.error('❌ Error de autenticación:', error);
    this.showError('Error en el sistema de autenticación');
  },
  
  // ====================================================
  // OPERACIONES DE AUTENTICACIÓN
  // ====================================================
  
  async signIn(email, password) {
    try {
      console.log(`🔐 Intentando login para: ${email}`);
      
      const result = await auth.signInWithEmailAndPassword(email, password);
      console.log('✅ Autenticación Firebase exitosa');
      
      return { success: true, user: result.user };
      
    } catch (error) {
      console.error('❌ Error de login:', error);
      return { 
        success: false, 
        error: this.getErrorMessage(error.code),
        code: error.code
      };
    }
  },
  
  async signOut() {
    try {
      console.log('🚪 Cerrando sesión...');
      
      // Firebase se encargará de disparar onAuthStateChanged
      await auth.signOut();
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
      return { 
        success: false, 
        error: 'Error al cerrar sesión' 
      };
    }
  },
  
  async resetPassword(email) {
    try {
      console.log(`📧 Enviando reset de contraseña a: ${email}`);
      
      await auth.sendPasswordResetEmail(email);
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error reset password:', error);
      return { 
        success: false, 
        error: this.getErrorMessage(error.code) 
      };
    }
  },
  
  // ====================================================
  // GESTIÓN DE DATOS
  // ====================================================
  
  async getUserProfile(uid) {
    try {
      console.log(`📄 Obteniendo perfil de usuario: ${uid}`);
      
      const doc = await systemCollections.users.doc(uid).get();
      
      if (doc.exists) {
        const profile = doc.data();
        console.log(`✅ Perfil encontrado: ${profile.name} (${profile.userLevel})`);
        return profile;
      } else {
        console.warn('⚠️ Perfil de usuario no encontrado');
        return null;
      }
      
    } catch (error) {
      console.error('❌ Error al obtener perfil:', error);
      return null;
    }
  },
  
  async updateLastLogin(uid) {
    try {
      await systemCollections.users.doc(uid).update({
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Último login actualizado');
      
    } catch (error) {
      console.warn('⚠️ Error al actualizar último login:', error);
    }
  },
  
  async loadClientData(clientId) {
    if (!clientId) {
      console.log('👑 Super admin - no cargar datos de cliente específico');
      return;
    }
    
    try {
      console.log(`🏢 Cargando datos del cliente: ${clientId}`);
      
      const clientDoc = await systemCollections.clients.doc(clientId).get();
      
      if (clientDoc.exists) {
        const clientData = clientDoc.data();
        
        // Actualizar licencia en AppState
        AppState.update('clientLicense', {
          clientId: clientId,
          clientName: clientData.name,
          plan: clientData.plan,
          status: clientData.status,
          limits: clientData.limits,
          enabledModules: clientData.enabledModules,
          startDate: clientData.startDate,
          expiryDate: clientData.expiryDate,
          lastPayment: clientData.lastPayment,
          nextBilling: clientData.nextBilling
        });
        
        console.log(`✅ Datos del cliente cargados: ${clientData.name}`);
        
      } else {
        console.warn(`⚠️ Datos del cliente no encontrados: ${clientId}`);
      }
      
    } catch (error) {
      console.error('❌ Error al cargar datos del cliente:', error);
    }
  },
  
  updateAppState(firebaseUser, userProfile) {
    console.log('📊 Actualizando AppState con datos del usuario...');
    
    // Actualizar usuario en AppState
    AppState.update('currentUser', {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      name: userProfile.name,
      userLevel: userProfile.userLevel,
      assignedHotels: userProfile.assignedHotels || ['ALL'],
      currentHotelContext: userProfile.currentHotelContext || 'ALL',
      permissions: userProfile.permissions || {},
      clientId: userProfile.clientId,
      lastLogin: new Date(),
      createdAt: userProfile.createdAt ? userProfile.createdAt.toDate() : new Date()
    });
    
    AppState.update('isAuthenticated', true);
    
    console.log('✅ AppState actualizado');
  },
  
  // ====================================================
  // INTERFAZ DE USUARIO
  // ====================================================
  
  showLoginScreen() {
    document.body.innerHTML = `
      <div class="login-container">
        <div class="login-card">
          <div class="login-header">
            <div class="login-logo">
              <i class="fas fa-hotel"></i>
            </div>
            <h1>PRESTOTEL</h1>
            <p>Sistema de Gestión Hotelera</p>
          </div>
          
          <form id="login-form" class="login-form">
            <div class="form-group">
              <label for="login-email">
                <i class="fas fa-envelope"></i> Email:
              </label>
              <input type="email" id="login-email" required 
                placeholder="tu@email.com" 
                autocomplete="email"
                autofocus>
            </div>
            
            <div class="form-group">
              <label for="login-password">
                <i class="fas fa-lock"></i> Contraseña:
              </label>
              <input type="password" id="login-password" required 
                placeholder="Tu contraseña" 
                autocomplete="current-password">
            </div>
            
            <button type="submit" id="login-btn" class="login-btn">
              <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
            </button>
            
            <button type="button" id="forgot-password-btn" class="forgot-password-btn">
              <i class="fas fa-question-circle"></i> ¿Olvidaste tu contraseña?
            </button>
          </form>
          
          <div id="login-error" class="login-error hidden"></div>
          <div id="login-success" class="login-success hidden"></div>
          
          <div class="login-footer">
            <p>¿Necesitas acceso? <a href="mailto:ventas@prestotel.com">Contacta con Prestotel</a></p>
            <p class="version">v${appConfig.appVersion}</p>
          </div>
        </div>
      </div>
    `;
    
    this.setupLoginEvents();
  },
  
  setupLoginEvents() {
    // Formulario de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', this.handleLoginSubmit.bind(this));
    }
    
    // Botón de olvidar contraseña
    const forgotBtn = document.getElementById('forgot-password-btn');
    if (forgotBtn) {
      forgotBtn.addEventListener('click', this.handleForgotPassword.bind(this));
    }
    
    // Enter en password para submit
    const passwordInput = document.getElementById('login-password');
    if (passwordInput) {
      passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleLoginSubmit(e);
        }
      });
    }
  },
  
  async handleLoginSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const loginBtn = document.getElementById('login-btn');
    const errorDiv = document.getElementById('login-error');
    const successDiv = document.getElementById('login-success');
    
    // Validaciones básicas
    if (!email || !password) {
      this.showError('Por favor completa todos los campos');
      return;
    }
    
    // UI de loading
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
    errorDiv.classList.add('hidden');
    successDiv.classList.add('hidden');
    
    // Intentar login
    const result = await this.signIn(email, password);
    
    if (result.success) {
      // El éxito se maneja en handleAuthStateChange
      successDiv.textContent = 'Iniciando sesión...';
      successDiv.classList.remove('hidden');
    } else {
      // Mostrar error
      this.showError(result.error);
      
      // Restaurar botón
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
    }
  },
  
  async handleForgotPassword() {
    const email = document.getElementById('login-email').value.trim();
    
    if (!email) {
      const userEmail = prompt('Introduce tu email para recuperar la contraseña:');
      if (!userEmail) return;
      
      document.getElementById('login-email').value = userEmail;
    }
    
    const emailToReset = document.getElementById('login-email').value.trim();
    
    if (!emailToReset) {
      this.showError('Por favor introduce un email válido');
      return;
    }
    
    const result = await this.resetPassword(emailToReset);
    
    if (result.success) {
      this.showSuccess(`Se ha enviado un enlace de recuperación a ${emailToReset}`);
    } else {
      this.showError(result.error);
    }
  },
  
  initializeMainApp() {
  console.log('🚀 Inicializando aplicación principal...');
  
  // ⭐ VERIFICAR SI YA SE RECARGÓ PARA EVITAR BUCLE
  const hasReloaded = sessionStorage.getItem('appReloaded');
  
  if (!hasReloaded) {
    console.log('📱 Primera vez - Recargando página...');
    
    // Marcar que ya se recargó
    sessionStorage.setItem('appReloaded', 'true');
    
    // Recargar página
    setTimeout(() => {
      window.location.reload();
    }, 500);
    
  } else {
    console.log('✅ Ya se recargó - Mostrando aplicación directamente...');
    
    // Limpiar flag
    sessionStorage.removeItem('appReloaded');
    
    // Mostrar aplicación sin recargar
    const loginScreen = document.getElementById('loginScreen');
    const appScreen = document.getElementById('app');
    
    if (loginScreen && appScreen) {
      loginScreen.style.display = 'none';
      appScreen.style.display = 'block';
    }
    
    // Inicializar app
    if (typeof initializeAuthenticatedApp === 'function') {
      initializeAuthenticatedApp();
    }
  }
},
  
  // ====================================================
  // UTILIDADES DE UI
  // ====================================================
  
  showError(message) {
    const errorDiv = document.getElementById('login-error');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.remove('hidden');
      
      // Auto-hide después de 5 segundos
      setTimeout(() => {
        errorDiv.classList.add('hidden');
      }, 5000);
    } else {
      console.error('Error UI:', message);
      alert('Error: ' + message);
    }
  },
  
  showSuccess(message) {
    const successDiv = document.getElementById('login-success');
    if (successDiv) {
      successDiv.textContent = message;
      successDiv.classList.remove('hidden');
      
      // Auto-hide después de 5 segundos
      setTimeout(() => {
        successDiv.classList.add('hidden');
      }, 5000);
    } else {
      console.log('Success UI:', message);
      alert('Éxito: ' + message);
    }
  },
  
  getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/user-not-found': 'No existe una cuenta con este email',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/invalid-email': 'Email inválido',
      'auth/user-disabled': 'Esta cuenta está deshabilitada',
      'auth/too-many-requests': 'Demasiados intentos fallidos. Inténtalo más tarde',
      'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
      'auth/invalid-credential': 'Credenciales inválidas',
      'auth/popup-closed-by-user': 'Ventana cerrada por el usuario',
      'auth/cancelled-popup-request': 'Solicitud cancelada',
      'auth/popup-blocked': 'Popup bloqueado por el navegador'
    };
    
    return errorMessages[errorCode] || `Error de autenticación: ${errorCode}`;
  },
  
  // ====================================================
  // CLEANUP
  // ====================================================
  
  destroy() {
    if (this.authStateListener) {
      this.authStateListener();
      this.authStateListener = null;
    }
    
    this.isInitialized = false;
    console.log('🧹 Firebase Auth Module limpiado');
  }
};

// ====================================================
// EXPORTAR PARA USO GLOBAL
// ====================================================

window.FirebaseAuthModule = FirebaseAuthModule;

console.log('🔥 Firebase Auth Module cargado');