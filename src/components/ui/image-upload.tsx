import React, { useState, useRef } from 'react';
import { Button } from './button';
import { Progress } from './progress';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { validateImageFile, getOptimizedImageUrl } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
    onImageSelect: (file: File) => void;
    onImageRemove?: () => void;
    currentImage?: string;
    loading?: boolean;
    className?: string;
    accept?: string;
    maxSize?: number; // in MB
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
    onImageSelect,
    onImageRemove,
    currentImage,
    loading = false,
    className = '',
    accept = 'image/*',
    maxSize = 5
}) => {
    const [dragActive, setDragActive] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentImage || null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFile = (file: File) => {
        const validation = validateImageFile(file);

        if (!validation.valid) {
            toast({
                title: "Invalid file",
                description: validation.error,
                variant: "destructive",
            });
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        onImageSelect(file);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onImageRemove?.();
    };

    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className={`space-y-4 ${className}`}>
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleChange}
                className="hidden"
            />

            {preview ? (
                <div className="relative">
                    <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden">
                        <img
                            src={currentImage ? getOptimizedImageUrl(currentImage, 400, 200) : preview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                        {loading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="text-white text-sm">Uploading...</div>
                            </div>
                        )}
                    </div>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={handleRemove}
                        disabled={loading}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            ) : (
                <div
                    className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={openFileDialog}
                >
                    <div className="space-y-4">
                        <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Upload className="w-6 h-6 text-muted-foreground" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-medium">
                                {loading ? 'Uploading...' : 'Click to upload or drag and drop'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                PNG, JPG, WebP up to {maxSize}MB
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};