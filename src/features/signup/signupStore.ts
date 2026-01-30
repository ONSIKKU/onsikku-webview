import { create } from "zustand";

export type SignupRole = "PARENT" | "CHILD" | "GRANDPARENT";

//이건 타입이야
export type SignupState = {
  role: SignupRole | null;
  grandParentType: "PATERNAL" | "MATERNAL" | null;
  uri: string | null;
  gender: "MALE" | "FEMALE" | null;
  birthDate: string;
  nickname: string;
  familyName: string;
  familyInvitationCode: string;
  familyMode: "CREATE" | "JOIN";

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
  role: null,
  grandParentType: null,
  uri: null,
  gender: null,
  birthDate: "",
  nickname: "",
  familyName: "",
  familyInvitationCode: "",
  familyMode: "JOIN",

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
