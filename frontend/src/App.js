import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
// (We will create these components shortly)
import Home from './pages/Home';
import StudentDashboard from './student/StudentDashboard';
import AdminDashboard from './admin/AdminDashboard';
import PublicVerification from './verification/PublicVerification';

import './styles/index.css';
import './styles/animations.css';
import './styles/dashboard.css';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/student/*" element={<StudentDashboard />} />
            <Route path="/admin/*" element={<AdminDashboard />} />
            <Route path="/verify" element={<PublicVerification />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
