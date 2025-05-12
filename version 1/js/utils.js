// Utilidades generales para la aplicación
const Utils = {
  // Formatear fecha en formato legible
  formatDate: function(date) {
    if (!date) return 'N/A';
    
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  },
  
  // Formatear hora
  formatTime: function(date) {
    if (!date) return 'N/A';
    
    const d = new Date(date);
    return d.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },
  
  // Formatear fecha y hora
  formatDateTime: function(date) {
    if (!date) return 'N/A';
    
    return `${this.formatDate(date)} ${this.formatTime(date)}`;
  },
  
  // Calcular tiempo transcurrido en formato legible
  timeAgo: function(date) {
    if (!date) return 'N/A';
    
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    
    // Convertir a segundos
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) {
      return 'hace un momento';
    }
    
    // Convertir a minutos
    const diffMin = Math.floor(diffSec / 60);
    
    if (diffMin < 60) {
      return `hace ${diffMin} minuto${diffMin !== 1 ? 's' : ''}`;
    }
    
    // Convertir a horas
    const diffHour = Math.floor(diffMin / 60);
    
    if (diffHour < 24) {
      return `hace ${diffHour} hora${diffHour !== 1 ? 's' : ''}`;
    }
    
    // Convertir a días
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay < 30) {
      return `hace ${diffDay} día${diffDay !== 1 ? 's' : ''}`;
    }
    
    // Convertir a meses
    const diffMonth = Math.floor(diffDay / 30);
    
    if (diffMonth < 12) {
      return `hace ${diffMonth} mes${diffMonth !== 1 ? 'es' : ''}`;
    }
    
    // Convertir a años
    const diffYear = Math.floor(diffMonth / 12);
    return `hace ${diffYear} año${diffYear !== 1 ? 's' : ''}`;
  },
  
  // Sanitizar HTML para prevenir XSS
  sanitizeHTML: function(text) {
    if (!text) return '';
    
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },
  
  // Generar ID único
  generateId: function() {
    return '_' + Math.random().toString(36).substr(2, 9);
  },
  
  // Truncar texto
  truncateText: function(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    
    return text.substr(0, maxLength) + '...';
  },
  
  // Formatear número con separador de miles
  formatNumber: function(num) {
    if (num === null || num === undefined) return '0';
    
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  },
  
  // Formatear moneda (EUR)
  formatCurrency: function(amount) {
    if (amount === null || amount === undefined) return '0,00 €';
    
    return amount.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".") + ' €';
  },
  
  // Sistema de notificaciones
  showToast: function(message, type = 'info', duration = 3000) {
    // Verificar si existe el contenedor de notificaciones
    let container = document.getElementById('notification-container');
    
    // Si no existe, crearlo
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      document.body.appendChild(container);
    }
    
    // Crear la notificación
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Contenido de la notificación
    toast.innerHTML = `
      <div class="toast-header">
        <h4 class="toast-title">${this.getNotificationTitle(type)}</h4>
        <button class="toast-close">&times;</button>
      </div>
      <div class="toast-body">
        ${this.sanitizeHTML(message)}
      </div>
    `;
    
    // Añadir al contenedor
    container.appendChild(toast);
    
    // Mostrar con animación
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // Configurar botón de cierre
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      this.closeToast(toast);
    });
    
    // Auto cerrar después de la duración
    const closeTimeout = setTimeout(() => {
      this.closeToast(toast);
    }, duration);
    
    // Guardar timeout para poder cancelarlo
    toast.closeTimeout = closeTimeout;
    
    return toast;
  },
  
  // Cerrar notificación
  closeToast: function(toast) {
    // Cancelar timeout si existe
    if (toast.closeTimeout) {
      clearTimeout(toast.closeTimeout);
    }
    
    // Animar salida
    toast.classList.remove('show');
    toast.classList.add('hide');
    
    // Eliminar del DOM después de la animación
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  },
  
  // Título según tipo de notificación
  getNotificationTitle: function(type) {
    switch(type) {
      case 'success': return 'Éxito';
      case 'error': return 'Error';
      case 'warning': return 'Advertencia';
      default: return 'Información';
    }
  },
  
  // Notificaciones específicas
  notifySuccess: function(message, duration) {
    return this.showToast(message, 'success', duration);
  },
  
  notifyError: function(message, duration) {
    return this.showToast(message, 'error', duration);
  },
  
  notifyWarning: function(message, duration) {
    return this.showToast(message, 'warning', duration);
  },
  
  notifyInfo: function(message, duration) {
    return this.showToast(message, 'info', duration);
  },
  
  // Confirmar acción (reemplazo para confirm)
  confirmAction: function(message, onConfirm, onCancel = null) {
    // Crear modal de confirmación
    const modal = document.createElement('div');
    modal.className = 'modal confirm-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Confirmar acción</h3>
          <span class="close-modal">&times;</span>
        </div>
        <div class="modal-body">
          <p>${this.sanitizeHTML(message)}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary cancel-btn">Cancelar</button>
          <button class="btn btn-danger confirm-btn">Confirmar</button>
        </div>
      </div>
    `;
    
    // Añadir al DOM
    document.body.appendChild(modal);
    
    // Mostrar modal
    setTimeout(() => {
      modal.style.opacity = '1';
    }, 10);
    
    // Configurar botones
    const closeBtn = modal.querySelector('.close-modal');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const confirmBtn = modal.querySelector('.confirm-btn');
    
    // Función para cerrar el modal
    const closeModal = () => {
      modal.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(modal);
      }, 300);
    };
    
    // Eventos
    closeBtn.addEventListener('click', () => {
      closeModal();
      if (onCancel) onCancel();
    });
    
    cancelBtn.addEventListener('click', () => {
      closeModal();
      if (onCancel) onCancel();
    });
    
    confirmBtn.addEventListener('click', () => {
      closeModal();
      if (onConfirm) onConfirm();
    });
    
    // Cerrar con ESC
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        if (onCancel) onCancel();
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
  },
  
  // Prompt personalizado
  promptInput: function(message, defaultValue = '', onSubmit, onCancel = null) {
    // Crear modal de prompt
    const modal = document.createElement('div');
    modal.className = 'modal prompt-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Entrada de datos</h3>
          <span class="close-modal">&times;</span>
        </div>
        <div class="modal-body">
          <p>${this.sanitizeHTML(message)}</p>
          <input type="text" class="form-control prompt-input" value="${this.sanitizeHTML(defaultValue)}">
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary cancel-btn">Cancelar</button>
          <button class="btn btn-primary submit-btn">Aceptar</button>
        </div>
      </div>
    `;
    
    // Añadir al DOM
    document.body.appendChild(modal);
    
    // Obtener referencia al input
    const input = modal.querySelector('.prompt-input');
    
    // Mostrar modal y dar foco al input
    setTimeout(() => {
      modal.style.opacity = '1';
      input.focus();
      input.select();
    }, 10);
    
    // Configurar botones
    const closeBtn = modal.querySelector('.close-modal');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const submitBtn = modal.querySelector('.submit-btn');
    
    // Función para cerrar el modal
    const closeModal = () => {
      modal.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(modal);
      }, 300);
    };
    
    // Función para enviar el valor
    const submitValue = () => {
      const value = input.value;
      closeModal();
      if (onSubmit) onSubmit(value);
    };
    
    // Eventos
    closeBtn.addEventListener('click', () => {
      closeModal();
      if (onCancel) onCancel();
    });
    
    cancelBtn.addEventListener('click', () => {
      closeModal();
      if (onCancel) onCancel();
    });
    
    submitBtn.addEventListener('click', submitValue);
    
    // Enviar con Enter
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        submitValue();
      }
    });
    
    // Cerrar con ESC
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        if (onCancel) onCancel();
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
  },
  
  // Descargar contenido como archivo
  downloadAsFile: function(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
  
  // Exportar datos a CSV
  exportToCSV: function(data, filename = 'export.csv') {
    if (!data || !data.length) {
      this.notifyError('No hay datos para exportar');
      return;
    }
    
    // Obtener cabeceras (propiedades del primer objeto)
    const headers = Object.keys(data[0]);
    
    // Crear líneas CSV
    let csvContent = headers.join(',') + '\n';
    
    // Añadir filas
    data.forEach(item => {
      const row = headers.map(header => {
        let cell = item[header] === null || item[header] === undefined ? '' : item[header];
        
        // Si es fecha, formatear
        if (cell instanceof Date) {
          cell = this.formatDateTime(cell);
        }
        
        // Escapar comas y comillas
        cell = String(cell).replace(/"/g, '""');
        
        // Encerrar en comillas si contiene comas, saltos de línea o comillas
        if (cell.includes(',') || cell.includes('\n') || cell.includes('"')) {
          cell = `"${cell}"`;
        }
        
        return cell;
      }).join(',');
      
      csvContent += row + '\n';
    });
    
    // Descargar
    this.downloadAsFile(csvContent, filename, 'text/csv');
  },
  
  // Exportar a Excel (usando SheetJS)
  exportToExcel: function(data, filename = 'export.xlsx', sheetName = 'Hoja1') {
    if (!data || !data.length) {
      this.notifyError('No hay datos para exportar');
      return;
    }
    
    if (typeof XLSX === 'undefined') {
      console.error('SheetJS (XLSX) no está disponible. Intente exportar a CSV.');
      return;
    }
    
    // Crear libro
    const wb = XLSX.utils.book_new();
    
    // Crear hoja
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Añadir hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Exportar
    XLSX.writeFile(wb, filename);
  }
};

// Exportar el módulo
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}