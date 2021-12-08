import type Hls from 'hls.js';
import { AudioTrackList } from './tracks/AudioTrackList';
import { VideoTrackList } from './tracks/VideoTrackList';
export declare class HLSPonyfillVideoElement extends HTMLVideoElement {
    /**
     * Registers 'hls-ponyfill' custom element if hls is not supported natively and hls.js is supported
     * @param forced Registers custom element even if native hls is supported
     * @returns true if custom element was registered
     */
    static install(forced?: boolean): boolean;
    /**
     * Attaches hls-ponyfill to a given HTMLVideoElement
     */
    static attach(video: HTMLVideoElement): HLSPonyfillVideoElement;
    static setHlsConstructor(HlsConstructor: typeof Hls): void;
    private static Hls;
    /**
     * Current Hls instance
     */
    private hls?;
    /**
     * Current Hls playlist URL
     */
    private hlsSrc?;
    private videoTrackList?;
    private audioTrackList?;
    private seekableTimeRanges?;
    private originalPrototype?;
    private isDetaching?;
    /**
     * @returns Hls instance if it is attached to video tag
     */
    private getHlsInstanceIfAttached;
    get videoTracks(): VideoTrackList;
    get audioTracks(): AudioTrackList;
    getAttribute(qualifiedName: string): string | null;
    setAttribute(qualifiedName: string, value: string): void;
    removeAttribute(qualifiedName: string): void;
    get src(): string;
    set src(src: string);
    /**
     * Non-standard WebKit method which returns an air date for <video> timeline start
     */
    getStartDate(): Date;
    /**
     * Returns 'probably' for hls mime-type
     */
    canPlayType(mime: string): CanPlayTypeResult;
    get currentTime(): number;
    set currentTime(value: number);
    get seekable(): TimeRanges;
    detach(): HTMLVideoElement;
    private detachHls;
    private initVideoTrackList;
    private initAudioTrackList;
    private setSrc;
    private initHls;
    private updateTrackLists;
    private updateVideoTrack;
    private updateAudioTrack;
    /**
     * @returns hls.js constructor assigned by HLSPonyfillVideoElement.setHlsConstructor or globalThis.Hls
     */
    private static getHlsConstructor;
    private subscribeHlsEvent;
    private connectedCallback;
}
