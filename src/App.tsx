import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut, type User } from "firebase/auth";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  Calendar,
  Check,
  Clipboard,
  ExternalLink,
  Film,
  ImagePlus,
  KeyRound,
  Library,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  UserRound,
} from "lucide-react";
import { agentApiUrl, auth, db, googleProvider, storage } from "./lib/firebase";
import { createPreviewFromUrl, formatCategories, parseCategories } from "./lib/metadata";
import { createAgentToken, sha256, tokenPreview } from "./lib/security";
import { fileToDataUrl, suggestLiteralTitle } from "./lib/title";
import type { Idea, IdeaDraft, UserProfile } from "./lib/types";

const emptyDraft: IdeaDraft = {
  type: "idea",
  title: "",
  previewText: "",
  categories: [],
};

function formatDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-PT", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function readableType(type: Idea["type"]) {
  const names: Record<Idea["type"], string> = {
    youtube: "YouTube",
    tweet: "Publicação X",
    instagram: "Instagram",
    article: "Artigo",
    screenshot: "Captura",
    idea: "Ideia",
  };
  return names[type];
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [queryText, setQueryText] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todas");
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [dataError, setDataError] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setIdeas([]);
      setProfile(null);
      return undefined;
    }

    const ideasQuery = query(collection(db, "ideas"), orderBy("createdAt", "desc"));
    const unsubIdeas = onSnapshot(
      ideasQuery,
      (snapshot) => {
        setDataError("");
        setIdeas(snapshot.docs.map((ideaDoc) => ({ id: ideaDoc.id, ...ideaDoc.data() }) as Idea));
      },
      (error) => {
        setDataError(getFirebasePermissionMessage(error));
      },
    );

    const profileRef = doc(db, "profiles", user.uid);
    const unsubProfile = onSnapshot(
      profileRef,
      (snapshot) => {
        setDataError("");
        if (snapshot.exists()) {
          setProfile({ uid: user.uid, ...snapshot.data() } as UserProfile);
          return;
        }

        void setDoc(profileRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          updatedAt: serverTimestamp(),
        }).catch((error) => setDataError(getFirebasePermissionMessage(error)));
      },
      (error) => {
        setDataError(getFirebasePermissionMessage(error));
      },
    );

    return () => {
      unsubIdeas();
      unsubProfile();
    };
  }, [user]);

  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    ideas.forEach((idea) => idea.categories?.forEach((category) => categorySet.add(category)));
    return ["Todas", ...Array.from(categorySet).sort((a, b) => a.localeCompare(b))];
  }, [ideas]);

  const filteredIdeas = useMemo(() => {
    const needle = queryText.trim().toLowerCase();
    return ideas.filter((idea) => {
      const categoryMatch = activeCategory === "Todas" || idea.categories?.includes(activeCategory);
      const haystack = [
        idea.title,
        idea.source,
        idea.sourceName,
        idea.author,
        idea.description,
        idea.previewText,
        idea.notes,
        ...(idea.categories || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return categoryMatch && (!needle || haystack.includes(needle));
    });
  }, [activeCategory, ideas, queryText]);

  async function handleGoogleSignIn() {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === "auth/popup-blocked") {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      throw error;
    }
  }

  async function handleSignOut() {
    await signOut(auth);
  }

  async function saveIdea(draft: IdeaDraft, file?: File | null) {
    if (!user) return;

    let nextDraft = { ...draft };
    if (file) {
      const storageRef = ref(storage, `ideas/${user.uid}/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      nextDraft = {
        ...nextDraft,
        type: "screenshot",
        imageUrl: downloadUrl,
        thumbnailUrl: downloadUrl,
        title: nextDraft.title || file.name,
      };
    }

    await addDoc(collection(db, "ideas"), {
      ...nextDraft,
      title: nextDraft.title || "Ideia sem titulo",
      categories: nextDraft.categories || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        type: "human",
      },
    });

    setIsCaptureOpen(false);
  }

  async function updateIdea(id: string, draft: Partial<IdeaDraft>) {
    await updateDoc(doc(db, "ideas", id), {
      ...draft,
      updatedAt: serverTimestamp(),
    });
  }

  async function removeIdea(id: string) {
    await deleteDoc(doc(db, "ideas", id));
  }

  async function rotateAgentToken() {
    if (!user) return;
    const token = createAgentToken();
    const hash = await sha256(token);
    await Promise.all([
      setDoc(
        doc(db, "profiles", user.uid),
        {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          agentToken: token,
          agentTokenHash: hash,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      ),
      setDoc(doc(db, "agentTokens", hash), {
        active: true,
        createdBy: user.uid,
        createdByEmail: user.email,
        tokenPreview: tokenPreview(token),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    ]);
    setNotice("Token de agente atualizado.");
  }

  function copyText(text: string, message: string) {
    void navigator.clipboard.writeText(text);
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2400);
  }

  if (!authReady) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <SignInScreen onSignIn={handleGoogleSignIn} />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">
          <Film size={21} />
        </div>
        <div className="brand-copy">
          <span>Segundo Cerebro</span>
          <strong>Ideias de Video</strong>
        </div>
        <label className="search-field">
          <Search size={18} />
          <input
            value={queryText}
            onChange={(event) => setQueryText(event.target.value)}
            placeholder="Pesquisar links, notas, categorias"
          />
        </label>
        <button className="icon-button" type="button" onClick={() => setIsCaptureOpen((value) => !value)}>
          <Plus size={18} />
          <span className="tooltip">Capturar</span>
        </button>
        <button className="profile-button" type="button" onClick={() => setIsProfileOpen((value) => !value)}>
          {user.photoURL ? <img src={user.photoURL} alt="" /> : <UserRound size={19} />}
          <span>{user.displayName || "Perfil"}</span>
        </button>
      </header>

      <main
        className={`workspace ${isCaptureOpen ? "is-capture-open" : ""} ${isProfileOpen ? "is-profile-open" : ""}`.trim()}
      >
        <aside className={`capture-panel ${isCaptureOpen ? "is-open" : ""}`}>
          <CaptureForm onSave={saveIdea} />
        </aside>

        <section className="library-area" aria-label="Ideias guardadas">
          <div className="library-header">
            <div>
              <span className="eyebrow">Biblioteca visual</span>
              <h1>Tudo o que vale a pena filmar.</h1>
            </div>
            <div className="library-stat">
              <Library size={18} />
              <strong>{ideas.length}</strong>
              <span>{ideas.length === 1 ? "item" : "itens"}</span>
            </div>
          </div>

          {dataError ? <div className="permission-banner">{dataError}</div> : null}

          <div className="category-strip" aria-label="Categorias">
            {categories.map((category) => (
              <button
                className={category === activeCategory ? "is-active" : ""}
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {filteredIdeas.length > 0 ? (
            <div className="masonry-grid">
              {filteredIdeas.map((idea) => (
                <IdeaCard
                  idea={idea}
                  key={idea.id}
                  onDelete={removeIdea}
                  onUpdate={updateIdea}
                />
              ))}
            </div>
          ) : (
            <EmptyState hasIdeas={ideas.length > 0} />
          )}
        </section>

        <aside className={`profile-panel ${isProfileOpen ? "is-open" : ""}`}>
          <ProfilePanel
            profile={profile}
            user={user}
            onCopy={copyText}
            onRotateToken={rotateAgentToken}
            onSignOut={handleSignOut}
          />
        </aside>
      </main>

      {notice ? <div className="toast">{notice}</div> : null}
    </div>
  );
}

function getFirebasePermissionMessage(error: unknown) {
  if (typeof error === "object" && error && "code" in error && error.code === "permission-denied") {
    return "O Firebase esta a bloquear o acesso a base de dados. Publica as regras do Firestore e do Storage para este projeto, ou restringe o acesso a uma lista aprovada.";
  }

  if (typeof error === "object" && error && "code" in error && error.code === "storage/unauthorized") {
    return "O Firebase Storage esta a bloquear os carregamentos. Publica as regras de storage antes de enviar capturas.";
  }

  return "O Firebase nao conseguiu concluir esse pedido.";
}

function LoadingScreen() {
  return (
    <div className="auth-screen">
      <div className="auth-panel">
        <div className="brand-mark large">
          <Film size={28} />
        </div>
        <p>A abrir a biblioteca.</p>
      </div>
    </div>
  );
}

function SignInScreen({ onSignIn }: { onSignIn: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function getSignInErrorMessage(error: unknown) {
    if (typeof error === "object" && error && "code" in error && error.code === "auth/unauthorized-domain") {
      const localhostUrl = `http://localhost:${window.location.port || "5173"}/`;
      return `O login Google esta bloqueado porque esta pagina foi aberta em ${window.location.host}. Abre ${localhostUrl} ou adiciona ${window.location.hostname} em Firebase Authentication, Settings, Authorized domains.`;
    }

    return "O login Google falhou. Tenta novamente.";
  }

  return (
    <div className="auth-screen">
      <section className="auth-panel">
        <div className="brand-mark large">
          <Film size={28} />
        </div>
        <span className="eyebrow">Sistema criativo privado</span>
        <h1>Um segundo cerebro visual para ideias de video.</h1>
        <p>
          Guarda publicacoes, videos, artigos, capturas, hooks e referencias numa biblioteca calma
          onde a tua equipa e os agentes autorizados podem trabalhar.
        </p>
        <button
          className="primary-action"
          type="button"
          disabled={busy}
          onClick={async () => {
            setError("");
            setBusy(true);
            try {
              await onSignIn();
            } catch (signInError) {
              setError(getSignInErrorMessage(signInError));
            } finally {
              setBusy(false);
            }
          }}
        >
          <UserRound size={18} />
          {busy ? "A abrir o Google" : "Entrar com Google"}
        </button>
        {error ? <p className="auth-error">{error}</p> : null}
      </section>
    </div>
  );
}

function CaptureForm({ onSave }: { onSave: (draft: IdeaDraft, file?: File | null) => Promise<void> }) {
  const [source, setSource] = useState("");
  const [draft, setDraft] = useState<IdeaDraft>(emptyDraft);
  const [categoryText, setCategoryText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuggestingTitle, setIsSuggestingTitle] = useState(false);
  const [titleDirty, setTitleDirty] = useState(false);
  const [error, setError] = useState("");

  async function applySuggestedTitle(nextDraft: IdeaDraft, options?: { force?: boolean; imageDataUrl?: string }) {
    if (titleDirty && !options?.force) return;

    setIsSuggestingTitle(true);
    try {
      const suggestedTitle = await suggestLiteralTitle({
        currentTitle: nextDraft.title,
        description: nextDraft.description,
        previewText: nextDraft.previewText,
        sourceName: nextDraft.sourceName,
        source: nextDraft.source,
        author: nextDraft.author,
        url: nextDraft.url,
        imageDataUrl: options?.imageDataUrl || fileDataUrl || undefined,
      });

      if (suggestedTitle) {
        setDraft((current) => ({ ...current, ...nextDraft, title: suggestedTitle }));
      } else {
        setDraft((current) => ({ ...current, ...nextDraft }));
      }
    } catch {
      setDraft((current) => ({ ...current, ...nextDraft }));
    } finally {
      setIsSuggestingTitle(false);
    }
  }

  async function fetchPreview() {
    setIsFetching(true);
    try {
      const preview = await createPreviewFromUrl(source);
      const nextDraft = {
        ...preview,
        categories: parseCategories(categoryText),
        notes: draft.notes,
        filmDate: draft.filmDate,
        title: draft.title || preview.title,
      };
      await applySuggestedTitle(nextDraft);
    } finally {
      setIsFetching(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const fallback = source.trim() ? await createPreviewFromUrl(source) : emptyDraft;
      const normalizedDraft = {
        ...fallback,
        ...draft,
        title: draft.title || fallback.title || source || "Ideia solta",
        categories: parseCategories(categoryText),
      };

      let finalDraft = normalizedDraft;
      if (!titleDirty || !normalizedDraft.title) {
        try {
          const suggestedTitle = await suggestLiteralTitle({
            currentTitle: normalizedDraft.title,
            description: normalizedDraft.description,
            previewText: normalizedDraft.previewText,
            sourceName: normalizedDraft.sourceName,
            source: normalizedDraft.source,
            author: normalizedDraft.author,
            url: normalizedDraft.url,
            imageDataUrl: fileDataUrl || undefined,
          });
          if (suggestedTitle) {
            finalDraft = { ...normalizedDraft, title: suggestedTitle };
          }
        } catch {
          // Keep save flow fast even if title suggestion is unavailable.
        }
      }

      await onSave(
        finalDraft,
        file,
      );
      setSource("");
      setDraft(emptyDraft);
      setCategoryText("");
      setFile(null);
      setFileDataUrl("");
      setTitleDirty(false);
    } catch (saveError) {
      setError(getFirebasePermissionMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="capture-form" onSubmit={handleSubmit}>
      <div>
        <span className="eyebrow">Capturar</span>
        <h2>Adicionar algo util.</h2>
      </div>

      <label>
        Link ou ideia solta
        <textarea
          value={source}
          onChange={(event) => setSource(event.target.value)}
          placeholder="Cola um link de YouTube, X, Instagram, artigo, ou escreve um hook"
          rows={4}
        />
      </label>

      <button className="secondary-action" type="button" disabled={!source.trim() || isFetching} onClick={fetchPreview}>
        <RefreshCw size={16} />
        {isFetching ? "A obter pre-visualizacao" : "Obter pre-visualizacao"}
      </button>

      <label>
        Titulo
        <input
          value={draft.title}
          onChange={(event) => {
            setTitleDirty(true);
            setDraft((current) => ({ ...current, title: event.target.value }));
          }}
          placeholder="Titulo simples e claro"
        />
      </label>

      <button
        className="secondary-action"
        type="button"
        disabled={isSuggestingTitle || (!source.trim() && !fileDataUrl && !draft.description && !draft.previewText)}
        onClick={async () => {
          setError("");
          setTitleDirty(false);
          await applySuggestedTitle(
            {
              ...draft,
              type: fileDataUrl ? "screenshot" : draft.type,
              title: draft.title || file?.name.replace(/\.[^.]+$/, "") || source || "",
            },
            { force: true, imageDataUrl: fileDataUrl || undefined },
          );
        }}
      >
        <Sparkles size={16} />
        {isSuggestingTitle ? "A sugerir titulo" : "Sugerir titulo"}
      </button>

      <label>
        Notas
        <textarea
          value={draft.notes || ""}
          onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
          placeholder="Porque importa, angulo, reacao ou ideia de filmagem"
          rows={3}
        />
      </label>

      <label>
        Categorias
        <div className="input-with-icon">
          <Tag size={16} />
          <input
            value={categoryText}
            onChange={(event) => setCategoryText(event.target.value)}
            placeholder="Adicionar manualmente, separadas por virgulas"
          />
        </div>
      </label>

      <label>
        Data prevista de filmagem
        <div className="input-with-icon">
          <Calendar size={16} />
          <input
            type="date"
            value={draft.filmDate || ""}
            onChange={(event) => setDraft((current) => ({ ...current, filmDate: event.target.value }))}
          />
        </div>
      </label>

      <label className="file-drop">
        <ImagePlus size={18} />
        <span>{file ? file.name : "Anexar captura ou imagem de referencia"}</span>
        <input
          type="file"
          accept="image/*"
          onChange={async (event) => {
            const nextFile = event.target.files?.[0] || null;
            setFile(nextFile);

            if (!nextFile) {
              setFileDataUrl("");
              return;
            }

            const dataUrl = await fileToDataUrl(nextFile);
            setFileDataUrl(dataUrl);
            const nextDraft = {
              ...draft,
              type: "screenshot" as const,
              title: draft.title || nextFile.name.replace(/\.[^.]+$/, ""),
              previewText: draft.previewText || "Referencia em captura",
            };
            await applySuggestedTitle(nextDraft, { imageDataUrl: dataUrl });
          }}
        />
      </label>

      <PreviewMini draft={draft} source={source} />

      {error ? <p className="form-error">{error}</p> : null}

      <button className="primary-action" type="submit" disabled={isSaving || (!source.trim() && !draft.title && !file)}>
        <Sparkles size={17} />
        {isSaving ? "A guardar" : "Guardar no cerebro"}
      </button>
    </form>
  );
}

function PreviewMini({ draft, source }: { draft: IdeaDraft; source: string }) {
  if (!draft.title && !source) return null;

  return (
    <div className="preview-mini">
      <span>{readableType(draft.type)}</span>
      <strong>{draft.title || source}</strong>
      {draft.author ? <small>{draft.author}</small> : null}
    </div>
  );
}

function IdeaCard({
  idea,
  onDelete,
  onUpdate,
}: {
  idea: Idea;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, draft: Partial<IdeaDraft>) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(idea.title);
  const [notes, setNotes] = useState(idea.notes || "");
  const [filmDate, setFilmDate] = useState(idea.filmDate || "");
  const [categories, setCategories] = useState(formatCategories(idea.categories || []));

  async function saveEdits() {
    await onUpdate(idea.id, {
      title,
      notes,
      filmDate,
      categories: parseCategories(categories),
    });
    setIsEditing(false);
  }

  return (
    <article className={`idea-card type-${idea.type}`}>
      <CardVisual idea={idea} />
      <div className="idea-content">
        <div className="idea-meta">
          <span>{readableType(idea.type)}</span>
          {idea.source ? <span>{idea.source}</span> : null}
        </div>

        {isEditing ? (
          <div className="edit-stack">
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
            <textarea value={notes} rows={3} onChange={(event) => setNotes(event.target.value)} />
            <input value={categories} onChange={(event) => setCategories(event.target.value)} />
            <input type="date" value={filmDate} onChange={(event) => setFilmDate(event.target.value)} />
            <div className="card-actions">
              <button type="button" onClick={saveEdits}>
                <Check size={15} />
                Guardar
              </button>
              <button type="button" onClick={() => setIsEditing(false)}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            <h3>{idea.title}</h3>
            {idea.description ? <p>{idea.description}</p> : null}
            {idea.previewText && idea.type !== "tweet" ? <p>{idea.previewText}</p> : null}
            {idea.notes ? <p className="notes">{idea.notes}</p> : null}
            {idea.filmDate ? (
              <div className="film-date">
                <Calendar size={15} />
                {formatDate(idea.filmDate)}
              </div>
            ) : null}
            {idea.categories?.length ? (
              <div className="tag-row">
                {idea.categories.map((category) => (
                  <span key={category}>{category}</span>
                ))}
              </div>
            ) : null}
            <div className="card-actions">
              {idea.url ? (
                <a href={idea.url} target="_blank" rel="noreferrer">
                  <ExternalLink size={15} />
                  Abrir
                </a>
              ) : null}
              <button type="button" onClick={() => setIsEditing(true)}>
                Editar
              </button>
              <button className="danger" type="button" onClick={() => onDelete(idea.id)}>
                <Trash2 size={15} />
              </button>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

function CardVisual({ idea }: { idea: Idea }) {
  const image = idea.imageUrl || idea.thumbnailUrl;
  if (image) {
    return (
      <div className="card-image">
        <img src={image} alt="" loading="lazy" />
      </div>
    );
  }

  if (idea.type === "tweet") {
    return (
      <div className="tweet-preview">
        <div>
          <strong>{idea.author || "X"}</strong>
          <span>@source</span>
        </div>
        <p>{idea.previewText || "Publicacao guardada do X."}</p>
      </div>
    );
  }

  if (idea.type === "instagram") {
    return (
      <div className="instagram-preview">
        <span>Instagram</span>
        <strong>{idea.author || "Referencia visual"}</strong>
      </div>
    );
  }

  return (
    <div className="text-preview">
      <span>{idea.sourceName || idea.source || readableType(idea.type)}</span>
      <strong>{idea.title}</strong>
    </div>
  );
}

function ProfilePanel({
  profile,
  user,
  onCopy,
  onRotateToken,
  onSignOut,
}: {
  profile: UserProfile | null;
  user: User;
  onCopy: (text: string, message: string) => void;
  onRotateToken: () => Promise<void>;
  onSignOut: () => Promise<void>;
}) {
  const token = profile?.agentToken || "";
  const skillBlock = `# Skill do Agente para o Video Second Brain

Podes operar o cerebro partilhado de ideias de video desta equipa.

API do agente:
${agentApiUrl}

Autenticacao:
Envia este header HTTP em todos os pedidos:
x-agent-token: ${token || "[generate-token-in-profile-first]"}

Regras:
- Nao leias nem alteres a biblioteca sem o token presente.
- Mantem o token privado e nunca o coloques em logs publicos.
- Usa GET /ideas para ler a biblioteca.
- Usa POST /ideas para adicionar um item guardado.
- Usa PATCH /ideas/:id para atualizar titulo, notas, categorias, filmDate, metadata ou campos de preview.
- Usa DELETE /ideas/:id apenas quando te pedirem explicitamente.
- As categorias sao manuais. Nao inventes categorias por defeito sem pedido humano.
- filmDate deve estar no formato YYYY-MM-DD quando existir.

Campos JSON da ideia:
type, url, title, source, sourceName, author, description, previewText, thumbnailUrl, imageUrl, categories, filmDate, notes.`;

  return (
    <div className="profile-inner">
      <div className="profile-head">
        {user.photoURL ? <img src={user.photoURL} alt="" /> : <UserRound size={28} />}
        <div>
          <span className="eyebrow">Perfil</span>
          <h2>{user.displayName || "Sessao iniciada"}</h2>
          <p>{user.email}</p>
        </div>
      </div>

      <section className="agent-box">
        <div className="section-title">
          <KeyRound size={18} />
          <h3>Acesso do agente</h3>
        </div>
        <p>
          O token abaixo fica guardado no teu perfil autenticado e e validado pela Firebase Function
          antes de um agente poder ler ou escrever ideias.
        </p>
        <div className="token-row">
          <code>{token ? tokenPreview(token) : "Ainda sem token"}</code>
          <button type="button" onClick={onRotateToken}>
            <RefreshCw size={15} />
            {token ? "Rodar" : "Gerar"}
          </button>
        </div>
        <button className="secondary-action" type="button" disabled={!token} onClick={() => onCopy(token, "Token copiado.")}>
          <Clipboard size={16} />
          Copiar token
        </button>
      </section>

      <section className="skill-block">
        <div className="section-title">
          <Sparkles size={18} />
          <h3>Skill de agente copiavel</h3>
        </div>
        <textarea readOnly value={skillBlock} rows={16} />
        <button className="primary-action" type="button" onClick={() => onCopy(skillBlock, "Skill do agente copiada.")}>
          <Clipboard size={16} />
          Copiar skill
        </button>
      </section>

      <button className="sign-out" type="button" onClick={onSignOut}>
        <LogOut size={16} />
        Terminar sessao
      </button>
    </div>
  );
}

function EmptyState({ hasIdeas }: { hasIdeas: boolean }) {
  return (
    <div className="empty-state">
      <div className="brand-mark">
        <Library size={21} />
      </div>
      <h2>{hasIdeas ? "Sem ideias correspondentes." : "As tuas primeiras referencias vao aparecer aqui."}</h2>
      <p>
        {hasIdeas
          ? "Experimenta outra pesquisa ou outro filtro de categoria."
          : "Cola um link, obtém a pre-visualizacao, adiciona as tuas categorias quando fizer sentido e define uma data de filmagem quando a ideia ficar real."}
      </p>
    </div>
  );
}

export default App;
