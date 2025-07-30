class ZoomManager {
  constructor(container, options = {}) {
    this.container = container;
    this.target = options.target || container;
    this.scale = 1;
    // Prevent zooming out below the initial size unless explicitly specified
    this.minScale = options.minScale || 1;
    this.maxScale = options.maxScale || 3;
    this.translateX = 0;
    this.translateY = 0;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.activePointers = new Map();
    this.attachEvents();
    this.applyTransform();
  }

  setContainer(container) {
    this.container = container;
    this.applyTransform();
  }

  setTarget(target) {
    this.target = target;
    this.applyTransform();
  }

  attachEvents() {
    this.container.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    this.container.addEventListener('pointerdown', this.onPointerDown.bind(this));
    window.addEventListener('pointermove', this.onPointerMove.bind(this));
    window.addEventListener('pointerup', this.onPointerUp.bind(this));
    window.addEventListener('pointercancel', this.onPointerUp.bind(this));
    this.container.addEventListener('dblclick', () => this.reset());
  }

  onWheel(e) {
    e.preventDefault();
    const rect = this.container.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    // Slightly larger zoom steps for a snappier feel
    const factor = e.deltaY < 0 ? 1.2 : 0.8;
    this.zoomAt(offsetX, offsetY, factor);
  }

  zoomAt(x, y, factor) {
    const newScale = Math.min(this.maxScale, Math.max(this.minScale, this.scale * factor));
    this.translateX -= (x / this.scale - x / newScale);
    this.translateY -= (y / this.scale - y / newScale);
    this.scale = newScale;
    this.applyTransform();
  }

  onPointerDown(e) {
    this.activePointers.set(e.pointerId, e);
    if (this.activePointers.size === 1) {
      this.isDragging = true;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.container.classList.add('dragging');
    } else if (this.activePointers.size === 2) {
      const pts = Array.from(this.activePointers.values());
      this.initialPinchDistance = this.distance(pts[0], pts[1]);
      this.initialScale = this.scale;
      this.isDragging = false;
    }
  }

  onPointerMove(e) {
    if (!this.activePointers.has(e.pointerId)) return;
    this.activePointers.set(e.pointerId, e);
    if (this.activePointers.size === 2) {
      const pts = Array.from(this.activePointers.values());
      const currentDistance = this.distance(pts[0], pts[1]);
      const factor = currentDistance / this.initialPinchDistance;
      const newScale = Math.min(this.maxScale, Math.max(this.minScale, this.initialScale * factor));
      const rect = this.container.getBoundingClientRect();
      const cx = (pts[0].clientX + pts[1].clientX) / 2 - rect.left;
      const cy = (pts[0].clientY + pts[1].clientY) / 2 - rect.top;
      this.translateX -= (cx / this.scale - cx / newScale);
      this.translateY -= (cy / this.scale - cy / newScale);
      this.scale = newScale;
      this.applyTransform();
    } else if (this.isDragging) {
      const dx = (e.clientX - this.startX) / this.scale;
      const dy = (e.clientY - this.startY) / this.scale;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.translateX += dx;
      this.translateY += dy;
      this.applyTransform();
    }
  }

  onPointerUp(e) {
    this.activePointers.delete(e.pointerId);
    if (this.activePointers.size < 2) {
      this.initialPinchDistance = null;
    }
    if (this.activePointers.size === 0) {
      this.isDragging = false;
      this.container.classList.remove('dragging');
    }
  }

  distance(p1, p2) {
    const dx = p1.clientX - p2.clientX;
    const dy = p1.clientY - p2.clientY;
    return Math.hypot(dx, dy);
  }

  applyTransform() {
    const transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    this.target.style.transform = transform;
  }

  reset() {
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.applyTransform();
  }

  zoomIn() {
    this.zoomAt(this.container.clientWidth / 2, this.container.clientHeight / 2, 1.2);
  }

  zoomOut() {
    this.zoomAt(this.container.clientWidth / 2, this.container.clientHeight / 2, 0.8);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ZoomManager;
}
