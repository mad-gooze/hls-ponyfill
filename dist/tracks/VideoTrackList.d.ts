import { TrackList } from './TrackList';
import { VideoTrack } from './VideoTrack';
import type { VideoTrackEvent, VideoTrackList as IVideoTrackList } from '../video';
/**
 * The current list of {@link VideoTrack} for a video.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#videotracklist}
 */
export declare class VideoTrackList extends TrackList<VideoTrack> implements IVideoTrackList {
    onaddtrack: ((this: IVideoTrackList, ev: VideoTrackEvent) => any) | null;
    onchange: ((this: IVideoTrackList, ev: Event) => any) | null;
    onremovetrack: ((this: IVideoTrackList, ev: VideoTrackEvent) => any) | null;
    constructor(tracks?: ReadonlyArray<VideoTrack>);
    get selectedIndex(): number;
    /**
     * Add a {@link VideoTrack} to the `VideoTrackList`.
     *
     * @param track The VideoTrack to add to the list
     */
    addTrack(track: VideoTrack): void;
}
