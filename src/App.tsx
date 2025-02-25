import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

import Search from './components/Search';

const App: React.FC = () => {
  return (
    <Router>

    <div className="font-sans">
      <Search />
    </div>
    </Router>
  );
};

export default App;
