import { Track } from './Track';
export interface CustomTrackEvent<T extends Track> extends Event {
    track: T | null;
}
/**
 * Common functionality between AudioTrackList and VideoTrackList
 */
export declare abstract class TrackList<T extends Track> extends EventTarget implements ArrayLike<T> {
    readonly [n: number]: T;
    private tracks;
    protected _changing: boolean;
    constructor(tracks?: ReadonlyArray<T>);
    /**
     * The current number of `Track`s in the this TrackList.
     */
    get length(): number;
    /**
     * Get a Track from the TrackList by a tracks id
     * @param id - the id of the track to get
     */
    getTrackById(id: string): T | null;
    /**
     * Returns a track by it's index
     */
    item(index: number): T;
}
