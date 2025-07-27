# Guía de Desarrollo - Sistema Sankey de Energía

Esta guía está diseñada para que cualquier modelo de lenguaje pueda entender rápidamente la estructura del sistema y realizar modificaciones eficientemente.

## 📁 Estructura de Archivos

```
public/
├── index.html              # Archivo principal con lógica del diagrama
├── datos_energia_completo.json  # Datos energéticos
└── js/
    ├── LinkManager.js      # Gestión de enlaces entre nodos
    ├── PopupManager.js     # Gestión de popups informativos
    ├── StyleManager.js     # Gestión de colores y estilos
    └── NodeFactory.js      # Creación y gestión de nodos
```

## 🎯 Tareas Comunes y Ubicaciones

### 1. CREAR/MODIFICAR NODOS

**Ubicación:** `public/index.html` líneas ~1200-1600

**Para agregar un nuevo nodo:**
```javascript
// Buscar la sección "Crear nodos principales"
const nuevoNodoIndex = addNode('Nombre del Nodo', '#COLOR');
```

**Para modificar posición de nodos:**
```javascript
// Buscar arrays nodeX y nodeY (línea ~1700)
nodeX[indiceDelNodo] = 0.1;  // Posición horizontal (0-1)
nodeY[indiceDelNodo] = 0.5;  // Posición vertical (0-1)
```

### 2. CREAR/MODIFICAR ENLACES (LINKS)

**Ubicación:** `public/js/LinkManager.js`

**Para agregar nuevos mapeos de enlaces:**
```javascript
// Buscar initializeDefaultMappings() línea ~50
this.registerConnectionMap('nuevo-tipo', new Map([
    ['Nodo Origen', [
        { target: 'Nodo Destino', energetics: ['Energético1', 'Energético2'] }
    ]]
]));
```

**Para activar tipos de enlaces:**
```javascript
// En index.html, buscar generateDataLinks (línea ~1660)
mapTypes: ['fuel-to-generation', 'distribution-to-transformation', 'transformation-to-generation']
```

### 3. CREAR/MODIFICAR HUBS

**Ubicación:** `public/index.html` líneas ~1400-1500

**Para crear un hub:**
```javascript
// 1. Crear el nodo hub
const hubIndex = addNode('Nombre Hub', '#COLOR');

// 2. Agregar lógica de consolidación
let totalHub = 0;
nodosFuente.forEach(nodo => {
    totalHub += valorDelNodo;
});

// 3. Crear enlaces hacia el hub
source.push(nodoOrigenIndex);
target.push(hubIndex);
value.push(Math.log10(valor + 1));
```

### 4. MODIFICAR POPUPS

**Ubicación:** `public/js/PopupManager.js`

**Para crear nuevo template de popup:**
```javascript
// Buscar initializeDefaultTemplates() línea ~60
const nuevoTemplate = {
    type: 'tipo_especial'  // Para formato compacto
    // O estructura completa para formato detallado:
    title: '%{label}',
    sections: [
        {
            title: 'Sección',
            fields: [
                { key: 'campo', label: 'Etiqueta', value: '%{campo}', format: 'number', unit: 'PJ' }
            ]
        }
    ]
};
```

**Para formato compacto (como Carboeléctrica):**
```javascript
// En renderNodeTemplateAsText(), agregar:
if (template.type === 'mi_tipo') {
    const entrada = this.formatNumber(data.total_input || 0);
    const salida = this.formatNumber(data.total_output || 0);
    const eficiencia = data.efficiency || 0;
    return `${data.label}\n↓${entrada}PJ ↑${salida}PJ ⚡${eficiencia}%`;
}
```

### 5. VALIDAR/CORREGIR CIFRAS

**Ubicación:** `public/datos_energia_completo.json`

