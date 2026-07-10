# services/

Reine Businesslogik (kein React-/Next-Import, vollstaendig unit-testbar).
Ein Unterordner pro Domaene, z.B. `offers/`, `pricing/`, `billing/`, `usage/`.
Externe Integrationen liegen in `services/integrations/<provider>` hinter einem Port-Interface.
