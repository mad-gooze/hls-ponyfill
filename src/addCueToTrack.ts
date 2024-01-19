export function addCueToTrack(track: TextTrack, cue: VTTCue): void {
    if (!track.cues || track.cues.getCueById(cue.id)) {
        return;
    }
    // Sometimes there are cue overlaps on segmented vtts so the same
    // cue can appear more than once in different vtt files.
    // This avoid showing duplicated cues with same timecode and text.
    const mode = track.mode;
    if (mode === 'disabled') {
        track.mode = 'hidden';
    }
    try {
        track.addCue(cue);
    } catch (err) {
        try {
            const textTrackCue = new (TextTrackCue as any)(
                cue.startTime,
                cue.endTime,
                cue.text,
            );
            textTrackCue.id = cue.id;
            track.addCue(textTrackCue);
        } catch {
            //
        }
    }
    if (mode === 'disabled') {
        track.mode = mode;
    }
}