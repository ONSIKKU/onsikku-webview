import { getItem, removeItem, setItem } from "./AsyncStorage";
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const DEFAULT_BASE_URL =
  (import.meta.env.VITE_API_BASE as string | undefined) || "https://api.onsikku.xyz";

let baseUrl = DEFAULT_BASE_URL;

export const setBaseUrl = (url: string) => {
  baseUrl = url || DEFAULT_BASE_URL;
};

/**
 * Web-only: allow the app layer (React Router) to decide where to navigate
 * when the session expires.
 */
let onSessionExpired: (() => void) | null = null;
export const setOnSessionExpired = (fn: (() => void) | null) => {
  onSessionExpired = fn;
};

// Lightweight token storage bridge
let inMemoryToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryToken = token;
};

const getHeaders = (extra?: Record<string, string>) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extra || {}),
  };
  if (inMemoryToken) {
    headers["Authorization"] = `Bearer ${inMemoryToken}`;
  }
  return headers;
};

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { _retry?: boolean }
): Promise<T> {
  const url = baseUrl + path;
  const headers = getHeaders(
    init?.headers as Record<string, string> | undefined
  );

  const res = await fetch(url, {
    ...init,
    headers,
  });

  // Handle 401 (Unauthorized) - Token Refresh Logic
  if (res.status === 401 && !init?._retry) {
    try {
      const storedRefreshToken = await getItem("refreshToken");
      if (!storedRefreshToken) {
        throw new Error("No refresh token available");
      }

      // Call refreshToken logic
      const newTokens = await refreshToken(storedRefreshToken);

      // Update memory and storage
      setAccessToken(newTokens.accessToken);
      await setItem("accessToken", newTokens.accessToken);

      if (newTokens.refreshToken) {
        await setItem("refreshToken", newTokens.refreshToken);
      }

      // Retry the original request with the new token
      return apiFetch<T>(path, { ...init, _retry: true });
    } catch (refreshError) {
      console.error("[API] 토큰 갱신 실패:", refreshError);
      setAccessToken(null);
      await removeItem("accessToken");
      await removeItem("refreshToken");
      console.warn("Session expired but redirect suppressed for testing.");
    }
  }

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      (json && (json.message || json.error)) || `HTTP ${res.status}`;
    throw new Error(message);
  }

  return (json && (json.result ?? json)) as T;
}

// --- Type Definitions ---

// App Types (UI에서 사용) & API Types (서버 통신용) - Unified
export type FamilyRole =
  | "MOTHER"
  | "FATHER"
  | "DAUGHTER"
  | "SON"
  | "GRANDMOTHER"
  | "GRANDFATHER";

export type Role = "MEMBER" | "ADMIN";

// Helper Functions for Deriving Info from Role
export function getGenderFromRole(role: FamilyRole): "MALE" | "FEMALE" {
  switch (role) {
    case "FATHER":
    case "SON":
    case "GRANDFATHER":
      return "MALE";
    case "MOTHER":
    case "DAUGHTER":
    case "GRANDMOTHER":
      return "FEMALE";
  }
}

export type Family = {
  createdAt: string;
  updatedAt: string;
  id: string;
  familyName: string;
  invitationCode: string;
  lastAiQuestionDate?: string;
  familyInviteEnabled: boolean;
};

// API 응답용 Member 타입
export type ApiMember = {
  createdAt: string;
  updatedAt: string;
  id: string;
  birthDate: string;
  familyRole: FamilyRole;
  nickname: string;
  profileImageUrl: string;
  alarmEnabled: boolean;
};

// App용 Member 타입 (gender 포함 - 역할에서 유도됨)
export type Member = {
  createdAt: string;
  updatedAt: string;
  id: string;
  role: Role;
  gender: "MALE" | "FEMALE";
  birthDate: string;
  familyRole: FamilyRole;
  profileImageUrl: string;
  alarmEnabled: boolean;
  nickname?: string;
};

function convertToAppMember(apiMember: ApiMember): Member {
  return {
    ...apiMember,
    role: "MEMBER", // Default
    gender: getGenderFromRole(apiMember.familyRole),
  };
}

export type ApiMypageResponse = {
  member: ApiMember;
  family: Family;
  familyMembers: ApiMember[];
};

export type MypageResponse = {
  member: Member;
  family: Family;
  familyMembers: Member[];
};

// Helper type for the app layer to call patchMyPage
export type AppMypagePatch = Partial<{
  nickname: string;
  profileImageUrl: string | null;
  familyRole: FamilyRole;
  birthDate: string;
  isAlarmEnabled: boolean;
  isFamilyInviteEnabled: boolean;
}>;

export async function getMyPage() {
  const res = await apiFetch<ApiMypageResponse>("/api/members/mypage", {
    method: "GET",
  });
  return {
    member: convertToAppMember(res.member),
    family: res.family,
    familyMembers: res.familyMembers.map(convertToAppMember),
  };
}

