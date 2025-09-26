import React from 'react';
import Hero from '../components/home/Hero';
import HowItWorks from '../components/home/HowItWorks';
import FeaturesGrid from '../components/home/FeaturesGrid';
import TemplatesCarousel from '../components/home/TemplatesCarousel';
import DemoPreview from '../components/home/DemoPreview';
import Testimonials from '../components/home/Testimonials';
import Integrations from '../components/home/Integrations';
import PricingPlans from '../components/home/PricingPlans';
import CallToActionBanner from '../components/home/CallToActionBanner';
import Footer from '../components/home/Footer';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen pt-[70px]">
      <Hero />
      <HowItWorks />
      <FeaturesGrid />
      <TemplatesCarousel />
      <DemoPreview />
      <Testimonials />
      <Integrations />
      <PricingPlans />
      <CallToActionBanner />
      <Footer />
    </div>
  );
};

export default HomePage;