import { Track, TrackProps } from './Track';
export declare type VideoTrackProps = Partial<{
    selected: boolean;
    width: number;
    height: number;
    bitrate: number;
    sourceBuffer: SourceBuffer | null;
}>;
/**
 * A representation of a single `VideoTrack`.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#videotrack}
 */
export declare class VideoTrack extends Track implements VideoTrackProps {
    private _selected;
    readonly width?: number;
    readonly height?: number;
    readonly bitrate?: number;
    constructor({ selected, width, height, bitrate, ...trackProps }: TrackProps & VideoTrackProps);
    /**
     * If this track is the one that is currently playing.
     */
    get selected(): boolean;
    set selected(newSelected: boolean);
}
