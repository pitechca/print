// src/utils/globalEffects.js

// Define showAlert in the global scope so it can be exported
let showAlert;

// Page Loading Effect
document.addEventListener('DOMContentLoaded', function() {
  // Add loading class to body when the page starts loading
  document.body.classList.add('page-loading');
  
  // Remove loading class after page loads
  window.addEventListener('load', function() {
    setTimeout(function() {
      document.body.classList.remove('page-loading');
    }, 500); // Short delay to ensure animation is visible
  });
});

// Custom Alert System
(function() {
  // Create alert container
  const createAlertContainer = () => {
    const container = document.createElement('div');
    container.className = 'alert-container';
    document.body.appendChild(container);
    return container;
  };

  // Define showAlert in the global scope (declared above)
  showAlert = function(message, type = 'info', duration = 5000) {
    const alertContainer = document.querySelector('.alert-container') || createAlertContainer();
    
    const alertBox = document.createElement('div');
    alertBox.className = `alert-box ${type}`;
    alertBox.textContent = message;
    
    alertContainer.appendChild(alertBox);
    
    setTimeout(() => {
      alertBox.classList.add('closing');
      setTimeout(() => {
        if (alertBox.parentNode) {
          alertContainer.removeChild(alertBox);
          if (alertContainer.children.length === 0 && alertContainer.parentNode) {
            document.body.removeChild(alertContainer);
          }
        }
      }, 300);
    }, duration);
  };

  // Also make it available on window
  window.showAlert = showAlert;

  // Override default alert for non-React parts of the application
  const originalAlert = window.alert;
  window.alert = function(message) {
    showAlert(message);
  };
})();

// Add loading effect to buttons (using event delegation)
document.addEventListener('click', function(e) {
  if (e.target.tagName === 'BUTTON' && !e.target.classList.contains('no-loading')) {
    const button = e.target;
    
    // Skip if already loading
    if (button.classList.contains('loading')) return;
    
    // Add loading class
    button.classList.add('loading');
    
    // Simulate request completion (remove in production)
    // In real usage, this should be controlled by your React components
    setTimeout(() => {
      if (button && document.body.contains(button)) {
        button.classList.remove('loading');
      }
    }, 1500);
  }
});

// File input enhancement (will apply to dynamically added elements through React)
// This uses a mutation observer to handle React's dynamic DOM updates
const enhanceFileInputs = () => {
  document.querySelectorAll('input[type="file"]:not([data-enhanced])').forEach(input => {
    // Mark as enhanced
    input.setAttribute('data-enhanced', 'true');
    
    // Create label if doesn't exist
    let label = input.nextElementSibling;
    if (!label || label.tagName !== 'LABEL' || !label.getAttribute('for') || label.getAttribute('for') !== input.id) {
      label = document.createElement('label');
      if (input.id) {
        label.setAttribute('for', input.id);
      } else {
        const uniqueId = 'file-input-' + Math.random().toString(36).substring(2, 9);
        input.id = uniqueId;
        label.setAttribute('for', uniqueId);
      }
      
      label.textContent = input.getAttribute('data-label') || 'Choose file';
      input.parentNode.insertBefore(label, input.nextSibling);
    }
    
    // Update label text when file selected
    input.addEventListener('change', function() {
      const fileName = this.files.length > 1 
        ? this.files.length + ' files selected' 
        : this.files[0] ? this.files[0].name : 'Choose file';
      
      label.textContent = fileName;
    });
  });
};

// Setup MutationObserver to catch dynamically added elements in React
document.addEventListener('DOMContentLoaded', function() {
  enhanceFileInputs(); // Initial enhancement
  
  // Create an observer instance
  const observer = new MutationObserver(function(mutations) {
    let shouldEnhance = false;
    
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        shouldEnhance = true;
      }
    });
    
    if (shouldEnhance) {
      enhanceFileInputs();
    }
  });
  
  // Observe the entire document
  observer.observe(document.body, { 
    childList: true,
    subtree: true
  });
});

// Now we can properly export the showAlert function
export { showAlert };