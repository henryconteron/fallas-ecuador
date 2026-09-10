# Fallas del Ecuador

Atlas geológico interactivo para consultar fallas documentadas en Ecuador y comunicar, de forma
clara, su contexto tectónico, evidencias geomorfológicas y fuentes científicas.

## Estado

El proyecto se encuentra en su fase inicial. La interfaz y el lector de GeoJSON están preparados;
las trazas se incorporarán únicamente después de verificar su procedencia, atributos y licencia.

## Funciones iniciales

- mapa web adaptable a computadoras y teléfonos;
- búsqueda por nombre, provincia o sistema de fallas;
- filtro por tipo de movimiento;
- simbología y fichas emergentes generadas desde GeoJSON;
- documentación separada para las fuentes cartográficas.

## Estructura

```text
fallas-ecuador/
├── index.html
├── assets/
│   ├── css/styles.css
│   └── js/map.js
├── data/
│   └── geojson/fallas.geojson
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

## Uso local

Como el visor carga archivos mediante JavaScript, debe abrirse desde un servidor local. Puede
utilizarse la extensión **Live Server** de Visual Studio Code. Abrir `index.html` directamente con
doble clic puede impedir la lectura del GeoJSON por las reglas de seguridad del navegador.

## Autor

**Henry P. Conteron Moreta** — Ingeniero en Geociencias, Ecuador.

## Licencias y atribución

La licencia del código y las condiciones de reutilización de los datos se definirán por separado.
Cada fuente geológica mantendrá su atribución y licencia original. Este visor es científico y
educativo; no sustituye cartografía oficial ni estudios de amenaza sísmica.
