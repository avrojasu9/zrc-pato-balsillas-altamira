# Visor territorial — ZRC Cuenca del Río Pato y Valle de Balsillas y Resguardo Altamira

Sitio cartográfico estático para la **Comisión para la Prevención, Atención y Resolución Oportuna de Conflictos Territoriales**. Incluye portada con logotipos de participantes, visor de capas, consulta de atributos, búsqueda de veredas y leyenda interactiva.

## Nombre del proyecto

**Zona de Reserva Campesina Cuenca del Río Pato y Valle de Balsillas y Resguardo Altamira**.

> Este visor apoya la comprensión territorial de la Zona de Reserva Campesina Cuenca del Río Pato y Valle de Balsillas y de la comunidad indígena del Resguardo Altamira, facilitando la prevención, atención y resolución oportuna de conflictos territoriales.

## Publicación en GitHub Pages

1. Crear un repositorio **público** en GitHub.
2. Cargar **el contenido de esta carpeta en la raíz del repositorio**, no el archivo ZIP ni una carpeta contenedora. `index.html` debe verse en la raíz.
3. En **Settings → Pages** seleccionar **Deploy from a branch**, rama **main**, carpeta **/(root)**, y guardar.
4. Visitar la URL indicada en Settings → Pages después de que finalice el despliegue.

No requiere Python, compilación, claves API, backend ni herramientas de ArcGIS Online. Necesita conexión a internet para cargar las bibliotecas Leaflet y MapLibre y las capas de fondo. `data/capas.js` ya contiene los datos vectoriales necesarios para el visor, por lo que no realiza descargas de fuentes geográficas externas.

## Funcionalidades

- Portada de ingreso con logotipos de la Comisión, botón para entrar y presentación de ambos territorios.
- Mapa principal con los polígonos de pretensión ZRC, ZRC constituidas, revisión Resguardo Altamira y ajuste territorial.
- Capas opcionales: Ley Segunda 2023, parques naturales, páramos, resguardos indígenas formalizados, municipios, veredas, vías y drenajes.
- Selección de elementos para consultar atributos; búsqueda por vereda; nombres de veredas opcionales desde zoom 12; leyenda contextual.
- Mapas base: **Esri World Imagery**, **OpenFreeMap** y **sin mapa base**. OpenStreetMap Standard y CARTO se retiraron a raíz de bloqueos de acceso reportados.

## Estructura

```text
index.html                    Página principal y portada
README.md                     Documentación
.nojekyll                     Desactiva Jekyll en GitHub Pages
assets/logos_participantes.png  Logotipos de la portada (extraídos de captura)
css/estilos.css               Estilos completos
js/visor.js                   Lógica completa del mapa
data/capas.js                 Datos geográficos incluidos (12 conjuntos)
```

No se incluyen los GeoJSON individuales duplicados ni el archivo de inicio `.bat`, porque no son necesarios para GitHub Pages. Las 12 capas y su geometría simplificada están incluidas en `data/capas.js`. No modificar las rutas relativas sin ajustar `index.html`.

## Procedencia, interpretación y permisos

Las geometrías de consulta fueron preparadas a partir de respaldos del visor ArcGIS Online proporcionados para el proyecto. Fueron recortadas y simplificadas para la web; no sustituyen documentos de delimitación oficial ni sirven para recalcular áreas jurídicas. El atributo de la pretensión de ZRC registra **145.397,13 ha**. La presencia de áreas o límites próximos no constituye por sí misma acreditación de un traslape jurídico.

Los logotipos fueron extraídos de una captura aportada para reconstruir la portada y no son archivos maestros de las organizaciones; para su uso público debe contarse con autorización y, cuando sea posible, reemplazarlos por versiones oficiales de mejor resolución.

**Antes de distribuir públicamente la cartografía, verificar que se dispone de las autorizaciones correspondientes para compartir las capas y los elementos gráficos.** Este proyecto no incorpora una licencia de redistribución automática para datos, logotipos ni recursos cartográficos de terceros.

El mapa satelital de **Esri World Imagery** depende de un servicio externo, debe conservar su atribución y está sujeto a las condiciones del proveedor. **OpenFreeMap** es una alternativa sin clave API, pero su disponibilidad depende de conexión a internet, el servicio de estilos y un navegador compatible con WebGL. Las bibliotecas JS/CSS también se obtienen de CDN externos.
