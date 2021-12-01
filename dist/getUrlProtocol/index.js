const a = document.createElement('a');
export function getUrlProtocol(url) {
    a.href = url;
    return a.protocol;
}
