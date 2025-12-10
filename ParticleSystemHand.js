/**
 * ParticleSystem Module - Saturn Ring Edition
 * 
 * Responsibilities:
 * - Create 3-layer Saturn ring particle structure
 * - Map hand distance to camera zoom
 * - Map hand rotation to sphere rotation
 * - Auto-breathing mode when no hand detected
 */

class ParticleSystem {
    constructor() {
        // Three.js core
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        // Particle layers
        this.outerShell = null;
        this.middleRing = null;
        this.innerCore = null;
        this.particleGroup = null;
        
        // Layer configurations
        this.layers = {
            outer: {
                count: 5000,
                color: new THREE.Color(0x1a1f3a),  // Dark cosmic blue
                size: 0.03,
                opacity: 0.6,
                radius: 4.0
            },
            middle: {
                count: 3000,
                color: new THREE.Color(0xff9f40),  // Golden amber
                size: 0.05,
                opacity: 0.9,
                radius: 2.5
            },
            inner: {
                count: 2000,
                color: new THREE.Color(0xfff5e1),  // Bright white-yellow
                size: 0.08,
                opacity: 1.0,
                radius: 1.5
            }
        };
        
        // Camera control
        this.cameraDistance = 10;
        this.targetCameraDistance = 10;
        this.minCameraDistance = 3;
        this.maxCameraDistance = 15;
        
        // Rotation control
        this.sphereRotation = 0;
        this.targetRotation = 0;
        
        // Auto-breathing (when no hand)
        this.autoBreathTime = 0;
        this.isHandControlled = false;
        
        // Animation
        this.time = 0;
    }
    
    /**
     * Initialize Three.js scene
     */
    init() {
        console.log('🪐 Initializing Saturn Ring ParticleSystem...');
        
        // Get canvas
        const canvas = document.getElementById('canvas');
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x0a0e1a, 0.01);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 2, this.cameraDistance);
        this.camera.lookAt(0, 0, 0);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x0a0e1a, 1);
        
        // Create particle group
        this.particleGroup = new THREE.Group();
        this.scene.add(this.particleGroup);
        
        // Create three particle layers
        this.createParticleLayer('outer');
        this.createParticleLayer('middle');
        this.createParticleLayer('inner');
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambientLight);
        
        const pointLight = new THREE.PointLight(0xff9f40, 1, 100);
        pointLight.position.set(0, 0, 0);
        this.scene.add(pointLight);
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        console.log('✅ Saturn Ring initialized');
    }
    
    /**
     * Create a particle layer (outer, middle, or inner)
     */
    createParticleLayer(layerName) {
        const config = this.layers[layerName];
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(config.count * 3);
        
        // Distribute particles in a ring/disc shape
        for (let i = 0; i < config.count; i++) {
            const i3 = i * 3;
            
            // Ring distribution (flattened sphere)
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            // Flatten vertically for ring effect
            const verticalFlatten = layerName === 'middle' ? 0.3 : 0.5;
            
            const radius = config.radius * (0.8 + Math.random() * 0.4);
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * verticalFlatten;
            positions[i3 + 2] = radius * Math.cos(phi);
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // Create material
        const material = new THREE.PointsMaterial({
            color: config.color,
            size: config.size,
            transparent: true,
            opacity: config.opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        // Create points
        const particles = new THREE.Points(geometry, material);
        
        // Store reference
        this[`${layerName}Shell`] = particles;
        this.particleGroup.add(particles);
        
        console.log(`  ✨ ${layerName} layer created: ${config.count} particles`);
    }
    
    /**
     * Update from hand tracking data
     * 
     * @param {Object} handData - { detected, distance, rotation }
     */
    updateFromHand(handData) {
        if (handData.detected) {
            this.isHandControlled = true;
            
            // Map hand distance (0=close, 1=far) to camera distance
            this.targetCameraDistance = this.minCameraDistance + 
                (handData.distance * (this.maxCameraDistance - this.minCameraDistance));
            
            // Map hand rotation to sphere rotation
            // Convert degrees to radians
            this.targetRotation = (handData.rotation * Math.PI) / 180;
            
        } else {
            // Gradually return to auto mode
            this.isHandControlled = false;
            this.targetCameraDistance = 10;
            this.targetRotation = 0;
        }
    }
    
    /**
     * Animate particles
     */
    animateParticles() {
        this.time += 0.01;
        
        if (this.isHandControlled) {
            // Hand-controlled: smooth camera zoom
            this.cameraDistance += (this.targetCameraDistance - this.cameraDistance) * 0.08;
            this.camera.position.z = this.cameraDistance;
            
            // Hand-controlled: rotate sphere
            this.sphereRotation += (this.targetRotation - this.sphereRotation) * 0.08;
            this.particleGroup.rotation.y = this.sphereRotation;
            
        } else {
            // Auto-breathing mode
            this.autoBreathTime += 0.01;
            
            // Gentle breathing effect
            const breathScale = 1 + Math.sin(this.autoBreathTime * 2) * 0.05;
            this.particleGroup.scale.set(breathScale, breathScale, breathScale);
            
            // Slow auto-rotation
            this.particleGroup.rotation.y += 0.002;
            this.particleGroup.rotation.x = Math.sin(this.autoBreathTime * 0.5) * 0.1;
            
            // Gentle camera movement
            this.camera.position.x = Math.sin(this.autoBreathTime * 0.3) * 1;
            this.camera.position.y = 2 + Math.cos(this.autoBreathTime * 0.2) * 0.5;
            this.camera.lookAt(0, 0, 0);
        }
        
        // Individual layer animations
        if (this.outerShell) {
            this.outerShell.rotation.z += 0.0003;
        }
        
        if (this.middleRing) {
            this.middleRing.rotation.y += 0.001;
            
            // Pulse the golden ring
            const pulse = 1 + Math.sin(this.time * 3) * 0.05;
            this.middleRing.material.opacity = this.layers.middle.opacity * pulse;
        }
        
        if (this.innerCore) {
            this.innerCore.rotation.x += 0.002;
            
            // Glow pulse for core
            const glow = 1 + Math.sin(this.time * 4) * 0.1;
            this.innerCore.material.size = this.layers.inner.size * glow;
        }
    }
    
    /**
     * Handle window resize
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    /**
     * Render loop
     */
    render() {
        this.animateParticles();
        this.renderer.render(this.scene, this.camera);
    }
}

export default ParticleSystem;
