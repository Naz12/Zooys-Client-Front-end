"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from './button';
import { Home, ArrowLeft } from 'lucide-react';

interface PageNavigationProps {
  title?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  backHref?: string;
  homeHref?: string;
}

export default function PageNavigation({
  title,
  showBackButton = true,
  showHomeButton = true,
  backHref = '/',
  homeHref = '/',
}: PageNavigationProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      {/* Navigation Buttons */}
      <div className="flex items-center space-x-4">
        {showBackButton && (
          <Link href={backHref}>
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>
        )}
        
        {showBackButton && showHomeButton && (
          <div className="h-6 w-px bg-border"></div>
        )}
        
        {showHomeButton && (
          <Link href={homeHref}>
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Page Title (if provided) */}
      {title && (
        <div className="text-sm text-muted-foreground">
          {title}
        </div>
      )}
    </div>
  );
}




