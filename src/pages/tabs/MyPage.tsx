import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoutButton from '@/components/mypage/LogoutButton';
import { useSignupStore } from '@/features/signup/signupStore';
import type { MypageResponse } from '@/utils/api';
import {
  deleteMember,
  getMyPage,
  logout,
  patchMyPage,
  setAccessToken,
} from '@/utils/api';
import { getItem, removeItem } from '@/utils/AsyncStorage';
import { genderToKo, getRoleIconAndText } from '@/utils/labels';
import {
  IoCreateOutline,
  IoHomeOutline,
  IoPeopleOutline,
  IoCalendarOutline,
  IoMaleFemaleOutline,
  IoPersonCircleOutline,
  IoKeyOutline,
  IoCopyOutline,
  IoRefresh,
} from 'react-icons/io5';

export default function MyPage() {
  const navigate = useNavigate();

  const [data, setData] = useState<MypageResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [updating, setUpdating] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchMyPage = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const token = await getItem('accessToken');
      if (token) setAccessToken(token);

      const res = await getMyPage();
      setData(res);
    } catch (e: any) {
      setError(e?.message || '마이페이지를 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyPage();
  }, [fetchMyPage]);

  const calculateAge = (birthDateString: string | undefined): number | null => {
    if (!birthDateString) return null;
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const regenerateInvitation = async () => {
    if (!data?.family) return;
    try {
      setUpdating(true);
      const isCurrentlyEnabled = data.family.familyInviteEnabled;

      if (isCurrentlyEnabled) {
        await patchMyPage({ isFamilyInviteEnabled: false });
      }

      const res = await patchMyPage({ isFamilyInviteEnabled: true });
      setData(res);
      alert('초대코드가 재발급되었습니다.');
    } catch (e: any) {
      alert(e?.message || '초대코드 재발급에 실패했습니다');
    } finally {
      setUpdating(false);
    }
  };

  const copyInvitationCode = async () => {
    const code = data?.family?.invitationCode;
    if (!code) {
      alert('초대코드가 없습니다.');
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
      alert('초대코드가 클립보드에 복사되었습니다.');
    } catch {
      alert('복사에 실패했습니다.');
    }
  };

  const onEditProfile = () => {
    navigate('/mypage-edit');
  };

  const onLogout = async () => {
    const ok = window.confirm('로그아웃 하시겠어요?');
    if (!ok) return;

    try {
      setUpdating(true);
      await logout();
      await removeItem('accessToken');
      await removeItem('refreshToken');
      await removeItem('registrationToken');
      setAccessToken(null);
      useSignupStore.getState().reset();
      navigate('/', { replace: true });
    } catch (e: any) {
      alert(e?.message || '로그아웃에 실패했습니다');
    } finally {
      setUpdating(false);
    }
  };

  const onDeleteAccount = async () => {
    const ok = window.confirm('정말 탈퇴하시겠습니까?');
    if (!ok) return;

    if (deleting) return;
    try {
      setDeleting(true);
      await deleteMember();
      await removeItem('accessToken');
      await removeItem('refreshToken');
      await removeItem('registrationToken');
      useSignupStore.getState().reset();
      navigate('/', { replace: true });
    } catch (e: any) {
      alert(e?.message || '회원 탈퇴에 실패했습니다');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="-mx-4 -mt-4 min-h-screen bg-onsikku-main-orange flex items-center justify-center">
        <p className="text-gray-600">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="-mx-4 -mt-4 min-h-screen bg-onsikku-main-orange">
      <div className="px-4 pt-5 pb-[30px]">
        <div className="gap-4 flex flex-col">
          {/* 내 정보 카드 */}
          <div className="bg-white w-full p-5 rounded-3xl shadow-sm">
            <div className="flex flex-row items-center justify-between mb-4">
              <div className="text-xl font-bold text-gray-800">기본 정보</div>

              <button
                type="button"
                onClick={onEditProfile}
                className="flex flex-row items-center px-3 py-1.5 bg-orange-50 rounded-lg active:opacity-70"
              >
                <IoCreateOutline size={18} color="#FB923C" />
                <span className="text-sm font-medium text-orange-600 ml-1">
                  수정
                </span>
              </button>
            </div>

            <div className="gap-3 flex flex-col">
              <div className="flex flex-row items-center justify-between py-2 border-b border-gray-100">
                <div className="flex flex-row items-center">
                  <IoPersonCircleOutline size={22} color="#FB923C" />
                  <span className="text-base text-gray-600 ml-2">닉네임</span>
                </div>
                <span className="text-base font-medium text-gray-800">
                  {data?.member?.nickname || '-'}
                </span>
              </div>

              <div className="flex flex-row items-center justify-between py-2 border-b border-gray-100">
                <div className="flex flex-row items-center">
                  <IoHomeOutline size={22} color="#FB923C" />
                  <span className="text-base text-gray-600 ml-2">가족명</span>
                </div>
                <span className="text-base font-medium text-gray-800">
                  {data?.family?.familyName}
                </span>
              </div>

              <div className="flex flex-row items-center justify-between py-2 border-b border-gray-100">
                <div className="flex flex-row items-center">
                  <IoPeopleOutline size={22} color="#FB923C" />
                  <span className="text-base text-gray-600 ml-2">
                    가족 내 역할
                  </span>
                </div>
                <span className="text-base font-medium text-gray-800">
                  {
                    getRoleIconAndText(
                      data?.member?.familyRole,
                      data?.member?.gender,
                    ).text
                  }
                </span>
              </div>

              <div className="flex flex-row items-center justify-between py-2 border-b border-gray-100">
                <div className="flex flex-row items-center">
                  <IoCalendarOutline size={22} color="#FB923C" />
                  <span className="text-base text-gray-600 ml-2">생년월일</span>
                </div>
                <span className="text-base font-medium text-gray-800">
                  {data?.member?.birthDate ?? '-'}
                </span>
              </div>

              <div className="flex flex-row items-center justify-between py-2">
                <div className="flex flex-row items-center">
                  <IoMaleFemaleOutline size={22} color="#FB923C" />
                  <span className="text-base text-gray-600 ml-2">성별</span>
                </div>
                <span className="text-base font-medium text-gray-800">
                  {genderToKo(data?.member?.gender)}
                </span>
              </div>
            </div>
          </div>

          {/* 함께하는 가족 */}
          <div className="bg-white w-full p-5 rounded-3xl shadow-sm">
            <div className="text-xl font-bold text-gray-800 mb-4">
              함께하는 가족
            </div>
            <div className="gap-3 flex flex-col">
              {data?.familyMembers?.map((member, index) => {
                const isLast = index === (data.familyMembers?.length ?? 0) - 1;
                return (
                  <div
                    key={member.id}
                    className={
                      'flex flex-row items-center justify-between py-2 ' +
                      (!isLast ? 'border-b border-gray-100' : '')
                    }
                  >
                    <div className="flex flex-row items-center">
                      <IoPersonCircleOutline size={26} color="#FB923C" />
                      <span className="text-base text-gray-600 ml-2">
                        {
                          getRoleIconAndText(member.familyRole, member.gender)
                            .text
                        }{' '}
                        ({calculateAge(member.birthDate)}세)
                      </span>
                      {member.id === data?.member?.id && (
                        <span className="text-xs font-bold text-orange-500 ml-1">
                          (나)
                        </span>
                      )}
                    </div>

                    <span className="text-base font-medium text-gray-800">
                      {
                        getRoleIconAndText(member.familyRole, member.gender)
                          .text
                      }
                    </span>
                  </div>
                );
              })}

              {(!data?.familyMembers || data.familyMembers.length === 0) && (
                <div className="text-gray-400 text-center py-4">
                  아직 가족 구성원이 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* 설정 카드 */}
          <div className="bg-white w-full p-5 rounded-3xl shadow-sm">
            <div className="text-xl font-bold text-gray-800 mb-4">설정</div>

            <div className="gap-3 flex flex-col">
              <div className="flex flex-row items-center justify-between py-2 border-t border-gray-100 pt-3">
                <div className="flex flex-row items-center flex-1">
                  <IoKeyOutline size={22} color="#FB923C" />
                  <div className="ml-2">
                    <div className="text-base text-gray-800">가족 초대코드</div>
                    <div className="text-sm text-gray-500 mt-0.5 font-mono">
                      {data?.family?.invitationCode || '-'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-row gap-2">
                  <button
                    type="button"
                    onClick={copyInvitationCode}
                    className="px-3 py-2 rounded-lg bg-orange-50 active:opacity-70"
                  >
                    <IoCopyOutline size={16} color="#FB923C" />
                  </button>

                  <button
                    type="button"
                    onClick={regenerateInvitation}
                    disabled={updating}
                    className="px-3 py-2 rounded-lg bg-orange-50 active:opacity-70 disabled:opacity-60"
                  >
                    <IoRefresh size={16} color="#FB923C" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <LogoutButton onPress={onLogout} />

          <button
            type="button"
            onClick={onDeleteAccount}
            className="bg-white w-full p-4 rounded-3xl shadow-sm items-center active:opacity-70"
          >
            <span className="text-red-500 font-medium">
              {deleting ? '탈퇴 처리 중...' : '회원 탈퇴'}
            </span>
          </button>

          {error ? (
            <div className="text-red-500 text-sm text-center">{error}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