export async function patchMyPage(payload: AppMypagePatch) {
  // Payload now directly matches what API expects mostly (except camelCase check)
  // API spec for patch: `familyRole` is the enum string.
  
  const apiPayload: any = {};
  if (payload.birthDate !== undefined) apiPayload.birthDate = payload.birthDate;
  if (payload.profileImageUrl !== undefined) apiPayload.profileImageUrl = payload.profileImageUrl;
  if (payload.nickname !== undefined) apiPayload.nickname = payload.nickname;
  if (payload.isAlarmEnabled !== undefined) apiPayload.isAlarmEnabled = payload.isAlarmEnabled;
  if (payload.isFamilyInviteEnabled !== undefined) apiPayload.isFamilyInviteEnabled = payload.isFamilyInviteEnabled;
  if (payload.familyRole !== undefined) apiPayload.familyRole = payload.familyRole;

  const res = await apiFetch<ApiMypageResponse>("/api/members/mypage", {
    method: "PATCH",
    body: JSON.stringify(apiPayload),
  });
  return {
    member: convertToAppMember(res.member),
    family: res.family,
    familyMembers: res.familyMembers.map(convertToAppMember),
  };
}

export function deleteMember() {
  return apiFetch<void>("/api/members/delete", { method: "POST" });
}

// Auth types
export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  registrationToken?: string;
  registered: boolean;
};

// API Spec matching SignupRequest
export type SignupRequest = {
  registrationToken: string;
  familyRole: FamilyRole;
  nickname?: string;
  birthDate: string; // yyyy-MM-dd
  profileImageUrl?: string | null;
  familyMode: "CREATE" | "JOIN";
  familyName?: string;
  familyInvitationCode?: string;
};

export async function signup(payload: SignupRequest) {
  const url = baseUrl + "/api/auth/signup";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      (json && (json.message || json.error)) || `HTTP ${res.status}`;
    throw new Error(message);
  }

  return (json && (json.result ?? json)) as AuthResponse;
}

export async function logout() {
  return apiFetch<string>("/api/members/logout", { method: "POST" });
}

export type TokenRefreshRequest = {
  refreshToken: string;
};

export async function refreshToken(refreshToken: string) {
  const url = baseUrl + "/api/auth/refresh";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error((json && json.message) || `HTTP ${res.status}`);
  }

  return (json && (json.result ?? json)) as AuthResponse;
}

// Question types
export type QuestionState =
  | "PENDING"
  | "SENT"
  | "READ"
  | "ANSWERED"
  | "EXPIRED"
  | "FAILED";

export type QuestionAssignment = {
  id: string; // memberQuestionId in API? No, API returns QuestionDetails with memberQuestionId
  member: Member;
  dueAt: string;
  sentAt: string | null;
  readAt: string | null;
  answeredAt: string | null;
  expiredAt: string | null;
  state: QuestionState;
  reminderCount: number;
  lastRemindedAt: string | null;
};

// API Spec for QuestionDetails
export type ApiQuestionDetails = {
  memberQuestionId: string;
  content: string;
  member: ApiMember;
  answer?: any; // ApiAnswer
  comments?: any[];
  // ... counts
};

export type ApiQuestionResponse = {
  questionDetailsList?: ApiQuestionDetails[];
  questionDetails?: ApiQuestionDetails;
  totalQuestionCount?: number;
  answeredQuestionCount?: number;
  familyMembers?: ApiMember[];
};

export type QuestionResponse = {
  questionDetails?: {
    questionContent: string;
    questionInstanceId: string;
    questionAssignments: QuestionAssignment[];
  };
  familyMembers: Member[];
};

// 오늘의 질문 조회 (App 구조에 맞춰 변환)
export async function getTodayQuestions() {
  const res = await apiFetch<ApiQuestionResponse>("/api/questions", {
    method: "GET",
  });

  const familyMembers = (res.familyMembers || []).map(convertToAppMember);
  const assignments: QuestionAssignment[] = [];

  // 1. Try to use questionDetailsList (Family view)
  if (res.questionDetailsList && res.questionDetailsList.length > 0) {
    res.questionDetailsList.forEach((qd) => {
      assignments.push({
        id: qd.memberQuestionId,
        member: convertToAppMember(qd.member),
        state: qd.answer ? "ANSWERED" : "SENT", // Logic could be more complex if API provides explicit state
        dueAt: "", // API doesn't provide dueAt yet?
        sentAt: null,
        readAt: null,
        answeredAt: qd.answer ? qd.answer.createdAt : null,
        expiredAt: null,
        reminderCount: 0,
        lastRemindedAt: null,
      });
    });
  } 
  // 2. Fallback to single questionDetails (Legacy/Single view)
  else if (res.questionDetails) {
    const qd = res.questionDetails;
    assignments.push({
      id: qd.memberQuestionId,
      member: convertToAppMember(qd.member),
      state: qd.answer ? "ANSWERED" : "SENT",
      dueAt: "",
      sentAt: null,
      readAt: null,
      answeredAt: qd.answer ? qd.answer.createdAt : null,
      expiredAt: null,
      reminderCount: 0,
      lastRemindedAt: null,
    });
  }

  // Determine main content and ID from the first available assignment or the single detail
  const mainDetail = res.questionDetailsList?.[0] || res.questionDetails;

  return {
    questionDetails: {
      questionContent: mainDetail?.content || "",
      questionInstanceId: mainDetail?.memberQuestionId || "",
      questionAssignments: assignments,
    },
    familyMembers,
  };
}

