import { Track, TrackProps } from './Track';
export declare type AudioTrackProps = {
    enabled?: boolean;
};
/**
 * A representation of a single `AudioTrack`. If it is part of an {@link AudioTrackList}
 * only one `AudioTrack` in the list will be enabled at a time.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#audiotrack}
 */
export declare class AudioTrack extends Track implements AudioTrackProps {
    private _enabled;
    constructor({ enabled, ...trackProps }: TrackProps & AudioTrackProps);
    /**
     * If this `AudioTrack` is enabled or not
     */
    get enabled(): boolean;
    /**
     * When setting this will fire 'enabledchange' event if the state of enabled is changed.
     */
    set enabled(newEnabled: boolean);
}
