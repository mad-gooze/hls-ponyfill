import type Hls from 'hls.js';
export declare class SeekableTimeRanges implements TimeRanges {
    private getHls;
    private seekable;
    constructor(getHls: () => Hls | undefined, seekable: TimeRanges);
    private getFragments;
    get length(): number;
    start(index: number): number;
    end(index: number): number;
}
