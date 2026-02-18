import { getItem, removeItem, setItem } from "./AsyncStorage";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const DEFAULT_BASE_URL =
  (import.meta.env.VITE_API_BASE as string | undefined) || "https://api.onsikku.xyz";

let baseUrl = DEFAULT_BASE_URL;

type PushTokenPayload = {
  token: string;
  platform: string;
  fcmToken?: string;
  deviceType?: string;
};

const DEFAULT_PUSH_TOKEN_PATH =
  (import.meta.env.VITE_PUSH_TOKEN_PATH as string | undefined) ||
  "/api/notifications/tokens";
const PUSH_TOKEN_PATHS = [
  "/api/notifications/tokens",
];

const resolvePushTokenPaths = () => {
  const unique = new Set<string>([DEFAULT_PUSH_TOKEN_PATH, ...PUSH_TOKEN_PATHS]);
  return Array.from(unique);
};

const normalizeDeviceType = (platform: string) => {
  const lower = platform.toLowerCase();
  if (lower === "android") return "ANDROID";
  if (lower === "ios") return "IOS";
  return "ETC";
};

const buildPushTokenBody = (payload: PushTokenPayload) => {
  const deviceType = payload.deviceType || normalizeDeviceType(payload.platform);
  const token = payload.token;
  return {
    token,
    platform: payload.platform,
    deviceToken: token,
    fcmToken: payload.fcmToken || token,
    deviceType,
  };
};

