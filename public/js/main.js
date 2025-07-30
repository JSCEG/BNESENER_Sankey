const yearSelector = document.getElementById("year-selector");
const sankeyDiv = document.getElementById("sankey-diagram");
const zoomWrapperDiv = document.getElementById("zoom-wrapper");
let dataManager = null;
let styleManager = null;
let layoutEngine = null;
let nodeFactory = null;
let linkManager = null;
let popupManager = null;
let exportManager = null;
let columnLabelsManager = null;
let zoomManager = null;

// Minimum link thickness added to each value after logarithmic scaling
const MIN_LINK_SIZE = 0.25;

// Export Configuration Management
let exportConfig = {
  png: {
    width: 1920,
    height: 1080,
    scale: 2,
  },
  transparentBg: true,
  includeColumnLabels: true,
  filenamePrefix: "sankey_energia",
};

// Cargar los datos desde el archivo JSON y inicializar DataManager
fetch("datos_energia_completo.json")
  .then((response) => response.json())
  .then((data) => {
    try {
      // Inicializar DataManager con los datos cargados
      dataManager = new DataManager(data);

      // Inicializar StyleManager
      styleManager = new StyleManager();

      // Inicializar LayoutEngine
      layoutEngine = new LayoutEngine();

      // Inicializar LinkManager con referencias a otros módulos
      linkManager = new LinkManager({
        dataManager: dataManager,
        styleManager: styleManager,
        nodeFactory: null, // Se asignará después
        popupManager: null, // Se asignará después
      });

      // Inicializar NodeFactory con referencias a otros módulos
      nodeFactory = new NodeFactory({
        dataManager: dataManager,
        styleManager: styleManager,
        layoutEngine: layoutEngine,
        linkManager: linkManager,
      });

      // Asignar NodeFactory al LinkManager
      linkManager.nodeFactory = nodeFactory;

      // Inicializar PopupManager con referencias a otros módulos
      popupManager = new PopupManager({
        dataManager: dataManager,
        styleManager: styleManager,
        nodeFactory: nodeFactory,
      });

      // Asignar PopupManager al LinkManager
      linkManager.popupManager = popupManager;

      // Inicializar ColumnLabelsManager con referencias a otros módulos
      columnLabelsManager = new ColumnLabelsManager({
        enabled: false, // Inicialmente deshabilitado
        layoutEngine: layoutEngine,
        styleManager: styleManager,
      });

      // Aplicar tema por defecto y estilos de popup
      styleManager.applyTheme();
      popupManager.applyPopupStyles();

      // Mostrar estadísticas de los datos cargados
      const stats = dataManager.getDataStats();
      console.log("Datos cargados:", stats);
      console.log(
        "StyleManager inicializado con",
        Object.keys(styleManager.getAllColors()).length,
        "colores",
      );

      // Mostrar estadísticas del LayoutEngine
      const layoutStats = layoutEngine.getLayoutStats();
      console.log(
        "LayoutEngine inicializado con",
        layoutStats.totalColumns,
        "columnas",
      );

      // Mostrar estadísticas del NodeFactory
      const nodeFactoryStats = nodeFactory.getNodeStats();
      console.log(
        "NodeFactory inicializado con",
        nodeFactory.getRegisteredTypes().length,
        "tipos de nodos registrados",
      );

      populateYearSelector();
      // Inicializar controles de etiquetas de columnas
      initializeColumnLabelsControls();
      // Inicializar el gráfico con el primer año disponible
      updateSankey(yearSelector.value);

      // Inicializar ExportManager después de que el diagrama esté listo
      setTimeout(() => {
        try {
          exportManager = new ExportManager(
            sankeyDiv,
            exportConfig,
            columnLabelsManager,
          );
          console.log(
            "ExportManager inicializado correctamente con soporte para etiquetas de columnas",
          );
        } catch (error) {
          console.error("Error inicializando ExportManager:", error);
        }
      }, 1000);
    } catch (error) {
      console.error("Error al inicializar DataManager:", error);
      alert("Error al cargar los datos. Por favor, recarga la página.");
    }
  })
  .catch((error) => {
    console.error("Error al cargar el JSON:", error);
    alert(
      "Error al cargar el archivo de datos. Verifica que el archivo existe.",
    );
  });

// Poblar el selector de años dinámicamente usando DataManager
function populateYearSelector() {
  if (!dataManager) {
    console.error("DataManager no está inicializado");
    return;
  }

  // Usar el método del DataManager para obtener años disponibles
  const sortedYears = dataManager.getAvailableYears();

  // Limpiar opciones existentes
  yearSelector.innerHTML = "";

  sortedYears.forEach((year) => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearSelector.appendChild(option);
  });

  // Añadir el evento para actualizar el gráfico cuando cambia el año
  yearSelector.addEventListener("change", (event) => {
    updateSankey(event.target.value);
  });
}

// Initialize export functionality
function initializeExportControls() {
  const exportConfigBtn = document.getElementById("export-config-btn");
  const exportPngBtn = document.getElementById("export-png-btn");
  const exportSvgBtn = document.getElementById("export-svg-btn");
  const exportModal = document.getElementById("export-modal");
  const exportProgressModal = document.getElementById("export-progress-modal");
  const closeBtn = document.querySelector(".close");
  const saveConfigBtn = document.getElementById("save-config-btn");
  const cancelConfigBtn = document.getElementById("cancel-config-btn");

  // Open configuration modal
  exportConfigBtn.addEventListener("click", () => {
    loadConfigToModal();
    exportModal.style.display = "block";
  });

  // Close modal events
  closeBtn.addEventListener("click", () => {
    exportModal.style.display = "none";
  });

  cancelConfigBtn.addEventListener("click", () => {
    exportModal.style.display = "none";
  });

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === exportModal) {
      exportModal.style.display = "none";
    }
    if (event.target === exportProgressModal) {
      exportProgressModal.style.display = "none";
    }
  });

  // Save configuration
  saveConfigBtn.addEventListener("click", () => {
    saveConfigFromModal();
    exportModal.style.display = "none";
  });

  // Export PNG
  exportPngBtn.addEventListener("click", () => {
    exportDiagram("png");
  });

  // Export SVG
  exportSvgBtn.addEventListener("click", () => {
    exportDiagram("svg");
  });
}

// Load current config to modal
function loadConfigToModal() {
  document.getElementById("png-width").value = exportConfig.png.width;
  document.getElementById("png-height").value = exportConfig.png.height;
  document.getElementById("png-scale").value = exportConfig.png.scale;
  document.getElementById("transparent-bg").checked =
    exportConfig.transparentBg;
  document.getElementById("include-column-labels").checked =
    exportConfig.includeColumnLabels !== false;
  document.getElementById("filename-prefix").value =
    exportConfig.filenamePrefix;
}

// Save config from modal
function saveConfigFromModal() {
  exportConfig.png.width = parseInt(document.getElementById("png-width").value);
  exportConfig.png.height = parseInt(
    document.getElementById("png-height").value,
  );
  exportConfig.png.scale = parseInt(document.getElementById("png-scale").value);
  exportConfig.transparentBg =
    document.getElementById("transparent-bg").checked;
  exportConfig.includeColumnLabels = document.getElementById(
    "include-column-labels",
  ).checked;
  exportConfig.filenamePrefix =
    document.getElementById("filename-prefix").value || "sankey_energia";

  // Update ExportManager configuration if it's initialized
  if (exportManager) {
    exportManager.updateConfig(exportConfig);
    console.log("ExportManager configuration updated:", exportConfig);
  }
}

// Show progress modal
function showProgressModal(format) {
  const progressModal = document.getElementById("export-progress-modal");
  const progressTitle = document.getElementById("progress-title");
  const progressMessage = document.getElementById("progress-message");
  const progressFill = document.getElementById("progress-fill");

  progressTitle.textContent = `Exportando ${format.toUpperCase()}...`;
  progressMessage.textContent = "Preparando imagen para descarga";
  progressFill.style.width = "0%";
  progressModal.style.display = "block";

  return {
    updateProgress: (percent, message) => {
      progressFill.style.width = `${percent}%`;
      if (message) progressMessage.textContent = message;
    },
    close: () => {
      progressModal.style.display = "none";
    },
  };
}

// Export diagram function using ExportManager
async function exportDiagram(format) {
  if (!exportManager) {
    alert(
      "ExportManager no está inicializado. Por favor, espera a que se cargue completamente.",
    );
    return;
  }

  if (!exportManager.isDiagramReady()) {
    alert(
      "El diagrama no está listo para exportar. Por favor, espera a que se cargue completamente.",
    );
    return;
  }

  const progress = showProgressModal(format);
  const currentYear = yearSelector.value;

  try {
    // Disable export buttons during export
    setExportButtonsState(false);

    // Update ExportManager configuration
    exportManager.updateConfig(exportConfig);

    // Prepare export options with current year in filename
    const exportOptions = {
      filename: `${exportConfig.filenamePrefix}_${currentYear}`,
    };

    let result;
    if (format === "png") {
      // Export PNG using ExportManager
      result = await exportManager.exportToPNG(
        exportOptions,
        (percent, message) => {
          progress.updateProgress(percent, message);
        },
      );
    } else if (format === "svg") {
      // Export SVG using ExportManager
      result = await exportManager.exportToSVG(
        exportOptions,
        (percent, message) => {
          progress.updateProgress(percent, message);
        },
      );
    } else {
      throw new Error(`Formato no soportado: ${format}`);
    }

    // Show success message
    console.log(`Exportación ${format.toUpperCase()} exitosa:`, result);

    // Close progress modal after a short delay
    setTimeout(() => {
      progress.close();
    }, 1000);
  } catch (error) {
    console.error("Error durante la exportación:", error);
    progress.close();

    let errorMessage = "Error desconocido durante la exportación";
    if (error.message) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    alert(`Error al exportar ${format.toUpperCase()}: ${errorMessage}`);
  } finally {
    // Re-enable export buttons
    setExportButtonsState(true);
  }
}

// Enable/disable export buttons
function setExportButtonsState(enabled) {
  const exportButtons = document.querySelectorAll(".export-btn");
  exportButtons.forEach((btn) => {
    btn.disabled = !enabled;
  });
}

// Reemplaza la función initializeColumnLabelsControls con esto:
function initializeColumnLabelsControls() {
  console.log("Inicializando controles de etiquetas de columnas...");

  // Forzar la creación de las etiquetas
  // if (columnLabelsManager) {
  //   console.log("Creando etiquetas de columnas...");

  //   // Crear etiqueta para energéticos primarios
  //   columnLabelsManager.addLabel("energeticos_primarios", {
  //     title: "Energéticos Primarios",
  //     description: "Fuentes de energía",
  //     x: 0.23,
  //     y: 0.13,
  //     visible: true,
  //   });
  //   // Crear etiqueta para transformación
  //   columnLabelsManager.addLabel("transformacion", {
  //     title: "Transformación",
  //     description: "Procesos de conversión",
  //     x: 0.4,
  //     y: 0.13,
  //     visible: true,
  //   });

  //   // Crear etiqueta para energeticos secundarios
  //   columnLabelsManager.addLabel("energeticos_secundarios", {
  //     title: "Energéticos Secundarios",
  //     description: "Procesos de conversión",
  //     x: 0.68,
  //     y: 0.13,
  //     visible: true,
  //   });

  //   // Crear etiqueta para consumo
  //   columnLabelsManager.addLabel("usos_finales", {
  //     title: "Usos Finales",
  //     description: "Destino final",
  //     x: 0.9,
  //     y: 0.1,
  //     visible: true,
  //   });

  //   // Forzar que estén habilitadas
  //   columnLabelsManager.setEnabled(true);
  //   console.log("Etiquetas de columnas creadas y habilitadas");

  //   // Forzar redibujado
  //   if (columnLabelsManager.handleResize) {
  //     columnLabelsManager.handleResize();
  //   }
  // } else {
  //   console.error("ColumnLabelsManager no está inicializado");
  // }

  // Manejar redimensionamiento
  window.addEventListener("resize", () => {
    if (columnLabelsManager && columnLabelsManager.isEnabled()) {
      columnLabelsManager.handleResize();
    }
  });

  console.log("Controles de etiquetas de columnas inicializados");
}

// Función para limpiar todas las etiquetas
function clearAllLabels() {
  if (columnLabelsManager) {
    columnLabelsManager.clearAllLabels();
    console.log("Todas las etiquetas removidas");
  }
}

// Initialize export controls when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  initializeExportControls();
  const resetBtn = document.getElementById("reset-view-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (zoomManager) zoomManager.reset();
    });
  }
});

