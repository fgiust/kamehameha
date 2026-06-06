import { useCallback, useEffect, useState } from 'react';
import { useDebugMode } from './useDebugMode';
import { SETTINGS_KEYS } from '../types';
import { readStoredBool, writeStoredBool } from '../utils/utils';

export const SPEECH_SETTINGS_CHANGE_EVENT = 'nihongo-speech-settings-change';

function dispatchSpeechSettingsChange() {
  window.dispatchEvent(new Event(SPEECH_SETTINGS_CHANGE_EVENT));
}

export function useSpeechSettings() {
  const debugMode = useDebugMode();
  const [speechEnabled, setSpeechEnabledState] = useState(() =>
    readStoredBool(SETTINGS_KEYS.speechEnabled, false),
  );
  const [speechUseKanji, setSpeechUseKanjiState] = useState(() =>
    readStoredBool(SETTINGS_KEYS.speechUseKanji, false),
  );

  useEffect(() => {
    const refresh = () => {
      setSpeechEnabledState(readStoredBool(SETTINGS_KEYS.speechEnabled, false));
      setSpeechUseKanjiState(readStoredBool(SETTINGS_KEYS.speechUseKanji, false));
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
    dispatchSpeechSettingsChange();
  }, []);

  const setSpeechUseKanji = useCallback((value: boolean) => {
    writeStoredBool(SETTINGS_KEYS.speechUseKanji, value);
    setSpeechUseKanjiState(value);
    dispatchSpeechSettingsChange();
  }, []);

  const isSpeechActive = debugMode && speechEnabled;

  return {
    speechEnabled,
    speechUseKanji,
    isSpeechActive,
    setSpeechEnabled,
    setSpeechUseKanji,
  };
}
