import { parseMessages } from '../src/utils';

describe('parseMessages', () => {
  it('should parse and return annotations', () => {
    const stdout = `/tmp/main.py:12: error: false when calling f(0) (which returns 0)
/tmp/main.py:13: error: ValueError: bad input when calling g('')
some unrelated line
`;
    const annotations = [
      {
        row: 11,
        type: 'error',
        text: ' false when calling f(0) (which returns 0)',
      },
      {
        row: 12,
        type: 'error',
        text: ' ValueError: bad input when calling g(\'\')',
      },
    ];
    expect(parseMessages(stdout)).toEqual(annotations);
  });
});
