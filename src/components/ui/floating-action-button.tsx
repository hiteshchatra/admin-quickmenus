import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
    onClick: () => void;
    icon: React.ReactNode;
    label?: string;
    className?: string;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
    onClick,
    icon,
    label,
    className,
    variant = 'primary'
}) => {
    const variantClasses = {
        primary: 'admin-gradient hover:shadow-[var(--shadow-glow)]',
        secondary: 'bg-secondary hover:bg-secondary/80',
        success: 'bg-success hover:bg-success/80',
        warning: 'bg-warning hover:bg-warning/80',
        destructive: 'bg-destructive hover:bg-destructive/80'
    };

    return (
        <Button
            onClick={onClick}
            className={cn(
                'admin-fab',
                variantClasses[variant],
                'group',
                className
            )}
            size="icon"
        >
            <div className="group-hover:opacity-80 transition-opacity">
                {icon}
            </div>
            {label && (
                <span className="sr-only">{label}</span>
            )}
        </Button>
    );
};

// Extended FAB with text
interface ExtendedFABProps extends FloatingActionButtonProps {
    text: string;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const ExtendedFAB: React.FC<ExtendedFABProps> = ({
    onClick,
    icon,
    text,
    className,
    variant = 'primary',
    position = 'bottom-right'
}) => {
    const positionClasses = {
        'bottom-right': 'fixed bottom-6 right-6',
        'bottom-left': 'fixed bottom-6 left-6',
        'top-right': 'fixed top-6 right-6',
        'top-left': 'fixed top-6 left-6'
    };

    const variantClasses = {
        primary: 'admin-gradient hover:shadow-[var(--shadow-glow)]',
        secondary: 'bg-secondary hover:bg-secondary/80',
        success: 'bg-success hover:bg-success/80',
        warning: 'bg-warning hover:bg-warning/80',
        destructive: 'bg-destructive hover:bg-destructive/80'
    };

    return (
        <Button
            onClick={onClick}
            className={cn(
                positionClasses[position],
                'h-14 px-6 rounded-full shadow-[var(--shadow-strong)]',
                'transition-[var(--transition-smooth)] hover:shadow-[var(--shadow-glow)] active:scale-95',
                'z-50 group',
                variantClasses[variant],
                className
            )}
        >
            <div className="flex items-center space-x-2">
                <div className="group-hover:opacity-80 transition-opacity">
                    {icon}
                </div>
                <span className="font-medium text-white">{text}</span>
            </div>
        </Button>
    );
};

// Speed Dial FAB
interface SpeedDialOption {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
}

interface SpeedDialFABProps {
    mainIcon: React.ReactNode;
    options: SpeedDialOption[];
    className?: string;
}

export const SpeedDialFAB: React.FC<SpeedDialFABProps> = ({
    mainIcon,
    options,
    className
}) => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div className={cn('fixed bottom-6 right-6 z-50', className)}>
            {/* Options */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 space-y-3 animate-slide-in-up">
                    {options.map((option, index) => (
                        <div
                            key={index}
                            className="flex items-center space-x-3 animate-slide-in-right"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="bg-card/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-[var(--shadow-soft)] border border-border/50">
                                <span className="text-sm font-medium whitespace-nowrap">
                                    {option.label}
                                </span>
                            </div>
                            <FloatingActionButton
                                onClick={() => {
                                    option.onClick();
                                    setIsOpen(false);
                                }}
                                icon={option.icon}
                                variant={option.variant}
                                className="w-12 h-12"
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Main FAB */}
            <FloatingActionButton
                onClick={() => setIsOpen(!isOpen)}
                icon={
                    <div className={`transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>
                        {mainIcon}
                    </div>
                }
                className="w-16 h-16"
            />
        </div>
    );
};