import { Ace } from "ace-builds";
import React from "react";
import axios from "axios";

import { runTypecheck } from "../utils/api";
import { fetchGist, shareGist } from "../utils/gist";
import { parseMessages } from "../utils/utils";
import Editor from "./Editor";
import Header from "./Header";
import Result from "./Result";
import { AppResult, Config, ConfigDiff, Context } from "./types";

type Props = {
  context: Context;
};

type State = {
  annotations: Ace.Annotation[];
  config: Config;
  context: Context;
  source: string;
  result: AppResult;
};

export default class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { context } = props;
    this.state = {
      annotations: [],
      config: context.defaultConfig,
      context,
      source: context.initialCode,
      result: {
        status: "ready",
      },
    };

    this.run = this.run.bind(this);
    this.shareGist = this.shareGist.bind(this);
    this.onChange = this.onChange.bind(this);
    this.updateConfig = this.updateConfig.bind(this);
  }

  componentDidMount() {
    const { context } = this.state;

    // if (context.ga_tracking_id) {
    //   ReactGA.initialize(context.ga_tracking_id);
    //   ReactGA.pageview(window.location.pathname + window.location.search);
    // }

    const params = new URLSearchParams(window.location.search);
    // Load configurations
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
    this.updateConfig(diff);
    // Load source
    const source = window.localStorage.getItem("source");
    if (source) {
      this.setState({ source });
    }
    // Load gist
    if (params.has("gist")) {
      this.fetchGist(params.get("gist")!);
    }
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    const { config, context, source } = this.state;

    // Push history when configuration has changed
    const params = new URLSearchParams(window.location.search);
    if (prevState.config !== config) {
      const flags: string[] = [];
      Object.entries(config).forEach(([k, v]) => {
        if (k === "mypyVersion" && typeof v == "string") {
          params.set("mypy", v);
        } else if (k === "pythonVersion" && typeof v == "string") {
          params.set("python", v);
        } else if (k in context.multiSelectOptions && Array.isArray(v)) {
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
      }
      window.history.pushState({}, "", `?${params.toString()}`);
    }

    if (prevState.source !== source) {
      window.localStorage.setItem("source", source);
    }
  }

  onChange(source: string) {
    this.setState({ source });
  }

  updateConfig(configDiff: ConfigDiff) {
    this.setState((prevState) => ({
      config: {
        ...prevState.config,
        ...configDiff,
      },
    }));
  }

  async run() {
    const { config, source } = this.state;

    this.setState({ result: { status: "running" } });

    try {
      const result = await runTypecheck({
        ...config,
        source,
      });
      this.setState({
        result: { status: "succeeded", result },
        annotations: parseMessages(result.stdout),
      });
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.message : `${error}`;
      this.setState({ result: { status: "failed", message } });
    }
  }

  async shareGist() {
    const { source } = this.state;
    this.setState({ result: { status: "creating_gist" } });
    try {
      const playgroundUrl = new URL(window.location.href);
      const params = new URLSearchParams(playgroundUrl.search);
      const { gistId, gistUrl } = await shareGist(source);
      params.set("gist", gistId);
      playgroundUrl.search = `?${params.toString()}`;
      this.setState({
        result: {
          status: "created_gist",
          gistUrl,
          playgroundUrl: playgroundUrl.toString(),
        },
      });
    } catch (error) {
      this.setState({ result: { status: "failed", message: `Failed to create a gist: ${error}` } });
    }
  }

  async fetchGist(gistId: string) {
    this.setState({ result: { status: "fetching_gist" } });
    try {
      const { source } = await fetchGist(gistId);
      this.setState({
        result: {
          status: "fetched_gist",
        },
        source,
      });
    } catch (error) {
      this.setState({ result: { status: "failed", message: `Failed to fetch the gist: ${error}` } });
    }
  }

  render() {
    const { annotations, config, context, result, source } = this.state;
    return (
      <div className="App d-flex flex-flow flex-column vh-100">
        <Header
          context={context}
          config={config}
          status={result.status}
          onGistClick={this.shareGist}
          onRunClick={this.run}
          onConfigChange={this.updateConfig}
        />
        <Editor onChange={this.onChange} annotations={annotations} source={source} />
        <Result result={result} />
      </div>
    );
  }
}
