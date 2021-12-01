import type Hls from 'hls.js';
import type { Fragment } from 'hls.js';
import { checkIndex } from '../checkIndex';
import { getHlsLevelDetails } from '../getHlsLevelDetails';

export class SeekableTimeRanges implements TimeRanges {
    constructor(
        private getHls: () => Hls | undefined,
        private seekable: TimeRanges,
    ) {
        //
    }

    private getFragments(): Fragment[] | undefined {
        const hls = this.getHls();
        if (hls === undefined) {
            return undefined;
        }
        const { fragments = [] } = getHlsLevelDetails(hls) || {};
        return fragments;
    }

    public get length(): number {
        const fragments = this.getFragments();
        if (fragments === undefined) {
            return this.seekable.length;
        } else if (fragments.length === 0) {
            return 0;
        } else {
            return 1;
        }
    }

    public start(index: number): number {
        const fragments = this.getFragments();
        if (fragments === undefined) {
            return this.seekable.start(0);
        }
        checkIndex(index, fragments.length === 0 ? 0 : 1);
        return fragments[0].start;
    }

    public end(index: number): number {
        const fragments = this.getFragments();
        if (fragments === undefined) {
            return this.seekable.start(0);
        }
        checkIndex(index, fragments.length === 0 ? 0 : 1);

        const { start, duration } = fragments[fragments.length - 1];
        return start + duration;
    }
}
