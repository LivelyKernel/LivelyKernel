module('lively.Sound').requires().requiresLib({url:Config.rootPath+'core/lib/XAudioServer.js',loadTest:function(){return!!Global.XAudioServer}}).toRun(function(){

Object.subclass('lively.Sound.AbstractSound', {
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
        this.scaledVol = 1;
        this.scaledVolIncr = 0;
        this.reset();
    },
    clone: function() {
        return new this.constructor(this);
    },
    addEnvelope: function(env) {
        // Add the given envelope to my envelopes list.
        this.envelopes.push(env);
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
            this.mixSamplesToBuffer(sampCount, aSoundBuffer, i, fullVol, fullVol);
            this.samplesUntilNextControl -= sampCount;
            if (this.samplesUntilNextControl <= 0) {
                this.doControl(sampCount/sampsPerMS);
                this.samplesUntilNextControl = sampsPerMS * this.controlInterval();
            }
            i = i + sampCount;
        }
    },
    reset: function() {
        // Reset my internal state for a replay.
        // Methods that override this method should do super reset."
        this.mSecsSinceStart = 0;
        this.samplesUntilNextControl = 0;
        this.scaledVol = this.loudness;
        this.scaledVolIncr = 0;
        this.count = this.initialCount;
        this.envelopes.invoke('reset', this);
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
        this.envelopes.forEach (function(env) {
            env.updateTargetAt(this, this.mSecsSinceStart);
        }.bind(this));
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
        if (this.envelopes.length > 0) { // ...or enough time to play out the attack phase
            this.count = this.samplingRate() * (this.envelopes.first().decayMS/1000);
        }
    },
    asSequence: function(noteArray) {
        // Build a note sequence (i.e., a SequentialSound) from the given array
        // using this sound as instrument.
        // Elements are [pitch, duration, loudness] triples with loudness=0 for rests.
        // Loudness is given in an arbitrary scale with 1000 = max.
        // Pitches can be given as names or numbers.
        var score = new lively.Sound.SequentialSound();
        noteArray.each(function(elt) {
            var sound = this.clone();
            var pitch = this.nameOrNumberToPitch(elt[0]);
            sound.setPitchDurLoudness(pitch, elt[1], elt[2] / 1000);
            score.add(sound);
        }, this);
        return score;
    }
});

