import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

import HeroSection from '../components/login/HeroSection';
import LoginForm from '../components/login/LoginForm';
import ScrollSection from '../components/login/ScrollSection';
import bgImage from '../assets/images/dental-light-bg.png';

const ROLE_REDIRECT_MAP = {
  ADMIN: '/admin/dashboard',
  DENTIST: '/dentist/dashboard',
  EMPLOYEE: '/employee/dashboard',
  PATIENT: '/patient/dashboard',
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // If already authenticated, redirect to dashboard
  if (!authLoading && isAuthenticated && user) {
    const redirectTo = location.state?.from?.pathname || ROLE_REDIRECT_MAP[user.role] || '/';
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!email.trim()) {
      setError('Vui lòng nhập email');
      return;
    }
    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    setIsLoading(true);

    try {
      await login({ email: email.trim(), password });

      // Get fresh user state after login
      const authStore = (await import('../store/authStore')).useAuthStore;
      const currentUser = authStore.getState().user;

      if (currentUser) {
        toast.success('Đăng nhập thành công!');
        const from = location.state?.from?.pathname;
        const redirectTo = from || ROLE_REDIRECT_MAP[currentUser.role] || '/';
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden flex flex-col selection:bg-blue-200 selection:text-blue-900">
      
      {/* Background Image & Overlay */}
      <div className="fixed inset-0 z-0">
        <img 
          src={bgImage} 
          alt="Dental Clinic Background" 
          className="w-full h-full object-cover opacity-80"
        />
        {/* Overlay gradient to match mockup: light/white on the right, light blue tint on the left */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-200/40 via-white/50 to-white/95" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Top Half: Hero and Form */}
        <div className="w-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 flex-grow">
          {/* Left: Hero Section (hidden on mobile) */}
          <HeroSection />

          {/* Right: Login Form */}
          <LoginForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            error={error}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />
        </div>

        {/* Bottom Half: Features and Stats */}
        <div className="w-full mt-auto pb-10">
          <ScrollSection />
        </div>

      </div>
    </div>
  );
}
