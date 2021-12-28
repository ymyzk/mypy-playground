import React from 'react';
import { render } from 'react-dom';

import App from './App';
import ContextLoader from './ContextLoader';

const root = document.getElementById('root');
const AppWithContext = ContextLoader(App);
const load = () => render(<AppWithContext />, root);

load();
