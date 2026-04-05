import React from 'react';
import { FaCloudUploadAlt, FaUserCheck, FaQrcode, FaBuilding } from 'react-icons/fa';

const WorkflowDemo = () => {
  const steps = [
    {
      id: 1,
      title: "Student uploads certificate",
      icon: <FaCloudUploadAlt className="text-4xl text-blue-500 mb-4" />,
      delay: "animation-delay-100"
    },
    {
      id: 2,
      title: "Admin verifies the document",
      icon: <FaUserCheck className="text-4xl text-indigo-500 mb-4" />,
      delay: "animation-delay-300"
    },
    {
      id: 3,
      title: "QR code is generated",
      icon: <FaQrcode className="text-4xl text-purple-500 mb-4" />,
      delay: "animation-delay-500"
    },
    {
      id: 4,
      title: "Company scans & verifies",
      icon: <FaBuilding className="text-4xl text-pink-500 mb-4" />,
      delay: "animation-delay-700"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A seamless, cryptographically secure process from upload to verification.
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-center items-center gap-8 relative">
          {/* Connector Line for Desktop */}
          <div className="hidden md:block absolute top-1/2 left-10 right-10 h-1 bg-gradient-to-r from-blue-200 via-indigo-200 to-pink-200 -z-10 transform -translate-y-1/2 rounded"></div>

          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`glass-card p-8 w-full md:w-64 text-center transform hover:-translate-y-2 transition-all duration-300 opacity-0 animate-[slideInRight_0.8s_ease-out_forwards]`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center shadow-sm mb-6 relative">
                {step.icon}
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold border-2 border-white">
                  {step.id}
                </div>
              </div>
              <h3 className="font-semibold text-gray-800 text-lg">
                {step.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkflowDemo;
