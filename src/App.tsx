import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import LandingPage from '@/pages/LandingPage';
import KakaoLoginStart from '@/pages/auth/KakaoLoginStart';
import KakaoLoginCallback from '@/pages/auth/KakaoLoginCallback';
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

// ✅ 추가
import ReplyPage from '@/pages/reply/ReplyPage';
import ReplyDetailPage from '@/pages/reply/ReplyDetailPage';

function SessionBridge() {
  const navigate = useNavigate();
  useEffect(() => {
    setOnSessionExpired(() => navigate('/', { replace: true }));
    return () => setOnSessionExpired(null);
  }, [navigate]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionBridge />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/kakao" element={<KakaoLoginStart />} />
        <Route path="/auth/kakao/callback" element={<KakaoLoginCallback />} />

        <Route path="/signup/role" element={<RolePage />} />
        <Route path="/signup/birth" element={<BirthGenderPage />} />
        <Route path="/signup/image" element={<ImagePage />} />
        <Route path="/signup/family" element={<FamilyCodePage />} />

        {/* ✅ 로그인 필요한 화면들 */}
        <Route element={<RequireAuth />}>
          {/* ✅ 탭 없는 화면들 (Home에서 들어가는 화면들) */}
          <Route path="/reply" element={<ReplyPage />} />
          <Route path="/reply-detail" element={<ReplyDetailPage />} />
          <Route path="/mypage-edit" element={<MypageEdit />} />
          <Route path="/not-assigned" element={<NotAssignedPage />} />

          {/* ✅ 탭 화면들 */}
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
