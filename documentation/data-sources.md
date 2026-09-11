# Red de datos de Ecuador Vivo

Este documento es una lista de integración, no una autorización para redistribuir datos. Cada
servicio debe verificarse con su institución productora antes de publicarse en el atlas.

## Principio de incorporación

Una capa solo pasa de `candidate` a `connected` cuando documenta:

1. institución responsable y enlace canónico;
2. licencia o condiciones de uso y atribución;
3. fecha o frecuencia de actualización;
4. escala, resolución espacial y cobertura temporal;
5. método de acceso reproducible;
6. limitaciones, incertidumbre y significado científico;
7. comportamiento cuando el servicio externo no está disponible.

El [directorio de recursos geoespaciales del Observatorio Forestal UTN](https://observatorioforestal.utn.edu.ec/pages/resources_geo.html)
sirve como índice de descubrimiento. No reemplaza la documentación ni las condiciones de la
fuente original.

## Prioridad de evaluación

| Sistema | Fuente productora | Posible uso | Acceso previsto | Estado |
|---|---|---|---|---|
| Tierra | GEM Foundation | fallas activas | GeoJSON curado | connected |
| Tierra | USGS | sismicidad reciente | FDSN API | connected |
| Tierra | Instituto Geográfico Militar | cartografía, ortofotos y relieve | WMS/WFS/CSW | candidate |
| Tierra | Instituto Geofísico EPN | sismicidad y volcanismo nacional | enlace o servicio autorizado | candidate |
| Agua/Cielo | INAMHI | estaciones, precipitación, caudales e inundaciones | servicios y descargas | candidate |
| Agua | INAMHI GEOGLOWS | pronósticos e históricos de caudal | servicio por verificar | candidate |
| Agua/Cielo | NASA GPM / GIBS | tasa de precipitación IMERG por día | WMS público de GIBS | connected |
| Agua/Riesgo | NASA LANCE / VIIRS | agua superficial e inundación observada en 1 día | WMS público de GIBS | connected |
| Vida | NASA FIRMS / GIBS | anomalías térmicas VIIRS por día | WMS público de GIBS | connected |
| Vida | MapBiomas Ecuador / SNMB | cobertura y cambio de bosque | plataforma o descarga | candidate |

## Arquitectura prevista

- El cliente solicita únicamente el área, fecha y resolución necesarias.
- WMS/WMTS y teselas ráster se muestran sin descargar mosaicos completos.
- WFS y API se consultan por extensión geográfica y ventana temporal.
- Los datos estáticos grandes se publican como PMTiles o COG en almacenamiento externo.
- Las claves, cuotas, normalización y caché requieren un intermediario de borde; nunca se incluyen
  secretos en el JavaScript público.
- Cada adaptador externo debe tener estado de carga, error, fecha de actualización y atribución
  visible.

## Primera experiencia transversal

`Explícame este lugar` relaciona solamente las capas activas: coordenadas, falla, evidencia
geomorfológica y sismo reciente. Si las visualizaciones térmica o de precipitación están activas,
también registra su fecha y alcance, pero no afirma que el píxel seleccionado contenga una
detección o valor exacto porque los WMS no exponen atributos puntuales en esta interfaz. Las
siguientes iteraciones añadirán, solo cuando las fuentes estén validadas, cuencas, caudales,
cobertura y cambios históricos. Las coincidencias espaciales se presentan como contexto y nunca
como causalidad automática o cálculo de riesgo.

## Precipitación IMERG

La capa usa `IMERG_Precipitation_Rate` de NASA GPM, servida por GIBS mediante WMS EPSG:4326. La
metadata oficial identifica un producto diario continuo basado en IMERG V07, con productos Final
y Early de media hora y cuadrícula nativa de 0,1°. El atlas solicita una fecha, conserva la
atribución de NASA y muestra una escala cualitativa de menor a mayor tasa.

La visualización no sustituye pluviómetros, pronósticos ni alertas. Tampoco permite concluir que
habrá inundación: se requiere integrar duración de la lluvia, humedad antecedente, pendiente,
suelos, drenaje, caudal y exposición. INAMHI–GEOGLOWS se enlaza como referencia nacional de
consulta mientras se documentan sus servicios antes de convertirlos en capas interoperables.

## Inundación VIIRS

La capa `VIIRS_Combined_Flood_1-Day` es un compuesto diario casi en tiempo real de NOAA-20 y
NOAA-21/VIIRS producido por NASA LANCE y servido mediante GIBS. La metadata oficial describe una
cuadrícula global de 250 m y una ventana de un día. El atlas solicita únicamente la fecha visible y
mantiene la atribución en el mapa.

El producto representa **inundación observada o señal de agua superficial**, no lluvia, pronóstico
de caudal, alerta oficial ni riesgo. La detección puede ser limitada por nubes y vegetación o
confundirse con sombras y agua permanente. La interfaz exige contrastar la señal con INAMHI,
estaciones, reportes locales y verificación de campo.

## Anomalías térmicas

La primera capa transversal utiliza la visualización
`VIIRS_NOAA20_Thermal_Anomalies_375m_All` de NASA GIBS. Se consulta por WMS y fecha, por lo que no
se guarda un mosaico en el repositorio ni se expone una clave. El producto se presenta como
**anomalía térmica**, no como incendio confirmado: una detección puede tener otras causas y la
ausencia de puntos también puede estar condicionada por nubes, horario de adquisición o cobertura.

Los servicios directos FIRMS API/WMS/WFS requieren una `MAP_KEY`. Si una fase posterior necesita
atributos, conteos o búsquedas por punto, la clave deberá permanecer en una pasarela de servidor
con caché y límites; nunca se publicará en el cliente de GitHub Pages.
