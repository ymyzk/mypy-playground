import type { NextPage } from 'next';

import Head from 'next/head';

import App from '../components/App';
import ContextLoader from '../components/ContextLoader';

const Home: NextPage = () => {
  const AppWithContext = ContextLoader(App);
  return (
    <div>
      <Head>
        <title>
          mypy Playground
        </title>
        <meta name="description" content="The mypy Playground is a web service that receives a Python program with type hints, runs mypy inside a sandbox, then returns the output." />
      </Head>
      <AppWithContext />
    </div>
  )
}

export default Home
