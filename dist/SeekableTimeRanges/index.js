import { checkIndex } from '../checkIndex';
import { getHlsLevelDetails } from '../getHlsLevelDetails';
export class SeekableTimeRanges {
    getHls;
    seekable;
    constructor(getHls, seekable) {
        this.getHls = getHls;
        this.seekable = seekable;
        //
    }
    getFragments() {
        const hls = this.getHls();
        if (hls === undefined) {
            return undefined;
        }
        const { fragments = [] } = getHlsLevelDetails(hls) || {};
        return fragments;
    }
    get length() {
        const fragments = this.getFragments();
        if (fragments === undefined) {
            return this.seekable.length;
        }
        else if (fragments.length === 0) {
            return 0;
        }
        else {
            return 1;
        }
    }
    start(index) {
        const fragments = this.getFragments();
        if (fragments === undefined) {
            return this.seekable.start(0);
        }
        checkIndex(index, fragments.length === 0 ? 0 : 1);
        return fragments[0].start;
    }
    end(index) {
        const fragments = this.getFragments();
        if (fragments === undefined) {
            return this.seekable.start(0);
        }
        checkIndex(index, fragments.length === 0 ? 0 : 1);
        const { start, duration } = fragments[fragments.length - 1];
        return start + duration;
    }
}
