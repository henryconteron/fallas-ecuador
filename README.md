# Ecuador Vivo

Atlas interactivo de los sistemas naturales del Ecuador. El proyecto comienza con fallas,
sismicidad y geomorfología, y está preparado para conectar progresivamente agua, atmósfera,
vida y riesgo sin perder trazabilidad científica.

## Estado

El proyecto se encuentra en su fase inicial científica. La primera versión del catálogo reúne 145
trazas originales de GEM GAF-DB que intersectan Ecuador, procedentes de SARA y *Active Tectonics of
the Andes*. La sismicidad reciente se consulta mediante el servicio FDSN del USGS.

## Funciones iniciales

- navegación contextual por Tierra, Agua, Cielo, Vida y Riesgo: cada selección muestra solo
  sus capas, explicación y fuentes, conserva los controles activados y se refleja en la URL;
- herramienta **Explícame este lugar** para relacionar un punto con las evidencias disponibles,
  mostrando distancias aproximadas y una advertencia explícita contra interpretaciones causales;
- registro modular de proveedores conectados y fuentes candidatas;
- leyenda reactiva que muestra únicamente la simbología de las capas encendidas;
- control independiente para activar o desactivar las fallas sin perder el catálogo de búsqueda;
- primera experiencia **Agua/Cielo** con tasa de precipitación NASA GPM IMERG por fecha y
  opacidad, servida mediante NASA GIBS sin descargar mosaicos;
- temperatura del aire diurna Aqua/AIRS por fecha y opacidad en **Cielo**, con escala térmica
  explícita y advertencias para no confundirla con máximas, sensación térmica o pronóstico;
- fracción de nube diurna Aqua/MODIS en porcentaje, con escala oficial, fecha configurable y una
  explicación que separa nubosidad, lluvia y probabilidad de precipitación;
- observación diaria de inundaciones NASA LANCE VIIRS a 250 m, separada de la lluvia y presentada
  como señal satelital que requiere validación oficial y de campo;
- cuencas hidrográficas INAMHI/MAATE servidas por WMS, con identificación puntual del nombre y
  sistema hidrográfico mediante una consulta WFS mínima que no descarga las geometrías;
- red hidrometeorológica de INAMHI con 214 estaciones continentales marcadas como transmitiendo
  al actualizar la instantánea, filtro por tipo, fichas seguras y estación más próxima;
- módulo **Ecuador Ahora** con anomalías térmicas VIIRS NOAA-20 por fecha, servido mediante
  NASA GIBS sin publicar claves privadas;
- explicación interactiva de por qué una anomalía térmica no equivale automáticamente a un incendio;
- mapa web adaptable a computadoras y teléfonos;
- mapa topográfico principal y mapa de calles alternativo;
- catálogo inicial de fallas activas derivado de GEM GAF-DB;
- búsqueda por nombre, provincia, identificador o catálogo de origen;
- filtro por tipo de movimiento;
- capa independiente con indicadores geomorfológicos documentados y niveles de confianza;
- relieve sombreado con intensidad regulable sobre cualquier mapa base;
- capa secundaria de sismicidad del USGS, apagada inicialmente y filtrable por periodo, magnitud y profundidad;
- simbología sísmica por profundidad, patrón de contorno y tamaño proporcional a la magnitud;
- lista sísmica accesible mediante teclado como alternativa al mapa;
- enlace al mapa oficial de sismicidad del IG-EPN;
- contenido y navegación bilingües en español e inglés;
- guía visual con imágenes WebP responsivas sobre fallas, escarpes, facetas triangulares y drenajes desplazados;
- laboratorio bilingüe con tres casos interactivos y retroalimentación sobre tipos de falla;
- simbología y fichas emergentes generadas desde GeoJSON;
- modo de demostración con geometrías sintéticas, separado del catálogo científico;
- documentación separada para las fuentes cartográficas.

## Estructura

