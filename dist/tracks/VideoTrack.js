import { Track } from './Track';
/**
 * A representation of a single `VideoTrack`.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#videotrack}
 */
export class VideoTrack extends Track {
    _selected = false;
    width;
    height;
    bitrate;
    /**
     * @internal
     */
    onselectedchange;
    constructor({ selected = false, width, height, bitrate, ...trackProps }) {
        super(trackProps);
        this.selected = selected;
        this.bitrate = bitrate;
        this.width = width;
        this.height = height;
    }
    /**
     * @internal
     */
    _destroy() {
        delete this.onselectedchange;
    }
    /**
     * If this track is the one that is currently playing.
     */
    get selected() {
        return this._selected;
    }
    set selected(newSelected) {
        // an invalid or unchanged value
        if (typeof newSelected !== 'boolean' ||
            newSelected === this._selected) {
            return;
        }
        this._selected = newSelected;
        // An event that fires when selected changes on this track. This allows
        // the VideoTrackList that holds this track to act accordingly.
        // Note: This is not part of the spec! Native tracks will do
        // this internally without an event
        this.onselectedchange?.();
    }
}
