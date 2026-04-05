import React from 'react';
import HeroSection from '../components/HeroSection';
import WorkflowDemo from '../components/WorkflowDemo';
import FeatureSection from '../components/FeatureSection';

const Home = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <HeroSection />
      <WorkflowDemo />
      <FeatureSection />
    </div>
  );
};

export default Home;
