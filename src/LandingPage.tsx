import { useEffect, useState } from "react";
import { ExternalLink, Globe, Laptop, Library, Play, Share2, Smartphone, Sparkles, UserRound } from "lucide-react";
import { buildDmgUrl } from "./lib/dmg-url";
import { detectMacArch } from "./lib/detect-mac-arch";

const DESKTOP_VERSION = "0.1.0";

function getSignInErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "code" in error && error.code === "auth/unauthorized-domain") {
    const localhostUrl = `http://localhost:${window.location.port || "5173"}/`;
    return `O login Google esta bloqueado porque esta pagina foi aberta em ${window.location.host}. Abre ${localhostUrl} ou adiciona ${window.location.hostname} em Firebase Authentication, Settings, Authorized domains.`;
  }
  return "O login Google falhou. Tenta novamente.";
}

export function LandingPage({ onSignIn }: { onSignIn: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [macArch, setMacArch] = useState<"arm64" | "x64">("arm64");

  useEffect(() => {
    const ua = (navigator.userAgent || "").toLowerCase();
    if (!ua.includes("mac")) return;
    detectMacArch(navigator as Parameters<typeof detectMacArch>[0])
      .then(setMacArch)
      .catch(() => {});
  }, []);

  const dmgUrl = buildDmgUrl(macArch, DESKTOP_VERSION);
  const archLabel = macArch === "arm64" ? "Apple Silicon" : "Intel";

  async function handleSignIn() {
    setError("");
    setBusy(true);
    try {
      await onSignIn();
    } catch (signInError) {
      setError(getSignInErrorMessage(signInError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="landing">
      <header className="landing-hero">
        <img className="brand-logo" src="/xani-assets/logo.svg" alt="" />
        <span className="eyebrow">Sistema criativo privado</span>
        <h1 className="landing-headline">Captura ideias. Encontra-as. Partilha-as.</h1>
        <p className="landing-subhead">
          Uma biblioteca visual partilhada para guardar vídeos, posts e referências.
        </p>
        <button className="primary-action" type="button" disabled={busy} onClick={handleSignIn}>
          <UserRound size={18} />
          {busy ? "A abrir o Google" : "Entrar com Google"}
        </button>
        {error ? <p className="auth-error">{error}</p> : null}
      </header>

      <section className="landing-video" aria-label="Demonstração em vídeo">
        <div className="landing-video-placeholder">
          <Play size={56} />
          <p>Vídeo em breve</p>
        </div>
      </section>

      <section className="landing-features" aria-label="Funcionalidades">
        <article className="landing-feature">
          <Sparkles size={28} />
          <h3>Captura em segundos</h3>
          <p>Cola um link, vídeo, post ou imagem — a biblioteca trata do resto.</p>
        </article>
        <article className="landing-feature">
          <Library size={28} />
          <h3>Tudo num só sítio</h3>
          <p>Biblioteca visual partilhada com categorias, pesquisa e filtros por equipa.</p>
        </article>
        <article className="landing-feature">
          <Share2 size={28} />
          <h3>Em todo o lado</h3>
          <p>Web, Mac e Android (em breve) — mesma biblioteca, mesma conta Google.</p>
        </article>
      </section>

      <section className="landing-downloads" aria-label="Transferências">
        <a className="landing-download" href={dmgUrl} download>
          <Laptop size={28} />
          <span className="download-platform">Mac</span>
          <span className="download-action">Transferir DMG</span>
          <span className="download-meta">{archLabel} · {DESKTOP_VERSION}</span>
        </a>
        <div className="landing-download landing-download-disabled" aria-disabled="true">
          <Smartphone size={28} />
          <span className="download-platform">Android</span>
          <span className="download-action">Em breve</span>
        </div>
        <button className="landing-download" type="button" disabled={busy} onClick={handleSignIn}>
          <Globe size={28} />
          <span className="download-platform">Web</span>
          <span className="download-action">Entrar com Google</span>
        </button>
      </section>

      <details className="landing-first-run">
        <summary>Primeira execução no Mac</summary>
        <p>
          O macOS bloqueia apps não assinadas. Depois de arrastar <strong>Segundo Cerebro</strong> para Aplicações,
          executa uma vez no Terminal:
        </p>
        <pre><code>xattr -cr "/Applications/Segundo Cerebro.app"</code></pre>
      </details>

      <footer className="landing-footer">
        <span>© 2026 Segundo Cerebro</span>
        <a href="https://github.com/AlexandreXavier/second-brain" target="_blank" rel="noreferrer">
          <ExternalLink size={16} /> GitHub
        </a>
      </footer>
    </div>
  );
}
