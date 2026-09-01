import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import PageTransition from './components/PageTransition';

import Home from './pages/Home';
import Processing from './pages/Processing';
import Data from './pages/Data';
import ReviewDetail from './pages/ReviewDetail';
import Analytics from './pages/Analytics';
import Highlights from './pages/Highlights';
import History from './pages/History';
import About from './pages/About';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

function AppContent() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="app-shell" data-home-page={isHomePage}>
      {!isHomePage && <Sidebar />}
      <main className="main-content" id="main-content" tabIndex={-1}>
        <PageTransition>
          <Routes>
            <Route path="/"           element={<Home />} />
            <Route path="/processing"  element={<Processing />} />
            <Route path="/data"        element={<Data />} />
            <Route path="/data/:id"    element={<ReviewDetail />} />
            <Route path="/analytics"   element={<Analytics />} />
            <Route path="/highlights"  element={<Highlights />} />
            <Route path="/history"     element={<History />} />
            <Route path="/about"       element={<About />} />
            <Route path="/settings"    element={<Settings />} />
            <Route path="*"            element={<NotFound />} />
          </Routes>
        </PageTransition>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppProvider>
          <a className="skip-link" href="#main-content">Skip to content</a>
          <AppContent />
        </AppProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

