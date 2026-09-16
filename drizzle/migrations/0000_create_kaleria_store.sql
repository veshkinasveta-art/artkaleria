CREATE TYPE public.app_role AS ENUM ('admin');
CREATE TYPE public.lead_kind AS ENUM ('order', 'estimate', 'workshop', 'certificate', 'callback');
CREATE TYPE public.lead_status AS ENUM ('new', 'in_progress', 'completed');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can read own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (char_length(slug) BETWEEN 2 AND 80),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  category text NOT NULL CHECK (category IN ('florarium','mossarium','panel','circle','bonsai')),
  description text NOT NULL CHECK (char_length(description) <= 2000),
  details text NOT NULL DEFAULT '' CHECK (char_length(details) <= 4000),
  care text NOT NULL DEFAULT '' CHECK (char_length(care) <= 2000),
  price integer NOT NULL CHECK (price >= 0),
  image_key text NOT NULL DEFAULT 'florarium',
  sizes text[] NOT NULL DEFAULT ARRAY['Средний'],
  published boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published products are public"
ON public.products FOR SELECT TO anon, authenticated
USING (published OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage products"
ON public.products FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.lead_kind NOT NULL,
  status public.lead_status NOT NULL DEFAULT 'new',
  customer_name text NOT NULL CHECK (char_length(customer_name) BETWEEN 2 AND 100),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 7 AND 30),
  email text CHECK (email IS NULL OR char_length(email) <= 255),
  message text NOT NULL DEFAULT '' CHECK (char_length(message) <= 2000),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  total integer CHECK (total IS NULL OR total >= 0),
  admin_note text NOT NULL DEFAULT '' CHECK (char_length(admin_note) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.leads TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit leads"
ON public.leads FOR INSERT TO anon, authenticated
WITH CHECK (status = 'new' AND admin_note = '');
CREATE POLICY "Admins manage leads"
ON public.leads FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX products_category_published_idx ON public.products(category, published);
CREATE INDEX leads_status_created_idx ON public.leads(status, created_at DESC);