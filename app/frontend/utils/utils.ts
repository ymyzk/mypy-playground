type Message = {
  row: number;
  column?: number;
  type: string;
  text: string;
}

function getTypeFromLevel(level: string): string {
  const levelToType: { [key: string]: string } = {
    error: 'error',
    note: 'info',
  };
  const type = levelToType[level];
  return type || 'error';
}

function notNull<T>(value: T | null): value is T {
  return value !== null;
}

export function parseMessages(stdout: string): Message[] {
  const matcher: RegExp = /^main\.py:(\d+):(\d+:)? (\w+): (.+)/;
  return stdout.split('\n').map((m) => {
    const match = m.match(matcher);
    return match ? {
      row: parseInt(match[1], 10) - 1,
      ...(match[2] && { column: parseInt(match[2].slice(0, -1)) - 1 }),
      type: getTypeFromLevel(match[3]),
      text: match[4],
    } : null;
  }).filter(notNull);
}
