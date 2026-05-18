# CONTEXT.md

Domain glossary for the Video Second Brain app.

---

## User scope filter

A two-state client-side toggle ("Minhas ideias" / "Toda a equipa") that determines which ideas are visible in the library. The default is **"Minhas ideias"**, which shows only ideas where `createdBy.uid` matches the signed-in user. **"Toda a equipa"** shows all ideas in the shared `ideas` collection regardless of author.

The category strip and item count both derive from the user-scoped set, not from the full collection — a category pill only appears when it exists within the current scope.

**Not a workspace.** There is no workspace model, no `workspaceId` field, and no per-tenant partitioning. All ideas share the same Firestore collection. The scope filter is a pure client-side view preference.