const callPushTokenEndpoint = async <T>(
  method: "POST" | "DELETE",
  body: string = "",
) => {
  let lastError: unknown;
  const paths = resolvePushTokenPaths();
  for (const path of paths) {
    try {
      return await apiFetch<T>(path, { method, ...(body ? { body } : {}) });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

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

const parseJsonSafe = (text: string) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const getAuthFailureMessage = (json: any, text: string) =>
  json &&
  (json.errorMessage ||
    json.message ||
    json.error ||
    json.reason ||
    json.data?.message ||
    text);

const isAuthErrorResponse = (status: number, json: any) => {
  if (status === 401 || status === 403) return true;

  if (!json || typeof json !== "object") return false;

  const code = json.code;
  const codeStr = typeof code === "string" ? code.toUpperCase() : String(code ?? "").toUpperCase();
  const authCodes = [
    "UNAUTHORIZED",
    "AUTH_TOKEN_REQUIRED",
    "MISSING_AUTH_TOKEN",
    "INVALID_TOKEN",
    "TOKEN_EXPIRED",
    "TOKEN_INVALID",
    "EXPIRED_TOKEN",
    "UNAUTHENTICATED",
  ];
  if (
    typeof code === "number" &&
    [401, 403].includes(code)
  ) {
    return true;
  }
  if (codeStr && authCodes.includes(codeStr)) return true;

  const statusCode = json.status ?? json.statusCode;
  if (
    (typeof statusCode === "number" && [401, 403].includes(statusCode)) ||
    authCodes.includes(
      typeof statusCode === "string" ? statusCode.toUpperCase() : ""
    )
  ) {
    return true;
  }

  const message = String(
    json.errorMessage ||
      json.message ||
      json.error ||
      json.reason ||
      json.data?.message ||
      ""
  );
  if (!message) return false;

  const normalized = message.replace(/\s+/g, " ");
  return (
    /인증 토큰이 필요합니다/.test(normalized) ||
    /로그인/.test(normalized) && /필요/.test(normalized) ||
    /세션이 만료/.test(normalized) ||
    /만료.*토큰/.test(normalized)
  );
};

const handleSessionExpired = async () => {
  setAccessToken(null);
  await Promise.all([removeItem("accessToken"), removeItem("refreshToken")]);
  if (onSessionExpired) onSessionExpired();
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
      await handleSessionExpired();
    }
  }

  const text = await res.text();
  const json = parseJsonSafe(text);

  if (isAuthErrorResponse(res.status, json)) {
    const message =
      getAuthFailureMessage(json, text) || "인증 토큰이 필요합니다.";
    await handleSessionExpired();
    throw new Error(message);
  }

  if (!res.ok) {
    // Prioritize 'errorMessage' from the new ErrorResponse DTO
    const message =
      (json && (json.errorMessage || json.message || json.error)) || `HTTP ${res.status}`;
    throw new Error(message);
  }

  return (json && (json.result ?? json)) as T;
}

export async function apiFetchText(
  path: string,
  init?: RequestInit & { _retry?: boolean }
): Promise<string> {
  const url = baseUrl + path;
  const headers = getHeaders(
    init?.headers as Record<string, string> | undefined
  );

  const res = await fetch(url, {
    ...init,
    headers,
  });

  if (res.status === 401 && !init?._retry) {
    try {
      const storedRefreshToken = await getItem("refreshToken");
      if (!storedRefreshToken) {
        throw new Error("No refresh token available");
      }

      const newTokens = await refreshToken(storedRefreshToken);

      setAccessToken(newTokens.accessToken);
      await setItem("accessToken", newTokens.accessToken);

      if (newTokens.refreshToken) {
        await setItem("refreshToken", newTokens.refreshToken);
      }

      return apiFetchText(path, { ...init, _retry: true });
    } catch (refreshError) {
      console.error("[API] 토큰 갱신 실패:", refreshError);
      await handleSessionExpired();
    }
  }

  const text = await res.text();
  const json: any = parseJsonSafe(text);

  if (isAuthErrorResponse(res.status, json)) {
    const message =
      getAuthFailureMessage(json, text) || "인증 토큰이 필요합니다.";
    await handleSessionExpired();
    throw new Error(message);
  }

  if (!res.ok) {
    const message =
      (json && (json.errorMessage || json.message || json.error)) ||
      text ||
      `HTTP ${res.status}`;
    throw new Error(message);
  }

  return text || "";
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
  return apiFetch<void>("/api/members/delete", { 
    method: "POST",
    body: JSON.stringify({})
  });
}

// Auth types
export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  registrationToken?: string;
  isRegistered: boolean;
  registered?: boolean;
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

  // HTTP error or Business logic error (code != 200)
  if (!res.ok || (json && json.code && (json.code < 200 || json.code >= 300))) {
    const message =
      (json && (json.errorMessage || json.message || json.error)) || `HTTP ${res.status}`;
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
    throw new Error((json && (json.errorMessage || json.message)) || `HTTP ${res.status}`);
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
  myReaction?: "LIKE" | "ANGRY" | "SAD" | "FUNNY";
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
  myReaction?: "LIKE" | "ANGRY" | "SAD" | "FUNNY";
};

export type ReportReason =
  | "SPAM"
  | "INAPPROPRIATE_CONTENT"
  | "ABUSIVE_LANGUAGE"
  | "PRIVACY_VIOLATION"
  | "OTHER";

export type ReportTargetType = "MEMBER" | "COMMENT" | "ANSWER";

export type ReportRequest = {
  targetId: string;
  targetType: ReportTargetType;
  reason: ReportReason;
};

export type BlockRequest = {
  blockedId: string;
};

export type BlockedMember = {
  blockedId: string;
  nickname: string;
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

    const answer: Answer | undefined = rawDetails.answer
      ? {
          ...rawDetails.answer,
          id: rawDetails.answer.id,
          answerId: rawDetails.answer.id,
          myReaction: rawDetails.myReaction,
          member: convertToAppMember(
            (rawDetails.answer && (rawDetails.answer as any).member) ??
              rawDetails.member,
          ),
          memberId: (rawDetails.answer && (rawDetails.answer as any).member?.id) ||
            rawDetails.member?.id,
          likeReactionCount: rawDetails.likeCount || 0,
          angryReactionCount: rawDetails.angryCount || 0,
          sadReactionCount: rawDetails.sadCount || 0,
          funnyReactionCount: rawDetails.funnyCount || 0,
        }
      : undefined;

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
  answerContent?: string;
  member?: ApiMember;
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
      let answerContent = undefined;
      // Extract answer content if available (even if API spec says excluded, schema has it)
      if (qd.answer && qd.answer.content) {
          answerContent = typeof qd.answer.content === 'string' ? qd.answer.content : qd.answer.content.text;
      }

      return {
          questionInstanceId: qd.memberQuestionId,
          questionAssignmentId: qd.memberQuestionId,
          questionContent: qd.content,
          sentAt: qd.sentDate || (qd.answer ? qd.answer.createdAt : null), 
          dueAt: null,
          answeredAt: qd.answer ? qd.answer.createdAt : null,
          state: qd.questionStatus || (qd.answer ? "ANSWERED" : "SENT"),
          familyRole,
          gender,
          answerContent,
          member: qd.member,
      };
  });

  return {
      questionDetails: details
  };
}

