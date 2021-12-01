import { TrackList } from './TrackList';
import { VideoTrack } from './VideoTrack';

export interface VideoTrackEvent extends Event {
    track: VideoTrack | null;
}

export interface VideoTrackListEventMap {
    addtrack: VideoTrackEvent;
    change: Event;
    removetrack: VideoTrackEvent;
}

/**
 * Un-select all other {@link VideoTrack}s that are selected.
 *
 * @param list list to work on
 *
 * @param track The track to skip
 */
function disableOthers(list: ArrayLike<VideoTrack>, track: VideoTrack): void {
    for (let i = 0; i < list.length; i++) {
        if (!Object.keys(list[i]).length || track.id === list[i].id) {
            continue;
        }
        // another video track is enabled, disable it
        list[i].selected = false;
    }
}

/**
 * The current list of {@link VideoTrack} for a video.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#videotracklist}
 */
export class VideoTrackList extends TrackList<VideoTrack> {
    public onaddtrack:
        | ((this: VideoTrackList, ev: VideoTrackEvent) => unknown)
        | null;
    public onchange: ((this: VideoTrackList, ev: Event) => unknown) | null;
    public onremovetrack:
        | ((this: VideoTrackList, ev: VideoTrackEvent) => unknown)
        | null;

    constructor(tracks: ReadonlyArray<VideoTrack> = []) {
        // make sure only 1 track is enabled
        // sorted from last index to first index
        for (let i = tracks.length - 1; i >= 0; i--) {
            if (tracks[i].selected) {
                disableOthers(tracks, tracks[i]);
                break;
            }
        }
        super(tracks);

        this.onaddtrack = null;
        this.onchange = null;
        this.onremovetrack = null;
    }

    public get selectedIndex(): number {
        for (let i = 0; i < this.length; i++) {
            if (this[i].selected) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Add a {@link VideoTrack} to the `VideoTrackList`.
     *
     * @param track The VideoTrack to add to the list
     */
    addTrack(track: VideoTrack): void {
        if (track.selected) {
            disableOthers(this, track);
        }

        super.addTrack(track);

        track.onselectedchange = () => {
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
