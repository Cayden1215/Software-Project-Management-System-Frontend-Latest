import { LoginForm } from '../components/login-form';
import { User } from '../App';
import { useNavigate } from 'react-router';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate();

  const handleLogin = (user: User) => {
    onLogin(user);
    navigate('/dashboard');
  };

  const handleSwitchToSignup = () => {
    navigate('/signup');
  };

  return <LoginForm onLogin={handleLogin} onSwitchToSignup={handleSwitchToSignup} />;
}
