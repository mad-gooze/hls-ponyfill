import { AudioTrack } from './AudioTrack';
import { TrackList } from './TrackList';
export interface AudioTrackEvent extends Event {
    track: AudioTrack | null;
}
export interface AudioTrackListEventMap {
    addtrack: AudioTrackEvent;
    change: Event;
    removetrack: AudioTrackEvent;
}
/**
 * The current list of {@link AudioTrack} for a media file.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#audiotracklist}
 */
export declare class AudioTrackList extends TrackList<AudioTrack> {
    onaddtrack: ((this: AudioTrackList, ev: AudioTrackEvent) => unknown) | null;
    onchange: ((this: AudioTrackList, ev: Event) => unknown) | null;
    onremovetrack: ((this: AudioTrackList, ev: AudioTrackEvent) => unknown) | null;
    constructor(tracks?: ReadonlyArray<AudioTrack>);
    /**
     * Add an {@link AudioTrack} to the `AudioTrackList`.
     *
     * @param track The AudioTrack to add to the list
     */
    addTrack(track: AudioTrack): void;
}
