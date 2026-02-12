import { useState } from 'react';

export const useModals = () => {
  const [showAIExtractor, setShowAIExtractor] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showApiKeySetup, setShowApiKeySetup] = useState(false);
  const [showDailyConfirmation, setShowDailyConfirmation] = useState(false);

  const openAIExtractor = () => setShowAIExtractor(true);
  const closeAIExtractor = () => setShowAIExtractor(false);

  const openHistory = () => setShowHistory(true);
  const closeHistory = () => setShowHistory(false);

  const openApiKeySetup = () => setShowApiKeySetup(true);
  const closeApiKeySetup = () => setShowApiKeySetup(false);

  const openDailyConfirmation = () => setShowDailyConfirmation(true);
  const closeDailyConfirmation = () => setShowDailyConfirmation(false);

  return {
    showAIExtractor,
    openAIExtractor,
    closeAIExtractor,
    showHistory,
    openHistory,
    closeHistory,
    showApiKeySetup,
    openApiKeySetup,
    closeApiKeySetup,
    showDailyConfirmation,
    openDailyConfirmation,
    closeDailyConfirmation
  };
};

export default useModals;