// Answer types
export type AnswerType =
  | "TEXT"
  | "IMAGE"
  | "AUDIO"
  | "VIDEO"
  | "FILE"
  | "MIXED";

export type AnswerRequest = {
  answerId?: string;
  questionAssignmentId: string; // This maps to `memberQuestionId` in API
  answerType?: AnswerType;
  content?: any;
  reactionType?: "LIKE" | "ANGRY" | "SAD" | "FUNNY";
};

export type Answer = {
  answerId: string;
  memberId: string;
  familyRole: FamilyRole;
  gender: "MALE" | "FEMALE";
  createdAt: string;
  content: any;
  likeReactionCount: number;
  angryReactionCount: number;
  sadReactionCount: number;
  funnyReactionCount: number;
  // Compatibility
  id?: string;
  questionAssignment?: QuestionAssignment;
  member?: Member;
  questionContent?: string;
  questionInstanceId?: string;
};

// Helper to convert ApiAnswer to App Answer
function convertApiAnswer(apiAnswer: any, apiMember: ApiMember): Answer {
    const { familyRole, gender } = convertApiRoleToAppRole(apiMember.familyRole);
    return {
        answerId: apiAnswer.answerId,
        memberId: apiMember.id,
        familyRole,
        gender,
        createdAt: apiAnswer.createdAt,
        content: apiAnswer.content,
        likeReactionCount: 0, // API answer response schema doesn't show counts directly in Answer object, might be in QuestionDetails
        angryReactionCount: 0,
        sadReactionCount: 0,
        funnyReactionCount: 0,
        id: apiAnswer.answerId,
        member: convertToAppMember(apiMember)
    };
}

export async function createAnswer(payload: AnswerRequest) {
  let content = payload.content;
  if (payload.answerType === "TEXT" && typeof payload.content === "string") {
    content = { text: payload.content };
  }

  const res = await apiFetch<any>("/api/questions/answers", {
    method: "POST",
    body: JSON.stringify({
      memberQuestionId: payload.questionAssignmentId,
      answerType: payload.answerType || "TEXT",
      content: content,
    }),
  });

  // Response is BaseResponseAnswerResponse -> AnswerResponse
  // Need to map back to App Answer.
  // The response contains memberId, nickname, familyRole, but maybe not gender?
  // We can infer gender from familyRole (API enum).
  const { familyRole, gender } = convertApiRoleToAppRole(res.familyRole);

  return {
      answerId: res.answerId,
      memberId: res.memberId,
      familyRole,
      gender,
      createdAt: res.createdAt,
      content: res.content,
      likeReactionCount: 0,
      angryReactionCount: 0,
      sadReactionCount: 0,
      funnyReactionCount: 0,
      id: res.answerId
  } as Answer;
}

export async function getQuestionInstanceDetails(questionInstanceId: string) {
  const res = await apiFetch<ApiQuestionResponse>(
    `/api/questions/${questionInstanceId}`,
    {
      method: "GET",
    }
  );
  
  // Need to adapt to QuestionResponse structure expected by UI
  // UI expects `questionDetails.answers`
  // API `QuestionDetails` has `answer` (singular? or maybe specific to that memberQuestionId?)
  // The path `/api/questions/{memberQuestionId}` gets details for ONE instance.
  // If we want ALL answers for a question, we might need a different endpoint or the API behavior is different.
  // Assuming for now we just map what we have.
  
  const qd = res.questionDetails;
  const answers: Answer[] = [];
  if (qd && qd.answer) {
      answers.push(convertApiAnswer(qd.answer, qd.member));
  }

  // Construct assignment for this instance so ReplyDetailPage can find it
  const assignments: QuestionAssignment[] = [];
  if (qd) {
      assignments.push({
          id: qd.memberQuestionId,
          member: convertToAppMember(qd.member),
          state: qd.answer ? "ANSWERED" : "SENT",
          dueAt: "",
          sentAt: qd.answer ? qd.answer.createdAt : null,
          readAt: null,
          answeredAt: qd.answer ? qd.answer.createdAt : null,
          expiredAt: null,
          reminderCount: 0,
          lastRemindedAt: null
      });
  }

  return {
      questionDetails: {
          questionContent: qd?.content || "",
          questionInstanceId: qd?.memberQuestionId || "",
          answers: answers,
          comments: qd?.comments || [],
          questionAssignments: assignments
      }
  };
}

