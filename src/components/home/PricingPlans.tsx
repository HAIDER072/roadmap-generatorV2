import React, { useState } from 'react';
import { Check, Star, Zap, Crown, ArrowRight } from 'lucide-react';

const PricingPlans: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started',
      monthlyPrice: 0,
      annualPrice: 0,
      icon: Star,
      color: 'from-gray-500 to-gray-600',
      bgColor: 'from-gray-50 to-gray-100',
      popular: false,
      features: [
        '5 roadmaps per month',
        'Basic AI generation',
        'Standard templates',
        'Progress tracking',
        'Community support',
        'Export to PDF'
      ],
      limitations: [
        'Limited customization',
        'No integrations',
        'Basic analytics'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For serious goal achievers',
      monthlyPrice: 19,
      annualPrice: 15,
      icon: Zap,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50',
      popular: true,
      features: [
        'Unlimited roadmaps',
        'Advanced AI generation',
        'Premium templates',
        'Advanced progress tracking',
        'Priority support',
        'All export formats',
        'Team collaboration',
        'Basic integrations',
        'Custom branding',
        'Analytics dashboard'
      ],
      limitations: []
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For teams and organizations',
      monthlyPrice: 49,
      annualPrice: 39,
      icon: Crown,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
      popular: false,
      features: [
        'Everything in Pro',
        'Unlimited team members',
        'Advanced integrations',
        'Custom AI training',
        'Dedicated support',
        'SSO authentication',
        'Advanced analytics',
        'API access',
        'White-label solution',
        'Custom workflows'
      ],
      limitations: []
    }
  ];

  const getPrice = (plan: typeof plans[0]) => {
    return isAnnual ? plan.annualPrice : plan.monthlyPrice;
  };

  const getSavings = (plan: typeof plans[0]) => {
    if (plan.monthlyPrice === 0) return 0;
    return Math.round(((plan.monthlyPrice * 12 - plan.annualPrice * 12) / (plan.monthlyPrice * 12)) * 100);
  };

  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Simple{' '}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Choose the perfect plan for your goals. Start free and upgrade as you grow.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4">
            <span className={`font-medium ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${
                isAnnual ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                  isAnnual ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
              Annual
            </span>
            {isAnnual && (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                Save up to 20%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isHovered = hoveredPlan === plan.id;
            const price = getPrice(plan);
            const savings = getSavings(plan);
            
            return (
              <div
                key={plan.id}
                onMouseEnter={() => setHoveredPlan(plan.id)}
                onMouseLeave={() => setHoveredPlan(null)}
                className={`relative p-8 bg-white rounded-3xl border-2 transition-all duration-500 ${
                  plan.popular
                    ? 'border-purple-500 shadow-2xl scale-105'
                    : isHovered
                    ? 'border-gray-300 shadow-2xl scale-105 -translate-y-2'
                    : 'border-gray-200 shadow-lg hover:shadow-xl'
                }`}
                style={{
                  background: isHovered || plan.popular
                    ? `linear-gradient(135deg, ${plan.bgColor.split(' ')[1]}, ${plan.bgColor.split(' ')[3]})`
                    : 'white'
                }}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-semibold shadow-lg">
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <div 
                    className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${plan.color} flex items-center justify-center shadow-lg transition-all duration-500 ${
                      isHovered || plan.popular ? 'scale-110 rotate-3' : ''
                    }`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                {/* Pricing */}
                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-gray-900">${price}</span>
                    <span className="text-gray-600 ml-2">
                      {price === 0 ? 'forever' : `/${isAnnual ? 'year' : 'month'}`}
                    </span>
                  </div>
                  
                  {isAnnual && savings > 0 && (
                    <div className="mt-2">
                      <span className="text-green-600 font-medium text-sm">
                        Save {savings}% annually
                      </span>
                    </div>
                  )}
                  
                  {!isAnnual && plan.monthlyPrice > 0 && (
                    <div className="mt-2">
                      <span className="text-gray-500 text-sm">
                        ${plan.annualPrice * 12}/year if paid annually
                      </span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center flex-shrink-0`}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                  
                  {plan.limitations.map((limitation, limitationIndex) => (
                    <div key={limitationIndex} className="flex items-center space-x-3 opacity-60">
                      <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-0.5 bg-white rounded-full"></div>
                      </div>
                      <span className="text-gray-500 line-through">{limitation}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl'
                      : isHovered
                      ? `bg-gradient-to-r ${plan.color} text-white shadow-lg`
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span>{plan.id === 'free' ? 'Get Started Free' : 'Start Free Trial'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </button>

                {/* Additional Info */}
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-500">
                    {plan.id === 'free' 
                      ? 'No credit card required'
                      : '14-day free trial • No credit card required'
                    }
                  </p>
                </div>

                {/* Glow Effect */}
                {(isHovered || plan.popular) && (
                  <div 
                    className="absolute inset-0 rounded-3xl opacity-20 blur-xl transition-opacity duration-500"
                    style={{
                      background: `linear-gradient(135deg, ${plan.color.split(' ')[1]}, ${plan.color.split(' ')[3]})`
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-2">Can I change plans anytime?</h4>
              <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>
            
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-2">Is there a free trial?</h4>
              <p className="text-gray-600">All paid plans come with a 14-day free trial. No credit card required to start.</p>
            </div>
            
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h4>
              <p className="text-gray-600">We accept all major credit cards, PayPal, and bank transfers for enterprise plans.</p>
            </div>
            
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-2">Do you offer refunds?</h4>
              <p className="text-gray-600">Yes, we offer a 30-day money-back guarantee for all paid plans.</p>
            </div>
          </div>
        </div>

        {/* Enterprise CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl p-12 text-white">
            <h3 className="text-3xl font-bold mb-4">Need Something Custom?</h3>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Contact our sales team for custom enterprise solutions, volume discounts, and dedicated support.
            </p>
            <button className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-semibold text-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingPlans;