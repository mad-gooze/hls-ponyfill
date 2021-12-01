import { TrackList } from './TrackList';
import { VideoTrack } from './VideoTrack';
export interface VideoTrackEvent extends Event {
    track: VideoTrack | null;
}
export interface VideoTrackListEventMap {
    addtrack: VideoTrackEvent;
    change: Event;
    removetrack: VideoTrackEvent;
}
/**
 * The current list of {@link VideoTrack} for a video.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#videotracklist}
 */
export declare class VideoTrackList extends TrackList<VideoTrack> {
    onaddtrack: ((this: VideoTrackList, ev: VideoTrackEvent) => unknown) | null;
    onchange: ((this: VideoTrackList, ev: Event) => unknown) | null;
    onremovetrack: ((this: VideoTrackList, ev: VideoTrackEvent) => unknown) | null;
    constructor(tracks?: ReadonlyArray<VideoTrack>);
    get selectedIndex(): number;
    /**
     * Add a {@link VideoTrack} to the `VideoTrackList`.
     *
     * @param track The VideoTrack to add to the list
     */
    addTrack(track: VideoTrack): void;
}
