import type { NextPage } from "next";

import Head from "next/head";

import App from "../components/App";
import ContextLoader from "../components/ContextLoader";

const Home: NextPage = () => {
  const AppWithContext = ContextLoader(App);
  return (
    <div>
      <Head>
        <title>mypy Playground</title>
        <meta
          name="description"
          content="The mypy Playground is a web service that receives a Python program with type hints, runs mypy inside a sandbox, then returns the output."
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />
      </Head>
      <AppWithContext />
    </div>
  );
};

export default Home;
