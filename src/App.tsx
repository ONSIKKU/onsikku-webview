import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import LandingPage from '@/pages/LandingPage';
import KakaoLoginStart from '@/pages/auth/KakaoLoginStart';
import RolePage from '@/pages/signup/RolePage';
import BirthGenderPage from '@/pages/signup/BirthGenderPage';
import ImagePage from '@/pages/signup/ImagePage';
import FamilyCodePage from '@/pages/signup/FamilyCodePage';
import TabsLayout from '@/layouts/TabsLayout';
import HomePage from '@/pages/tabs/HomePage';
import HistoryPage from '@/pages/tabs/HistoryPage';
import NotificationPage from '@/pages/tabs/NotificationPage';
import MypageEdit from '@/pages/MypageEdit';
import NotAssignedPage from '@/pages/NotAssignedPage';
import MyPage from '@/pages/tabs/MyPage';
import RequireAuth from '@/routes/RequireAuth';
import { setOnSessionExpired } from '@/utils/api';
import { useEffect } from 'react';

import GlobalModal from '@/components/GlobalModal';
import { useModalStore } from '@/features/modal/modalStore';

import ReplyPage from '@/pages/reply/ReplyPage';
import ReplyDetailPage from '@/pages/reply/ReplyDetailPage';

import DeepLinkBridge from '@/routes/DeepLinkBridge';

function SessionBridge() {
  const navigate = useNavigate();
  const { openModal } = useModalStore();

  useEffect(() => {
    setOnSessionExpired(() => {
      openModal({
        type: 'alert',
        title: '세션 만료',
        content: '세션이 만료되었습니다.\n다시 로그인해주세요.',
        onConfirm: () => navigate('/', { replace: true }),
      });
    });
    return () => setOnSessionExpired(null);
  }, [navigate, openModal]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <GlobalModal />

      <DeepLinkBridge />
      <SessionBridge />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/kakao" element={<KakaoLoginStart />} />

        <Route path="/signup/role" element={<RolePage />} />
        <Route path="/signup/birth" element={<BirthGenderPage />} />
        <Route path="/signup/image" element={<ImagePage />} />
        <Route path="/signup/family" element={<FamilyCodePage />} />

        <Route element={<RequireAuth />}>
          <Route path="/reply" element={<ReplyPage />} />
          <Route path="/reply-detail" element={<ReplyDetailPage />} />
          <Route path="/mypage-edit" element={<MypageEdit />} />
          <Route path="/not-assigned" element={<NotAssignedPage />} />

          <Route element={<TabsLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/notification" element={<NotificationPage />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
