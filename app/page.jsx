'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  CreditCard, 
  Smartphone, 
  Lock, 
  TrendingUp, 
  ArrowRight,
  CheckCircle,
  Users,
  Globe,
  Menu,
  X
} from 'lucide-react';
import Button from '../components/Button';

const HomePage = () => {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visibleElements, setVisibleElements] = useState(new Set());

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleElements((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const handleGetStarted = () => {
    // These checks will be handled by Next.js middleware or higher-level layouts
    router.push('/login');
  };

  const features = [
    {
      icon: Shield,
      title: 'Bank-Level Security',
      description: 'Your accounts are protected with 256-bit encryption and multi-factor authentication.',
    },
    {
      icon: CreditCard,
      title: 'Easy Money Management',
      description: 'Transfer funds, pay bills, and manage your accounts all in one place.',
    },
    {
      icon: Smartphone,
      title: 'Mobile Banking',
      description: 'Access your accounts anytime, anywhere with our secure mobile platform.',
    },
    {
      icon: TrendingUp,
      title: 'Financial Insights',
      description: 'Track your spending, view analytics, and make informed financial decisions.',
    },
    {
      icon: Lock,
      title: 'Secure Transactions',
      description: 'Every transaction is monitored and protected with advanced fraud detection.',
    },
    {
      icon: Users,
      title: '24/7 Support',
      description: 'Get help whenever you need it with our round-the-clock customer service.',
    },
  ];

  const benefits = [
    'No monthly maintenance fees',
    'Free online and mobile banking',
    'Instant transaction notifications',
    'FDIC insured up to $250,000',
    'Access to thousands of ATMs nationwide',
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Navigation Bar */}
      <nav className={`bg-white border-b border-neutral-200 sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'shadow-md' : 'shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img
                src="/logo.png"
                alt="Bank of America"
                className="h-8 sm:h-10 w-auto flex-shrink-0 object-contain"
                style={{
                  mixBlendMode: 'multiply',
                  filter: 'contrast(1.2) brightness(0.95)',
                  backgroundColor: 'transparent',
                }}
              />
              <div className="text-primary-navy font-bold text-sm sm:text-lg md:text-xl">
                Bank of America
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/login"
                className="text-primary-blue hover:text-primary-navy font-medium transition-colors px-3 py-2"
              >
                Sign In
              </Link>
              <Button onClick={handleGetStarted} className="px-5 py-2.5 text-sm">
                Get Started
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-primary-navy hover:bg-accent-soft rounded-bank transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-neutral-200 py-4 space-y-3 animate-slide-up">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-left text-primary-blue hover:text-primary-navy font-medium px-3 py-2 transition-colors"
              >
                Sign In
              </Link>
              <Button 
                onClick={() => {
                  handleGetStarted();
                  setMobileMenuOpen(false);
                }} 
                className="w-full justify-center px-5 py-2.5 text-sm"
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-navy via-primary-blue to-primary-navy text-white py-16 sm:py-20 lg:py-28 overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            animation: 'gradient 20s linear infinite',
            backgroundSize: '60px 60px',
          }}></div>
        </div>
        
        {/* Animated Floating Orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full opacity-10 blur-3xl animate-float"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-white rounded-full opacity-10 blur-3xl animate-float-delayed"></div>
          <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-white rounded-full opacity-10 blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-40 right-1/3 w-80 h-80 bg-white rounded-full opacity-10 blur-3xl animate-float-delayed" style={{ animationDelay: '3s' }}></div>
        </div>

        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'shimmer 8s linear infinite',
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 
              id="hero-title"
              data-animate
              className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight transition-all duration-1000 ${
                visibleElements.has('hero-title') ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'
              }`}
            >
              Banking Made Simple, Secure, and Smart
            </h1>
            <p 
              id="hero-subtitle"
              data-animate
              className={`text-base sm:text-lg md:text-xl lg:text-2xl text-white text-opacity-90 mb-6 sm:mb-8 px-4 transition-all duration-1000 delay-200 ${
                visibleElements.has('hero-subtitle') ? 'animate-fade-in opacity-100' : 'opacity-0'
              }`}
            >
              Manage your finances with confidence. Bank of America offers the tools and security you need to take control of your financial future.
            </p>
            <div 
              id="hero-buttons"
              data-animate
              className={`flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4 transition-all duration-1000 delay-300 ${
                visibleElements.has('hero-buttons') ? 'animate-scale-in opacity-100' : 'opacity-0 scale-90'
              }`}
            >
              <Button
                onClick={handleGetStarted}
                variant="secondary"
                className="!bg-white !text-primary-navy hover:!bg-neutral-100 px-6 py-3 sm:px-7 sm:py-3.5 shadow-bank-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto group border-0"
              >
                Sign In to Your Account
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Link
                href="/login"
                className="text-white border-2 border-white hover:bg-white hover:text-primary-navy font-medium px-6 py-3 sm:px-7 sm:py-3.5 rounded-bank transition-all duration-300 w-full sm:w-auto transform hover:scale-105"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            id="features-header"
            data-animate
            className={`text-center mb-10 sm:mb-12 lg:mb-16 transition-all duration-1000 ${
              visibleElements.has('features-header') ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'
            }`}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-navy mb-3 sm:mb-4">
              Why Choose Bank of America?
            </h2>
            <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto px-4">
              Experience banking that puts you first with innovative features and trusted security.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const elementId = `feature-${index}`;
              return (
                <div
                  key={index}
                  id={elementId}
                  data-animate
                  className={`group bg-neutral-50 rounded-card p-5 sm:p-6 hover:shadow-bank-lg transition-all duration-500 transform hover:-translate-y-2 hover:bg-white cursor-pointer ${
                    visibleElements.has(elementId) 
                      ? 'animate-scale-in opacity-100' 
                      : 'opacity-0 scale-90'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 bg-primary-blue bg-opacity-10 rounded-bank flex items-center justify-center mb-4 group-hover:bg-primary-blue group-hover:bg-opacity-20 transition-all duration-300 group-hover:rotate-6">
                    <Icon className="w-6 h-6 text-primary-blue group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-primary-navy mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-accent-soft to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div 
              id="benefits-content"
              data-animate
              className={`order-2 lg:order-1 transition-all duration-1000 ${
                visibleElements.has('benefits-content') 
                  ? 'animate-slide-in-left opacity-100' 
                  : 'opacity-0 -translate-x-10'
              }`}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-navy mb-4 sm:mb-6">
                Everything You Need for Modern Banking
              </h2>
              <p className="text-base sm:text-lg text-neutral-600 mb-6 sm:mb-8">
                Join millions of customers who trust Bank of America for their banking needs. We offer comprehensive financial services designed to help you achieve your goals.
              </p>
              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                {benefits.map((benefit, index) => {
                  const benefitId = `benefit-${index}`;
                  return (
                    <li 
                      key={index}
                      id={benefitId}
                      data-animate
                      className={`flex items-start space-x-3 transition-all duration-500 ${
                        visibleElements.has(benefitId) 
                          ? 'animate-slide-up opacity-100' 
                          : 'opacity-0 translate-y-5'
                      }`}
                      style={{ transitionDelay: `${index * 100}ms` }}
                    >
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0 mt-0.5 animate-pulse-slow" />
                      <span className="text-neutral-700 text-base sm:text-lg">{benefit}</span>
                    </li>
                  );
                })}
              </ul>
              <Button
                onClick={handleGetStarted}
                className="px-6 py-3 sm:px-7 sm:py-3.5 transform hover:scale-105 transition-all duration-300 group"
              >
                Get Started Today
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            <div 
              id="benefits-card"
              data-animate
              className={`order-1 lg:order-2 bg-white rounded-card p-6 sm:p-8 shadow-bank-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 ${
                visibleElements.has('benefits-card') 
                  ? 'animate-slide-in-right opacity-100' 
                  : 'opacity-0 translate-x-10'
              }`}
            >
              <div className="space-y-5 sm:space-y-6">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-navy to-primary-blue text-white rounded-bank">
                  <div>
                    <p className="text-xs sm:text-sm text-white text-opacity-80 mb-1">Total Balance</p>
                    <p className="text-xl sm:text-2xl font-bold">$125,430.50</p>
                  </div>
                  <CreditCard className="w-7 h-7 sm:w-8 sm:h-8 text-white text-opacity-80" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-accent-soft rounded-bank">
                    <span className="text-sm sm:text-base text-neutral-600">Recent Transactions</span>
                    <span className="text-xs sm:text-sm text-neutral-500">View All</span>
                  </div>
                  <div className="space-y-2">
                    {['Salary Deposit', 'Bill Payment', 'Transfer'].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2 text-xs sm:text-sm hover:bg-accent-soft rounded-bank transition-colors">
                        <span className="text-neutral-600">{item}</span>
                        <span className="text-green-600 font-medium">+$3,500.00</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            id="security-section"
            data-animate
            className={`bg-gradient-to-br from-primary-navy to-primary-blue rounded-card p-8 sm:p-10 lg:p-12 text-white text-center relative overflow-hidden transition-all duration-1000 ${
              visibleElements.has('security-section') 
                ? 'animate-scale-in opacity-100' 
                : 'opacity-0 scale-95'
            }`}
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl animate-float"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 translate-y-1/2 blur-3xl animate-float-delayed"></div>
            </div>
            <div className="relative">
              <Lock className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 text-white text-opacity-90 animate-pulse-slow" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                Your Security is Our Priority
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-white text-opacity-90 max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
                We use industry-leading security measures including 256-bit encryption, multi-factor authentication, and real-time fraud monitoring to keep your accounts safe.
              </p>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm">
                {['FDIC Insured', '256-bit Encryption', 'Multi-Factor Auth', '24/7 Fraud Monitoring'].map((item, index) => {
                  const badgeId = `security-badge-${index}`;
                  return (
                    <div
                      key={index}
                      id={badgeId}
                      data-animate
                      className={`flex items-center space-x-2 bg-white bg-opacity-10 px-4 py-2 rounded-bank backdrop-blur-sm transition-all duration-500 hover:bg-opacity-20 hover:scale-105 cursor-pointer ${
                        visibleElements.has(badgeId) 
                          ? 'animate-scale-in opacity-100' 
                          : 'opacity-0 scale-90'
                      }`}
                      style={{ transitionDelay: `${index * 150}ms` }}
                    >
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>{item}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div
            id="cta-section"
            data-animate
            className={`transition-all duration-1000 ${
              visibleElements.has('cta-section') 
                ? 'animate-slide-up opacity-100' 
                : 'opacity-0 translate-y-10'
            }`}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-navy mb-3 sm:mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-base sm:text-lg text-neutral-600 mb-6 sm:mb-8">
              Sign in to access your accounts or create a new account to begin your banking journey with us.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button
                onClick={handleGetStarted}
                className="px-6 py-3 sm:px-7 sm:py-3.5 transform hover:scale-105 transition-all duration-300 w-full sm:w-auto group"
              >
                Sign In Now
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Link
                href="/login"
                className="text-primary-blue font-medium px-6 py-3 sm:px-7 sm:py-3.5 border-2 border-primary-blue rounded-bank hover:bg-primary-blue hover:text-white transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-navy text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <img
                  src="/logo.png"
                  alt="Bank of America"
                  className="h-7 sm:h-8 w-auto object-contain"
                  style={{
                    mixBlendMode: 'screen',
                    filter: 'brightness(1.2) contrast(0.9)',
                  }}
                />
                <span className="font-bold text-base sm:text-lg">Bank of America</span>
              </div>
              <p className="text-white text-opacity-70 text-xs sm:text-sm">
                Trusted banking solutions for over 200 years.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Banking</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-white text-opacity-70">
                <li><a href="#" className="hover:text-white transition-colors inline-block">Checking</a></li>
                <li><a href="#" className="hover:text-white transition-colors inline-block">Savings</a></li>
                <li><a href="#" className="hover:text-white transition-colors inline-block">Credit Cards</a></li>
                <li><a href="#" className="hover:text-white transition-colors inline-block">Loans</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Support</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-white text-opacity-70">
                <li><a href="#" className="hover:text-white transition-colors inline-block">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors inline-block">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors inline-block">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors inline-block">FAQs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">About</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-white text-opacity-70">
                <li><a href="#" className="hover:text-white transition-colors inline-block">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors inline-block">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors inline-block">News</a></li>
                <li><a href="#" className="hover:text-white transition-colors inline-block">Investor Relations</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white border-opacity-20 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center text-xs sm:text-sm text-white text-opacity-70">
            <p className="mb-3 md:mb-0">© 2024 Bank of America. All rights reserved.</p>
            <div className="flex flex-wrap gap-4 sm:gap-6 justify-center md:justify-end">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
