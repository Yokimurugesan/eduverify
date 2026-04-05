import React from 'react';
import { Link } from 'react-router-dom';
import { FaShieldAlt } from 'react-icons/fa';

const Navbar = () => {
  return (
    <nav className="bg-white bg-opacity-90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm transition-all duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors duration-300 text-blue-600">
              <FaShieldAlt className="text-2xl" />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
              EduVerify
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300">
              Home
            </Link>
            <Link to="/verify" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300">
              Public Verification
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <Link to="/student" className="hidden sm:inline-flex text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300 px-3 py-2">
              Student Login
            </Link>
            <Link to="/admin" className="btn-primary text-sm px-4 py-2">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
