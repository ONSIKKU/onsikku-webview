import type { FamilyRole } from './api';

import fatherImg from '@/assets/images/family/father.svg';
import motherImg from '@/assets/images/family/mother.svg';
import sonImg from '@/assets/images/family/son.svg';
import daughterImg from '@/assets/images/family/daughter.svg';
import grandFatherImg from '@/assets/images/family/grand-father.svg';
import grandMotherImg from '@/assets/images/family/grand-mother.svg';

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
  _gender?: string | null,
): { icon: string; text: string; color: string } => {
  if (!role) {
    return { icon: '👤', text: '-', color: '#D1D5DB' };
  }

  switch (role) {
    case 'FATHER':
      return { icon: fatherImg, text: '아빠', color: '#1E88E5' };
    case 'MOTHER':
      return { icon: motherImg, text: '엄마', color: '#D81B60' };
    case 'SON':
      return { icon: sonImg, text: '아들', color: '#43A047' };
    case 'DAUGHTER':
      return { icon: daughterImg, text: '딸', color: '#FB8C00' };
    case 'GRANDFATHER':
      return { icon: grandFatherImg, text: '할아버지', color: '#455A64' };
    case 'GRANDMOTHER':
      return { icon: grandMotherImg, text: '할머니', color: '#8E24AA' };
    default:
      return { icon: '👤', text: '-', color: '#9CA3AF' };
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