Object.extend(lively.Sound.AbstractSound, {
    halftones: {
        "C": 0,
        "C#": 1,
        "Db": 1,
        "D": 2,
        "D#": 3,
        "Eb": 3,
        "E": 4,
        "F": 5,
        "F#": 6,
        "Gb": 6,
        "G": 7,
        "G#": 8,
        "Ab": 8,
        "A": 9,
        "A#": 10,
        "Bb": 10,
        "B": 11
    },
    pitchForName: function(name) {
        // using the MIDI standard tone mapping
        // p = 69 + 12 * log_2(f / 440Hz)
        var match = name.match(/^([a-gA-G]#?b?)([1-9][0-9]*)$/);
        if (!match) throw new Error('Unsupported note: ' + name);
        var note = match[1].capitalize(), octave = +match[2];
        var pitch = octave * 12 + this.halftones[note];
        var freq = 440 * Math.pow(2, (pitch - 69) / 12);
        return freq;
    }
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
    initialize: function($super) {
        $super();
        this.setPitchDurLoudness(220, 2.0, 0.3);
    },
    setPitchDurLoudness: function($super, pitchNameOrNumber, dur, loud) {
        $super(pitchNameOrNumber, dur, loud);
        this.damp = 0.5;  // simply average adjacent samples
        if (this.pitch > 400) {
            this.damp = 100/this.pitch;  // damp higher frequencies slower
        }
        var monoSampleCount =  this.samplingRate() / this.pitch;
        this.ringSize = Math.floor(Math.max(2, monoSampleCount));
        this.ring = null;  // will be allocated lazily to minimize storage needs
        this.indexIncrement = (this.pitch * monoSampleCount) / (this.samplingRate());
        return this.reset();
    },
    reset: function($super) {
        // Fill the ring with random noise
        $super();
        this.count = this.initialCount;
        this.scaledVol = this.loudness;
        this.index = 0;
        return this;
    },
    mixSamplesToBuffer: function(n, buffer, startIndex, leftVol, rightVol) {
        // (new PluckedSound).setPitchDurLoudness(220, 2, 1).play()
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
        if (this.count <= 0) {
            this.ring = null;  // release storage to ease gc load
        }
    },
    ensureRing: function() {
        // Ring buffer gets allocated lazily, and filled with white noise
        if (this.ring != null) return;
        this.ring = new Array(this.ringSize);
        for (var i=0; i<this.ringSize; i++) {
            this.ring[i] = Math.random()*2 - 1;
        }
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
        this.sounds.invoke('reset');
        this.soundsIndex = 0;
        return this;
    },
    add: function(aSound) {
        // Add a new note
        this.sounds.push(aSound);
        return this;
    },
    mixSamplesToBuffer: function(n, buffer, startIndex, leftVol, rightVol) {
        if (this.soundsIndex < 0) return;  // indicator of completion
        var finalIndex = (startIndex + n) - 1;
        var i = startIndex;
        while (i <= finalIndex) {
            var snd = this.sounds[this.soundsIndex];
            while (snd.samplesRemaining() <= 0) {
                // find next unplayed sound
                if (this.soundsIndex < this.sounds.length-1) {
                    this.soundsIndex++;
                    snd = this.sounds[this.soundsIndex];
                } else {
                    if (this.isLooping) {
                        this.reset();
                        return this.mixSamplesToBuffer(
                            finalIndex - i, buffer, i, leftVol, rightVol);
                    } else {
                        this.soundsIndex = -1;
                        return;  // no more sounds
                    }
                }
            }
            var count = (finalIndex - i) + 1;
            var remaining = snd.samplesRemaining();
            if (remaining < count) count = remaining;
            snd.mixSamplesToBuffer(count, buffer, i, leftVol, rightVol);
            i += count;
        }
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
        if (this.soundsIndex >= 0) {
            this.sounds[this.soundsIndex].doControl(msPast);
        }
    }
});

Object.subclass('lively.Sound.Instrument', {
    initialize: function(sound) {
        this.sound = sound;
        this.activeSounds = [];
        this.createAudioHandle();
        this.step.bind(this).delay(0.05);
    },
    createAudioHandle: function() {
        if (!Global.XAudioServer) {
            throw new Error('XAudioServer not loaded');
        }
        // Set up the buffers and bind audioHandle
        var buffSize = 44100 * 2 * 0.2;  // 0.2 sec worth of samples
        var buffer = this.clearSoundBuffer(buffSize);  // creates a sound buffer of all zero
        this.audioHandle = new XAudioServer(
            2, // no channels
            44100, // sample rate
            buffSize / 2, buffSize,
            this.playActiveSounds.bind(this), 0);
    },
    clearSoundBuffer: function(sizeUsed) {
        // Note sizeUsed must be 2 * number of stereo samples
        var buffer = new Array(sizeUsed);
        for (var i=0; i<sizeUsed; i++) buffer[i] = 0;
        return buffer;
    },
    doNotSerialize: ['audioHandle'],
    step: function() {
        if (!this.audioHandle || !Object.isFunction(this.audioHandle.executeCallback)) {
            throw new Error('XAudioServer not initialized');
        } else {
            this.audioHandle.executeCallback();
            this.step.bind(this).delay(0.05);
        }
    },
    playSound: function(sound) {
        sound.reset();
        if (sound.samplesRemaining() == 0) return;
        this.activeSounds.push(sound);
    },
    playActiveSounds: function(sampleCount) {
        // Here we go through all active sounds, mixing their samples
        // into a buffer of the requested size
        // It is also here that we run the control code for each sound
        // to change such envelope parameters as volume, pitch, etc.
        var buffer = this.clearSoundBuffer(sampleCount*2);
        this.activeSounds = this.activeSounds.select(function(snd) {
            return snd.samplesRemaining() > 0;
        });
        this.activeSounds.forEach(function(snd) {
            snd.mixSampleCountIntoBufferStartingAt(sampleCount, buffer, 0, 44100);
        });
        return buffer;
    },
    play: function(note, duration, volume, optSeq) {
        if (volume === undefined) volume = 100.0;
        if (duration === undefined) duration = 1.0;
        if (!optSeq) {
            optSeq = this.sound.asSequence([[note, duration, volume]]);
            this.playSound(optSeq);
        } else {
            var pitch = this.sound.nameOrNumberToPitch(note);
            var snd = this.sound.clone();
            snd.setPitchDurLoudness(pitch, duration, volume / 1000);
            optSeq.add(snd);
        }
        return {
            then: function(note, duration, volume) {
                return this.play(note, duration, volume, optSeq);
            }.bind(this),
            loop: function() { optSeq.isLooping = true; }
        }
    }
});

Object.extend(lively.Sound.Instrument, {
    playExampleSong: function() {
        var plucked = new lively.Sound.PluckedSound();
        var instrument = new lively.Sound.Instrument(plucked);
        instrument.play("e4", 0.25)
                  .then("e4", 0.25)
                  .then("f4", 0.25)
                  .then("g4", 0.25)
                  .then("g4", 0.25)
                  .then("f4", 0.25)
                  .then("e4", 0.25)
                  .then("d4", 0.25)
                  .then("c4", 0.25)
                  .then("c4", 0.25)
                  .then("d4", 0.25)
                  .then("e4", 0.25)
                  .then("e4", 0.5)
                  .then("d4", 0.125)
                  .then("d4", 0.5);
    },
    playMultiInstrumentSong: function() {
        var plucked = new lively.Sound.PluckedSound();
        var instrument = new lively.Sound.Instrument(plucked);
        var bass = instrument, lead = instrument;
        bass.play("a2", 2.0)
                  .then("e3", 1.75)
                  .then("c3", 0.25)
                  .then("a2", 2.0)
                  .then("e3", 2.0);
        lead.play("c5", 1)
                  .then("e4", 0.5)
                  .then("d4", 0.25)
                  .then("e4", 0.25)
                  .then("a4", 0.125)
                  .then("c5", 0.125)
                  .then("b4", 0.25)
                  .then("d4", 0.25)
                  .then("e4", 0.25)
                  .then("a4", 0.125)
                  .then("c5", 0.125)
                  .then("b4", 0.25)
                  .then("b4", 0.25)
                  .then("c4", 1)
                  .then("e4", 0.5)
                  .then("d4", 0.25)
                  .then("e4", 0.25)
                  .then("a4", 0.125)
                  .then("c5", 0.125)
                  .then("b4", 0.25)
                  .then("e4", 0.25)
                  .then("d4", 0.25)
                  .then("e4", 0.125)
                  .then("c4", 0.125)
                  .then("a3", 0.5);
      }
});

}); // end of module
