import type Hls from 'hls.js';
import { clamp } from './clamp';
import { getStartDate } from './getStartDate';
import { getUrlProtocol } from './getUrlProtocol';
import { isHlsSource } from './isHlsSource';
import { AudioTrackList, AudioTrack, VideoTrackList, VideoTrack, clearTrackList } from 'media-track-list';
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

        if (!HLSPonyfillVideoElement.Hls.isSupported()) {
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

    /**
     * Explicitly sets hls.js constructor used by hls-ponyfill
     */
    public static set Hls(HlsConstructor: typeof Hls) {
        this.HlsConstructor = HlsConstructor;
    }

    /**
     * @returns hls.js constructor assigned by HLSPonyfillVideoElement.setHlsConstructor or globalThis.Hls
     */
    public static get Hls(): typeof Hls {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const HlsConstructor = this.HlsConstructor || (globalThis as any).Hls;
        if (!HlsConstructor) {
            throw new Error(
                'hls-ponyfill: global hls.js was not found, please assign it using HLSPonyfillVideoElement.Hls = Hls',
            );
        }
        return HlsConstructor;
    }

    private static HlsConstructor: typeof Hls;

    /**
     * Current hls.js instance
     */
    private hlsInstance?: Hls;

    /**
     * Current Hls playlist URL
     */
    private hlsSrc?: string;

    private videoTrackList?: VideoTrackList;
    private audioTrackList?: AudioTrackList;

    private seekableTimeRanges?: SeekableTimeRanges;

    private originalPrototype?: typeof HTMLVideoElement.prototype;

    private isDetaching?: boolean;

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
        if (qualifiedName === 'src') {
            return this.setSrc(value);
        }
        return super.setAttribute(qualifiedName, value);
    }

    public removeAttribute(qualifiedName: string): void {
        if (qualifiedName === 'src' && this.hls !== undefined) {
            this.detachHls();
        }
        super.removeAttribute(qualifiedName);
    }

    get src(): HTMLVideoElement['src'] {
        return this.hlsSrc === undefined ? super.src : this.hlsSrc;
    }

    set src(src: HTMLVideoElement['src']) {
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

        return getStartDate(this.hls);
    }

    /**
     * Returns 'probably' for hls mime-type
     */
    public canPlayType(mime: string): ReturnType<HTMLVideoElement['canPlayType']> {
        if (mime === HLS_MIME_TYPE) {
            return 'probably';
        }
        return super.canPlayType(mime);
    }

    public get currentTime(): HTMLVideoElement['currentTime'] {
        return super.currentTime;
    }

    public set currentTime(value: HTMLVideoElement['currentTime']) {
        if (this.hlsSrc !== undefined) {
            // clamp value to safe range
            value = clamp(value, this.seekable.start(0), this.seekable.end(0));
        }

        super.currentTime = value;
    }

    public get seekable(): HTMLVideoElement['seekable'] {
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

    /**
     * @returns Hls instance if it is attached to video tag
     */
    public get hls(): Hls | undefined {
        const { hlsInstance: hls } = this;
        return hls && hls.media === this ? hls : undefined;
    }

    private detachHls(): void {
        if (this.isDetaching) {
            return;
        }
        this.isDetaching = true;
        clearTrackList(this.videoTrackList);
        clearTrackList(this.audioTrackList);
        if (this.hlsInstance !== undefined) {
            this.hlsInstance.detachMedia()
        }
        this.isDetaching = false;
    }

    private initVideoTrackList(): void {
        if (this.videoTrackList !== undefined) {
            return;
        }

        const videoTrackList = new VideoTrackList();
        videoTrackList.addEventListener('change', () => {
            if (this.hls === undefined) {
                return;
            }

            let selectedTrack: VideoTrack | undefined;
            for (let i = 0; i < videoTrackList.length; i++) {
                if (videoTrackList[i].selected) {
                    selectedTrack = videoTrackList[i];
                }
            }
            if (selectedTrack === undefined || selectedTrack.id === this.hls.levels[this.hls.currentLevel].url[0]) {
                return;
            }

            const selectedTrackId = selectedTrack.id;
            const levelIndex = this.hls.levels.findIndex(({ url: [id]}) => id === selectedTrackId);
            if (levelIndex >= 0) {
                this.hls.currentLevel = levelIndex;
            }
        });
        this.videoTrackList = videoTrackList;
    }

    private initAudioTrackList(): void {
        if (this.audioTrackList !== undefined) {
            return;
        }

        const audioTrackList = new AudioTrackList();
        audioTrackList.addEventListener('change', () => {
            if (this.hls === undefined) {
                return;
            }
            let enabledTrack: AudioTrack | undefined;
            for (let i = 0; i < audioTrackList.length; i++) {
                if (audioTrackList[i].enabled) {
                    enabledTrack = audioTrackList[i];
                }
            }
            if (enabledTrack === undefined || enabledTrack.id === this.hls.audioTracks[this.hls.audioTrack].url) {
                return;
            }
            
            const { id } = enabledTrack;
            const trackIndex = this.hls.audioTracks.findIndex(({ url }) => url === id);
            if (trackIndex >= 0) {
                this.hls.audioTrack = trackIndex;
            }
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
        const isAttached = this.hls !== undefined;

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

        const hls = new HLSPonyfillVideoElement.Hls({
            // enable native-like behaviour for live & event streams
            liveDurationInfinity: true,
        });
        this.seekableTimeRanges = new SeekableTimeRanges(
            () => this.hls,
            super.seekable,
        );
        this.hlsInstance = hls;
        this.hlsSrc = src;

        this.subscribeHlsEvent(hls, HLSPonyfillVideoElement.Hls.Events.MANIFEST_LOADED, () => this.updateTrackLists(hls));
        this.subscribeHlsEvent(hls, HLSPonyfillVideoElement.Hls.Events.LEVEL_SWITCHED, () => this.updateVideoTrack(hls));
        this.subscribeHlsEvent(hls, HLSPonyfillVideoElement.Hls.Events.AUDIO_TRACK_SWITCHED, () =>
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

        hls.audioTracks.forEach(({ lang, name, url}, index) => {
            audioTrackList.addTrack(
                new AudioTrack({
                    id: url,
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
        const [id] = hls.levels[hls.currentLevel].url;
        const videoTrack = videoTrackList.getTrackById(id);
        if (videoTrack !== null && !videoTrack.selected) {
            videoTrack.selected = true;
        }
    }

    private updateAudioTrack(hls: Hls): void {
        const { hlsSrc, audioTrackList } = this;
        if (hlsSrc === undefined || audioTrackList === undefined) {
            return;
        }
        const { url } = hls.audioTracks[hls.audioTrack];
        const audioTrack = audioTrackList.getTrackById(url);
        if (audioTrack !== null && !audioTrack.enabled) {
            audioTrack.enabled = true;
        }
    }

    private subscribeHlsEvent<E extends keyof HlsListeners>(hls: Hls, event: E, listener: HlsListeners[E]): void {
        hls.on(event, listener);
        hls.on(HLSPonyfillVideoElement.Hls.Events.MEDIA_DETACHING, () => hls.off(event, listener));
    }

    private connectedCallback(): void {
        this.setSrc(this.src);
    }
}
