import { useCallback, useEffect, useState } from 'react';
import { SETTINGS_KEYS } from '../types';
import { recoverStuckSpeechSynthesis } from '../utils/systemSpeech';
import { readStoredBool, writeStoredBool } from '../utils/utils';

export const SPEECH_SETTINGS_CHANGE_EVENT = 'nihongo-speech-settings-change';

function dispatchSpeechSettingsChange() {
  window.dispatchEvent(new Event(SPEECH_SETTINGS_CHANGE_EVENT));
}

function hasStoredSpeechUseKanjiPreference() {
  try {
    return localStorage.getItem(SETTINGS_KEYS.speechUseKanji) !== null;
  } catch {
    return false;
  }
}

export function useSpeechSettings() {
  const [speechEnabled, setSpeechEnabledState] = useState(() =>
    readStoredBool(SETTINGS_KEYS.speechEnabled, false),
  );
  const [speechUseKanji, setSpeechUseKanjiState] = useState(() =>
    readStoredBool(SETTINGS_KEYS.speechUseKanji, true),
  );

  useEffect(() => {
    const refresh = () => {
      setSpeechEnabledState(readStoredBool(SETTINGS_KEYS.speechEnabled, false));
      setSpeechUseKanjiState(readStoredBool(SETTINGS_KEYS.speechUseKanji, true));
    };
    window.addEventListener(SPEECH_SETTINGS_CHANGE_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(SPEECH_SETTINGS_CHANGE_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const setSpeechEnabled = useCallback((value: boolean) => {
    writeStoredBool(SETTINGS_KEYS.speechEnabled, value);
    setSpeechEnabledState(value);
    if (value) {
      if (!hasStoredSpeechUseKanjiPreference()) {
        writeStoredBool(SETTINGS_KEYS.speechUseKanji, true);
        setSpeechUseKanjiState(true);
      }
      recoverStuckSpeechSynthesis();
    }
    dispatchSpeechSettingsChange();
  }, []);

  const setSpeechUseKanji = useCallback((value: boolean) => {
    writeStoredBool(SETTINGS_KEYS.speechUseKanji, value);
    setSpeechUseKanjiState(value);
    dispatchSpeechSettingsChange();
  }, []);

  const isSpeechActive = speechEnabled;

  return {
    speechEnabled,
    speechUseKanji,
    isSpeechActive,
    setSpeechEnabled,
    setSpeechUseKanji,
  };
}
