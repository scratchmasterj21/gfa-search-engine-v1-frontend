import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';

import Search from './components/Search';

const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <div className="font-sans">
          <Search />
        </div>
      </ThemeProvider>
    </Router>
  );
};

export default App;
