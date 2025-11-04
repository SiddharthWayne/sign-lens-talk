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
      
      // Find Tamil voices or fallback to generic voices
      const tamilVoices = systemVoices.filter(v => v.lang.startsWith('ta') || v.lang.startsWith('en'));
      
      // Create custom voice entries (male and female)
      const maleVoice = tamilVoices.find(v => 
        v.name.toLowerCase().includes('male') || !v.name.toLowerCase().includes('female')
      ) || tamilVoices[0] || systemVoices[0];
      
      const femaleVoice = tamilVoices.find(v => 
        v.name.toLowerCase().includes('female')
      ) || tamilVoices[1] || systemVoices[1] || systemVoices[0];
      
      // Store reference voices
      if (maleVoice) {
        customVoices.push({
          ...maleVoice,
          name: 'Male Voice (Tamil)',
          lang: 'ta-IN'
        } as SpeechSynthesisVoice);
      }
      
      if (femaleVoice) {
        customVoices.push({
          ...femaleVoice,
          name: 'Female Voice (Tamil)',
          lang: 'ta-IN'
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
  } else {
    utterance.lang = 'ta-IN';
  }
  
  utterance.rate = rate;
  utterance.pitch = 1.0;
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
