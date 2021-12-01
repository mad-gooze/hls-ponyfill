import { TrackList } from './TrackList';
/**
 * Anywhere we call this function we diverge from the spec
 * as we only support one enabled audio track at a time
 *
 * @param list list to work on
 * @param track The track to skip
 */
function disableOthers(list, track) {
    for (let i = 0; i < list.length; i++) {
        if (track.id === list[i].id) {
            continue;
        }
        // another audio track is enabled, disable it
        list[i].enabled = false;
    }
}
/**
 * The current list of {@link AudioTrack} for a media file.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#audiotracklist}
 */
export class AudioTrackList extends TrackList {
    onaddtrack;
    onchange;
    onremovetrack;
    constructor(tracks = []) {
        // make sure only 1 track is enabled
        // sorted from last index to first index
        for (let i = tracks.length - 1; i >= 0; i--) {
            if (tracks[i].enabled) {
                disableOthers(tracks, tracks[i]);
                break;
            }
        }
        super(tracks);
        this.onaddtrack = null;
        this.onchange = null;
        this.onremovetrack = null;
    }
    /**
     * Add an {@link AudioTrack} to the `AudioTrackList`.
     *
     * @param track The AudioTrack to add to the list
     */
    addTrack(track) {
        if (track.enabled) {
            disableOthers(this, track);
        }
        super.addTrack(track);
        track.onenabledchange = () => {
            // when we are disabling other tracks (since we don't support
            // more than one track at a time) we will set changing
            // to true so that we don't trigger additional change events
            if (this._changing) {
                return;
            }
            this._changing = true;
            disableOthers(this, track);
            this._changing = false;
            this.dispatchEvent(new Event('change'));
        };
    }
}
