import { encodeSource, decodeSource, sourceFromHash, shareLink, pickGistFile } from '../src/share';

test('source round-trips, including unicode', async () => {
  const source = 'def f(x: int) -> str:\n  "héllo ✓"\n  return "a" * x\n';
  expect(await decodeSource(await encodeSource(source))).toBe(source);
});

test('encoding is URL-safe', async () => {
  expect(await encodeSource('?>?>?>~~~'.repeat(20))).toMatch(/^[A-Za-z0-9_-]+$/);
});

test('shareLink keeps config, drops gist, and is readable via the hash', async () => {
  const link = await shareLink('x = 1', 'http://h/p/?flags=verbose&gist=abc');
  const url = new URL(link);
  expect(url.search).toBe('?flags=verbose');
  expect(await sourceFromHash(url.hash)).toBe('x = 1');
});

test('sourceFromHash returns null without code', async () => {
  expect(await sourceFromHash('')).toBeNull();
  expect(await sourceFromHash('#other=1')).toBeNull();
});

test('pickGistFile prefers main.py, falls back to any .py', () => {
  expect(pickGistFile({ 'a.py': 1, 'main.py': 2 })).toBe(2);
  expect(pickGistFile({ 'README.md': 0, 'a.py': 1 })).toBe(1);
  expect(() => pickGistFile({ 'README.md': 0 })).toThrow();
});
