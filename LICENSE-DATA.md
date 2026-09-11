# Licencias de datos

## Catálogo de fallas

`data/geojson/fallas.geojson` es una adaptación de **GEM Global Active Faults
Database (GAF-DB)**. La obra original y esta adaptación se distribuyen bajo
[Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/).

Fuente fijada para esta versión:

- repositorio: GEMScienceTools/gem-global-active-faults;
- commit: `850fd05b48841eb806d61a37043b5567f5bb99dd`;
- blob del archivo: `fb164770b529695544fa864abe2cc9dd8aa5793d`;
- referencia: Styron, R., & Pagani, M. (2020). *The GEM Global Active Faults Database*.
  Earthquake Spectra, 36(1_suppl), 160–180. https://doi.org/10.1177/8755293020944182

Modificaciones realizadas: selección espacial de registros SARA y ATA que
intersectan Ecuador, asignación preliminar de provincias mediante geoBoundaries,
normalización de campos para la interfaz bilingüe y clasificación visual
simplificada del tipo de movimiento. Las geometrías no fueron recortadas ni
simplificadas.

## Límites administrativos

Los límites de geoBoundaries se usan durante la construcción para selección
espacial y asignación preliminar de provincias. geoBoundaries gbOpen se publica
bajo CC BY 4.0; los archivos de entrada no se redistribuyen en este repositorio.

## Indicadores geomorfológicos

`data/geojson/estructuras.geojson` reúne observaciones factuales sintetizadas y atribuidas a Eguez
et al. (2003), USGS Open-File Report 03-289. Las ubicaciones representativas se derivaron de las
trazas GEM y, por tanto, la capa se distribuye bajo CC BY-SA 4.0. Los puntos no son levantamientos
de la extensión real de las formas y esta limitación debe conservarse en cualquier reutilización.

## Sismicidad

Los eventos del USGS se consultan en tiempo real y no forman parte del catálogo
almacenado en el repositorio. La interfaz mantiene la atribución y el enlace al
evento original.

## Datos demostrativos

Los archivos `*.demo.geojson` contienen geometrías sintéticas sin valor
científico. Se incluyen únicamente para probar la interfaz y quedan cubiertos
por la licencia del código salvo indicación posterior.
