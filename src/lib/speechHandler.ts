// ============= Speech Synthesis Handler =============

let synth: SpeechSynthesis;
let keepAliveInterval: NodeJS.Timeout | null = null;
let voices: SpeechSynthesisVoice[] = [];

export const initSpeech = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    synth = window.speechSynthesis;
    
    const loadVoices = () => {
      voices = synth.getVoices();
      console.log(`Loaded ${voices.length} voices`);
      resolve(voices);
    };

    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
    
    loadVoices();
  });
};

export const getTamilVoices = (): SpeechSynthesisVoice[] => {
  return voices.filter(voice => 
    voice.lang.startsWith('ta') || 
    voice.name.toLowerCase().includes('tamil')
  );
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
