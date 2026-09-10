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
- búsqueda por nombre, provincia o sistema de fallas;
- filtro por tipo de movimiento;
- capa independiente para indicadores geomorfológicos;
- capa dinámica de sismicidad del USGS para los últimos 365 días y magnitud mínima 3.0;
- simbología sísmica por profundidad y tamaño proporcional a la magnitud;
- enlace al mapa oficial de sismicidad del IG-EPN;
- contenido y navegación bilingües en español e inglés;
- guía visual sobre fallas, escarpes, facetas triangulares y drenajes desplazados;
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
│       └── map.js
├── data/
│   ├── README.md
│   └── geojson/
│       ├── estructuras.geojson
│       ├── estructuras.demo.geojson
│       ├── fallas.geojson
│       └── fallas.demo.geojson
├── scripts/
│   └── build_fault_catalog.py
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

Los indicadores de relieve se almacenan por separado en `estructuras.geojson` como geometrías
`Point` o `MultiPoint`. Su esquema inicial utiliza `nombre`, `tipo`, `observacion` y `fuente`.
Los tipos previstos son `escarpe`, `faceta_triangular`, `drenaje_desplazado` y `laguna_sag`.
Los campos terminados en `_en` permiten añadir traducciones verificadas sin alterar el dato base.

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


El archivo `fallas.geojson` se genera desde la versión armonizada de [GEM Global Active Faults
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

## Sismicidad reciente

La capa sísmica consulta en tiempo real el servicio [FDSN Event Web Service del
USGS](https://earthquake.usgs.gov/fdsnws/event/1/) para una extensión rectangular que abarca el
Ecuador y sectores fronterizos y oceánicos próximos. El visor muestra magnitud, profundidad, fecha
UTC, localización reportada, red del catálogo y un enlace a la ficha original del evento.

El Instituto Geofísico de la Escuela Politécnica Nacional continúa siendo la referencia oficial
nacional. Sus datos originales no se redistribuyen en este repositorio porque sus condiciones de
uso restringen la publicación de los catálogos descargados por Internet. El visor enlaza al mapa
oficial del IG-EPN y mantiene separado su origen del catálogo USGS. La proximidad visual entre un
epicentro y una traza no demuestra una relación causal.

## Autor

**Henry P. Conteron Moreta** — Ingeniero en Geociencias, Ecuador.

## Licencias y atribución

La licencia del código y las condiciones de reutilización de los datos se definirán por separado.
Cada fuente geológica mantendrá su atribución y licencia original. Este visor es científico y
educativo; no sustituye cartografía oficial ni estudios de amenaza sísmica.

El mapa topográfico utiliza OpenTopoMap, con datos de OpenStreetMap y SRTM, y conserva su
atribución visible en el visor. Las ilustraciones educativas son imágenes conceptuales originales:
no representan lugares reales ni deben interpretarse como evidencia de campo.
