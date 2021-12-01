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
const HLS_MIME_TYPE = 'application/vnd.apple.mpegurl';
const CUSTOM_ELEMENT_ID = 'hls-ponyfill';
export class HLSPonyfillVideoElement extends HTMLVideoElement {
    /**
     * Registers 'hls-ponyfill' custom element if hls is not supported natively and hls.js is supported
     * @param forced Registers custom element even if native hls is supported
     * @returns true if custom element was registered
     */
    static install(forced) {
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
    static attach(video) {
        const originalProto = Object.getPrototypeOf(video);
        Object.setPrototypeOf(video, HLSPonyfillVideoElement.prototype);
        const hlsVideo = video;
        return hlsVideo;
    }
    static setHlsConstructor(HlsConstructor) {
        this.Hls = HlsConstructor;
    }
    static Hls;
    /**
     * Current Hls instance
     */
    hls;
    /**
     * Current Hls playlist URL
     */
    hlsSrc;
    videoTrackList;
    audioTrackList;
    seekableTimeRanges;
    originalPrototype;
    /**
     * @returns Hls instance if it is attached to video tag
     */
    getHlsInstanceIfAttached() {
        const { hls } = this;
        return hls && hls.media === this ? hls : undefined;
    }
    // #region HTMLVideoElement API
    get videoTracks() {
        return this.hlsSrc === undefined && this.videoTrackList !== undefined
            ? // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore: videoTracks is not defined in HTMLMediaElement
                super.videoTracks
            : this.videoTrackList;
    }
    get audioTracks() {
        return this.hlsSrc === undefined && this.audioTrackList !== undefined
            ? // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore: audioTracks is not defined in HTMLMediaElement
                super.audioTracks
            : this.audioTrackList;
    }
    getAttribute(qualifiedName) {
        if (qualifiedName === 'src' && this.hlsSrc !== undefined) {
            return this.hlsSrc;
        }
        return super.getAttribute(qualifiedName);
    }
    setAttribute(qualifiedName, value) {
        // TODO
        if (qualifiedName === 'src') {
            return this.setSrc(value);
        }
        return super.setAttribute(qualifiedName, value);
    }
    get src() {
        return this.hlsSrc === undefined ? super.src : this.hlsSrc;
    }
    set src(src) {
        this.setSrc(src);
    }
    /**
     * Non-standard WebKit method which returns an air date for <video> timeline start
     */
    getStartDate() {
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
    canPlayType(mime) {
        if (mime === HLS_MIME_TYPE) {
            return 'probably';
        }
        return super.canPlayType(mime);
    }
    get currentTime() {
        return super.currentTime;
    }
    set currentTime(value) {
        if (this.hlsSrc !== undefined) {
            // clamp value to safe range
            value = clamp(value, this.seekable.start(0), this.seekable.end(0));
        }
        super.currentTime = value;
    }
    get seekable() {
        const { seekableTimeRanges } = this;
        return seekableTimeRanges === undefined
            ? super.seekable
            : seekableTimeRanges;
    }
    // #endregion
    detach() {
        if (this.getAttribute('is') === CUSTOM_ELEMENT_ID || this.originalPrototype === undefined) {
            throw new Error('cannot detach hls-ponyfill initialized via custom element');
        }
        Object.setPrototypeOf(this, this.originalPrototype);
        delete this.originalPrototype;
        return this;
    }
    detachHls() {
        if (this.hls === undefined || this.hls.media === null) {
            return;
        }
        this.hls.detachMedia();
        clearTrackList(this.videoTrackList);
        clearTrackList(this.audioTrackList);
    }
    initVideoTrackList() {
        if (this.videoTrackList !== undefined) {
            return;
        }
        const videoTrackList = new VideoTrackList();
        videoTrackList.addEventListener('change', () => {
            const hls = this.getHlsInstanceIfAttached();
            if (hls === undefined) {
                return;
            }
            hls.currentLevel = parseInt(videoTrackList[videoTrackList.selectedIndex].id, 10);
        });
        this.videoTrackList = videoTrackList;
    }
    initAudioTrackList() {
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
    setSrc(src) {
        if (isHlsSource(src)) {
            // init hls.js for hls source
            this.initHls(src);
            return;
        }
        const isBlobUrl = getUrlProtocol(src) === 'blob:';
        const hls = this.getHlsInstanceIfAttached();
        // if hls.js is active and we are switching to another video, detach hls.js instance
        if (hls !== undefined && !isBlobUrl) {
            hls.detachMedia();
            this.hlsSrc = undefined;
        }
        super.src = src;
    }
    initHls(src) {
        this.detachHls();
        this.initVideoTrackList();
        this.initAudioTrackList();
        const Hls = HLSPonyfillVideoElement.getHlsConstructor();
        const hls = new Hls({
            // enable native-like behaviour for live & event streams
            liveDurationInfinity: true,
        });
        this.seekableTimeRanges = new SeekableTimeRanges(() => this.getHlsInstanceIfAttached(), super.seekable);
        this.hls = hls;
        this.hlsSrc = src;
        hls.on(Hls.Events.MANIFEST_LOADED, () => this.updateTrackLists(hls));
        hls.on(Hls.Events.LEVEL_SWITCHED, () => this.updateVideoTrack(hls));
        hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, () => this.updateAudioTrack(hls));
        hls.loadSource(src);
        hls.attachMedia(this);
    }
    updateTrackLists(hls) {
        if (this.hlsSrc === undefined) {
            return;
        }
        const { videoTrackList, audioTrackList } = this;
        if (videoTrackList === undefined || audioTrackList === undefined) {
            return;
        }
        hls.levels.forEach(({ name, attrs, width, height, bitrate }, id) => {
            videoTrackList.addTrack(new VideoTrack({
                id: String(id),
                language: attrs.LANGUAGE,
                label: name,
                selected: hls.currentLevel === id,
                width,
                height,
                bitrate,
            }));
        });
        hls.audioTracks.forEach((track, id) => {
            audioTrackList.addTrack(new AudioTrack({
                id: String(id),
                language: track.lang,
                label: track.name,
                enabled: hls.audioTrack === id,
            }));
        });
    }
    updateVideoTrack(hls) {
        const { hlsSrc, videoTrackList } = this;
        if (hlsSrc === undefined || videoTrackList === undefined) {
            return;
        }
        const videoTrack = videoTrackList.getTrackById(String(hls.currentLevel));
        if (videoTrack !== null) {
            videoTrack.selected = true;
        }
    }
    updateAudioTrack(hls) {
        const { hlsSrc, audioTrackList } = this;
        if (hlsSrc === undefined || audioTrackList === undefined) {
            return;
        }
        const audioTrack = audioTrackList.getTrackById(String(hls.audioTrack));
        if (audioTrack !== null) {
            audioTrack.enabled = true;
        }
    }
    /**
     * @returns hls.js constructor assigned by HLSPonyfillHTMLVideoElement.setHlsConstructor or globalThis.Hls
     */
    static getHlsConstructor() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Hls = this.Hls || globalThis.Hls;
        if (!Hls) {
            throw new Error('hls-ponyfill: global Hls.js was not found, please assign it using HLSPonyfillHTMLVideoElement.setHlsConstructor()');
        }
        return Hls;
    }
}
