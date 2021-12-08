import type Hls from 'hls.js';
import { clamp } from './clamp';
import { getStartDate } from './getStartDate';
import { getUrlProtocol } from './getUrlProtocol';
import { isHlsSource } from './isHlsSource';
import { AudioTrackList } from './tracks/AudioTrackList';
import { AudioTrack } from './tracks/AudioTrack';
import { clearTrackList } from './tracks/clearTrackList';
import { VideoTrackList } from './tracks/VideoTrackList';
import { VideoTrack } from './tracks/VideoTrack';
import { SeekableTimeRanges } from './SeekableTimeRanges';
import { HlsListeners } from 'hls.js';

const HLS_MIME_TYPE = 'application/vnd.apple.mpegurl';
const CUSTOM_ELEMENT_ID = 'hls-ponyfill';

export class HLSPonyfillVideoElement extends HTMLVideoElement {
    /**
     * Registers 'hls-ponyfill' custom element if hls is not supported natively and hls.js is supported
     * @param forced Registers custom element even if native hls is supported
     * @returns true if custom element was registered
     */
    public static install(forced?: boolean): boolean {
        const testEl = document.createElement('video');
        if (testEl.canPlayType(HLS_MIME_TYPE) && !forced) {
            return false;
        }
        if (customElements.get(CUSTOM_ELEMENT_ID) !== undefined) {
            // already installed
            return true;
        }
        const Hls = HLSPonyfillVideoElement.getHlsConstructor();
        if (!Hls.isSupported()) {
            return false;
        }

        customElements.define(CUSTOM_ELEMENT_ID, HLSPonyfillVideoElement, {
            extends: 'video',
        });
        return true;
    }

    /**
     * Attaches hls-ponyfill to a given HTMLVideoElement
     */
    public static attach(video: HTMLVideoElement): HLSPonyfillVideoElement {
        const originalPrototype = Object.getPrototypeOf(video);
        Object.setPrototypeOf(video, HLSPonyfillVideoElement.prototype);

        const hlsVideo = video as HLSPonyfillVideoElement;
        hlsVideo.originalPrototype = originalPrototype;

        hlsVideo.initVideoTrackList();
        hlsVideo.initAudioTrackList();

        return hlsVideo;
    }

    public static setHlsConstructor(HlsConstructor: typeof Hls): void {
        this.Hls = HlsConstructor;
    }

    private static Hls: typeof Hls;

    /**
     * Current Hls instance
     */
    private hls?: Hls;

    /**
     * Current Hls playlist URL
     */
    private hlsSrc?: string;

    private videoTrackList?: VideoTrackList;
    private audioTrackList?: AudioTrackList;

    private seekableTimeRanges?: SeekableTimeRanges;

    private originalPrototype?: typeof HTMLVideoElement.prototype;

    private isDetaching?: boolean;

    /**
     * @returns Hls instance if it is attached to video tag
     */
    private getHlsInstanceIfAttached(): Hls | undefined {
        const { hls } = this;
        return hls && hls.media === this ? hls : undefined;
    }

    // #region HTMLVideoElement API

    public get videoTracks(): VideoTrackList {
        return this.videoTrackList!;
    }

    public get audioTracks(): AudioTrackList {
        return this.audioTrackList!;
    }

    public getAttribute(qualifiedName: string): string | null {
        if (qualifiedName === 'src' && this.hlsSrc !== undefined) {
            return this.hlsSrc;
        }
        return super.getAttribute(qualifiedName);
    }

    public setAttribute(qualifiedName: string, value: string): void {
        // TODO
        if (qualifiedName === 'src') {
            return this.setSrc(value);
        }
        return super.setAttribute(qualifiedName, value);
    }

    public removeAttribute(qualifiedName: string): void {
        if (qualifiedName === 'src' && this.getHlsInstanceIfAttached()) {
            this.detachHls();
        }
        super.removeAttribute(qualifiedName);
    }

    get src() {
        return this.hlsSrc === undefined ? super.src : this.hlsSrc;
    }

    set src(src: string) {
        this.setSrc(src);
    }

    /**
     * Non-standard WebKit method which returns an air date for <video> timeline start
     */
    public getStartDate(): Date {
        if (this.hlsSrc === undefined) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (typeof super.getStartDate === 'function') {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                return super.getStartDate();
            }
            return new Date(NaN);
        }

