// CrossHair options exposed by the playground, and their URL / CLI encodings.

export const BOOLEAN_FLAGS = ['verbose', 'report_all'];
export const ANALYSIS_KINDS = ['asserts', 'PEP316', 'icontract', 'deal'];
// Recommended way of bounding the analysis.
export const NUMBER_OPTIONS = ['max_uninteresting_iterations'];
// Still supported; shown under "Advanced settings".
export const ADVANCED_NUMBER_OPTIONS = ['per_condition_timeout', 'per_path_timeout'];

const ALL_NUMBER_OPTIONS = [...NUMBER_OPTIONS, ...ADVANCED_NUMBER_OPTIONS];

export function defaultConfig() {
  const config = { analysis_kind: [] };
  BOOLEAN_FLAGS.forEach((flag) => { config[flag] = false; });
  // Empty string means "use CrossHair's default" (no flag is passed).
  ALL_NUMBER_OPTIONS.forEach((name) => { config[name] = ''; });
  return config;
}

function validNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// Command-line arguments for `crosshair`, excluding the target file.
export function buildArgs(config) {
  const args = ['check'];
  BOOLEAN_FLAGS.forEach((flag) => {
    if (config[flag]) {
      args.push(`--${flag}`);
    }
  });
  const kinds = ANALYSIS_KINDS.filter(kind => config.analysis_kind.includes(kind));
  if (kinds.length > 0) {
    args.push(`--analysis_kind=${kinds.join(',')}`);
  }
  ALL_NUMBER_OPTIONS.forEach((name) => {
    const n = validNumber(config[name]);
    if (n !== null) {
      args.push(`--${name}=${n}`);
    }
  });
  return args;
}

// Reads a config diff from URL search params.
//
// Accepts the current format (`flags=verbose,analysis_kind=deal` plus one param
// per number option) and old links, where number options were smuggled into
// `flags` (`flags=per_condition_timeout=5,per_path_timeout=3`). The old
// `crosshair=` and `python=` params are ignored.
export function configFromParams(params) {
  const diff = {};
  const kinds = [];
  const setNumber = (name, value) => {
    if (ALL_NUMBER_OPTIONS.includes(name) && validNumber(value) !== null) {
      diff[name] = value;
    }
  };
  (params.get('flags') || '').split(',').filter(entry => entry).forEach((entry) => {
    const [key, ...rest] = entry.split('=');
    const value = rest.join('=');
    if (rest.length === 0) {
      if (BOOLEAN_FLAGS.includes(key)) {
        diff[key] = true;
      }
    } else if (key === 'analysis_kind') {
      if (ANALYSIS_KINDS.includes(value)) {
        kinds.push(value);
      }
    } else {
      setNumber(key, value);
    }
  });
  if (kinds.length > 0) {
    diff.analysis_kind = kinds;
  }
  ALL_NUMBER_OPTIONS.forEach((name) => {
    if (params.has(name)) {
      setNumber(name, params.get(name));
    }
  });
  return diff;
}

// Writes `config` into URLSearchParams (mutating them), dropping stale entries.
export function writeConfigToParams(params, config) {
  params.delete('crosshair');
  params.delete('python');
  const flags = BOOLEAN_FLAGS.filter(flag => config[flag]);
  ANALYSIS_KINDS.filter(kind => config.analysis_kind.includes(kind))
    .forEach(kind => flags.push(`analysis_kind=${kind}`));
  if (flags.length > 0) {
    params.set('flags', flags.join(','));
  } else {
    params.delete('flags');
  }
  ALL_NUMBER_OPTIONS.forEach((name) => {
    const n = validNumber(config[name]);
    if (n !== null) {
      params.set(name, String(n));
    } else {
      params.delete(name);
    }
  });
  return params;
}
