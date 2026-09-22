CREATE TYPE public.chat_status AS ENUM ('bot', 'needs_operator', 'operator', 'closed');
CREATE TYPE public.chat_role AS ENUM ('visitor', 'assistant', 'operator', 'system');

CREATE TABLE public.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_token text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  phone text NOT NULL,
  consent boolean NOT NULL DEFAULT true,
  status public.chat_status NOT NULL DEFAULT 'bot',
  unread_for_admin boolean NOT NULL DEFAULT false,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role public.chat_role NOT NULL,
  content text NOT NULL DEFAULT '',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX chat_messages_session_created_idx ON public.chat_messages (session_id, created_at);
CREATE INDEX chat_sessions_status_idx ON public.chat_sessions (status);
CREATE INDEX chat_sessions_last_message_idx ON public.chat_sessions (last_message_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_sessions TO authenticated;
GRANT ALL ON public.chat_sessions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage chat sessions" ON public.chat_sessions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage chat messages" ON public.chat_messages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));