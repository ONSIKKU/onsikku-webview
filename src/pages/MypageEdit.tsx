import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getItem } from '@/utils/AsyncStorage';
import { getMyPage, patchMyPage, setAccessToken } from '@/utils/api';
import { ensurePushPermissionAndRegister, unregisterPushNotifications } from '@/utils/pushNotifications';
import { genderToKo, getApiFamilyRole } from '@/utils/labels';
import { IoArrowBack, IoCalendarOutline } from 'react-icons/io5';
import { useModalStore } from '@/features/modal/modalStore';

export default function MyPageEdit() {
  const navigate = useNavigate();
  const { openModal } = useModalStore();

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [gender, setGender] = useState<'MALE' | 'FEMALE' | ''>('');
  const [birthDate, setBirthDate] = useState<string>('');
  // Local state tracks Category (PARENT/CHILD/GRANDPARENT)
  const [roleCategory, setRoleCategory] = useState<
    'PARENT' | 'CHILD' | 'GRANDPARENT' | ''
  >('');
  const [nickname, setNickname] = useState<string>('');
  const [isAlarmEnabled, setIsAlarmEnabled] = useState<boolean>(true);
  const [isFamilyInviteEnabled, setIsFamilyInviteEnabled] =
    useState<boolean>(true);

  // Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempYear, setTempYear] = useState(2000);
  const [tempMonth, setTempMonth] = useState(1);
  const [tempDay, setTempDay] = useState(1);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const token = await getItem('accessToken');
        if (token) setAccessToken(token);

        const res = await getMyPage();
        setGender((res.member.gender as any) || '');
        setBirthDate(res.member.birthDate || '');

        // Map API specific role back to Category for UI
        const role = res.member.familyRole;
        if (role === 'FATHER' || role === 'MOTHER') setRoleCategory('PARENT');
        else if (role === 'SON' || role === 'DAUGHTER')
          setRoleCategory('CHILD');
        else if (role === 'GRANDFATHER' || role === 'GRANDMOTHER')
          setRoleCategory('GRANDPARENT');

        setNickname(res.member.nickname || '');
        setIsAlarmEnabled(res.member.alarmEnabled ?? true);
        setIsFamilyInviteEnabled(res.family.familyInviteEnabled ?? true);
      } catch (e: any) {
        console.error(e?.message || '정보를 불러오지 못했습니다');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const onSave = async () => {
    try {
      setSaving(true);

      if (!birthDate) {
        openModal({ content: '생년월일을 선택해 주세요' });
        setSaving(false);
        return;
      }

      if (!gender || !roleCategory) {
        openModal({ content: '성별과 역할을 선택해 주세요' });
        setSaving(false);
        return;
      }

      const apiRole = getApiFamilyRole(roleCategory, gender);

      await patchMyPage({
        birthDate: birthDate,
        familyRole: apiRole,
        nickname: nickname || undefined,
        isAlarmEnabled,
        isFamilyInviteEnabled,
      });

      // ✅ 알림 설정에 따라 네이티브 푸시 권한/등록 처리
      // - iOS/Android 네이티브에서만 동작합니다.
      // - 백엔드가 알림을 보내려면 디바이스 토큰이 서버에 등록되어 있어야 합니다.
      if (isAlarmEnabled) {
        await ensurePushPermissionAndRegister(false);
      } else {
        await unregisterPushNotifications();
      }

      openModal({ content: '프로필이 수정되었습니다.' });
      navigate(-1);
    } catch (e: any) {
      openModal({ content: e?.message || '수정에 실패했습니다' });
    } finally {
      setSaving(false);
    }
  };

  const openDatePicker = () => {
    let y = 2000,
      m = 1,
      d = 1;
    if (birthDate) {
      const parts = birthDate.split('-');
      if (parts.length === 3) {
        y = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10);
        d = parseInt(parts[2], 10);
      }
    }
    setTempYear(y);
    setTempMonth(m);
    setTempDay(d);
    setShowDatePicker(true);
  };

  const confirmDate = () => {
    const y = tempYear;
    const m = String(tempMonth).padStart(2, '0');
    const d = String(tempDay).padStart(2, '0');
    setBirthDate(`${y}-${m}-${d}`);
    setShowDatePicker(false);
  };

  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: 100 }, (_, i) => currentYear - i),
    [currentYear],
  );
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const daysInMonth = new Date(tempYear, tempMonth, 0).getDate();
  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth],
  );

  // tempDay가 월 최대 일수보다 크면 보정 (웹 select에서만 생길 수 있음)
  useEffect(() => {
    if (tempDay > daysInMonth) setTempDay(daysInMonth);
  }, [daysInMonth, tempDay]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <p className="font-sans text-gray-600">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 pt-safe">
      <div className="mx-auto w-full max-w-md">
        {/* Header */}
        <div className="px-4 py-2 flex flex-row items-center mb-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm mr-4 active:opacity-70"
          >
            <IoArrowBack size={24} color="#374151" />
          </button>

          <h1 className="font-sans text-xl font-bold text-gray-900">
            내 정보 수정
          </h1>
        </div>

        <div className="px-6 pb-10 space-y-6">
          {/* Nickname Section */}
          <div className="bg-white p-6 rounded-3xl shadow-sm flex flex-col gap-4">
            <p className="font-sans text-base font-bold text-gray-800">
              닉네임
            </p>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임을 입력하세요"
              className="bg-gray-50 rounded-xl px-4 py-3 text-base text-gray-900 outline-none border border-transparent focus:border-onsikku-dark-orange transition-colors"
            />
          </div>

          {/* Gender Section */}
          <div className="bg-white p-6 rounded-3xl shadow-sm flex flex-col gap-4">
            <p className="font-sans text-base font-bold text-gray-800">성별</p>
            <div className="flex flex-row gap-3">
              {(['MALE', 'FEMALE'] as const).map((g) => {
                const isSelected = gender === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={
                      'flex-1 py-3 rounded-xl flex items-center justify-center border-2 ' +
                      (isSelected
                        ? 'bg-orange-50 border-orange-500'
                        : 'bg-gray-50 border-transparent')
                    }
                  >
                    <span
                      className={
                        'font-sans text-base ' +
                        (isSelected
                          ? 'text-orange-600 font-bold'
                          : 'text-gray-500 font-medium')
                      }
                    >
                      {genderToKo(g)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BirthDate Section */}
          <div className="bg-white p-6 rounded-3xl shadow-sm flex flex-col gap-4">
            <p className="font-sans text-base font-bold text-gray-800">
              생년월일
            </p>
            <button
              type="button"
              onClick={openDatePicker}
              className="bg-gray-50 rounded-xl px-4 py-3 flex flex-row justify-between items-center active:opacity-80"
            >
              <span
                className={
                  'font-sans text-base ' +
                  (birthDate ? 'text-gray-900' : 'text-gray-400')
                }
              >
                {birthDate || 'YYYY-MM-DD'}
              </span>
              <IoCalendarOutline size={20} color="#9CA3AF" />
            </button>
          </div>

          {/* Role Section */}
          <div className="bg-white p-6 rounded-3xl shadow-sm flex flex-col gap-4">
            <p className="font-sans text-base font-bold text-gray-800">
              가족 내 역할
            </p>
            <div className="flex flex-row gap-3 flex-wrap">
              {(['PARENT', 'CHILD', 'GRANDPARENT'] as const).map((r) => {
                const isSelected = roleCategory === r;
                let label = '';
                if (r === 'PARENT') label = '부모';
                else if (r === 'CHILD') label = '자녀';
                else if (r === 'GRANDPARENT') label = '조부모';

                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRoleCategory(r)}
                    className={
                      'px-5 py-3 rounded-xl flex items-center justify-center border-2 ' +
                      (isSelected
                        ? 'bg-orange-50 border-orange-500'
                        : 'bg-gray-50 border-transparent')
                    }
                  >
                    <span
                      className={
                        'font-sans text-base ' +
                        (isSelected
                          ? 'text-orange-600 font-bold'
                          : 'text-gray-500 font-medium')
                      }
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Settings Section */}
          <div className="bg-white p-6 rounded-3xl shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-sans text-base font-bold text-gray-800">
                  알림 설정
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  질문 도착 및 답변 알림을 받습니다
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAlarmEnabled(!isAlarmEnabled)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  isAlarmEnabled ? 'bg-onsikku-dark-orange' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    isAlarmEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-6">
              <div>
                <p className="font-sans text-base font-bold text-gray-800">
                  가족 초대 허용
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  새로운 가족 멤버 초대를 허용합니다
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFamilyInviteEnabled(!isFamilyInviteEnabled)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  isFamilyInviteEnabled
                    ? 'bg-onsikku-dark-orange'
                    : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    isFamilyInviteEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="mt-4 w-full bg-onsikku-dark-orange rounded-full flex items-center justify-center py-4 shadow-sm disabled:opacity-60"
          >
            <span className="font-sans text-white font-bold text-lg">
              {saving ? '저장 중...' : '저장하기'}
            </span>
          </button>
        </div>
      </div>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50">
          <div className="w-full bg-white rounded-t-3xl p-6">
            <div className="flex flex-row justify-between items-center mb-4 border-b border-gray-100 pb-4">
              <button type="button" onClick={() => setShowDatePicker(false)}>
                <span className="font-sans text-gray-500 text-base">취소</span>
              </button>
              <span className="font-sans font-bold text-lg text-gray-800">
                생년월일 선택
              </span>
              <button type="button" onClick={confirmDate}>
                <span className="font-sans text-orange-500 font-bold text-base">
                  확인
                </span>
              </button>
            </div>

            <div className="flex flex-row justify-center items-center">
              {/* Year */}
              <div className="flex-1">
                <select
                  value={tempYear}
                  onChange={(e) => setTempYear(parseInt(e.target.value, 10))}
                  size={5}
                  className="w-full h-[150px] text-[16px] outline-none"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}년
                    </option>
                  ))}
                </select>
              </div>

              {/* Month */}
              <div className="flex-1">
                <select
                  value={tempMonth}
                  onChange={(e) => setTempMonth(parseInt(e.target.value, 10))}
                  size={5}
                  className="w-full h-[150px] text-[16px] outline-none"
                >
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {m}월
                    </option>
                  ))}
                </select>
              </div>

              {/* Day */}
              <div className="flex-1">
                <select
                  value={tempDay}
                  onChange={(e) => setTempDay(parseInt(e.target.value, 10))}
                  size={5}
                  className="w-full h-[150px] text-[16px] outline-none"
                >
                  {days.map((d) => (
                    <option key={d} value={d}>
                      {d}일
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
