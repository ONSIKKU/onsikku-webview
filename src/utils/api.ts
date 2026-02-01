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

export type ApiFamilyRole = FamilyRole;

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
  id: string; // memberQuestionId
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
  answer?: any; 
  comments?: any[];
  sentDate?: string; 
  likeCount?: number;
  angryCount?: number;
  sadCount?: number;
  funnyCount?: number;
  questionStatus?: QuestionState;
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

export type Answer = {
  id: string;
  answerId: string;
  member: Member;
  memberId?: string;
  content: any;
  createdAt: string;
  updatedAt: string;
  answerType: string;
  questionContent?: string;
  questionInstanceId?: string;
  familyRole?: FamilyRole;
  gender?: "MALE" | "FEMALE";
  likeReactionCount?: number;
  angryReactionCount?: number;
  sadReactionCount?: number;
  funnyReactionCount?: number;
};

export type Comment = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  member?: Member;
  familyRole?: FamilyRole;
  gender?: "MALE" | "FEMALE";
  parent?: Comment;
  parentId?: string;
};

export type AnswerRequest = {
    answerId?: string;
    memberQuestionId?: string; // API spec
    questionAssignmentId?: string; // UI alias
    answerType?: "TEXT" | "IMAGE" | "AUDIO" | "VIDEO" | "FILE" | "MIXED";
    content: any;
    reactionType?: "LIKE" | "ANGRY" | "SAD" | "FUNNY";
};

export async function getTodayQuestions() {
  const res = await apiFetch<ApiQuestionResponse>("/api/questions", {
    method: "GET",
  });

  let rawAssignments = res.questionDetailsList || [];
  if (rawAssignments.length === 0 && res.questionDetails) {
    rawAssignments = [res.questionDetails];
  }

  const assignments: QuestionAssignment[] = rawAssignments.map(qd => {
     return {
        id: qd.memberQuestionId,
        member: convertToAppMember(qd.member),
        state: qd.questionStatus || (qd.answer ? 'ANSWERED' : 'SENT'),
        dueAt: '', 
        sentAt: qd.sentDate || null,
        readAt: null,
        answeredAt: qd.answer ? qd.answer.createdAt : null,
        expiredAt: null,
        reminderCount: 0,
        lastRemindedAt: null
     };
  });
  
  const firstDetail = res.questionDetailsList?.[0] || res.questionDetails;

  return {
    questionDetails: firstDetail ? {
        questionContent: firstDetail.content,
        questionInstanceId: firstDetail.memberQuestionId, 
        questionAssignments: assignments
    } : null,
    familyMembers: (res.familyMembers || []).map(convertToAppMember)
  };
}

export async function getQuestionInstanceDetails(memberQuestionId: string) {
  const res = await apiFetch<ApiQuestionResponse>(`/api/questions/${memberQuestionId}`, {
    method: "GET",
  });

  const rawDetails = res.questionDetails;
  
  if (!rawDetails) {
    return { questionDetails: null };
  }

  const answer: Answer | undefined = rawDetails.answer ? {
      ...rawDetails.answer,
      id: rawDetails.answer.id,
      answerId: rawDetails.answer.id,
      member: convertToAppMember(rawDetails.member),
      memberId: rawDetails.member.id,
      likeReactionCount: rawDetails.likeCount || 0,
      angryReactionCount: rawDetails.angryCount || 0,
      sadReactionCount: rawDetails.sadCount || 0,
      funnyReactionCount: rawDetails.funnyCount || 0,
  } : undefined;

  const comments: Comment[] = (rawDetails.comments || []).map((c: any) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      member: c.member ? convertToAppMember(c.member) : undefined,
      parent: c.parentComment ? { id: c.parentComment.id } as Comment : undefined,
  }));

  return {
    questionDetails: {
        questionContent: rawDetails.content,
        questionInstanceId: rawDetails.memberQuestionId,
        questionAssignments: [],
        answers: answer ? [answer] : [],
        comments: comments
    }
  };
}

export async function createAnswer(payload: AnswerRequest) {
    return apiFetch<any>("/api/questions/answers", {
        method: "POST",
        body: JSON.stringify({
            memberQuestionId: payload.memberQuestionId || payload.questionAssignmentId,
            answerType: payload.answerType || "TEXT",
            content: typeof payload.content === 'string' ? { text: payload.content } : payload.content
        })
    });
}

// QuestionDetails 타입 (UI용, HistoryPage 등에서 사용)
export type QuestionDetails = {
  questionInstanceId: string;
  questionAssignmentId: string;
  questionContent: string;
  sentAt: string | null;
  dueAt: string | null;
  answeredAt: string | null;
  state: QuestionState;
  familyRole: FamilyRole;
  gender: "MALE" | "FEMALE";
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

  let rawDetailsList = res.questionDetailsList || [];
  if (rawDetailsList.length === 0 && res.questionDetails) {
    rawDetailsList = [res.questionDetails];
  }

  const details: QuestionDetails[] = rawDetailsList.map((qd) => {
      const { familyRole, gender } = convertToAppMember(qd.member);
      return {
          questionInstanceId: qd.memberQuestionId,
          questionAssignmentId: qd.memberQuestionId,
          questionContent: qd.content,
          sentAt: qd.sentDate || (qd.answer ? qd.answer.createdAt : null), 
          dueAt: null,
          answeredAt: qd.answer ? qd.answer.createdAt : null,
          state: qd.questionStatus || (qd.answer ? "ANSWERED" : "SENT"),
          familyRole,
          gender
      };
  });

  return {
      questionDetails: details
  };
}

export async function getRecentAnswers(months: number = 1, limit: number = 10) {
    return [] as Answer[];
}


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
  return {} as Answer; 
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
    gender: "MALE" | "FEMALE"; 
  };
};

export async function getNotifications() {
  const response = await apiFetch<NotificationItem[]>("/api/notifications", {
    method: "GET",
  });
  return response;
}

export async function createComment(payload: any) {
    const body = { ...payload };
    if (body.questionInstanceId) {
        body.memberQuestionId = body.questionInstanceId;
        delete body.questionInstanceId;
    }
    return apiFetch<any>("/api/comments", {
        method: "POST",
        body: JSON.stringify(body)
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
     return apiFetch<any>("/api/questions/answers", {
        method: "PATCH",
        body: JSON.stringify({
             answerId: payload.answerId,
             memberQuestionId: payload.memberQuestionId || payload.questionAssignmentId, 
             content: typeof payload.content === 'string' ? { text: payload.content } : payload.content
        })
    });
}

export async function deleteAnswer(payload: AnswerRequest) {
     return apiFetch<void>("/api/questions/test/answers", { 
         method: "DELETE",
         body: JSON.stringify({
             answerId: payload.answerId,
             memberQuestionId: payload.memberQuestionId || payload.questionAssignmentId
         })
     });
}
