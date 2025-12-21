import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signIn } from '../lib/auth';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/events';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, location]);

  // Show nothing while checking auth status or if already authenticated
  if (authLoading || isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn.email({
        email: email.trim(),
        password,
      });

      if (result.error) {
        const errorMessage = result.error.message || result.error.toString() || 'Failed to sign in';
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      // Check if we got a valid user/session
      if (!result.data && !result.user) {
        setError('Invalid email or password. Please check your credentials and try again.');
        setIsLoading(false);
        return;
      }

      // Redirect to intended page or default to events
      const from = (location.state as any)?.from?.pathname || '/events';
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.message || 
                          err?.message || 
                          'An unexpected error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="card">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold gradient-text">
              Sign in to Event Management 3000
            </h2>
            <p className="mt-2 text-center text-sm text-gray-300">
              Or{' '}
              <a
                href="/signup"
                className="font-semibold text-primary-400 hover:text-primary-300 transition-colors"
              >
                create a new account
              </a>
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="alert-error">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div className="form-group">
                <label htmlFor="email" className="label">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="password" className="label">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="mt-2 text-right">
                  <a
                    href="/forgot-password"
                    className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

