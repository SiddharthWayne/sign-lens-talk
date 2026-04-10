// ============= Speech Synthesis Handler =============

let synth: SpeechSynthesis;
let keepAliveInterval: NodeJS.Timeout | null = null;
let voices: SpeechSynthesisVoice[] = [];
let tamilSystemVoice: SpeechSynthesisVoice | null = null;
let hindiSystemVoice: SpeechSynthesisVoice | null = null;
let fallbackSystemVoice: SpeechSynthesisVoice | null = null;

const TAMIL_TEXT_REGEX = /[\u0B80-\u0BFF]/;
const DEFAULT_TAMIL_LANG = 'ta-IN';
const DEFAULT_FALLBACK_LANG = 'en-US';

const TAMIL_INDEPENDENT_VOWELS: Record<string, string> = {
  'அ': 'a',
  'ஆ': 'aa',
  'இ': 'i',
  'ஈ': 'ii',
  'உ': 'u',
  'ஊ': 'uu',
  'எ': 'e',
  'ஏ': 'ee',
  'ஐ': 'ai',
  'ஒ': 'o',
  'ஓ': 'oo',
  'ஔ': 'au',
  'ஃ': 'h',
};

const TAMIL_CONSONANTS: Record<string, string> = {
  'க': 'k',
  'ங': 'ng',
  'ச': 'ch',
  'ஜ': 'j',
  'ஞ': 'nj',
  'ட': 't',
  'ண': 'n',
  'த': 'th',
  'ந': 'n',
  'ப': 'p',
  'ம': 'm',
  'ய': 'y',
  'ர': 'r',
  'ல': 'l',
  'வ': 'v',
  'ழ': 'zh',
  'ள': 'l',
  'ற': 'r',
  'ன': 'n',
  'ஷ': 'sh',
  'ஸ': 's',
  'ஹ': 'h',
  'ஶ': 'sh',
};

const TAMIL_VOWEL_SIGNS: Record<string, string> = {
  'ா': 'aa',
  'ி': 'i',
  'ீ': 'ii',
  'ு': 'u',
  'ூ': 'uu',
  'ெ': 'e',
  'ே': 'ee',
  'ை': 'ai',
  'ொ': 'o',
  'ோ': 'oo',
  'ௌ': 'au',
};

const TAMIL_VIRAMA = '்';

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

const transliterateTamilText = (text: string): string => {
  let result = '';

  for (let index = 0; index < text.length; index += 1) {
    const currentChar = text[index];
    const nextChar = text[index + 1];

    if (TAMIL_INDEPENDENT_VOWELS[currentChar]) {
      result += TAMIL_INDEPENDENT_VOWELS[currentChar];
      continue;
    }

    if (TAMIL_CONSONANTS[currentChar]) {
      const baseSound = TAMIL_CONSONANTS[currentChar];

      if (nextChar === TAMIL_VIRAMA) {
        result += baseSound;
        index += 1;
        continue;
      }

      if (nextChar && TAMIL_VOWEL_SIGNS[nextChar]) {
        result += `${baseSound}${TAMIL_VOWEL_SIGNS[nextChar]}`;
        index += 1;
        continue;
      }

      result += `${baseSound}a`;
      continue;
    }

    if (!TAMIL_VOWEL_SIGNS[currentChar] && currentChar !== TAMIL_VIRAMA) {
      result += currentChar;
    }
  }

  return result.replace(/\s+/g, ' ').trim();
};

