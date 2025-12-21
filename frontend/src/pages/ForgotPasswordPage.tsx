import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { passwordResetApi } from '../lib/api';
import { Mail } from 'lucide-react';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      const result = await passwordResetApi.requestReset(email.trim());
      
      if (result.data.success) {
        setSuccess(true);
        setEmail('');
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } catch (err: any) {
      console.error('Password reset request error:', err);
      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.message || 
                          err?.message || 
                          'Failed to send reset email. Please try again.';
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
              Reset Your Password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-300">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {success ? (
            <div className="mt-8">
              <div className="alert-success flex items-start gap-3">
                <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Check your email</p>
                  <p className="text-sm mt-1">
                    If an account with that email exists, a password reset link has been sent.
                    Please check your inbox and follow the instructions.
                  </p>
                </div>
              </div>
              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="text-primary-400 hover:text-primary-300 transition-colors font-semibold"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="alert-error">
                  {error}
                </div>
              )}

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

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-gray-300 hover:text-primary-400 transition-colors"
                >
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

