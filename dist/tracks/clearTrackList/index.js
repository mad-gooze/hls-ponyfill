export function clearTrackList(trackList) {
    if (trackList === undefined) {
        return;
    }
    while (trackList.length > 0) {
        trackList.removeTrack(trackList[0]);
    }
}
