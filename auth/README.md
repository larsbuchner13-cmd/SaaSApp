# auth/

Clerk-Wrapper: Session-/Organization-Mapping auf `companies`/`users`/`memberships`.

`sync-clerk.ts` synct Company/User/Membership aus Clerks Backend-API — genutzt sowohl
Just-in-time von `server/tenant-context.ts` (beim allerersten Zugriff) als auch vom
Clerk-Webhook (`webhooks/clerk-handler.ts`, bei Aenderungen). Clerk-Organisationsrollen
(`org:admin`/`org:member`) werden nur beim allerersten Anlegen einer Mitgliedschaft auf
unsere feineren Rollen gemappt (Org-Ersteller → `owner`, sonst `mitarbeiter`) — danach
werden Rollen ausschliesslich in unseren eigenen Einstellungen verwaltet, nicht durch
Clerk ueberschrieben.
