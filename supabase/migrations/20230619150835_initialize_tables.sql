create table "public"."organisations" (
    "id" bigint generated by default as identity not null,
    "name" text not null default ''::text,
    "created_at" timestamp with time zone default now()
);

CREATE UNIQUE INDEX organisations_pkey ON public.organisations USING btree (id);

alter table "public"."organisations" enable row level security;

CREATE TABLE "public"."profiles" (
    "id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone,
    "full_name" "text" DEFAULT ''::"text" NOT NULL,
    "avatar_url" "text",
    "email_address" "text",
    "org_id" bigint,
    CONSTRAINT "email_address" CHECK (("char_length"("email_address") >= 3))
);

alter table "public"."organisations" add constraint "organisations_pkey" PRIMARY KEY using index "organisations_pkey";

alter table "public"."profiles" add constraint "profiles_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organisations(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_org_id_fkey";

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE "public"."profiles" TO "service_role";
GRANT ALL ON TABLE "public"."organisations" TO "service_role";

CREATE OR REPLACE FUNCTION auth.email()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  select
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$function$
;

CREATE OR REPLACE FUNCTION auth.role()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  select
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$function$
;

CREATE OR REPLACE FUNCTION auth.uid()
 RETURNS uuid
 LANGUAGE sql
 STABLE
AS $function$
  select
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$function$
;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
begin
  insert into public.profiles (id, full_name, avatar_url, email_address)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email);
return new;
end;
$function$
;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

create table "public"."action_groups" (
    "id" bigint generated by default as identity not null,
    "name" text not null default ''::text,
    "created_at" timestamp with time zone default now(),
    "org_id" bigint
);

alter table "public"."action_groups" add constraint "action_groups_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organisations(id) ON DELETE CASCADE not valid;

alter table "public"."action_groups" validate constraint "action_groups_org_id_fkey";

alter table "public"."action_groups" enable row level security;

create table "public"."actions" (
    "id" bigint generated by default as identity not null,
    "name" text not null default ''::text,
    "description" text not null default ''::text,
    "path" text,
    "request_body_contents" json,
    "parameters" json,
    "responses" json,
    "created_at" timestamp with time zone not null default now(),
    "action_group" bigint,
    "request_method" text,
    "org_id" bigint
);

alter table "public"."actions" add constraint "actions_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organisations(id) ON DELETE CASCADE not valid;

alter table "public"."actions" validate constraint "actions_org_id_fkey";

alter table "public"."actions" enable row level security;

CREATE UNIQUE INDEX action_groups_id_key ON public.action_groups USING btree (id);

CREATE UNIQUE INDEX action_groups_pkey ON public.action_groups USING btree (id);

CREATE UNIQUE INDEX actions_pkey ON public.actions USING btree (id);

alter table "public"."action_groups" add constraint "action_groups_pkey" PRIMARY KEY using index "action_groups_pkey";

alter table "public"."actions" add constraint "actions_pkey" PRIMARY KEY using index "actions_pkey";

alter table "public"."action_groups" add constraint "action_groups_id_key" UNIQUE using index "action_groups_id_key";

alter table "public"."actions" add constraint "actions_action_group_fkey" FOREIGN KEY (action_group) REFERENCES action_groups(id) ON DELETE CASCADE not valid;

alter table "public"."actions" validate constraint "actions_action_group_fkey";
