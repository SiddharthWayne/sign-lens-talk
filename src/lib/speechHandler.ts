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
      
      // Always create male and female voice options
      // Find best available voices for Tamil or English
      const availableVoices = systemVoices.filter(v => 
        v.lang.startsWith('ta') || v.lang.startsWith('en') || v.lang.startsWith('hi')
      );
      
      // Use any available voice as base
      const baseVoice = availableVoices[0] || systemVoices[0];
      
      if (baseVoice) {
        // Create male voice (lower pitch)
        customVoices.push({
          ...baseVoice,
          name: 'Male Voice',
          lang: 'ta-IN',
          voiceURI: 'male-custom'
        } as SpeechSynthesisVoice);
        
        // Create female voice (higher pitch)
        customVoices.push({
          ...baseVoice,
          name: 'Female Voice',
          lang: 'ta-IN',
          voiceURI: 'female-custom'
        } as SpeechSynthesisVoice);
      }
      
      voices = customVoices.length > 0 ? customVoices : systemVoices;
      console.log(`Loaded ${voices.length} custom voices`);
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
    utterance.voice = voice;
    utterance.lang = voice.lang;
    // Adjust pitch based on voice type
    if (voice.name.includes('Male')) {
      utterance.pitch = 0.8; // Lower pitch for male
    } else if (voice.name.includes('Female')) {
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
