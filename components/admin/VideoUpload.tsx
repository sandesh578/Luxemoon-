'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Video, Link as LinkIcon, Upload, X, Loader2, Play } from 'lucide-react';

interface VideoUploadProps {
    videoUrl: string;
    onChange: (url: string) => void;
}

function getVideoEmbed(url: string): string | null {
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

    return null;
}

function isValidVideoUrl(url: string): boolean {
    if (!url) return true;
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

export function VideoUpload({ videoUrl, onChange }: VideoUploadProps) {
    const [mode, setMode] = useState<'url' | 'upload'>(videoUrl && !videoUrl.startsWith('http') ? 'upload' : 'url');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [urlInput, setUrlInput] = useState(videoUrl || '');

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (!acceptedFiles.length) return;
        setError('');
        setUploading(true);

        try {
            // 1. Get generation signature
            const sigRes = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ context: 'products', assetType: 'video' })
            });

            if (!sigRes.ok) throw new Error('Failed to obtain secure upload signature');

            const { signature, timestamp, apiKey, cloudName, folder, resourceType } = await sigRes.json();

            // 2. Upload directly to Cloudinary
            const file = acceptedFiles[0];
            const formData = new FormData();
            formData.append('file', file);
            formData.append('api_key', apiKey);
            formData.append('timestamp', timestamp);
            formData.append('signature', signature);
            formData.append('folder', folder);

            const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) {
                const errorResponse = await uploadRes.json();
                throw new Error(errorResponse?.error?.message || 'Cloudinary upload failed');
            }

            const data = await uploadRes.json();
            onChange(data.secure_url);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    }, [onChange]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'video/mp4': ['.mp4'] },
        maxSize: 50 * 1024 * 1024,
        maxFiles: 1,
        disabled: uploading,
    });

    const handleUrlSubmit = () => {
        if (!isValidVideoUrl(urlInput)) {
            setError('Invalid URL');
            return;
        }
        setError('');
        onChange(urlInput);
    };

    const handleRemoveVideo = async () => {
        const urlToRemove = videoUrl;

        // Optimistic UI update
        onChange('');
        setUrlInput('');

        try {
            if (urlToRemove.includes('res.cloudinary.com')) {
                // Extract public ID from Cloudinary URL
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
            console.error('Failed to securely delete video from Cloudinary', error);
        }
    };

    const embedUrl = videoUrl ? getVideoEmbed(videoUrl) : null;

    return (
        <div className="space-y-3">
            {/* Mode Tabs */}
            <div className="flex gap-1 bg-stone-100 p-1 rounded-lg w-fit">
                <button
                    type="button"
                    onClick={() => setMode('url')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${mode === 'url' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                        }`}
                >
                    <LinkIcon className="w-3 h-3 inline mr-1" /> Paste URL
                </button>
                <button
                    type="button"
                    onClick={() => setMode('upload')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${mode === 'upload' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                        }`}
                >
                    <Upload className="w-3 h-3 inline mr-1" /> Upload
                </button>
            </div>

            {mode === 'url' ? (
                <div className="flex gap-2">
                    <input
                        type="url"
                        className="flex-1 p-2 border border-stone-200 rounded-lg text-sm"
                        placeholder="YouTube, Vimeo, or direct video URL"
                        value={urlInput}
                        onChange={e => setUrlInput(e.target.value)}
                    />
                    <button
                        type="button"
                        onClick={handleUrlSubmit}
                        className="px-4 py-2 bg-stone-900 text-white text-sm font-bold rounded-lg hover:bg-stone-800"
                    >
                        Set
                    </button>
                </div>
            ) : (
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-amber-500 bg-amber-50' : 'border-stone-300 hover:border-amber-400'
                        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                    <input {...getInputProps()} />
                    {uploading ? (
                        <div className="flex flex-col items-center gap-2 text-stone-500">
                            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                            <span className="text-sm font-medium">Uploading video...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-stone-500">
                            <Video className="w-8 h-8" />
                            <span className="text-sm font-medium">Drag & drop a video, or click to select</span>
                            <span className="text-xs text-stone-400">MP4 up to 50MB</span>
                        </div>
                    )}
                </div>
            )}

            {/* Preview */}
            {videoUrl && (
                <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-black">
                    {embedUrl ? (
                        <iframe
                            src={embedUrl}
                            className="w-full aspect-video"
                            allowFullScreen
                            allow="autoplay; encrypted-media"
                        />
                    ) : (
                        <video src={videoUrl} controls className="w-full aspect-video" />
                    )}
                    <button
                        type="button"
                        onClick={handleRemoveVideo}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow hover:bg-red-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        </div>
    );
}
