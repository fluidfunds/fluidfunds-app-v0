'use client';
import { motion } from 'framer-motion';
import { StreamIcon, SecurityIcon, InvestIcon } from './icons';

const Benefits = () => {
  const benefits = [
    {
      icon: <SecurityIcon />,
      title: 'Secure & Transparent',
      description:
        'Trade with confidence using our rug-proof smart contracts and whitelisted tokens.',
    },
    {
      icon: <InvestIcon />,
      title: 'Professional Management',
      description:
        'Access vetted fund managers with proven track records and transparent strategies.',
    },
    {
      icon: <StreamIcon />,
      title: 'Real-Time Performance',
      description: 'Monitor your investments with live tracking and detailed analytics.',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 80 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      className="w-full"
    >
      <h2 className="mb-12 text-center text-[40px] font-medium">Why Choose FluidFunds?</h2>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {benefits.map((benefit, index) => (
          <div
            key={index}
            className="flex flex-col items-center rounded-2xl border border-fluid-white-10 bg-fluid-white-6 p-6 text-center transition-colors hover:bg-fluid-white-10"
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-fluid-primary/10 text-fluid-primary">
              {benefit.icon}
            </div>
            <h3 className="mb-3 text-xl font-medium">{benefit.title}</h3>
            <p className="text-fluid-white-70">{benefit.description}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default Benefits;
