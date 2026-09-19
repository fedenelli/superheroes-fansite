/** Values that were hardcoded identically into all twelve legacy pages. */
export const SITE = {
  origin: 'https://www.superheroes.com.ar',
  twitter: '@superheroestw',
  gtm: 'GTM-N3SK6W',
  artist: 'Superhéroes',
  authorUrl:
    'https://www.fedenelli.com/?utm_source=superheroes&utm_medium=referral&utm_campaign=superheroes-footer',
  /**
   * Where fans send aportes: the address reversed and base64-encoded, so it
   * appears in plain text neither in this public repo nor in the built HTML.
   * Correo.astro prints it as is and correo.ts decodes it in the browser. To
   * change it: node -e 'console.log(btoa([..."a@b.com"].reverse().join("")))'
   */
  correo: 'bW9jLmxpYW1nQGlsbGVuLm5m',
} as const;
