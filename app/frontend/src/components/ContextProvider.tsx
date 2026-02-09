import axios from "axios";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Spinner } from "reactstrap";
import { AppContext } from "./context";
import type { Context } from "./types";

interface Props {
  children: ReactNode;
}

export default function ContextProvider({ children }: Props) {
  const [context, setContext] = useState<Context | null>(null);
  const fetchStarted = useRef(false);

  useEffect(() => {
    if (fetchStarted.current) return;
    fetchStarted.current = true;
    void (async () => {
      const { data } = await axios.get<Context>("/api/context");
      setContext(data);
    })();
  }, []);

  if (!context) {
    return (
      <div className="vh-100 d-flex align-items-center justify-content-center">
        <Spinner color="primary" type="grow">
          Loading...
        </Spinner>
      </div>
    );
  }

  return <AppContext value={context}>{children}</AppContext>;
}
