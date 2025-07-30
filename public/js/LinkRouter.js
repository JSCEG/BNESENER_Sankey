class LinkRouter {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.curvature = options.curvature != null ? options.curvature : 0.2;
    this.separation = options.separation != null ? options.separation : 0.02;
    this.parentChildMap = new Map();
  }

  /**
   * Build parent-child relationships and sort links to reduce crossings.
   * @param {Object} data - link arrays {source,target,value,linkColors,linkCustomdata}
   * @param {Array} nodeX - x positions of nodes
   * @returns {Object} reordered arrays
   */
  route(data, nodeX) {
    if (!this.enabled) {
      this.buildMap(data.source, data.target);
      return data;
    }

    const order = [];
    const groups = new Map();
    data.source.forEach((src, i) => {
      if (!groups.has(src)) groups.set(src, []);
      groups.get(src).push(i);
    });

    groups.forEach((indices) => {
      indices.sort((a, b) => {
        const ta = data.target[a];
        const tb = data.target[b];
        if (nodeX && ta !== tb) {
          return (nodeX[ta] || 0) - (nodeX[tb] || 0);
        }
        return data.value[b] - data.value[a];
      });
      order.push(...indices);
    });

    const reorder = (arr) => order.map((i) => arr[i]);

    const routed = {
      source: reorder(data.source),
      target: reorder(data.target),
      value: reorder(data.value),
      linkColors: reorder(data.linkColors),
      linkCustomdata: reorder(data.linkCustomdata),
    };

    this.buildMap(routed.source, routed.target);
    return routed;
  }

  /**
   * Build parent-child map using ordered source and target arrays.
   */
  buildMap(source, target) {
    this.parentChildMap.clear();
    for (let i = 0; i < source.length; i++) {
      const s = source[i];
      const t = target[i];
      if (!this.parentChildMap.has(s)) this.parentChildMap.set(s, []);
      this.parentChildMap.get(s).push(t);
    }
  }

  getHierarchy() {
    return this.parentChildMap;
  }

  getCurvature() {
    return this.curvature;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LinkRouter;
}
