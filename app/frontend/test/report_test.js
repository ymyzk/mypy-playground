import { URLSearchParams } from 'url';
import { buildCrashIssueUrl, summarizeTraceback } from '../src/report';

// The old jsdom used by this Jest version lacks URLSearchParams; browsers have it.
global.URLSearchParams = URLSearchParams;

const traceback = 'Traceback (most recent call last):\n  File "x.py", line 1\nValueError: bad input\n';

describe('summarizeTraceback', () => {
  it('returns the last line', () => {
    expect(summarizeTraceback(traceback)).toBe('ValueError: bad input');
  });

  it('handles empty input', () => {
    expect(summarizeTraceback('')).toBe('unknown error');
  });
});

describe('buildCrashIssueUrl', () => {
  const parse = url => new URLSearchParams(url.split('?')[1]);

  it('includes title, code, traceback and versions', () => {
    const url = buildCrashIssueUrl({
      source: 'def f(): pass', crashed: traceback, crosshairVersion: '1.2.3', pythonVersion: '3.14.2',
    });
    expect(url.startsWith('https://github.com/pschanely/CrossHair/issues/new?')).toBe(true);
    const params = parse(url);
    expect(params.get('title')).toBe('Crash: ValueError: bad input');
    expect(params.get('body')).toContain('def f(): pass');
    expect(params.get('body')).toContain('ValueError: bad input');
    expect(params.get('body')).toContain('CrossHair 1.2.3, Python 3.14.2');
  });

  it('keeps the URL short for huge inputs, keeping the end of the traceback', () => {
    const url = buildCrashIssueUrl({
      source: 'x = 1\n'.repeat(5000), crashed: `${'a\n'.repeat(5000)}FinalError: boom`,
    });
    expect(url.length).toBeLessThan(12000);
    expect(parse(url).get('body')).toContain('FinalError: boom');
  });
});
