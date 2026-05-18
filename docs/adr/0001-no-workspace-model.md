# No workspace model — user scope is a client-side filter only

All ideas live in a single shared Firestore collection. The "Minhas ideias / Toda a equipa" toggle filters by `createdBy.uid` on the client; there is no `workspaceId` field, no sub-collection per team, and no server-side partitioning.

We considered adding a `workspaceId` field to scope ideas per team, but the app serves one team on one Firebase project and Firestore rules already gate access to authenticated users only. A workspace field would require a migration of all existing documents and adds no security or functional benefit in this context.

**Consequences:** If multi-tenant support is ever needed (multiple teams sharing one project), every idea document will need a `workspaceId` field added and Firestore rules will need to enforce it. That migration is non-trivial. Until then, do not add `workspaceId` — it would be dead schema.
