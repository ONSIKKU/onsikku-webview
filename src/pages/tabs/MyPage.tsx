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
import RoleIcon from '@/components/RoleIcon';
import { useModalStore } from '@/features/modal/modalStore';

export default function MyPage() {
  const navigate = useNavigate();
  const { openModal } = useModalStore();

  const [data, setData] = useState<MypageResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchMyPage = useCallback(async () => {
    try {
      setLoading(true);

      const token = await getItem('accessToken');
      if (token) setAccessToken(token);

      const res = await getMyPage();
      setData(res);
    } catch (e: any) {
      console.error(e?.message || '마이페이지를 불러오지 못했습니다');
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
    
    openModal({
        type: 'confirm',
        title: '초대코드 재발급',
        content: '초대코드를 재발급하시겠습니까?\n기존 코드는 사용할 수 없게 됩니다.',
        onConfirm: async () => {
            try {
              setUpdating(true);
              const isCurrentlyEnabled = data.family.familyInviteEnabled;

              if (isCurrentlyEnabled) {
                await patchMyPage({ isFamilyInviteEnabled: false });
              }

              const res = await patchMyPage({ isFamilyInviteEnabled: true });
              setData(res);
              openModal({ content: '초대코드가 재발급되었습니다.' });
            } catch (e: any) {
              openModal({ content: e?.message || '초대코드 재발급에 실패했습니다' });
            } finally {
              setUpdating(false);
            }
        }
    });
  };

  const copyInvitationCode = async () => {
    const code = data?.family?.invitationCode;
    if (!code) {
      openModal({ content: '초대코드가 없습니다.' });
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
      openModal({ content: '초대코드가 클립보드에 복사되었습니다.' });
    } catch {
      openModal({ content: '복사에 실패했습니다.' });
    }
  };

  const onEditProfile = () => {
    navigate('/mypage-edit');
  };

  const onLogout = async () => {
    openModal({
      type: 'confirm',
      title: '로그아웃',
      content: '정말 로그아웃 하시겠어요?',
      confirmText: '로그아웃',
      onConfirm: async () => {
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
          openModal({ content: e?.message || '로그아웃에 실패했습니다' });
        }
        finally {
          setUpdating(false);
        }
      }
    });
  };

  const onDeleteAccount = async () => {
    openModal({
      type: 'confirm',
      title: '회원 탈퇴',
      content: '정말 탈퇴하시겠습니까?\n모든 데이터가 삭제되며 복구할 수 없습니다.',
      confirmText: '탈퇴하기',
      cancelText: '유지하기',
      onConfirm: async () => {
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
          openModal({ content: e?.message || '회원 탈퇴에 실패했습니다' });
        } finally {
          setDeleting(false);
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <p className="font-sans text-gray-500">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 pb-10">
      <div className="mx-auto w-full px-5 pt-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-sans text-2xl font-bold text-gray-900 ml-1">
            내 정보
          </h1>
        </div>

        <div className="gap-5 flex flex-col">
          {/* 내 정보 카드 */}
          <div className="bg-white w-full p-6 rounded-3xl shadow-sm">
            <div className="flex flex-row items-center justify-between mb-5">
              <div className="text-lg font-bold text-gray-900">기본 정보</div>

              <button
                type="button"
                onClick={onEditProfile}
                className="flex flex-row items-center px-3 py-1.5 bg-orange-50 rounded-xl active:scale-95 transition-transform"
              >
                <IoCreateOutline size={16} color="#FB923C" />
                <span className="text-sm font-bold text-orange-600 ml-1.5">
                  수정
                </span>
              </button>
            </div>

            <div className="gap-4 flex flex-col">
              <div className="flex flex-row items-center justify-between py-1">
                <div className="flex flex-row items-center">
                  <div className="bg-orange-50 p-1.5 rounded-full">
                    <IoPersonCircleOutline size={20} color="#FB923C" />
                  </div>
                  <span className="text-base text-gray-500 ml-3">닉네임</span>
                </div>
                <span className="text-base font-medium text-gray-900">
                  {data?.member?.nickname || '-'}
                </span>
              </div>

              <div className="flex flex-row items-center justify-between py-1">
                <div className="flex flex-row items-center">
                  <div className="bg-orange-50 p-1.5 rounded-full">
                    <IoHomeOutline size={20} color="#FB923C" />
                  </div>
                  <span className="text-base text-gray-500 ml-3">가족명</span>
                </div>
                <span className="text-base font-medium text-gray-900">
                  {data?.family?.familyName}
                </span>
              </div>

              <div className="flex flex-row items-center justify-between py-1">
                <div className="flex flex-row items-center">
                  <div className="bg-orange-50 p-1.5 rounded-full">
                    <IoPeopleOutline size={20} color="#FB923C" />
                  </div>
                  <span className="text-base text-gray-500 ml-3">
                    역할
                  </span>
                </div>
                <span className="text-base font-medium text-gray-900">
                  {
                    getRoleIconAndText(
                      data?.member?.familyRole,
                      data?.member?.gender,
                    ).text
                  }
                </span>
              </div>

              <div className="flex flex-row items-center justify-between py-1">
                <div className="flex flex-row items-center">
                  <div className="bg-orange-50 p-1.5 rounded-full">
                    <IoCalendarOutline size={20} color="#FB923C" />
                  </div>
                  <span className="text-base text-gray-500 ml-3">생년월일</span>
                </div>
                <span className="text-base font-medium text-gray-900">
                  {data?.member?.birthDate ?? '-'}
                </span>
              </div>

              <div className="flex flex-row items-center justify-between py-1">
                <div className="flex flex-row items-center">
                  <div className="bg-orange-50 p-1.5 rounded-full">
                    <IoMaleFemaleOutline size={20} color="#FB923C" />
                  </div>
                  <span className="text-base text-gray-500 ml-3">성별</span>
                </div>
                <span className="text-base font-medium text-gray-900">
                  {genderToKo(data?.member?.gender)}
                </span>
              </div>
            </div>
          </div>

          {/* 함께하는 가족 */}
          <div className="bg-white w-full p-6 rounded-3xl shadow-sm">
            <div className="text-lg font-bold text-gray-900 mb-5">
              함께하는 가족
            </div>
            <div className="gap-3 flex flex-col">
              {data?.familyMembers?.map((member, index) => {
                const isLast = index === (data.familyMembers?.length ?? 0) - 1;
                return (
                  <div
                    key={member.id}
                    className={
                      'flex flex-row items-center justify-between py-3 ' +
                      (!isLast ? 'border-b border-gray-50' : '')
                    }
                  >
                    <div className="flex flex-row items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                        <RoleIcon
                          icon={
                            getRoleIconAndText(member.familyRole, member.gender)
                              .icon
                          }
                          size={40}
                        />
                      </div>
                      <span className="text-base text-gray-600 ml-3 font-medium">
                        {
                          getRoleIconAndText(member.familyRole, member.gender)
                            .text
                        }{' '}
                        <span className="text-gray-400 text-sm font-normal ml-1">
                          ({calculateAge(member.birthDate)}세)
                        </span>
                      </span>
                      {member.id === data?.member?.id && (
                        <span className="text-xs font-bold text-white bg-orange-400 px-1.5 py-0.5 rounded ml-2">
                          나
                        </span>
                      )}
                    </div>
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
          <div className="bg-white w-full p-6 rounded-3xl shadow-sm">
            <div className="text-lg font-bold text-gray-900 mb-4">설정</div>

            <div className="gap-3 flex flex-col">
              <div className="flex flex-row items-center justify-between py-2">
                <div className="flex flex-row items-center flex-1">
                  <div className="bg-orange-50 p-1.5 rounded-full">
                    <IoKeyOutline size={20} color="#FB923C" />
                  </div>
                  <div className="ml-3">
                    <div className="text-base text-gray-900 font-medium">초대코드</div>
                    <div className="text-sm text-gray-500 mt-0.5 font-mono tracking-wider">
                      {data?.family?.invitationCode || '-'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-row gap-2">
                  <button
                    type="button"
                    onClick={copyInvitationCode}
                    className="p-2.5 rounded-xl bg-orange-50 active:scale-95 transition-transform"
                    aria-label="복사"
                  >
                    <IoCopyOutline size={18} color="#FB923C" />
                  </button>

                  <button
                    type="button"
                    onClick={regenerateInvitation}
                    disabled={updating}
                    className="p-2.5 rounded-xl bg-orange-50 active:scale-95 transition-transform disabled:opacity-50"
                    aria-label="재발급"
                  >
                    <IoRefresh size={18} color="#FB923C" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <LogoutButton onPress={onLogout} />

            <button
              type="button"
              onClick={onDeleteAccount}
              className="bg-white w-full p-4 rounded-2xl shadow-sm items-center active:scale-[0.98] transition-transform"
            >
              <span className="text-red-500 font-medium text-base">
                {deleting ? '탈퇴 처리 중...' : '회원 탈퇴'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}