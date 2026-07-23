-- Migración 034 · Eliminar triggers de limpieza de storage que fallan en silencio
-- ============================================================================
--
-- CONTEXTO
-- --------
-- Borrar filas de `storage.objects` desde SQL no elimina de forma fiable el
-- blob real en el backend de almacenamiento (y suele fallar por permisos
-- 42501). Por eso la limpieza de objetos de Storage DEBE hacerse en la capa de
-- aplicación con `supabase.storage.from(bucket).remove([...])`, no con triggers.
--
-- La migración 013 ya anuló el trigger de mig 010 (fotos de puesto). Esta
-- migración cierra el mismo patrón heredado de mig 017 (avatar público):
--   · cleanup_old_public_avatar / actors_public_avatar_cleanup         (UPDATE)
--   · delete_public_avatar_on_actor_delete / actors_public_avatar_delete_cleanup (DELETE)
--
-- Estos triggers daban FALSA CONFIANZA: el código de /api/photos/public-avatar
-- confiaba en ellos para borrar el avatar anterior al reemplazar, dejando el
-- blob huérfano en cada cambio (incidencia RGPD). El endpoint ya hace la
-- limpieza en la capa de app; aquí solo retiramos los triggers inertes.
--
-- RESPONSABILIDAD DE BORRADO DE CUENTA (derecho al olvido, RGPD Art. 17)
-- ---------------------------------------------------------------------
-- El cascade FK desde auth.users elimina las FILAS de las tablas de datos,
-- pero NO los objetos de Storage. Cualquier endpoint futuro de borrado de
-- cuenta DEBE, antes de `auth.admin.deleteUser(id)`:
--   1. Listar y `.remove()` los objetos del usuario en TODOS los buckets
--      (actor-public-avatars, fotos de puesto, kyc-docs, logos, documentos…).
--   2. Luego eliminar el usuario.
-- Los scripts scripts/cleanup-test-data.mjs y scripts/delete-test-user.mjs ya
-- modelan este orden correcto y sirven de referencia.

-- mig 017 · avatar público
drop trigger if exists actors_public_avatar_cleanup on public.actors;
drop function if exists public.cleanup_old_public_avatar();

drop trigger if exists actors_public_avatar_delete_cleanup on public.actors;
drop function if exists public.delete_public_avatar_on_actor_delete();

-- mig 010 · fotos de puesto (ya anulado en 013; idempotente por seguridad)
drop trigger if exists workplace_photos_storage_cleanup on public.actor_workplace_photos;
drop function if exists public.delete_workplace_photo_storage();
