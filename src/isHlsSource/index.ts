/**
 * Detects hls streams by .m3u8 extension
 */
export function isHlsSource(src: string): boolean {
    const parts = src.split(/[#?]/)[0].split('.');
    const ext = parts[parts.length - 1] || '';
    return ext.trim() === 'm3u8';
}
