'use client';

import React from 'react';

interface AnimateInProps {
  children: React.ReactNode;
  className?: string;
  // Kept for backward compatibility but not used
  delay?: number;
  direction?: 'up' | 'left';
}

export function AnimateIn({ 
  children, 
  className = '' 
}: AnimateInProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function StaggerContainer({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string 
}) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function StaggerItem({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string 
}) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}
