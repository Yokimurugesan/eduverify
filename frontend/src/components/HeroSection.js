import React from 'react';
import { Link } from 'react-router-dom';
import { FaUserGraduate, FaUserShield } from 'react-icons/fa';

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gray-50 pt-20 pb-32">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 opacity-50"></div>
      
      <div className="container mx-auto px-4 relative z-10 text-center">
        {/* Animated Marquee Title */}
        <div className="marquee-container mb-6 py-4">
          <h1 className="marquee-content text-4xl md:text-6xl font-extrabold tracking-tight">
            <span className="text-gradient">Academic Data Integrity and Verification Platform</span>
          </h1>
        </div>

        <p className="mt-4 max-w-3xl mx-auto text-xl text-gray-600 mb-10 animate-fade-in-up">
          Secure platform for verifying academic certificates instantly using QR code authentication and cryptographic hashing.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mt-8">
          <Link 
            to="/student"
            className="group flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-full font-bold shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all duration-300 transform hover:scale-105 border border-blue-100"
          >
            <FaUserGraduate className="text-xl group-hover:rotate-12 transition-transform duration-300" />
            Student Portal
          </Link>
          
          <Link 
            to="/admin"
            className="group flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] transition-all duration-300 transform hover:scale-105"
          >
            <FaUserShield className="text-xl group-hover:-rotate-12 transition-transform duration-300" />
            Admin Portal
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
