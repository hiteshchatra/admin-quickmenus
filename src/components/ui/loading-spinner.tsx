import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'primary' | 'secondary' | 'white';
    className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    variant = 'primary',
    className
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
        xl: 'w-12 h-12'
    };

    const variantClasses = {
        primary: 'text-primary',
        secondary: 'text-muted-foreground',
        white: 'text-white'
    };

    return (
        <div
            className={cn(
                'animate-spin rounded-full border-2 border-current border-t-transparent',
                sizeClasses[size],
                variantClasses[variant],
                className
            )}
        />
    );
};

// Pulsing dots loader
export const PulsingDots: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <div className={cn('flex space-x-1', className)}>
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className="w-2 h-2 bg-primary rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                />
            ))}
        </div>
    );
};

// Wave loader
export const WaveLoader: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <div className={cn('flex space-x-1', className)}>
            {[0, 1, 2, 3, 4].map((i) => (
                <div
                    key={i}
                    className="w-1 h-8 bg-primary rounded-full animate-pulse"
                    style={{
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: '1s'
                    }}
                />
            ))}
        </div>
    );
};

// Skeleton loader with shimmer effect
interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({
    className,
    variant = 'rectangular'
}) => {
    const variantClasses = {
        text: 'h-4 rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg'
    };

    return (
        <div
            className={cn(
                'admin-shimmer bg-muted animate-pulse',
                variantClasses[variant],
                className
            )}
        />
    );
};

// Full page loader
export const FullPageLoader: React.FC<{ message?: string }> = ({
    message = 'Loading...'
}) => {
    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-spin">
                        <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-primary/20 rounded-full animate-pulse"></div>
                    </div>
                </div>
                <p className="text-muted-foreground font-medium">{message}</p>
            </div>
        </div>
    );
};

// Card loading state
export const CardLoader: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <div className={cn('admin-card p-6 space-y-4', className)}>
            <div className="flex items-center space-x-3">
                <SkeletonLoader variant="circular" className="w-10 h-10" />
                <div className="space-y-2 flex-1">
                    <SkeletonLoader className="h-4 w-3/4" />
                    <SkeletonLoader className="h-3 w-1/2" />
                </div>
            </div>
            <div className="space-y-2">
                <SkeletonLoader className="h-3 w-full" />
                <SkeletonLoader className="h-3 w-5/6" />
                <SkeletonLoader className="h-3 w-4/6" />
            </div>
        </div>
    );
};