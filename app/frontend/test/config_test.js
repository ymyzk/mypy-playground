import { URLSearchParams } from 'url';
import {
  buildArgs, configFromParams, defaultConfig, writeConfigToParams,
} from '../src/config';

describe('buildArgs', () => {
  it('passes no options by default (CrossHair defaults)', () => {
    expect(buildArgs(defaultConfig())).toEqual(['check']);
  });

  it('builds flags, a single analysis_kind list, and numbers', () => {
    const config = {
      ...defaultConfig(),
      verbose: true,
      analysis_kind: ['deal', 'asserts'],
      max_uninteresting_iterations: '20',
      per_condition_timeout: '2.5',
    };
    expect(buildArgs(config)).toEqual([
      'check',
      '--verbose',
      '--analysis_kind=asserts,deal',
      '--max_uninteresting_iterations=20',
      '--per_condition_timeout=2.5',
    ]);
  });

  it('ignores blank and invalid numbers', () => {
    const config = {
      ...defaultConfig(), max_uninteresting_iterations: 'abc', per_path_timeout: '-1',
    };
    expect(buildArgs(config)).toEqual(['check']);
  });
});

describe('configFromParams', () => {
  const parse = search => configFromParams(new URLSearchParams(search));

  it('reads the current format', () => {
    expect(parse('?flags=verbose,analysis_kind=deal&max_uninteresting_iterations=9')).toEqual({
      verbose: true,
      analysis_kind: ['deal'],
      max_uninteresting_iterations: '9',
    });
  });

  it('reads old links that put timeouts in flags, and ignores crosshair/python', () => {
    const search = '?crosshair=0.1&python=3.8&flags=verbose,per_condition_timeout=5,per_path_timeout=3,analysis_kind=asserts';
    expect(parse(search)).toEqual({
      verbose: true,
      per_condition_timeout: '5',
      per_path_timeout: '3',
      analysis_kind: ['asserts'],
    });
  });

  it('drops analysis kinds CrossHair does not have', () => {
    expect(parse('?flags=analysis_kind=hypothesis')).toEqual({});
  });

  it('ignores unknown flags and bad numbers', () => {
    expect(parse('?flags=bogus,per_path_timeout=x&per_condition_timeout=nope')).toEqual({});
  });
});

describe('writeConfigToParams', () => {
  it('round-trips and removes stale params', () => {
    const config = {
      ...defaultConfig(), report_all: true, analysis_kind: ['icontract'], per_path_timeout: '3',
    };
    const params = new URLSearchParams('?source=x&crosshair=0.1&python=3.8&flags=old');
    writeConfigToParams(params, config);
    expect(params.has('crosshair')).toBe(false);
    expect(params.has('python')).toBe(false);
    expect(params.get('source')).toBe('x');
    expect(configFromParams(params)).toEqual({
      report_all: true, analysis_kind: ['icontract'], per_path_timeout: '3',
    });
  });

  it('removes flags when nothing is set', () => {
    const params = new URLSearchParams('?flags=verbose&per_path_timeout=3');
    writeConfigToParams(params, defaultConfig());
    expect(params.toString()).toBe('');
  });
});
