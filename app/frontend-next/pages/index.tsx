import type { NextPage } from 'next'

import App from '../components/App';
import ContextLoader from '../components/ContextLoader';

const Home: NextPage = () => {
  const AppWithContext = ContextLoader(App);
  return (
    <div>
      <AppWithContext />
    </div>
  )
}

export default Home
