// ====================================================
// MÓDULO DE AUTENTICACIÓN FIREBASE MULTI-CLIENTE
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
    
    console.log('🔐 Inicializando Firebase Authentication Multi-Cliente...');
    
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
      console.log('✅ Firebase Auth Multi-Cliente inicializado correctamente');
      
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
      
      console.log(`👤 Tipo de usuario detectado: ${userProfile.userLevel}`);
      
      // ⭐ DETECTAR TIPO DE USUARIO Y CARGAR CONTEXTO
      await this.setupUserContext(firebaseUser, userProfile);
      
      // Actualizar último login
      await this.updateLastLogin(firebaseUser.uid);
      
      // Configurar AppState con el usuario
      this.updateAppState(firebaseUser, userProfile);
      
      // Inicializar aplicación según tipo de usuario
      this.initializeMainApp(userProfile);
      
      console.log(`🎉 Login completado para: ${userProfile.name} (${userProfile.userLevel})`);
      
    } catch (error) {
      console.error('❌ Error en handleUserSignIn:', error);
      this.showError('Error al cargar tu perfil. Inténtalo de nuevo.');
    }
  },
  
  // ⭐ NUEVA: CONFIGURAR CONTEXTO SEGÚN TIPO DE USUARIO
  async setupUserContext(firebaseUser, userProfile) {
    console.log(`🎯 Configurando contexto para: ${userProfile.userLevel}`);
    
    switch (userProfile.userLevel) {
      case 'super_admin':
        await this.setupSuperAdminContext();
        break;
        
      case 'client_admin':
        await this.setupClientAdminContext(userProfile);
        break;
        
      case 'hotel_manager':
        await this.setupHotelManagerContext(userProfile);
        break;
        
      case 'department_head':
      case 'employee':
        await this.setupEmployeeContext(userProfile);
        break;
        
      default:
        console.warn(`⚠️ Tipo de usuario desconocido: ${userProfile.userLevel}`);
        await this.setupEmployeeContext(userProfile);
    }
  },
  
  // ⭐ CONTEXTO SUPER ADMIN
  async setupSuperAdminContext() {
    console.log('👑 Configurando contexto Super Admin...');
    
    // Super Admin ve TODO
    AppState.update('userContext', {
      type: 'super_admin',
      canViewAllClients: true,
      canManageSystem: true,
      allowedModules: ['all'],
      dataScope: 'global'
    });
    
    // Cargar todos los clientes para estadísticas
    try {
      const clientsSnapshot = await db.collection('clients').get();
      const clients = [];
      clientsSnapshot.forEach(doc => {
        clients.push({ firestoreId: doc.id, ...doc.data() });
      });
      AppState.update('clients', clients);
      
      console.log(`✅ Super Admin: ${clients.length} clientes cargados`);
    } catch (error) {
      console.warn('⚠️ Error cargando clientes para Super Admin:', error);
    }
  },
  
  // ⭐ CONTEXTO CLIENT ADMIN
  async setupClientAdminContext(userProfile) {
    console.log(`🏢 Configurando contexto Client Admin para: ${userProfile.clientId}`);
    
    if (!userProfile.clientId) {
      throw new Error('Client Admin sin clientId asignado');
    }
    
    try {
      // Cargar datos del cliente
      const clientDoc = await db.collection('clients').where('code', '==', userProfile.clientId).get();
      
      if (clientDoc.empty) {
        throw new Error(`Cliente no encontrado: ${userProfile.clientId}`);
      }
      
      const clientData = clientDoc.docs[0].data();
      const clientFirestoreId = clientDoc.docs[0].id;
      
      console.log(`✅ Cliente cargado: ${clientData.name}`);
      
      // Establecer contexto del cliente
      AppState.update('userContext', {
        type: 'client_admin',
        clientId: userProfile.clientId,
        clientName: clientData.name,
        canManageClient: true,
        allowedModules: userProfile.permissions || [],
        dataScope: 'client',
        limits: clientData.limits
      });
      
      // Cargar datos específicos del cliente
      await this.loadClientSpecificData(userProfile.clientId);
      
      // Actualizar licencia en AppState
      AppState.update('clientLicense', {
        clientId: userProfile.clientId,
        clientName: clientData.name,
        plan: clientData.plan,
        status: clientData.status,
        limits: clientData.limits,
        startDate: clientData.startDate,
        expiryDate: clientData.expiryDate
      });
      
    } catch (error) {
      console.error('❌ Error configurando contexto Client Admin:', error);
      throw error;
    }
  },
  
  // ⭐ CONTEXTO HOTEL MANAGER
  async setupHotelManagerContext(userProfile) {
    console.log(`🏨 Configurando contexto Hotel Manager para: ${userProfile.assignedHotels}`);
    
    AppState.update('userContext', {
      type: 'hotel_manager',
      clientId: userProfile.clientId,
      assignedHotels: userProfile.assignedHotels || ['ALL'],
      canManageHotel: true,
      allowedModules: userProfile.permissions || ['tasks', 'employees', 'inventory'],
      dataScope: 'hotel'
    });
    
    // Cargar datos del cliente y hoteles asignados
    if (userProfile.clientId) {
      await this.loadClientSpecificData(userProfile.clientId);
    }
  },
  
  // ⭐ CONTEXTO EMPLOYEE
  async setupEmployeeContext(userProfile) {
    console.log(`👥 Configurando contexto Employee para: ${userProfile.userLevel}`);
    
    AppState.update('userContext', {
      type: 'employee',
      clientId: userProfile.clientId,
      assignedHotels: userProfile.assignedHotels || [],
      canManageHotel: false,
      allowedModules: userProfile.permissions || ['tasks'],
      dataScope: 'limited'
    });
    
    // Cargar datos básicos del cliente
    if (userProfile.clientId) {
      await this.loadClientSpecificData(userProfile.clientId);
    }
  },
  
  // ⭐ CARGAR DATOS ESPECÍFICOS DEL CLIENTE
  async loadClientSpecificData(clientId) {
    if (!clientId) return;
    
    try {
      console.log(`📊 Cargando datos específicos del cliente: ${clientId}`);
      
      // Cargar usuarios del cliente
      const usersSnapshot = await db.collection('users').where('clientId', '==', clientId).get();
      const clientUsers = [];
      usersSnapshot.forEach(doc => {
        clientUsers.push({ uid: doc.id, ...doc.data() });
      });
      
      AppState.update('clientUsers', clientUsers);
      console.log(`✅ ${clientUsers.length} usuarios del cliente cargados`);
      
      // Aquí se pueden cargar más datos específicos:
      // - Hoteles del cliente
      // - Tareas del cliente
      // - Empleados del cliente
      // - etc.
      
    } catch (error) {
      console.error('❌ Error cargando datos del cliente:', error);
    }
  },
  
  handleUserSignOut() {
    // Limpiar estado global
    if (typeof window.clearCurrentUser === 'function') {
      window.clearCurrentUser();
    }
    
    // Limpiar AppState completamente
    AppState.update('currentUser', null);
    AppState.update('isAuthenticated', false);
    AppState.update('clientLicense', null);
    AppState.update('userContext', null);
    AppState.update('clients', []);
    AppState.update('clientUsers', []);
    AppState.update('allUsers', []);
    
    // Mostrar pantalla de login
    this.showLoginScreen();
    
    console.log('🚪 Usuario desconectado - Estado limpiado');
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
      
      const doc = await db.collection('users').doc(uid).get();
      
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
      await db.collection('users').doc(uid).update({
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Último login actualizado');
      
    } catch (error) {
      console.warn('⚠️ Error al actualizar último login:', error);
    }
  },
  
  // ⭐ MEJORADA: ACTUALIZAR APPSTATE CON CONTEXTO
  updateAppState(firebaseUser, userProfile) {
    console.log('📊 Actualizando AppState con datos del usuario...');
    
    // Actualizar usuario en AppState con toda la información
    AppState.update('currentUser', {
      uid: firebaseUser.uid,
      id: firebaseUser.uid,
      email: firebaseUser.email,
      name: userProfile.name,
      userLevel: userProfile.userLevel,
      clientId: userProfile.clientId,
      assignedHotels: userProfile.assignedHotels || ['ALL'],
      currentHotelContext: userProfile.assignedHotels?.[0] || 'ALL',
      permissions: userProfile.permissions || [],
      active: userProfile.active,
      mustChangePassword: userProfile.mustChangePassword || false,
      profile: userProfile.profile || {},
      lastLogin: new Date(),
      createdAt: userProfile.createdAt || new Date()
    });
    
    AppState.update('isAuthenticated', true);
    
    // Establecer usuario global si la función existe
    if (typeof window.setCurrentUser === 'function') {
      window.setCurrentUser(firebaseUser, userProfile);
    }
    
    console.log('✅ AppState actualizado con contexto multi-cliente');
  },
  
  // ====================================================
  // INTERFAZ DE USUARIO MEJORADA
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
            <p>Sistema de Gestión Hotelera Multi-Cliente</p>
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
            <div class="user-types">
              <small>Tipos de usuario soportados:</small>
              <div class="user-badges">
                <span class="badge badge-super">Super Admin</span>
                <span class="badge badge-client">Client Admin</span>
                <span class="badge badge-hotel">Hotel Manager</span>
                <span class="badge badge-employee">Employee</span>
              </div>
            </div>
            <p>¿Necesitas acceso? <a href="mailto:ventas@prestotel.com">Contacta con Prestotel</a></p>
            <p class="version">v${typeof appConfig !== 'undefined' ? appConfig.appVersion : '2.0.0'}</p>
          </div>
        </div>
      </div>
      
      <style>
        .user-types {
          text-align: center;
          margin-bottom: 1rem;
        }
        .user-badges {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
          flex-wrap: wrap;
        }
        .badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        .badge-super { background: #6f42c1; color: white; }
        .badge-client { background: #007bff; color: white; }
        .badge-hotel { background: #28a745; color: white; }
        .badge-employee { background: #6c757d; color: white; }
      </style>
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
      successDiv.textContent = 'Configurando tu entorno de trabajo...';
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
  
  // ⭐ MEJORADA: INICIALIZACIÓN SEGÚN TIPO DE USUARIO
  initializeMainApp(userProfile) {
    console.log(`🚀 Inicializando aplicación para: ${userProfile.userLevel}...`);
    
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
      
      // Inicializar app según tipo de usuario
      if (typeof initializeAuthenticatedApp === 'function') {
        initializeAuthenticatedApp();
      }
      
      // Mostrar mensaje de bienvenida específico
      this.showWelcomeMessage(userProfile);
    }
  },
  
  // ⭐ NUEVA: MENSAJE DE BIENVENIDA PERSONALIZADO
  showWelcomeMessage(userProfile) {
    const context = AppState.get('userContext');
    let welcomeMessage = `¡Bienvenido ${userProfile.name}!`;
    
    switch (userProfile.userLevel) {
      case 'super_admin':
        welcomeMessage += ' Panel Super Admin cargado.';
        break;
      case 'client_admin':
        welcomeMessage += ` Gestionando ${context.clientName}.`;
        break;
      case 'hotel_manager':
        welcomeMessage += ' Panel de gestión de hotel listo.';
        break;
      default:
        welcomeMessage += ' Sistema cargado correctamente.';
    }
    
    setTimeout(() => {
      console.log(`🎉 ${welcomeMessage}`);
      // Aquí podrías mostrar una notificación visual si quieres
    }, 1000);
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
    console.log('🧹 Firebase Auth Module Multi-Cliente limpiado');
  }
};

// ====================================================
// EXPORTAR PARA USO GLOBAL
// ====================================================

window.FirebaseAuthModule = FirebaseAuthModule;

console.log('🔥 Firebase Auth Module Multi-Cliente cargado');