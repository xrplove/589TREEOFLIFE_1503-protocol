-- Migration: 009_messages
-- Created: 2026-05-17
-- Purpose: Fase 4 — chat self-host (Mensajes). Modelo conversación +
-- participantes + mensajes. v1: 1-a-1 texto plano + read receipts.
--
-- Decisiones de diseño ancladas al plan docs/plan-fase4-chat.md:
--  - Puerta 1 (modelo de llamadas): conversación con LISTA de participantes
--    (N por diseño), nunca "A↔B" hardcodeado, aunque v1 limite a 2. Así el
--    vídeo (Fase 5) reusa el mismo modelo de sala.
--  - Tamper-evident: NINGUNA escritura desde el cliente. Solo el servidor
--    WebSocket (service_role, salta RLS) inserta mensajes y actualiza
--    read_at. La RLS solo permite LECTURA a los participantes. Mismo
--    patrón que consent_log/auth_attempt_log.
--  - Idempotencia (§2.3): client_msg_id único por (conversación, emisor)
--    → reintentos del cliente no duplican.
--  - Tope de longitud en BD (defensa en profundidad; el server también lo
--    valida antes de insertar).
--
-- Puerta 5 (relación activa) — NOTA HONESTA: hoy NO existe tabla de
-- pedidos/relación formal en el esquema (es Fase 6). En v1 el gating
-- anti-contacto-en-frío lo aplica el SERVIDOR (ambos KYC-approved +
-- creación de conversación rate-limited por emisor), NO esta migración.
-- Cuando exista la entidad de pedido (Fase 6) se endurece atando la
-- conversación a una relación activa real.
--
-- Cómo aplicar (manual desde Dashboard):
--   1. https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/sql/new
--   2. Pegar el contenido de este archivo entero
--   3. Click en Run (o Ctrl + Enter)
--   4. Esperar "Success. No rows returned."

-- ─────────────────────────────────────────────────────────────────────
-- 1. Conversaciones (sala genérica, N participantes por diseño)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.conversations (
  id          uuid primary key default gen_random_uuid(),
  created_by  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  added_at        timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index if not exists conversation_participants_user_idx
  on public.conversation_participants (user_id);

-- ─────────────────────────────────────────────────────────────────────
-- 2. Mensajes
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references auth.users(id) on delete cascade,
  -- Idempotencia: lo genera el cliente; reintentos no duplican.
  client_msg_id   uuid,
  -- Texto plano v1. Tope en BD (el server además valida antes de insertar).
  body            text not null check (char_length(body) between 1 and 4000),
  created_at      timestamptz not null default now(),
  -- v1 1-a-1: instante en que el ÚNICO interlocutor lo leyó. Para N
  -- participantes (futuro) esto pasaría a una tabla message_reads.
  read_at         timestamptz
);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

-- Idempotencia efectiva: un mismo client_msg_id de un mismo emisor en una
-- misma conversación no se inserta dos veces.
create unique index if not exists messages_idempotency_idx
  on public.messages (conversation_id, sender_id, client_msg_id)
  where client_msg_id is not null;

-- ─────────────────────────────────────────────────────────────────────
-- 3. Row-Level Security
-- ─────────────────────────────────────────────────────────────────────
-- Lectura: solo participantes de la conversación. Escritura: NINGUNA
-- desde el cliente — solo el servidor WS con service_role (que salta RLS).
-- Esto hace el hilo tamper-evident y centraliza el gating en el server.
alter table public.conversations            enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages                 enable row level security;

-- conversation_participants: cada quien ve SOLO sus propias filas de
-- pertenencia (simple, sin recursión de RLS).
drop policy if exists "cparticipants_select_own" on public.conversation_participants;
create policy "cparticipants_select_own" on public.conversation_participants
  for select using (user_id = auth.uid());

-- conversations: visible si auth.uid() es participante.
drop policy if exists "conversations_select_participant" on public.conversations;
create policy "conversations_select_participant" on public.conversations
  for select using (
    exists (
      select 1 from public.conversation_participants p
      where p.conversation_id = conversations.id
        and p.user_id = auth.uid()
    )
  );

-- messages: visible si auth.uid() es participante de la conversación.
drop policy if exists "messages_select_participant" on public.messages;
create policy "messages_select_participant" on public.messages
  for select using (
    exists (
      select 1 from public.conversation_participants p
      where p.conversation_id = messages.conversation_id
        and p.user_id = auth.uid()
    )
  );

-- Sin políticas de INSERT/UPDATE/DELETE: el cliente no puede escribir ni
-- borrar. Todas las escrituras pasan por el servidor WS (service_role).