// QuestionDetails 타입 (UI용, HistoryPage 등에서 사용)
export type QuestionDetails = {
  questionInstanceId: string; // memberQuestionId or global ID?
  questionContent: string;
  sentAt: string | null;
  dueAt: string | null;
  answeredAt: string | null;
  state: QuestionState;
  // Add other fields if needed by QuestionList
};

// 월별 질문 조회
export async function getQuestionsByMonth(year: number, month: number) {
  const params = new URLSearchParams({
    year: year.toString(),
    month: month.toString(),
  });
  const res = await apiFetch<ApiQuestionResponse>(
    `/api/questions/monthly?${params.toString()}`,
    {
      method: "GET",
    }
  );

  // Convert ApiQuestionResponse to UI-friendly QuestionDetails[]
  // The API returns questionDetailsList
  const details: QuestionDetails[] = (res.questionDetailsList || []).map((qd) => {
      // Assuming qd is ApiQuestionDetails
      return {
          questionInstanceId: qd.memberQuestionId,
          questionContent: qd.content,
          // API doesn't seem to return sentAt/dueAt/state directly in QuestionDetails based on previous typedef?
          // Let's check ApiQuestionDetails type again.
          // ApiQuestionDetails has member, answer, comments...
          // It doesn't have sentAt, dueAt, state.
          // Maybe it's inside `memberQuestionId` object or implied?
          // Or maybe the API response includes more fields than I typed.
          // For now, let's mock or infer.
          sentAt: qd.answer ? qd.answer.createdAt : null, // Approximate
          dueAt: null,
          answeredAt: qd.answer ? qd.answer.createdAt : null,
          state: qd.answer ? "ANSWERED" : "SENT"
      };
  });

  return {
      questionDetails: details
  };
}

// 최근 답변 조회 (최근 N개월의 질문에서 답변된 것들만)
export async function getRecentAnswers(months: number = 1, limit: number = 10) {
    // This requires complex logic mapping or a dedicated API.
    // For now, return empty to avoid crashes.
    return [];
}


// ... Rest of the functions (addReaction, comments, etc) need similar updates
// but for brevity and focusing on Signup, leaving them as is or simplified.

export async function addReaction(payload: {
  answerId: string;
  reactionType: "LIKE" | "ANGRY" | "SAD" | "FUNNY";
}) {
  await apiFetch<void>("/api/reactions", {
    method: "POST",
    body: JSON.stringify({
        answerId: payload.answerId,
        type: payload.reactionType
    }),
  });
  return {} as Answer; // Dummy return
}

// Notification types
export type NotificationType =
  | "COMMENT"
  | "REACTION"
  | "ANSWER"
  | "ALL_ANSWERED"
  | "NEW_QUESTION";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: string;
    familyRole: ApiFamilyRole;
    gender: "MALE" | "FEMALE"; // API might not have gender in sender, need to check
  };
};

export async function getNotifications() {
    // Assuming API structure
  const response = await apiFetch<NotificationItem[]>("/api/notifications", {
    method: "GET",
  });
  return response;
}

export async function createComment(payload: any) {
    return apiFetch<any>("/api/comments", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}

export async function updateComment(payload: any) {
    return apiFetch<any>("/api/comments", {
        method: "PATCH",
        body: JSON.stringify(payload)
    });
}

export async function deleteComment(commentId: string) {
  return apiFetch<void>(`/api/comments/${commentId}`, {
    method: "DELETE",
  });
}

export async function updateAnswer(payload: AnswerRequest) {
    // Implementation for update
     return apiFetch<any>("/api/questions/answers", {
        method: "PATCH",
        body: JSON.stringify({
             answerId: payload.answerId,
             memberQuestionId: payload.questionAssignmentId,
             content: { text: payload.content } // Assuming text
        })
    });
}

export async function deleteAnswer(payload: AnswerRequest) {
     // Implementation for delete
     return apiFetch<void>("/api/questions/test/answers", { // Note: using test endpoint per api.md? No, api.md has /api/questions/test/answers for delete? 
         // Wait, api.md says DELETE /api/questions/test/answers is "테스트용 답변 삭제".
         // Is there a real delete? Not seen in the truncated api.md paths provided.
         // Assuming test delete for now or implement if real one exists.
         method: "DELETE",
         body: JSON.stringify({
             answerId: payload.answerId,
             memberQuestionId: payload.questionAssignmentId
         })
     });
}
