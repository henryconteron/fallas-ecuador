# Datos del atlas

## `geojson/fallas.geojson`

Catálogo derivado de [GEM Global Active Faults Database](https://github.com/GEMScienceTools/gem-global-active-faults), commit `850fd05b48841eb806d61a37043b5567f5bb99dd`, distribuido bajo [Creative Commons Attribution-ShareAlike 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

**Atribución científica:** Styron, R., & Pagani, M. (2020). The GEM Global Active Faults Database. *Earthquake Spectra, 36*(1_suppl), 160–180. https://doi.org/10.1177/8755293020944182

Transformaciones realizadas el 10 de septiembre de 2026:

- selección de geometrías SARA y *Active Tectonics of the Andes* que intersectan Ecuador;
- asignación preliminar de provincias mediante [geoBoundaries](https://www.geoboundaries.org/) gbOpen, CC BY 4.0;
- normalización de una categoría visual de movimiento;
- incorporación de nombres de interfaz, procedencia y licencia;
- conservación de la geometría y de los atributos originales de GEM.

Las líneas no fueron recortadas ni simplificadas. El valor original `slip_type` se conserva en `movimiento_original`. El script reproducible está en `scripts/build_fault_catalog.py`.

## `geojson/estructuras.geojson`

Colección inicial de tres evidencias geomorfológicas descritas en Eguez et al. (2003), USGS
Open-File Report 03-289: escarpes y depresiones de Billecocha, facetas triangulares de Huayrapungo
y drenajes desplazados de Pallatanga.

Las geometrías son puntos regionales representativos derivados de trazas GEM relacionadas. No
delimitan las formas observadas ni sustituyen cartografía de campo. Cada entidad registra
`geometry_role`, confianza, precisión, método de localización, sección de la fuente e IDs de las
trazas relacionadas. El esquema formal está en `schemas/estructuras.schema.json`.

## Archivos de demostración

`fallas.demo.geojson` y `estructuras.demo.geojson` contienen geometrías sintéticas creadas únicamente para probar la interfaz. No representan observaciones geológicas reales.

## Sismicidad

Los eventos del USGS se consultan dinámicamente y no se almacenan en este directorio. Los catálogos descargados del IG-EPN no se redistribuyen en este repositorio.

## `geojson/estaciones-inamhi.geojson`

Instantánea reproducible de la red continental que la API del visor hidrometeorológico de INAMHI
marcó como `TRANSMITIENDO` al recuperarla. Conserva ubicación y metadatos básicos de las estaciones,
pero no mediciones, series temporales ni pronósticos. La fecha, el endpoint, los filtros y los
conteos se guardan en `metadata`; el archivo se renueva con `npm run update:stations`.
