import React from 'react';
import { FaHeart } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 py-8 mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
        <p>
          &copy; {new Date().getFullYear()} EduVerify. All rights reserved.
        </p>
        <p className="flex items-center mt-4 md:mt-0">
          Made with <FaHeart className="mx-1 text-red-500" /> for Academic Integrity
        </p>
      </div>
    </footer>
  );
};

export default Footer;
