import type { SignupAgreements } from '@/features/signup/signupStore';
import { getItem, setItem } from '@/utils/AsyncStorage';

const CONSENT_STORAGE_KEY = 'consentPreferences';

export type ConsentPreferences = {
  terms: boolean;
  privacy: boolean;
  aiDataUsage: boolean;
  marketing: boolean;
};

const DEFAULT_CONSENT_PREFERENCES: ConsentPreferences = {
  terms: false,
  privacy: false,
  aiDataUsage: false,
  marketing: false,
};

export async function getConsentPreferences(): Promise<ConsentPreferences> {
  const raw = await getItem(CONSENT_STORAGE_KEY);
  if (!raw) return DEFAULT_CONSENT_PREFERENCES;

  try {
    const parsed = JSON.parse(raw) as Partial<ConsentPreferences>;
    return {
      ...DEFAULT_CONSENT_PREFERENCES,
      ...parsed,
    };
  } catch {
    return DEFAULT_CONSENT_PREFERENCES;
  }
}

export async function saveConsentPreferences(
  next: Partial<ConsentPreferences>,
) {
  const current = await getConsentPreferences();
  await setItem(CONSENT_STORAGE_KEY, JSON.stringify({ ...current, ...next }));
}

export function extractConsentPreferences(
  agreements: Pick<
    SignupAgreements,
    'terms' | 'privacy' | 'aiDataUsage' | 'marketing'
  >,
): ConsentPreferences {
  return {
    terms: agreements.terms,
    privacy: agreements.privacy,
    aiDataUsage: agreements.aiDataUsage,
    marketing: agreements.marketing,
  };
}
