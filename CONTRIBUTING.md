# Contribuir a Ecuador Vivo

Gracias por ayudar a mejorar el atlas. Las contribuciones deben conservar dos principios: claridad
para el público y trazabilidad para la comunidad científica.

## Antes de proponer cambios

1. Revisa `README.md`, `data/README.md` y `documentation/data-sources.md`.
2. Para datos geoespaciales, identifica institución productora, versión, licencia, fecha de acceso,
   escala o resolución y limitaciones.
3. No agregues una cita individual a una traza si la fuente no la documenta explícitamente.
4. No incluyas credenciales, archivos privados ni datos que una fuente prohíba redistribuir.

## Cambios de código

- Mantén español e inglés sincronizados en `assets/js/i18n.js`.
- Conserva el modo `?demo=1` separado de los datos científicos.
- Añade o actualiza pruebas cuando cambie el comportamiento de una capa.
- Ejecuta `pnpm run check` antes de abrir una propuesta.

## Cambios de datos

Describe en la propuesta la fuente, el commit o versión de origen, la transformación aplicada y la
licencia. Actualiza el manifiesto de integridad y la documentación correspondiente. Las geometrías
representativas deben declararse como tales y no presentarse como levantamientos de campo.

## Propuestas

Incluye una descripción breve del problema, cómo lo verificaste y capturas de pantalla si afecta la
interfaz. Las propuestas que incorporen una capa remota deben explicar qué ocurre cuando el servicio
no está disponible.
