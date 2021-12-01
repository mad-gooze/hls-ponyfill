/**
 * Detects hls streams by .m3u8 extension
 */
export function isHlsSource(src) {
    const [ext = ''] = src.split(/[#?]/)[0].split('.');
    return ext.trim() === 'm3u8';
}
