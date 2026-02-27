export function optimizeImage(url: string | null | undefined): string {
    if (!url) return '';
    // Apply f_auto,q_auto transformations if it's a Cloudinary URL and not already optimized
    if (url.includes('res.cloudinary.com') && !url.includes('f_auto') && !url.includes('q_auto')) {
        return url.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
    }
    return url;
}
