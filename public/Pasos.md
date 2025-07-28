Como se crea el nodo?
1.-En el Index.html
línea 1207 prox, se declara  el const data y ahi usas la variable que obtinee el nodo tal cual se llama en el json

  const nodeData = {
                produccion: getNodeData('Producción'),

                .
                .
                .
2.-Defines el nodo para despues usarlo
línea 1297 aprox
// --- 1. Definir Nodos Principales ---
            const importacionIndex = addNode(String('Importación de energéticos primarios'), nodeData.importacion.color); //Definimos el nodod de Importación
            const variacionIndex = addNode(String('Variación de inventarios de Energéticos primarios'), nodeData.variacion.color);
            const produccionIndex = addNode(String('Producción'), nodeData.produccion.color);
3.-Una vez definido accedemos a also indicesprocessParentNode
Líneas 1371 aprox.
 // --- 2. Procesar Flujos de Entrada (Importación, Producción, Variación -> Energéticos primarios) ---
            const linkSigns = [];
            const processParentNode = (nodeData, parentIndex, parentName, allowNegatives = false) => {
                // Ordenar nodos hijo por id_hijo de menor a mayor
                const hijosOrdenados = [...nodeData['Nodos Hijo']].sort((a, b) => {
                    // Si no existe id_hijo, lo ponemos al final
                    if (a.id_hijo === undefined) return 1;
                    if (b.id_hijo === undefined) return -1;
                    return a.id_hijo - b.id_hijo;
                });
                hijosOrdenados.forEach(child => {
                    const flowValue = child[year];
                    if (child.tipo === 'Energía Primaria' && flowValue !== undefined && flowValue !== 0) {
                        const childName = child['Nodo Hijo'];
                        const childColor = child.color;
                        const childIndex = addNode(childName, childColor);
                        source.push(parentIndex);
                        target.push(childIndex);
                        value.push(Math.log10(Math.abs(flowValue) + 1));
                        // El color del enlace debe ser el del nodo de energía al que fluye
                        const finalLinkColor = nodeColors[childIndex];
                        linkColors.push(finalLinkColor);

                        // Usar PopupManager para generar popup de enlace mejorado
                        if (popupManager) {
                            const linkPopup = popupManager.generateLinkPopup(
                                childName,
                                flowValue,
                                parentName,
                                childName, // El destino es el nodo hijo, no el hub
                                finalLinkColor,
                                year,
                                { flowType: 'primary_supply' }
                            );
                            linkCustomdata.push(linkPopup);
                        } else {
                            // Fallback al formato anterior
                            if (parentName === 'Variación de inventarios de Energéticos primarios') {
                                linkCustomdata.push(`${childName}: ${flowValue.toLocaleString()} PJ`);
                            } else {
                                linkCustomdata.push(`${childName}: ${Math.abs(flowValue).toLocaleString()} PJ`);
                            }
                        }
                        linkSigns.push(flowValue > 0 ? '+' : '-');

                        // Actualizar totales y desglose
                        primaryEnergyTotals.set(childName, (primaryEnergyTotals.get(childName) || 0) + flowValue);

                        if (!primaryEnergyBreakdown.has(childName)) {
                            primaryEnergyBreakdown.set(childName, { importacion: 0, variacion: 0, produccion: 0 });
                        }
                        const breakdown = primaryEnergyBreakdown.get(childName);
                        if (parentName === 'Importación de energéticos primarios') {
                            breakdown.importacion += flowValue;
                        } else if (parentName === 'Variación de inventarios de Energéticos primarios') {
                            breakdown.variacion += flowValue;
                        } else if (parentName === 'Producción') {
                            breakdown.produccion += flowValue;
                        }
                    }
                });
            };
           
            processParentNode(nodeData.importacion, importacionIndex, 'Importación de energéticos primarios');
            processParentNode(nodeData.variacion, variacionIndex, 'Variación de inventarios de Energéticos primarios', true);
            processParentNode(nodeData.produccion, produccionIndex, 'Producción');
