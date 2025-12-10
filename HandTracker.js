/**
 * HandTracker Module
 * 
 * Responsibilities:
 * - Initialize MediaPipe Hands (single hand detection)
 * - Track hand distance from camera (Z-depth)
 * - Track wrist rotation angle
 * - Emit hand update events
 */

class HandTracker {
    constructor() {
        this.hands = null;
        this.camera = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.canvasCtx = null;
        
        // Hand state
        this.handState = {
            detected: false,
            distance: 0.5,        // 0 = close, 1 = far (normalized)
            rotation: 0,          // -180 to 180 degrees
            rawLandmarks: null
        };
        
        // Smoothing
        this.smoothedDistance = 0.5;
        this.smoothedRotation = 0;
        this.smoothingFactor = 0.3;
        
        // Event listeners
        this.listeners = {};
        
        // Debug
        this.showSkeleton = false;
    }
    
    /**
     * Initialize hand tracking
     */
    async init() {
        console.log('👋 Initializing HandTracker...');
        
        try {
            // Get video element
            this.videoElement = document.getElementById('camera-feed');
            this.canvasElement = document.getElementById('skeleton-canvas');
            this.canvasCtx = this.canvasElement.getContext('2d');
            
            // Initialize MediaPipe Hands
            this.hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }
            });
            
            // Configure for single hand, fast detection
            this.hands.setOptions({
                maxNumHands: 1,              // Only one hand
                modelComplexity: 0,          // Fastest model (0, 1, or 2)
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });
            
            // Set up result callback
            this.hands.onResults((results) => this.onResults(results));
            
            // Initialize camera
            await this.initCamera();
            
            console.log('✅ HandTracker initialized');
            
        } catch (error) {
            console.error('❌ HandTracker initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Initialize camera stream
     */
    async initCamera() {
        console.log('📷 Initializing camera...');
        
        try {
            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            this.videoElement.srcObject = stream;
            
            // Wait for video to be ready
            await new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    resolve();
                };
            });
            
            // Set canvas size to match video
            this.canvasElement.width = this.videoElement.videoWidth;
            this.canvasElement.height = this.videoElement.videoHeight;
            
            // Start MediaPipe camera
            this.camera = new Camera(this.videoElement, {
                onFrame: async () => {
                    await this.hands.send({ image: this.videoElement });
                },
                width: 1280,
                height: 720
            });
            
            this.camera.start();
            
            console.log('✅ Camera initialized');
            this.emit('cameraReady', true);
            
        } catch (error) {
            console.error('❌ Camera initialization failed:', error);
            this.emit('cameraError', error);
            throw error;
        }
    }
    
    /**
     * Process hand detection results
     */
    onResults(results) {
        // Clear canvas if showing skeleton
        if (this.showSkeleton) {
            this.canvasCtx.save();
            this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        }
        
        // Check if hand detected
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            
            // Calculate metrics
            this.calculateDistance(landmarks);
            this.calculateRotation(landmarks);
            
            // Update state
            this.handState.detected = true;
            this.handState.rawLandmarks = landmarks;
            
            // Draw skeleton if enabled
            if (this.showSkeleton) {
                this.drawHandSkeleton(landmarks);
            }
            
            // Emit update
            this.emit('handUpdate', {
                detected: true,
                distance: this.smoothedDistance,
                rotation: this.smoothedRotation
            });
            
        } else {
            // No hand detected
            this.handState.detected = false;
            
            this.emit('handUpdate', {
                detected: false,
                distance: this.smoothedDistance,
                rotation: this.smoothedRotation
            });
        }
        
        if (this.showSkeleton) {
            this.canvasCtx.restore();
        }
    }
    
    /**
     * Calculate hand distance from camera (Z-depth)
     * Uses hand size as proxy for distance
     */
    calculateDistance(landmarks) {
        // Calculate distance between wrist (0) and middle finger tip (12)
        const wrist = landmarks[0];
        const middleTip = landmarks[12];
        
        const dx = middleTip.x - wrist.x;
        const dy = middleTip.y - wrist.y;
        const handSize = Math.sqrt(dx * dx + dy * dy);
        
        // Larger hand = closer to camera
        // Normalize: 0.15 (far) to 0.35 (close) → 0 to 1
        let distance = 1 - ((handSize - 0.15) / (0.35 - 0.15));
        distance = Math.max(0, Math.min(1, distance));
        
        // Smooth the value
        this.smoothedDistance += (distance - this.smoothedDistance) * this.smoothingFactor;
        this.handState.distance = this.smoothedDistance;
    }
    
    /**
     * Calculate wrist rotation angle
     * Uses angle between wrist and middle finger base
     */
    calculateRotation(landmarks) {
        // Get wrist (0) and middle finger base (9)
        const wrist = landmarks[0];
        const middleBase = landmarks[9];
        
        // Calculate angle
        const dx = middleBase.x - wrist.x;
        const dy = middleBase.y - wrist.y;
        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        // Normalize to -180 to 180
        angle = ((angle + 180) % 360) - 180;
        
        // Smooth the rotation
        let rotationDelta = angle - this.smoothedRotation;
        
        // Handle wrap-around
        if (rotationDelta > 180) rotationDelta -= 360;
        if (rotationDelta < -180) rotationDelta += 360;
        
        this.smoothedRotation += rotationDelta * this.smoothingFactor;
        this.handState.rotation = this.smoothedRotation;
    }
    
    /**
     * Draw hand skeleton on canvas
     */
    drawHandSkeleton(landmarks) {
        // Draw connections
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],           // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8],           // Index
            [0, 9], [9, 10], [10, 11], [11, 12],      // Middle
            [0, 13], [13, 14], [14, 15], [15, 16],    // Ring
            [0, 17], [17, 18], [18, 19], [19, 20],    // Pinky
            [5, 9], [9, 13], [13, 17]                 // Palm
        ];
        
        this.canvasCtx.strokeStyle = '#ff9f40';
        this.canvasCtx.lineWidth = 3;
        
        connections.forEach(([start, end]) => {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];
            
            this.canvasCtx.beginPath();
            this.canvasCtx.moveTo(
                startPoint.x * this.canvasElement.width,
                startPoint.y * this.canvasElement.height
            );
            this.canvasCtx.lineTo(
                endPoint.x * this.canvasElement.width,
                endPoint.y * this.canvasElement.height
            );
            this.canvasCtx.stroke();
        });
        
        // Draw landmarks
        this.canvasCtx.fillStyle = '#fff5e1';
        landmarks.forEach((landmark) => {
            this.canvasCtx.beginPath();
            this.canvasCtx.arc(
                landmark.x * this.canvasElement.width,
                landmark.y * this.canvasElement.height,
                5,
                0,
                2 * Math.PI
            );
            this.canvasCtx.fill();
        });
    }
    
    /**
     * Toggle skeleton visibility
     */
    toggleSkeleton(show) {
        this.showSkeleton = show;
        this.canvasElement.classList.toggle('visible', show);
        console.log(`🦴 Skeleton: ${show ? 'ON' : 'OFF'}`);
    }
    
    /**
     * Get current hand state
     */
    getHandState() {
        return {
            detected: this.handState.detected,
            distance: this.smoothedDistance,
            rotation: this.smoothedRotation
        };
    }
    
    /**
     * Event emitter pattern
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }
    
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
    
    /**
     * Cleanup
     */
    destroy() {
        if (this.camera) {
            this.camera.stop();
        }
        if (this.videoElement && this.videoElement.srcObject) {
            this.videoElement.srcObject.getTracks().forEach(track => track.stop());
        }
        this.listeners = {};
        console.log('🧹 HandTracker destroyed');
    }
}

export default HandTracker;