export async function getRecentAnswers(limit: number = 5) {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    
    let allAnswers: QuestionDetails[] = [];
    
    // 1. Fetch current month
    try {
        let res = await getQuestionsByMonth(year, month);
        let answered = res.questionDetails.filter(q => q.state === 'ANSWERED');
        allAnswers = [...answered];

        // 2. If not enough, fetch previous month
        if (allAnswers.length < limit) {
            if (month === 1) {
                year -= 1;
                month = 12;
            } else {
                month -= 1;
            }
            res = await getQuestionsByMonth(year, month);
            answered = res.questionDetails.filter(q => q.state === 'ANSWERED');
            allAnswers = [...allAnswers, ...answered];
        }
    } catch (e) {
        console.error("Failed to fetch recent answers via monthly API", e);
        return [];
    }

    // 3. Sort by answeredAt desc (newest first)
    allAnswers.sort((a, b) => {
        const tA = a.answeredAt ? new Date(a.answeredAt).getTime() : 0;
        const tB = b.answeredAt ? new Date(b.answeredAt).getTime() : 0;
        return tB - tA;
    });

    // 4. Take top N
    const top = allAnswers.slice(0, limit);

    return top.map((q) => {
        const member = q.member
          ? convertToAppMember(q.member)
          : {
          familyRole: q.familyRole,
          gender: q.gender,
          id: q.questionInstanceId,
          role: "MEMBER",
          birthDate: "",
          profileImageUrl: "",
          alarmEnabled: false,
          createdAt: "",
          updatedAt: "",
        } as Member;

        return {
            id: q.questionInstanceId,
            answerId: q.questionInstanceId, 
            content: q.answerContent || q.questionContent || "내용을 불러올 수 없습니다.",
            createdAt: q.answeredAt || q.sentAt || new Date().toISOString(),
            updatedAt: q.answeredAt || q.sentAt || new Date().toISOString(),
            answerType: 'TEXT',
            questionContent: q.questionContent,
            questionInstanceId: q.questionInstanceId,
            familyRole: q.familyRole,
            gender: q.gender,
            member,
        } as Answer;
    });
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

export async function deleteReaction(payload: {
  answerId: string;
}) {
  return apiFetch<void>(`/api/reactions/${payload.answerId}`, {
    method: "DELETE",
  });
}

// Notification types
export type NotificationType =
  | "TODAY_TARGET_MEMBER"
  | "TODAY_TARGET_MEMBER_ANNOUNCED"
  | "ANSWER_ADDED"
  | "KNOCK_KNOCK"
  | "REACTION_ADDED"
  | "COMMENT_ADDED"
  | "MEMBER_JOINED"
  | "WEEKLY_REPORT"
  | "SYSTEM_NOTICE";

export type NotificationHistory = {
  id: string;
  member: ApiMember;
  notificationType: NotificationType;
  title: string;
  body: string;
  payload?: Record<string, string>;
  deepLink?: string;
  readAt: string | null;
  confirmedAt: string | null;
  publishedAt: string;
};

export type NotificationHistoryResponse = {
  notificationHistorySlice: {
    content: NotificationHistory[];
    size: number;
    number: number;
    first: boolean;
    last: boolean;
    numberOfElements: number;
    empty: boolean;
  };
  unReadCount: number;
};

export async function getNotifications(page: number = 0, size: number = 20) {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  const response = await apiFetch<NotificationHistoryResponse>(`/api/notifications?${params.toString()}`, {
    method: "GET",
  });
  return response;
}

export async function readNotification(notificationId: string) {
  return apiFetch<void>(`/api/notifications/${notificationId}/confirm`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsRead() {
  return apiFetch<void>("/api/notifications/read-all", {
    method: "PATCH",
  });
}

export async function deleteNotification(notificationId: string) {
  return apiFetch<void>(`/api/notifications/${notificationId}`, {
    method: "DELETE",
  });
}

export async function deleteAllNotifications() {
  return apiFetch<void>("/api/notifications/all", {
    method: "DELETE",
  });
}

// -------------------------
// Push Notification Token Sync
// -------------------------
export type UpsertPushTokenRequest = {
  token: string;
  /** Capacitor.getPlatform(): 'ios' | 'android' | 'web' */
  platform: string;
};

/**
 * 디바이스 푸시 토큰을 서버에 등록/업데이트합니다.
 * - 서버가 다른 형태를 기대한다면 여기만 수정하면 됩니다.
 */
export async function upsertPushToken(payload: UpsertPushTokenRequest) {
  return callPushTokenEndpoint<void>("POST", JSON.stringify(buildPushTokenBody(payload)));
}

/**
 * 디바이스 푸시 토큰을 서버에서 삭제합니다. (선택)
 * - 서버에서 DELETE를 지원하지 않으면 무시해도 됩니다.
 */
export async function deletePushToken(payload?: PushTokenPayload) {
  if (!payload) {
    return callPushTokenEndpoint<void>("DELETE");
  }

  const body = JSON.stringify(buildPushTokenBody(payload));
  try {
    return await callPushTokenEndpoint<void>("DELETE", body);
  } catch {
    return callPushTokenEndpoint<void>("DELETE");
  }
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

export async function reportContent(payload: ReportRequest) {
  return apiFetchText("/api/safety/report", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function blockUser(payload: BlockRequest) {
  return apiFetchText("/api/safety/block", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function unblockUser(payload: BlockRequest) {
  return apiFetchText("/api/safety/block", {
    method: "DELETE",
    body: JSON.stringify(payload),
  });
}

export async function getBlockedMembers() {
  return apiFetch<BlockedMember[]>("/api/safety/block", {
    method: "GET",
  });
}
