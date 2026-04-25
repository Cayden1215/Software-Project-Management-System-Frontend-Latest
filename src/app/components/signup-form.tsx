import { useState } from 'react';
import { User } from '../App';
import { UserPlus, UserCircle, Shield, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { authAPI, setCurrentUser, UserDto } from '../services/api-client';
import { toast } from 'sonner';

interface SignupFormProps {
  onSignup: (user: User) => void;
  onSwitchToLogin: () => void;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function SignupForm({ onSignup, onSwitchToLogin }: SignupFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [selectedRole, setSelectedRole] = useState<'manager' | 'member'>('member');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [loading, setLoading] = useState(false);

  const validateName = (name: string): string | undefined => {
    if (!name.trim()) {
      return 'Full name is required';
    }
    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return 'Name can only contain letters and spaces';
    }
    return undefined;
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return 'Email address is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return undefined;
  };

  const validateConfirmPassword = (confirmPassword: string, password: string): string | undefined => {
    if (!confirmPassword) {
      return 'Please confirm your password';
    }
    if (confirmPassword !== password) {
      return 'Passwords do not match';
    }
    return undefined;
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field: string) => {
    let error: string | undefined;

    switch (field) {
      case 'name':
        error = validateName(formData.name);
        break;
      case 'email':
        error = validateEmail(formData.email);
        break;
      case 'password':
        error = validatePassword(formData.password);
        break;
      case 'confirmPassword':
        error = validateConfirmPassword(formData.confirmPassword, formData.password);
        break;
    }

    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation if field has been touched
    if (touched[field]) {
      setTimeout(() => validateField(field), 0);
    }
  };

  const getPasswordStrength = (): { strength: number; label: string; color: string } => {
    const password = formData.password;
    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/(?=.*[a-z])/.test(password)) strength++;
    if (/(?=.*[A-Z])/.test(password)) strength++;
    if (/(?=.*\d)/.test(password)) strength++;
    if (/(?=.*[@$!%*?&])/.test(password)) strength++;

    if (strength <= 2) return { strength: 33, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 4) return { strength: 66, label: 'Medium', color: 'bg-yellow-500' };
    return { strength: 100, label: 'Strong', color: 'bg-green-500' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    // Validate all fields
    const nameError = validateName(formData.name);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(formData.confirmPassword, formData.password);

    const newErrors: ValidationErrors = {
      name: nameError,
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
    };

    setErrors(newErrors);

    // Check if there are any errors
    if (nameError || emailError || passwordError || confirmPasswordError) {
      return;
    }

    setLoading(true);
    try {
      // Create user DTO for backend
      const userDto: UserDto = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        role: selectedRole === 'manager' ? 'PROJECT_MANAGER' : 'TEAM_MEMBER',
      };

      // Call backend register API
      const response = await authAPI.register(userDto);

      // Create user object for frontend
      const user: User = {
        id: response.userID?.toString() || formData.email,
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        role: selectedRole,
      };

      setCurrentUser(user);
      toast.success('Account created successfully!');
      onSignup(user);
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = formData.password ? getPasswordStrength() : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mb-4">
            <UserPlus className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-gray-900 mb-2">Create Your Account</h1>
          <p className="text-gray-600">Join our project management system</p>
        </div>

        {/* Signup Form */}
        <div className="bg-white rounded-lg shadow-xl p-8 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                placeholder="Enter your full name"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                  touched.name && errors.name
                    ? 'border-red-500'
                    : touched.name && !errors.name && formData.name
                    ? 'border-green-500'
                    : 'border-gray-300'
                }`}
              />
              {touched.name && errors.name && (
                <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.name}</span>
                </div>
              )}
              {touched.name && !errors.name && formData.name && (
                <div className="flex items-center gap-1 mt-1 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Looks good!</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-700 mb-2">Email Address *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder="Enter your email"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                  touched.email && errors.email
                    ? 'border-red-500'
                    : touched.email && !errors.email && formData.email
                    ? 'border-green-500'
                    : 'border-gray-300'
                }`}
              />
              {touched.email && errors.email && (
                <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.email}</span>
                </div>
              )}
              {touched.email && !errors.email && formData.email && (
                <div className="flex items-center gap-1 mt-1 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Valid email address</span>
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-700 mb-2">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  placeholder="Create a strong password"
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                    touched.password && errors.password
                      ? 'border-red-500'
                      : touched.password && !errors.password && formData.password
                      ? 'border-green-500'
                      : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Password strength:</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength?.label === 'Weak' ? 'text-red-600' :
                      passwordStrength?.label === 'Medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {passwordStrength?.label}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength?.color}`}
                      style={{ width: `${passwordStrength?.strength}%` }}
                    />
                  </div>
                </div>
              )}

              {touched.password && errors.password && (
                <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.password}</span>
                </div>
              )}

              {/* Password Requirements */}
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-600">Password must contain:</p>
                <ul className="text-xs space-y-1">
                  <li className={`flex items-center gap-1 ${
                    formData.password.length >= 8 ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    <div className={`w-1 h-1 rounded-full ${
                      formData.password.length >= 8 ? 'bg-green-600' : 'bg-gray-400'
                    }`} />
                    At least 8 characters
                  </li>
                  <li className={`flex items-center gap-1 ${
                    /(?=.*[a-z])/.test(formData.password) ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    <div className={`w-1 h-1 rounded-full ${
                      /(?=.*[a-z])/.test(formData.password) ? 'bg-green-600' : 'bg-gray-400'
                    }`} />
                    One lowercase letter
                  </li>
                  <li className={`flex items-center gap-1 ${
                    /(?=.*[A-Z])/.test(formData.password) ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    <div className={`w-1 h-1 rounded-full ${
                      /(?=.*[A-Z])/.test(formData.password) ? 'bg-green-600' : 'bg-gray-400'
                    }`} />
                    One uppercase letter
                  </li>
                  <li className={`flex items-center gap-1 ${
                    /(?=.*\d)/.test(formData.password) ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    <div className={`w-1 h-1 rounded-full ${
                      /(?=.*\d)/.test(formData.password) ? 'bg-green-600' : 'bg-gray-400'
                    }`} />
                    One number
                  </li>
                </ul>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-gray-700 mb-2">Confirm Password *</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  placeholder="Re-enter your password"
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                    touched.confirmPassword && errors.confirmPassword
                      ? 'border-red-500'
                      : touched.confirmPassword && !errors.confirmPassword && formData.confirmPassword
                      ? 'border-green-500'
                      : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.confirmPassword}</span>
                </div>
              )}
              {touched.confirmPassword && !errors.confirmPassword && formData.confirmPassword && (
                <div className="flex items-center gap-1 mt-1 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Passwords match!</span>
                </div>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-gray-700 mb-3">Select Your Role *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole('manager')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedRole === 'manager'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <Shield className={`w-8 h-8 mx-auto mb-2 ${
                    selectedRole === 'manager' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <div className={`text-sm ${
                    selectedRole === 'manager' ? 'text-blue-600' : 'text-gray-700'
                  }`}>
                    Project Manager
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Create & manage projects
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('member')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedRole === 'member'
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-purple-300'
                  }`}
                >
                  <UserCircle className={`w-8 h-8 mx-auto mb-2 ${
                    selectedRole === 'member' ? 'text-purple-600' : 'text-gray-400'
                  }`} />
                  <div className={`text-sm ${
                    selectedRole === 'member' ? 'text-purple-600' : 'text-gray-700'
                  }`}>
                    Team Member
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Work on assigned tasks
                  </div>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2 shadow-lg font-medium"
            >
              <UserPlus className="w-5 h-5" />
              Create Account
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Already have an account?</span>
            </div>
          </div>

          {/* Sign In Link */}
          <div className="text-center">
            <button
              onClick={onSwitchToLogin}
              className="text-purple-600 hover:text-purple-700 font-medium text-sm"
            >
              Sign in instead
            </button>
          </div>
        </div>

        {/* Terms and Privacy */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-600">
            By creating an account, you agree to our{' '}
            <button className="text-purple-600 hover:text-purple-700">
              Terms of Service
            </button>{' '}
            and{' '}
            <button className="text-purple-600 hover:text-purple-700">
              Privacy Policy
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}