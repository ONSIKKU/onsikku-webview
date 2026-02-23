import { create } from "zustand";

export type SignupRole = "PARENT" | "CHILD" | "GRANDPARENT";
export type SignupAgreementKey =
  | "age14"
  | "terms"
  | "privacy"
  | "overseas"
  | "marketing";

export type SignupAgreements = Record<SignupAgreementKey, boolean>;

//이건 타입이야
export type SignupState = {
  agreements: SignupAgreements;
  role: SignupRole | null;
  grandParentType: "PATERNAL" | "MATERNAL" | null;
  uri: string | null;
  gender: "MALE" | "FEMALE" | null;
  birthDate: string;
  nickname: string;
  familyName: string;
  familyInvitationCode: string;
  familyMode: "CREATE" | "JOIN";

  setAgreement: (key: SignupAgreementKey, value: boolean) => void;
  setAllAgreements: (value: boolean) => void;
  setRole: (r: SignupRole | null) => void;
  setGrandParentType: (pt: "PATERNAL" | "MATERNAL" | null) => void;
  setUri: (i: string | null) => void;
  setGender: (g: "MALE" | "FEMALE" | null) => void;
  setBirthDate: (b: string) => void;
  setNickname: (n: string) => void;
  setFamilyName: (n: string) => void;
  setFamilyInvitationCode: (c: string) => void;
  setFamilyMode: (m: "CREATE" | "JOIN") => void;
  reset: () => void;
};

export const useSignupStore = create<SignupState>((set) => ({
  agreements: {
    age14: false,
    terms: false,
    privacy: false,
    overseas: false,
    marketing: false,
  },
  role: null,
  grandParentType: null,
  uri: null,
  gender: null,
  birthDate: "",
  nickname: "",
  familyName: "",
  familyInvitationCode: "",
  familyMode: "JOIN",

  setAgreement: (key, value) =>
    set((state) => ({ agreements: { ...state.agreements, [key]: value } })),
  setAllAgreements: (value) =>
    set({
      agreements: {
        age14: value,
        terms: value,
        privacy: value,
        overseas: value,
        marketing: value,
      },
    }),

  // set 함수 모음
  setRole: (r) => set({ role: r }),
  setGrandParentType: (pt) => set({ grandParentType: pt }),
  setUri: (i) => set({ uri: i }),
  setGender: (g) => set({ gender: g }),
  setBirthDate: (b) => set({ birthDate: b }),
  setNickname: (n) => set({ nickname: n }),
  setFamilyName: (n) => set({ familyName: n }),
  setFamilyInvitationCode: (c) => set({ familyInvitationCode: c }),
  setFamilyMode: (m) => set({ familyMode: m }),

  //reset
  reset: () =>
    set({
      agreements: {
        age14: false,
        terms: false,
        privacy: false,
        overseas: false,
        marketing: false,
      },
      role: null,
      grandParentType: null,
      uri: null,
      gender: null,
      birthDate: "",
      nickname: "",
      familyName: "",
      familyInvitationCode: "",
      familyMode: "JOIN",
    }),
}));