        return getStartDate(this.getHlsInstanceIfAttached());
    }

    /**
     * Returns 'probably' for hls mime-type
     */
    public canPlayType(mime: string): CanPlayTypeResult {
        if (mime === HLS_MIME_TYPE) {
            return 'probably';
        }
        return super.canPlayType(mime);
    }

    public get currentTime(): number {
        return super.currentTime;
    }

    public set currentTime(value: number) {
        if (this.hlsSrc !== undefined) {
            // clamp value to safe range
            value = clamp(value, this.seekable.start(0), this.seekable.end(0));
        }

        super.currentTime = value;
    }

    public get seekable(): TimeRanges {
        const { seekableTimeRanges } = this;
        return seekableTimeRanges === undefined
            ? super.seekable
            : seekableTimeRanges;
    }

    // #endregion

    public detach(): HTMLVideoElement {
        if (
            this.getAttribute('is') === CUSTOM_ELEMENT_ID ||
            this.originalPrototype === undefined
        ) {
            throw new Error(
                'cannot detach hls-ponyfill initialized via custom element',
            );
        }
        Object.setPrototypeOf(this, this.originalPrototype);
        delete this.originalPrototype;
        return this;
    }

    private detachHls(): void {
        if (this.isDetaching) {
            return;
        }
        this.isDetaching = true;
        clearTrackList(this.videoTrackList);
        clearTrackList(this.audioTrackList);
        if (this.hls !== undefined) {
            this.hls.detachMedia()
        }
        this.isDetaching = false;
    }

    private initVideoTrackList(): void {
        if (this.videoTrackList !== undefined) {
            return;
        }

        const videoTrackList = new VideoTrackList();
        videoTrackList.addEventListener('change', () => {
            const hls = this.getHlsInstanceIfAttached();
            if (hls === undefined) {
                return;
            }
            hls.currentLevel = parseInt(
                videoTrackList[videoTrackList.selectedIndex].id,
                10,
            );
        });
        this.videoTrackList = videoTrackList;
    }

    private initAudioTrackList(): void {
        if (this.audioTrackList !== undefined) {
            return;
        }

        const audioTrackList = new AudioTrackList();
        audioTrackList.addEventListener('change', () => {
            const hls = this.getHlsInstanceIfAttached();
            if (hls === undefined) {
                return;
            }
            let enabledTrack;
            for (let i = 0; i < audioTrackList.length; i++) {
                if (audioTrackList[i].enabled) {
                    enabledTrack = audioTrackList[i];
                }
            }
            if (enabledTrack === undefined) {
                return;
            }
            hls.audioTrack = parseInt(enabledTrack.id, 10);
        });
        this.audioTrackList = audioTrackList;
    }

    private setSrc(src: string): void {
        if (isHlsSource(src)) {
            // init hls.js for hls source
            this.initHls(src);
            return;
        }

        const isBlobUrl = getUrlProtocol(src) === 'blob:';
        const isAttached = this.getHlsInstanceIfAttached() !== undefined;

        // if hls.js is active and we are switching to another video, detach hls.js instance
        if (isAttached && !isBlobUrl) {
            this.detachHls();
            this.hlsSrc = undefined;
        }
        super.src = src;
    }

    private initHls(src: string): void {
        this.detachHls();

        this.initVideoTrackList();
        this.initAudioTrackList();

        const Hls = HLSPonyfillVideoElement.getHlsConstructor();
        const hls = new Hls({
            // enable native-like behaviour for live & event streams
            liveDurationInfinity: true,
        });
        this.seekableTimeRanges = new SeekableTimeRanges(
            () => this.getHlsInstanceIfAttached(),
            super.seekable,
        );
        this.hls = hls;
        this.hlsSrc = src;

        this.subscribeHlsEvent(hls, Hls.Events.MANIFEST_LOADED, () => this.updateTrackLists(hls));
        this.subscribeHlsEvent(hls, Hls.Events.LEVEL_SWITCHED, () => this.updateVideoTrack(hls));
        this.subscribeHlsEvent(hls, Hls.Events.AUDIO_TRACK_SWITCHED, () =>
            this.updateAudioTrack(hls),
        );

        hls.loadSource(src);
        hls.attachMedia(this);
    }

    private updateTrackLists(hls: Hls): void {
        if (this.hlsSrc === undefined) {
            return;
        }
        const { videoTrackList, audioTrackList } = this;
        if (videoTrackList === undefined || audioTrackList === undefined) {
            return;
        }

        hls.levels.forEach(({ name, attrs, width, height, bitrate, url: [id] }, index) => {
            videoTrackList.addTrack(
                new VideoTrack({
                    id,
                    language: attrs.LANGUAGE,
                    label: name,
                    selected: hls.currentLevel === index,
                    width,
                    height,
                    bitrate,
                }),
            );
        });

        hls.audioTracks.forEach(({ lang, name, url: [id]}, index) => {
            audioTrackList.addTrack(
                new AudioTrack({
                    id,
                    language: lang,
                    label: name,
                    enabled: hls.audioTrack === index,
                }),
            );
        });
    }

    private updateVideoTrack(hls: Hls): void {
        const { hlsSrc, videoTrackList } = this;
        if (hlsSrc === undefined || videoTrackList === undefined) {
            return;
        }
        const videoTrack = videoTrackList.getTrackById(
            hls.levels[hls.currentLevel].url[0],
        );
        if (videoTrack !== null) {
            videoTrack.selected = true;
        }
    }

    private updateAudioTrack(hls: Hls): void {
        const { hlsSrc, audioTrackList } = this;
        if (hlsSrc === undefined || audioTrackList === undefined) {
            return;
        }
        const audioTrack = audioTrackList.getTrackById(hls.audioTracks[hls.audioTrack].url[0]);
        if (audioTrack !== null) {
            audioTrack.enabled = true;
        }
    }

    /**
     * @returns hls.js constructor assigned by HLSPonyfillVideoElement.setHlsConstructor or globalThis.Hls
     */
    private static getHlsConstructor(): typeof Hls {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Hls = this.Hls || (globalThis as any).Hls;
        if (!Hls) {
            throw new Error(
                'hls-ponyfill: global Hls.js was not found, please assign it using HLSPonyfillVideoElement.setHlsConstructor()',
            );
        }

        return Hls;
    }

    private subscribeHlsEvent<E extends keyof HlsListeners>(hls: Hls, event: E, listener: HlsListeners[E]): void {
        const Hls = HLSPonyfillVideoElement.getHlsConstructor();
        hls.on(event, listener);
        hls.on(Hls.Events.MEDIA_DETACHING, () => hls.off(event, listener));
    }

    private connectedCallback(): void {
        this.setSrc(this.src);
    }
}
