// ====================================================
// MÓDULO DE LICENCIAS - js/modules/licensing.js
// ====================================================
// Control de límites empresariales y validaciones

const LicensingModule = {
  
  // ====================================================
  // VALIDACIONES DE LÍMITES
  // ====================================================
  
  // Verificar si puede crear más hoteles
  canCreateHotel() {
    const currentHotels = AppState.get('hotels').filter(h => h.active).length;
    const license = AppState.get('clientLicense');
    const maxHotels = license.limits.maxHotels;
    
    console.log(`🏨 Verificando límite de hoteles: ${currentHotels}/${maxHotels}`);
    
    if (currentHotels >= maxHotels) {
      return {
        allowed: false,
        message: `Límite alcanzado: máximo ${maxHotels} hoteles permitidos para el plan ${license.plan.toUpperCase()}. Contacta con Prestotel para ampliar tu plan.`,
        needsUpgrade: true,
        currentCount: currentHotels,
        maxCount: maxHotels
      };
    }
    
    // Advertencia si está cerca del límite
    const warningThreshold = Math.floor(maxHotels * 0.8); // 80% del límite
    if (currentHotels >= warningThreshold) {
      return {
        allowed: true,
        warning: true,
        message: `Te quedan ${maxHotels - currentHotels} hoteles disponibles. Considera ampliar tu plan pronto.`,
        currentCount: currentHotels,
        maxCount: maxHotels
      };
    }
    
    return { 
      allowed: true,
      currentCount: currentHotels,
      maxCount: maxHotels 
    };
  },
  
  // Verificar si puede crear más usuarios
  canCreateUser() {
    const currentUsers = AppState.get('employees').filter(e => e.systemUser).length;
    const license = AppState.get('clientLicense');
    const maxUsers = license.limits.maxUsers;
    
    if (currentUsers >= maxUsers) {
      return {
        allowed: false,
        message: `Límite de usuarios alcanzado: ${maxUsers} usuarios máximo para el plan ${license.plan.toUpperCase()}.`,
        needsUpgrade: true
      };
    }
    
    return { allowed: true };
  },
  
  // Verificar si un módulo está habilitado
  isModuleEnabled(moduleName) {
    const enabledModules = AppState.get('clientLicense.enabledModules') || [];
    return enabledModules.includes(moduleName);
  },
  
  // Obtener información completa de la licencia
  getLicenseStatus() {
    const license = AppState.get('clientLicense');
    const hotels = AppState.get('hotels').filter(h => h.active);
    const employees = AppState.get('employees') || [];
    
    const now = new Date();
    const expiryDate = new Date(license.expiryDate);
    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    return {
      // Info básica
      clientName: license.clientName,
      plan: license.plan,
      status: license.status,
      
      // Uso actual vs límites
      hotelsUsed: hotels.length,
      hotelsLimit: license.limits.maxHotels,
      hotelsUsagePercent: Math.round((hotels.length / license.limits.maxHotels) * 100),
      
      usersUsed: employees.filter(e => e.systemUser).length,
      usersLimit: license.limits.maxUsers,
      
      // Estado de la licencia
      daysUntilExpiry: daysUntilExpiry,
      isExpiringSoon: daysUntilExpiry <= 30,
      isExpired: daysUntilExpiry < 0,
      
      // Alertas
      nearHotelLimit: hotels.length >= (license.limits.maxHotels * 0.8),
      atHotelLimit: hotels.length >= license.limits.maxHotels,
      
      // Módulos
      enabledModules: license.enabledModules
    };
  },
  
  // ====================================================
  // INTERFAZ DE USUARIO - MODALES Y ALERTAS
  // ====================================================
  
  // Mostrar modal de límite alcanzado
  showUpgradeModal(reason = 'hotels') {
    const license = AppState.get('clientLicense');
    
    let title, content, icon;
    
    switch (reason) {
      case 'hotels':
        icon = '🏨';
        title = 'Límite de Hoteles Alcanzado';
        content = `
          <p>Has alcanzado el límite máximo de hoteles para tu plan actual.</p>
          <div class="license-details">
            <div class="detail-item">
              <strong>Plan actual:</strong> ${license.plan.toUpperCase()}
            </div>
            <div class="detail-item">
              <strong>Hoteles permitidos:</strong> ${license.limits.maxHotels}
            </div>
            <div class="detail-item">
              <strong>Hoteles en uso:</strong> ${AppState.get('hotels').filter(h => h.active).length}
            </div>
          </div>
          <p class="upgrade-message">Para agregar más hoteles, necesitas ampliar tu plan.</p>
        `;
        break;
        
      case 'users':
        icon = '👥';
        title = 'Límite de Usuarios Alcanzado';
        content = `
          <p>Has alcanzado el límite máximo de usuarios para tu plan actual.</p>
          <div class="license-details">
            <div class="detail-item">
              <strong>Plan actual:</strong> ${license.plan.toUpperCase()}
            </div>
            <div class="detail-item">
              <strong>Usuarios permitidos:</strong> ${license.limits.maxUsers}
            </div>
          </div>
        `;
        break;
        
      default:
        icon = '⚠️';
        title = 'Límite Alcanzado';
        content = '<p>Has alcanzado un límite de tu plan actual.</p>';
    }
    
    const modal = document.createElement('div');
    modal.className = 'upgrade-modal-overlay';
    modal.innerHTML = `
      <div class="upgrade-modal">
        <div class="modal-header">
          <span class="modal-icon">${icon}</span>
          <h3>${title}</h3>
        </div>
        <div class="modal-body">
          ${content}
        </div>
        <div class="modal-footer">
          <div class="upgrade-actions">
            <button class="btn btn-primary upgrade-btn" onclick="LicensingModule.contactPrestotel()">
              <i class="fas fa-phone"></i> Contactar con Prestotel
            </button>
            <button class="btn btn-secondary" onclick="LicensingModule.closeUpgradeModal()">
              <i class="fas fa-times"></i> Cerrar
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Prevenir múltiples modales
    this.closeUpgradeModal();
    
    document.body.appendChild(modal);
    
    // Cerrar con ESC
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        this.closeUpgradeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Cerrar al hacer clic fuera
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeUpgradeModal();
      }
    });
    
    console.log(`🚨 Modal de upgrade mostrado: ${reason}`);
  },
  
  // Mostrar alerta de advertencia (cerca del límite)
  showWarningToast(message, duration = 5000) {
    if (typeof Utils !== 'undefined' && Utils.showToast) {
      Utils.showToast(message, 'warning', duration);
    } else {
      // Fallback si no existe Utils
      console.warn('⚠️ ADVERTENCIA DE LICENCIA:', message);
      alert(message);
    }
  },
  
  // Acción de contacto con Prestotel
  contactPrestotel() {
    const licenseInfo = this.getLicenseStatus();
    
    // Información que se enviará
    const contactInfo = {
      clientId: AppState.get('clientLicense.clientId'),
      clientName: licenseInfo.clientName,
      currentPlan: licenseInfo.plan,
      hotelsUsed: licenseInfo.hotelsUsed,
      hotelsLimit: licenseInfo.hotelsLimit,
      requestReason: 'upgrade_needed',
      contactMethod: 'modal_request'
    };
    
    console.log('📞 Contactando con Prestotel:', contactInfo);
    
    // Aquí puedes implementar diferentes opciones:
    
    // OPCIÓN A: Abrir formulario de contacto
    // window.open('/contact-form', '_blank');
    
    // OPCIÓN B: Enviar email automático
    const subject = encodeURIComponent(`Solicitud de Ampliación - ${licenseInfo.clientName}`);
    const body = encodeURIComponent(`
Hola equipo de Prestotel,

Necesito ampliar mi plan actual debido a límites alcanzados.

Información actual:
- Cliente: ${licenseInfo.clientName}
- Plan: ${licenseInfo.plan.toUpperCase()}
- Hoteles en uso: ${licenseInfo.hotelsUsed}/${licenseInfo.hotelsLimit}

Por favor, contactadme para discutir opciones de upgrade.

Gracias,
${AppState.get('currentUser.name')}
    `);
    
    window.open(`mailto:ventas@prestotel.com?subject=${subject}&body=${body}`, '_blank');
    
    // OPCIÓN C: Abrir chat de soporte
    // if (window.Intercom) {
    //   window.Intercom('show');
    // }
    
    this.closeUpgradeModal();
    
    // Mostrar confirmación
    if (typeof Utils !== 'undefined' && Utils.showToast) {
      Utils.showToast('Se ha abierto tu cliente de email para contactar con Prestotel', 'info', 3000);
    }
  },
  
  // Cerrar modal de upgrade
  closeUpgradeModal() {
    const modal = document.querySelector('.upgrade-modal-overlay');
    if (modal) {
      modal.remove();
    }
  },
  
  // ====================================================
  // WIDGET DE INFORMACIÓN DE LICENCIA
  // ====================================================
  
  // Generar widget de licencia para el dashboard
  renderLicenseWidget() {
    const licenseInfo = this.getLicenseStatus();
    
    // Determinar color y estado
    let statusClass = 'license-ok';
    let statusIcon = '✅';
    let statusText = 'Activa';
    
    if (licenseInfo.isExpired) {
      statusClass = 'license-expired';
      statusIcon = '❌';
      statusText = 'Expirada';
    } else if (licenseInfo.isExpiringSoon) {
      statusClass = 'license-expiring';
      statusIcon = '⚠️';
      statusText = 'Por expirar';
    } else if (licenseInfo.atHotelLimit) {
      statusClass = 'license-limit';
      statusIcon = '🚨';
      statusText = 'Límite alcanzado';
    } else if (licenseInfo.nearHotelLimit) {
      statusClass = 'license-warning';
      statusIcon = '⚠️';
      statusText = 'Cerca del límite';
    }
    
    return `
      <div class="widget license-widget">
        <h3 class="widget-title">
          <i class="fas fa-certificate"></i>
          Información de Licencia
        </h3>
        <div class="license-info">
          <div class="license-header ${statusClass}">
            <span class="license-status-icon">${statusIcon}</span>
            <div class="license-basic-info">
              <div class="license-plan">${licenseInfo.plan.toUpperCase()}</div>
              <div class="license-status">${statusText}</div>
            </div>
          </div>
          
          <div class="license-metrics">
            <div class="license-metric">
              <span class="metric-label">Hoteles:</span>
              <span class="metric-value">
                ${licenseInfo.hotelsUsed} / ${licenseInfo.hotelsLimit}
                <div class="usage-bar">
                  <div class="usage-fill" style="width: ${licenseInfo.hotelsUsagePercent}%"></div>
                </div>
              </span>
            </div>
            
            <div class="license-metric">
              <span class="metric-label">Vencimiento:</span>
              <span class="metric-value ${licenseInfo.isExpiringSoon ? 'expiring' : ''}">
                ${licenseInfo.daysUntilExpiry > 0 ? `${licenseInfo.daysUntilExpiry} días` : 'Expirada'}
              </span>
            </div>
          </div>
          
          ${licenseInfo.nearHotelLimit || licenseInfo.isExpiringSoon ? `
            <div class="license-actions">
              <button class="license-upgrade-btn" onclick="LicensingModule.showUpgradeModal('hotels')">
                <i class="fas fa-arrow-up"></i> Ampliar Plan
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },
  
  // ====================================================
  // UTILIDADES Y LOGGING
  // ====================================================
  
  // Log de acciones para auditoría
  logLicenseAction(action, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: action,
      userId: AppState.get('currentUser.id'),
      userEmail: AppState.get('currentUser.email'),
      clientId: AppState.get('clientLicense.clientId'),
      details: details
    };
    
    console.log('📋 License Action:', logEntry);
    
    // Aquí podrías enviar el log a un servidor para auditoría
    // fetch('/api/license-logs', { method: 'POST', body: JSON.stringify(logEntry) });
  },
  
  // Verificar estado general del sistema
  performLicenseCheck() {
    const licenseInfo = this.getLicenseStatus();
    
    console.log('🔍 Verificación de licencia:', {
      client: licenseInfo.clientName,
      plan: licenseInfo.plan,
      status: licenseInfo.status,
      hotelsUsage: `${licenseInfo.hotelsUsed}/${licenseInfo.hotelsLimit}`,
      daysUntilExpiry: licenseInfo.daysUntilExpiry
    });
    
    // Alertas automáticas
    if (licenseInfo.isExpired) {
      console.error('❌ LICENCIA EXPIRADA');
      return false;
    }
    
    if (licenseInfo.isExpiringSoon) {
      console.warn('⚠️ Licencia expira pronto:', licenseInfo.daysUntilExpiry, 'días');
    }
    
    if (licenseInfo.atHotelLimit) {
      console.warn('🚨 Límite de hoteles alcanzado');
    }
    
    return true;
  },
  
  // ====================================================
  // INICIALIZACIÓN
  // ====================================================
  
  // Inicializar módulo de licencias
  init() {
    console.log('🔐 Inicializando módulo de licencias...');
    
    // Verificar estado inicial
    this.performLicenseCheck();
    
    // Log de inicialización
    this.logLicenseAction('module_initialized', {
      licenseStatus: this.getLicenseStatus()
    });
    
    console.log('✅ Módulo de licencias inicializado');
  }
};

// Inicializar automáticamente cuando se carga el script
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    LicensingModule.init();
  });
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.LicensingModule = LicensingModule;
}