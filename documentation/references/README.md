# Fuentes y referencias

Este directorio registra la procedencia, las condiciones de uso y las limitaciones de cada conjunto de datos incorporado al visor.

**Última verificación:** 14 de septiembre de 2026.

## Requisitos mínimos

Antes de publicar una traza o un evento se registrarán, a escala del dato:

- referencia bibliográfica completa si la fuente la aporta; si no, cita del catálogo y alcance
  bibliográfico explícitos, sin aparentar que existe una referencia individual;
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
| Catálogo regional SARA | [SARA Active Faults](https://github.com/GEMScienceTools/SARA-Active-Faults) · [DOI 10.13117/SARA-ACTIVE-FAULTS](https://doi.org/10.13117/SARA-ACTIVE-FAULTS) | Procedencia temática de los registros `SA_*` incorporados por GEM | **Aprobada**: CC BY-SA 4.0 |
| Fallas de los Andes del norte | Veloza et al. (2012), [Open-source archive of active faults for northwest South America](https://doi.org/10.1130/GSAT-G156A.1) | Referencia científica y control de nombres, geometría y cinemática | **Aprobada como referencia**; la geometría se incorporará mediante GEM |
| Fallas de Ecuador | Egüez et al. (2003), [Database and Map of Quaternary Faults and Folds of Ecuador and its Offshore Regions](https://pubs.usgs.gov/of/2003/ofr-03-289/) | Contraste del inventario nacional y de la nomenclatura | **Aprobada como referencia**; compilación antigua y de escala regional |
| Síntesis de fallas de Sudamérica | Costa et al. (2020), [Hazardous faults of South America: compilation and overview](https://doi.org/10.1016/j.jsames.2020.102837) | Contexto regional, criterios de compilación y limitaciones del inventario SARA | **Aprobada como referencia científica**, no como fuente directa de la geometría servida |
| Límites para selección | [geoBoundaries — Ecuador ADM0 y ADM1](https://www.geoboundaries.org/) | Selección espacial y asignación preliminar de provincias | **Aprobada**: gbOpen, CC BY 4.0 |
| Sismicidad de Ecuador | [Instituto Geofísico de la Escuela Politécnica Nacional](https://www.igepn.edu.ec/) | Fuente oficial nacional y enlace de consulta | **Restringida para redistribución** |
| Sismicidad consultable por API | [USGS Earthquake Catalog — FDSN Event Web Service](https://earthquake.usgs.gov/fdsnws/event/1/) | Capa interactiva de eventos recientes | **Aprobada** con atribución |

## Decisión para la primera versión científica

### Fallas

La capa inicial se obtuvo del archivo armonizado de GEM en el commit `850fd05b48841eb806d61a37043b5567f5bb99dd`, identificado por el blob `fb164770b529695544fa864abe2cc9dd8aa5793d`. Se seleccionaron 145 geometrías originales de los catálogos SARA y *Active Tectonics of the Andes* que intersectan el límite de Ecuador de geoBoundaries. No se publicó el archivo mundial completo y las geometrías seleccionadas no fueron recortadas ni simplificadas.

### Validación de los repositorios upstream

La procedencia regional no se infiere únicamente por el nombre del catálogo. En la verificación del
13 de septiembre de 2026, el repositorio oficial [SARA Active Faults](https://github.com/GEMScienceTools/SARA-Active-Faults)
contenía el archivo `geojson/sara-active-faults.geojson` (437 trazas) y una licencia
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Su README es deliberadamente breve:
describe el conjunto, pero no ofrece un diccionario de campos ni referencias bibliográficas por cada
traza. Por eso el atlas lo presenta como procedencia del catálogo y no inventa referencias individuales
cuando el registro no las trae. La revisión quedó identificada por el commit `b5961e4e1176363dc611cc0661dcb6885b3b821c` y el blob
del GeoJSON `114017672160798e33addf49940ad10a7cb17bf`.

El repositorio oficial [GEM Global Active Faults](https://github.com/GEMScienceTools/gem-global-active-faults)
documenta el esquema de atributos, el significado de las tuplas de incertidumbre, los formatos GIS,
la licencia y la compilación de conjuntos regionales. Su commit posterior `56816508ad92fd6846dad1163b1c8c01376a2cd1`
solo actualiza el README respecto al commit de datos fijado `850fd05b48841eb806d61a37043b5567f5bb99dd`;
por ello la compilación pública mantiene el pin del archivo GeoJSON y su blob, en vez de seguir
automáticamente la rama `master`.

La capa publicada se consume desde esa instantánea armonizada de GEM. El repositorio SARA se enlaza
como fuente regional original para consulta y atribución, pero no se mezclan automáticamente sus
geometrías directas con las de GEM.

### Qué respalda cada referencia

- **Alvarado et al. (2017) / repositorio SARA:** identifica el catálogo regional del que proceden
  registros `SA_*`. Es la cita del conjunto de datos regional, no una afirmación de que las 145
  geometrías mostradas sean una descarga directa de ese repositorio.
- **Costa et al. (2020):** es una síntesis revisada por pares sobre fallas peligrosas de Sudamérica y
  las actividades SARA Topic 2. Sirve para explicar el contexto, criterios de inclusión y limitaciones
  regionales; no es el archivo GIS fijado por el atlas. La versión PDF pre-proof revisada aquí reporta
  1.533 fallas en el resumen, mientras que la sección de resultados informa 1.523 estructuras y 3.586
  trazas, con 497 estructuras seleccionadas para el modelo de amenaza SARA. Como cambian tanto el
  conteo como la unidad descrita, esos totales no se comparan directamente con las 437 entidades del
  GeoJSON publicado en el repositorio SARA ni con las 61 entidades SARA que intersectan Ecuador en
  nuestra instantánea GEM.
- **Styron y Pagani (2020):** documenta GEM GAF-DB como compilación automatizada de catálogos
  regionales y enumera SARA y *Active Tectonics of the Andes* como fuentes. También explica que el
  propósito, resolución y metadatos varían entre catálogos y que la compilación no elimina esas
  diferencias científicas.
- **Veloza et al. (2012):** es la referencia regional de *Active Tectonics of the Andes* para los
  registros `ATA_*`; sus geometrías llegan a esta versión a través de GEM.

Por tanto, en textos y fichas del atlas se distingue entre **fuente geométrica/versionada** (GEM),
**procedencia regional** (SARA o ATA) y **síntesis interpretativa** (Costa et al., 2020). Los totales
continentales del artículo no se presentan como cobertura completa del archivo SARA ni del atlas.

### Auditoría de referencias por traza

El campo original `reference` se conserva sin completar ni normalizar. Para que una ficha no confunda
una cita del catálogo con el artículo que sustentó una traza particular, el atlas deriva además
`reference_scope` exclusivamente de ese campo:

- `individual`: el registro GEM fijado incluye una referencia específica;
- `catalog_only`: el registro no incluye una referencia específica; la ficha ofrece únicamente la
  referencia del catálogo y la fuente geométrica versionada.

En la compilación fijada, 68 de 145 trazas tienen referencia individual (todas ATA); las otras 77
quedan explícitamente en alcance de catálogo: 61 SARA y 16 ATA. Esto **no significa que se haya
demostrado que esas trazas carezcan de literatura**, sino que la cadena de datos revisada no permite
atribuir un estudio concreto con seguridad. No se asignaron referencias por coincidencia de nombre,
proximidad geográfica o similitud de geometría.

Para contrastar las 16 ausencias ATA se revisó la versión disponible del repositorio primario
[ActiveTectonicsAndes/ATA](https://github.com/ActiveTectonicsAndes/ATA): el [GeoJSON fijado al commit
revisado](https://github.com/ActiveTectonicsAndes/ATA/blob/7fff3630cfb6f10677e9e10392e26702d5dd506e/geojson/ATA.geojson)
`7fff3630cfb6f10677e9e10392e26702d5dd506e`, blob
`721c78fb6b70837d5682f4be3c7dde27d9c43ce3`. Los registros correspondientes
por identificador `ogc_fid` —`ATA_84`, `ATA_90`, `ATA_118`, `ATA_139`, `ATA_140`, `ATA_141`,
`ATA_142`, `ATA_144`, `ATA_145`, `ATA_160`, `ATA_175`, `ATA_250`, `ATA_429`, `ATA_430`,
`ATA_432` y `ATA_489`— tampoco contienen valor en el campo original `source`. El artículo de
Veloza et al. (2012) explica que referencias y tasas se incorporaron como metadatos **cuando estaban
disponibles**; eso justifica mantener la cita de ATA para la compilación, no adjudicar a cada uno de
estos registros una fuente bibliográfica que no consta en su fila.

El archivo GeoJSON SARA fijado en el commit `b5961e4e1176363dc611cc0661dcb6885b3b821c` no incluye
un campo bibliográfico por traza. GEM conserva la referencia a nivel de registro cuando existe, pero
no añade esas 61 citas en la instantánea usada aquí. La cobertura declarada por catálogo se guarda
en `data/geojson/fallas.geojson` (`metadata.reference_coverage`) y se recalcula en cada compilación;
cada ficha muestra también su alcance de cita en español o inglés. El validador falla si el estado
derivado no concuerda con el campo `reference` o si el resumen de cobertura queda desactualizado.

**Resultado:** el problema de trazabilidad queda identificado y visible, pero no se fabrican 77
referencias individuales. Para resolver bibliográficamente esos casos se requiere una tabla de
correspondencia mantenida por los catálogos originales o revisión científica registro por registro.
Hasta entonces, se citan los conjuntos SARA/ATA y GEM en el alcance correcto.

La versión publicada contiene 61 registros de SARA y 84 de *Active Tectonics of the Andes*. Ambos catálogos pueden ofrecer interpretaciones parcialmente superpuestas. Esas coincidencias se conservan para no eliminar información científica de manera automática y se distinguen mediante `catalog_id`, `catalog_name` y `fuente`.

Se conservarán, cuando estén disponibles, los atributos originales:

- `catalog_id`;
- `name` y `fz_name`;
- `slip_type`;
- `dip` y `dip_dir`;
- tasas de desplazamiento;
- `accuracy`;
- indicadores de confianza;
- `reference` y `notes`;
- `reference_scope`, derivado del `reference` original (`individual` o `catalog_only`), sin sustituir la cita ausente.

Toda simplificación geométrica, traducción o reclasificación se documentará. La capa derivada mantendrá la atribución y la licencia **Creative Commons Attribution-ShareAlike 4.0** de GEM.

La categoría visual `tipo_movimiento` se derivó de `slip_type` para permitir filtros. El valor original permanece en `movimiento_original`; por ello la simbología simplificada nunca debe sustituir la clasificación cinemática de la fuente.

Referencia principal:

> Styron, R., & Pagani, M. (2020). The GEM Global Active Faults Database. *Earthquake Spectra, 36*(1_suppl), 160–180. https://doi.org/10.1177/8755293020944182

> Costa, C., Alvarado, A., Audemard, F., Audin, L., Benavente, C., Bezerra, F. H., Cembrano, J., González, G., López, M., Minaya, E., Santibañez, I., Garcia, J., Arcila, M., Pagani, M., Pérez, I., Delgado, F., Paolini, M., & Garro, H. (2020). Hazardous faults of South America; compilation and overview. *Journal of South American Earth Sciences, 104*, 102837. https://doi.org/10.1016/j.jsames.2020.102837

> Alvarado, A., Audemard, F., Benavente Escobar, C., Santibanez Boric, I., Cembrano Perasso, J., Costa, C., Delgado Madera, G. F., García-Pelaez, J. A., Masquelin, E., Minaya, E., López, M. C., Paolini, M., Perez, I., Grupo de Neotectónica de SEGEMAR, & Styron, R. (2017). The South American Risk Assessment Active Fault Database. https://doi.org/10.13117/SARA-ACTIVE-FAULTS

> Veloza, G., Styron, R., Taylor, M., & Mora, A. (2012). Open-source archive of active faults for northwest South America. *GSA Today, 22*(10), 4–10. https://doi.org/10.1130/GSAT-G156A.1

La base de Egüez et al. (2003) fue compilada aproximadamente a escala 1:1 250 000 y no debe interpretarse a escalas más detalladas que 1:750 000. Por ello se usará como control regional, no como una traza de precisión local.

### Evidencias geomorfológicas iniciales

La primera capa de evidencias toma descripciones de Eguez et al. (2003), USGS Open-File Report
03-289, para tres secciones: EC-27a Billecocha, EC-27b Huayrapungo y EC-50a Pallatanga. El informe
documenta escarpes y depresiones en Billecocha, facetas triangulares asociadas a escarpes en
Huayrapungo y drenajes desplazados en el valle del río Pangor para Pallatanga.

El informe no aporta un inventario digital de polígonos individuales para estas formas. Por ello,
el atlas coloca puntos regionales representativos sobre trazas GEM de nombre y localización
compatibles. Se etiquetan como `representative_location`, confianza media y precisión regional. No
deben utilizarse para medir desplazamientos, alturas, áreas ni distancias locales.

### Sismicidad

El IG-EPN es la referencia institucional principal para el Ecuador. Sin embargo, sus [términos de descarga](https://www.igepn.edu.ec/descarga-de-datos/) establecen uso exclusivo e intransferible y prohíben redistribuir por Internet los datos originales. Por tanto, sin autorización escrita del Instituto:

- no se copiarán sus catálogos al repositorio;
- no se presentarán sus eventos como una capa propia descargable;
- sí se enlazarán sus mapas oficiales, incluyendo [Sismicidad tectónica de los últimos 365 días](https://www.igepn.edu.ec/mapas/sismicidad/mapa-sismicidad-tectonica-365.html).

Para la primera capa sísmica interactiva se usará el servicio FDSN del USGS, que entrega GeoJSON mediante consultas por fecha, magnitud, tipo de evento y extensión geográfica. La consulta fija `eventtype=earthquake` para no presentar explosiones u otros eventos como sismos tectónicos. La interfaz mostrará con claridad:

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
