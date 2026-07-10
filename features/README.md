# features/

Vertikale Feature-Slices (z.B. `offers`, `customers`, `pricing`, `billing`).
Jedes Slice buendelt eigene Components, Server Actions, Zod-Schemas und Types.
Slices duerfen `services/` und `repositories/` importieren, nie umgekehrt.
