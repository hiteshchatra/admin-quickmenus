import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';

interface NotificationProps {
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    onClose?: () => void;
    className?: string;
    autoClose?: boolean;
    duration?: number;
}

export const Notification: React.FC<NotificationProps> = ({
    type,
    title,
    message,
    onClose,
    className,
    autoClose = true,
    duration = 5000
}) => {
    React.useEffect(() => {
        if (autoClose && onClose) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [autoClose, duration, onClose]);

    const icons = {
        success: CheckCircle,
        error: XCircle,
        warning: AlertCircle,
        info: Info
    };

    const colors = {
        success: 'border-success/20 bg-success/10 text-success',
        error: 'border-destructive/20 bg-destructive/10 text-destructive',
        warning: 'border-warning/20 bg-warning/10 text-warning',
        info: 'border-primary/20 bg-primary/10 text-primary'
    };

    const Icon = icons[type];

    return (
        <div
            className={cn(
                'fixed top-4 right-4 z-50 max-w-sm w-full',
                'animate-slide-in-right',
                className
            )}
        >
            <div
                className={cn(
                    'p-4 rounded-xl border shadow-[var(--shadow-elegant)] backdrop-blur-sm',
                    'transition-[var(--transition-smooth)]',
                    colors[type]
                )}
            >
                <div className="flex items-start space-x-3">
                    <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm">{title}</h4>
                        {message && (
                            <p className="text-sm opacity-90 mt-1">{message}</p>
                        )}
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="flex-shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Floating notification system
interface FloatingNotification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
}

interface NotificationSystemProps {
    notifications: FloatingNotification[];
    onRemove: (id: string) => void;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
    notifications,
    onRemove
}) => {
    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {notifications.map((notification, index) => (
                <div
                    key={notification.id}
                    className="animate-slide-in-right"
                    style={{ animationDelay: `${index * 0.1}s` }}
                >
                    <Notification
                        type={notification.type}
                        title={notification.title}
                        message={notification.message}
                        onClose={() => onRemove(notification.id)}
                        duration={notification.duration}
                        autoClose={true}
                    />
                </div>
            ))}
        </div>
    );
};

// Progress notification
interface ProgressNotificationProps {
    title: string;
    progress: number; // 0-100
    className?: string;
}

export const ProgressNotification: React.FC<ProgressNotificationProps> = ({
    title,
    progress,
    className
}) => {
    return (
        <div
            className={cn(
                'fixed top-4 right-4 z-50 max-w-sm w-full',
                'animate-slide-in-right',
                className
            )}
        >
            <div className="p-4 rounded-xl border border-primary/20 bg-card/95 backdrop-blur-sm shadow-[var(--shadow-elegant)]">
                <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <h4 className="font-semibold text-sm">{title}</h4>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Progress</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                            <div
                                className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};