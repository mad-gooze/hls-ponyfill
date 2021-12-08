import { AudioTrack } from './AudioTrack';
import { TrackList } from './TrackList';
import type { AudioTrackEvent, AudioTrackList as IAudioTrackList } from '../video';
/**
 * The current list of {@link AudioTrack} for a media file.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#audiotracklist}
 */
export declare class AudioTrackList extends TrackList<AudioTrack> implements IAudioTrackList {
    onaddtrack: ((this: IAudioTrackList, ev: AudioTrackEvent) => any) | null;
    onchange: ((this: IAudioTrackList, ev: Event) => any) | null;
    onremovetrack: ((this: IAudioTrackList, ev: AudioTrackEvent) => any) | null;
    constructor(tracks?: ReadonlyArray<AudioTrack>);
    /**
     * Add an {@link AudioTrack} to the `AudioTrackList`.
     *
     * @param track The AudioTrack to add to the list
     */
    addTrack(track: AudioTrack): void;
}
