// Sharing: a self-contained link (source deflated into the URL hash). Gists are
// read-only (used by the built-in examples); creating one needs a token.

export const DEFAULT_SOURCE = `
def make_bigger(n: int) -> int:
  '''
  post: __return__ != 0
  '''
  return 2 * n + 10

`;

async function pipe(bytes, transform) {
  const stream = new Blob([bytes]).stream().pipeThrough(transform);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function toBase64Url(bytes) {
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text) {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

export async function encodeSource(source) {
  const bytes = await pipe(new TextEncoder().encode(source), new CompressionStream('deflate-raw'));
  return toBase64Url(bytes);
}

export async function decodeSource(encoded) {
  const bytes = await pipe(fromBase64Url(encoded), new DecompressionStream('deflate-raw'));
  return new TextDecoder().decode(bytes);
}

// Returns the shared source from a location hash like "#code=...", or null.
export async function sourceFromHash(hash) {
  const code = new URLSearchParams(hash.replace(/^#/, '')).get('code');
  return code ? decodeSource(code) : null;
}

// A link to this playground containing `source`. Keeps config params, drops any gist.
export async function shareLink(source, href) {
  const url = new URL(href);
  url.searchParams.delete('gist');
  url.searchParams.delete('source');
  url.hash = `code=${await encodeSource(source)}`;
  return url.toString();
}

// Gist file to load: "main.py" if present, else the first .py file.
export function pickGistFile(files) {
  if ('main.py' in files) {
    return files['main.py'];
  }
  const name = Object.keys(files).find(n => n.endsWith('.py'));
  if (!name) {
    throw new Error('no Python file found in the gist');
  }
  return files[name];
}

export async function fetchGist(gistId) {
  const response = await fetch(`https://api.github.com/gists/${encodeURIComponent(gistId)}`);
  if (!response.ok) {
    throw new Error(`GitHub returned ${response.status}`);
  }
  const data = await response.json();
  const file = pickGistFile(data.files);
  if (file.truncated) {
    throw new Error('the gist file is too large');
  }
  return { source: file.content };
}
