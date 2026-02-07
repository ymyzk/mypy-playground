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

export type TypecheckResult = {
  exit_code: number;
  stdout: string;
  stderr: string;
  duration: number;
};

export type AppResult =
  | { status: "ready" }
  | { status: "running" }
  | { status: "succeeded"; result: TypecheckResult }
  | { status: "failed"; message: string }
  | { status: "creating_gist" }
  | { status: "fetching_gist" }
  | { status: "created_gist"; gistUrl: string; playgroundUrl: string }
  | { status: "fetched_gist" };
