import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Sparkles, Zap, Moon, Sun, LogIn } from 'lucide-react';

const Hero: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [darkMode, setDarkMode] = useState(false);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle system
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      connections: number[];
    }> = [];

    const particleCount = 80;
    const connectionDistance = 120;

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.8 + 0.2,
        connections: []
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update particles
      particles.forEach((particle, i) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Keep particles in bounds
        particle.x = Math.max(0, Math.min(canvas.width, particle.x));
        particle.y = Math.max(0, Math.min(canvas.height, particle.y));

        // Find connections
        particle.connections = [];
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particle.x - particles[j].x;
          const dy = particle.y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            particle.connections.push(j);
          }
        }
      });

      // Draw connections
      particles.forEach((particle, i) => {
        particle.connections.forEach(connectionIndex => {
          const connected = particles[connectionIndex];
          const dx = particle.x - connected.x;
          const dy = particle.y - connected.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const opacity = (1 - distance / connectionDistance) * 0.3;

          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(connected.x, connected.y);
          ctx.strokeStyle = darkMode 
            ? `rgba(139, 92, 246, ${opacity})` 
            : `rgba(99, 102, 241, ${opacity})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      });

      // Draw particles
      particles.forEach(particle => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = darkMode 
          ? `rgba(139, 92, 246, ${particle.opacity})` 
          : `rgba(99, 102, 241, ${particle.opacity})`;
        ctx.fill();

        // Add glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = darkMode ? '#8b5cf6' : '#6366f1';
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [darkMode]);

  return (
    <section className={`relative min-h-[calc(100vh-70px)] flex items-center justify-center overflow-hidden transition-colors duration-500 ${
      darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-white to-indigo-50'
    }`}>
      {/* Animated Background Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
      />

      {/* Dark/Light Mode Toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="absolute top-8 right-8 z-20 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        {darkMode ? (
          <Sun className="w-6 h-6 text-yellow-400" />
        ) : (
          <Moon className="w-6 h-6 text-indigo-600" />
        )}
      </button>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10" style={{ zIndex: 2 }} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" style={{ zIndex: 2 }} />

      {/* Hero Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Floating Icons */}
        <div className="absolute -top-20 -left-20 animate-float">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="absolute -top-10 -right-16 animate-float-delayed">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-2xl">
            <Zap className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Main Headline */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Generate{' '}
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent animate-gradient-x">
              Personalized AI
            </span>
            <br />
            Roadmaps in{' '}
            <span className="relative">
              Seconds
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" />
            </span>
          </h1>
        </div>

        {/* Subheading */}
        <div className="mb-12 animate-fade-in-up animation-delay-200">
          <p className={`text-xl sm:text-2xl lg:text-3xl font-light leading-relaxed max-w-4xl mx-auto ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Transform your goals into clear, visual learning paths with{' '}
            <span className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              AI assistance
            </span>
            . Create personalized roadmaps for learning, travel, projects, and fitness.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16 animate-fade-in-up animation-delay-400">
          <Link
            to="/signup"
            className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold text-lg shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center space-x-2">
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </Link>

          {/* <button className={`group flex items-center space-x-3 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 ${
            darkMode 
              ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20' 
              : 'bg-white/80 text-gray-900 border border-gray-200 hover:bg-white shadow-xl'
          }`}>
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Play className="w-5 h-5 text-white ml-0.5" />
            </div>
            <span>Watch Demo</span>
          </button> */}
          <Link
              to="/login"
              className="inline-flex items-center space-x-3 px-8 py-4 bg-white text-slate-700 rounded-2xl hover:bg-slate-50 transition-all duration-200 hover:scale-105 shadow-lg border border-slate-200 text-lg font-medium group"
            >
              <LogIn className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
              <span>Sign In</span>
            </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 animate-fade-in-up animation-delay-600">
          <div className={`text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              50K+
            </div>
            <div className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Roadmaps Created
            </div>
          </div>
          <div className={`text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              10K+
            </div>
            <div className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Active Users
            </div>
          </div>
          <div className={`text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              95%
            </div>
            <div className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Success Rate
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
        <div className={`w-6 h-10 border-2 rounded-full flex justify-center ${
          darkMode ? 'border-white/30' : 'border-gray-400'
        }`}>
          <div className={`w-1 h-3 rounded-full mt-2 animate-pulse ${
            darkMode ? 'bg-white/50' : 'bg-gray-400'
          }`} />
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-3deg); }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes gradient-x {
          0%, 100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </section>
  );
};

export default Hero;