**Estructura de datos:**
```json
{
  "Nodo Padre": "Nombre Tecnología",
  "Nodos Hijo": [
    {
      "Nodo Hijo": "Energético",
      "tipo": "Energía Primaria|Energía Secundaria",
      "2024": -50.5,  // Negativo = consumo, Positivo = producción
      "descripcion": "Descripción del energético"
    }
  ]
}
```

**Para validar cifras:**
1. Verificar que consumos sean negativos y producciones positivas
2. Verificar que `tipo` sea correcto ("Energía Primaria" o "Energía Secundaria")
3. Verificar que las sumas cuadren entre nodos relacionados

### 6. CAMBIAR COLORES

**Ubicación:** `public/js/StyleManager.js`

**Para modificar colores:**
```javascript
// Buscar energyColorMap (línea ~50)
'Nombre Energético': '#HEXCOLOR'
```

### 7. MODIFICAR POSICIONES DE COLUMNAS

**Ubicación:** `public/index.html` líneas ~1700-1800

**Posiciones X (columnas):**
- 0.0 = Extremo izquierdo
- 0.2 = Fuentes primarias
- 0.4 = Hubs/Distribución  
- 0.6 = Transformación
- 0.8 = Generación
- 1.0 = Extremo derecho

## 🔧 Patrones de Código Importantes

### AGREGAR NUEVO NODO FILTRADO (Ejemplo: Importación de energéticos secundarios)

**Paso 1: Crear el nodo y calcular su valor**
```javascript
// En public/index.html, sección ~1870 (antes de transformationCenters)
// 1. Calcular el valor filtrado desde los datos originales
let totalImportacionSecundarios = 0;
if (nodeData.importacion && nodeData.importacion['Nodos Hijo']) {
    nodeData.importacion['Nodos Hijo'].forEach(child => {
        if (child.tipo === 'Energía Secundaria') { // Filtro
            const flowValue = child[year] || 0;
            totalImportacionSecundarios += flowValue;
        }
    });
}

// 2. Crear el nodo con addNode()
let importacionSecundariosIndex = null;
if (totalImportacionSecundarios !== 0) {
    importacionSecundariosIndex = addNode('Importación de energéticos secundarios', '#3498db');
}
```

**Paso 2: Crear enlaces para que el nodo sea visible**
```javascript
// 3. Crear enlaces separados por energético (con colores específicos)
if (nodeData.importacion && nodeData.importacion['Nodos Hijo']) {
    nodeData.importacion['Nodos Hijo'].forEach(child => {
        if (child.tipo === 'Energía Secundaria') {
            const flowValue = child[year] || 0;
            if (flowValue > 0) {
                const energeticName = child['Nodo Hijo'];
                const energeticColor = child.color || '#3498db';
                
                source.push(importacionSecundariosIndex);
                target.push(nodoDestinoIndex); // Hacia donde va el enlace
                value.push(Math.log10(flowValue + 1));
                linkColors.push(energeticColor);
                linkCustomdata.push(`${energeticName} importado: ${flowValue.toLocaleString()} PJ`);
            }
        }
    });
}
```

**Paso 3: Configurar popup del nodo**
```javascript
// En public/index.html, sección ~2180 (dentro de customNodeHover)
} else if (label === 'Importación de energéticos secundarios') {
    additionalData = {
        total_input: totalImportacionSecundarios,
        description: `Importaciones totales de energéticos secundarios`,
        unit: 'PJ'
    };
    nodeDataForPopup = nodeData.importacion; // Usar datos originales
```

**Paso 4: Agregar al LayoutEngine**
```javascript
// En public/js/LayoutEngine.js, agregar a una columna existente o crear nueva
this.defineColumn('fuentes-secundarios', {
    x: 0.05,
    title: 'Fuentes Secundarios',
    width: 0.15,
    nodes: ['Importación de energéticos secundarios'],
    verticalDistribution: 'center',
    minY: 0.1, // Posición vertical
    maxY: 0.25
});
```

