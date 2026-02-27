'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader2, ImagePlus } from 'lucide-react';

interface ImageUploadProps {
    images: string[];
    onChange: (images: string[]) => void;
    maxImages?: number;
    folder?: string;
}

export function ImageUpload({ images, onChange, maxImages = 5, folder = 'luxemoon/products' }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const context = folder.includes('logos') ? 'logos' : 'products';

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (images.length + acceptedFiles.length > maxImages) {
            setError(`Maximum ${maxImages} images allowed`);
            return;
        }

        setError('');
        setUploading(true);

        try {
            // 1. Get signature from our secure backend
            const sigRes = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ context, assetType: 'image' })
            });

            if (!sigRes.ok) throw new Error('Failed to obtain secure upload signature');

            const { signature, timestamp, apiKey, cloudName, folder: signedFolder, resourceType } = await sigRes.json();

            // 2. Upload directly to Cloudinary
            const newUrls = await Promise.all(acceptedFiles.map(async (file) => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('api_key', apiKey);
                formData.append('timestamp', timestamp);
                formData.append('signature', signature);
                formData.append('folder', signedFolder);

                const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
                    method: 'POST',
                    body: formData
                });

                if (!uploadRes.ok) {
                    const errorResponse = await uploadRes.json();
                    throw new Error(errorResponse?.error?.message || 'Cloudinary upload failed');
                }

                const data = await uploadRes.json();
                return data.secure_url;
            }));

            onChange([...images, ...newUrls]);
        } catch (err) {
            console.error('Upload Error Detailed:', err);
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    }, [images, onChange, maxImages, context]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
        maxSize: 5 * 1024 * 1024,
        disabled: uploading,
    });

    const removeImage = async (index: number) => {
        const urlToRemove = images[index];
        // Optimistic UI update
        onChange(images.filter((_, i) => i !== index));

        try {
            if (urlToRemove.includes('res.cloudinary.com')) {
                // Extract public ID from Cloudinary URL
                // Support multiple versions of Cloudinary URLs
                const urlParts = urlToRemove.split('/');
                const filenamePos = urlParts.length - 1;
                const pathParts = [];
                let i = filenamePos;

                // Keep appending reverse until we hit 'upload' or 'v...' version string
                while (i >= 0 && urlParts[i] !== 'upload' && !urlParts[i].startsWith('v')) {
                    pathParts.unshift(urlParts[i]);
                    i--;
                }

                // Join path parts and remove extension
                const rawPublicId = pathParts.join('/');
                const publicId = rawPublicId.replace(/\.[^/.]+$/, '');

                if (publicId) {
                    await fetch('/api/upload/delete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ publicId })
                    });
                }
            }
        } catch (error) {
            console.error('Failed to securely delete image from Cloudinary', error);
        }
    };

    return (
        <div className="space-y-3">
            {/* Preview Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {images.map((url, i) => (
                        <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-stone-200 bg-stone-50">
                            <img src={url} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => removeImage(i)}
                                className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                            {i === 0 && (
                                <span className="absolute bottom-1.5 left-1.5 text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                                    MAIN
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Dropzone */}
            {images.length < maxImages && (
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${isDragActive
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-stone-300 hover:border-amber-400 hover:bg-stone-50'
                        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                    <input {...getInputProps()} />
                    {uploading ? (
                        <div className="flex flex-col items-center gap-2 text-stone-500">
                            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                            <span className="text-sm font-medium">Uploading...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-stone-500">
                            {isDragActive ? (
                                <Upload className="w-8 h-8 text-amber-500" />
                            ) : (
                                <ImagePlus className="w-8 h-8" />
                            )}
                            <span className="text-sm font-medium">
                                {isDragActive ? 'Drop images here' : 'Drag & drop images, or click to select'}
                            </span>
                            <span className="text-xs text-stone-400">
                                JPG, PNG, WebP up to 5MB • {images.length}/{maxImages} uploaded
                            </span>
                        </div>
                    )}
                </div>
            )}

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        </div>
    );
}
