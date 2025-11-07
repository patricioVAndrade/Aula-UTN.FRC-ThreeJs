import * as THREE from 'three';

export class InteractionManager {
  constructor(camera, playerController, interactiveObjects, pdfElements) {
    this.camera = camera;
    this.player = playerController;
    this.objects = interactiveObjects;
    this.pdfViewer = pdfElements.viewer;
    this.pdfFrame = pdfElements.frame;
    this.closeBtn = pdfElements.closeBtn;
    this.potential = null;
    this.interactionDist = 2;
    this.videoState = { playing: false, muted: true };

    this.closeBtn.addEventListener('click', () => this.stopInteraction());
    addEventListener('keydown', e => {
      if (e.code === 'KeyE') {
        if (this.player.isSitting || this.player.isReadingPDF) this.stopInteraction(); else this.handleInteraction();
      }
      if (e.code === 'KeyR') {
        this.toggleVideoSound();
      }
    });
  }

  scanPotential() {
    this.potential = null;
    if (this.player.isSitting || this.player.isReadingPDF) return;
    for (const obj of this.objects) { if (this.camera.position.distanceTo(obj.position) < this.interactionDist) { this.potential = obj; break; } }
  }

  handleInteraction() {
    if (!this.potential) return;
    if (this.potential.type === 'chair') {
      this.player.isSitting = true;
      this.player.camera.position.copy(this.potential.sitPosition);
      this.player.camera.position.y = 1.25;
      this.player.camera.position.z -= 0.25;
      this.player.controls.lock();
    }

    if (this.potential.type === 'pdf') {
      this.player.isReadingPDF = true;
      this.pdfFrame.src = this.potential.path;
      this.pdfViewer.classList.remove('hidden');
      this.player.controls.unlock();
    }

    if (this.potential.type === 'video') {
      // Alternar play/pause usando YouTube IFrame API via postMessage
      const iframe = this.potential.iframe;
      try {
        const cmd = this.videoState.playing ? 'pauseVideo' : 'playVideo';
        iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: cmd, args: [] }), '*');
        this.videoState.playing = !this.videoState.playing;
        // Fallback: si acabamos de pedir play y no arranca, forzar autoplay=1 una sola vez
        if (this.videoState.playing && !iframe.dataset.autoplayBoosted) {
          try {
            const url = new URL(iframe.src);
            if (url.searchParams.get('autoplay') !== '1') {
              url.searchParams.set('autoplay', '1');
              iframe.src = url.toString();
              iframe.dataset.autoplayBoosted = '1';
            }
          } catch (_) { /* noop */ }
        }
      } catch (e) { /* noop */ }
    }
  }

  toggleVideoSound() {
    // Sólo permitir si el jugador está cerca de la pantalla de video (potencial video actual) o cualquier video object cercano
    const nearVideo = this.objects.some(o => o.type === 'video' && this.camera.position.distanceTo(o.position) < this.interactionDist + 0.5);
    if (!nearVideo) return;
    // Mandar comando mute/unMute
    const videoObj = this.objects.find(o => o.type === 'video');
    if (!videoObj) return;
    const iframe = videoObj.iframe;
    try {
      const cmd = this.videoState.muted ? 'unMute' : 'mute';
      iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: cmd, args: [] }), '*');
      this.videoState.muted = !this.videoState.muted;
    } catch (e) { /* noop */ }
  }

  stopInteraction() {
    if (this.player.isSitting) {
      this.player.isSitting = false;
      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);
      dir.y = 0; dir.normalize();
      this.camera.position.addScaledVector(dir, -0.5);
      this.camera.position.y = 1.7;
    }
    if (this.player.isReadingPDF) { this.player.isReadingPDF = false; this.pdfFrame.src = ''; this.pdfViewer.classList.add('hidden'); this.player.controls.lock(); }
  }
}