```text
fallas-ecuador/
├── index.html
├── learn.html
├── assets/
│   ├── css/
│   │   ├── styles.css
│   │   └── learn.css
│   ├── images/education/
│   └── js/
│       ├── i18n.js
│       ├── learn.js
│       ├── map.js
│       └── map/
│           ├── basins.js
│           ├── air-temperature.js
│           ├── cloud-fraction.js
│           ├── config.js
│           ├── data.js
│           ├── flood.js
│           ├── place.js
│           ├── popups.js
│           ├── precipitation.js
│           ├── seismicity.js
│           ├── source-catalog.js
│           ├── stations.js
│           ├── symbology.js
│           ├── systems.js
│           ├── thermal.js
│           └── utils.js
├── data/
│   ├── README.md
│   ├── geojson/
│   │   ├── estructuras.geojson
│   │   ├── estaciones-inamhi.geojson
│   │   ├── estructuras.demo.geojson
│   │   ├── fallas.geojson
│   │   └── fallas.demo.geojson
│   └── schemas/
│       └── estructuras.schema.json
├── scripts/
│   ├── build_fault_catalog.py
│   ├── catalog_integrity.py
│   ├── update_inamhi_stations.mjs
│   └── validate-catalog.mjs
├── tests/
│   ├── test_build_fault_catalog.py
│   ├── test-air-temperature.mjs
│   ├── test-cloud-fraction.mjs
│   ├── test-basins.mjs
│   ├── test-flood.mjs
│   ├── test-i18n.mjs
│   ├── test-map-modules.mjs
│   ├── test-place.mjs
│   ├── test-precipitation.mjs
│   ├── test-systems.mjs
│   ├── test-stations.mjs
│   └── test-thermal.mjs
├── LICENSE
├── LICENSE-DATA.md
├── NOTICE.md
├── package.json
├── requirements-dev.txt
└── documentation/
    ├── data-sources.md
    └── references/README.md
```

## Estrategia de datos

El repositorio no pretende almacenar todas las capas nacionales. Mantiene datos pequeños y
curados, código, narrativas y metadatos; los conjuntos dinámicos o pesados se incorporarán por
API, WMS/WFS/WMTS o formatos optimizados para teselas. `assets/js/map/source-catalog.js` registra
la institución, el método de acceso, el propósito y el estado de cada candidato. El directorio de
recursos geoespaciales del Observatorio Forestal UTN se usa para descubrir servicios, pero la
autoridad, licencia y atribución se verifican siempre con la institución productora.

## Esquema mínimo de datos

Cada entidad de `fallas.geojson` debe ser una geometría `LineString` o `MultiLineString` en
WGS 84 (EPSG:4326), con coordenadas en el orden longitud–latitud. Sus propiedades previstas son:

| Campo | Contenido |
|---|---|
| `nombre` | Nombre de la falla o segmento |
| `sistema` | Sistema de fallas al que pertenece |
| `provincia` | Provincia o provincias atravesadas |
| `tipo_movimiento` | inversa, normal, dextral, sinestral o desconocido |
| `movimiento_original` | Clasificación cinemática conservada desde GEM |
| `actividad` | Edad o evidencia más reciente reportada |
| `confianza` | Observada, inferida o aproximada |
| `fuente` | Cita abreviada de la geometría |
| `escala` | Escala de la fuente cartográfica |
| `descripcion` | Explicación científica breve |
| `catalog_id` | Identificador estable del catálogo de origen |
| `licencia` | Condiciones de reutilización del registro |

Los indicadores de relieve se almacenan por separado en `estructuras.geojson`. El esquema admite
`Point`, `MultiPoint`, `LineString`, `MultiLineString`, `Polygon` y `MultiPolygon`, y exige tipo,
observación, confianza, precisión espacial, método de localización, trazas relacionadas, fuente y
licencia. Los tipos previstos son `escarpe`, `faceta_triangular`, `drenaje_desplazado` y
`laguna_sag`. Los campos terminados en `_en` permiten añadir traducciones verificadas sin alterar
el dato base. La definición formal está en `data/schemas/estructuras.schema.json`.

La primera colección científica contiene tres ocurrencias documentadas en Eguez et al. (2003):
Billecocha, Huayrapungo y Pallatanga. Sus coordenadas son puntos regionales representativos
colocados sobre trazas GEM coincidentes; no son polígonos levantados en campo ni permiten medir la
forma, altura o desplazamiento de la evidencia. Esta limitación aparece en cada ficha del visor.

## Uso local

Como el visor carga archivos mediante JavaScript, debe abrirse desde un servidor local. Puede
utilizarse la extensión **Live Server** de Visual Studio Code. Abrir `index.html` directamente con
doble clic puede impedir la lectura del GeoJSON por las reglas de seguridad del navegador.

Para probar filtros, simbología, selección y fichas sin incorporar datos científicos, abra la URL
local con `?demo=1`, por ejemplo `http://localhost:5500/?demo=1`. Las geometrías de
`fallas.demo.geojson` son completamente ficticias y no deben reutilizarse como información
geológica. Lo mismo aplica a `estructuras.demo.geojson`, creado únicamente para probar la capa de
formas del relieve.

La vista inicial y el botón de restablecimiento cubren Ecuador continental. La incorporación de
Galápagos se definirá como una vista geográfica independiente para evitar reducir excesivamente la
escala del territorio continental.

