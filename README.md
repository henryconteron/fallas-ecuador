# Fallas del Ecuador

Atlas geológico interactivo para consultar fallas documentadas en Ecuador y comunicar, de forma
clara, su contexto tectónico, evidencias geomorfológicas y fuentes científicas.

## Estado

El proyecto se encuentra en su fase inicial. La interfaz y el lector de GeoJSON están preparados;
las trazas se incorporarán únicamente después de verificar su procedencia, atributos y licencia.

## Funciones iniciales

- mapa web adaptable a computadoras y teléfonos;
- mapa topográfico principal y mapa de calles alternativo;
- búsqueda por nombre, provincia o sistema de fallas;
- filtro por tipo de movimiento;
- capa independiente para indicadores geomorfológicos;
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
│   └── geojson/
│       ├── estructuras.geojson
│       ├── estructuras.demo.geojson
│       ├── fallas.geojson
│       └── fallas.demo.geojson
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
| `actividad` | Edad o evidencia más reciente reportada |
| `confianza` | Observada, inferida o aproximada |
| `fuente` | Cita abreviada de la geometría |
| `escala` | Escala de la fuente cartográfica |
| `descripcion` | Explicación científica breve |

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

## Autor

**Henry P. Conteron Moreta** — Ingeniero en Geociencias, Ecuador.

## Licencias y atribución

La licencia del código y las condiciones de reutilización de los datos se definirán por separado.
Cada fuente geológica mantendrá su atribución y licencia original. Este visor es científico y
educativo; no sustituye cartografía oficial ni estudios de amenaza sísmica.

El mapa topográfico utiliza OpenTopoMap, con datos de OpenStreetMap y SRTM, y conserva su
atribución visible en el visor. Las ilustraciones educativas son imágenes conceptuales originales:
no representan lugares reales ni deben interpretarse como evidencia de campo.
