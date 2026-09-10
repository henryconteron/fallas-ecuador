# Fuentes y referencias

Este directorio registra la procedencia, las condiciones de uso y las limitaciones de cada conjunto de datos incorporado al visor.

**Última verificación:** 10 de septiembre de 2026.

## Requisitos mínimos

Antes de publicar una traza o un evento se registrarán:

- referencia bibliográfica completa;
- responsable o institución;
- fecha de consulta o descarga;
- año y escala de cartografía;
- método de obtención, selección o digitalización;
- licencia o condiciones de reutilización;
- transformaciones aplicadas;
- nivel de confianza de la geometría y de su actividad.

Las trazas derivadas de trabajos propios se identificarán explícitamente como **este estudio**.

## Registro de fuentes candidatas

| Conjunto | Fuente | Uso previsto | Estado |
|---|---|---|---|
| Fallas activas | [GEM Global Active Faults Database](https://github.com/GEMScienceTools/gem-global-active-faults) | Fuente geométrica principal, recortada al Ecuador | **Aprobada**: CC BY-SA 4.0 |
| Fallas de los Andes del norte | Veloza et al. (2012), [Open-source archive of active faults for northwest South America](https://doi.org/10.1130/GSAT-G156A.1) | Referencia científica y control de nombres, geometría y cinemática | **Aprobada como referencia**; la geometría se incorporará mediante GEM |
| Fallas de Ecuador | Egüez et al. (2003), [Database and Map of Quaternary Faults and Folds of Ecuador and its Offshore Regions](https://pubs.usgs.gov/of/2003/ofr-03-289/) | Contraste del inventario nacional y de la nomenclatura | **Aprobada como referencia**; compilación antigua y de escala regional |
| Fallas de Sudamérica | Costa et al. (2020), [Hazardous faults of South America: compilation and overview](https://doi.org/10.1016/j.jsames.2020.102837) | Contraste científico regional | **Pendiente** verificar la licencia de cualquier archivo geométrico suplementario |
| Sismicidad de Ecuador | [Instituto Geofísico de la Escuela Politécnica Nacional](https://www.igepn.edu.ec/) | Fuente oficial nacional y enlace de consulta | **Restringida para redistribución** |
| Sismicidad consultable por API | [USGS Earthquake Catalog — FDSN Event Web Service](https://earthquake.usgs.gov/fdsnws/event/1/) | Capa interactiva de eventos recientes | **Aprobada** con atribución |

## Decisión para la primera versión científica

### Fallas

La capa inicial se obtendrá del archivo armonizado de GEM y se recortará al territorio continental y marítimo de interés para Ecuador. No se publicará el archivo mundial completo.

Se conservarán, cuando estén disponibles, los atributos originales:

- `catalog_id`;
- `name` y `fz_name`;
- `slip_type`;
- `dip` y `dip_dir`;
- tasas de desplazamiento;
- `accuracy`;
- indicadores de confianza;
- `reference` y `notes`.

Toda simplificación geométrica, traducción o reclasificación se documentará. La capa derivada mantendrá la atribución y la licencia **Creative Commons Attribution-ShareAlike 4.0** de GEM.

Referencia principal:

> Styron, R., & Pagani, M. (2020). The GEM Global Active Faults Database. *Earthquake Spectra, 36*(1_suppl), 160–180. https://doi.org/10.1177/8755293020944182

La base de Egüez et al. (2003) fue compilada aproximadamente a escala 1:1 250 000 y no debe interpretarse a escalas más detalladas que 1:750 000. Por ello se usará como control regional, no como una traza de precisión local.

### Sismicidad

El IG-EPN es la referencia institucional principal para el Ecuador. Sin embargo, sus [términos de descarga](https://www.igepn.edu.ec/descarga-de-datos/) establecen uso exclusivo e intransferible y prohíben redistribuir por Internet los datos originales. Por tanto, sin autorización escrita del Instituto:

- no se copiarán sus catálogos al repositorio;
- no se presentarán sus eventos como una capa propia descargable;
- sí se enlazarán sus mapas oficiales, incluyendo [Sismicidad tectónica de los últimos 365 días](https://www.igepn.edu.ec/mapas/sismicidad/mapa-sismicidad-tectonica-365.html).

Para la primera capa sísmica interactiva se usará el servicio FDSN del USGS, que entrega GeoJSON mediante consultas por fecha, magnitud y extensión geográfica. La interfaz mostrará con claridad:

- fuente y enlace al evento original;
- fecha y hora en UTC;
- magnitud y tipo de magnitud;
- profundidad en kilómetros;
- lugar reportado;
- momento de actualización de la consulta.

La atribución se ajustará a la [política de créditos del USGS](https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits).

La primera configuración recomendada es: **últimos 365 días, magnitud mínima 3.0**, con tamaño proporcional a la magnitud y color según profundidad. El visor advertirá que la proximidad espacial entre un epicentro y una traza cartografiada no demuestra que esa falla haya originado el evento.

## Datos propios: falla Porotoyacu

La traza de Porotoyacu interpretada por Conteron y colaboradores se mantendrá fuera de la capa pública hasta confirmar la autorización de todos los coautores y el estado editorial del manuscrito. Cuando pueda publicarse, se identificará como **este estudio**, con versión, fecha, método y referencia definitiva.
