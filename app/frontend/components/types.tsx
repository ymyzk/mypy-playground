export type ConfigDiff = {
  [key: string]: boolean | string | string[];
};

export type Config = {
  mypyVersion: string;
  pythonVersion: string;
  [key: string]: boolean | string | string[];
};

export type Context = {
  defaultConfig: Config;
  initialCode: string;
  pythonVersions: string[];
  mypyVersions: [string, string][];
  flags: string[];
  multiSelectOptions: {
    [key: string]: string[];
  };
  gaTrackingId: string | null;
};
