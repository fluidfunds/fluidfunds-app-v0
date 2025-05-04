import Link from 'next/link';
import { motion } from 'framer-motion';
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/app/utils/styles';

function BackNavigation({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'mx-auto mb-6 flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8',
        className
      )}
    >
      <Link
        href={href}
        className="group inline-flex items-center gap-2 text-fluid-white-70 transition-colors hover:text-fluid-white"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        <span>Back to {label}</span>
      </Link>
    </motion.div>
  );
}

export default BackNavigation;
