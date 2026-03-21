export function optimizeImage(url: string | null | undefined): string {
    if (!url) return '';
    const lower = url.toLowerCase();
    const isSvg = /\.svg(?:\?|$)/i.test(url) || /\/f_svg\//i.test(url) || lower.includes('format=svg');
    if (isSvg) {
        return url;
    }

    // Apply Cloudinary automatic format/quality only for raster assets.
    if (url.includes('res.cloudinary.com') && !url.includes('f_auto') && !url.includes('q_auto')) {
        return url.replace('/image/upload/', '/image/upload/f_auto,q_auto,dpr_auto/');
    }
    return url;
}
