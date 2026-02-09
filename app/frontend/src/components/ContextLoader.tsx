import axios from "axios";
import React, { useEffect, useState } from "react";
import { Spinner } from "reactstrap";
import type { Context } from "./types";

function ContextLoader(WrappedComponent: React.ComponentType<{ context: Context }>) {
  return function ContextLoaderWrapper(props: Record<string, unknown>) {
    const [context, setContext] = useState<Context | null>(null);
    // State transition: init -> loading -> done
    const [status, setStatus] = useState("init");

    useEffect(() => {
      if (status !== "init") return;
      setStatus("loading");
      void (async () => {
        // TODO: /api/context is called 4 times on start up
        const { data } = await axios.get<Context>("/api/context");
        // Utility to add extra wait for development purpose
        // await new Promise((resolve) => setTimeout(resolve, 3000));
        setContext(data);
        setStatus("done");
      })();
    }, [status]);

    if (status !== "done" || !context) {
      return (
        <div className="vh-100 d-flex align-items-center justify-content-center">
          <Spinner color="primary" type="grow">
            Loading...
          </Spinner>
        </div>
      );
    }
    return <WrappedComponent context={context} {...props} />;
  };
}

export default ContextLoader;
