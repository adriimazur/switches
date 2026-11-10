// Names and links used across the public site. One place to change them.
// PRODUCT_NAME drives the wordmark, page titles, the Overview page's text and
// the footer. The docs pages' prose, the package name (`switches-react`), the
// CLI name (`switches`) and the panel's own title (packages/switches) spell the
// name out themselves: change them too if the product is ever renamed.

export const PRODUCT_NAME = "Switches";

/** One-sentence definition, used as the Overview page's h1. */
export const TAGLINE = "Let your client pick the version, on the real site.";

/** Meta description and the Overview intro. */
export const DESCRIPTION =
  "a free, source-available React package that keeps several AI-made versions of a page section on your live site, so anyone can flip between them, pick one and send the picks back to Claude Code.";

export const LICENSE = "PolyForm Shield 1.0.0";
export const LICENSE_URL = "https://polyformproject.org/licenses/shield/1.0.0";

/** Shown in the sidebar. Keep in step with packages/switches/package.json. */
export const VERSION = "0.1.0";

// The GitHub repo must exist before the docs site is deployed (step 2 of
// "Publishing the package" in docs/RELEASE.md), or these links 404.
// (GitHub links are hidden only while this is the empty string.)
export const GITHUB_URL = "https://github.com/adriimazur/switches";

// TODO(launch): check this once the package is published under this name.
export const NPM_URL = "https://www.npmjs.com/package/switches-react";

/** The public docs site (served under the /switches sub-path of mazur.design). */
export const DOCS_URL = "https://mazur.design/switches";

export const AUTHOR_NAME = "Andrii Mazur";
export const AUTHOR_URL = "https://mazur.design";

export const LINKEDIN_URL = "https://www.linkedin.com/in/andrii-mazur-design/";
export const X_URL = "https://x.com/mazur_designs";

export const INSTALL = "pnpm add switches-react && npx switches init";
