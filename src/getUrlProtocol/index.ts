const a: HTMLAnchorElement = document.createElement('a');

export function getUrlProtocol(url: string): string {
    a.href = url;
    return a.protocol;
}
