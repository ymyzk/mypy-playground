import type { Ace } from "ace-builds";
import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

import { runTypecheck } from "../utils/api";
import { fetchGist as fetchGistAPI, shareGist as shareGistAPI } from "../utils/gist";
import { parseMessages } from "../utils/utils";
import Editor from "./Editor";
import Header from "./Header";
import Result from "./Result";
import type { AppResult, Config, ConfigDiff, Context } from "./types";

type Props = {
  context: Context;
};

// Helper function to parse URL params and compute initial config
function getInitialConfig(context: Context): Config {
  const params = new URLSearchParams(window.location.search);
  const diff: ConfigDiff = {};

  if (params.has("mypy")) {
    diff.mypyVersion = params.get("mypy")!;
  }
  if (params.has("python")) {
    diff.pythonVersion = params.get("python")!;
  }
  Object.entries(context.multiSelectOptions).forEach(([option, choices]) => {
    if (params.has(option)) {
      const values = params.get(option)?.split(",") || [];
      diff[option] = values.filter((v) => choices.includes(v));
    }
  });
  if (params.has("flags")) {
    for (const flag of params.get("flags")!.split(",")) {
      diff[flag] = true;
    }
  }

  return {
    ...context.defaultConfig,
    ...diff,
  };
}

// Helper function to get initial source from localStorage
function getInitialSource(context: Context): string {
  const storedSource = window.localStorage.getItem("source");
  return storedSource || context.initialCode;
}

export default function App({ context }: Props) {
  const [annotations, setAnnotations] = useState<Ace.Annotation[]>([]);
  const [config, setConfig] = useState<Config>(() => getInitialConfig(context));
  const [contextState] = useState<Context>(context);
  const [source, setSource] = useState<string>(() => getInitialSource(context));
  const [result, setResult] = useState<AppResult>({ status: "ready" });

  const isFirstRender = useRef(true);

  // Helper function to fetch gist
  const fetchGist = async (gistId: string) => {
    setResult({ status: "fetching_gist" });
    try {
      const { source: gistSource } = await fetchGistAPI(gistId);
      setResult({
        status: "fetched_gist",
      });
      setSource(gistSource);
    } catch (error) {
      setResult({
        status: "failed",
        message: `Failed to fetch the gist: ${error}`,
      });
    }
  };

  // ComponentDidMount effect - runs once on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Load gist if specified in URL
    if (params.has("gist")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchGist(params.get("gist")!);
    }
  }, []); // Empty array means run once on mount

  // Sync config changes to URL history
  useEffect(() => {
    // Skip on first render to avoid pushing history on mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const flags: string[] = [];
    Object.entries(config).forEach(([k, v]) => {
      if (k === "mypyVersion" && typeof v == "string") {
        params.set("mypy", v);
      } else if (k === "pythonVersion" && typeof v == "string") {
        params.set("python", v);
      } else if (k in contextState.multiSelectOptions && Array.isArray(v)) {
        if (v.length > 0) {
          params.set(k, v.join(","));
        } else {
          params.delete(k);
        }
      } else if (v) {
        flags.push(k);
      }
    });
    if (flags.length > 0) {
      params.set("flags", flags.join(","));
    } else {
      params.delete("flags");
    }
    window.history.pushState({}, "", `?${params.toString()}`);
  }, [config, contextState.multiSelectOptions]);

  // Sync source to localStorage
  useEffect(() => {
    window.localStorage.setItem("source", source);
  }, [source]);

  const onChange = (newSource: string) => {
    setSource(newSource);
  };

  const updateConfig = useCallback((configDiff: ConfigDiff) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      ...configDiff,
    }));
  }, []);

  const run = useCallback(async () => {
    setResult({ status: "running" });

    try {
      const typecheckResult = await runTypecheck({
        ...config,
        source,
      });
      setResult({ status: "succeeded", result: typecheckResult });
      setAnnotations(parseMessages(typecheckResult.stdout));
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.message : `${error}`;
      setResult({ status: "failed", message });
    }
  }, [config, source]);

  const shareGist = useCallback(async () => {
    setResult({ status: "creating_gist" });
    try {
      const playgroundUrl = new URL(window.location.href);
      const params = new URLSearchParams(playgroundUrl.search);
      const { gistId, gistUrl } = await shareGistAPI(source);
      params.set("gist", gistId);
      playgroundUrl.search = `?${params.toString()}`;
      setResult({
        status: "created_gist",
        gistUrl,
        playgroundUrl: playgroundUrl.toString(),
      });
    } catch (error) {
      setResult({
        status: "failed",
        message: `Failed to create a gist: ${error}`,
      });
    }
  }, [source]);

  return (
    <div className="App d-flex flex-flow flex-column vh-100">
      <Header
        context={contextState}
        config={config}
        status={result.status}
        onGistClick={shareGist}
        onRunClick={run}
        onConfigChange={updateConfig}
      />
      <Editor onChange={onChange} annotations={annotations} source={source} />
      <Result result={result} />
    </div>
  );
}
