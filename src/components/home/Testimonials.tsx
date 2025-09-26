import React, { useState, useEffect } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

const Testimonials: React.FC = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      id: 1,
      name: 'Sarah Chen',
      role: 'Product Manager',
      company: 'Google',
      avatar: 'SC',
      rating: 5,
      text: "Flowniq transformed how I plan my learning goals. The AI-generated roadmaps are incredibly detailed and practical. I've completed 3 major skill upgrades this year using their platform!",
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 2,
      name: 'Mike Rodriguez',
      role: 'Travel Blogger',
      company: 'Wanderlust Media',
      avatar: 'MR',
      rating: 5,
      text: "The travel planning feature is amazing! It created a perfect 10-day itinerary for my Japan trip with all the details I needed. Saved me weeks of research and planning time.",
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 3,
      name: 'Alex Thompson',
      role: 'Fitness Coach',
      company: 'FitLife Studio',
      avatar: 'AT',
      rating: 5,
      text: "I use Flowniq to create workout plans for my clients. The visual roadmaps make it easy for them to track progress and stay motivated. It's been a game changer for my business!",
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 4,
      name: 'Emily Davis',
      role: 'Software Engineer',
      company: 'Microsoft',
      avatar: 'ED',
      rating: 5,
      text: "As a developer, I appreciate how Flowniq breaks down complex learning paths into manageable steps. The AI suggestions are spot-on and the progress tracking keeps me accountable.",
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 5,
      name: 'David Kim',
      role: 'Startup Founder',
      company: 'TechVenture',
      avatar: 'DK',
      rating: 5,
      text: "Building a startup is overwhelming, but Flowniq helped me create a clear roadmap from idea to launch. The project planning features are incredibly comprehensive and intuitive.",
      color: 'from-indigo-500 to-purple-500'
    },
    {
      id: 6,
      name: 'Lisa Wang',
      role: 'Marketing Director',
      company: 'Creative Agency',
      avatar: 'LW',
      rating: 5,
      text: "The team collaboration features are fantastic. We use Flowniq to plan our marketing campaigns and everyone can see their role in the bigger picture. Highly recommended!",
      color: 'from-teal-500 to-blue-500'
    }
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    const interval = setInterval(nextTestimonial, 6000);
    return () => clearInterval(interval);
  }, []);

  const getVisibleTestimonials = () => {
    const visible = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentTestimonial + i) % testimonials.length;
      visible.push(testimonials[index]);
    }
    return visible;
  };

  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            What Our{' '}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Users Say
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of satisfied users who've transformed their goals into reality
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={prevTestimonial}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:shadow-xl transition-all duration-300 hover:scale-110"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          <button
            onClick={nextTestimonial}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:shadow-xl transition-all duration-300 hover:scale-110"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>

          {/* Testimonials Grid */}
          <div className="mx-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {getVisibleTestimonials().map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className={`relative bg-white rounded-3xl p-8 shadow-lg border border-gray-100 transition-all duration-500 ${
                    index === 1 ? 'scale-105 shadow-2xl' : 'hover:scale-105 hover:shadow-xl'
                  }`}
                >
                  {/* Quote Icon */}
                  <div className="absolute -top-4 left-8">
                    <div className={`w-8 h-8 bg-gradient-to-r ${testimonial.color} rounded-full flex items-center justify-center`}>
                      <Quote className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>

                  {/* Testimonial Text */}
                  <p className="text-gray-700 leading-relaxed mb-6 italic">
                    "{testimonial.text}"
                  </p>

                  {/* User Info */}
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${testimonial.color} rounded-full flex items-center justify-center`}>
                      <span className="text-white font-bold text-sm">{testimonial.avatar}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                      <p className="text-sm text-gray-500">{testimonial.company}</p>
                    </div>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute top-4 right-4 w-2 h-2 bg-gray-200 rounded-full"></div>
                  <div className="absolute bottom-4 right-6 w-1 h-1 bg-gray-300 rounded-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="flex justify-center mt-12 space-x-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentTestimonial(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentTestimonial === index
                  ? 'bg-purple-500 scale-125'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-16 pt-16 border-t border-gray-200">
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">4.9/5</div>
            <div className="text-gray-600">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">10K+</div>
            <div className="text-gray-600">Happy Users</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">50K+</div>
            <div className="text-gray-600">Roadmaps Created</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-orange-600 mb-2">95%</div>
            <div className="text-gray-600">Success Rate</div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex justify-center items-center space-x-8 mt-16 opacity-60">
          <div className="text-gray-400 font-semibold">Trusted by teams at:</div>
          {['Google', 'Microsoft', 'Apple', 'Amazon', 'Meta'].map((company) => (
            <div key={company} className="text-gray-400 font-medium text-lg">
              {company}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;