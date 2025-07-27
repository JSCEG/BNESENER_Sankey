#### Ejemplo 3: Cogeneración (recibe de Oferta Interna Bruta y centros de transformación)

**Caso:** Cogeneración puede recibir biomasa (Bagazo de caña, Leña) directamente y también insumos secundarios desde centros de transformación.

1. **En el JSON**:
   ```json
   "cogeneracion": {
     "Nodos Hijo": [
       { "Nodo Hijo": "Bagazo de caña", "tipo": "Energía Primaria", "2024": -12 },
       { "Nodo Hijo": "Leña", "tipo": "Energía Primaria", "2024": -3 },
       { "Nodo Hijo": "Biogás", "tipo": "Energía Secundaria", "2024": -2 },
       { "Nodo Hijo": "Energía eléctrica", "tipo": "Energía Secundaria", "2024": 14 }
     ]
   }
   ```
2. **En LinkManager.js**:
   - En `distribution-to-transformation`, incluye `Cogeneración` como destino de `Oferta Interna Bruta`:
   ```js
   this.registerConnectionMap('distribution-to-transformation', new Map([
       ['Oferta Interna Bruta', [
           // ...
           'Cogeneración',
           // ...
       ]]
   ]));
   ```
   - En `fuel-to-generation`, asegúrate de mapear los combustibles primarios:
   ```js
   this.registerConnectionMap('fuel-to-generation', new Map([
       // ...
       ['Bagazo de caña', ['Cogeneración']],
       ['Leña', ['Cogeneración']],
       // ...
   ]));
   ```
   - En `transformation-to-generation`, si algún centro de transformación alimenta a Cogeneración, agrégalo así:
   ```js
   this.registerConnectionMap('transformation-to-generation', new Map([
       ['Plantas de Biogás', [
           { target: 'Cogeneración', energetics: ['Biogás'] }
       ]]
   ]));
   ```
3. **Verifica que los nombres coincidan** en JSON, mapeos y diagrama.
4. **Personaliza colores** en `StyleManager.js` si lo deseas.
5. **Incluye todos los mapas** en la llamada a `generateDataLinks`.
6. **Guarda y recarga la página.**

> **¿Dudas?** Consulta el archivo `Guía.txt` para más ejemplos y explicaciones detalladas.

----
# Guía de Uso y Personalización del Sistema Sankey

Esta guía te ayudará a entender cómo modificar el código y para qué sirve cada parte en el sistema Sankey de energía, incluyendo cómo habilitar nuevos enlaces y nodos.

---

## 1. Estructura de Archivos Clave

- **public/index.html**  
  Interfaz principal y lógica de integración de módulos.
- **public/js/LinkManager.js**  
  Define cómo se conectan los nodos (fuentes, transformaciones, generación, etc).
- **public/js/StyleManager.js**  
  Paleta de colores y estilos para nodos y enlaces.
- **public/js/DataManager.js**  
  Carga y organiza los datos del JSON.
- **public/datos_energia_completo.json**  
  Datos energéticos (nodos, flujos, años, etc).

---

## 2. ¿Dónde modificar conexiones entre nodos?

### a) Conexiones automáticas (LinkManager.js)

- **¿Qué hace?**  
  Define qué nodos pueden conectarse y desde dónde salen los enlaces.
- **¿Dónde?**  
  Edita los mapas en el método `initializeDefaultMappings()`.

#### Ejemplo:
```js
// Combustibles gaseosos
['Gas natural', ['Térmica Convencional', 'Turbogás', 'Cogeneración']],
['Gas natural seco', ['Térmica Convencional', 'Turbogás', 'Ciclo Combinado', 'Cogeneración']],
// Biomasa
['Bagazo de caña', ['Cogeneración']],
```
> **TIP:** Si quieres que un combustible llegue a otra tecnología, agrégala en el array.

---

### b) ¿Desde qué nodo sale el enlace?

- **¿Qué pasa si el enlace sale desde el nodo equivocado?**  
  Si quieres que un flujo salga desde "Oferta Interna Bruta" y no desde "Producción", revisa el mapeo `distribution-to-transformation`:
```js
this.registerConnectionMap('distribution-to-transformation', new Map([
    ['Oferta Interna Bruta', [
        'Turbogás',
        'Térmica Convencional',
        'Ciclo Combinado',
        'Nucleoeléctrica',
        // ...
    ]]
]));
```
> **TIP:** Si agregas aquí una tecnología, los energéticos primarios negativos llegarán desde "Oferta Interna Bruta".

- **Para energéticos secundarios** (por ejemplo, "Gas natural seco" desde "Plantas de Gas y Fraccionadoras" a "Ciclo Combinado"), revisa el mapeo `transformation-to-generation`:
```js
this.registerConnectionMap('transformation-to-generation', new Map([
    ['Plantas de Gas y Fraccionadoras', [
        { target: 'Ciclo Combinado', energetics: ['Gas natural seco'] },
        // ...
    ]]
]));
```
> **TIP:** Así controlas que el enlace salga desde el centro de transformación y no desde el nodo de producción.

---



### c) ¿Cómo habilitar los nuevos links o nodos? (Ejemplos prácticos)

#### Ejemplo 1: Oferta Interna Bruta → Central eléctrica (caso directo)

**Caso:** Nucleoeléctrica, Carboeléctrica, Térmica Convencional, etc.

1. **En el JSON** (`datos_energia_completo.json`):
   ```json
   "nucleoelectrica": {
     "Nodos Hijo": [
       { "Nodo Hijo": "Energía Nuclear", "tipo": "Energía Primaria", "2024": -100 },
       { "Nodo Hijo": "Energía eléctrica", "tipo": "Energía Secundaria", "2024": 95 }
     ]
   }
   ```
2. **En LinkManager.js**: En el mapa `distribution-to-transformation`, incluye la tecnología como destino de `Oferta Interna Bruta`:
   ```js
   this.registerConnectionMap('distribution-to-transformation', new Map([
       ['Oferta Interna Bruta', [
           // ...
           'Nucleoeléctrica',
           'Carboeléctrica',
           'Térmica Convencional',
           // ...
       ]]
   ]));
   ```
3. **Verifica nombres y colores** como en el ejemplo anterior.

---

#### Ejemplo 2: Tecnología que recibe de ambos (Oferta Interna Bruta y centros de transformación)

**Caso:** Combustión Interna

1. **En el JSON**:
   ```json
   "combustioninterna": {
     "Nodos Hijo": [
       { "Nodo Hijo": "Diesel", "tipo": "Energía Primaria", "2024": -10 },
       { "Nodo Hijo": "Gasolinas y naftas", "tipo": "Energía Primaria", "2024": -5 },
       { "Nodo Hijo": "Gas natural seco", "tipo": "Energía Secundaria", "2024": -8 },
       { "Nodo Hijo": "Energía eléctrica", "tipo": "Energía Secundaria", "2024": 20 }
     ]
   }
   ```
2. **En LinkManager.js**:
   - En `distribution-to-transformation`, incluye `Combustión Interna` como destino de `Oferta Interna Bruta`:
   ```js
   this.registerConnectionMap('distribution-to-transformation', new Map([
       ['Oferta Interna Bruta', [
           // ...
           'Combustión Interna',
           // ...
       ]]
   ]));
   ```
   - En `transformation-to-generation`, agrega los centros de transformación que alimentan a `Combustión Interna`:
   ```js
   this.registerConnectionMap('transformation-to-generation', new Map([
       ['Refinerías y Despuntadoras', [
           { target: 'Combustión Interna', energetics: ['Diesel', 'Combustóleo'] }
       ]],
       ['Plantas de Gas y Fraccionadoras', [
           { target: 'Combustión Interna', energetics: ['Gas natural seco'] }
       ]]
   ]));
   ```
3. **Verifica que los nombres coincidan** en JSON, mapeos y diagrama.
4. **Personaliza colores** en `StyleManager.js` si lo deseas.
5. **Incluye ambos mapas** en la llamada a `generateDataLinks`:
   ```js
   const links = linkManager.generateDataLinks(
       nodeMap,
       nodeColors,
       nodeData,
       year,
       {
           mapTypes: [
               'fuel-to-generation',
               'distribution-to-transformation',
               'transformation-to-generation',
               'generation-to-centrales'
           ]
       }
   );
   ```
6. **Guarda y recarga la página.**

> **¿Dudas?** Consulta el archivo `Guía.txt` para más ejemplos y explicaciones detalladas.

----

### d) ¿Qué hacer si un enlace no aparece o sale desde el nodo equivocado?

1. **Verifica el JSON:**  
   El nodo debe estar como hijo de la tecnología y tener valor distinto de 0.
2. **Verifica el mapeo en LinkManager.js:**  
   - El combustible debe estar mapeado a la tecnología correcta en el mapa adecuado.
   - Si quieres que salga desde "Oferta Interna Bruta", usa `distribution-to-transformation`.
   - Si quieres que salga desde un centro de transformación, usa `transformation-to-generation`.
3. **Verifica el tipo de enlace:**  
   Si es primario y quieres que salga de "Oferta Interna Bruta", debe estar en `distribution-to-transformation`.
   Si es secundario y quieres que salga de un centro de transformación, debe estar en `transformation-to-generation`.
4. **Verifica el nombre:**  
   Debe coincidir exactamente en JSON, mapeo y diagrama.
5. **Verifica la consola:**  
   Busca mensajes de error o logs de depuración.

---

### e) ¿Cómo cambiar colores de nodos o enlaces?

- **¿Dónde?**  
  En `StyleManager.js`, en los arrays y objetos de colores.
- **¿Para qué?**  
  Para personalizar la visualización y distinguir mejor los flujos.

---

## 3. ¿Cómo depurar si algo no funciona?

- **Consola del navegador:**  
  Busca mensajes de error o logs de depuración.
- **LinkManager.js:**  
  Usa `console.log` para ver si se generan los enlaces.
- **index.html:**  
  Puedes agregar logs en la función `updateSankey`.

---

## 4. ¿Cómo reiniciar los mapeos a su estado?

En la consola JS, puedes llamar:
```js
linkManager.reset();
```

---

## 5. ¿Dónde pedir ayuda o sugerir mejoras?

- **Agrega tus dudas o sugerencias en este archivo** para futuras referencias.
- **Marca con comentarios `// TODO`** en el código donde quieras mejorar algo.

---

**¡Listo! Ahora tienes una referencia rápida para modificar y entender tu sistema Sankey.**
