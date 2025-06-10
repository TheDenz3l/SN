import React from 'react';
import { Link } from 'react-router-dom';
import {
  SparklesIcon,
  ClockIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const LandingPage: React.FC = () => {
  const features = [
    {
      name: 'AI-Powered Generation',
      description: 'Generate professional notes that match your unique writing style using advanced AI technology.',
      icon: SparklesIcon,
    },
    {
      name: 'Time-Saving Efficiency',
      description: 'Reduce documentation time by up to 80% while maintaining quality and compliance.',
      icon: ClockIcon,
    },
    {
      name: 'HIPAA Compliant',
      description: 'Built with privacy and security in mind. Your data is encrypted and protected.',
      icon: ShieldCheckIcon,
    },
  ];

  const pricingTiers = [
    {
      name: 'Free',
      price: '$0',
      description: 'Perfect for trying out SwiftNotes',
      features: [
        '10 AI generations per hour',
        '25 generations per day',
        'Basic note templates',
        'Email support',
      ],
      cta: 'Get Started Free',
      href: '/register',
      popular: false,
    },
    {
      name: 'Professional',
      price: '$29',
      description: 'For individual professionals',
      features: [
        '100 AI generations per hour',
        '500 generations per day',
        'Priority queue processing',
        'Advanced templates',
        'Export functionality',
        'Priority support',
      ],
      cta: 'Start Free Trial',
      href: '/register',
      popular: true,
    },
    {
      name: 'Premium',
      price: '$79',
      description: 'For teams and organizations',
      features: [
        'Unlimited AI generations',
        'Custom templates',
        'Advanced analytics',
        'Team management',
        'API access',
        'Dedicated support',
      ],
      cta: 'Contact Sales',
      href: '/register',
      popular: false,
    },
  ];

  return (
    <div className="bg-white">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <Link to="/" className="flex items-center -m-1.5 p-1.5">
              <img
                src="/assets/logo-transparent.png"
                alt="SwiftNotes Logo"
                className="h-12 w-12 hover:scale-105 transition-transform duration-200"
              />
              <span className="ml-2 text-xl font-bold text-gray-900">SwiftNotes</span>
            </Link>
          </div>
          
          <div className="flex lg:flex-1 lg:justify-end space-x-4">
            <Link
              to="/login"
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="btn-primary"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary-200 to-secondary-200 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
        
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              AI-Powered Professional Note Generation
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Transform your documentation workflow with SwiftNotes. Generate personalized, 
              professional notes that match your writing style in seconds, not hours.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link to="/register" className="btn-primary text-lg px-6 py-3">
                Start Free Trial
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link to="#demo" className="text-sm font-semibold leading-6 text-gray-900">
                Watch Demo <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary-600">
              Powerful Features
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need for professional documentation
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              SwiftNotes combines cutting-edge AI with healthcare-specific features to 
              streamline your documentation process while maintaining compliance and quality.
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3 lg:gap-y-16">
              {features.map((feature) => (
                <div key={feature.name} className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                      <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600">
                    {feature.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Pricing section */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-base font-semibold leading-7 text-primary-600">Pricing</h2>
            <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Choose the right plan for you
            </p>
          </div>
          
          <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 lg:gap-y-0">
            {pricingTiers.map((tier, tierIdx) => (
              <div
                key={tier.name}
                className={`flex flex-col justify-between rounded-3xl bg-white p-8 ring-1 ring-gray-200 xl:p-10 ${
                  tier.popular ? 'lg:z-10 lg:rounded-b-none' : 'lg:mt-8'
                } ${tierIdx === 0 ? 'lg:rounded-r-none' : ''} ${
                  tierIdx === pricingTiers.length - 1 ? 'lg:rounded-l-none' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-x-4">
                    <h3 className="text-lg font-semibold leading-8 text-gray-900">
                      {tier.name}
                    </h3>
                    {tier.popular && (
                      <p className="rounded-full bg-primary-600/10 px-2.5 py-1 text-xs font-semibold leading-5 text-primary-600">
                        Most popular
                      </p>
                    )}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-gray-600">{tier.description}</p>
                  <p className="mt-6 flex items-baseline gap-x-1">
                    <span className="text-4xl font-bold tracking-tight text-gray-900">
                      {tier.price}
                    </span>
                    <span className="text-sm font-semibold leading-6 text-gray-600">/month</span>
                  </p>
                  <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex gap-x-3">
                        <CheckIcon className="h-6 w-5 flex-none text-primary-600" aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  to={tier.href}
                  className={`mt-8 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    tier.popular
                      ? 'bg-primary-600 text-white shadow-sm hover:bg-primary-500 focus-visible:outline-primary-600'
                      : 'text-primary-600 ring-1 ring-inset ring-primary-200 hover:ring-primary-300'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-primary-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to transform your documentation?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-100">
              Join thousands of healthcare professionals who have already streamlined 
              their workflow with SwiftNotes.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/register"
                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-primary-600 shadow-sm hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Get started for free
              </Link>
              <Link to="/contact" className="text-sm font-semibold leading-6 text-white">
                Contact sales <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <Link to="/privacy" className="text-gray-400 hover:text-gray-500">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-gray-400 hover:text-gray-500">
              Terms of Service
            </Link>
            <Link to="/support" className="text-gray-400 hover:text-gray-500">
              Support
            </Link>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-xs leading-5 text-gray-500">
              &copy; 2025 SwiftNotes. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