La instantánea de estaciones se renueva con `npm run update:stations`. El proceso consulta la API
pública usada por el visor hidrometeorológico de INAMHI, conserva solo puntos dentro de la vista
continental cuyo estado informado es `TRANSMITIENDO`, y registra fecha, endpoint, filtros y conteos
en el propio GeoJSON. No descarga observaciones, pronósticos ni series temporales.

## Catálogo de fallas


El archivo `fallas.geojson` se genera desde una versión fijada de [GEM Global Active Faults
Database](https://github.com/GEMScienceTools/gem-global-active-faults), bajo licencia CC BY-SA 4.0.
Se seleccionan las geometrías de SARA y *Active Tectonics of the Andes* que intersectan Ecuador. Las
geometrías originales no se recortan ni se simplifican. Los límites de [geoBoundaries](https://www.geoboundaries.org/)
se utilizan únicamente para la selección espacial y para identificar las provincias atravesadas.

Los dos catálogos pueden contener interpretaciones alternativas o parcialmente superpuestas. El
visor conserva `catalog_id`, `catalog_name`, `slip_type` y los demás atributos originales para que
esas diferencias sean rastreables; no deben interpretarse automáticamente como duplicados.

Para regenerar el archivo se requiere Python y Shapely:

```bash
python -m pip install -r requirements-dev.txt
python scripts/fetch_catalog_inputs.py
python scripts/build_fault_catalog.py --gem data/raw/catalog-inputs/gem_active_faults_harmonized.geojson --countries data/raw/catalog-inputs/geoBoundaries-ECU-ADM0.geojson --provinces data/raw/catalog-inputs/geoBoundaries-ECU-ADM1.geojson
```

El descargador recupera exclusivamente las tres entradas GeoJSON desde revisiones fijadas de GEM
y geoBoundaries y las guarda en `data/raw/catalog-inputs/`, un directorio ignorado por Git. Antes
de regenerar, copie las rutas impresas por el descargador en el comando de compilación, por ejemplo:

```bash
python scripts/build_fault_catalog.py \
  --gem data/raw/catalog-inputs/gem_active_faults_harmonized.geojson \
  --countries data/raw/catalog-inputs/geoBoundaries-ECU-ADM0.geojson \
  --provinces data/raw/catalog-inputs/geoBoundaries-ECU-ADM1.geojson
```

Cada descarga se verifica como JSON y su SHA-256 se imprime para revisión. El proceso nunca
publica los insumos mundiales ni sustituye automáticamente el catálogo versionado.

El generador verifica el Git blob de GEM contra la versión aprobada, calcula SHA-256 para todas las
entradas y genera `data/catalog-build-manifest.json`. También pueden proporcionarse los SHA-256
esperados de los límites mediante `--countries-sha256` y `--provinces-sha256`.

El manifiesto conservado para la compilación actual es parcial: verifica la versión GEM, pero deja
explícito que los hashes individuales ADM0/ADM1 no fueron guardados durante la extracción original.
La siguiente regeneración sustituirá ese registro por un manifiesto completo.

Antes de publicar cualquier cambio puede ejecutarse:

```bash
npm run check
```

La validación comprueba sintaxis JavaScript, traducciones de la interfaz, módulos del mapa,
estructura GeoJSON, geometrías admitidas, IDs únicos,
campos obligatorios, valores cinemáticos, coordenadas WGS 84, URLs HTTPS y coherencia de los
metadatos. Las referencias o escalas ausentes se reportan como advertencias explícitas porque la
fuente original no las documenta en todos los registros.

## Sismicidad reciente

La capa sísmica consulta en tiempo real exclusivamente eventos con tipo `earthquake` mediante el
servicio [FDSN Event Web Service del
USGS](https://earthquake.usgs.gov/fdsnws/event/1/) para una extensión rectangular que abarca el
Ecuador y sectores fronterizos y oceánicos próximos. El visor muestra magnitud, profundidad, fecha
UTC, localización reportada, red del catálogo y un enlace a la ficha original del evento. La consulta
inicial cubre 30 días y magnitud mínima 3,0; los controles permiten consultar 7, 30, 90 o 365 días,
variar la magnitud mínima y filtrar por intervalos de profundidad. La capa se mantiene apagada al
inicio para que las fallas sigan siendo la información visual principal.

El Instituto Geofísico de la Escuela Politécnica Nacional continúa siendo la referencia oficial
nacional. Sus datos originales no se redistribuyen en este repositorio porque sus condiciones de
uso restringen la publicación de los catálogos descargados por Internet. El visor enlaza al mapa
oficial del IG-EPN y mantiene separado su origen del catálogo USGS. La proximidad visual entre un
epicentro y una traza no demuestra una relación causal.

## Precipitación satelital

La primera capa de Agua/Cielo usa `IMERG_Precipitation_Rate`, una visualización diaria de NASA
GPM servida mediante WMS por GIBS. El producto integra observaciones de precipitación con una
resolución nativa aproximada de 0,1°; se presenta como **tasa de precipitación**, no como acumulado
pluviométrico de una estación ni como una alerta de inundación. El visor consulta solamente la
fecha elegida y permite regular la opacidad, por lo que no guarda mosaicos ráster en el repositorio.

Una lluvia intensa no implica automáticamente una inundación: también intervienen su duración,
la humedad antecedente, el relieve, los suelos, el drenaje y la ocupación de la cuenca. Para el
seguimiento hidrometeorológico nacional, el atlas mantiene un enlace explícito a
INAMHI–GEOGLOWS y conserva a INAMHI como fuente institucional en evaluación para futuras capas de
estaciones, caudales y alertas.

## Temperatura del aire satelital

La vista Cielo incorpora `AIRS_L3_Surface_Air_Temperature_Daily_Day`, un producto diario L3 de
Aqua/AIRS servido mediante WMS de NASA GIBS. Su cuadrícula nativa es de 1° × 1° y la escala oficial
abarca de 200 a 320 K (aproximadamente −73 a 47 °C). El selector ofrece una ventana reciente de
90 días y comienza seis días antes de la fecha actual para respetar la latencia habitual del
producto.

La capa representa temperatura del aire próxima a la superficie durante el paso diurno del
satélite. No equivale a la temperatura máxima diaria, la sensación térmica, una medición de estación
ni un pronóstico; tampoco debe interpretarse con precisión urbana debido al tamaño de sus celdas.
Su valor educativo está en comparar patrones regionales con precipitación, altitud y relieve.

## Fracción de nube satelital

La vista Cielo también integra `MODIS_Aqua_Cloud_Fraction_Day`, un producto L2 diurno de Aqua/MODIS
servido por NASA GIBS. La colección MYD06_L2 V6.1 trabaja con observaciones de 1 y 5 km; el atlas
consulta una fecha por WMS, permite regular la opacidad y reproduce la escala oficial de 0 a 100%.

La fracción de nube expresa cuánto de una observación está cubierto por nubes. No indica por sí sola
si esas nubes producen lluvia, cuánto precipita ni qué ocurrirá después. Las franjas sin datos pueden
corresponder al recorrido orbital o a condiciones en las que no fue posible recuperar el valor.

## Inundación observada

La capa `VIIRS_Combined_Flood_1-Day` de NASA LANCE combina observaciones de NOAA-20 y NOAA-21 en
una cuadrícula de 250 m y una ventana diaria. Se consulta mediante WMS de GIBS, con fecha y opacidad
configurables, sin almacenar rásteres pesados en el repositorio. Es una observación de agua
superficial, no una predicción, una declaratoria de emergencia ni un cálculo de riesgo.

Las nubes, sombras, vegetación, agua permanente y condiciones de adquisición pueden ocultar o
confundir señales. Por ello la interfaz remite al monitoreo oficial de INAMHI y explica que toda
interpretación debe contrastarse con estaciones, reportes locales y observación de campo.

## Cuencas hidrográficas

La vista Agua consume remotamente `geonode:cuencas_maate` desde el GeoServer público de INAMHI.
El mapa solicita imágenes WMS transparentes y no almacena ni redistribuye las 30 geometrías. Al
usar **Explícame este lugar**, una consulta WFS puntual devuelve únicamente `nombre_cue`,
`codigo_sis` y `nombre_sis`, suficientes para identificar el contexto hidrográfico del punto.

La ficha pública consultada identifica la publicación, pero no especifica licencia, escala,
atribución ni método de elaboración. Esta ausencia se muestra en la interfaz y limita el uso de la
capa a visualización y consulta remota hasta que INAMHI o MAATE completen los metadatos.

## Autor

**Henry P. Conteron Moreta** — Ingeniero en Geociencias, Ecuador.

## Licencias y atribución

El código permanece con todos los derechos reservados hasta que el autor decida adoptar una
licencia de código abierto; véase `LICENSE`. El catálogo derivado de GEM se distribuye bajo
CC BY-SA 4.0 y sus transformaciones están documentadas en `LICENSE-DATA.md`. `NOTICE.md` reúne las
atribuciones de bibliotecas, mapas y servicios. Este visor es científico y educativo; no sustituye
cartografía oficial ni estudios de amenaza sísmica.

El mapa topográfico utiliza OpenTopoMap, con datos de OpenStreetMap y SRTM. La capa opcional de
relieve utiliza Esri World Hillshade y muestra su atribución en el mapa. Las ilustraciones
educativas se sirven en WebP responsivo, conservando los PNG como fuentes maestras. Son imágenes
conceptuales originales: no representan lugares reales ni deben interpretarse como evidencia de
campo.
