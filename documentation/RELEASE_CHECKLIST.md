# Checklist de publicación

Usa esta lista antes de crear una release o compartir el atlas con una institución.

## Datos y ciencia

- [ ] Confirmar que `data/geojson/fallas.geojson` conserva el commit y los hashes declarados en `data/catalog-build-manifest.json`.
- [ ] Ejecutar `npm run check` (o `pnpm run check`) y guardar el resultado del validador.
- [ ] Revisar las cuatro advertencias esperadas: referencias de catálogo, escalas ausentes, nombres repetidos y ubicaciones representativas.
- [ ] No presentar las 77 trazas `catalog_only` como estudios con cita individual.
- [ ] Confirmar que las capas remotas indiquen institución, fecha, resolución, licencia y limitaciones.
- [ ] Revisar que las imágenes de `assets/images/education/` tengan atribución y permiso documentados.

## Interfaz

- [ ] Probar `index.html` en escritorio y móvil.
- [ ] Probar `learn.html` en español e inglés.
- [ ] Activar y desactivar cada sistema y comprobar que la leyenda solo muestre capas activas.
- [ ] Probar teclado: enlace de salto, navegación principal, botones, interruptores, filtros y popups.
- [ ] Confirmar que el mapa tenga un mensaje comprensible cuando falle una fuente remota.
- [ ] Confirmar que el modo `?demo=1` esté claramente separado de los datos científicos.

## Publicación

- [ ] Verificar que GitHub Actions esté verde en el commit que se publicará.
- [ ] Abrir la URL de GitHub Pages en una ventana privada y probar una recarga directa de `learn.html`.
- [ ] Confirmar que no haya claves, tokens ni archivos de `data/raw/` publicados.
- [ ] Crear una release con versión semántica, por ejemplo `v0.1.0`.
- [ ] Actualizar fecha de revisión en `documentation/references/README.md` y fuentes remotas.
- [ ] Guardar la URL de la release y del atlas en el CV o portafolio, no solo la URL de una rama.

## Registro de cambios

Cada release debe anotar: fecha, commit, fuentes consultadas, capas activas, cambios de código,
advertencias conocidas y cualquier permiso de imagen pendiente.
