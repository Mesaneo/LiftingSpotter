// ai-tracker.js
import {FilesetResolver, PoseLandmarker, DrawingUtils}
  from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.10";

class Tracker {
    constructor() {
        this.active = false;
        this.landmarker = null;
        this.video = document.getElementById("ai-video");
        this.canvas = document.getElementById("ai-canvas");
        this.ctx = this.canvas.getContext("2d");
        this.reps = 0;
        this.targetReps = 12;
        this.passedBottom = false;
        this.smoothed = 0;
        
        // DOM Elements
        this.elReps = document.getElementById("hud-reps");
        this.elPct = document.getElementById("currentPct");
        this.elGauge = document.getElementById("gauge-bar");
        
        // Settings
        this.thHigh = 85;
        this.thLow = 50;
        this.minAngle = 50;
        this.maxAngle = 170;

        this.setupControls();
    }

    async init() {
        const fs = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.10/wasm");
        this.landmarker = await PoseLandmarker.createFromOptions(fs, {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task"
            },
            runningMode: "VIDEO", numPoses: 1
        });
        console.log("AI Model Loaded");
    }

    setupControls() {
        document.getElementById('ai-btn-reset').onclick = () => this.reset();
        document.getElementById('targetReps').onchange = (e) => {
            this.targetReps = parseInt(e.target.value) || 12;
        };
    }

    async start(targetReps = 12) {
        if (!this.landmarker) await this.init();
        
        this.targetReps = targetReps;
        document.getElementById('targetReps').value = targetReps;
        this.reset();
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: "user"}, audio: false});
            this.video.srcObject = stream;
            await this.video.play();
            
            this.active = true;
            this.resize();
            this.loop();
        } catch (err) {
            alert("Camera access denied or error: " + err);
        }
    }

    stop() {
        this.active = false;
        if(this.video.srcObject) {
            this.video.srcObject.getTracks().forEach(t => t.stop());
            this.video.srcObject = null;
        }
    }

    resize() {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
    }

    reset() {
        this.reps = 0;
        this.passedBottom = false;
        this.updateUI();
    }

    // --- MATH & LOGIC ---
    angle(a, b, c) {
        const v1 = {x:a.x-b.x, y:a.y-b.y}, v2 = {x:c.x-b.x, y:c.y-b.y};
        const dot = v1.x*v2.x + v1.y*v2.y;
        const mag = Math.hypot(v1.x,v1.y) * Math.hypot(v2.x,v2.y);
        return Math.acos(dot/mag) * 180 / Math.PI;
    }

    calculatePct(ang) {
        return Math.max(0, Math.min(1, (ang - this.minAngle)/(this.maxAngle - this.minAngle))) * 100;
    }

    updateUI() {
        this.elReps.textContent = this.reps;
        this.elPct.textContent = Math.round(this.smoothed) + "%";
        this.elGauge.style.width = this.smoothed + "%";
        
        if(this.smoothed >= this.thHigh) this.elGauge.style.backgroundColor = "#4ade80"; // Green
        else if(this.smoothed <= this.thLow) this.elGauge.style.backgroundColor = "#ff6b2b"; // Orange
        else this.elGauge.style.backgroundColor = "#fff";
    }

    processLogic(pct) {
        if (pct <= this.thLow) this.passedBottom = true;
        if (this.passedBottom && pct >= this.thHigh) {
            this.reps++;
            this.passedBottom = false;
            // Optional: Add sound here
        }
    }

    async loop() {
        if (!this.active) return;
        
        const now = performance.now();
        const results = this.landmarker.detectForVideo(this.video, now);
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.scale(-1, 1);
        this.ctx.translate(-this.canvas.width, 0);

        if (results.landmarks.length > 0) {
            const lms = results.landmarks[0];
            const draw = new DrawingUtils(this.ctx);
            
            // Draw Skeleton
            draw.drawConnectors(lms, PoseLandmarker.POSE_CONNECTIONS, {color: "rgba(255,255,255,0.2)", lineWidth: 1});
            
            // Draw Right Arm Highlight (Shoulder: 12, Elbow: 14, Wrist: 16)
            // You can add logic to swap to Left Arm (11, 13, 15) based on user preference later
            const s = lms[12], e = lms[14], w = lms[16];
            
            this.ctx.lineWidth = 5;
            this.ctx.strokeStyle = "#ff6b2b";
            this.ctx.beginPath();
            this.ctx.moveTo(s.x * this.canvas.width, s.y * this.canvas.height);
            this.ctx.lineTo(e.x * this.canvas.width, e.y * this.canvas.height);
            this.ctx.lineTo(w.x * this.canvas.width, w.y * this.canvas.height);
            this.ctx.stroke();

            // Calculate
            const ang = this.angle(s, e, w);
            const pct = this.calculatePct(ang);
            this.smoothed = this.smoothed * 0.8 + pct * 0.2;
            
            this.processLogic(this.smoothed);
            this.updateUI();
        }

        this.ctx.restore();
        window.requestAnimationFrame(() => this.loop());
    }
}

// Export singleton
export const aiTracker = new Tracker();
