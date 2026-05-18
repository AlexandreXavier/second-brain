# iOS app scope is browse + quick capture, not full parity

The iOS app supports browsing the shared library (with user scope filter, category filter, and search) and quick capture (URL paste with metadata preview, camera roll image upload). It does not support editing or deleting existing ideas.

Full parity — inline editing of titles, notes, categories, film dates, and delete — would add 3–4 weeks to the initial build for features that are rarely needed on mobile. Browse-only felt like a half-product the team would stop opening. Browse + quick capture matches how mobile is actually used: reviewing the library on the go and firing a fast save when something worth keeping appears.

**Consequences:** iOS users who want to edit or delete an idea must open the web or desktop app. If this friction proves significant in practice, adding an edit sheet to `IdeaCard` on iOS is the natural next increment — the Firestore write path is already in place.