**Paso 5: Variables importantes a definir**
```javascript
// Asegurarse de que estas variables estén disponibles en el scope:
// - totalImportacionSecundarios (calculado en paso 1)
// - importacionSecundariosIndex (creado en paso 1)
// - nodoDestinoIndex (hacia donde van los enlaces)
```

### Agregar Nodo con Datos para Popup
```javascript
// 1. Crear el nodo
const nodoIndex = addNode('Nombre', '#COLOR');

// 2. Preparar datos para popup (en customNodeHover)
if (label === 'Nombre') {
    additionalData = {
        total_input: valor1,
        total_output: valor2,
        efficiency: calculo,
        description: 'Descripción',
        unit: 'PJ'
    };
}
```

### Crear Enlaces Automáticos
```javascript
// En LinkManager.js, función generateDistributionToTransformationLinks
if (targetNode === 'Nueva Tecnología') {
    // Lógica para determinar qué energéticos procesar
    shouldProcessEnergetic = (flowValue !== undefined && flowValue < 0 && 
        child['Nodo Hijo'] !== 'Energía eléctrica' && 
        child.tipo === 'Energía Primaria'); // o 'Energía Secundaria'
}
```

### Calcular Totales y Eficiencias
```javascript
let totalInput = 0;
let totalOutput = 0;

nodeData['Nodos Hijo'].forEach(child => {
    const flowValue = child[year];
    if (flowValue !== undefined && flowValue !== 0) {
        if (flowValue < 0) {
            totalInput += Math.abs(flowValue);
        } else {
            totalOutput += flowValue;
        }
    }
});

const efficiency = totalInput > 0 ? (totalOutput / totalInput * 100).toFixed(1) : 0;
```

## 🚨 Puntos Críticos

1. **Siempre usar `Math.log10(valor + 1)`** para los valores de enlaces
2. **Los consumos deben ser negativos** en los datos JSON
3. **Verificar que `nodeMap.get()` no sea undefined** antes de usar índices
4. **Los energéticos primarios van desde "Oferta Interna Bruta"**
5. **Los energéticos secundarios van desde centros de transformación**
6. **Usar `addNode()` para crear nodos y obtener su índice**
7. **Siempre validar que los datos existan** antes de procesarlos
8. **Los nodos SIN ENLACES no se muestran** - siempre crear al menos un enlace
9. **Usar colores específicos** de cada energético (child.color) para enlaces multicolores
10. **Definir variables en el scope correcto** para que estén disponibles en toda la función

## 📊 Flujo de Datos Típico

### Energéticos Primarios:
```
Fuentes → Oferta Total → Oferta Interna Bruta → Tecnologías → Centrales Eléctricas
   ↓           ↓              ↓                    ↓              ↓
Producción   Hub         Distribución      Transformación    Consolidación
```

### Energéticos Secundarios:
```
Importación ES → Oferta Total ES → Oferta Interna Bruta ES → Tecnologías
     ↓                ↓                    ↓                     ↓
  Fuentes         Hub Secundario      Distribución         Transformación
```

### Ubicaciones por Columna (x):
- **0.05:** Fuentes (Producción, Importaciones, Variaciones)
- **0.20:** Hubs (Oferta Total, Oferta Total ES)
- **0.28:** Distribución (Oferta Interna Bruta, OIB ES)
- **0.35:** Transformación (Refinerías, Plantas, Coquizadoras)
- **0.40:** Energéticos Secundarios individuales
- **0.55:** Generación (Tecnologías eléctricas)
- **0.95:** Centrales Eléctricas

## 🎨 Convenciones de Nombres

- **Nodos de generación:** Terminar en "eléctrica" o ser descriptivos
- **Energéticos:** Usar nombres exactos del JSON
- **Hubs:** Incluir "Total", "Bruta", "Hub" en el nombre
- **Variables:** camelCase para JavaScript, snake_case para datos

Esta guía debe permitir a cualquier modelo de lenguaje realizar modificaciones eficientemente sin necesidad de explorar todo el código.