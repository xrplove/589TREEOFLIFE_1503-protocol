/* ────────────────────────────── WORKSPACE TYPES ──────────────────────────────
   Tipos compartidos del WorkspaceShell. Las 9 pestañas (`Tab`) son la
   estructura canónica del escritorio del Actor (decisión cierre 22-may con
   Agenda añadida + "Mensajes" como "Correo interno" en label visible). */

export type Tab =
  | 'buscador'
  | 'catalogo'
  | 'actores'
  | 'pedidos'
  | 'mi-catalogo'
  | 'archivos'
  | 'mensajes'
  | 'agenda'
  | 'exportacion'
  // Pestañas específicas de sector (la plantilla se adapta por sector; inmobiliario
  // conserva su set canónico de arriba). Transporte añade estas dos:
  | 'custodia'
  | 'documentacion'
