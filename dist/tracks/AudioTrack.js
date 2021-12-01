import { Track } from './Track';
/**
 * A representation of a single `AudioTrack`. If it is part of an {@link AudioTrackList}
 * only one `AudioTrack` in the list will be enabled at a time.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#audiotrack}
 */
export class AudioTrack extends Track {
    _enabled = false;
    /**
     * @internal
     */
    onenabledchange;
    constructor({ enabled = false, ...trackProps }) {
        super(trackProps);
        this._enabled = enabled;
    }
    /**
     * @internal
     */
    _destroy() {
        delete this.onenabledchange;
    }
    /**
     * If this `AudioTrack` is enabled or not
     */
    get enabled() {
        return this._enabled;
    }
    /**
     * When setting this will fire 'enabledchange' event if the state of enabled is changed.
     */
    set enabled(newEnabled) {
        // an invalid or unchanged value
        if (typeof newEnabled !== 'boolean' || newEnabled === this._enabled) {
            return;
        }
        this._enabled = newEnabled;
        // An event that fires when enabled changes on this track. This allows
        // the AudioTrackList that holds this track to act accordingly.
        // Note: This is not part of the spec! Native tracks will do
        // this internally without an event.
        this.onenabledchange?.();
    }
}
