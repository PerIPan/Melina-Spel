let currentLang = "en-US";
let cachedVoices: Record<string, SpeechSynthesisVoice | null> = {};

function pickVoiceForLang(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const langPrefix = lang.split("-")[0]; // "en" from "en-US"

  // Get all voices matching this language
  const matching = voices.filter(
    (v) => v.lang === lang || v.lang.startsWith(langPrefix)
  );
  if (matching.length === 0) {
    return voices.find((v) => v.lang.startsWith("en")) || voices[0];
  }

  // Prefer female voices — look for names containing female indicators
  const femaleHints = ["female", "woman", "fiona", "samantha", "karen", "moira",
    "tessa", "victoria", "zuzana", "milena", "paulina", "mónica", "luciana",
    "joana", "lekha", "meijia", "yuna", "sara", "anna", "ellen", "nora",
    "zoe", "zosia", "yelda", "mei-jia", "damayanti", "helena", "reed",
    "sandy", "shelley", "martha", "alice", "amelie", "marie", "claire"];

  const isFemale = (v: SpeechSynthesisVoice) =>
    femaleHints.some((h) => v.name.toLowerCase().includes(h));

  // Prefer: female + premium/enhanced > female > any
  const femaleVoices = matching.filter(isFemale);

  // Among female voices, prefer "premium", "enhanced", or "natural" variants
  const premium = femaleVoices.find((v) =>
    /premium|enhanced|natural|neural/i.test(v.name)
  );
  if (premium) return premium;

  if (femaleVoices.length > 0) return femaleVoices[0];

  // No female found — prefer premium of any gender
  const anyPremium = matching.find((v) =>
    /premium|enhanced|natural|neural/i.test(v.name)
  );
  if (anyPremium) return anyPremium;

  return matching[0];
}

function getVoice(lang: string): SpeechSynthesisVoice | null {
  if (!cachedVoices[lang]) {
    cachedVoices[lang] = pickVoiceForLang(lang);
  }
  return cachedVoices[lang];
}

// Reload voice cache when voices change
if (typeof window !== "undefined") {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = {};
  };
}

export function setLanguage(speechLang: string): void {
  currentLang = speechLang;
}

export function speak(text: string, lang?: string): void {
  if (localStorage.getItem("melina-muted") === "true") return;
  window.speechSynthesis.cancel();

  const useLang = lang || currentLang;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.7;
  utterance.pitch = 1.1;
  utterance.volume = 1;
  utterance.lang = useLang;

  const voice = getVoice(useLang);
  if (voice) {
    utterance.voice = voice;
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  window.speechSynthesis.cancel();
}
