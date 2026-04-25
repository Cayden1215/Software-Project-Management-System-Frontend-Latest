import { SignupForm } from '../components/signup-form';
import { User } from '../App';
import { useNavigate } from 'react-router';

interface SignupPageProps {
  onSignup: (user: User) => void;
}

export default function SignupPage({ onSignup }: SignupPageProps) {
  const navigate = useNavigate();

  const handleSignup = (user: User) => {
    onSignup(user);
    navigate('/dashboard');
  };

  const handleSwitchToLogin = () => {
    navigate('/login');
  };

  return <SignupForm onSignup={handleSignup} onSwitchToLogin={handleSwitchToLogin} />;
}
