// Pre-filled "new issue" link for a CrossHair crash.

const ISSUES_URL = 'https://github.com/pschanely/CrossHair/issues/new';
// GitHub rejects very long URLs; keep well under the limit.
const MAX_SOURCE = 2500;
const MAX_TRACEBACK = 2500;

// Last non-empty line of a traceback, e.g. "ValueError: bad input".
export function summarizeTraceback(traceback) {
  const lines = (traceback || '').split('\n').map(l => l.trim()).filter(l => l);
  return lines.length > 0 ? lines[lines.length - 1] : 'unknown error';
}

function clip(text, max, fromEnd) {
  if (text.length <= max) {
    return text;
  }
  return fromEnd ? `...${text.slice(text.length - max)}` : `${text.slice(0, max)}...`;
}

export function buildCrashIssueUrl({
  source, crashed, crosshairVersion, pythonVersion,
}) {
  const body = [
    'CrossHair crashed in the playground (Pyodide).',
    '',
    `CrossHair ${crosshairVersion || '?'}, Python ${pythonVersion || '?'}`,
    '',
    'Code:',
    '```python',
    clip(source, MAX_SOURCE, false),
    '```',
    '',
    'Traceback:',
    '```',
    clip(crashed, MAX_TRACEBACK, true),
    '```',
  ].join('\n');
  const params = new URLSearchParams({
    title: `Crash: ${summarizeTraceback(crashed)}`.slice(0, 120),
    body,
  });
  return `${ISSUES_URL}?${params.toString()}`;
}