const resolveSpeechTarget = (
  text: string
): { voice: SpeechSynthesisVoice | null; lang: string; textToSpeak: string; mode: 'native-tamil' | 'transliterated-tamil' | 'default' } => {
  if (containsTamilText(text)) {
    // Best case: native Tamil voice available
    if (tamilSystemVoice) {
      return {
        voice: tamilSystemVoice,
        lang: tamilSystemVoice.lang || DEFAULT_TAMIL_LANG,
        textToSpeak: text,
        mode: 'native-tamil',
      };
    }

    // Fallback: transliterate and use Hindi voice for Indian accent
    if (hindiSystemVoice) {
      return {
        voice: hindiSystemVoice,
        lang: hindiSystemVoice.lang || 'hi-IN',
        textToSpeak: transliterateTamilText(text) || text,
        mode: 'transliterated-tamil',
      };
    }

    // Last resort: use any Indian English voice, or default voice with Indian lang hint
    const indianEnglishVoice = synth?.getVoices().find(v => 
      v.lang === 'en-IN' || v.name.toLowerCase().includes('india')
    );
    
    if (indianEnglishVoice) {
      return {
        voice: indianEnglishVoice,
        lang: 'en-IN',
        textToSpeak: transliterateTamilText(text) || text,
        mode: 'transliterated-tamil',
      };
    }

    // Absolute fallback with transliteration
    return {
      voice: fallbackSystemVoice,
      lang: 'en-IN', // Hint Indian English even if voice is British
      textToSpeak: transliterateTamilText(text) || text,
      mode: 'transliterated-tamil',
    };
  }

  return {
    voice: fallbackSystemVoice,
    lang: fallbackSystemVoice?.lang || DEFAULT_FALLBACK_LANG,
    textToSpeak: text,
    mode: 'default',
  };
};

export const initSpeech = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    synth = window.speechSynthesis;
    
    const loadVoices = () => {
      const systemVoices = synth.getVoices();
      
      console.log('System voices available:', systemVoices.length);
      // Log all available voices for debugging
      systemVoices.forEach(v => console.log(`  Voice: ${v.name} | Lang: ${v.lang} | Local: ${v.localService}`));

      // Search for Tamil voice broadly (ta, ta-IN, ta-LK, or name containing "Tamil")
      tamilSystemVoice = systemVoices.find(v => v.lang.toLowerCase().startsWith('ta')) ||
        systemVoices.find(v => v.name.toLowerCase().includes('tamil')) ||
        null;
      
      // Hindi voice as closest accent fallback for Tamil transliteration
      hindiSystemVoice = systemVoices.find(v => v.lang.toLowerCase().startsWith('hi')) ||
        systemVoices.find(v => v.name.toLowerCase().includes('hindi')) ||
        null;

      // English fallback for non-Tamil text
      fallbackSystemVoice = systemVoices.find(v => v.lang.toLowerCase().startsWith('en')) ||
        systemVoices.find(v => v.default) ||
        hindiSystemVoice ||
        tamilSystemVoice ||
        systemVoices[0] ||
        null;
      
      const baseVoice = fallbackSystemVoice || tamilSystemVoice;

      if (baseVoice) {
        console.log('Using fallback voice:', fallbackSystemVoice?.name || 'None', fallbackSystemVoice?.lang || 'N/A');
        console.log('Tamil voice available:', tamilSystemVoice ? `${tamilSystemVoice.name} (${tamilSystemVoice.lang})` : 'No');
        console.log('Hindi voice available:', hindiSystemVoice ? `${hindiSystemVoice.name} (${hindiSystemVoice.lang})` : 'No');

        voices = voiceConfigs.map(config => {
          return {
            name: config.name,
            lang: baseVoice.lang,
            voiceURI: `${config.name}-${baseVoice.voiceURI}`,
            localService: baseVoice.localService,
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

export const primeSpeech = (): void => {
  const activeSynth = synth || window.speechSynthesis;

  if (!activeSynth) {
    return;
  }

  synth = activeSynth;

  try {
    const unlockUtterance = new SpeechSynthesisUtterance('.');
    unlockUtterance.volume = 0;
    unlockUtterance.rate = 1;
    unlockUtterance.pitch = 1;
    unlockUtterance.lang = fallbackSystemVoice?.lang || DEFAULT_FALLBACK_LANG;
    unlockUtterance.voice = fallbackSystemVoice || tamilSystemVoice || null;

    activeSynth.cancel();
    activeSynth.speak(unlockUtterance);
  } catch (error) {
    console.warn('Speech priming failed:', error);
  }
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

  const { voice: resolvedVoice, lang, textToSpeak, mode } = resolveSpeechTarget(text);
  const utterance = new SpeechSynthesisUtterance(textToSpeak);

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
    console.log('Speech started:', { requestedText: text, spokenText: textToSpeak, lang, mode });
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
