/**
 * Hand Breath - Main Application Entry Point
 * 
 * Architecture:
 * - HandTracker: Camera and hand detection
 * - ParticleSystem: Saturn ring visualization
 * - UIController: Interface management
 * - App: Orchestrates everything
 */

import HandTracker from './modules/HandTracker.js';
import ParticleSystem from './modules/ParticleSystemHand.js';
import UIController from './modules/UIControllerHand.js';

class App {
    constructor() {
        this.isInitialized = false;
        
        // Initialize modules
        this.handTracker = new HandTracker();
        this.particleSystem = new ParticleSystem();
        this.uiController = new UIController();
        
        // Bind methods
        this.init = this.init.bind(this);
        this.update = this.update.bind(this);
        this.onHandUpdate = this.onHandUpdate.bind(this);
    }
    
    async init() {
        try {
            console.log('🚀 Initializing Hand Breath...');
            
            // Initialize Three.js scene first (loads fast)
            this.particleSystem.init();
            
            // Initialize UI
            this.uiController.init({
                onSkeletonToggle: (show) => this.handTracker.toggleSkeleton(show)
            });
            
            // Start animation loop immediately (shows idle state)
            this.update();
            
            // Initialize hand tracking (may take time for camera permission)
            this.handTracker.on('cameraReady', () => {
                console.log('✅ Camera ready');
                this.uiController.updateStatus('Show your hand');
                this.uiController.hideLoading();
            });
            
            this.handTracker.on('cameraError', (error) => {
                console.error('❌ Camera error:', error);
                this.uiController.showError('Camera access denied or unavailable');
                this.uiController.hideLoading();
            });
            
            this.handTracker.on('handUpdate', this.onHandUpdate);
            
            await this.handTracker.init();
            
            this.isInitialized = true;
            console.log('✅ Hand Breath initialized successfully');
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.uiController.showError(error.message);
            this.uiController.hideLoading();
        }
    }
    
    /**
     * Handle hand tracking updates
     */
    onHandUpdate(handData) {
        // Update UI
        this.uiController.updateHandStatus(handData.detected);
        
        // Update particle system
        this.particleSystem.updateFromHand(handData);
        
        // Debug log (throttled)
        if (handData.detected && Math.random() < 0.01) {
            console.log('👋 Hand state:', {
                distance: handData.distance.toFixed(2),
                rotation: handData.rotation.toFixed(1) + '°'
            });
        }
    }
    
    /**
     * Animation loop
     */
    update() {
        requestAnimationFrame(this.update);
        
        if (this.particleSystem) {
            this.particleSystem.render();
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new App();
        app.init();
    });
} else {
    const app = new App();
    app.init();
}

export default App;
