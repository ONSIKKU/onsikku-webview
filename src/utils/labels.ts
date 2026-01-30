import type { FamilyRole } from './api';

export const familyRoleToKo = (role: FamilyRole): string => {
  switch (role) {
    case 'FATHER':
      return '아빠';
    case 'MOTHER':
      return '엄마';
    case 'SON':
      return '아들';
    case 'DAUGHTER':
      return '딸';
    case 'GRANDFATHER':
      return '할아버지';
    case 'GRANDMOTHER':
      return '할머니';
    default:
      return '-';
  }
};

export const grandParentTypeToKo = (v?: string | null) => {
  switch (v) {
    case 'PATERNAL':
      return '친가';
    case 'MATERNAL':
      return '외가';
    default:
      return '-';
  }
};

export const genderToKo = (v?: string | null) => {
  switch (v) {
    case 'MALE':
      return '남성';
    case 'FEMALE':
      return '여성';
    default:
      return '-';
  }
};

export const roleToKo = (v?: string | null) => {
  switch (v) {
    case 'MEMBER':
      return '멤버';
    case 'ADMIN':
      return '관리자';
    default:
      return '-';
  }
};

// 역할(API Enum)에 따른 아이콘과 텍스트 반환
export const getRoleIconAndText = (
  role?: FamilyRole | null,
  // gender is now redundant but kept for optional compat or if needed for other logic
  gender?: string | null,
): { icon: string; text: string } => {
  if (!role) {
    return { icon: '👤', text: '-' };
  }

  switch (role) {
    case 'FATHER':
      return { icon: '👨🏻', text: '아빠' };
    case 'MOTHER':
      return { icon: '👩🏻', text: '엄마' };
    case 'SON':
      return { icon: '👦🏻', text: '아들' };
    case 'DAUGHTER':
      return { icon: '👧🏻', text: '딸' };
    case 'GRANDFATHER':
      return { icon: '👴🏻', text: '할아버지' };
    case 'GRANDMOTHER':
      return { icon: '👵🏻', text: '할머니' };
    default:
      return { icon: '👤', text: '-' };
  }
};

// UI Wizard Helper: Convert wizard state to API FamilyRole
export const getApiFamilyRole = (
  category: 'PARENT' | 'CHILD' | 'GRANDPARENT',
  gender: 'MALE' | 'FEMALE',
): FamilyRole => {
  if (category === 'PARENT') {
    return gender === 'MALE' ? 'FATHER' : 'MOTHER';
  }
  if (category === 'CHILD') {
    return gender === 'MALE' ? 'SON' : 'DAUGHTER';
  }
  if (category === 'GRANDPARENT') {
    return gender === 'MALE' ? 'GRANDFATHER' : 'GRANDMOTHER';
  }
  return 'FATHER'; // Fallback
};
