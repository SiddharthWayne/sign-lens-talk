// ============= Speech Synthesis Handler =============

let synth: SpeechSynthesis;
let keepAliveInterval: NodeJS.Timeout | null = null;
let voices: SpeechSynthesisVoice[] = [];
let tamilSystemVoice: SpeechSynthesisVoice | null = null;
let fallbackSystemVoice: SpeechSynthesisVoice | null = null;

const TAMIL_TEXT_REGEX = /[\u0B80-\u0BFF]/;
const DEFAULT_TAMIL_LANG = 'ta-IN';
const DEFAULT_FALLBACK_LANG = 'en-US';

// Voice configuration with metadata
interface VoiceConfig {
  name: string;
  pitch: number;
}

const voiceConfigs: VoiceConfig[] = [
  { name: 'Male Voice', pitch: 0.8 },
  { name: 'Female Voice', pitch: 1.2 }
];

const containsTamilText = (text: string): boolean => TAMIL_TEXT_REGEX.test(text);

const resolveSpeechTarget = (text: string): { voice: SpeechSynthesisVoice | null; lang: string } => {
  if (containsTamilText(text)) {
    return {
      voice: tamilSystemVoice,
      lang: tamilSystemVoice?.lang || DEFAULT_TAMIL_LANG,
    };
  }

  return {
    voice: fallbackSystemVoice,
    lang: fallbackSystemVoice?.lang || DEFAULT_FALLBACK_LANG,
  };
};

export const initSpeech = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    synth = window.speechSynthesis;
    
    const loadVoices = () => {
      const systemVoices = synth.getVoices();
      
      console.log('System voices available:', systemVoices.length);

      tamilSystemVoice = systemVoices.find(v => v.lang.toLowerCase().startsWith('ta')) || null;
      fallbackSystemVoice = tamilSystemVoice ||
        systemVoices.find(v => v.lang.toLowerCase().startsWith('en')) ||
        systemVoices.find(v => v.lang.toLowerCase().startsWith('hi')) ||
        systemVoices[0] ||
        null;
      
      if (fallbackSystemVoice) {
        console.log('Using fallback voice:', fallbackSystemVoice.name, fallbackSystemVoice.lang);
        console.log('Tamil voice available:', tamilSystemVoice ? `${tamilSystemVoice.name} (${tamilSystemVoice.lang})` : 'No');

        voices = voiceConfigs.map(config => {
          return {
            name: config.name,
            lang: fallbackSystemVoice!.lang,
            voiceURI: `${config.name}-${fallbackSystemVoice!.voiceURI}`,
            localService: fallbackSystemVoice!.localService,
            default: false,
            _pitch: config.pitch
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
    
    loadVoices();
  });
};

export const getTamilVoices = (): SpeechSynthesisVoice[] => {
  return voices;
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

  if (!tamilSystemVoice && !fallbackSystemVoice) {
    console.error('No system voice available');
    return;
  }

  if (synth.paused) {
    synth.resume();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  const { voice: resolvedVoice, lang } = resolveSpeechTarget(text);

  if (resolvedVoice) {
    utterance.voice = resolvedVoice;
  }
  utterance.lang = lang;
  
  if (voice && '_pitch' in voice) {
    utterance.pitch = (voice as any)._pitch;
    console.log('Speaking with voice:', voice.name, 'pitch:', utterance.pitch, 'lang:', lang, 'system voice:', resolvedVoice?.name || 'browser-default');
  } else if (voice) {
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