// Función para actualizar el diagrama de Sankey (Etapa 1.7: Añadir Salidas Completas)
function updateSankey(year) {
  console.log(`Actualizando gráfico para el año: ${year}`);

  Plotly.purge(sankeyDiv);

  const labels = [];
  const nodeColors = [];
  const nodeMap = new Map();
  const nodeX = []; // Inicializar arrays de posiciones
  const nodeY = []; // Inicializar arrays de posiciones
  const nodeCustomdata = []; // Nuevo array para el customdata de cada nodo
  const nodeValues = []; // ← aquí

  // --- ARRAYS PARA LOS ENLACES DEL DIAGRAMA SANKEY ---
  const source = [];
  const target = [];
  const value = [];
  const linkColors = [];
  const linkCustomdata = [];

  const ofertaInternaBrutaFullData = dataManager.getNodeData(
    "Oferta Interna Bruta",
  );
  const energeticNodesMap = new Map(); // ← DECLARACIÓN ÚNICA

  function addNode(name, color, nodeType = "default", value = null) {
    if (nodeMap.has(name)) {
      return nodeMap.get(name);
    }
    let finalColor = color;
    if (styleManager) {
      finalColor = styleManager.getEnergyColor(name, nodeType) || color;
    }

    const nodeIndex = labels.length;
    nodeMap.set(name, nodeIndex);

    // Si se proporciona un valor, agregarlo al nombre con salto de línea
    let nodeLabel = name;
    if (value !== null && value !== undefined) {
      const formattedValue = Math.abs(value).toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
      nodeLabel = `${name}<br>${formattedValue} PJ`;
    }

    labels.push(nodeLabel);
    nodeColors.push(finalColor);
    nodeCustomdata.push("");

    +(
      // Inicializa nodeValues con el valor real (o 0)
      (+nodeValues.push(value != null ? value : 0))
    );

    return nodeIndex;
  }

  // --- AQUÍ SE CREAN Y POSICIONAN LOS NODOS ---
  // ——— Nodo y enlaces de Importación ———
  const importacionNodeData = dataManager.getNodeData("Importación");
  console.log(`[DEBUG] Datos de Importación:`, importacionNodeData);

  if (importacionNodeData && ofertaInternaBrutaFullData?.["Nodos Hijo"]) {
    // 1) Calcular breakdown y totalPJ
    const raw = popupManager.calculateNodeBreakdown(
      importacionNodeData,
      year,
      "Energía Primaria",
    );
    console.log(`[DEBUG - Importación] Breakdown Raw para ${year}:`, raw);

    const children = raw.children || raw;
    const totalPJ = Array.isArray(children)
      ? children.reduce((sum, c) => sum + Math.abs(c.value), 0)
      : 0;
    console.log(`[DEBUG] totalPJ Importación: ${totalPJ.toFixed(2)} PJ`);

    // 2) Crear nodo con valor real en PJ
    const idx = addNode(
      importacionNodeData["Nodo Padre"],
      importacionNodeData.color,
      "default",
      totalPJ, // ← este valor dimensiona el nodo
    );
    nodeX[idx] = 0.05;
    nodeY[idx] = 0.05;

    // 3) Generar popup simplificado con { total, unit }
    nodeCustomdata[idx] = popupManager.generateNodePopup(
      importacionNodeData["Nodo Padre"],
      importacionNodeData,
      year,
      { total: totalPJ, unit: "PJ" },
      "text",
      null,
      "simple_source",
    );

    // 4) Enlaces de Energía Primaria → Importación
    ofertaInternaBrutaFullData["Nodos Hijo"]
      .filter((child) => child.tipo === "Energía Primaria")
      .forEach((child) => {
        const val = dataManager.getEnergeticValue(
          "Importación",
          child["Nodo Hijo"],
          year,
        );
        if (val != null && Math.abs(val) > 0) {
          source.push(energeticNodesMap.get(child["Nodo Hijo"]));
          target.push(idx);
          const scaled = Math.log10(Math.abs(val) + 1) + MIN_LINK_SIZE;
          value.push(scaled);
          const col =
            styleManager.getEnergyColor(child["Nodo Hijo"]) || child.color;
          linkColors.push(styleManager.hexToRgba(col, 0.5));
          linkCustomdata.push(
            popupManager.generateLinkPopup(
              child["Nodo Hijo"],
              val,
              child["Nodo Hijo"],
              importacionNodeData["Nodo Padre"],
              col,
              year,
              { flowType: "primary_supply" },
            ),
          );
        }
      });
  } else {
    console.error(
      "Error: datos de 'Importación' o sus 'Nodos Hijo' no disponibles.",
    );
  }

  // ——— Nodo y enlaces de Producción ———
  const produccionNodeData = dataManager.getNodeData("Producción");
  console.log(`[DEBUG] Datos de Producción:`, produccionNodeData);

  if (produccionNodeData && ofertaInternaBrutaFullData?.["Nodos Hijo"]) {
    // 1) Calcular breakdown y totalPJ
    const raw = popupManager.calculateNodeBreakdown(
      produccionNodeData,
      year,
      "Energía Primaria",
    );
    console.log(
      `[DEBUG - Producción] Breakdown Raw (Primaria) para ${year}:`,
      raw,
    );

    const children = raw.children || raw;
    const totalPJ = Array.isArray(children)
      ? children.reduce((sum, c) => sum + Math.abs(c.value), 0)
      : 0;
    console.log(`[DEBUG] totalPJ Producción: ${totalPJ.toFixed(2)} PJ`);

    // 2) Crear nodo con valor real en PJ
    const idx = addNode(
      produccionNodeData["Nodo Padre"],
      produccionNodeData.color,
      "default",
      totalPJ, // ← este valor dimensiona el nodo
    );
    nodeX[idx] = 0.05;
    nodeY[idx] = 0.4;

    // 3) Generar popup simplificado con { total, unit }
    nodeCustomdata[idx] = popupManager.generateNodePopup(
      produccionNodeData["Nodo Padre"],
      produccionNodeData,
      year,
      { total: totalPJ, unit: "PJ" },
      "text",
      null,
      "simple_source",
    );

    // 4) (Opcional) Enlaces de Energía Primaria → Producción
    ofertaInternaBrutaFullData["Nodos Hijo"]
      .filter((child) => child.tipo === "Energía Primaria")
      .forEach((child) => {
        const val = dataManager.getEnergeticValue(
          "Producción",
          child["Nodo Hijo"],
          year,
        );
        if (val != null && Math.abs(val) > 0) {
          source.push(energeticNodesMap.get(child["Nodo Hijo"]));
          target.push(idx);
          const scaled = Math.log10(Math.abs(val) + 1) + MIN_LINK_SIZE;
          value.push(scaled);
          const col =
            styleManager.getEnergyColor(child["Nodo Hijo"]) || child.color;
          linkColors.push(styleManager.hexToRgba(col, 0.5));
          linkCustomdata.push(
            popupManager.generateLinkPopup(
              child["Nodo Hijo"],
              val,
              child["Nodo Hijo"],
              produccionNodeData["Nodo Padre"],
              col,
              year,
              { flowType: "primary_supply" },
            ),
          );
        }
      });
  } else {
    console.error(
      "Error: datos de 'Producción' o sus 'Nodos Hijo' no disponibles.",
    );
  }

  // Agregar Variación de Inventarios
  // ——— Nodo y enlaces de Variación de Inventarios ———
  const variacionNodeData = dataManager.getNodeData("Variación de Inventarios");
  if (variacionNodeData && ofertaInternaBrutaFullData?.["Nodos Hijo"]) {
    // 1) Breakdown y sumas
    const raw = popupManager.calculateNodeBreakdown(
      variacionNodeData,
      year,
      "Energía Primaria",
    );
    const inputTotal = raw.input_total || 0;
    const outputTotal = raw.output_total || 0;
    const totalPJ = inputTotal + outputTotal;

    // 2) Creamos el nodo con el nombre original y totalPJ
    const idx = addNode(
      variacionNodeData["Nodo Padre"], // clave original
      variacionNodeData.color,
      "default",
      totalPJ, // tamaño
    );
    nodeX[idx] = 0.05;
    nodeY[idx] = 0.2;

    // 3) Sobrescribimos SOLO la etiqueta para mostrar flechas
    labels[idx] =
      `${variacionNodeData["Nodo Padre"]}<br>` +
      `↑ ${inputTotal.toFixed(2)} PJ  ↓ ${outputTotal.toFixed(2)} PJ`;

    // 4) Popup con tu template
    nodeCustomdata[idx] = popupManager.generateNodePopup(
      variacionNodeData["Nodo Padre"],
      variacionNodeData,
      year,
      {
        variacion_positiva: inputTotal,
        variacion_negativa: outputTotal,
        unit: "PJ",
      },
      "text",
      null,
      "simple_source",
    );

    // 5) Enlaces (positivo sale, negativo entra)
    ofertaInternaBrutaFullData["Nodos Hijo"]
      .filter((c) => c.tipo === "Energía Primaria")
      .forEach((child) => {
        const val = dataManager.getEnergeticValue(
          "Variación de Inventarios",
          child["Nodo Hijo"],
          year,
        );
        if (val != null && val !== 0) {
          const src = val > 0 ? idx : energeticNodesMap.get(child["Nodo Hijo"]);
          const tgt = val > 0 ? energeticNodesMap.get(child["Nodo Hijo"]) : idx;
          source.push(src);
          target.push(tgt);
          const scaled = Math.log10(Math.abs(val) + 1) + MIN_LINK_SIZE;
          value.push(scaled);
          const col =
            styleManager.getEnergyColor(child["Nodo Hijo"]) || child.color;
          linkColors.push(styleManager.hexToRgba(col, 0.5));
          linkCustomdata.push(
            popupManager.generateLinkPopup(
              child["Nodo Hijo"],
              val,
              variacionNodeData["Nodo Padre"],
              child["Nodo Hijo"],
              col,
              year,
              { flowType: "inventory_change_primaria" },
            ),
          );
        }
      });
  }

  // --- Nodos de Energéticos Primarios de Oferta Interna Bruta ---

  // const energeticNodesMap = new Map(); // Para almacenar los índices de los nuevos nodos de energéticos

  if (ofertaInternaBrutaFullData && ofertaInternaBrutaFullData["Nodos Hijo"]) {
    const primaryEnergetics = ofertaInternaBrutaFullData["Nodos Hijo"].filter(
      (child) => child.tipo === "Energía Primaria",
    );

    // Calcular posiciones Y para distribuir los nodos de energéticos
    const startY = 0.15; // Posición inicial
    const endY = 0.9; // Posición final
    const stepY = (endY - startY) / (primaryEnergetics.length - 1 || 1); // Paso entre nodos

    primaryEnergetics.forEach((energetic, index) => {
      const energeticName = energetic["Nodo Hijo"];
      const energeticColor =
        styleManager.getEnergyColor(energeticName) || energetic.color; // Obtener color del StyleManager o del dato

      // Obtener el valor del energético antes de crear el nodo
      const energeticValue = dataManager.getEnergeticValue(
        "Oferta Interna Bruta",
        energeticName,
        year,
      );

      const energeticIndex = addNode(
        energeticName,
        energeticColor,
        "default",
        energeticValue,
      );
      energeticNodesMap.set(energeticName, energeticIndex); // Guardar el índice

      nodeX[energeticIndex] = 0.2; // Columna de Oferta Interna Bruta
      nodeY[energeticIndex] = startY + index * stepY; // Distribuir verticalmente

      // Generar customdata sencillo para cada energético
      let energeticPopupData = {};
      if (energeticValue !== null) {
        energeticPopupData.total = energeticValue; // Usar 'total' para el simple_source template
      }

      nodeCustomdata[energeticIndex] = popupManager.generateNodePopup(
        energeticName,
        energetic,
        year,
        energeticPopupData,
        "text",
        "Energía Primaria",
        "simple_source",
      );
    });
  } else {
    console.error(
      "Error: Datos de 'Oferta Interna Bruta' o sus hijos no encontrados para crear energéticos primarios.",
    );
  }

  // ——— Nodo y enlaces de Exportación ———
  const exportacionNodeData = dataManager.getNodeData("Exportación");
  console.log(`[DEBUG] Datos de Exportación:`, exportacionNodeData);

  if (exportacionNodeData && ofertaInternaBrutaFullData?.["Nodos Hijo"]) {
    // 1) Calcular breakdown y totalPJ
    const raw = popupManager.calculateNodeBreakdown(
      exportacionNodeData,
      year,
      "Energía Primaria",
    );
    console.log(`[DEBUG - Exportación] Breakdown Raw para ${year}:`, raw);

    const children = raw.children || raw;
    const totalPJ = Array.isArray(children)
      ? children.reduce((sum, c) => sum + Math.abs(c.value), 0)
      : 0;
    console.log(`[DEBUG] totalPJ Exportación: ${totalPJ.toFixed(2)} PJ`);

    // 2) Crear nodo con valor real en PJ
    const idx = addNode(
      exportacionNodeData["Nodo Padre"],
      exportacionNodeData.color,
      "default",
      totalPJ, // ← este valor dimensiona el nodo
    );
    nodeX[idx] = 0.3;
    nodeY[idx] = 0.99;
    // nodeValues[idx] ya queda inicializado dentro de addNode

    // 3) Generar popup simplificado con { total, unit }
    nodeCustomdata[idx] = popupManager.generateNodePopup(
      exportacionNodeData["Nodo Padre"],
      exportacionNodeData,
      year,
      { total: totalPJ, unit: "PJ" },
      "text",
      null,
      "simple_source",
    );

    // 4) Enlaces de Energía Primaria → Exportación
    ofertaInternaBrutaFullData["Nodos Hijo"]
      .filter((child) => child.tipo === "Energía Primaria")
      .forEach((child) => {
        const val = dataManager.getEnergeticValue(
          "Exportación",
          child["Nodo Hijo"],
          year,
        );
        if (val != null && Math.abs(val) > 0) {
          source.push(energeticNodesMap.get(child["Nodo Hijo"]));
          target.push(idx);
          const scaled = Math.log10(Math.abs(val) + 1) + MIN_LINK_SIZE;
          value.push(scaled);
          const col =
            styleManager.getEnergyColor(child["Nodo Hijo"]) || child.color;
          linkColors.push(styleManager.hexToRgba(col, 0.5));
          linkCustomdata.push(
            popupManager.generateLinkPopup(
              child["Nodo Hijo"],
              val,
              child["Nodo Hijo"],
              exportacionNodeData["Nodo Padre"],
              col,
              year,
              { flowType: "primary_demand" },
            ),
          );
        }
      });
  } else {
    console.error(
      "Error: datos de 'Exportación' o sus 'Nodos Hijo' no disponibles.",
    );
  }

  // ——— Nodo y enlaces de Consumo Propio del Sector de Energéticos Primarios ———
  const consumoPropioNodeData = dataManager.getNodeData(
    "Consumo Propio del Sector",
  );
  console.log(
    `[DEBUG] Datos de Consumo Propio del Sector:`,
    consumoPropioNodeData,
  );

  if (consumoPropioNodeData && ofertaInternaBrutaFullData?.["Nodos Hijo"]) {
    // 1) Calcular breakdown y totalPJ
    const raw = popupManager.calculateNodeBreakdown(
      consumoPropioNodeData,
      year,
      "Energía Primaria",
    );
    console.log(`[DEBUG - Consumo Propio] Breakdown Raw para ${year}:`, raw);

    const children = raw.children || raw;
    const totalPJ = Array.isArray(children)
      ? children.reduce((sum, c) => sum + Math.abs(c.value), 0)
      : 0;
    console.log(`[DEBUG] totalPJ Consumo Propio: ${totalPJ.toFixed(2)} PJ`);

    // 2) Crear nodo con valor real en PJ
    const idx = addNode(
      consumoPropioNodeData["Nodo Padre"],
      consumoPropioNodeData.color,
      "default",
      totalPJ, // ← valor que dimensiona el nodo
    );
    nodeX[idx] = 0.3;
    nodeY[idx] = 0.94;

    // 3) Generar popup con { total, unit }
    nodeCustomdata[idx] = popupManager.generateNodePopup(
      consumoPropioNodeData["Nodo Padre"],
      consumoPropioNodeData,
      year,
      { total: totalPJ, unit: "PJ" },
      "text",
      null,
      "simple_source",
    );

    // 4) Enlaces de Energía Primaria → este nodo
    ofertaInternaBrutaFullData["Nodos Hijo"]
      .filter((child) => child.tipo === "Energía Primaria")
      .forEach((child) => {
        const val = dataManager.getEnergeticValue(
          "Consumo Propio del Sector",
          child["Nodo Hijo"],
          year,
        );
        if (val != null && Math.abs(val) > 0) {
          source.push(energeticNodesMap.get(child["Nodo Hijo"]));
          target.push(idx);
          const scaled = Math.log10(Math.abs(val) + 1) + MIN_LINK_SIZE;
          value.push(scaled);
          const col =
            styleManager.getEnergyColor(child["Nodo Hijo"]) || "#999999";
          linkColors.push(styleManager.hexToRgba(col, 0.5));
          linkCustomdata.push(
            popupManager.generateLinkPopup(
              child["Nodo Hijo"],
              val,
              child["Nodo Hijo"],
              consumoPropioNodeData["Nodo Padre"],
              col,
              year,
              { flowType: "consumo_propio_primaria" },
            ),
          );
        }
      });
  } else {
    console.error(
      "Error: datos de 'Consumo Propio del Sector' o sus 'Nodos Hijo' no disponibles.",
    );
  }

  // ——— Nodo y enlaces de Pérdidas Técnicas por Transporte, Transmisión y Distribución ———
  const perdidasTecnicasNodeData = dataManager.getNodeData(
    "Pérdidas técnicas por transporte, transmisión y distribución",
  );
  console.log(
    `[DEBUG] Datos de Pérdidas Técnicas por Transporte, Transmisión y Distribución:`,
    perdidasTecnicasNodeData,
  );

  if (perdidasTecnicasNodeData && ofertaInternaBrutaFullData?.["Nodos Hijo"]) {
    // 1) Breakdown y totalPJ
    const raw = popupManager.calculateNodeBreakdown(
      perdidasTecnicasNodeData,
      year,
      "Energía Primaria",
    );
    console.log(`[DEBUG - Pérdidas Técnicas] Breakdown Raw para ${year}:`, raw);

    const children = raw.children || raw;
    const totalPJ = Array.isArray(children)
      ? children.reduce((sum, c) => sum + Math.abs(c.value), 0)
      : 0;
    console.log(`[DEBUG] totalPJ Pérdidas Técnicas: ${totalPJ.toFixed(2)} PJ`);

    // 2) Crear nodo con valor real en PJ
    const idx = addNode(
      perdidasTecnicasNodeData["Nodo Padre"],
      perdidasTecnicasNodeData.color,
      "default",
      totalPJ, // ← este valor dimensiona el nodo
    );
    nodeX[idx] = 0.3;
    nodeY[idx] = 0.9;

    // 3) Popup simplificado con { total, unit }
    nodeCustomdata[idx] = popupManager.generateNodePopup(
      perdidasTecnicasNodeData["Nodo Padre"],
      perdidasTecnicasNodeData,
      year,
      { total: totalPJ, unit: "PJ" },
      "text",
      null,
      "simple_source",
    );

    // 4) Enlaces de Energía Primaria → este nodo
    ofertaInternaBrutaFullData["Nodos Hijo"]
      .filter((child) => child.tipo === "Energía Primaria")
      .forEach((child) => {
        const val = dataManager.getEnergeticValue(
          "Pérdidas técnicas por transporte, transmisión y distribución",
          child["Nodo Hijo"],
          year,
        );
        if (val != null && Math.abs(val) > 0) {
          source.push(energeticNodesMap.get(child["Nodo Hijo"]));
          target.push(idx);
          const scaled = Math.log10(Math.abs(val) + 1) + MIN_LINK_SIZE;
          value.push(scaled);
          const col =
            styleManager.getEnergyColor(child["Nodo Hijo"]) || "#999999";
          linkColors.push(styleManager.hexToRgba(col, 0.5));
          linkCustomdata.push(
            popupManager.generateLinkPopup(
              child["Nodo Hijo"],
              val,
              child["Nodo Hijo"],
              perdidasTecnicasNodeData["Nodo Padre"],
              col,
              year,
              { flowType: "perdidas_tecnicas" },
            ),
          );
        }
      });
  } else {
    console.error(
      "Error: datos de 'Pérdidas técnicas por transporte, transmisión y distribución' o sus 'Nodos Hijo' no disponibles.",
    );
  }

  // ——— Nodo y enlaces de Energía No Aprovechada ———
  const energiaNoAprovechadaNodeData = dataManager.getNodeData(
    "Energía No Aprovechada",
  );
  console.log(
    `[DEBUG] Datos de Energía No Aprovechada:`,
    energiaNoAprovechadaNodeData,
  );

  if (
    energiaNoAprovechadaNodeData &&
    ofertaInternaBrutaFullData?.["Nodos Hijo"]
  ) {
    // 1) Calcular breakdown y totalPJ
    const raw = popupManager.calculateNodeBreakdown(
      energiaNoAprovechadaNodeData,
      year,
      "Energía Primaria",
    );
    console.log(
      `[DEBUG - Energía No Aprovechada] Breakdown Raw para ${year}:`,
      raw,
    );

    const children = raw.children || raw;
    const totalPJ = Array.isArray(children)
      ? children.reduce((sum, c) => sum + Math.abs(c.value), 0)
      : 0;
    console.log(
      `[DEBUG] totalPJ Energía No Aprovechada: ${totalPJ.toFixed(2)} PJ`,
    );

    // 2) Crear el nodo con su valor real en PJ
    const idx = addNode(
      energiaNoAprovechadaNodeData["Nodo Padre"],
      energiaNoAprovechadaNodeData.color,
      "default",
      totalPJ, // ← este valor dimensiona el nodo
    );
    nodeX[idx] = 0.3;
    nodeY[idx] = 0.85;
    // nodeValues[idx] ya se inicializa dentro de addNode

    // 3) Generar popup con { total, unit }
    nodeCustomdata[idx] = popupManager.generateNodePopup(
      energiaNoAprovechadaNodeData["Nodo Padre"],
      energiaNoAprovechadaNodeData,
      year,
      { total: totalPJ, unit: "PJ" },
      "text",
      null,
      "simple_source",
    );

    // 4) Enlaces de Energía Primaria hacia este nodo
    ofertaInternaBrutaFullData["Nodos Hijo"]
      .filter((child) => child.tipo === "Energía Primaria")
      .forEach((child) => {
        const val = dataManager.getEnergeticValue(
          "Energía No Aprovechada",
          child["Nodo Hijo"],
          year,
        );
        if (val != null && Math.abs(val) > 0) {
          source.push(energeticNodesMap.get(child["Nodo Hijo"]));
          target.push(idx);
          const scaled = Math.log10(Math.abs(val) + 1) + MIN_LINK_SIZE;
          value.push(scaled);
          const col =
            styleManager.getEnergyColor(child["Nodo Hijo"]) || child.color;
          linkColors.push(styleManager.hexToRgba(col, 0.5));
          linkCustomdata.push(
            popupManager.generateLinkPopup(
              child["Nodo Hijo"],
              val,
              child["Nodo Hijo"],
              energiaNoAprovechadaNodeData["Nodo Padre"],
              col,
              year,
              { flowType: "primary_demand" },
            ),
          );
        }
      });
  } else {
    console.error(
      "Error: datos de 'Energía No Aprovechada' o sus 'Nodos Hijo' no disponibles.",
    );
  }

  // ——— Nodo y enlaces de Coquizadoras y Hornos ———
  const coquizadorasyhornosNodeData = dataManager.getNodeData(
    "Coquizadoras y Hornos",
  );
  console.log(
    `[DEBUG] Datos de Coquizadoras y Hornos:`,
    coquizadorasyhornosNodeData,
  );

  if (
    coquizadorasyhornosNodeData &&
    ofertaInternaBrutaFullData?.["Nodos Hijo"]
  ) {
    // 1) Calcular breakdown y totalPJ
    const raw = popupManager.calculateNodeBreakdown(
      coquizadorasyhornosNodeData,
      year,
      "Energía Primaria",
    );
    console.log(
      `[DEBUG - Coquizadoras y Hornos] Breakdown Raw para ${year}:`,
      raw,
    );

    const children = raw.children || raw;
    const totalPJ = Array.isArray(children)
      ? children.reduce((sum, c) => sum + Math.abs(c.value), 0)
      : 0;
    console.log(
      `[DEBUG] totalPJ Coquizadoras y Hornos: ${totalPJ.toFixed(2)} PJ`,
    );

    // 2) Crear nodo con valor real en PJ
    const idx = addNode(
      coquizadorasyhornosNodeData["Nodo Padre"],
      coquizadorasyhornosNodeData.color,
      "default",
      totalPJ, // ← este valor dimensiona el nodo
    );
    nodeX[idx] = 0.35;
    nodeY[idx] = 0.1;
    // nodeValues[idx] ya queda inicializado a totalPJ dentro de addNode

    // 3) Generar popup simplificado con { total, unit }
    nodeCustomdata[idx] = popupManager.generateNodePopup(
      coquizadorasyhornosNodeData["Nodo Padre"],
      coquizadorasyhornosNodeData,
      year,
      { total: totalPJ, unit: "PJ" },
      "text",
      null,
      "simple_source",
    );

    // 4) Enlaces de Energía Primaria → Coquizadoras y Hornos
    ofertaInternaBrutaFullData["Nodos Hijo"]
      .filter((child) => child.tipo === "Energía Primaria")
      .forEach((child) => {
        const val = dataManager.getEnergeticValue(
          "Coquizadoras y Hornos",
          child["Nodo Hijo"],
          year,
        );
        if (val != null && Math.abs(val) > 0) {
          source.push(energeticNodesMap.get(child["Nodo Hijo"]));
          target.push(idx);
          const scaled = Math.log10(Math.abs(val) + 1) + MIN_LINK_SIZE;
          value.push(scaled);
          const col =
            styleManager.getEnergyColor(child["Nodo Hijo"]) || child.color;
          linkColors.push(styleManager.hexToRgba(col, 0.5));
          linkCustomdata.push(
            popupManager.generateLinkPopup(
              child["Nodo Hijo"],
              val,
              child["Nodo Hijo"],
              coquizadorasyhornosNodeData["Nodo Padre"],
              col,
              year,
              { flowType: "primary_demand" },
            ),
          );
        }
      });
  } else {
    console.error(
      "Error: datos para 'Coquizadoras y Hornos' o sus 'Nodos Hijo' no disponibles.",
    );
  }

  // ——— Nodo y enlaces de Plantas de Gas y Fraccionadoras ———
  const plantasdegasyfraccionadorasNodeData = dataManager.getNodeData(
    "Plantas de Gas y Fraccionadoras",
  );
  console.log(
    `[DEBUG] Datos de Plantas de Gas y Fraccionadoras:`,
    plantasdegasyfraccionadorasNodeData,
  );

  if (
    plantasdegasyfraccionadorasNodeData &&
    ofertaInternaBrutaFullData?.["Nodos Hijo"]
  ) {
    // 1) calcular breakdown y totalPJ
    const raw = popupManager.calculateNodeBreakdown(
      plantasdegasyfraccionadorasNodeData,
      year,
      "Energía Primaria",
    );
    console.log(
      `[DEBUG] Breakdown Raw Plantas de Gas y Fracc. para ${year}:`,
      raw,
    );

    const children = raw.children || raw;
    const totalPJ = Array.isArray(children)
      ? children.reduce((sum, c) => sum + Math.abs(c.value), 0)
      : 0;
    console.log(
      `[DEBUG] totalPJ Plantas de Gas y Fracc.: ${totalPJ.toFixed(2)} PJ`,
    );

    // 2) crear nodo con su valor real en PJ
    const idx = addNode(
      plantasdegasyfraccionadorasNodeData["Nodo Padre"],
      plantasdegasyfraccionadorasNodeData.color,
      "default",
      totalPJ, // ← valor que dimensiona el nodo
    );
    nodeX[idx] = 0.35;
    nodeY[idx] = 0.25;
    // nodeValues[idx] ya inicializa totalPJ dentro de addNode

    // 3) generar popup solo con total y unidad
    nodeCustomdata[idx] = popupManager.generateNodePopup(
      plantasdegasyfraccionadorasNodeData["Nodo Padre"],
      plantasdegasyfraccionadorasNodeData,
      year,
      { total: totalPJ, unit: "PJ" },
      "text",
      null,
      "simple_source",
    );

    // 4) crear enlaces de Energía Primaria → este nodo
    ofertaInternaBrutaFullData["Nodos Hijo"]
      .filter((child) => child.tipo === "Energía Primaria")
      .forEach((child) => {
        const val = dataManager.getEnergeticValue(
          "Plantas de Gas y Fraccionadoras",
          child["Nodo Hijo"],
          year,
        );
        if (val != null && Math.abs(val) > 0) {
          source.push(energeticNodesMap.get(child["Nodo Hijo"]));
          target.push(idx);
          const scaled = Math.log10(Math.abs(val) + 1) + MIN_LINK_SIZE;
          value.push(scaled);
          const col =
            styleManager.getEnergyColor(child["Nodo Hijo"]) || child.color;
          linkColors.push(styleManager.hexToRgba(col, 0.5));
          linkCustomdata.push(
            popupManager.generateLinkPopup(
              child["Nodo Hijo"],
              val,
              child["Nodo Hijo"],
              plantasdegasyfraccionadorasNodeData["Nodo Padre"],
              col,
              year,
              { flowType: "primary_demand" },
            ),
          );
        }
      });
  } else {
    console.error(
      "Error: datos de 'Plantas de Gas y Fraccionadoras' o sus 'Nodos Hijo' no disponibles.",
    );
  }

  // --- Nodo de Refinerías y Despuntadoras ---
  const refinerasydespuntadorasNodeData = dataManager.getNodeData(
    "Refinerías y Despuntadoras",
  );
  console.log(
    `[DEBUG] Datos de Refinerías y Despuntadoras:`,
    refinerasydespuntadorasNodeData,
  );

  if (
    refinerasydespuntadorasNodeData &&
    ofertaInternaBrutaFullData?.["Nodos Hijo"]
  ) {
    // 1) Calcular el desglose de Energía Primaria
    const breakdownRaw = popupManager.calculateNodeBreakdown(
      refinerasydespuntadorasNodeData,
      year,
      "Energía Primaria",
    );
    console.log(`[DEBUG] Breakdown Raw para Refinerías:`, breakdownRaw);

    // 2) Extraer hijos y sumar valores absolutos ⇒ totalPJ
    const children = breakdownRaw.children || breakdownRaw;
    const totalPJ = Array.isArray(children)
      ? children.reduce((sum, c) => sum + Math.abs(c.value), 0)
      : 0;
    console.log(
      `[DEBUG] totalPJ Refinerías y Despuntadoras: ${totalPJ.toFixed(2)} PJ`,
    );

    // 3) Crear nodo con su valor real
    const idx = addNode(
      refinerasydespuntadorasNodeData["Nodo Padre"],
      refinerasydespuntadorasNodeData.color,
      "default",
      totalPJ, // ← aquí pasamos totalPJ
    );
    nodeX[idx] = 0.35;
    nodeY[idx] = 0.7;
    // nodeValues ya se inicializa dentro de addNode

    // 4) Generar popup con { total, unit }
    nodeCustomdata[idx] = popupManager.generateNodePopup(
      refinerasydespuntadorasNodeData["Nodo Padre"],
      refinerasydespuntadorasNodeData,
      year,
      { total: totalPJ, unit: "PJ" },
      "text",
      null,
      "simple_source",
    );

    // 5) Enlaces de Energía Primaria → Refinerías y Despuntadoras
    ofertaInternaBrutaFullData["Nodos Hijo"]
      .filter((child) => child.tipo === "Energía Primaria")
      .forEach((child) => {
        const val = dataManager.getEnergeticValue(
          "Refinerías y Despuntadoras",
          child["Nodo Hijo"],
          year,
        );
        if (val != null && Math.abs(val) > 0) {
          source.push(energeticNodesMap.get(child["Nodo Hijo"]));
          target.push(idx);
          const scaled = Math.log10(Math.abs(val) + 1) + MIN_LINK_SIZE;
          value.push(scaled);
          const col =
            styleManager.getEnergyColor(child["Nodo Hijo"]) || child.color;
          linkColors.push(styleManager.hexToRgba(col, 0.5));
          linkCustomdata.push(
            popupManager.generateLinkPopup(
              child["Nodo Hijo"],
              val,
              child["Nodo Hijo"],
              "Refinerías y Despuntadoras",
              col,
              year,
              { flowType: "primary_demand" },
            ),
          );
        }
      });
  } else {
    console.error(
      "Error: Datos para 'Refinerías y Despuntadoras' no encontrados o estructura de 'Nodos Hijo' faltante.",
    );
  }
  // --- Nodo de Centrales Eléctricas ---
  const centraleselectricasNodeData = dataManager.getNodeData(
    "Centrales Eléctricas",
  );
  console.log(
    `[DEBUG] Datos de Centrales Eléctricas:`,
    centraleselectricasNodeData,
  );
  if (centraleselectricasNodeData) {
    // Calcular el desglose para obtener el valor de energía eléctrica generada
    const centraleselectricasBreakdownForPopup =
      popupManager.calculateNodeBreakdown(
        centraleselectricasNodeData,
        year,
        "Energía Secundaria",
      );
    console.log(
      `[DEBUG - Centrales Eléctricas] Breakdown (Energía Eléctrica) para ${year}:`,
      centraleselectricasBreakdownForPopup,
    );

    // Buscar la entrada de Energía eléctrica (notar la tilde en "eléctrica")
    const electricidadEntry =
      centraleselectricasBreakdownForPopup?.children?.find(
        (child) => child.name === "Energía eléctrica" && child.isInput,
      );

    // Si no la encontramos, mostramos un mensaje de error
    if (!electricidadEntry) {
      console.error(
        "No se encontró la entrada de Energía eléctrica en el breakdown",
      );
      console.log(
        "Entradas disponibles:",
        centraleselectricasBreakdownForPopup.children?.map((c) => c.name),
      );
    }

    // Usamos el valor de la entrada o 0 si no se encuentra
    const energiaElectricaGenerada = Math.abs(electricidadEntry?.value || 0);

    // Crear el nodo con el valor calculado
    const centraleselectricasIndex = addNode(
      centraleselectricasNodeData["Nodo Padre"],
      centraleselectricasNodeData.color,
      "default",
      energiaElectricaGenerada,
    );
    nodeX[centraleselectricasIndex] = 0.45; // Posición horizontal
    nodeY[centraleselectricasIndex] = 0.45; // Posición vertical

    // Crear un objeto con el total de energía eléctrica generada
    const electricidadData = {
      total: energiaElectricaGenerada,
      unit: "PJ",
    };

    nodeCustomdata[centraleselectricasIndex] = popupManager.generateNodePopup(
      centraleselectricasNodeData["Nodo Padre"],
      centraleselectricasNodeData,
      year,
      electricidadData,
      "text",
      null,
      "simple_source",
    );
  } else {
    console.error(
      "Error: Datos para 'Centrales Eléctricas' no encontrados en DataManager.",
    );
  }

  // --- Nodos de Energéticos Secundarios de Oferta Interna Bruta ---
  const primaryEnergeticNodesMap = new Map(); // Mapa para los nodos de energéticos primarios
  // 1. Agregar nodos de energía primaria
  // const primaryEnergetics = ofertaInternaBrutaFullData['Nodos Hijo']
  //     .filter(child => child.tipo === 'Energía Primaria' && child[year] > 0);
  const secondaryEnergeticNodesMap = new Map(); // Mapa para los nodos de energéticos secundarios
  console.log("Datos de Oferta Interna Bruta:", ofertaInternaBrutaFullData);

  if (ofertaInternaBrutaFullData && ofertaInternaBrutaFullData["Nodos Hijo"]) {
    // Filtrar solo los energéticos secundarios
    const secondaryEnergetics = ofertaInternaBrutaFullData["Nodos Hijo"].filter(
      (child) => child.tipo === "Energía Secundaria",
    );

    console.log(
      "Energéticos secundarios encontrados:",
      secondaryEnergetics.map((e) => e["Nodo Hijo"]),
    );

    // Calcular posiciones Y para distribuir los nodos de energéticos
    const startY = 0.15; // Posición inicial
    const endY = 0.9; // Posición final
    const stepY =
      secondaryEnergetics.length > 1
        ? (endY - startY) / (secondaryEnergetics.length - 1)
        : 0.5; // Evitar división por cero

    secondaryEnergetics.forEach((energetic, index) => {
      const energeticName = energetic["Nodo Hijo"];
      const energeticColor =
        styleManager.getEnergyColor(energeticName) ||
        energetic.color ||
        "#CCCCCC";

      console.log(
        `Creando nodo para ${energeticName} con color:`,
        energeticColor,
      );

      // Obtener el valor del energético antes de crear el nodo
      const energeticValue = dataManager.getEnergeticValue(
        "Oferta Interna Bruta",
        energeticName,
        year,
      );

      const energeticIndex = addNode(
        energeticName,
        energeticColor,
        "default",
        energeticValue,
      );
      secondaryEnergeticNodesMap.set(energeticName, energeticIndex);

      nodeX[energeticIndex] = 0.65; // Posición X a la derecha
      nodeY[energeticIndex] = startY + index * stepY;

      // Preparar datos para el popup
      let energeticPopupData = {};
      if (energeticValue !== null) {
        energeticPopupData.total = Math.abs(energeticValue);
        energeticPopupData.unit = "PJ";
      }

      console.log(
        `Nodo creado: ${energeticName} - Índice: ${energeticIndex}, ` +
          `X: ${nodeX[energeticIndex]}, Y: ${nodeY[energeticIndex]}`,
      );

      nodeCustomdata[energeticIndex] = popupManager.generateNodePopup(
        energeticName,
        energetic,
        year,
        energeticPopupData,
        "text",
        "Energía Secundaria",
        "simple_source",
      );
    });

    console.log("Mapa de nodos secundarios:", [
      ...secondaryEnergeticNodesMap.entries(),
    ]);
  } else {
    console.error(
      "Error: Datos de 'Oferta Interna Bruta' o sus hijos no encontrados para crear energéticos secundarios.",
    );
  }

  // --- NODO DE IMPORTACIÓN DE ENERGÉTICOS SECUNDARIOS ---
  if (importacionNodeData && importacionNodeData["Nodos Hijo"]) {
    // Filtrar solo los energéticos secundarios
    const secundariosImportados = importacionNodeData["Nodos Hijo"].filter(
      (hijo) =>
        hijo.tipo === "Energía Secundaria" &&
        hijo[year] !== undefined &&
        hijo[year] !== null &&
        hijo[year] > 0,
    );

    if (secundariosImportados.length > 0) {
      // Calcular el valor total en PJ
      const totalValuePJ = secundariosImportados.reduce((sum, energetic) => {
        return sum + (parseFloat(energetic[year]) || 0);
      }, 0);
      const formattedValue = totalValuePJ.toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      // Crear nodo de importación secundaria con valor en PJ
      const nodeNameWithValue = `Importación (Secundaria)<br>${formattedValue} PJ`;
      const importacionSecundariaIndex = addNode(
        nodeNameWithValue,
        importacionNodeData.color,
      );
      nodeX[importacionSecundariaIndex] = 0.5;
      nodeY[importacionSecundariaIndex] = 0.05;

      // Crear customdata para el nodo
      const importacionSecundariaData = {
        ...importacionNodeData,
        "Nodos Hijo": secundariosImportados,
        [year]: totalValuePJ, // Agregar el valor total al año correspondiente
      };

      // Calcular el desglose para el popup
      const importacionSecundariaBreakdown =
        popupManager.calculateNodeBreakdown(
          importacionSecundariaData,
          year,
          "Energía Secundaria",
        );

      // Generar el popup
      nodeCustomdata[importacionSecundariaIndex] =
        popupManager.generateNodePopup(
          "Importación (Secundaria)",
          importacionSecundariaData,
          year,
          importacionSecundariaBreakdown,
          "text",
          "Energía Secundaria",
          "simple_source", // Usamos la plantilla simple
        );

      // Crear enlaces desde los energéticos secundarios a la importación
      secundariosImportados.forEach((energetic) => {
        const energeticName = energetic["Nodo Hijo"];
        const targetNodeIndex = secondaryEnergeticNodesMap.get(energeticName);

        if (targetNodeIndex !== undefined) {
          const energeticValue = parseFloat(energetic[year]) || 0;

          if (energeticValue > 0) {
            const linkColor =
              styleManager.getEnergyColor(energeticName) || "#999999";

            // La dirección es desde el energético hacia la importación
            source.push(importacionSecundariaIndex);
            target.push(targetNodeIndex);
            value.push(Math.log10(energeticValue + 1));
            linkColors.push(styleManager.hexToRgba(linkColor, 0.5));

            linkCustomdata.push(
              popupManager.generateLinkPopup(
                energeticName,
                energeticValue,
                "Importación (Secundaria)",
                energeticName,
                linkColor,
                year,
                { flowType: "import_secondary" },
              ),
            );
          }
        }
      });
    }
  }

  // --- NODO DE VARIACIÓN DE INVENTARIOS DE ENERGÉTICOS SECUNDARIOS ---
  console.log(
    `[DEBUG] Datos de Variación de Inventarios (Secundaria):`,
    variacionNodeData,
  );

  if (variacionNodeData && variacionNodeData["Nodos Hijo"]) {
    // 1) Filtrar solo secundarios con valor
    const secundarios = variacionNodeData["Nodos Hijo"].filter(
      (c) =>
        c.tipo === "Energía Secundaria" &&
        c[year] != null &&
        Math.abs(c[year]) > 0,
    );

    if (secundarios.length > 0) {
      // 2) Preparamos un objeto con solo esos hijos para el breakdown
      const secData = {
        ...variacionNodeData,
        "Nodo Padre": "Variación de Inventarios ES",
        "Nodos Hijo": secundarios,
      };

      // 3) Breakdown para secundarios
      const raw = popupManager.calculateNodeBreakdown(
        secData,
        year,
        "Energía Secundaria",
      );
      const inputTotal = raw.input_total || 0;
      const outputTotal = raw.output_total || 0;
      const totalPJ = inputTotal + outputTotal;
      console.log(
        `[DEBUG] Variación ES → input=${inputTotal}, output=${outputTotal}, totalPJ=${totalPJ.toFixed(2)}`,
      );

      // 4) Crear nodo dimensionado por totalPJ
      const idx = addNode(
        "Variación de Inventarios ES",
        variacionNodeData.color,
        "default",
        totalPJ,
      );
      nodeX[idx] = 0.45;
      nodeY[idx] = 0.15;

      // 5) Sobrescribir label con flechas ↑↓
      labels[idx] =
        `Variación de Inventarios ES<br>↑ ${inputTotal.toFixed(2)} PJ  ↓ ${outputTotal.toFixed(2)} PJ`;

      // 6) Generar popup con ambos valores
      nodeCustomdata[idx] = popupManager.generateNodePopup(
        "Variación de Inventarios ES",
        secData,
        year,
        {
          variacion_positiva: inputTotal,
          variacion_negativa: outputTotal,
          unit: "PJ",
        },
        "text",
        null,
        "simple_source",
      );

      // 7) Enlaces: flujos positivos salen del nodo, negativos entran al nodo
      secundarios.forEach((child) => {
        const val = parseFloat(child[year]) || 0;
        if (val === 0) return;

        const targetIdx = secondaryEnergeticNodesMap.get(child["Nodo Hijo"]);
        if (targetIdx == null) return;

        const src = val > 0 ? idx : targetIdx;
        const tgt = val > 0 ? targetIdx : idx;

        source.push(src);
        target.push(tgt);
        const scaled = Math.log10(Math.abs(val) + 1) + MIN_LINK_SIZE;
        value.push(scaled);

        const col =
          styleManager.getEnergyColor(child["Nodo Hijo"]) || child.color;
        linkColors.push(styleManager.hexToRgba(col, 0.5));

        linkCustomdata.push(
          popupManager.generateLinkPopup(
            child["Nodo Hijo"],
            Math.abs(val),
            val > 0 ? "Variación de Inventarios ES" : child["Nodo Hijo"],
            val > 0 ? child["Nodo Hijo"] : "Variación de Inventarios ES",
            col,
            year,
            { flowType: "inventory_change_secondary" },
          ),
        );
      });
    }
  } else {
    console.error(
      "Error: datos de Variación de Inventarios ES no disponibles.",
    );
  }

  // --- NODO DE EXPORTACIÓN DE ENERGÉTICOS SECUNDARIOS ---
  if (exportacionNodeData && exportacionNodeData["Nodos Hijo"]) {
    // Filtrar solo los energéticos secundarios (valores negativos)
    const secundariosExportacion = exportacionNodeData["Nodos Hijo"].filter(
      (hijo) =>
        hijo.tipo === "Energía Secundaria" &&
        hijo[year] !== undefined &&
        hijo[year] !== null &&
        hijo[year] < 0,
    ); // Cambiado a < 0 para capturar valores negativos

    if (secundariosExportacion.length > 0) {
      // Crear nodo de exportación secundaria

      // Calcular el valor total sumando los valores absolutos
      const totalValue = secundariosExportacion.reduce((sum, item) => {
        return sum + Math.abs(parseFloat(item[year]) || 0);
      }, 0);

      // Formatear el valor con 2 decimales
      const formattedValueExportacion = totalValue.toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      // Crear nodo de consumo propio secundario con el valor en el nombre
      const exportacionSecundariaIndex = addNode(
        `Exportación<br> (${formattedValueExportacion} PJ)`,
        exportacionNodeData.color,
      );
      nodeX[exportacionSecundariaIndex] = 0.8;
      nodeY[exportacionSecundariaIndex] = 0.9;

      // Crear customdata para el nodo
      const exportacionSecundariaData = {
        ...exportacionNodeData,
        "Nodos Hijo": secundariosExportacion,
      };

      // Calcular el desglose para el popup
      const exportacionSecundariaBreakdown =
        popupManager.calculateNodeBreakdown(
          exportacionSecundariaData,
          year,
          "Energía Secundaria",
        );

      // Generar el popup
      nodeCustomdata[exportacionSecundariaIndex] =
        popupManager.generateNodePopup(
          "Exportación (Secundaria)",
          exportacionSecundariaData,
          year,
          exportacionSecundariaBreakdown,
          "text",
          "Energía Secundaria",
          "simple_source", // Usamos la plantilla simple
        );

      // Crear enlaces desde los energéticos secundarios a la exportación
      secundariosExportacion.forEach((energetic) => {
        const energeticName = energetic["Nodo Hijo"];
        const sourceNodeIndex = secondaryEnergeticNodesMap.get(energeticName);
        const energeticValue = Math.abs(parseFloat(energetic[year]) || 0); // Tomar valor absoluto

        if (sourceNodeIndex !== undefined && energeticValue > 0) {
          const linkColor =
            styleManager.getEnergyColor(energeticName) || "#999999";

          // La dirección es desde el energético hacia la exportación
          source.push(sourceNodeIndex);
          target.push(exportacionSecundariaIndex);
          value.push(Math.log10(energeticValue + 1));
          linkColors.push(styleManager.hexToRgba(linkColor, 0.5));

          linkCustomdata.push(
            popupManager.generateLinkPopup(
              energeticName,
              energeticValue, // Usamos el valor absoluto
              energeticName,
              "Exportación (Secundaria)",
              linkColor,
              year,
              { flowType: "export_secondary" },
            ),
          );
        }
      });
    }
  }

  const perdidasTecnicasSecNodeData = dataManager.getNodeData(
    "Pérdidas técnicas por transporte, transmisión y distribución",
  );
  if (
    perdidasTecnicasSecNodeData &&
    perdidasTecnicasSecNodeData["Nodos Hijo"]
  ) {
    // Filtrar solo los energéticos secundarios
    const secundariosPerdidasTecnicas = perdidasTecnicasSecNodeData[
      "Nodos Hijo"
    ].filter(
      (hijo) =>
        hijo.tipo === "Energía Secundaria" &&
        hijo[year] !== undefined &&
        hijo[year] !== null &&
        Math.abs(hijo[year]) > 0,
    );

    if (secundariosPerdidasTecnicas.length > 0) {
      // Crear nodo de pérdidas técnicas secundarias
      // Calcular el valor total sumando los valores absolutos
      const totalValue = secundariosPerdidasTecnicas.reduce((sum, item) => {
        return sum + Math.abs(parseFloat(item[year]) || 0);
      }, 0);

      // Formatear el valor con 2 decimales
      const formattedValue = totalValue.toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      // Crear nodo de pérdidas técnicas secundarias con el valor en el nombre
      const perdidasTecnicasSecIndex = addNode(
        `Pérdidas Técnicas<br>(${formattedValue} PJ)`,
        perdidasTecnicasSecNodeData.color,
      );
      nodeX[perdidasTecnicasSecIndex] = 0.8;
      nodeY[perdidasTecnicasSecIndex] = 0.95;

      // Crear datos para el popup
      const perdidasTecnicasSecData = {
        ...perdidasTecnicasSecNodeData,
        "Nodo Padre": "Pérdidas Técnicas (Sec)",
        "Nodos Hijo": secundariosPerdidasTecnicas,
      };

      // Calcular el desglose para el popup
      const perdidasTecnicasSecBreakdown = popupManager.calculateNodeBreakdown(
        perdidasTecnicasSecData,
        year,
        "Energía Secundaria",
      );

      // Generar el popup
      nodeCustomdata[perdidasTecnicasSecIndex] = popupManager.generateNodePopup(
        "Pérdidas Técnicas (Sec)",
        perdidasTecnicasSecData,
        year,
        perdidasTecnicasSecBreakdown,
        "text",
        "Energía Secundaria",
        "simple_source",
      );

      // Crear enlaces desde los energéticos secundarios
      secundariosPerdidasTecnicas.forEach((energetic) => {
        const energeticName = energetic["Nodo Hijo"];
        const sourceNodeIndex = secondaryEnergeticNodesMap.get(energeticName);
        const energeticValue = Math.abs(parseFloat(energetic[year]) || 0);

        if (sourceNodeIndex !== undefined && energeticValue > 0) {
          const linkColor =
            styleManager.getEnergyColor(energeticName) || "#999999";

          // Añadir el enlace
          source.push(sourceNodeIndex);
          target.push(perdidasTecnicasSecIndex);
          value.push(Math.log10(energeticValue + 1));
          linkColors.push(styleManager.hexToRgba(linkColor, 0.5));

          // Añadir popup del enlace
          linkCustomdata.push(
            popupManager.generateLinkPopup(
              energeticName,
              energeticValue,
              energeticName,
              "Pérdidas Técnicas (Sec)",
              linkColor,
              year,
              {
                flowType: "perdidas_tecnicas_secundarias",
                template: "simple",
              },
            ),
          );
        }
      });
    }
  }

  if (consumoPropioNodeData && consumoPropioNodeData["Nodos Hijo"]) {
    // Filtrar solo los energéticos secundarios (valores negativos)
    const secundariosConsumoPropio = consumoPropioNodeData["Nodos Hijo"].filter(
      (hijo) =>
        hijo.tipo === "Energía Secundaria" &&
        hijo[year] !== undefined &&
        hijo[year] !== null &&
        hijo[year] < 0,
    ); // Cambiado a < 0 para capturar valores negativos

    if (secundariosConsumoPropio.length > 0) {
      // Crear nodo de exportación secundaria
      // Calcular el valor total sumando los valores absolutos
      const totalValue = secundariosConsumoPropio.reduce((sum, item) => {
        return sum + Math.abs(parseFloat(item[year]) || 0);
      }, 0);

      // Formatear el valor con 2 decimales
      const formattedValue = totalValue.toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      // Crear nodo de consumo propio secundario con el valor en el nombre
      const consumoPropioSecundariaIndex = addNode(
        `Consumo Propio<br>(${formattedValue} PJ)`,
        consumoPropioNodeData.color,
      );
      nodeX[consumoPropioSecundariaIndex] = 0.8;
      nodeY[consumoPropioSecundariaIndex] = 0.99;

      // Crear customdata para el nodo
      const consumoPropioSecundariaData = {
        ...consumoPropioNodeData,
        "Nodos Hijo": secundariosConsumoPropio,
      };

      // Calcular el desglose para el popup
      const consumoPropioSecundariaBreakdown =
        popupManager.calculateNodeBreakdown(
          consumoPropioSecundariaData,
          year,
          "Energía Secundaria",
        );

      // Generar el popup
      nodeCustomdata[consumoPropioSecundariaIndex] =
        popupManager.generateNodePopup(
          "Consumo Propio (Secundaria)",
          consumoPropioSecundariaData,
          year,
          consumoPropioSecundariaBreakdown,
          "text",
          "Energía Secundaria",
          "simple_source", // Usamos la plantilla simple
        );

      // Crear enlaces desde los energéticos secundarios a la exportación
      secundariosConsumoPropio.forEach((energetic) => {
        const energeticName = energetic["Nodo Hijo"];
        const sourceNodeIndex = secondaryEnergeticNodesMap.get(energeticName);
        const energeticValue = Math.abs(parseFloat(energetic[year]) || 0); // Tomar valor absoluto

        if (sourceNodeIndex !== undefined && energeticValue > 0) {
          const linkColor =
            styleManager.getEnergyColor(energeticName) || "#999999";

          // La dirección es desde el energético hacia la exportación
          source.push(sourceNodeIndex);
          target.push(consumoPropioSecundariaIndex);
          value.push(Math.log10(energeticValue + 1));
          linkColors.push(styleManager.hexToRgba(linkColor, 0.5));

          linkCustomdata.push(
            popupManager.generateLinkPopup(
              energeticName,
              energeticValue, // Usamos el valor absoluto
              energeticName,
              "Consumo Propio (Secundaria)",
              linkColor,
              year,
              { flowType: "consumo_propio_secondary" },
            ),
          );
        }
      });
    }
  }

  // --- NODO DE ENERGÍA NO APROVECHADA DE ENERGÉTICOS SECUNDARIOS ---
  if (
    energiaNoAprovechadaNodeData &&
    energiaNoAprovechadaNodeData["Nodos Hijo"]
  ) {
    // Filtrar solo los energéticos secundarios
    const secundariosNoAprovechados = energiaNoAprovechadaNodeData[
      "Nodos Hijo"
    ].filter(
      (hijo) =>
        hijo.tipo === "Energía Secundaria" &&
        hijo[year] !== undefined &&
        hijo[year] !== null &&
        hijo[year] > 0,
    );

    if (secundariosNoAprovechados.length > 0) {
      // Calcular el valor total en PJ
      const totalValuePJ = secundariosNoAprovechados.reduce(
        (sum, energetic) => {
          return sum + (parseFloat(energetic[year]) || 0);
        },
        0,
      );

      // Crear nodo de energía no aprovechada secundaria con valor en PJ
      const nodeNameWithValue = `Energía No Aprovechada (Secundaria)<br>${totalValuePJ.toFixed(2)} PJ`;
      const noAprovechadaSecundariaIndex = addNode(
        nodeNameWithValue,
        energiaNoAprovechadaNodeData.color,
      );
      nodeX[noAprovechadaSecundariaIndex] = 0.6; // Posición X intermedia
      nodeY[noAprovechadaSecundariaIndex] = 0.9; // Misma altura que el nodo primario

      // Crear customdata para el nodo
      const noAprovechadaSecundariaData = {
        ...energiaNoAprovechadaNodeData,
        "Nodo Padre": "Energía No Aprovechada (Secundaria)",
        "Nodos Hijo": secundariosNoAprovechados,
        [year]: totalValuePJ, // Agregar el valor total al año correspondiente
      };

      // Calcular el desglose para el popup
      const noAprovechadaSecundariaBreakdown =
        popupManager.calculateNodeBreakdown(
          noAprovechadaSecundariaData,
          year,
          "Energía Secundaria",
        );

      // Generar el popup
      nodeCustomdata[noAprovechadaSecundariaIndex] =
        popupManager.generateNodePopup(
          "Energía No Aprovechada (Secundaria)",
          noAprovechadaSecundariaData,
          year,
          noAprovechadaSecundariaBreakdown,
          "text",
          "Energía Secundaria",
          "simple_source", // Usamos la plantilla simple
        );

      // Crear enlaces desde los energéticos secundarios a la energía no aprovechada
      secundariosNoAprovechados.forEach((energetic) => {
        const energeticName = energetic["Nodo Hijo"];
        const sourceNodeIndex = secondaryEnergeticNodesMap.get(energeticName);
        const energeticValue = parseFloat(energetic[year]) || 0;

        if (sourceNodeIndex !== undefined && energeticValue > 0) {
          const linkColor =
            styleManager.getEnergyColor(energeticName) || "#999999";

          // La dirección es desde el energético hacia la energía no aprovechada
          source.push(sourceNodeIndex);
          target.push(noAprovechadaSecundariaIndex);
          value.push(Math.log10(energeticValue + 1));
          linkColors.push(styleManager.hexToRgba(linkColor, 0.5));

          linkCustomdata.push(
            popupManager.generateLinkPopup(
              energeticName,
              energeticValue,
              energeticName,
              "Energía No Aprovechada (Secundaria)",
              linkColor,
              year,
              {
                flowType: "unused_energy_secondary",
                template: "simple", // Usamos la plantilla simple para los enlaces
              },
            ),
          );
        }
      });
    }
  }

  //CONSUMOS POR SECTORES

  // --- NODO INDUSTRIAL ---
  const industrialNodeData = dataManager.getNodeData("Industrial");
  if (industrialNodeData && industrialNodeData["Nodos Hijo"]) {
    // Crear nodo Industrial
    // Calcular el valor total sumando los valores absolutos
    const totalValue = industrialNodeData["Nodos Hijo"].reduce((sum, item) => {
      return sum + Math.abs(parseFloat(item[year]) || 0);
    }, 0);

    // Formatear el valor con 2 decimales
    const formattedValue = totalValue.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    // Crear nodo con el valor en el nombre (con salto de línea HTML)
    const industrialIndex = addNode(
      `${industrialNodeData["Nodo Padre"]}<br>(${formattedValue} PJ)`,
      industrialNodeData.color,
    );
    nodeX[industrialIndex] = 0.9;
    nodeY[industrialIndex] = 0.15;

    // Calcular el total sumando los valores de los hijos
    const totalIndustrial = industrialNodeData["Nodos Hijo"].reduce(
      (sum, hijo) => {
        return sum + (parseFloat(hijo[year]) || 0);
      },
      0,
    );

    // Crear un objeto con el formato esperado por la plantilla simple_source
    const popupData = {
      label: "Sector Industrial", // Cambiamos esto
      total: totalIndustrial,
      unit: "PJ", // Ajusta la unidad según corresponda
    };

    // Generar el popup
    nodeCustomdata[industrialIndex] = popupManager.generateNodePopup(
      "Sector Industrial", // Y aquí también
      popupData, // Pasamos los datos formateados
      year,
      popupData, // Mismos datos para el desglose
      "text",
      "Todos",
      "simple_source",
    );
    // Crear enlaces desde energéticos primarios
    // Después de crear los nodos de energía primaria y tener el mapa energeticNodesMap

    // --- Crear enlaces desde los nodos de energía primaria al nodo Industrial ---
    if (industrialNodeData && industrialNodeData["Nodos Hijo"]) {
      industrialNodeData["Nodos Hijo"].forEach((hijo) => {
        if (hijo.tipo === "Energía Primaria" && hijo[year] > 0) {
          const sourceNodeIndex = energeticNodesMap.get(hijo["Nodo Hijo"]);
          const industrialNodeIndex = nodeMap.get(
            industrialNodeData["Nodo Padre"],
          );

          if (
            sourceNodeIndex !== undefined &&
            industrialNodeIndex !== undefined
          ) {
            const linkColor =
              styleManager.getEnergyColor(hijo["Nodo Hijo"]) ||
              hijo.color ||
              "#999999";
            const linkValue = Math.log10(parseFloat(hijo[year]) + 1);

            source.push(sourceNodeIndex);
            target.push(industrialNodeIndex);
            value.push(linkValue);
            linkColors.push(styleManager.hexToRgba(linkColor, 0.5));

            // Crear el popup para el enlace
            linkCustomdata.push(
              popupManager.generateLinkPopup(
                hijo["Nodo Hijo"],
                parseFloat(hijo[year]),
                hijo["Nodo Hijo"],
                industrialNodeData["Nodo Padre"],
                linkColor,
                year,
                {
                  flowType: "sector_industrial",
                  template: "simple",
                },
              ),
            );
          }
        }
      });
    }

    // Crear enlaces desde energéticos secundarios
    industrialNodeData["Nodos Hijo"].forEach((hijo) => {
      if (hijo.tipo === "Energía Secundaria" && hijo[year] > 0) {
        const sourceNodeIndex = secondaryEnergeticNodesMap.get(
          hijo["Nodo Hijo"],
        );
        if (sourceNodeIndex !== undefined) {
          const linkColor =
            styleManager.getEnergyColor(hijo["Nodo Hijo"]) || "#999999";

          source.push(sourceNodeIndex);
          target.push(industrialIndex);
          value.push(Math.log10(hijo[year] + 1));
          linkColors.push(styleManager.hexToRgba(linkColor, 0.5));

          linkCustomdata.push(
            popupManager.generateLinkPopup(
              hijo["Nodo Hijo"],
              hijo[year],
              hijo["Nodo Hijo"],
              "Industrial",
              linkColor,
              year,
              { flowType: "to_industrial_secondary" },
            ),
          );
        }
      }
    });
  }

  // --- NODO TRANSPORTE ---
  const transporteNodeData = dataManager.getNodeData("Transporte");
  if (transporteNodeData && transporteNodeData["Nodos Hijo"]) {
    // Crear nodo Transporte
    // Calcular el valor total sumando los valores absolutos
    const totalValue = transporteNodeData["Nodos Hijo"].reduce((sum, item) => {
      return sum + Math.abs(parseFloat(item[year]) || 0);
    }, 0);

    // Formatear el valor con 2 decimales
    const formattedValue = totalValue.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    // Crear nodo con el valor en el nombre (con salto de línea HTML)
    const transporteIndex = addNode(
      `${transporteNodeData["Nodo Padre"]}<br>(${formattedValue} PJ)`,
      transporteNodeData.color,
    );
    nodeX[transporteIndex] = 0.9;
    nodeY[transporteIndex] = 0.3;

    // Calcular el total sumando los valores de los hijos
    const totalTransporte = transporteNodeData["Nodos Hijo"].reduce(
      (sum, hijo) => {
        return sum + (parseFloat(hijo[year]) || 0);
      },
      0,
    );

    // Crear un objeto con el formato esperado por la plantilla simple_source
    const popupData = {
      label: "Sector Transporte", // Cambiamos esto
      total: totalTransporte,
      unit: "PJ", // Ajusta la unidad según corresponda
    };

    // Generar el popup
    nodeCustomdata[transporteIndex] = popupManager.generateNodePopup(
      "Sector Transporte", // Y aquí también
      popupData, // Pasamos los datos formateados
      year,
      popupData, // Mismos datos para el desglose
      "text",
      "Todos",
      "simple_source",
    );
    // Crear enlaces desde energéticos primarios
    // Después de crear los nodos de energía primaria y tener el mapa energeticNodesMap

    // --- Crear enlaces desde los nodos de energía primaria al nodo Industrial ---
    if (transporteNodeData && transporteNodeData["Nodos Hijo"]) {
      transporteNodeData["Nodos Hijo"].forEach((hijo) => {
        if (hijo.tipo === "Energía Primaria" && hijo[year] > 0) {
          const sourceNodeIndex = energeticNodesMap.get(hijo["Nodo Hijo"]);
          const transporteNodeIndex = nodeMap.get(
            transporteNodeData["Nodo Padre"],
          );

          if (
            sourceNodeIndex !== undefined &&
            transporteNodeIndex !== undefined
          ) {
            const linkColor =
              styleManager.getEnergyColor(hijo["Nodo Hijo"]) ||
              hijo.color ||
              "#999999";
            const linkValue = Math.log10(parseFloat(hijo[year]) + 1);

            source.push(sourceNodeIndex);
            target.push(transporteNodeIndex);
            value.push(linkValue);
            linkColors.push(styleManager.hexToRgba(linkColor, 0.5));

            // Crear el popup para el enlace
            linkCustomdata.push(
              popupManager.generateLinkPopup(
                hijo["Nodo Hijo"],
                parseFloat(hijo[year]),
                hijo["Nodo Hijo"],
                transporteNodeData["Nodo Padre"],
                linkColor,
                year,
                {
                  flowType: "sector_industrial",
                  template: "simple",
                },
              ),
            );
          }
        }
      });
    }

    // Crear enlaces desde energéticos secundarios
    transporteNodeData["Nodos Hijo"].forEach((hijo) => {
      if (hijo.tipo === "Energía Secundaria" && hijo[year] > 0) {
        const sourceNodeIndex = secondaryEnergeticNodesMap.get(
          hijo["Nodo Hijo"],
        );
        if (sourceNodeIndex !== undefined) {
          const linkColor =
            styleManager.getEnergyColor(hijo["Nodo Hijo"]) || "#999999";

          source.push(sourceNodeIndex);
          target.push(transporteIndex);
          value.push(Math.log10(hijo[year] + 1));
          linkColors.push(styleManager.hexToRgba(linkColor, 0.5));

          linkCustomdata.push(
            popupManager.generateLinkPopup(
              hijo["Nodo Hijo"],
              hijo[year],
              hijo["Nodo Hijo"],
              "Transporte",
              linkColor,
              year,
              { flowType: "to_transporte_secondary" },
            ),
          );
        }
      }
    });
  }

  // --- NODO AGROPECUARIO ---
  const agropecuarioNodeData = dataManager.getNodeData("Agropecuario");
  if (agropecuarioNodeData && agropecuarioNodeData["Nodos Hijo"]) {
    // Crear nodo Agropecuario
    // Crear nodo Agropecuario
    // Calcular el valor total sumando los valores absolutos
    const totalValue = agropecuarioNodeData["Nodos Hijo"].reduce(
      (sum, item) => {
        return sum + Math.abs(parseFloat(item[year]) || 0);
      },
      0,
    );

    // Formatear el valor con 2 decimales
    const formattedValue = totalValue.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    // Crear nodo con el valor en el nombre (con salto de línea HTML)
    const agropecuarioIndex = addNode(
      `${agropecuarioNodeData["Nodo Padre"]}<br>(${formattedValue} PJ)`,
      agropecuarioNodeData.color,
    );
    nodeX[agropecuarioIndex] = 0.9;
    nodeY[agropecuarioIndex] = 0.4;

    // Calcular el total sumando los valores de los hijos
    const totalAgropecuario = agropecuarioNodeData["Nodos Hijo"].reduce(
      (sum, hijo) => {
        return sum + (parseFloat(hijo[year]) || 0);
      },
      0,
    );

    // Crear un objeto con el formato esperado por la plantilla simple_source
    const popupData = {
      label: "Sector Agropecuario", // Cambiamos esto
      total: totalAgropecuario,
      unit: "PJ", // Ajusta la unidad según corresponda
    };

    // Generar el popup
    nodeCustomdata[agropecuarioIndex] = popupManager.generateNodePopup(
      "Sector Agropecuario", // Y aquí también
      popupData, // Pasamos los datos formateados
      year,
      popupData, // Mismos datos para el desglose
      "text",
      "Todos",
      "simple_source",
    );
    // Crear enlaces desde energéticos primarios
    agropecuarioNodeData["Nodos Hijo"].forEach((hijo) => {
      if (hijo.tipo === "Energía Primaria" && hijo[year] > 0) {
        const sourceNodeIndex = primaryEnergeticNodesMap.get(hijo["Nodo Hijo"]);
        if (sourceNodeIndex !== undefined) {
          const linkColor =
            styleManager.getEnergyColor(hijo["Nodo Hijo"]) || "#999999";

          source.push(sourceNodeIndex);
          target.push(agropecuarioIndex);
          value.push(Math.log10(hijo[year] + 1));
          linkColors.push(styleManager.hexToRgba(linkColor, 0.5));

          linkCustomdata.push(
            popupManager.generateLinkPopup(
              hijo["Nodo Hijo"],
              hijo[year],
              hijo["Nodo Hijo"],
              "Agropecuario",
              linkColor,
              year,
              { flowType: "to_agropecuario" },
            ),
          );
        }
      }
    });

    // Crear enlaces desde energéticos secundarios
    agropecuarioNodeData["Nodos Hijo"].forEach((hijo) => {
      if (hijo.tipo === "Energía Secundaria" && hijo[year] > 0) {
        const sourceNodeIndex = secondaryEnergeticNodesMap.get(
          hijo["Nodo Hijo"],
        );
        if (sourceNodeIndex !== undefined) {
          const linkColor =
            styleManager.getEnergyColor(hijo["Nodo Hijo"]) || "#999999";

          source.push(sourceNodeIndex);
          target.push(agropecuarioIndex);
          value.push(Math.log10(hijo[year] + 1));
          linkColors.push(styleManager.hexToRgba(linkColor, 0.5));

          linkCustomdata.push(
            popupManager.generateLinkPopup(
              hijo["Nodo Hijo"],
              hijo[year],
              hijo["Nodo Hijo"],
              "Agropecuario",
              linkColor,
              year,
              { flowType: "to_agropecuario_secondary" },
            ),
          );
        }
      }
    });
  }

  // --- NODO COMERCIAL ---
  const comercialNodeData = dataManager.getNodeData("Comercial");
  if (comercialNodeData && comercialNodeData["Nodos Hijo"]) {
    // Crear nodo Comercial
    // Calcular el valor total sumando los valores absolutos
    const totalValue = comercialNodeData["Nodos Hijo"].reduce((sum, item) => {
      return sum + Math.abs(parseFloat(item[year]) || 0);
    }, 0);

    // Formatear el valor con 2 decimales
    const formattedValue = totalValue.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    // Crear nodo con el valor en el nombre (con salto de línea HTML)
    const comercialIndex = addNode(
      `${comercialNodeData["Nodo Padre"]}<br>(${formattedValue} PJ)`,
      comercialNodeData.color,
    );
    nodeX[comercialIndex] = 0.9;
    nodeY[comercialIndex] = 0.5;

    // Calcular el total sumando los valores de los hijos
    const totalComercial = comercialNodeData["Nodos Hijo"].reduce(
      (sum, hijo) => {
        return sum + (parseFloat(hijo[year]) || 0);
      },
      0,
    );

    // Crear un objeto con el formato esperado por la plantilla simple_source
    const popupData = {
      label: "Sector Comercial", // Cambiamos esto
      total: totalComercial,
      unit: "PJ", // Ajusta la unidad según corresponda
    };

    // Generar el popup
    nodeCustomdata[comercialIndex] = popupManager.generateNodePopup(
      "Sector Comercial", // Y aquí también
      popupData, // Pasamos los datos formateados
      year,
      popupData, // Mismos datos para el desglose
      "text",
      "Todos",
      "simple_source",
    );
    // Crear enlaces desde energéticos primarios
    // Después de crear los nodos de energía primaria y tener el mapa energeticNodesMap

    // --- Crear enlaces desde los nodos de energía primaria al nodo Industrial ---
    if (comercialNodeData && comercialNodeData["Nodos Hijo"]) {
      comercialNodeData["Nodos Hijo"].forEach((hijo) => {
        if (hijo.tipo === "Energía Primaria" && hijo[year] > 0) {
          const sourceNodeIndex = energeticNodesMap.get(hijo["Nodo Hijo"]);
          const comercialNodeIndex = nodeMap.get(
            comercialNodeData["Nodo Padre"],
          );

          if (
            sourceNodeIndex !== undefined &&
            comercialNodeIndex !== undefined
          ) {
            const linkColor =
              styleManager.getEnergyColor(hijo["Nodo Hijo"]) ||
              hijo.color ||
              "#999999";
            const linkValue = Math.log10(parseFloat(hijo[year]) + 1);

            source.push(sourceNodeIndex);
            target.push(comercialNodeIndex);
            value.push(linkValue);
            linkColors.push(styleManager.hexToRgba(linkColor, 0.5));

            // Crear el popup para el enlace
            linkCustomdata.push(
              popupManager.generateLinkPopup(
                hijo["Nodo Hijo"],
                parseFloat(hijo[year]),
                hijo["Nodo Hijo"],
                comercialNodeData["Nodo Padre"],
                linkColor,
                year,
                {
                  flowType: "sector_industrial",
                  template: "simple",
                },
              ),
            );
          }
        }
      });
    }

    // Crear enlaces desde energéticos secundarios
    comercialNodeData["Nodos Hijo"].forEach((hijo) => {
      if (hijo.tipo === "Energía Secundaria" && hijo[year] > 0) {
        const sourceNodeIndex = secondaryEnergeticNodesMap.get(
          hijo["Nodo Hijo"],
        );
        if (sourceNodeIndex !== undefined) {
          const linkColor =
            styleManager.getEnergyColor(hijo["Nodo Hijo"]) || "#999999";

          source.push(sourceNodeIndex);
          target.push(comercialIndex);
          value.push(Math.log10(hijo[year] + 1));
          linkColors.push(styleManager.hexToRgba(linkColor, 0.5));

          linkCustomdata.push(
            popupManager.generateLinkPopup(
              hijo["Nodo Hijo"],
              hijo[year],
              hijo["Nodo Hijo"],
              "Comercial",
              linkColor,
              year,
              { flowType: "to_comercial_secondary" },
            ),
          );
        }
      }
    });
  }

  // --- NODO PÚBLICO ---
  const publicoNodeData = dataManager.getNodeData("Público");
  if (publicoNodeData && publicoNodeData["Nodos Hijo"]) {
    // Crear nodo Transporte
    // Calcular el valor total sumando los valores absolutos
    const totalValue = publicoNodeData["Nodos Hijo"].reduce((sum, item) => {
      return sum + Math.abs(parseFloat(item[year]) || 0);
    }, 0);

    // Formatear el valor con 2 decimales
    const formattedValue = totalValue.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    // Crear nodo con el valor en el nombre (con salto de línea HTML)
    const publicoIndex = addNode(
      `${publicoNodeData["Nodo Padre"]}<br>(${formattedValue} PJ)`,
      publicoNodeData.color,
    );
    nodeX[publicoIndex] = 0.9;
    nodeY[publicoIndex] = 0.6;

    // Calcular el total sumando los valores de los hijos
    const totalPublico = publicoNodeData["Nodos Hijo"].reduce((sum, hijo) => {
      return sum + (parseFloat(hijo[year]) || 0);
    }, 0);

    // Crear un objeto con el formato esperado por la plantilla simple_source
    const popupData = {
      label: "Sector Público", // Cambiamos esto
      total: totalPublico,
      unit: "PJ", // Ajusta la unidad según corresponda
    };

    // Generar el popup
    nodeCustomdata[publicoIndex] = popupManager.generateNodePopup(
      "Sector Público", // Y aquí también
      popupData, // Pasamos los datos formateados
      year,
      popupData, // Mismos datos para el desglose
      "text",
      "Todos",
      "simple_source",
    );
    // Crear enlaces desde energéticos primarios
    // Después de crear los nodos de energía primaria y tener el mapa energeticNodesMap

    // --- Crear enlaces desde los nodos de energía primaria al nodo Industrial ---
    if (publicoNodeData && publicoNodeData["Nodos Hijo"]) {
      publicoNodeData["Nodos Hijo"].forEach((hijo) => {
        if (hijo.tipo === "Energía Primaria" && hijo[year] > 0) {
          const sourceNodeIndex = energeticNodesMap.get(hijo["Nodo Hijo"]);
          const publicoNodeIndex = nodeMap.get(publicoNodeData["Nodo Padre"]);

          if (sourceNodeIndex !== undefined && publicoNodeIndex !== undefined) {
            const linkColor =
              styleManager.getEnergyColor(hijo["Nodo Hijo"]) ||
              hijo.color ||
              "#999999";
            const linkValue = Math.log10(parseFloat(hijo[year]) + 1);

            source.push(sourceNodeIndex);
            target.push(publicoNodeIndex);
            value.push(linkValue);
            linkColors.push(styleManager.hexToRgba(linkColor, 0.5));

            // Crear el popup para el enlace
            linkCustomdata.push(
              popupManager.generateLinkPopup(
                hijo["Nodo Hijo"],
                parseFloat(hijo[year]),
                hijo["Nodo Hijo"],
                publicoNodeData["Nodo Padre"],
                linkColor,
                year,
                {
                  flowType: "sector_industrial",
                  template: "simple",
                },
              ),
            );
          }
        }
      });
    }

    // Crear enlaces desde energéticos secundarios
    publicoNodeData["Nodos Hijo"].forEach((hijo) => {
      if (hijo.tipo === "Energía Secundaria" && hijo[year] > 0) {
        const sourceNodeIndex = secondaryEnergeticNodesMap.get(
          hijo["Nodo Hijo"],
        );
        if (sourceNodeIndex !== undefined) {
          const linkColor =
            styleManager.getEnergyColor(hijo["Nodo Hijo"]) || "#999999";

          source.push(sourceNodeIndex);
          target.push(publicoIndex);
          value.push(Math.log10(hijo[year] + 1));
          linkColors.push(styleManager.hexToRgba(linkColor, 0.5));

          linkCustomdata.push(
            popupManager.generateLinkPopup(
              hijo["Nodo Hijo"],
              hijo[year],
              hijo["Nodo Hijo"],
              "Público",
              linkColor,
              year,
              { flowType: "to_publico_secondary" },
            ),
          );
        }
      }
    });
  }

  // --- NODO RESIDENCIAL ---
  const residencialNodeData = dataManager.getNodeData("Residencial");
  if (residencialNodeData && residencialNodeData["Nodos Hijo"]) {
    // Calcular el valor total sumando los valores absolutos
    const totalValue = residencialNodeData["Nodos Hijo"].reduce((sum, item) => {
      return sum + Math.abs(parseFloat(item[year]) || 0);
    }, 0);

    // Formatear el valor con 2 decimales
    const formattedValue = totalValue.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    // Crear nodo con el valor en el nombre (con salto de línea HTML)
    const residencialIndex = addNode(
      `${residencialNodeData["Nodo Padre"]}<br>(${formattedValue} PJ)`,
      residencialNodeData.color,
    );
    nodeX[residencialIndex] = 0.9;
    nodeY[residencialIndex] = 0.7;

    // Calcular el total sumando los valores de los hijos
    const totalResidencial = residencialNodeData["Nodos Hijo"].reduce(
      (sum, hijo) => {
        return sum + (parseFloat(hijo[year]) || 0);
      },
      0,
    );

    // Crear un objeto con el formato esperado por la plantilla simple_source
    const popupData = {
      label: "Sector Residencial",
      total: totalResidencial,
      unit: "PJ",
    };

    // Generar el popup
    nodeCustomdata[residencialIndex] = popupManager.generateNodePopup(
      "Sector Residencial",
      popupData,
      year,
      popupData,
      "text",
      "Todos",
      "simple_source",
    );
    // Crear enlaces desde energéticos primarios
    // Después de crear los nodos de energía primaria y tener el mapa energeticNodesMap

    // --- Crear enlaces desde los nodos de energía primaria al nodo Industrial ---
    if (residencialNodeData && residencialNodeData["Nodos Hijo"]) {
      residencialNodeData["Nodos Hijo"].forEach((hijo) => {
        if (hijo.tipo === "Energía Primaria" && hijo[year] > 0) {
          const sourceNodeIndex = energeticNodesMap.get(hijo["Nodo Hijo"]);
          const publicoNodeIndex = nodeMap.get(
            residencialNodeData["Nodo Padre"],
          );

          if (sourceNodeIndex !== undefined && publicoNodeIndex !== undefined) {
            const linkColor =
              styleManager.getEnergyColor(hijo["Nodo Hijo"]) ||
              hijo.color ||
              "#999999";
            const linkValue = Math.log10(parseFloat(hijo[year]) + 1);

            source.push(sourceNodeIndex);
            target.push(publicoNodeIndex);
            value.push(linkValue);
            linkColors.push(styleManager.hexToRgba(linkColor, 0.5));

            // Crear el popup para el enlace
            linkCustomdata.push(
              popupManager.generateLinkPopup(
                hijo["Nodo Hijo"],
                parseFloat(hijo[year]),
                hijo["Nodo Hijo"],
                residencialNodeData["Nodo Padre"],
                linkColor,
                year,
                {
                  flowType: "sector_industrial",
                  template: "simple",
                },
              ),
            );
          }
        }
      });
    }

    // Crear enlaces desde energéticos secundarios
    residencialNodeData["Nodos Hijo"].forEach((hijo) => {
      if (hijo.tipo === "Energía Secundaria" && hijo[year] > 0) {
        const sourceNodeIndex = secondaryEnergeticNodesMap.get(
          hijo["Nodo Hijo"],
        );
        if (sourceNodeIndex !== undefined) {
          const linkColor =
            styleManager.getEnergyColor(hijo["Nodo Hijo"]) || "#999999";

          source.push(sourceNodeIndex);
          target.push(residencialIndex);
          value.push(Math.log10(hijo[year] + 1));
          linkColors.push(styleManager.hexToRgba(linkColor, 0.5));

          linkCustomdata.push(
            popupManager.generateLinkPopup(
              hijo["Nodo Hijo"],
              hijo[year],
              hijo["Nodo Hijo"],
              "Residencial",
              linkColor,
              year,
              { flowType: "to_residencial_secondary" },
            ),
          );
        }
      }
    });
  }

  // --- NODO Petroquímica Pemex ---
  const petroquimicaNodeData = dataManager.getNodeData("Petroquímica Pemex");
  if (petroquimicaNodeData && petroquimicaNodeData["Nodos Hijo"]) {
    // Calcular el valor total sumando los valores absolutos
    const totalValue = petroquimicaNodeData["Nodos Hijo"].reduce(
      (sum, item) => {
        return sum + Math.abs(parseFloat(item[year]) || 0);
      },
      0,
    );

    // Formatear el valor con 2 decimales
    const formattedValue = totalValue.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    // Crear nodo con el valor en el nombre
    const petroquimicaIndex = addNode(
      `${petroquimicaNodeData["Nodo Padre"]} <br>(${formattedValue} PJ)`,
      petroquimicaNodeData.color,
    );
    nodeX[petroquimicaIndex] = 0.9;
    nodeY[petroquimicaIndex] = 0.8;

    // Calcular el total sumando los valores de los hijos
    const totalPetroquimica = petroquimicaNodeData["Nodos Hijo"].reduce(
      (sum, hijo) => {
        return sum + (parseFloat(hijo[year]) || 0);
      },
      0,
    );

    // Crear un objeto con el formato esperado por la plantilla simple_source
    const popupData = {
      label: "Sector Petroquímica Pemex",
      total: totalPetroquimica,
      unit: "PJ",
    };

    // Generar el popup
    nodeCustomdata[petroquimicaIndex] = popupManager.generateNodePopup(
      "Sector Petroquímica Pemex",
      popupData,
      year,
      popupData,
      "text",
      "Todos",
      "simple_source",
    );

    // --- Crear enlaces desde los nodos de energía primaria al nodo Petroquímica ---
    if (petroquimicaNodeData && petroquimicaNodeData["Nodos Hijo"]) {
      petroquimicaNodeData["Nodos Hijo"].forEach((hijo) => {
        if (hijo.tipo === "Energía Primaria" && hijo[year] > 0) {
          const sourceNodeIndex = energeticNodesMap.get(hijo["Nodo Hijo"]);

          if (sourceNodeIndex !== undefined) {
            const linkColor =
              styleManager.getEnergyColor(hijo["Nodo Hijo"]) ||
              hijo.color ||
              "#999999";
            const linkValue = Math.log10(parseFloat(hijo[year]) + 1);

            source.push(sourceNodeIndex);
            target.push(petroquimicaIndex);
            value.push(linkValue);
            linkColors.push(styleManager.hexToRgba(linkColor, 0.5));

            // Crear el popup para el enlace
            linkCustomdata.push(
              popupManager.generateLinkPopup(
                hijo["Nodo Hijo"],
                parseFloat(hijo[year]),
                hijo["Nodo Hijo"],
                petroquimicaNodeData["Nodo Padre"],
                linkColor,
                year,
                {
                  flowType: "to_petroquimica_primary",
                  template: "simple",
                },
              ),
            );
          }
        }
      });
    }

    // Crear enlaces desde energéticos secundarios
    petroquimicaNodeData["Nodos Hijo"].forEach((hijo) => {
      if (hijo.tipo === "Energía Secundaria" && hijo[year] > 0) {
        const sourceNodeIndex = secondaryEnergeticNodesMap.get(
          hijo["Nodo Hijo"],
        );
        if (sourceNodeIndex !== undefined) {
          const linkColor =
            styleManager.getEnergyColor(hijo["Nodo Hijo"]) || "#999999";

          source.push(sourceNodeIndex);
          target.push(petroquimicaIndex);
          value.push(Math.log10(hijo[year] + 1));
          linkColors.push(styleManager.hexToRgba(linkColor, 0.5));

          linkCustomdata.push(
            popupManager.generateLinkPopup(
              hijo["Nodo Hijo"],
              hijo[year],
              hijo["Nodo Hijo"],
              "Petroquímica Pemex",
              linkColor,
              year,
              { flowType: "to_petroquimica_secondary" },
            ),
          );
        }
      }
    });
  }

  // --- NODO Otras ramas económicas ---
  const otrasRamasEconomicasNodeData = dataManager.getNodeData(
    "Otras ramas económicas",
  );
  if (
    otrasRamasEconomicasNodeData &&
    otrasRamasEconomicasNodeData["Nodos Hijo"]
  ) {
    // Calcular el valor total sumando los valores absolutos
    const totalValue = otrasRamasEconomicasNodeData["Nodos Hijo"].reduce(
      (sum, item) => {
        return sum + Math.abs(parseFloat(item[year]) || 0);
      },
      0,
    );

    // Formatear el valor con 2 decimales
    const formattedValue = totalValue.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    // Crear nodo con el valor en el nombre
    const otrasRamasEconomicasIndex = addNode(
      `${otrasRamasEconomicasNodeData["Nodo Padre"]}<br>(${formattedValue} PJ)`,
      otrasRamasEconomicasNodeData.color,
    );
    nodeX[otrasRamasEconomicasIndex] = 0.9;
    nodeY[otrasRamasEconomicasIndex] = 0.85;
    // Calcular el total sumando los valores de los hijos
    const totalOtrasRamasEconomicas = otrasRamasEconomicasNodeData[
      "Nodos Hijo"
    ].reduce((sum, hijo) => {
      return sum + (parseFloat(hijo[year]) || 0);
    }, 0);

    // Crear un objeto con el formato esperado por la plantilla simple_source
    const popupData = {
      label: "Sector Otras ramas económicas", // Cambiamos esto
      total: totalOtrasRamasEconomicas,
      unit: "PJ", // Ajusta la unidad según corresponda
    };

    // Generar el popup
    nodeCustomdata[otrasRamasEconomicasIndex] = popupManager.generateNodePopup(
      "Sector Otras ramas económicas", // Y aquí también
      popupData, // Pasamos los datos formateados
      year,
      popupData, // Mismos datos para el desglose
      "text",
      "Todos",
      "simple_source",
    );
    // Crear enlaces desde energéticos primarios
    // Después de crear los nodos de energía primaria y tener el mapa energeticNodesMap

    // --- Crear enlaces desde los nodos de energía primaria al nodo Otras ramas económicas ---
    if (
      otrasRamasEconomicasNodeData &&
      otrasRamasEconomicasNodeData["Nodos Hijo"]
    ) {
      otrasRamasEconomicasNodeData["Nodos Hijo"].forEach((hijo) => {
        if (hijo.tipo === "Energía Primaria" && hijo[year] > 0) {
          const sourceNodeIndex = energeticNodesMap.get(hijo["Nodo Hijo"]);

          if (sourceNodeIndex !== undefined) {
            const linkColor =
              styleManager.getEnergyColor(hijo["Nodo Hijo"]) ||
              hijo.color ||
              "#999999";
            const linkValue = Math.log10(parseFloat(hijo[year]) + 1);

            source.push(sourceNodeIndex);
            target.push(otrasRamasEconomicasIndex);
            value.push(linkValue);
            linkColors.push(styleManager.hexToRgba(linkColor, 0.5));

            // Crear el popup para el enlace
            linkCustomdata.push(
              popupManager.generateLinkPopup(
                hijo["Nodo Hijo"],
                parseFloat(hijo[year]),
                hijo["Nodo Hijo"],
                otrasRamasEconomicasNodeData["Nodo Padre"],
                linkColor,
                year,
                {
                  flowType: "to_otras_ramas_economicas_primary",
                  template: "simple",
                },
              ),
            );
          }
        }
      });
    }

    // Crear enlaces desde energéticos secundarios
    otrasRamasEconomicasNodeData["Nodos Hijo"].forEach((hijo) => {
      if (hijo.tipo === "Energía Secundaria" && hijo[year] > 0) {
        const sourceNodeIndex = secondaryEnergeticNodesMap.get(
          hijo["Nodo Hijo"],
        );
        if (sourceNodeIndex !== undefined) {
          const linkColor =
            styleManager.getEnergyColor(hijo["Nodo Hijo"]) || "#999999";

          source.push(sourceNodeIndex);
          target.push(otrasRamasEconomicasIndex);
          value.push(Math.log10(hijo[year] + 1));
          linkColors.push(styleManager.hexToRgba(linkColor, 0.5));

          linkCustomdata.push(
            popupManager.generateLinkPopup(
              hijo["Nodo Hijo"],
              hijo[year],
              hijo["Nodo Hijo"],
              "Otras ramas económicas",
              linkColor,
              year,
              { flowType: "to_otras_Ramas_economicas_secondary" },
            ),
          );
        }
      }
    });
  }

  // --- Y AQUÍ GENERAREMOS LOS ENLACES ---
  // Enlaces de Importación a energéticos primarios de Oferta Interna Bruta
  if (
    importacionNodeData &&
    ofertaInternaBrutaFullData &&
    ofertaInternaBrutaFullData["Nodos Hijo"]
  ) {
    const primaryEnergeticsInOIB = ofertaInternaBrutaFullData[
      "Nodos Hijo"
    ].filter((child) => child.tipo === "Energía Primaria");

    primaryEnergeticsInOIB.forEach((energetic) => {
      const energeticName = energetic["Nodo Hijo"];
      const energeticValueFromImportacion = dataManager.getEnergeticValue(
        "Importación",
        energeticName,
        year,
      );

      if (
        energeticValueFromImportacion !== null &&
        energeticValueFromImportacion > 0
      ) {
        const linkColor =
          styleManager.getEnergyColor(energeticName) || energetic.color;
        console.log(
          `[DEBUG - Enlace Importación]Energético: ${energeticName}, Color de enlace: ${linkColor} `,
        );
        source.push(nodeMap.get("Importación"));
        target.push(energeticNodesMap.get(energeticName));
        value.push(Math.log10(energeticValueFromImportacion + 1));
        linkColors.push(styleManager.hexToRgba(linkColor, 0.5));
        linkCustomdata.push(
          popupManager.generateLinkPopup(
            energeticName,
            energeticValueFromImportacion,
            "Importación",
            energeticName,
            linkColor,
            year,
            { flowType: "primary_supply" },
          ),
        );
      }
    });
  }

  // Enlaces de Producción a energéticos primarios de Oferta Interna Bruta
  if (
    produccionNodeData &&
    ofertaInternaBrutaFullData &&
    ofertaInternaBrutaFullData["Nodos Hijo"]
  ) {
    const primaryEnergeticsInOIB = ofertaInternaBrutaFullData[
      "Nodos Hijo"
    ].filter((child) => child.tipo === "Energía Primaria");

    primaryEnergeticsInOIB.forEach((energetic) => {
      const energeticName = energetic["Nodo Hijo"];
      const energeticValueFromProduccion = dataManager.getEnergeticValue(
        "Producción",
        energeticName,
        year,
      );

      if (
        energeticValueFromProduccion !== null &&
        energeticValueFromProduccion > 0
      ) {
        const linkColor =
          styleManager.getEnergyColor(energeticName) || energetic.color;
        console.log(
          `[DEBUG - Enlace Producción]Energético: ${energeticName}, Color de enlace: ${linkColor} `,
        );
        source.push(nodeMap.get("Producción"));
        target.push(energeticNodesMap.get(energeticName));
        value.push(Math.log10(energeticValueFromProduccion + 1));
        linkColors.push(styleManager.hexToRgba(linkColor, 0.5));
        linkCustomdata.push(
          popupManager.generateLinkPopup(
            energeticName,
            energeticValueFromProduccion,
            "Producción",
            energeticName,
            linkColor,
            year,
            { flowType: "primary_supply" },
          ),
        );
      }
    });
  }

  // Enlaces de Variación de Inventarios a energéticos primarios de Oferta Interna Bruta
  if (
    variacionNodeData &&
    ofertaInternaBrutaFullData &&
    ofertaInternaBrutaFullData["Nodos Hijo"]
  ) {
    const primaryEnergeticsInOIB = ofertaInternaBrutaFullData[
      "Nodos Hijo"
    ].filter((child) => child.tipo === "Energía Primaria");

    primaryEnergeticsInOIB.forEach((energetic) => {
      const energeticName = energetic["Nodo Hijo"];
      const energeticValueFromVariacion = dataManager.getEnergeticValue(
        "Variación de Inventarios",
        energeticName,
        year,
      );

      // Los valores de variación pueden ser negativos, pero Plotly espera valores positivos para `value`
      // El signo se manejará en el popup.
      if (
        energeticValueFromVariacion !== null &&
        Math.abs(energeticValueFromVariacion) > 0
      ) {
        const linkColor =
          styleManager.getEnergyColor(energeticName) || energetic.color;
        console.log(
          `[DEBUG - Enlace Variación]Energético: ${energeticName}, Color de enlace: ${linkColor} `,
        );
        source.push(nodeMap.get("Variación de Inventarios"));
        target.push(energeticNodesMap.get(energeticName));
        value.push(Math.log10(Math.abs(energeticValueFromVariacion) + 1));
        linkColors.push(styleManager.hexToRgba(linkColor, 0.5));
        linkCustomdata.push(
          popupManager.generateLinkPopup(
            energeticName,
            energeticValueFromVariacion,
            "Variación de Inventarios",
            energeticName,
            linkColor,
            year,
            { flowType: "primary_supply" },
          ),
        );
      }
    });
  }

  // Enlaces de energéticos primarios a Exportación
  if (
    coquizadorasyhornosNodeData &&
    ofertaInternaBrutaFullData &&
    ofertaInternaBrutaFullData["Nodos Hijo"]
  ) {
    const primaryEnergeticsInOIB = ofertaInternaBrutaFullData[
      "Nodos Hijo"
    ].filter((child) => child.tipo === "Energía Primaria");

    primaryEnergeticsInOIB.forEach((energetic) => {
      const energeticName = energetic["Nodo Hijo"];
      const energeticValueToExportacion = dataManager.getEnergeticValue(
        "Exportación",
        energeticName,
        year,
      );
      console.log(
        `[DEBUG - Flujo Exportación] ${energeticName}: ${energeticValueToExportacion} `,
      );
      if (
        energeticValueToExportacion !== null &&
        Math.abs(energeticValueToExportacion) > 0
      ) {
        const linkColor =
          styleManager.getEnergyColor(energeticName) || energetic.color;
        console.log(
          `[DEBUG - Enlace Exportación]Energético: ${energeticName}, Color de enlace: ${linkColor} `,
        );
        source.push(energeticNodesMap.get(energeticName));
        target.push(nodeMap.get("Exportación"));
        value.push(Math.log10(Math.abs(energeticValueToExportacion) + 1));
        linkColors.push(styleManager.hexToRgba(linkColor, 0.5));
        linkCustomdata.push(
          popupManager.generateLinkPopup(
            energeticName,
            energeticValueToExportacion,
            energeticName,
            "Exportación",
            linkColor,
            year,
            { flowType: "primary_demand" },
          ),
        );
      }
    });
  }

  // Enlaces de energéticos primarios a Energía No Aprovechada
  if (
    energiaNoAprovechadaNodeData &&
    ofertaInternaBrutaFullData &&
    ofertaInternaBrutaFullData["Nodos Hijo"]
  ) {
    const primaryEnergeticsInOIB = ofertaInternaBrutaFullData[
      "Nodos Hijo"
    ].filter((child) => child.tipo === "Energía Primaria");

    primaryEnergeticsInOIB.forEach((energetic) => {
      const energeticName = energetic["Nodo Hijo"];
      const energeticValueToNoAprovechada = dataManager.getEnergeticValue(
        "Energía No Aprovechada",
        energeticName,
        year,
      );
      console.log(
        `[DEBUG - Flujo Energía No Aprovechada] ${energeticName}: ${energeticValueToNoAprovechada} `,
      );
      if (
        energeticValueToNoAprovechada !== null &&
        Math.abs(energeticValueToNoAprovechada) > 0
      ) {
        const linkColor =
          styleManager.getEnergyColor(energeticName) || energetic.color;
        console.log(
          `[DEBUG - Enlace Energía No Aprovechada]Energético: ${energeticName}, Color de enlace: ${linkColor} `,
        );
        source.push(energeticNodesMap.get(energeticName));
        target.push(nodeMap.get("Energía No Aprovechada"));
        value.push(Math.log10(Math.abs(energeticValueToNoAprovechada) + 1));
        linkColors.push(styleManager.hexToRgba(linkColor, 0.5));
        linkCustomdata.push(
          popupManager.generateLinkPopup(
            energeticName,
            energeticValueToNoAprovechada,
            energeticName,
            "Energía No Aprovechada",
            linkColor,
            year,
            { flowType: "primary_demand" },
          ),
        );
      }
    });
  }

  // Enlaces de energéticos primarios a Coquizadoras y Hornos
  if (
    coquizadorasyhornosNodeData &&
    ofertaInternaBrutaFullData &&
    ofertaInternaBrutaFullData["Nodos Hijo"]
  ) {
    const primaryEnergeticsInOIB = ofertaInternaBrutaFullData[
      "Nodos Hijo"
    ].filter((child) => child.tipo === "Energía Primaria");

    primaryEnergeticsInOIB.forEach((energetic) => {
      const energeticName = energetic["Nodo Hijo"];
      const energeticValueToExportacion = dataManager.getEnergeticValue(
        "Coquizadoras y Hornos",
        energeticName,
        year,
      );
      console.log(
        `[DEBUG - Flujo Coquizadoras y Hornos] ${energeticName}: ${energeticValueToExportacion} `,
      );
      if (
        energeticValueToExportacion !== null &&
        Math.abs(energeticValueToExportacion) > 0
      ) {
        const linkColor =
          styleManager.getEnergyColor(energeticName) || energetic.color;
        console.log(
          `[DEBUG - Enlace Coquizadoras y Hornos]Energético: ${energeticName}, Color de enlace: ${linkColor} `,
        );
        source.push(energeticNodesMap.get(energeticName));
        target.push(nodeMap.get("Coquizadoras y Hornos"));
        value.push(Math.log10(Math.abs(energeticValueToExportacion) + 1));
        linkColors.push(styleManager.hexToRgba(linkColor, 0.5));
        linkCustomdata.push(
          popupManager.generateLinkPopup(
            energeticName,
            energeticValueToExportacion,
            energeticName,
            "Coquizadoras y Hornos",
            linkColor,
            year,
            { flowType: "primary_demand" },
          ),
        );
      }
    });
  }

  // Enlaces de energéticos primarios a Plantas de Gas y Fraccionadoras
  if (
    plantasdegasyfraccionadorasNodeData &&
    ofertaInternaBrutaFullData &&
    ofertaInternaBrutaFullData["Nodos Hijo"]
  ) {
    const primaryEnergeticsInOIB = ofertaInternaBrutaFullData[
      "Nodos Hijo"
    ].filter((child) => child.tipo === "Energía Primaria");

    primaryEnergeticsInOIB.forEach((energetic) => {
      const energeticName = energetic["Nodo Hijo"];
      const energeticValueToExportacion = dataManager.getEnergeticValue(
        "Plantas de Gas y Fraccionadoras",
        energeticName,
        year,
      );
      console.log(
        `[DEBUG - Flujo Plantas de Gas y Fraccionadoras] ${energeticName}: ${energeticValueToExportacion} `,
      );
      if (
        energeticValueToExportacion !== null &&
        Math.abs(energeticValueToExportacion) > 0
      ) {
        const linkColor =
          styleManager.getEnergyColor(energeticName) || energetic.color;
        console.log(
          `[DEBUG - Enlace Plantas de Gas y Fraccionadoras]Energético: ${energeticName}, Color de enlace: ${linkColor} `,
        );
        source.push(energeticNodesMap.get(energeticName));
        target.push(nodeMap.get("Plantas de Gas y Fraccionadoras"));
        value.push(Math.log10(Math.abs(energeticValueToExportacion) + 1));
        linkColors.push(styleManager.hexToRgba(linkColor, 0.5));
        linkCustomdata.push(
          popupManager.generateLinkPopup(
            energeticName,
            energeticValueToExportacion,
            energeticName,
            "Plantas de Gas y Fraccionadoras",
            linkColor,
            year,
            { flowType: "primary_demand" },
          ),
        );
      }
    });
  }

  // Enlaces de energéticos primarios a Refinerías y Despuntadoras
  if (
    refinerasydespuntadorasNodeData &&
    ofertaInternaBrutaFullData &&
    ofertaInternaBrutaFullData["Nodos Hijo"]
  ) {
    const primaryEnergeticsInOIB = ofertaInternaBrutaFullData[
      "Nodos Hijo"
    ].filter((child) => child.tipo === "Energía Primaria");

    primaryEnergeticsInOIB.forEach((energetic) => {
      const energeticName = energetic["Nodo Hijo"];
      const energeticValueToRefinerasydespuntadoras =
        dataManager.getEnergeticValue(
          "Refinerías y Despuntadoras",
          energeticName,
          year,
        );
      console.log(
        `[DEBUG - Flujo Refinerías y Despuntadoras] ${energeticName}: ${energeticValueToRefinerasydespuntadoras} `,
      );
      if (
        energeticValueToRefinerasydespuntadoras !== null &&
        Math.abs(energeticValueToRefinerasydespuntadoras) > 0
      ) {
        const linkColor =
          styleManager.getEnergyColor(energeticName) || energetic.color;
        console.log(
          `[DEBUG - Enlace Refinerías y Despuntadoras]Energético: ${energeticName}, Color de enlace: ${linkColor} `,
        );
        source.push(energeticNodesMap.get(energeticName));
        target.push(nodeMap.get("Refinerías y Despuntadoras"));
        value.push(
          Math.log10(Math.abs(energeticValueToRefinerasydespuntadoras) + 1),
        );
        linkColors.push(styleManager.hexToRgba(linkColor, 0.5));
        linkCustomdata.push(
          popupManager.generateLinkPopup(
            energeticName,
            energeticValueToRefinerasydespuntadoras,
            energeticName,
            "Refinerías y Despuntadoras",
            linkColor,
            year,
            { flowType: "primary_demand" },
          ),
        );
      }
    });
  }

  // Enlaces de energéticos primarios a Centrales Eléctricas
  if (
    centraleselectricasNodeData &&
    ofertaInternaBrutaFullData &&
    ofertaInternaBrutaFullData["Nodos Hijo"]
  ) {
    const primaryEnergeticsInOIB = ofertaInternaBrutaFullData[
      "Nodos Hijo"
    ].filter((child) => child.tipo === "Energía Primaria");

    primaryEnergeticsInOIB.forEach((energetic) => {
      const energeticName = energetic["Nodo Hijo"];
      const energeticValueToCentraleselectricas = dataManager.getEnergeticValue(
        "Centrales Eléctricas",
        energeticName,
        year,
      );
      console.log(
        `[DEBUG - Flujo Centrales Eléctricas] ${energeticName}: ${energeticValueToCentraleselectricas} `,
      );
      if (
        energeticValueToCentraleselectricas !== null &&
        Math.abs(energeticValueToCentraleselectricas) > 0
      ) {
        const linkColor =
          styleManager.getEnergyColor(energeticName) || energetic.color;
        console.log(
          `[DEBUG - Enlace Centrales Eléctricas]Energético: ${energeticName}, Color de enlace: ${linkColor} `,
        );
        source.push(energeticNodesMap.get(energeticName));
        target.push(nodeMap.get("Centrales Eléctricas"));
        value.push(
          Math.log10(Math.abs(energeticValueToCentraleselectricas) + 1),
        );
        linkColors.push(styleManager.hexToRgba(linkColor, 0.5));
        linkCustomdata.push(
          popupManager.generateLinkPopup(
            energeticName,
            energeticValueToCentraleselectricas,
            energeticName,
            "Centrales Eléctricas",
            linkColor,
            year,
            { flowType: "primary_demand" },
          ),
        );
      }
    });
  }
  //OJO

  // Enlaces desde Coquizadoras y Hornos a Centrales Eléctricas (solo secundarios que realmente existen en Coquizadoras)
  if (coquizadorasyhornosNodeData && centraleselectricasNodeData) {
    // Obtenemos los hijos secundarios que realmente existen en Coquizadoras
    const secundarios = (
      coquizadorasyhornosNodeData["Nodos Hijo"] || []
    ).filter((energetic) => {
      // Verificar si es un energético secundario
      const isSecondary = energetic.tipo === "Energía Secundaria";

      // Verificar si tiene valor para el año actual
      const hasValue =
        energetic[year] !== undefined &&
        energetic[year] !== null &&
        energetic[year] > 0;

      console.log(
        `[DEBUG] ${coquizadorasyhornosNodeData["Nodo Padre"]} - ${energetic["Nodo Hijo"]}: `,
        `tipo=${energetic.tipo}, valor=${energetic[year]}, ` +
          `esSecundario=${isSecondary}, tieneValor=${hasValue}`,
      );

      return isSecondary && hasValue;
    });

    // Para cada energético secundario que existe en Coquizadoras, creamos el enlace
    secundarios.forEach((energetic) => {
      const energeticName = energetic["Nodo Hijo"];
      // Obtenemos el valor directamente de Coquizadoras
      const energeticValue = dataManager.getEnergeticValue(
        "Coquizadoras y Hornos",
        energeticName,
        year,
      );

      const linkColor = styleManager.getEnergyColor(energeticName) || "#999999";

      source.push(nodeMap.get("Coquizadoras y Hornos"));
      target.push(nodeMap.get("Centrales Eléctricas"));
      value.push(Math.log10(energeticValue + 1));
      linkColors.push(styleManager.hexToRgba(linkColor, 0.5));

      linkCustomdata.push(
        popupManager.generateLinkPopup(
          energeticName,
          energeticValue,
          "Coquizadoras y Hornos",
          "Centrales Eléctricas",
          linkColor,
          year,
          { flowType: "secondary_supply" },
        ),
      );
    });
  }

  // Enlaces desde Refinerías y Despuntadoras a Centrales Eléctricas
  if (refinerasydespuntadorasNodeData && centraleselectricasNodeData) {
    // Obtenemos los hijos secundarios que realmente existen en Refinerías
    const secundarios = (
      refinerasydespuntadorasNodeData["Nodos Hijo"] || []
    ).filter((energetic) => {
      const valorEnRefinerias = dataManager.getEnergeticValue(
        "Refinerías y Despuntadoras",
        energetic["Nodo Hijo"],
        year,
      );
      return (
        energetic.tipo === "Energía Secundaria" &&
        valorEnRefinerias !== null &&
        Math.abs(valorEnRefinerias) > 0
      );
    });

    // Para cada energético secundario que existe en Refinerías, creamos el enlace
    secundarios.forEach((energetic) => {
      const energeticName = energetic["Nodo Hijo"];
      const energeticValue = dataManager.getEnergeticValue(
        "Refinerías y Despuntadoras",
        energeticName,
        year,
      );

      const linkColor = styleManager.getEnergyColor(energeticName) || "#999999";

      source.push(nodeMap.get("Refinerías y Despuntadoras"));
      target.push(nodeMap.get("Centrales Eléctricas"));
      value.push(Math.log10(energeticValue + 1));
      linkColors.push(styleManager.hexToRgba(linkColor, 0.5));

      linkCustomdata.push(
        popupManager.generateLinkPopup(
          energeticName,
          energeticValue,
          "Refinerías y Despuntadoras",
          "Centrales Eléctricas",
          linkColor,
          year,
          { flowType: "secondary_supply" },
        ),
      );
    });
  }

  // Enlaces desde Plantas de Gas y Fraccionadoras a Centrales Eléctricas
  if (plantasdegasyfraccionadorasNodeData && centraleselectricasNodeData) {
    // Obtenemos los hijos secundarios que realmente existen en Plantas de Gas
    const secundarios = (
      plantasdegasyfraccionadorasNodeData["Nodos Hijo"] || []
    ).filter((energetic) => {
      const valorEnPlantas = dataManager.getEnergeticValue(
        "Plantas de Gas y Fraccionadoras",
        energetic["Nodo Hijo"],
        year,
      );
      return (
        energetic.tipo === "Energía Secundaria" &&
        valorEnPlantas !== null &&
        Math.abs(valorEnPlantas) > 0
      );
    });

    // Para cada energético secundario que existe en Plantas de Gas, creamos el enlace
    secundarios.forEach((energetic) => {
      const energeticName = energetic["Nodo Hijo"];
      const energeticValue = dataManager.getEnergeticValue(
        "Plantas de Gas y Fraccionadoras",
        energeticName,
        year,
      );

      const linkColor = styleManager.getEnergyColor(energeticName) || "#999999";

      source.push(nodeMap.get("Plantas de Gas y Fraccionadoras"));
      target.push(nodeMap.get("Centrales Eléctricas"));
      value.push(Math.log10(energeticValue + 1));
      linkColors.push(styleManager.hexToRgba(linkColor, 0.5));

      linkCustomdata.push(
        popupManager.generateLinkPopup(
          energeticName,
          energeticValue,
          "Plantas de Gas y Fraccionadoras",
          "Centrales Eléctricas",
          linkColor,
          year,
          { flowType: "secondary_supply" },
        ),
      );
    });
  }

  // --- Enlaces desde nodos de transformación a energéticos secundarios ---
  const transformationNodes = [
    "Coquizadoras y Hornos",
    "Refinerías y Despuntadoras",
    "Plantas de Gas y Fraccionadoras",
    "Centrales Eléctricas",
  ];
  transformationNodes.forEach((nodeName) => {
    const nodeData = dataManager.getNodeData(nodeName);
    console.log(`[DEBUG] Procesando nodo: ${nodeName}`, nodeData);

    if (nodeData && nodeData["Nodos Hijo"]) {
      // Primero mostramos todos los hijos para depuración
      console.log(
        `[DEBUG] Todos los hijos de ${nodeName}:`,
        nodeData["Nodos Hijo"].map((c) => ({
          nombre: c["Nodo Hijo"],
          tipo: c.tipo,
          isOutput: c.isOutput,
        })),
      );

      // Luego filtramos
      // Modificar la sección de filtrado de salidas secundarias
      const outputSecondaries = nodeData["Nodos Hijo"].filter((child) => {
        // Verificar si es un energético secundario
        const isSecondary = child.tipo === "Energía Secundaria";

        // Verificar si tiene valor para el año actual
        const hasValue =
          child[year] !== undefined && child[year] !== null && child[year] > 0;

        console.log(
          `[DEBUG] ${nodeName} - ${child["Nodo Hijo"]}: `,
          `tipo=${child.tipo}, valor=${child[year]}, ` +
            `esSecundario=${isSecondary}, tieneValor=${hasValue}`,
        );

        return isSecondary && hasValue;
      });

      console.log(
        `[DEBUG] ${nodeName} - Salidas secundarias con valor:`,
        outputSecondaries.map((e) => `${e["Nodo Hijo"]} (${e[year]})`),
      );

      outputSecondaries.forEach((energetic) => {
        const energeticName = energetic["Nodo Hijo"];
        console.log(
          `[DEBUG] Procesando enlace para ${nodeName} -> ${energeticName} `,
        );

        const targetNodeIndex = secondaryEnergeticNodesMap.get(energeticName);
        if (targetNodeIndex === undefined) {
          console.warn(
            `[WARN] No se encontró el nodo destino para ${energeticName} en el mapa de nodos secundarios`,
          );
          console.log("[DEBUG] Mapa actual de nodos secundarios:", [
            ...secondaryEnergeticNodesMap.keys(),
          ]);
          return;
        }

        const sourceNodeIndex = nodeMap.get(nodeName);
        if (sourceNodeIndex === undefined) {
          console.warn(
            `[WARN] No se encontró el índice para el nodo fuente: ${nodeName} `,
          );
          return;
        }

        // Cambio importante: Usar directamente el valor del año del objeto energetic
        const energeticValue = parseFloat(energetic[year]) || 0;
        console.log(
          `[DEBUG] Valor obtenido para ${nodeName} -> ${energeticName}: `,
          energeticValue,
        );

        if (energeticValue > 0) {
          // Ya no necesitamos Math.abs ya que verificamos > 0
          const linkColor =
            styleManager.getEnergyColor(energeticName) || "#999999";

          source.push(sourceNodeIndex);
          target.push(targetNodeIndex);
          value.push(Math.log10(energeticValue + 1));
          linkColors.push(styleManager.hexToRgba(linkColor, 0.5));

          console.log(
            `[DEBUG] Creando enlace: ${nodeName} (${sourceNodeIndex}) -> ${energeticName} (${targetNodeIndex}) = ${energeticValue}`,
          );

          linkCustomdata.push(
            popupManager.generateLinkPopup(
              energeticName,
              energeticValue,
              nodeName,
              energeticName,
              linkColor,
              year,
              { flowType: "secondary_output" },
            ),
          );
        } else {
          console.log(
            `[DEBUG] Valor no válido o cero para ${nodeName} -> ${energeticName}: `,
            energeticValue,
          );
        }
      });
    } else {
      console.warn(
        `[WARN] No se encontraron datos o hijos para el nodo: ${nodeName} `,
      );
    }
  });

  const data = {
    type: "sankey",
    orientation: "h",
    node: {
      pad: 100,
      thickness: 10,
      line: { color: "black", width: 0.5 },
      label: labels,
      value: nodeValues, // ← aquí añadimos los valores
      color: nodeColors,
      hovertemplate: "%{customdata}<extra></extra>",
      customdata: nodeCustomdata, // Usar el nuevo array nodeCustomdata
      x: nodeX,
      y: nodeY,
    },
    link: {
      source: source,
      target: target,
      value: value,
      color: linkColors,
      customdata: linkCustomdata,
      hovertemplate: "%{customdata}<extra></extra>",
    },
  };

  const layout = {
    title: `Balance Nacional de Energía - ${year} (Valores en PJ)`,
    font: { size: 9 },
    margin: { l: 10, r: 10, t: 50, b: 10 },
    autosize: true,
  };
  const config = {
    displaylogo: false,
    responsive: true,
    toImageButtonOptions: {
      format: "png",
      filename: `sankey_energia_primaria_${year}`,
      setBackground: "transparent",
      width: 1920,
      height: 1080,
      scale: 1,
    },
  };

  Plotly.newPlot(sankeyDiv, [data], layout, config)
    .then(() => {
      if (!zoomManager) {
        zoomManager = new ZoomManager(zoomWrapperDiv, {
          target: sankeyDiv,
          minScale: 1,
        });
      }
      // Renderizar etiquetas de columnas después de que el diagrama esté listo
      if (columnLabelsManager && columnLabelsManager.isEnabled()) {
        // Usar setTimeout para asegurar que el diagrama esté completamente renderizado
        setTimeout(() => {
          columnLabelsManager.renderLabels(sankeyDiv);
        }, 100);
      }
    })
    .catch((error) => {
      console.error("Error al renderizar el diagrama de Sankey:", error);
    });
}
