export type ConfigDiff = Record<string, boolean | string | string[]>;

export interface Config extends Record<string, boolean | string | string[]> {
  mypyVersion: string;
  pythonVersion: string;
}

export interface Context {
  defaultConfig: Config;
  initialCode: string;
  pythonVersions: string[];
  mypyVersions: [string, string][];
  flags: string[];
  multiSelectOptions: Record<string, string[]>;
  gaTrackingId: string | null;
}

export interface TypecheckResult {
  exit_code: number;
  stdout: string;
  stderr: string;
  duration: number;
}

export type AppResult =
  | { status: "ready" }
  | { status: "running" }
  | { status: "succeeded"; result: TypecheckResult }
  | { status: "failed"; message: string }
  | { status: "creating_gist" }
  | { status: "fetching_gist" }
  | { status: "created_gist"; gistUrl: string; playgroundUrl: string }
  | { status: "fetched_gist" };
