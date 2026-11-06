# Adustechlife

A responsive campus social web prototype for the ADUSTECH community. The app uses Supabase Auth and PostgreSQL for account registration, sign-in, password recovery, account profiles, institution-scoped admin access, and role-change audit records. Feed posts, Stricks, messages, media previews, and the campus map remain local demonstrations and are not saved to Supabase.

## Run locally

1. Create a Supabase project and open **Project Settings → API**.
2. Copy the project URL and the **publishable** key (or legacy `anon` key) into `url` and `anonKey` in `js/supabase-config.js`.
3. Open `supabase/schema.sql` in the Supabase SQL Editor and run it.
4. In Supabase Auth URL configuration, add the exact Live Server URL as an allowed redirect URL (for example `http://127.0.0.1:5500/**`).
5. Open `index.html` using VS Code Live Server.

Never put a `service_role` or secret key in this frontend. The browser only uses the publishable key; PostgreSQL row-level security and database functions protect institution data and role changes. The organization dashboard URL is not the project URL or API key.

## Accounts and administrator access

- Registration creates a student profile. Users cannot select or grant themselves a privileged role.
- Email confirmation and password reset use Supabase Auth. Configure the project's email provider and allowed redirect URLs for these flows.
- Students, lecturers, and moderators use the campus experience; an `admin` profile opens the admin console.
- Admins can view members and audit entries for their institution, and can assign student, lecturer, or moderator roles. Admin promotion is intentionally unavailable in the browser.
- To provision the initial admin, first register and confirm that person's account. Then, as the trusted project owner, run this in the Supabase SQL Editor after replacing the email:

```sql
update public.profiles
set role = 'admin', updated_at = now()
where user_id = (
  select id from auth.users where lower(email) = lower('first-admin@university.example')
)
and institution_id = (select id from public.institutions where slug = 'adustech');
```

This owner-only provisioning action is recorded by the database role-change trigger. Do not expose SQL Editor or database-owner credentials to browser users.

## What is and is not connected

- **Connected when configured:** account registration/sign-in, session restoration, sign-out, email confirmation callback, password reset, profile lookup, admin member listing, protected role changes, and admin audit-log display.
- **Still prototype-only:** posts and comments, Stricks and reactions, conversations, selected media, campus map and location toggle, notifications, and profile editing. These interactions use in-memory sample data and reset on reload. Location is not transmitted.
- The app does not yet verify that a registration email belongs to an ADUSTECH-controlled domain. Configure a verified-domain policy or institution invitation flow before public launch.

## Project files

- `index.html` provides the app, authentication, and admin shells.
- `css/style.css` contains responsive layouts and shared visual styles.
- `js/app.js` handles the prototype screens and auth/admin routing.
- `js/supabase-config.js` holds the project URL and publishable key.
- `js/supabase-auth.js` implements the small browser-side Supabase Auth/PostgREST client.
- `supabase/schema.sql` defines institutions, profiles, role protections, audit logging, RLS, and admin role management.

The browser UI is not a security boundary. Production launch still needs institution email verification, production redirect URLs, a trusted deployment, security testing, media storage policies, server-backed social features, and monitoring.
