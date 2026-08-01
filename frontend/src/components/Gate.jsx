import { LOGO_1X, LOGO_2X } from '../githubLogo.js';

/**
 * Decoy landing page — a pixel-accurate copy of the real GitHub Pages
 * "There isn't a GitHub Pages site here" 404 (markup, CSS, and the actual
 * octocat image all taken from a live instance of that page). Used both as
 * the default page shown to anyone who isn't logged in yet, and as the
 * lockout page.
 *
 * When `interactive` is true, the word "user" inside the paragraph is a
 * hidden trigger that reveals the real login form — it carries no color,
 * cursor, or selection styling of its own, so it reads, selects, and
 * behaves exactly like the surrounding text. When `interactive` is false
 * (lockout), the same markup renders but the trigger does nothing, so a
 * blocked visitor sees an identical, unremarkable page.
 */
export default function Gate({ interactive, onReveal }) {
  function handleKeyDown(e) {
    if (interactive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onReveal();
    }
  }

  return (
    <div className="notfound">
      <div className="notfound-inner">
        <h1>404</h1>
        <p>
          <strong>There isn&rsquo;t a GitHub Pages site here.</strong>
        </p>

        <p>
          If you&rsquo;re trying to publish one,{' '}
          <a href="https://help.github.com/pages/" target="_blank" rel="noreferrer">
            read the full documentation
          </a>{' '}
          to learn how to set up <strong>GitHub Pages</strong> for your repository,
          organization, or{' '}
          <span
            className="notfound-trigger"
            onClick={interactive ? onReveal : undefined}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            onKeyDown={handleKeyDown}
          >
            user
          </span>{' '}
          account.
        </p>

        <div className="notfound-status">
          <a href="https://githubstatus.com" target="_blank" rel="noreferrer">
            GitHub Status
          </a>{' '}
          &mdash;{' '}
          <a href="https://twitter.com/githubstatus" target="_blank" rel="noreferrer">
            @githubstatus
          </a>
        </div>

        <a href="/" className="notfound-logo notfound-logo-1x" onClick={(e) => e.preventDefault()}>
          <img width="32" height="32" alt="" src={LOGO_1X} />
        </a>
        <a href="/" className="notfound-logo notfound-logo-2x" onClick={(e) => e.preventDefault()}>
          <img width="32" height="32" alt="" src={LOGO_2X} />
        </a>
      </div>
    </div>
  );
}
