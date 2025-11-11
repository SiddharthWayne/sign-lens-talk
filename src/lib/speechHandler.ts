// ============= Speech Synthesis Handler =============

let synth: SpeechSynthesis;
let keepAliveInterval: NodeJS.Timeout | null = null;
let voices: SpeechSynthesisVoice[] = [];

// Store the actual system voice to use
let actualSystemVoice: SpeechSynthesisVoice | null = null;

// Voice configuration with metadata
interface VoiceConfig {
  name: string;
  pitch: number;
}

const voiceConfigs: VoiceConfig[] = [
  { name: 'Male Voice', pitch: 0.8 },
  { name: 'Female Voice', pitch: 1.2 }
];

export const initSpeech = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    synth = window.speechSynthesis;
    
    const loadVoices = () => {
      const systemVoices = synth.getVoices();
      
      console.log('System voices available:', systemVoices.length);
      
      // Find best available voice (prefer Tamil, then English, then Hindi, then any)
      actualSystemVoice = systemVoices.find(v => v.lang.startsWith('ta')) ||
                          systemVoices.find(v => v.lang.startsWith('en')) ||
                          systemVoices.find(v => v.lang.startsWith('hi')) ||
                          systemVoices[0];
      
      if (actualSystemVoice) {
        console.log('Using base voice:', actualSystemVoice.name, actualSystemVoice.lang);
        // Create virtual voice list using the configs
        voices = voiceConfigs.map(config => {
          // Create a wrapper object that looks like a voice
          return {
            name: config.name,
            lang: actualSystemVoice!.lang,
            voiceURI: `${config.name}-${actualSystemVoice!.voiceURI}`,
            localService: actualSystemVoice!.localService,
            default: false,
            _pitch: config.pitch // Store pitch in the object
          } as SpeechSynthesisVoice & { _pitch: number };
        });
      } else {
        voices = [];
      }
      
      console.log(`Loaded ${voices.length} voices (Male & Female)`);
      resolve(voices);
    };

    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
    
    // Load voices immediately and also on change
    loadVoices();
  });
};

export const getTamilVoices = (): SpeechSynthesisVoice[] => {
  return voices; // Return custom male/female voices
};

export const getAllVoices = (): SpeechSynthesisVoice[] => {
  return voices;
};

export const speak = (
  text: string,
  voice: SpeechSynthesisVoice | null,
  rate: number,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (error: Error) => void
): void => {
  if (!synth) {
    console.error('Speech synthesis not initialized');
    return;
  }

  if (!actualSystemVoice) {
    console.error('No system voice available');
    return;
  }

  // Resume if paused
  if (synth.paused) {
    synth.resume();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Always use the actual system voice
  utterance.voice = actualSystemVoice;
  utterance.lang = actualSystemVoice.lang;
  
  // Adjust pitch based on selected voice
  if (voice && '_pitch' in voice) {
    utterance.pitch = (voice as any)._pitch;
    console.log('Speaking with voice:', voice.name, 'pitch:', utterance.pitch);
  } else if (voice) {
    // Fallback pitch detection
    if (voice.name === 'Male Voice') {
      utterance.pitch = 0.8;
    } else if (voice.name === 'Female Voice') {
      utterance.pitch = 1.2;
    } else {
      utterance.pitch = 1.0;
    }
  } else {
    utterance.pitch = 1.0;
  }
  
  utterance.rate = rate;
  utterance.volume = 1.0;

  // Keep-alive mechanism
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
  
  keepAliveInterval = setInterval(() => {
    if (synth.paused) synth.resume();
  }, 5000);

  utterance.onstart = () => {
    console.log('Speech started:', text);
    if (onStart) onStart();
  };

  utterance.onend = () => {
    console.log('Speech ended');
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
    if (onEnd) onEnd();
  };

  utterance.onerror = (event) => {
    console.error('Speech error:', event);
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
    if (onError) onError(new Error(event.error));
    if (onEnd) onEnd();
  };

  synth.speak(utterance);
};

export const cancelSpeech = (): void => {
  if (synth) {
    synth.cancel();
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
  }
};

export const resumeSpeech = (): void => {
  if (synth && synth.paused) {
    synth.resume();
  }
};
