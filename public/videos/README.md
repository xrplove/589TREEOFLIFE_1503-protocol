# Vídeos de fondo cinematográficos · 1503

Vídeos MP4 usados como fondo cinematográfico en vistas operativas concretas
del workspace (ej. "Modo Carga en Muelle" del sector transporte cuando una
naviera/transitario vacía un pedido FCL a un contenedor).

## Inventario

| Archivo | Resolución | Bitrate | Duración | Peso | Fuente | Licencia |
|---|---|---|---|---|---|---|
| `port-cargo-ships.mp4` | 1920×1080 H.264 | 2.2 Mbps | 37s loop | 9.9 MB | [Pexels 3840442 · Tom Fisk](https://www.pexels.com/video/cargo-container-ships-in-port-3840442/) | [Pexels License](https://www.pexels.com/license/) · gratis uso comercial sin atribución |

## Regenerar (si quieres tocar la calidad)

El original 4K se descarga así desde Pexels:

```bash
curl -sL -o port-cargo-ships-4k.mp4 \
  "https://www.pexels.com/download/video/3840442/"
```

Compresión a 1080p sin audio (loop muted):

```bash
ffmpeg -i port-cargo-ships-4k.mp4 \
  -c:v libx264 -preset medium \
  -b:v 2200k -maxrate 2800k -bufsize 4400k \
  -an \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black" \
  -pix_fmt yuv420p \
  -movflags +faststart \
  port-cargo-ships.mp4 -y
```

## Reglas

- **Siempre `muted`** en el `<video>` HTML (autoplay sin user gesture requiere muted en navegadores modernos)
- **`loop`** para que repita sin corte
- **`playsinline`** para iOS Safari (evita fullscreen forzado)
- **`preload="auto"`** para evitar flash de fondo negro al abrir la vista
- **Sin audio en el archivo** (`-an` arriba) · reduce peso y elimina cualquier riesgo de licencia musical

## Audit-ready notes

Estos vídeos no contienen PII ni datos personales · solo material decorativo
con licencia trazable. Cumplen RGPD por su naturaleza (sin tratamiento de
datos). Cualquier vídeo añadido debe documentarse en este README con su
licencia + URL fuente · no se admiten vídeos de fuente desconocida.
