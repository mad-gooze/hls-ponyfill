import { nanoid } from 'nanoid';
/**
 * A Track class that contains all of the common functionality for AudioTrack and VideoTrack
 * @see {@link https://html.spec.whatwg.org/multipage/embedded-content.html}
 */
export class Track extends EventTarget {
    /**
     * The menu label for this track.
     */
    label;
    /**
     * A unique id for this Track.
     */
    id;
    /**
     * A valid two character language code.
     */
    language;
    kind = '';
    sourceBuffer = null;
    constructor({ label = '', language = '', id = nanoid(), sourceBuffer = null, }) {
        super();
        this.label = label;
        this.language = language;
        this.id = id;
        this.sourceBuffer = sourceBuffer;
    }
}
