// eslint-disable-next-line import/prefer-default-export
export function parseMessages(stdout) {
  const types = {
    error: 'error',
    note: 'info',
  };
  const getType = (level) => {
    const type = types[level];
    return type || 'error';
  };
  const matcher = /^main\.py:(\d+):(\d+:)? (\w+): (.+)/;
  return stdout.split('\n').map((m) => {
    const match = m.match(matcher);
    return match ? {
      row: match[1] - 1,
      ...(match[2] && { column: match[2].slice(0, -1) - 1 }),
      type: getType(match[3]),
      text: match[4],
    } : null;
  }).filter((m) => m !== null);
}
