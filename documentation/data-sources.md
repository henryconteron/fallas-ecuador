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
| Agua/Cielo | INAMHI | red de estaciones hidrometeorológicas | API oficial e instantánea reproducible | connected |
| Agua/Cielo | INAMHI | precipitación, caudales e inundaciones | servicios y descargas | candidate |
| Agua | INAMHI / MAATE | cuencas hidrográficas | WMS y consulta puntual WFS públicos | connected |
| Agua | INAMHI GEOGLOWS | pronósticos e históricos de caudal | servicio por verificar | candidate |
| Agua/Cielo | NASA GPM / GIBS | tasa de precipitación IMERG por día | WMS público de GIBS | connected |
| Cielo | NASA Aqua / AIRS / GIBS | temperatura del aire diurna por día | WMS público de GIBS | connected |
| Cielo | NASA Aqua / MODIS / GIBS | fracción de nube diurna por día | WMS público de GIBS | connected |
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
geomorfológica, sismo reciente y estación en transmisión más próxima. Si las visualizaciones térmica, de precipitación, temperatura del aire o fracción de nube están activas,
también registra su fecha y alcance, pero no afirma que el píxel seleccionado contenga una
detección o valor exacto porque los WMS no exponen atributos puntuales en esta interfaz. Las
siguientes iteraciones añadirán, solo cuando las fuentes estén validadas, cuencas, caudales,
cobertura y cambios históricos. Las coincidencias espaciales se presentan como contexto y nunca
como causalidad automática o cálculo de riesgo.

## Red hidrometeorológica INAMHI

El visor oficial consulta
`https://inamhi.gob.ec/api_visor/station_information/estaciones/visores/?id_aplicacion=vs_1h_inh`.
El servicio no devuelve una cabecera CORS que permita usarlo directamente desde GitHub Pages; por
eso `scripts/update_inamhi_stations.mjs` genera una instantánea pequeña y auditable. En la consulta
del 11 de septiembre de 2026, la API entregó 1.894 registros: 219 estaban marcados como
`TRANSMITIENDO` y 214 cayeron dentro de la extensión continental del atlas. La colección conservada
contiene 171 estaciones meteorológicas, 32 hidrológicas y 11 hidro-meteorológicas.

La capa solo conserva ubicación, código, nombre, tipo, captor, responsable, localización, altitud y
estado informado. No contiene valores medidos, series temporales ni pronósticos. “Transmitiendo”
describe el estado reportado al recuperar la instantánea y no garantiza que una observación sea
válida o esté disponible al momento de leer el mapa. El color representa el tipo de estación, nunca
la intensidad de lluvia o el caudal. La interfaz enlaza el visor de INAMHI para la consulta oficial.

INAMHI anunció acceso público libre a la información hidrometeorológica, pero la respuesta de esta
API no incluye por sí misma una licencia o versión de esquema. Por ello se registra la procedencia,
la fecha de recuperación y la transformación aplicada; cualquier uso analítico debe volver a la
fuente oficial y revisar sus condiciones vigentes.

## Precipitación IMERG

La capa usa `IMERG_Precipitation_Rate` de NASA GPM, servida por GIBS mediante WMS EPSG:4326. La
metadata oficial identifica un producto diario continuo basado en IMERG V07, con productos Final
y Early de media hora y cuadrícula nativa de 0,1°. El atlas solicita una fecha, conserva la
atribución de NASA y muestra una escala cualitativa de menor a mayor tasa.

La visualización no sustituye pluviómetros, pronósticos ni alertas. Tampoco permite concluir que
habrá inundación: se requiere integrar duración de la lluvia, humedad antecedente, pendiente,
suelos, drenaje, caudal y exposición. INAMHI–GEOGLOWS se enlaza como referencia nacional de
consulta mientras se documentan sus servicios antes de convertirlos en capas interoperables.

## Temperatura del aire Aqua/AIRS

La capa `AIRS_L3_Surface_Air_Temperature_Daily_Day` es una visualización diaria L3 del instrumento
AIRS a bordo de Aqua, servida por NASA GIBS mediante WMS EPSG:3857. La colección AIRS3STD V006
ofrece una cuadrícula global de 1° × 1°. El atlas consulta una fecha reciente, conserva la
atribución de NASA y reproduce la escala oficial de 200 a 320 K (aproximadamente −73 a 47 °C).

El dato describe temperatura del aire próxima a la superficie durante el paso diurno del satélite;
no es temperatura máxima diaria, sensación térmica, pronóstico ni observación de una estación. La
resolución no permite conclusiones a escala de barrio y pueden existir fechas sin cobertura. El
selector se limita a 90 días y propone una fecha con seis días de retraso para reducir consultas
vacías debidas a la latencia de publicación.

## Fracción de nube Aqua/MODIS

La capa `MODIS_Aqua_Cloud_Fraction_Day` usa el producto MYD06_L2 V6.1 de Aqua/MODIS y se sirve
mediante WMS EPSG:3857 de NASA GIBS. Sus observaciones L2 diurnas tienen componentes de 1 y 5 km,
periodicidad diaria y una escala discreta oficial de 0 a 100%. El visor propone el día anterior y
ofrece una ventana reciente de 60 días para reducir consultas sin datos todavía publicados.

La fracción de nube representa el porcentaje cubierto por nubes dentro de la observación, no lluvia,
probabilidad de precipitación ni pronóstico. La geometría orbital produce franjas de cobertura y
puede dejar huecos; por eso un espacio transparente no debe leerse como cielo despejado. Para saber
si llueve se debe contrastar con IMERG, estaciones y fuentes meteorológicas oficiales.

## Cuencas INAMHI / MAATE

La capa `geonode:cuencas_maate` se consulta en
`https://geoservicios.inamhi.gob.ec/geoserver/ows`. El WMS entrega la representación cartográfica
de 30 unidades y el WFS se utiliza solo al seleccionar un punto. Esa consulta limita la respuesta a
los atributos `nombre_cue`, `codigo_sis` y `nombre_sis`; no transfiere la geometría al navegador.

La ficha pública del conjunto, publicada el 16 de septiembre de 2025, no contiene resumen,
palabras clave, atribución ni licencia especificada. Por ello el repositorio no conserva una copia
del dato y la interfaz declara esta limitación. La integración deberá reevaluarse cuando la
institución complete sus metadatos o publique condiciones de reutilización explícitas.

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
