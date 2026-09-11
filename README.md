# Fallas del Ecuador

Atlas geológico interactivo para consultar fallas documentadas en Ecuador y comunicar, de forma
clara, su contexto tectónico, evidencias geomorfológicas y fuentes científicas.

## Estado

El proyecto se encuentra en su fase inicial científica. La primera versión del catálogo reúne 145
trazas originales de GEM GAF-DB que intersectan Ecuador, procedentes de SARA y *Active Tectonics of
the Andes*. La sismicidad reciente se consulta mediante el servicio FDSN del USGS.

## Funciones iniciales

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
│       ├── map.js
│       └── map/
│           ├── config.js
│           ├── data.js
│           ├── popups.js
│           ├── seismicity.js
│           ├── symbology.js
│           └── utils.js
├── data/
│   ├── README.md
│   ├── geojson/
│   │   ├── estructuras.geojson
│   │   ├── estructuras.demo.geojson
│   │   ├── fallas.geojson
│   │   └── fallas.demo.geojson
│   └── schemas/
│       └── estructuras.schema.json
├── scripts/
│   ├── build_fault_catalog.py
│   ├── catalog_integrity.py
│   └── validate-catalog.mjs
├── tests/
│   ├── test_build_fault_catalog.py
│   ├── test-i18n.mjs
│   └── test-map-modules.mjs
├── LICENSE
├── LICENSE-DATA.md
├── NOTICE.md
├── package.json
├── requirements-dev.txt
└── documentation/
    └── references/README.md
```

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
python scripts/build_fault_catalog.py --gem gem_active_faults_harmonized.geojson --countries geoBoundaries-ECU-ADM0.geojson --provinces geoBoundaries-ECU-ADM1.geojson
```

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
