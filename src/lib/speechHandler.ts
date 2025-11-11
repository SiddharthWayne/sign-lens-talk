// ============= Speech Synthesis Handler =============

let synth: SpeechSynthesis;
let keepAliveInterval: NodeJS.Timeout | null = null;
let voices: SpeechSynthesisVoice[] = [];

// Custom voice objects for male and female Tamil voices
const customVoices: SpeechSynthesisVoice[] = [];

export const initSpeech = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    synth = window.speechSynthesis;
    
    const loadVoices = () => {
      const systemVoices = synth.getVoices();
      
      // Clear previous custom voices
      customVoices.length = 0;
      
      // Find best available voice (prefer Tamil, then English, then Hindi, then any)
      const baseVoice = systemVoices.find(v => v.lang.startsWith('ta')) ||
                        systemVoices.find(v => v.lang.startsWith('en')) ||
                        systemVoices.find(v => v.lang.startsWith('hi')) ||
                        systemVoices[0];
      
      if (baseVoice) {
        // Create male voice using actual system voice
        const maleVoice = Object.create(baseVoice);
        maleVoice.name = 'Male Voice';
        customVoices.push(maleVoice);
        
        // Create female voice using actual system voice
        const femaleVoice = Object.create(baseVoice);
        femaleVoice.name = 'Female Voice';
        customVoices.push(femaleVoice);
      }
      
      voices = customVoices;
      console.log(`Loaded ${voices.length} voices (Male & Female)`);
      resolve(voices);
    };

    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
    
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

  // Resume if paused
  if (synth.paused) {
    synth.resume();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  
  if (voice) {
    // Use the actual voice from the voice object
    utterance.voice = voice;
    utterance.lang = voice.lang || 'ta-IN';
    // Adjust pitch based on voice name
    if (voice.name === 'Male Voice') {
      utterance.pitch = 0.8; // Lower pitch for male
    } else if (voice.name === 'Female Voice') {
      utterance.pitch = 1.2; // Higher pitch for female
    } else {
      utterance.pitch = 1.0;
    }
  } else {
    utterance.lang = 'ta-IN';
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
