/**
 * UIController Module - Hand Tracking Edition
 * 
 * Responsibilities:
 * - Update hand detection status
 * - Show/hide instructions
 * - Handle camera feed visibility
 * - Handle skeleton overlay toggle
 */

class UIController {
    constructor() {
        this.elements = {};
        this.callbacks = {};
    }
    
    /**
     * Initialize UI controller
     */
    init(callbacks = {}) {
        console.log('🎨 Initializing UIController...');
        
        this.callbacks = callbacks;
        this.cacheElements();
        this.attachEventListeners();
        
        console.log('✅ UIController initialized');
    }
    
    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            // Instructions
            instructions: document.getElementById('instructions'),
            
            // Status
            handStatus: document.getElementById('hand-status'),
            statusDot: document.querySelector('.status-dot'),
            statusText: document.querySelector('.status-text'),
            
            // Camera
            cameraFeed: document.getElementById('camera-feed'),
            toggleCameraBtn: document.getElementById('toggle-camera-feed'),
            
            // Skeleton
            skeletonCanvas: document.getElementById('skeleton-canvas'),
            toggleSkeletonBtn: document.getElementById('toggle-skeleton'),
            
            // Loading
            loadingScreen: document.getElementById('loading-screen'),
            
            // Container
            container: document.getElementById('container')
        };
    }
    
    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Toggle camera feed
        this.elements.toggleCameraBtn?.addEventListener('click', () => {
            this.toggleCameraFeed();
        });
        
        // Toggle skeleton
        this.elements.toggleSkeletonBtn?.addEventListener('click', () => {
            this.toggleSkeleton();
        });
    }
    
    /**
     * Update hand detection status
     */
    updateHandStatus(detected) {
        if (detected) {
            // Hand detected
            this.elements.statusText.textContent = 'Hand Detected';
            this.elements.statusDot?.classList.add('active');
            
            // Hide instructions
            this.elements.instructions?.classList.add('hidden');
            
            // Add class to container
            this.elements.container?.classList.add('hand-detected');
            
        } else {
            // No hand
            this.elements.statusText.textContent = 'Show Your Hand';
            this.elements.statusDot?.classList.remove('active');
            
            // Show instructions
            this.elements.instructions?.classList.remove('hidden');
            
            // Remove class from container
            this.elements.container?.classList.remove('hand-detected');
        }
    }
    
    /**
     * Update status text
     */
    updateStatus(text) {
        if (this.elements.statusText) {
            this.elements.statusText.textContent = text;
        }
    }
    
    /**
     * Toggle camera feed visibility
     */
    toggleCameraFeed() {
        const isHidden = this.elements.cameraFeed?.classList.toggle('hidden');
        
        if (this.elements.toggleCameraBtn) {
            const btnText = this.elements.toggleCameraBtn.querySelector('.btn-text');
            if (btnText) {
                btnText.textContent = isHidden ? 'Show Camera' : 'Hide Camera';
            }
        }
        
        console.log(`📷 Camera feed: ${isHidden ? 'Hidden' : 'Visible'}`);
    }
    
    /**
     * Toggle skeleton overlay
     */
    toggleSkeleton() {
        const isVisible = !this.elements.skeletonCanvas?.classList.contains('visible');
        
        if (this.callbacks.onSkeletonToggle) {
            this.callbacks.onSkeletonToggle(isVisible);
        }
        
        if (this.elements.toggleSkeletonBtn) {
            const btnText = this.elements.toggleSkeletonBtn.querySelector('.btn-text');
            if (btnText) {
                btnText.textContent = isVisible ? 'Hide Skeleton' : 'Show Skeleton';
            }
            this.elements.toggleSkeletonBtn.classList.toggle('active', isVisible);
        }
        
        console.log(`🦴 Skeleton: ${isVisible ? 'Visible' : 'Hidden'}`);
    }
    
    /**
     * Hide loading screen
     */
    hideLoading() {
        setTimeout(() => {
            this.elements.loadingScreen?.classList.add('hidden');
        }, 500);
    }
    
    /**
     * Show error message
     */
    showError(message) {
        console.error('UI Error:', message);
        
        // Update status to show error
        this.updateStatus(`Error: ${message}`);
        
        // Could add a modal or toast here
        alert(`Error: ${message}\n\nPlease ensure:\n- Camera permission is granted\n- You're using HTTPS or localhost\n- Your browser supports WebRTC`);
    }
}

export default UIController;
