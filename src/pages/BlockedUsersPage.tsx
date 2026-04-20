import { useCallback, useEffect, useState } from 'react';
import BackButton from '@/components/BackButton';
import Skeleton from '@/components/Skeleton';
import { useModalStore } from '@/features/modal/modalStore';
import { getItem } from '@/utils/AsyncStorage';
import {
  getBlockedMembers,
  setAccessToken,
  type BlockedMember,
  unblockUser,
} from '@/utils/api';

export default function BlockedUsersPage() {
  const { openModal } = useModalStore();
  const [blockedMembers, setBlockedMembers] = useState<BlockedMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchBlockedMembers = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getItem('accessToken');
      if (token) setAccessToken(token);

      const blocked = await getBlockedMembers();
      setBlockedMembers(blocked || []);
    } catch (e) {
      console.error('[차단 목록 조회 에러]', e);
      openModal({ content: '차단 목록을 불러오지 못했습니다.' });
    } finally {
      setLoading(false);
    }
  }, [openModal]);

  useEffect(() => {
    fetchBlockedMembers();
  }, [fetchBlockedMembers]);

  const onUnblock = (member: BlockedMember) => {
    openModal({
      type: 'confirm',
      title: '차단 해제',
      content: `${member.nickname} 님의 차단을 해제할까요?`,
      onConfirm: async () => {
        try {
          setProcessingId(member.blockedId);
          await unblockUser({ blockedId: member.blockedId });
          await fetchBlockedMembers();
          openModal({ content: '차단이 해제되었습니다.' });
        } catch (e: any) {
          openModal({ content: e?.message || '차단 해제에 실패했습니다.' });
        } finally {
          setProcessingId(null);
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-orange-50 pt-safe pb-10">
      <div className="mx-auto w-full px-5 pt-8">
        <div className="mb-6 flex items-center gap-2">
          <BackButton />
          <h1 className="font-sans text-2xl font-bold text-gray-900">
            차단한 사용자
          </h1>
        </div>

        <div className="bg-white w-full p-6 rounded-3xl shadow-sm">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2"
                >
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-10 w-20 rounded-xl" />
                </div>
              ))}
            </div>
          ) : blockedMembers.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-base font-semibold text-gray-800">
                차단한 사용자가 없습니다.
              </div>
              <div className="mt-2 text-sm text-gray-500">
                차단한 사용자가 생기면 이곳에서 관리할 수 있어요.
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {blockedMembers.map((member, index) => (
                <div
                  key={member.blockedId}
                  className={`flex items-center justify-between py-2 ${
                    index !== blockedMembers.length - 1
                      ? 'border-b border-gray-100'
                      : ''
                  }`}
                >
                  <span className="font-sans text-gray-700">
                    {member.nickname}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUnblock(member)}
                    disabled={processingId === member.blockedId}
                    className="px-3 py-2 rounded-xl bg-gray-100 active:scale-95 transition-transform disabled:opacity-50 font-semibold text-sm text-gray-600"
                  >
                    {processingId === member.blockedId ? '처리 중...' : '차단 해제'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
