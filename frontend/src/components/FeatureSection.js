import React from 'react';
import { FaLock, FaBolt, FaGlobe, FaCertificate } from 'react-icons/fa';

const FeatureSection = () => {
  const features = [
    {
      icon: <FaLock className="text-3xl text-blue-600" />,
      title: 'Cryptographic Security',
      description: 'All certificates are hashed and secured cryptographically, making tampering computationally impossible.'
    },
    {
      icon: <FaBolt className="text-3xl text-yellow-500" />,
      title: 'Real-Time Verification',
      description: 'Companies can verify student credentials within seconds. No more tedious manual checks.'
    },
    {
      icon: <FaGlobe className="text-3xl text-green-500" />,
      title: 'Global Access',
      description: 'Access the portal from anywhere globally, with 99.9% uptime and redundant data backups.'
    },
    {
      icon: <FaCertificate className="text-3xl text-purple-600" />,
      title: 'Instant Issuance',
      description: 'Universities can bulk-issue secure digital certificates straight into the students\' portal.'
    }
  ];

  return (
    <section className="py-24 bg-gray-50 border-t border-gray-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Enterprise-Grade Features</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Built for modern universities and forward-thinking companies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="glass-card p-6 border-transparent hover:border-blue-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
