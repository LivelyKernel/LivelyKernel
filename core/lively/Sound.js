module('lively.Sound').requires().requiresLib({url: Config.codeBase+'lib/xaudio/resampler.js', loadTest: function() {return typeof Resampler !== "undefined"}, sync: true}).requiresLib({url: Config.codeBase+'lib/xaudio/XAudioServer.js', loadTest: function() {return typeof XAudioServer !== "undefined"}, sync: true}).toRun(function() {

Object.subclass("lively.Sound.AbstractSound", {
    aboutMe: function() {
        // This is the superclass of FMSound, SampledSound, etc.  
        // It establishes the protocol for sequencing in time, mixing at one time,
        // adding envelopes, and generating samples.  
        // There is history here...
        // The unified hierarchy of sounds and synthesis protocol is primarily the
        // work of John Maloney in Squeak Smalltalk, but it built on earlier work by
        // Alan Kay, Bob Shur, Steve Purcell, Steve Saunders and Ted Kaehler.
        // This adaptation to JavaScript, with many simplifications possible due to 
        // more cycles and floating point, is the work of Dan Ingalls
    },

    initialize: function() {
        this.envelopes = [];
        this.scaledVol = 1;  // was ScaleFactor
        this.scaledVolIncr = 0;
        return this.reset();
    },

    clone: function() { 
        return new this.constructor(this);
    },

    addEnvelope: function(env) {
        // Add the given envelope to my envelopes list.
        this.envelopes.push(env);
    },

    copy: function() { 
        var snd = this.clone();
        Properties.own(this).forEach( function (n) {snd[n] = this[n]}.bind(this))
        return snd;
    },

    setPitchDurLoudness: function(pitchNameOrNumber, dur, loud) {
        // Initialize my envelopes for the given parameters.
        // Subclasses overriding this method should include a resend to super."
        var p = this.nameOrNumberToPitch(pitchNameOrNumber);
        this.pitch = p;
        this.duration = dur;
        this.loudness = loud;
        this.initialCount = dur * this.samplingRate();
    },

    samplesRemaining: function() {
        return this.count;
    },

    adjustVolumeTo: function(vol, mSecs) {
        // Adjust the volume of this sound to the given volume, a number in the range [0.0..1.0],
        // over the given number of milliseconds. The volume will be changed a little bit on each
        // sample until the desired volume is reached.
        if (mSecs == 0) {
                this.scaledVol = vol;
                this.scaledVolIncr = 0;
            } else {
                this.scaledVolIncr = (vol - this.scaledVol) / ((this.samplingRate() / 1000) * mSecs);
            };
    },

    mixSampleCountIntoBufferStartingAt: function(n, aSoundBuffer, startIndex, samplingRate) {
        // Mix the next n samples of this sound into the given buffer starting at the given index.
        // This is the outer synthesis method to produce n samples for output.  Since this may
        // cover 100-200 milliseconds, it is broken up here into a number of shorter calls on
        // the actual mixSamples... method interspersed with calls to update time-varying
        // parameters according envelope control points every 10 millisecons or so.
        var fullVol = 1.0;
        var pastEnd = startIndex + n;  // index just after the last sample 
        var i = startIndex;
        var sampsPerMS = this.samplingRate() / 1000;
        while (i < pastEnd) {
            var remainingSamples = this.samplesRemaining();
            if (remainingSamples <= 0) return;
            var sampCount = Math.min(pastEnd - i, this.samplesUntilNextControl, remainingSamples);
            if (sampCount > 0)
                this.mixSamplesToBuffer(sampCount, aSoundBuffer, i, fullVol, fullVol);
            this.samplesUntilNextControl -= sampCount;
            if (this.samplesUntilNextControl <= 0) {
                this.doControl(sampCount/sampsPerMS);
                this.samplesUntilNextControl = sampsPerMS * this.controlInterval();
            }
            i = i + sampCount;
        }
    },

    play: function() {
        this.findPlayer().playSound(this)
    },

    findPlayer: function() {// Look for an outside player and return it if found
        var player = $morph('PianoKeyboard'); 
        return player;
    },

    reset: function() {
        // Reset my internal state for a replay. 
        // Methods that override this method should do super reset."
        this.mSecsSinceStart = 0;
        this.samplesUntilNextControl = 0;
        this.scaledVol = this.loudness;
        this.scaledVolIncr = 0;
        this.count = this.initialCount;
        this.envelopes.forEach(function(e) {e.reset(this); }.bind(this));
        return this;
    },

    setScaledVol: function(v) {
        this.scaledVol = v;
    },

    nameOrNumberToPitch: function(aStringOrNumber) {
        // Answer the pitch in cycles/second for the given pitch specification.
        // The specification can be either a numeric pitch or pitch name such as 'c4'.

        if (typeof aStringOrNumber == "number") return aStringOrNumber;
        return lively.Sound.AbstractSound.pitchForName(aStringOrNumber);
    },

    doControl: function(msPast) { 
        // Update the control parameters of this sound using its envelopes, if any.
        // This is only called at a small fraction of the sampling rate.
        this.mSecsSinceStart += msPast;
        this.envelopes.forEach (function(env) { env.updateTargetAt(this, this.mSecsSinceStart) }.bind(this));
    },

    samplingRate: function() {
        return 44100;
    },

    controlInterval: function() {
        // Return the number of milliseconds between control updates
        return 10;
    },
    
    basePitch: function() {
        return this.pitch;
    },

    getDurationMS: function() {
        return this.duration*1000;
    },

    stopGracefully: function() {
        // Stop this note from playing, as when a key on the keyboard is released
        this.count = this.samplingRate() * 0.5;  // Play for 0.5 sec more
        if (this.envelopes.length > 0)  // ...or enough time to play out the attack phase
            this.count = this.samplingRate() * (this.envelopes.first().decayMS/1000)
    },

});

Object.extend(lively.Sound.AbstractSound, {
    ScaleFactor: 1,

    bachFugue: function() { 
        // Play a fugue by J. S. Bach using an instance of me as the sound for all four voices.
        // lively.Sound.AbstractSound.bachFugue().play()
        return this.bachFugueOn(new lively.Sound.PluckedSound());
    },

    bachFugueOn: function(aSound) {
        // Play a fugue by J. S. Bach using the given sound as the sound for all four voices.
        // AbstractSound.bachFugue().play()
        var mix = new lively.Sound.MixedSound(); 
        mix.add(this.bachFugueV1On(aSound), 1.0);
        mix.add(this.bachFugueV2On(aSound), 0.0);
        mix.add(this.bachFugueV3On(aSound), 1.0);
        mix.add(this.bachFugueV4On(aSound), 0.0);
        return mix;
    },

    bachFugueV1On: function(aSound) {
        // Voice one of a fugue by J. S. Bach.
        return this.noteSequenceOn(aSound,
        [
    	[1047, 0.15, 268],
    	[988, 0.15, 268],
    	[1047, 0.3, 268],
    	[784, 0.3, 268],
    	[831, 0.3, 268],
    	[1047, 0.15, 268],
    	[988, 0.15, 268],
    	[1047, 0.3, 268],
    	[1175, 0.3, 268],
    	[784, 0.3, 268],
    	[1047, 0.15, 268],
    	[988, 0.15, 268],
    	[1047, 0.3, 268],
    	[1175, 0.3, 268],
    	[698, 0.15, 268],
    	[784, 0.15, 268],
    	[831, 0.6, 268],
    	[784, 0.15, 268],
    	[698, 0.15, 268],
    	[622, 0.15, 268],
    	[1047, 0.15, 268],
    	[988, 0.15, 268],
    	[880, 0.15, 268],
    	[784, 0.15, 268],
    	[698, 0.15, 268],
    	[622, 0.15, 268],
    	[587, 0.15, 268],
    	[523, 0.3, 268],
    	[1245, 0.3, 268],
    	[1175, 0.3, 268],
    	[1047, 0.3, 268],
    	[932, 0.3, 268],
    	[880, 0.3, 268],
    	[932, 0.3, 268],
    	[1047, 0.3, 268],
    	[740, 0.3, 268],
    	[784, 0.3, 268],
    	[880, 0.3, 268],
    	[740, 0.3, 268],
    	[784, 0.6, 268],
    	[0, 0.15, 0],
    	[523, 0.15, 268],
    	[587, 0.15, 268],
    	[622, 0.15, 268],
    	[698, 0.15, 268],
    	[784, 0.15, 268],
    	[831, 0.45, 268],
    	[587, 0.15, 268],
    	[622, 0.15, 268],
    	[698, 0.15, 268],
    	[784, 0.15, 268],
    	[880, 0.15, 268],
    	[932, 0.45, 268],
    	[622, 0.15, 268],
    	[698, 0.15, 268],
    	[784, 0.15, 268],
    	[831, 0.15, 268],
    	[784, 0.15, 268],
    	[698, 0.15, 268],
    	[622, 0.15, 268],
    	[587, 0.3, 268],
    	[1047, 0.15, 268],
    	[988, 0.15, 268],
    	[1047, 0.6, 268],
    	[0, 0.9, 0],
    	[1397, 0.3, 268],
    	[1245, 0.3, 268],
    	[1175, 0.3, 268],
    	[0, 0.3, 0],
    	[831, 0.3, 268],
    	[784, 0.3, 268],
    	[698, 0.3, 268],
    	[784, 0.3, 268],
    	[698, 0.15, 268],
    	[622, 0.15, 268],
    	[698, 0.3, 268],
    	[587, 0.3, 268],
    	[784, 0.6, 268],
    	[0, 0.3, 0],
    	[988, 0.3, 268],
    	[1047, 0.3, 268],
    	[1047, 0.15, 268],
    	[988, 0.15, 268],
    	[1047, 0.3, 268],
    	[784, 0.3, 268],
    	[831, 0.6, 268],
    	[0, 0.3, 0],
    	[880, 0.3, 268],
    	[932, 0.3, 268],
    	[932, 0.15, 268],
    	[880, 0.15, 268],
    	[932, 0.3, 268],
    	[698, 0.3, 268],
    	[784, 0.6, 268],
    	[0, 0.3, 0],
    	[784, 0.3, 268],
    	[831, 0.3, 268],
    	[831, 0.3, 268],
    	[784, 0.3, 268],
    	[698, 0.3, 268],
    	[0, 0.3, 0],
    	[415, 0.3, 268],
    	[466, 0.3, 268],
    	[523, 0.3, 268],
    	[0, 0.3, 0],
    	[415, 0.15, 268],
    	[392, 0.15, 268],
    	[415, 0.3, 268],
    	[349, 0.3, 268],
    	[466, 0.3, 268],
    	[523, 0.3, 268],
    	[466, 0.3, 268],
    	[415, 0.3, 268],
    	[466, 0.3, 268],
    	[392, 0.3, 268],
    	[349, 0.3, 268],
    	[311, 0.3, 268],
    	[349, 0.3, 268],
    	[554, 0.3, 268],
    	[523, 0.3, 268],
    	[466, 0.3, 268],
    	[523, 0.3, 268],
    	[415, 0.3, 268],
    	[392, 0.3, 268],
    	[349, 0.3, 268],
    	[392, 0.3, 268],
    	[784, 0.15, 268],
    	[740, 0.15, 268],
    	[784, 0.3, 268],
    	[523, 0.3, 268],
    	[622, 0.3, 268],
    	[784, 0.15, 268],
    	[740, 0.15, 268],
    	[784, 0.3, 268],
    	[880, 0.3, 268],
    	[587, 0.3, 268],
    	[784, 0.15, 268],
    	[740, 0.15, 268],
    	[784, 0.3, 268],
    	[880, 0.3, 268],
    	[523, 0.15, 268],
    	[587, 0.15, 268],
    	[622, 0.6, 268],
    	[587, 0.15, 268],
    	[523, 0.15, 268],
    	[466, 0.3, 346],
    	[0, 0.45, 0],
    	[587, 0.15, 346],
    	[659, 0.15, 346],
    	[740, 0.15, 346],
    	[784, 0.15, 346],
    	[880, 0.15, 346],
    	[932, 0.45, 346],
    	[659, 0.15, 346],
    	[698, 0.15, 346],
    	[784, 0.15, 346],
    	[880, 0.15, 346],
    	[932, 0.15, 346],
    	[1047, 0.45, 346],
    	[740, 0.15, 346],
    	[784, 0.15, 346],
    	[880, 0.15, 346],
    	[932, 0.3, 346],
    	[622, 0.15, 346],
    	[587, 0.15, 346],
    	[622, 0.3, 346],
    	[392, 0.3, 346],
    	[415, 0.3, 346],
    	[698, 0.15, 346],
    	[622, 0.15, 346],
    	[698, 0.3, 346],
    	[440, 0.3, 346],
    	[466, 0.3, 346],
    	[784, 0.15, 346],
    	[698, 0.15, 346],
    	[784, 0.3, 346],
    	[494, 0.3, 346],
    	[523, 0.15, 346],
    	[698, 0.15, 346],
    	[622, 0.15, 346],
    	[587, 0.15, 346],
    	[523, 0.15, 346],
    	[466, 0.15, 346],
    	[440, 0.15, 346],
    	[392, 0.15, 346],
    	[349, 0.3, 346],
    	[831, 0.3, 346],
    	[784, 0.3, 346],
    	[698, 0.3, 346],
    	[622, 0.3, 346],
    	[587, 0.3, 346],
    	[622, 0.3, 346],
    	[698, 0.3, 346],
    	[494, 0.3, 346],
    	[523, 0.3, 346],
    	[587, 0.3, 346],
    	[494, 0.3, 346],
    	[523, 0.6, 346],
    	[0, 0.3, 0],
    	[659, 0.3, 346],
    	[698, 0.3, 346],
    	[698, 0.15, 346],
    	[659, 0.15, 346],
    	[698, 0.3, 346],
    	[523, 0.3, 346],
    	[587, 0.6, 346],
    	[0, 0.3, 0],
    	[587, 0.3, 346],
    	[622, 0.3, 346],
    	[622, 0.15, 346],
    	[587, 0.15, 346],
    	[622, 0.3, 346],
    	[466, 0.3, 346],
    	[523, 1.2, 346],
    	[523, 0.3, 346],
    	[587, 0.15, 346],
    	[622, 0.15, 346],
    	[698, 0.15, 346],
    	[622, 0.15, 346],
    	[698, 0.15, 346],
    	[587, 0.15, 346],
    	[494, 0.3, 457],
    	[0, 0.6, 0],
    	[494, 0.3, 457],
    	[523, 0.3, 457],
    	[0, 0.6, 0],
    	[622, 0.3, 457],
    	[587, 0.3, 457],
    	[0, 0.6, 0],
    	[698, 0.6, 457],
    	[0, 0.6, 0],
    	[698, 0.3, 457],
    	[622, 0.3, 457],
    	[831, 0.3, 457],
    	[784, 0.3, 457],
    	[698, 0.3, 457],
    	[622, 0.3, 457],
    	[587, 0.3, 457],
    	[622, 0.3, 457],
    	[698, 0.3, 457],
    	[494, 0.3, 457],
    	[523, 0.3, 457],
    	[587, 0.3, 457],
    	[494, 0.3, 457],
    	[494, 0.3, 457],
    	[523, 0.3, 457],
    	[0, 0.3, 0],
    	[523, 0.3, 457],
    	[698, 0.15, 457],
    	[587, 0.15, 457],
    	[622, 0.15, 457],
    	[523, 0.45, 457],
    	[494, 0.3, 457],
    	[523, 0.6, 457],
    	[0, 0.3, 0],
    	[659, 0.3, 268],
    	[698, 0.6, 268],
    	[0, 0.3, 0],
    	[698, 0.3, 268],
    	[698, 0.3, 268],
    	[622, 0.15, 268],
    	[587, 0.15, 268],
    	[622, 0.3, 268],
    	[698, 0.3, 268],
    	[587, 0.4, 268],
    	[0, 0.4, 0],
    	[587, 0.4, 268],
    	[0, 0.4, 0],
    	[523, 1.6, 268]
        ], Color.blue);
    },

    bachFugueV2On: function(aSound) {
        // Voice two of a fugue by J. S. Bach.
        return this.noteSequenceOn(aSound,
        [
    	[0, 4.8, 0],
    	[1568, 0.15, 346],
    	[1480, 0.15, 346],
    	[1568, 0.3, 346],
    	[1047, 0.3, 346],
    	[1245, 0.3, 346],
    	[1568, 0.15, 346],
    	[1480, 0.15, 346],
    	[1568, 0.3, 346],
    	[1760, 0.3, 346],
    	[1175, 0.3, 346],
    	[1568, 0.15, 346],
    	[1480, 0.15, 346],
    	[1568, 0.3, 346],
    	[1760, 0.3, 346],
    	[1047, 0.15, 346],
    	[1175, 0.15, 346],
    	[1245, 0.6, 346],
    	[1175, 0.15, 346],
    	[1047, 0.15, 346],
    	[932, 0.3, 346],
    	[1245, 0.15, 346],
    	[1175, 0.15, 346],
    	[1245, 0.3, 346],
    	[784, 0.3, 346],
    	[831, 0.3, 346],
    	[1397, 0.15, 346],
    	[1245, 0.15, 346],
    	[1397, 0.3, 346],
    	[880, 0.3, 346],
    	[932, 0.3, 346],
    	[1568, 0.15, 346],
    	[1397, 0.15, 346],
    	[1568, 0.3, 346],
    	[988, 0.3, 346],
    	[1047, 0.3, 346],
    	[1175, 0.15, 346],
    	[1245, 0.15, 346],
    	[1397, 0.9, 346],
    	[1245, 0.15, 346],
    	[1175, 0.15, 346],
    	[1047, 0.15, 346],
    	[932, 0.15, 346],
    	[831, 0.15, 346],
    	[784, 0.15, 346],
    	[698, 0.3, 346],
    	[1661, 0.3, 346],
    	[1568, 0.3, 346],
    	[1397, 0.3, 346],
    	[1245, 0.3, 346],
    	[1175, 0.3, 346],
    	[1245, 0.3, 346],
    	[1397, 0.3, 346],
    	[988, 0.3, 346],
    	[1047, 0.3, 346],
    	[1175, 0.3, 346],
    	[988, 0.3, 346],
    	[1047, 0.3, 457],
    	[1568, 0.15, 457],
    	[1480, 0.15, 457],
    	[1568, 0.3, 457],
    	[1175, 0.3, 457],
    	[1245, 0.6, 457],
    	[0, 0.3, 0],
    	[1319, 0.3, 457],
    	[1397, 0.3, 457],
    	[1397, 0.15, 457],
    	[1319, 0.15, 457],
    	[1397, 0.3, 457],
    	[1047, 0.3, 457],
    	[1175, 0.6, 457],
    	[0, 0.3, 0],
    	[1175, 0.3, 457],
    	[1245, 0.3, 457],
    	[1245, 0.15, 457],
    	[1175, 0.15, 457],
    	[1245, 0.3, 457],
    	[932, 0.3, 457],
    	[1047, 0.3, 457],
    	[1245, 0.15, 457],
    	[1175, 0.15, 457],
    	[1245, 0.3, 457],
    	[1397, 0.3, 457],
    	[932, 0.3, 457],
    	[1245, 0.15, 457],
    	[1175, 0.15, 457],
    	[1245, 0.3, 457],
    	[1397, 0.3, 457],
    	[831, 0.15, 457],
    	[932, 0.15, 457],
    	[1047, 0.6, 457],
    	[932, 0.15, 457],
    	[831, 0.15, 457],
    	[784, 0.15, 457],
    	[622, 0.15, 457],
    	[698, 0.15, 457],
    	[784, 0.15, 457],
    	[831, 0.15, 457],
    	[932, 0.15, 457],
    	[1047, 0.15, 457],
    	[1175, 0.15, 457],
    	[1245, 0.15, 457],
    	[1175, 0.15, 457],
    	[1047, 0.15, 457],
    	[1175, 0.15, 457],
    	[1245, 0.15, 457],
    	[1397, 0.15, 457],
    	[1568, 0.15, 457],
    	[1760, 0.15, 457],
    	[1865, 0.15, 457],
    	[698, 0.15, 457],
    	[784, 0.15, 457],
    	[831, 0.15, 457],
    	[932, 0.15, 457],
    	[1047, 0.15, 457],
    	[1175, 0.15, 457],
    	[1319, 0.15, 457],
    	[1397, 0.15, 457],
    	[1245, 0.15, 457],
    	[1175, 0.15, 457],
    	[1245, 0.15, 457],
    	[1397, 0.15, 457],
    	[1568, 0.15, 457],
    	[1760, 0.15, 457],
    	[1976, 0.15, 457],
    	[2093, 0.3, 457],
    	[1976, 0.15, 457],
    	[1760, 0.15, 457],
    	[1568, 0.15, 457],
    	[1397, 0.15, 457],
    	[1245, 0.15, 457],
    	[1175, 0.15, 457],
    	[1047, 0.3, 457],
    	[1245, 0.3, 457],
    	[1175, 0.3, 457],
    	[1047, 0.3, 457],
    	[932, 0.3, 457],
    	[880, 0.3, 457],
    	[932, 0.3, 457],
    	[1047, 0.3, 457],
    	[740, 0.3, 457],
    	[784, 0.3, 457],
    	[880, 0.3, 457],
    	[740, 0.3, 457],
    	[784, 0.3, 457],
    	[1175, 0.15, 457],
    	[1047, 0.15, 457],
    	[1175, 0.3, 457],
    	[0, 0.6, 0],
    	[1319, 0.15, 457],
    	[1175, 0.15, 457],
    	[1319, 0.3, 457],
    	[0, 0.6, 0],
    	[1480, 0.15, 457],
    	[1319, 0.15, 457],
    	[1480, 0.3, 457],
    	[0, 0.6, 0],
    	[784, 0.15, 457],
    	[698, 0.15, 457],
    	[784, 0.3, 457],
    	[0, 0.6, 0],
    	[880, 0.15, 457],
    	[784, 0.15, 457],
    	[880, 0.3, 457],
    	[0, 0.6, 0],
    	[988, 0.15, 457],
    	[880, 0.15, 457],
    	[988, 0.3, 457],
    	[0, 0.6, 0],
    	[1047, 0.15, 457],
    	[988, 0.15, 457],
    	[1047, 0.3, 457],
    	[784, 0.3, 457],
    	[831, 0.3, 457],
    	[1047, 0.15, 457],
    	[988, 0.15, 457],
    	[1047, 0.3, 457],
    	[1175, 0.3, 457],
    	[784, 0.3, 457],
    	[1047, 0.15, 457],
    	[988, 0.15, 457],
    	[1047, 0.3, 457],
    	[1175, 0.3, 457],
    	[698, 0.15, 457],
    	[784, 0.15, 457],
    	[831, 0.6, 457],
    	[784, 0.15, 457],
    	[698, 0.15, 457],
    	[622, 0.3, 457],
    	[1047, 0.15, 457],
    	[988, 0.15, 457],
    	[1047, 0.3, 457],
    	[784, 0.3, 457],
    	[831, 0.6, 457],
    	[0, 0.3, 0],
    	[880, 0.3, 457],
    	[932, 0.3, 457],
    	[932, 0.15, 457],
    	[880, 0.15, 457],
    	[932, 0.3, 457],
    	[698, 0.3, 457],
    	[784, 0.6, 457],
    	[0, 0.3, 0],
    	[784, 0.6, 457],
    	[831, 0.15, 457],
    	[932, 0.15, 457],
    	[1047, 0.15, 457],
    	[988, 0.15, 457],
    	[1047, 0.15, 457],
    	[831, 0.15, 457],
    	[698, 1.2, 457],
    	[698, 0.3, 591],
    	[1175, 0.15, 591],
    	[1047, 0.15, 591],
    	[1175, 0.3, 591],
    	[698, 0.3, 591],
    	[622, 0.3, 591],
    	[1245, 0.15, 591],
    	[1175, 0.15, 591],
    	[1245, 0.3, 591],
    	[784, 0.3, 591],
    	[698, 0.3, 591],
    	[1397, 0.15, 591],
    	[1245, 0.15, 591],
    	[1397, 0.3, 591],
    	[831, 0.3, 591],
    	[784, 0.15, 591],
    	[1397, 0.15, 591],
    	[1245, 0.15, 591],
    	[1175, 0.15, 591],
    	[1047, 0.15, 591],
    	[988, 0.15, 591],
    	[880, 0.15, 591],
    	[784, 0.15, 591],
    	[1047, 0.3, 591],
    	[1397, 0.3, 591],
    	[1245, 0.3, 591],
    	[1175, 0.3, 591],
    	[0, 0.3, 0],
    	[831, 0.3, 591],
    	[784, 0.3, 591],
    	[698, 0.3, 591],
    	[784, 0.3, 591],
    	[698, 0.15, 591],
    	[622, 0.15, 591],
    	[698, 0.3, 591],
    	[587, 0.3, 591],
    	[831, 0.3, 591],
    	[784, 0.3, 591],
    	[0, 0.3, 0],
    	[880, 0.3, 591],
    	[988, 0.3, 591],
    	[1047, 0.3, 591],
    	[698, 0.15, 591],
    	[622, 0.15, 591],
    	[587, 0.15, 591],
    	[523, 0.15, 591],
    	[523, 0.3, 591],
    	[1047, 0.15, 346],
    	[988, 0.15, 346],
    	[1047, 0.3, 346],
    	[784, 0.3, 346],
    	[831, 0.3, 346],
    	[1047, 0.15, 346],
    	[988, 0.15, 346],
    	[1047, 0.3, 346],
    	[1175, 0.3, 346],
    	[784, 0.3, 346],
    	[1047, 0.15, 346],
    	[988, 0.15, 346],
    	[1047, 0.3, 346],
    	[1175, 0.3, 346],
    	[698, 0.2, 346],
    	[784, 0.2, 346],
    	[831, 0.8, 346],
    	[784, 0.2, 346],
    	[698, 0.2, 346],
    	[659, 1.6, 346]
    	], Color.green);
    },

    bachFugueV3On: function(aSound) {
        // Voice three of a fugue by J. S. Bach.
        return this.noteSequenceOn(aSound,
        [
    	[0, 14.4, 0],
    	[523, 0.15, 457],
    	[494, 0.15, 457],
    	[523, 0.3, 457],
    	[392, 0.3, 457],
    	[415, 0.3, 457],
    	[523, 0.15, 457],
    	[494, 0.15, 457],
    	[523, 0.3, 457],
    	[587, 0.3, 457],
    	[392, 0.3, 457],
    	[523, 0.15, 457],
    	[494, 0.15, 457],
    	[523, 0.3, 457],
    	[587, 0.3, 457],
    	[349, 0.15, 457],
    	[392, 0.15, 457],
    	[415, 0.6, 457],
    	[392, 0.15, 457],
    	[349, 0.15, 457],
    	[311, 0.15, 457],
    	[523, 0.15, 457],
    	[494, 0.15, 457],
    	[440, 0.15, 457],
    	[392, 0.15, 457],
    	[349, 0.15, 457],
    	[311, 0.15, 457],
    	[294, 0.15, 457],
    	[262, 0.15, 457],
    	[294, 0.15, 457],
    	[311, 0.15, 457],
    	[294, 0.15, 457],
    	[262, 0.15, 457],
    	[233, 0.15, 457],
    	[208, 0.15, 457],
    	[196, 0.15, 457],
    	[175, 0.15, 457],
    	[466, 0.15, 457],
    	[415, 0.15, 457],
    	[392, 0.15, 457],
    	[349, 0.15, 457],
    	[311, 0.15, 457],
    	[294, 0.15, 457],
    	[262, 0.15, 457],
    	[233, 0.15, 457],
    	[262, 0.15, 457],
    	[294, 0.15, 457],
    	[262, 0.15, 457],
    	[233, 0.15, 457],
    	[208, 0.15, 457],
    	[196, 0.15, 457],
    	[175, 0.15, 457],
    	[156, 0.15, 457],
    	[415, 0.15, 457],
    	[392, 0.15, 457],
    	[349, 0.15, 457],
    	[311, 0.15, 457],
    	[277, 0.15, 457],
    	[262, 0.15, 457],
    	[233, 0.15, 457],
    	[208, 0.3, 457],
    	[523, 0.3, 457],
    	[466, 0.3, 457],
    	[415, 0.3, 457],
    	[392, 0.3, 457],
    	[349, 0.3, 457],
    	[392, 0.3, 457],
    	[415, 0.3, 457],
    	[294, 0.3, 457],
    	[311, 0.3, 457],
    	[349, 0.3, 457],
    	[294, 0.3, 457],
    	[311, 0.3, 457],
    	[415, 0.3, 457],
    	[392, 0.3, 457],
    	[349, 0.3, 457],
    	[392, 0.3, 457],
    	[311, 0.3, 457],
    	[294, 0.3, 457],
    	[262, 0.3, 457],
    	[294, 0.3, 457],
    	[466, 0.3, 457],
    	[415, 0.3, 457],
    	[392, 0.3, 457],
    	[415, 0.3, 457],
    	[349, 0.3, 457],
    	[311, 0.3, 457],
    	[294, 0.3, 457],
    	[311, 0.3, 457],
    	[0, 1.2, 0],
    	[262, 0.3, 457],
    	[233, 0.3, 457],
    	[220, 0.3, 457],
    	[0, 0.3, 0],
    	[311, 0.3, 457],
    	[294, 0.3, 457],
    	[262, 0.3, 457],
    	[294, 0.3, 457],
    	[262, 0.15, 457],
    	[233, 0.15, 457],
    	[262, 0.3, 457],
    	[294, 0.3, 457],
    	[196, 0.3, 591],
    	[466, 0.15, 591],
    	[440, 0.15, 591],
    	[466, 0.3, 591],
    	[294, 0.3, 591],
    	[311, 0.3, 591],
    	[523, 0.15, 591],
    	[466, 0.15, 591],
    	[523, 0.3, 591],
    	[330, 0.3, 591],
    	[349, 0.3, 591],
    	[587, 0.15, 591],
    	[523, 0.15, 591],
    	[587, 0.3, 591],
    	[370, 0.3, 591],
    	[392, 0.6, 591],
    	[0, 0.15, 0],
    	[196, 0.15, 591],
    	[220, 0.15, 591],
    	[247, 0.15, 591],
    	[262, 0.15, 591],
    	[294, 0.15, 591],
    	[311, 0.45, 591],
    	[220, 0.15, 591],
    	[233, 0.15, 591],
    	[262, 0.15, 591],
    	[294, 0.15, 591],
    	[311, 0.15, 591],
    	[349, 0.45, 591],
    	[247, 0.15, 591],
    	[262, 0.15, 591],
    	[294, 0.15, 591],
    	[311, 0.3, 591],
    	[0, 0.6, 0],
    	[330, 0.3, 591],
    	[349, 0.3, 591],
    	[175, 0.3, 591],
    	[156, 0.3, 591],
    	[147, 0.3, 591],
    	[0, 0.3, 0],
    	[208, 0.3, 591],
    	[196, 0.3, 591],
    	[175, 0.3, 591],
    	[196, 0.3, 591],
    	[175, 0.15, 591],
    	[156, 0.15, 591],
    	[175, 0.3, 591],
    	[196, 0.3, 591],
    	[262, 0.15, 591],
    	[294, 0.15, 591],
    	[311, 0.15, 591],
    	[294, 0.15, 591],
    	[262, 0.15, 591],
    	[233, 0.15, 591],
    	[208, 0.15, 591],
    	[196, 0.15, 591],
    	[175, 0.15, 591],
    	[466, 0.15, 591],
    	[415, 0.15, 591],
    	[392, 0.15, 591],
    	[349, 0.15, 591],
    	[311, 0.15, 591],
    	[294, 0.15, 591],
    	[262, 0.15, 591],
    	[233, 0.15, 591],
    	[262, 0.15, 591],
    	[294, 0.15, 591],
    	[262, 0.15, 591],
    	[233, 0.15, 591],
    	[208, 0.15, 591],
    	[196, 0.15, 591],
    	[175, 0.15, 591],
    	[156, 0.15, 591],
    	[415, 0.15, 591],
    	[392, 0.15, 591],
    	[349, 0.15, 591],
    	[311, 0.15, 591],
    	[294, 0.15, 591],
    	[262, 0.15, 591],
    	[233, 0.15, 591],
    	[208, 0.15, 591],
    	[233, 0.15, 591],
    	[262, 0.15, 591],
    	[233, 0.15, 591],
    	[208, 0.15, 591],
    	[196, 0.15, 591],
    	[175, 0.15, 591],
    	[156, 0.15, 591],
    	[147, 0.15, 591],
    	[392, 0.15, 591],
    	[349, 0.15, 591],
    	[311, 0.15, 591],
    	[294, 0.15, 591],
    	[262, 0.15, 591],
    	[247, 0.15, 591],
    	[220, 0.15, 591],
    	[196, 0.6, 772],
    	[196, 0.6, 772],
    	[0, 0.15, 0],
    	[196, 0.15, 772],
    	[220, 0.15, 772],
    	[247, 0.15, 772],
    	[262, 0.15, 772],
    	[294, 0.15, 772],
    	[311, 0.15, 772],
    	[349, 0.15, 772],
    	[392, 0.15, 772],
    	[349, 0.15, 772],
    	[415, 0.15, 772],
    	[392, 0.15, 772],
    	[349, 0.15, 772],
    	[311, 0.15, 772],
    	[294, 0.15, 772],
    	[262, 0.15, 772],
    	[247, 0.3, 772],
    	[262, 0.15, 772],
    	[494, 0.15, 772],
    	[262, 0.3, 772],
    	[196, 0.3, 772],
    	[208, 0.3, 772],
    	[262, 0.15, 772],
    	[247, 0.15, 772],
    	[262, 0.3, 772],
    	[294, 0.3, 772],
    	[196, 0.3, 772],
    	[262, 0.15, 772],
    	[247, 0.15, 772],
    	[262, 0.3, 772],
    	[294, 0.3, 772],
    	[175, 0.15, 772],
    	[196, 0.15, 772],
    	[208, 0.6, 772],
    	[196, 0.15, 772],
    	[175, 0.15, 772],
    	[156, 0.6, 772],
    	[0, 0.3, 0],
    	[311, 0.3, 772],
    	[294, 0.3, 772],
    	[262, 0.3, 772],
    	[392, 0.3, 772],
    	[196, 0.3, 772],
    	[262, 3.6, 268],
    	[494, 0.4, 268],
    	[0, 0.4, 0],
    	[494, 0.4, 268],
    	[0, 0.4, 0],
    	[392, 1.6, 268]
    	], Color.orange);
    },

    bachFugueV4On: function(aSound) {
        // Voice four of a fugue by J. S. Bach.
        return this.noteSequenceOn(aSound,
        [
    	[0, 61.2, 0],
    	[131, 0.15, 500],
    	[123, 0.15, 500],
    	[131, 0.3, 500],
    	[98, 0.3, 500],
    	[104, 0.3, 500],
    	[131, 0.15, 500],
    	[123, 0.15, 500],
    	[131, 0.3, 500],
    	[147, 0.3, 500],
    	[98, 0.3, 500],
    	[131, 0.15, 500],
    	[123, 0.15, 500],
    	[131, 0.3, 500],
    	[147, 0.3, 500],
    	[87, 0.15, 500],
    	[98, 0.15, 500],
    	[104, 0.6, 500],
    	[98, 0.15, 500],
    	[87, 0.15, 500],
    	[78, 0.6, 500],
    	[0, 0.3, 0],
    	[156, 0.3, 500],
    	[147, 0.3, 500],
    	[131, 0.3, 500],
    	[196, 0.3, 500],
    	[98, 0.3, 500],
    	[131, 3.6, 268],
    	[131, 3.2, 205]
    	], Color.red);
    },

    bachFragmentOn: function(aSound) {
        // lively.Sound.AbstractSound.bachFragmentOn(new lively.Sound.PluckedSound).play()
        // lively.Sound.AbstractSound.bachFragmentOn(lively.Sound.FMSound.brass()).play()
        return this.noteSequenceOn(aSound,
        [
    	[1047, 0.15, 268],
    	[988, 0.15, 268],
    	[1047, 0.3, 268],
    	[784, 0.3, 268],
    	[831, 0.3, 268],
    	[1047, 0.15, 268],
    	[988, 0.15, 268],
    	[1047, 0.3, 268],
    	[1175, 0.3, 268],
    	[784, 0.3, 268],
    	[1047, 0.15, 268],
    	[988, 0.15, 268],
    	[1047, 0.3, 268],
    	[1175, 0.3, 268],
    	[698, 0.15, 268],
    	[784, 0.15, 268],
    	[831, 0.6, 268],
    	[784, 0.15, 268],
    	[698, 0.15, 268],
    	[622, 0.3, 268],
    	[0, 0.15, 0]
        ]);
    },

    noteSequenceOn: function(aSound, noteArray, noteColor) {
        // Build a note sequence (i.e., a SequentialSound) from the given array
        // using the given sound as the instrument. 
        // Elements are [pitch, duration, loudness] triples with loudness=0 for rests.
        // Loudness is given in an arbitrary scale with 1000 = max.
        // Pitches can be given as names or numbers.
        // noteColor, if specified is the color to be used for depressing these notes on a keyboard
        var score = new lively.Sound.SequentialSound();
        score.noteColor = noteColor;
        noteArray.forEach( function(elt) {
            if (elt[2] == 0) {
                score.add((new lively.Sound.RestSound()).setPitchDurLoudness(0, elt[1], 0));
            } else {
                pitch = aSound.nameOrNumberToPitch(elt[0]);
                score.add(aSound.copy().setPitchDurLoudness(pitch, elt[1], elt[2] / 1000));
            };
        });
        return score;
    },

});

lively.Sound.AbstractSound.subclass("lively.Sound.PluckedSound", {
    aboutMe: function() { 
        // The Karplus-Strong plucked string algorithm: start with a buffer full of random noise
        // and repeatedly play the contents of that buffer while averaging adjacent samples. 
        // High harmonics damp out more quickly, transfering their energy to lower ones. 
        // The length of the buffer corresponds to the length of the string. 
        // Adapted from John Maloney's Squeak code by Dan Ingalls
        // There was some noise in this (as in Squeak) because the table is only sampled, not
        // interpolated.  I therefore added interpolation and banished the sampling noise.
        },

    setPitchDurLoudness: function($super, pitchNameOrNumber, dur, loud) {
        $super(pitchNameOrNumber, dur, loud);
        this.damp = 0.5;  // simply average adjacent samples
        if (this.pitch > 400) this.damp = 100/this.pitch;  // damp higher frequencies slower
        var monoSampleCount =  0 | (this.samplingRate() / this.pitch);  // 0 | construct gives integer part
        this.ringSize = Math.max(2, monoSampleCount);
        this.indexIncrement = (this.pitch * monoSampleCount) / (this.samplingRate());
        return this.reset();
    },

    copy: function($super) { 
        var snd = $super();
        snd.ring = null;
        return snd;
    },

    reset: function($super) {
        $super(); 
        this.count = this.initialCount;
        this.scaledVol = this.loudness;
        this.index = 0;
        this.ring = null;  // will be allocated lazily to minimize storage needs
        return this;
    },

    mixSamplesToBuffer: function(n, buffer, startIndex, leftVol, rightVol) {
        // (new lively.Sound.PluckedSound).setPitchDurLoudness(220, 2, 1).play() 
        // Step through the ring, averaging adjacent samples, and mixing into the buffer

        this.ensureRing();  // Lazily created to minimize storage burden for long melodies
        // Force a smooth end in the last millisecond
        if (this.count-n < 50) this.scaledVolIncr = -this.scaledVol/n;
        var lastIndex = (startIndex + n) - 1;

        // this.index points to the ring of samples;  sliceIndex points into the output buffer...
        // Note: the pattern 0 | x forces a fast conversion to integer part
        for (var sliceIndex=startIndex; sliceIndex<=lastIndex; sliceIndex++) {
            var nextIndex = (this.index + this.indexIncrement) % this.ringSize;  // fraction remains

            // Interpolate the sample
            var i1 = 0|this.index;  // this integer sample point
            var i2 = 0|((this.index+1)%this.ringSize);  // next sample
            var f = this.index - i1;  // fractional step
            var thisSample = ((1-f)*this.ring[i1] + f*this.ring[i2]) * this.scaledVol;

            // Average adjacent values to damp out the high harmonics
            var d = this.damp;
            var average = this.ring[i1]*(1-d) + this.ring[0|nextIndex]*d;
            this.ring[i1] = average;

            // Output left and right samples and drop volume gracefully
            if (leftVol > 0) buffer[sliceIndex*2] += thisSample * leftVol;
            if (rightVol > 0) buffer[sliceIndex*2 + 1] += thisSample * rightVol;
            this.scaledVol += this.scaledVolIncr;
            this.index = nextIndex;
            }
        this.count -= n;
        if (this.count <= 0) this.ring = null;  // release storage to ease gc load
    },

    ensureRing: function() {
        // Ring buffer gets allocated lazily, and filled with white noise
        if (this.ring != null) return;
        this.ring = new Array(this.ringSize);
        for (var i=0; i<this.ringSize; i++) this.ring[i] = Math.random()*2-1;
    },

});


Object.extend(lively.Sound.PluckedSound, { 
    example: function() {
    	// lively.Sound.PluckedSound.example().play();
    	//  This one is so brief that it is still mostly noise...
    	//     (new lively.Sound.PluckedSound).setPitchDurLoudness(60, 0.05, 0.5).play();
    	var snd = new lively.Sound.PluckedSound;
        return snd.setPitchDurLoudness(220, 2.0, 0.3);
    }
});


lively.Sound.AbstractSound.subclass("lively.Sound.FMSound", {
    aboutMe: function() { 
        // FM synthesis begins with a simple sine-wave buffer that is sampled with a 
        // pointer increment designed to produce a given output pitch.
        // A second signal is generated by a similar process, and its value is added to 
        // the main sampling increment, thus affecting (modulating) that frequency
        // The two parameters modulation and ratio are used to control this algorithm:
        // Modulation determines how great the frequency deviation should be, and
        // ratio is the ratio of the modulating frequency to the fundamental pitch.
        // Yet to do: experiment with other waveforms in the waveTable
        // Adapted from John Maloney's Squeak code by Dan Ingalls
    },

    initialize: function($super) {
        $super();
        this.waveTable = lively.Sound.FMSound.ensureSineTable();
        return this.setPitchDurLoudness(440, 1, 0.3);
    },

    setPitchDurLoudness: function($super, pitchNameOrNumber, dur, loud) {
        $super(pitchNameOrNumber, dur, loud);
        if (this.modulation == null) this.modulation = 0;
        if (this.freqRatio == null) this.freqRatio = 0;
        return this.reset();
    },

    setModulationRatio: function(m, r) {
        // Set the modulation index and carrier to modulation frequency ratio for this sound
        this.setModulation(m);
        this.setRatio(r);
        return this;
    },

    setModulation: function(m) {
        this.modulation = Math.abs(m);
        return this;
    },

    setRatio: function(r) {
        this.freqRatio = Math.abs(r);
        return this;
    },

    copy: function($super) { 
        var snd = $super();
        return snd;
    },

    clone: function() { 
        return new this.constructor(this);
    },

    reset: function($super) {
        $super(); 
        this.count = this.initialCount;
        this.index = 0;
        this.indexIncrement = 0;
        this.offsetIndex = 0;
        if (this.pitch) this.setPitch(this.pitch);
        return this;
    },

    mixSamplesToBuffer: function(n, buffer, startIndex, leftVol, rightVol) {
        // (new lively.Sound.FMSound).setPitchDurLoudness(220, 2, 1).play() 
        if (this.count-n < 50) this.scaledVolIncr = -this.scaledVol/n;  // Force a smooth end
        var offsetIncr = this.freqRatio * this.indexIncrement;
        var normMod = this.modulation * this.indexIncrement;  // normalized modulation
        var lastIndex = (startIndex + n) - 1;
        var tableSize = this.waveTable.length
        var fudge = 1000*tableSize;  // Add this before mod to handle negative indices

        // You mean that's all there is to it??
        for (var sliceIndex=startIndex; sliceIndex<=lastIndex; sliceIndex++) {
            var thisSample = this.scaledVol * this.waveTable[0 | this.index];
            if (normMod > 0) { // Doing FM...
                var offset = normMod * this.waveTable[0 | this.offsetIndex];
                this.offsetIndex = (this.offsetIndex + offsetIncr) % tableSize;  // fraction remains
                this.index = (this.index + this.indexIncrement + offset + fudge) % tableSize;
            } else {  // No FM...
                this.index = (this.index + this.indexIncrement) % tableSize;
            }
            if (leftVol > 0) buffer[sliceIndex*2] += thisSample * leftVol;
            if (rightVol > 0) buffer[sliceIndex*2 + 1] += thisSample * rightVol;
            this.scaledVol += this.scaledVolIncr;
        } 
        this.count -= n;
    },

    setPitch: function(p) {
        // this sets the dynamic pitch as prescribed by an envelope
        this.indexIncrement = this.waveTable.length * p / this.samplingRate();
    },

});

Object.extend(lively.Sound.FMSound, { 
    example: function() {
        // lively.Sound.FMSound.example().play();
        // lively.Sound.AbstractSound.bachFugueOn(lively.Sound.FMSound.example()).play();
        var snd = new lively.Sound.FMSound;
        snd.setModulationRatio(0.3, 3);
        var p = [pt(0,0), pt(100,1), pt(200,1), pt(300, 0)];
        snd.addEnvelope(new lively.Sound.Envelope('volume', 0.5).setPointsLoopStartLoopEnd(p, 1, 2));
        return snd.setPitchDurLoudness(440, 1, 0.5);
    },

    brass: function() {
        // lively.Sound.FMSound.brass().play()
        // lively.Sound.AbstractSound.bachFugueOn(lively.Sound.FMSound.brass()).play();
        var snd = (new lively.Sound.FMSound).setModulationRatio(0, 1);
        var p = [pt(0,0), pt(30,0.8), pt(90,1.0), pt(120,0.9), pt(220,0.7), pt(320,0.9), pt(360,0)];
        snd.addEnvelope(new lively.Sound.Envelope('volume').setPointsLoopStartLoopEnd(p, 3, 5));
        p = [pt(0,0.5), pt(60,1.0), pt(120,0.8), pt(220,0.65), pt(320,0.8), pt(360,0)];
        snd.addEnvelope(new lively.Sound.Envelope('modulation', 5).setPointsLoopStartLoopEnd(p, 2, 4));
        return snd.setPitchDurLoudness(220, 1, 0.5);
    },

    clarinet: function() {
        // lively.Sound.FMSound.clarinet().play()
        // lively.Sound.AbstractSound.bachFugueOn(lively.Sound.FMSound.clarinet()).play();
        var snd = (new lively.Sound.FMSound).setModulationRatio(0, 2);
        var p = [pt(0,0), pt(60,1), pt(310,1), pt(350,0)];
        snd.addEnvelope(new lively.Sound.Envelope('volume').setPointsLoopStartLoopEnd(p, 1, 2));
        p = [pt(0,0), pt(60,0.106), pt(310,0.106), pt(350,0)];
        snd.addEnvelope(new lively.Sound.Envelope('modulation', 10).setPointsLoopStartLoopEnd(p, 1, 2));
        return snd.setPitchDurLoudness(220, 1, 0.5);
    },

    chime: function() {
        // lively.Sound.FMSound.chime().play()
        var snd = (new lively.Sound.FMSound).setModulationRatio(0, 2);
        snd.addEnvelope(new lively.Sound.Envelope('volume').setExponentialDecay(1.5));
        return snd.setPitchDurLoudness(1000, 1.5, 0.5);
    },

    ensureSineTable: function() {
    	if (this.SineTable) return this.SineTable;
        var tableSize = 4000;
    	this.SineTable = new Array(tableSize);
        var step = 2*Math.PI / tableSize;
        for (var i=0; i<tableSize; i++) this.SineTable[i] = Math.sin(i*step);
        return this.SineTable;
    },

});


Object.subclass("lively.Sound.Envelope", {
    aboutMe: function() { 
        // Envelopes are under construction...
        //
        // An envelope models a three-stage progression for a musical note: attack, sustain, decay. 
        // Envelopes can either return the envelope value at a given time or can update some target 
        // object using a client-specified message selector.
        // 
        // The points instance variable holds an array of (time, value) points, where the times 
        // are in milliseconds. The points array must contain at least two points. The time coordinate 
        // of the first point must be zero and the time coordinates of subsequent points must be in 
        // ascending order, although the spacing between them is arbitrary. Envelope values between 
        // points are computed by linear interpolation. 
        //  
        // The scale slot is initially set so that the peak of envelope matches some note attribute, 
        // such as its loudness. When entering the decay phase, the scale is adjusted so that the 
        // decay begins from the envelope's current value. This avoids a potential sharp transient 
        // when entering the decay phase.
        // 
        // The loopStartIndex and loopEndIndex slots contain the indices of points in the points array; 
        // if they are equal, then the envelope holds a constant value for the sustain phase of the 
        // note. Otherwise, envelope values are computed by repeatedly looping between these two points. 
        // 
        // In the case of very short notes, the value 
        // of scale is adjusted to start the decay phase with the current envelope value. 
        // Thus, if a note ends before its attack is complete, the decay phase is started immediately 
        // (i.e., the attack phase is never completed).
        // 
        // For best results, amplitude envelopes should start and end with zero values. Otherwise, 
        // the sharp transient at the beginning or end of the note may cause audible clicks or static. 
        // For envelopes on other parameters, this may not be necessary.
        //
        // I have departed substantially from the Squeak implementation in several respects:
        //      I have collapsed all the Envelope subclasses into one class
        //      I have taken all streaming state out of the envelopes thus allowing all notes
        //          of a given timbre to share the same Envelope object
        //      I have taken no care to support points of inflection other than
        //          on the 10ms doControl time grain.
        //
        //  Note:  I have not completed the protocol for noteOn/noteOff, namely the ability
        //    to give a huge duration to the note and then end it gracefully by changing its duration.
    },

    setPointsLoopStartLoopEnd: function(pointList, startIndex, endIndex) {
        // Note unlike Squeak, start and end are 0-based indices into pointList
        this.points = pointList;
        this.loopStartIndex = startIndex;
        this.loopEndIndex = endIndex;
        this.checkParameters;

        this.attackMS = this.mSecsAt(startIndex);
        this.decayMS = this.mSecsAt(this.points.length-1) - this.mSecsAt(endIndex);
        this.loopMS = this.mSecsAt(endIndex) - this.mSecsAt(startIndex);

        if (this.scale == null) this.scale = 1;
        return this;
    },

    mSecsAt: function(i) {
        // Return the time in milliseconds at this index
        return this.points[i].x;
    },

    indexOfPointAfterMSecs: function(mSecs, startIndex) {
        // Return the index of the first point whose time is greater that mSecs,
        // starting with the given index. Return null if mSecs is after the last point's time.

        var start = startIndex || 0;
        for (var i=start; i<this.points.length; i++) {
            if (this.points[i].x > mSecs) return i;
            }
        return null
    },

    valueAt: function(i) {
        // Return the envelope value at this index
        return this.points[i].y;
    },

    clone: function() { 
        return new this.constructor(this);
    },

    scaledValueAtMsecs: function(mSecs, dur) {
        // Return the scaled value of this envelope for a note of duration dur
        // at the given number of milliseconds from its onset.
        // Return zero for times outside the time range of this envelope.
        // This is the heart of the doControl parameter update mechanism, and it
        // must be fairly efficient
        if (mSecs < 0 || mSecs > dur) return 0;

        var beginDecayMS = dur - this.decayMS;  // time decay begins for this note
        if(mSecs > beginDecayMS) {  // decay phase
            // Compute the time relative to the (unlooped) timbre
            var t = this.attackMS + this.loopMS + (mSecs - beginDecayMS);
            var i = this.indexOfPointAfterMSecs(t);
            if (i == null) return 0;  // past end
            // Groan - have to scale the decay to match value at end-decay
            var valBeforeDecay = this.scaledValueAtMsecs(beginDecayMS, 999999)/this.scale;
            var decayScale = valBeforeDecay/this.valueAt(this.loopEndIndex);
            return this.interpolateBetween(t, i-1, i) * this.scale * decayScale;
            }
        if (mSecs < this.attackMS) {  // attack phase
            var i = this.indexOfPointAfterMSecs(mSecs)
            if (i == 0) return this.valueAt(0) * this.scale;
            return this.interpolateBetween(mSecs, i-1, i) * this.scale;
            } 
        // sustain phase
        if (this.loopMS == 0) return this.valueAt(this.loopEndIndex) * this.scale;  // looping on a single point
        var t = this.attackMS + ((mSecs - this.attackMS) % this.loopMS);
        var i = this.indexOfPointAfterMSecs(t, this.loopStartIndex);
        return this.interpolateBetween(t, i-1, i) * this.scale;
    },

    reset: function(snd) {
        // Reset the given sound from this envelope.
        this.updateTargetAt(snd, 0);
    },

    setExponentialDecay: function(dur) {
        // lively.Sound.FMSound.chime().play()
        // Make an exponential decay envelope - modelled entirely as attack phase
        var nPts = 20;
        var endVol = 0.001;
        var decrease = Math.exp(Math.log(endVol)/nPts);
        var points = [];
        points[0] = pt(0, 0);
        var val = 1;
        for (var i=1; i<=nPts; i++) {
            points[i] = pt(i*dur*1000/nPts, val);
            val = val*decrease;
            };
        this.setPointsLoopStartLoopEnd(points, nPts, nPts);
        return this;
    },

    updateTargetAt: function(snd, mSecs) {
        // Send my updateSelector to the given target object with the value of this envelope
        // at the given number of milliseconds from its onset
        switch (this.parameter) {
            case 'volume': 
                if (mSecs == 0) snd.setScaledVol(0);
                // For volume, we give next value to establish per-sample delta
                var timeToNextControl = this.controlInterval(); // should probably be smarter
                var nextValue = this.scaledValueAtMsecs(mSecs + timeToNextControl, snd.getDurationMS());
                snd.adjustVolumeTo(nextValue * snd.loudness, timeToNextControl);
                return;
            case 'pitch':
                // Update the pitch for my target
                // Details: Assume envelope range is 0.0..2.0, with 1 being the center pitch.
                // Subtracting one yields the range -1.0..1.0. Raising two to this power yields
                // pitches between half and double the center pitch; i.e. from an octave below
                // to an octave about the center pitch.
                var newValue = this.scaledValueAtMsecs(mSecs, snd.getDurationMS());
                snd.setPitch(Math.pow(2, (newValue - (this.scale / 2)) * this.centerPitch));
                return;
            case 'modulation':
                var newValue = this.scaledValueAtMsecs(mSecs, snd.getDurationMS());
                snd.setModulation(newValue);
                return;
            case 'ratio':
                var newValue = this.scaledValueAtMsecs(mSecs, snd.getDurationMS());
                snd.setRatio(newValue);
                return;
        }
    },

    controlInterval: function() {
        // Number of milliseconds between parameter updates in doControl()
        return 10;
    },

    showOnDisplay: function(dur) {
        //  lively.Sound.Envelope.example().showOnDisplay()
        //  lively.Sound.FMSound.clarinet().envelopes[0].showOnDisplay()
        //  Plot this envelope on a new Morph and show it

        // Note if duration is not specified, then show a couple of loops
        if (dur == null) dur = this.attackMS + this.decayMS + this.loopMS*2.67;
        var step = this.controlInterval();

        var panel = lively.morphic.Morph.makeRectangle(new Rectangle (0, 0, (dur/step)*2 + 50, 160));
        panel.setFill(Color.lightGray); 
        panel.openInWorld();
    	var xOrigin = 30;
    	var yOrigin = 130;
    	var vals = this.points.collect(function(p) { return p.y; });
    	var minVal = Math.min.apply(null, vals);
    	var maxVal = Math.max.apply(null, vals);
    	var yScale = 100.0 / ((maxVal - minVal) * this.scale);

        // Make some axes and loop markers
        var p = pt(xOrigin, yOrigin);
        panel.addMorph(lively.morphic.Morph.makeLine([p, p.addXY((dur/step)*2, 0)]));
        panel.addMorph(lively.morphic.Morph.makeLine([p, p.addXY(0, -100)])); 
        p = pt(xOrigin + (this.attackMS/step)*2, yOrigin);
        panel.addMorph(lively.morphic.Morph.makeLine([p, p.addXY(0, -100)]));
        p = pt(xOrigin + ((this.attackMS + this.loopMS)/step)*2, yOrigin);
        panel.addMorph(lively.morphic.Morph.makeLine([p, p.addXY(0, -100)]));

    	var x = xOrigin;
        var pts = [];
    	for (var mSecs = 0; mSecs <= dur+step; mSecs += step) {
    		var v = this.scaledValueAtMsecs(mSecs, dur);
    		var y = yOrigin - ((v - minVal) * yScale);
    		pts.push(pt(x, y));
    		x = x + 2; };  // 2 pix per control interval
        panel.addMorph(lively.morphic.Morph.makeLine(pts, 2, Color.green));
    },

    interpolateBetween: function(mSecs, i1, i2) {
        // Return the scaled, interpolated value for the given time between the given time points
        // Assume: p1 x <= mSecs <= p2 x

        var p1 = this.points[i1];
        var p2 = this.points[i2];
        var valueRange = p2.y - p1.y;
        if (valueRange == 0) return p1.y;
        var timeRange = p2.x - p1.x;
        return (p1.y + (((mSecs - p1.x) / timeRange) * valueRange));
    },

    initialize: function(parameterName, scaleIfAny) {
        // initialize an envelope according to its sound parameter and optional scale
        this.parameter = parameterName;
        this.scale = scaleIfAny || 1;
        return this;
    },

});


Object.extend(lively.Sound.Envelope, { 
    example: function() {
        // lively.Sound.Envelope.example().showOnDisplay();
        var p = [pt(0, 0), pt(100, 1.0), pt(250, 0.7), pt(400, 1.0), pt(500, 0)];
        return this.withPointsLoopStartLoopEnd(p, 1, 3);
    },

    withPointsLoopStartLoopEnd: function(ptArray, start, end) {
        // Note unlike Squeak, start and end are 0-based indices into ptArray
        return (new lively.Sound.Envelope).setPointsLoopStartLoopEnd(ptArray, start, end);
    }
 
});


lively.Sound.AbstractSound.subclass("lively.Sound.SequentialSound", {
    aboutMe: function() { 
        // SequentialSound carries a list of sounds to be played in sequence.
        // Typically used to encode a melody.
        // Adapted from John Maloney's Squeak code by Dan Ingalls
    },

    copy: function($super) { 
        var copy = $super();
        copy.sounds = this.sounds.map(function(snd) { return snd.copy(); });
        return copy;
    },

    reset: function($super) {
        // Reset all sounds, and move currentIndex back to the beginning
        $super(); 
        this.sounds.forEach(function(snd) {snd.reset(); });
        this.soundsIndex = 0;
        return this;
    },

    add: function(aSound) {
        // Add a new note
        this.sounds.push(aSound);
        return this;
    },

    mixSamplesToBuffer: function(n, buffer, startIndex, leftVol, rightVol) {
        if (this.player == null) this.player = this.findPlayer();  // cache it here for whole melody
        if (this.soundsIndex < 0) return;  // indicator of completion
        var finalIndex = (startIndex + n) - 1;
        var i = startIndex;
        while (i <= finalIndex) {
            var snd = this.sounds[this.soundsIndex];
            while (snd.samplesRemaining() <= 0) {
                if (this.player && this.player.noteSoundOnOff)
                    this.player.noteSoundOnOff(snd, false);
                // find next unplayed sound
                if (this.soundsIndex < this.sounds.length-1) {
                    this.soundsIndex++;
                    snd = this.sounds[this.soundsIndex];
                    if (this.player && this.player.noteSoundOnOff)
                        this.player.noteSoundOnOff(snd, true, this.noteColor);
                } else {
                    this.soundsIndex = -1;
                    return;  // no more sounds
                }
            };
            if (this.soundsIndex == 0 && this.player && this.player.noteSoundOnOff)
                this.player.noteSoundOnOff(snd, true, this.noteColor);
            var count = (finalIndex - i) + 1;
            var remaining = snd.samplesRemaining();
        	if (remaining < count) count = remaining;
            snd.mixSamplesToBuffer(count, buffer, i, leftVol, rightVol);
            i += count;
        };
    },

    samplesRemaining: function() {
        if (this.soundsIndex < 0) return 0;
        return 999999;  // really anything > 0 should do
    },

    initialize: function($super) {
        this.sounds = [];
        this.soundsIndex = 0;
        $super();
    },

    doControl: function($super, msPast) {
        $super(msPast);
        if (this.soundsIndex >= 0) this.sounds[this.soundsIndex].doControl(msPast);
    },

});


Object.extend(lively.Sound.SequentialSound, { 
    example: function() {
        // lively.Sound.SequentialSound.example().play()
    	return lively.Sound.AbstractSound.bachFragmentOn(new lively.Sound.PluckedSound());
    }
});


lively.Sound.AbstractSound.subclass("lively.Sound.RestSound", {
    aboutMe: function() { 
        // Rests simply bide their time counting down this.count.
        // Adapted from John Maloney's Squeak code by Dan Ingalls
    },

    setPitchDurLoudness: function($super, pitchNameOrNumber, dur, loud) {
        $super(pitchNameOrNumber, dur, loud);
        return this.reset();
    },

    copy: function() { 
        return this.clone().copyEnvelopes();
    },

    reset: function($super) {
        $super(); 
        this.count = this.initialCount;
        return this;
    },

    mixSamplesToBuffer: function(n, buffer, startIndex, leftVol, rightVol) {
        // Rests do nothing but count down
        this.count -= n;
    },

});


Object.extend(lively.Sound.RestSound, { 
    example: function() {
    	var snd = new lively.Sound.RestSound;
        return snd.setPitchDurLoudness(220, 2.0, 0.3);
    }
});


lively.Sound.AbstractSound.subclass("lively.Sound.MixedSound", {
    aboutMe: function() { 
        // I represent several sounds to be played together, as a polyphonic score.
        // Adapted from John Maloney's Squeak code by Dan Ingalls
    },

    samplesRemaining: function() {
        if (this.sounds == null || this.sounds.length == 0) return 0;
        var samps = this.sounds.collect(function(snd) { return snd.samplesRemaining(); });
        return Math.max.apply(null, samps);
    },

    add: function(aSound, leftRightPan, volume) {
        // Add aSound with left-right pan, where 0 is left, 1 is right, and 0.5 is centered.
        // The loudness of the sound will be scaled by volume, which ranges from 0 to 1.
    	if (volume == null) volume = 1;
    	var vol = Math.min(1, Math.max(0, volume));
    	var pan = Math.min(1, Math.max(0, leftRightPan));
    	this.sounds.push(aSound);
    	this.leftVols.push(1-pan);
    	this.rightVols.push(pan);
        return this;
    },

    initialize: function($super) {
        this.sounds = [];
        this.leftVols = [];
        this.rightVols = [];
        $super();
        return this;
    },

    copy: function($super) { 
        var copy = $super();
        copy.sounds = this.sounds.collect(function(snd) { return snd.copy();});
        copy.leftVols = this.leftVols.copy();
        copy.rightVols = this.rightVols.copy();
        return copy;
    },

    reset: function($super) {
        $super(); 
        this.sounds.forEach(function(snd) {snd.reset();});
        return this;
    },

    doControl: function($super, msPast) {
        $super(msPast);
        this.sounds.forEach(function(snd) {snd.doControl(msPast);});
    },

    mixSamplesToBuffer: function(n, buffer, startIndex, leftVol, rightVol) {
        // Play a number of sounds concurrently.
        // The level of each sound can be set independently for the left and right channels.
        var nSounds = this.sounds.length;
        for (var i=0; i<nSounds; i++) {
            var snd = this.sounds[i];
            var left = leftVol*this.leftVols[i]/nSounds;
            var right = rightVol*this.rightVols[i]/nSounds;
    	    if (snd.samplesRemaining() > 0)
    	        snd.mixSamplesToBuffer(n, buffer, startIndex, left, right);
        }
    },

});


Object.extend(lively.Sound.MixedSound, { 
    example: function() {
        var mix = new lively.Sound.MixedSound();
        return mix;
    }
});


lively.Sound.AbstractSound.subclass("lively.Sound.RepeatingSound", {
    aboutMe: function() { 
        // I represent a sound that plays repeatedly.
        // Adapted from Squeak code by Dan Ingalls, however...
        // This implementation supports a repeat time that is not determined by the end of
        // the last note (ie sound.samplesRemaining).  This allows looping a sequence whose
        // last note plays beyond the start of the next loop.
    },

    samplesRemaining: function() {
        if (!this.sound || this.iterationsToDo == 0) return 0;
        return 999999;
    },

    setSoundCountTime: function(aSound, count, repeatTime) {
        // Initialize the sound, count, and repeatTime.
        // If the count is the symbol -1, then repeat indefinitely.
        // If the repeatTime is 0 or undefined, repeat the full duration of the sound.

        this.sound = aSound;
        this.iterationCount = count;
        this.repeatTime = repeatTime;
        if (this.repeatTime)
            this.initialCount = 0 | (this.repeatTime * this.samplingRate());
        this.reset();
    },

    copy: function($super) { 
        var copy = $super();
        copy.sound = this.sound.copy();
        return copy;
    },

    reset: function($super) {
        $super();
        if (this.sound) this.sound.reset();
        this.iterationsToDo = this.iterationCount;
        return this;
    },

    doControl: function($super, msPast) {
        $super(msPast);
        this.sound.doControl(msPast);
    },

    mixSamplesToBuffer: function(n, buffer, startIndex, leftVol, rightVol) {
        var samplesToPlay = Math.min(n, this.sound.samplesRemaining()),
            finished = samplesToPlay <= 0;
        if (!finished)
            this.sound.mixSamplesToBuffer(samplesToPlay, buffer, startIndex, leftVol, rightVol);
        if (this.repeatTime) {
            this.count -= n;
            finished = this.count <= 0;
        }
        if (finished) {
            if (this.iterationCount < 0)
                this.reset();
            else if (this.iterationsToDo > 0) {
                if (this.repeatTime) this.count = this.initialCount;
                this.sound.reset();
                this.iterationsToDo--;
            }
        }
    },

});


Object.extend(lively.Sound.RepeatingSound, { 
    example: function() {
        // lively.Sound.RepeatingSound.example().play()
        var sound = new lively.Sound.PluckedSound();
        var repeat = new lively.Sound.RepeatingSound();
        sound.setPitchDurLoudness(400, 2, 1);
        repeat.setSoundCountTime(sound, 2);
        return repeat;
    }
});
lively.Sound.AbstractSound.subclass('lively.Sound.ScorePlayer',
'default category', {
    aboutMe: function() {
        // This is a real-time player for MIDI scores (i.e., scores read from MIDI files).
    },
    initialize: function($super) {
        this.score = new lively.Sound.Score();
        this.rate = 1;              // relative playback speed
        this.beatsPerMinute = 120;  // initial tempo (changed by score events)
        this.cursors = [];          // one cursor per track
        $super();
    },
    setScore: function(score) {
        this.score = score;
        // a different hue for each track
        var hue = -60,
            hueIncr = Math.min(360 / this.score.tracks.length, 90);
        // one cursor per track
        this.cursors = this.score.tracks.map(function(track) {
            hue += hueIncr;
            return {
                instrument: undefined,          // use keyboard's sound
                color: Color.hsb(hue, 0.8, 0.9),
                pos: 0,
            };
        });
        this.reset();
    },
    setKeyboard: function(keyboard) {
        // to higlight keys while playing
        // must provide noteSoundOnOff() method
        this.keyboard = keyboard;
    },

    reset: function($super) {
        $super();
        this.activeSounds = [];
        this.cursors.forEach(function(cursor){cursor.pos = 0});
        this.tempoPos = 0;
        this.ticksSinceStart = 0;
        this.done = false;
        this.beatsPerMinuteOrRateChanged();
    },
    doControl: function($super, msPast) {
        // called every 10 msecs. Adds new notes to activeSounds.
        $super(msPast);
        this.activeSounds.forEach(function(snd){snd.doControl(msPast)});
    	this.ticksSinceStart += this.ticksClockIncr;
        this.processTempoEventsUpTo(this.ticksSinceStart);
	    this.processNoteEventsUpTo(this.ticksSinceStart);
        if (this.pianoRoll)
            this.pianoRoll.line.moveToTick(this.ticksSinceStart);
        if (this.isDone())
            this.done = true;
    },
    samplesRemaining: function() {
        return this.done ? 0 : 999999;
    },
    isDone: function() {
        if (this.activeSounds.length > 0) return false;
        for (var i = 0; i < this.score.tracks.length; i++)
            if (this.cursors[i].pos < this.score.tracks[i].length)
                return false;
        return true;
    },


    mixSamplesToBuffer: function(n, buffer, startIndex, leftVol, rightVol) {
        // play all active sounds, remove finished ones
        var someSoundIsDone = false;
        this.activeSounds.forEach(function(sound) {
            sound.mixSamplesToBuffer(n, buffer, startIndex, leftVol, rightVol);
            if (sound.samplesRemaining() <= 0) {
                someSoundIsDone = true;
                if (this.keyboard && this.keyboard.noteSoundOnOff)
                    this.keyboard.noteSoundOnOff(sound, false);
            }
        }.bind(this));
        if (someSoundIsDone) {
            this.activeSounds = this.activeSounds.select(function(sound) {
                return sound.samplesRemaining() > 0;
            });
        }
    },
    processNoteEventsUpTo: function(tick) {
        // Process note events through the given score tick
        for (var i = 0; i < this.score.tracks.length; i++) {
            var cursor = this.cursors[i],
                track = this.score.tracks[i],
                event;
            while (cursor.pos < track.length && (event = track[cursor.pos]).time < tick) {
                if (event.isNoteEvent()) {
                    var sound = this.soundForEventFromInstrument(event, cursor.instrument);
                    if (this.keyboard && this.keyboard.noteSoundOnOff)
                        this.keyboard.noteSoundOnOff(sound, true, cursor.color);
                    this.activeSounds.push(sound);
                }
                cursor.pos++;
            }
        }
    },
    processTempoEventsUpTo: function(tick) {
        if (!this.score.tempos) return;
        var i = this.tempoPos,
            tempos = this.score.tempos;
        while (i < tempos.length && tempos[i].time <= tick) {
            i++
        }
        if (i > this.tempoPos) {
            this.tempoPos = i;   
            this.beatsPerMinute = tempos[i-1].getBeatsPerMinute();
            this.beatsPerMinuteOrRateChanged();
        }
    },


    beatsPerMinuteOrRateChanged: function() {
        // This method should be called after changing the beatsPerMinute or rate.
    	this.mSecsPerTick = 60000 / (this.beatsPerMinute * this.score.ticksPerBeat * this.rate);
    	this.ticksClockIncr = this.controlInterval() / this.mSecsPerTick;
    },
    getDurationMS: function($super) {
        if (!this.duration) {
            var currentBPM = 120,
                lastTempoChangeTick = 0,
                secsPerTick;
            this.duration = 0,
            this.score.tempos.forEach(function(event){
                debugger;
                // accumulate time up to this tempo change event
    			secsPerTick = 60 / (currentBPM * this.rate * this.score.ticksPerBeat);
    			this.duration += secsPerTick * (event.time - lastTempoChangeTick);
    			// set the new tempo
    			currentBPM = event.getBeatsPerMinute();
    			lastTempoChangeTick = event.time;
            }.bind(this))
            // add remaining time through end of score"
        	secsPerTick = 60 / (currentBPM * this.rate * this.score.ticksPerBeat);
        	this.duration += secsPerTick * this.score.durationInTicks() - lastTempoChangeTick;
        }
        return $super();
    },

    pitchForNoteNumber: function(noteNumber) {
        // An octave (pitch x 2) has 12 notes equally spread:
        // Math.pow(2, 1/12) = 1.0594630943592953
        // The note A above middle C (note 9 in octave 5) is 440 Hz
        // Its MIDI note number is 12 * 5 + 9 = 69
        return 440 * Math.pow(1.0594630943592953, noteNumber - 69);
    },
    soundForEventFromInstrument: function(event, instrument) {
        var pitch = this.pitchForNoteNumber(event.key),
            seconds = event.duration * this.mSecsPerTick / 1000,
            loudness = event.velocity / 127;
        if (!instrument)
            instrument = this.keyboard ? this.keyboard.patchSound : new lively.Sound.PluckedSound();
        // HACK: some instruments can't play 0 duration well
        if (seconds < 0.5) seconds = 0.5;
        return instrument.copy().setPitchDurLoudness(pitch, seconds, loudness);
    },
    openPianoRoll: function(dur) {
        var beatWidth = 16,
            noteHeight = 4,
            tickWidth = beatWidth / this.score.ticksPerBeat,
            width = beatWidth * this.score.getDurationInBeats(),
            height = noteHeight * 128,
            roll = lively.morphic.Morph.makeRectangle(rect(0, 0, width, height));
        roll.applyStyle({fill: Color.lightGray, clipMode: 'scroll'});
        for (var i = 0; i < this.score.tracks.length; i++)
            this.score.tracks[i].forEach(function(event){
                if (event.isNoteEvent()) {
                    var w = event.duration ? tickWidth * event.duration : 2,
                        h = noteHeight,
                        x = tickWidth * event.time,
                        y = height - (event.key * noteHeight),
                        m = lively.morphic.Morph.makeRectangle(rect (x, y, w, h));
                    m.setFill(this.cursors[i].color);
                    if (!event.duration) m.setBorderColor(Color.red);
                    roll.addMorph(m);
                }
            }.bind(this));
        roll.line = lively.morphic.Morph.makeLine([pt(0,0), pt(0,height)]);
        roll.line.moveToTick = function(tick) {
            this.setPosition(pt(tick * tickWidth,0));
        };
        roll.addMorph(roll.line);
        roll.openInWindow();
        roll.owner.setExtent(pt(600,400));
        this.pianoRoll = roll;
    },});
Object.subclass('lively.Sound.Score',
'default category', {
    aboutMe: function() { 
        // A Score is a container for a number of tracks with timed Events.
        // It can be loaded from a MIDI file.
        // Adapted from Squeak code by Bert Freudenberg.
    },
    initialize: function() {
        this.ticksPerBeat = 100;
        this.tempos = [];           // tempo events
        this.tracks = [];           // other events
    },
    fromMidiFile: function(midi, inspectUnknownEvents) {
        this.ticksPerBeat = midi.header.ticksPerBeat;
        for (var t = 0; t < midi.header.trackCount; t++) {
            var events = midi.tracks[t],
                time = 0,
                track = [],
                activeNotes = {};
            for (var i = 0; i < events.length; i++) {
                var event = events[i],
                    note;
                if (event.type == "channel") {
                    if (event.subtype == "noteOn") {
                        note = new lively.Sound.NoteEvent();
                        note.setTimeChannelKeyVelocity(time, event.channel, event.noteNumber, event.velocity);
                        track.push(note);
                        activeNotes[event.noteNumber] = note;
                    } else if (event.subtype == "noteOff") {
                        note = activeNotes[event.noteNumber];
                        if (note) {
                            note.setEndTime(time);
                            delete activeNotes[event.noteNumber];
                        }
                    } else if (event.subtype == "controller") {
                        // should make controller event
                    } else if (event.subtype == "programChange") {
                        // should make prog change event
                    } else if (inspectUnknownEvents) {
                        inspect(event);
                        return;
                    }
                } else if (event.type == "meta") {
                    if (event.subtype == "setTempo") {
                        var tempo = new lively.Sound.TempoEvent();
                        tempo.setTime(time);
                        tempo.setMicrosecondsPerBeat(event.microsecondsPerBeat);
                        track.push(tempo);
                    } else if (event.subtype == "endOfTrack") {
                        // end all active notes
                        ownPropertyNames(activeNotes).forEach(function(noteNumber){
                            activeNotes[noteNumber].setEndTime(time);
                        });
                        activeNotes = {};
                    } else if (event.subtype == "timeSignature") {
                        this.timeSignature = event;
                    } else if (event.subtype == "keySignature") {
                        track.keySignature = event;
                    } else if (event.subtype == "sequencerSpecific") {
                        // ignore
                    } else if (typeof event.text == "string") {
                        show("text " + event.subtype + ": " + event.text);
                        if (!this.text) this.text = {};
                        if (!this.text[event.subtype]) this.text[event.subtype] = event.text;
                        else this.text[event.subtype] += "\n" + event.text;
                    } else if (inspectUnknownEvents) {
                        inspect(event);
                        return;
                    }
                } else if (inspectUnknownEvents) {
                    inspect(event);
                    return;
                }
                time += event.deltaTime;
            }
            if (track.length) {
                if (!this.tracks.length && track.every(function(evt){return evt.isTempoEvent()}))
                    this.tempos = track;
                else
                    this.tracks.push(track);
            }
        }
    },
    getDurationInTicks: function() {
        if (this.durationInTicks) return this.durationInTicks;
        var ticks = 0;
        this.tracks.forEach(function(track){
            track.forEach(function(event){
                ticks = Math.max(ticks, event.getEndTime());
            });
        });
        return this.durationInTicks = ticks;
    },
    getDurationInBeats: function() {
        return this.getDurationInTicks() / this.ticksPerBeat;
    }});
Object.subclass('lively.Sound.Event',
'default category', {
    aboutMe: function() {
        // Abstract class for timed events in a MIDI score.
    },
    setTime: function(time) {
        this.time = time;
    },
    getTime: function() {
        return this.time;
    },
    getEndTime: function() {
        return this.time;
    },

    isNoteEvent: function() {
        return false;
    },
    isTempoEvent: function() {
        return false;
    },});
lively.Sound.Event.subclass('lively.Sound.NoteEvent',
'default category', {
    aboutMe: function() {
        // A MIDI noteOn/noteOff event pair is represented here
        // as a single NoteEvent with a duration
    },
    setTimeChannelKeyVelocity: function(time, channel, key, velocity) {
        this.time = time;
        this.channel = channel;
        this.key = key;
        this.velocity = velocity;
    },
    setEndTime: function(endTime) {
        this.duration = endTime - this.time;
    },
    getEndTime: function() {
        return this.time + (this.duration || 0);
    },

    isNoteEvent: function() {
        return true;
    }

});
lively.Sound.Event.subclass('lively.Sound.TempoEvent',
'default category', {
    aboutMe: function() {
        // This changes the beatPerMinute
    },
    setMicrosecondsPerBeat: function(microsecondsPerBeat) {
        this.microsecondsPerBeat = microsecondsPerBeat;
    },
    getBeatsPerMinute: function() {
        return 60000000 / this.microsecondsPerBeat;
    },

    isTempoEvent: function() {
        return true;
    },});


});  // End of module
