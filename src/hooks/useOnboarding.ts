/**
 * Custom hook for managing onboarding state
 * Persists onboarding completion status to localStorage
 */

import { useState, useEffect, useCallback } from 'react';

const ONBOARDING_KEY = 'calendar_onboarding_completed';

export const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if onboarding was completed
  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      setShowOnboarding(true);
    }
    setIsLoading(false);
  }, []);

  // Complete onboarding
  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  }, []);

  // Reset onboarding (for testing or re-showing)
  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY);
    setShowOnboarding(true);
  }, []);

  return {
    showOnboarding,
    isLoading,
    completeOnboarding,
    resetOnboarding,
    closeOnboarding: () => setShowOnboarding(false),
  };
};

export default useOnboarding;
