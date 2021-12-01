export declare type TrackProps = Partial<{
    label: string;
    language: string;
    id: string;
    kind: string;
    sourceBuffer: SourceBuffer | null;
}>;
/**
 * A Track class that contains all of the common functionality for AudioTrack and VideoTrack
 * @see {@link https://html.spec.whatwg.org/multipage/embedded-content.html}
 */
export declare abstract class Track extends EventTarget implements TrackProps {
    /**
     * The menu label for this track.
     */
    readonly label: string;
    /**
     * A unique id for this Track.
     */
    readonly id: string;
    /**
     * A valid two character language code.
     */
    readonly language: string;
    readonly kind: string;
    readonly sourceBuffer: SourceBuffer | null;
    constructor({ label, language, id, sourceBuffer, }: Partial<TrackProps>);
}
