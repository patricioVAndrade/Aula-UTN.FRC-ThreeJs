// En: ProyectoThreeJS/src/interactionManager.js
// (Reemplaza TODO el archivo con esto)

import * as THREE from 'three';

export class InteractionManager {
  constructor(camera, player, objects, options) {
    this.camera = camera;
    this.player = player;
    this.objects = objects;

    // Elementos del visor PDF
    this.pdfViewer = options.viewer;
    this.pdfFrame = options.frame;
    this.pdfCloseBtn = options.closeBtn;
    
    // Elementos del visor de Tips
    this.tipsBackdrop = document.getElementById('tips-backdrop');
    this.tipsSheet = document.getElementById('tips-sheet');
    this.closeTipsBtn = document.getElementById('close-tips-btn');
    
    this.potential = null;
    this.interactionDist = 2;
    this.videoState = { playing: false, muted: true };

    // === LISTENERS ===

    // Arreglo para el crash: El botón del PDF cierra sin bloquear el mouse
    this.pdfCloseBtn.addEventListener('click', () => this.closePDF(false)); 
    
    this.closeTipsBtn.addEventListener('click', () => this.closeTips());
    
    document.addEventListener('keydown', (e) => this.handleInteraction(e), false);
    document.addEventListener('keydown', (e) => this.handleVideoAudio(e), false);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (this.player.isReadingPDF) {
                this.closePDF(true); // 'true' para bloquear el mouse
            }
            if (this.player.isReadingTips) {
                this.closeTips();
            }
        }
    }, false);
  }

  // ===================================
  // ¡¡¡FUNCIÓN FALTANTE!!!
  // ===================================
  // Escanea objetos cercanos
  scanPotential() {
    // Si estamos en un menú, no buscar interacciones
    if (this.player.isSitting || this.player.isReadingPDF || this.player.isReadingTips) {
      this.potential = null;
      return;
    }

    let closestDist = Infinity;
    this.potential = null;
    const pos = this.player.camera.position;

    // Revisa todos los objetos interactivos
    for (const obj of this.objects) {
      const dist = pos.distanceTo(obj.position);
      const radius = obj.interactionRadius || this.interactionDist;
      
      if (dist < radius && dist < closestDist) {
        closestDist = dist;
        this.potential = obj;
      }
    }
  }

  // Función principal para la tecla 'E'
  handleInteraction(e) {
    
    // Arreglo para "sentarse con W": solo reacciona a la 'E'
    if (e.key !== 'e' && e.key !== 'E') return;

    // Si está leyendo PDF, 'E' lo cierra
    if (this.player.isReadingPDF) {
        this.closePDF(true); // 'true' para bloquear el mouse
        return;
    }
    
    // Si está leyendo Tips, 'E' lo cierra
    if (this.player.isReadingTips) {
        this.closeTips();
        return;
    }

    // Si está sentado, 'E' lo levanta
    if (this.player.isSitting) {
        this.player.standUp();
        return;
    }
    
    // Si hay un objeto "potencial" cerca...
    if (this.potential) {
        // === ¡AQUÍ ESTÁ LA LÓGICA PARA SENTARSE! ===
        if (this.potential.type === 'chair') {
            this.player.sit(this.potential.position, this.potential.quaternion);
            
        } else if (this.potential.type === 'pdf') {
            this.showPDF(this.potential.path);
        
        } else if (this.potential.type === 'tips') {
            this.showTips();
            
        } else if (this.potential.type === 'video') {
            this.toggleVideo();
            
        } else if (this.potential.type === 'link') {
            this.openLink(this.potential.url);
        }
    }
  }

  // --- Lógica de PDF ---
  showPDF(path) {
    this.pdfFrame.src = path;
    this.pdfViewer.style.display = 'block';
    this.player.isReadingPDF = true;
    this.player.controls.unlock();
  }

  // Arreglo para el crash: 'shouldLock' decide si bloquear el mouse
  closePDF(shouldLock = true) {
    this.pdfViewer.style.display = 'none';
    this.pdfFrame.src = '';
    this.player.isReadingPDF = false;
    
    if (shouldLock) {
        this.player.controls.lock();
    }
  }

  // --- Lógica de Tips ---
  showTips() {
    this.tipsBackdrop.style.display = 'block';
    this.tipsSheet.style.display = 'block';
    this.player.isReadingTips = true;
  }

  closeTips() {
    this.tipsBackdrop.style.display = 'none';
    this.tipsSheet.style.display = 'none';
    this.player.isReadingTips = false;
  }
  
  // --- Lógica de Video ---
  toggleVideo() {
    const videoObj = this.objects.find(o => o.type === 'video');
    if (!videoObj) return;
    const iframe = videoObj.iframe;
    
    try {
      const cmd = this.videoState.playing ? 'pauseVideo' : 'playVideo';
      iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: cmd, args: [] }), '*');
      this.videoState.playing = !this.videoState.playing;
    } catch (e) { /* noop */ }
  }

  handleVideoAudio(e) {
    if (e.key !== 'r' && e.key !== 'R') return;

    const nearVideo = this.objects.some(o => o.type === 'video' && this.camera.position.distanceTo(o.position) < (o.interactionRadius || this.interactionDist));
    if (!nearVideo) return;
    
    const videoObj = this.objects.find(o => o.type === 'video');
    if (!videoObj) return;
    const iframe = videoObj.iframe;
    
    try {
      const cmd = this.videoState.muted ? 'unMute' : 'mute';
      iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: cmd, args: [] }), '*');
      this.videoState.muted = !this.videoState.muted;
    } catch (e) { /* noop */ }
  }
  
  openLink(url) {
      window.open(url, '_blank');
  }

} // Fin de la clase InteractionManager