import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Card from '../components/Card';

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginWithGoogle, loginWithPhone } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to sign in with Google. Please try again.');
      console.error('Google sign-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSignIn = async (e) => {
    e.preventDefault();

    if (!phoneNumber) {
      setError('Please enter a valid phone number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await loginWithPhone(phoneNumber, 'recaptcha-container');
      setConfirmationResult(result);
      setShowOtpInput(true);
      setError('');
    } catch (err) {
      setError('Failed to send OTP. Please check your phone number.');
      console.error('Phone sign-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await confirmationResult.confirm(otp);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid OTP. Please try again.');
      console.error('OTP verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--spacing-lg)',
      background: 'linear-gradient(135deg, var(--bg-primary) 0%, #1a1f3a 100%)'
    }}>
      <Card style={{
        maxWidth: '450px',
        width: '100%',
        animation: 'fadeIn 0.5s ease-out'
      }}>
        {/* Header */}
        <div className="text-center mb-xl">
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto var(--spacing-lg)',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)'
          }}>
            📊
          </div>
          <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: 'var(--spacing-sm)' }}>
            Welcome to ATLAS
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Attendance Tracking & Logging Automation System
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: 'var(--spacing-md)',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#fca5a5',
            marginBottom: 'var(--spacing-lg)',
            fontSize: '0.875rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Google Sign-In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            padding: 'var(--spacing-md) var(--spacing-lg)',
            background: 'white',
            color: '#1f2937',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.9375rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--spacing-md)',
            transition: 'all var(--transition-base)',
            marginBottom: 'var(--spacing-md)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            opacity: loading ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: 'var(--spacing-xl) 0',
          gap: 'var(--spacing-md)'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
        </div>

        {/* Phone Number Sign-In */}
        {!showOtpInput ? (
          <form onSubmit={handlePhoneSignIn}>
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <label htmlFor="phone" style={{
                display: 'block',
                marginBottom: 'var(--spacing-sm)',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-secondary)'
              }}>
                Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: 'var(--spacing-md)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem'
                }}>
                  📱
                </span>
                <input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  placeholder="+1 (555) 000-0000"
                  style={{
                    paddingLeft: '3rem'
                  }}
                />
              </div>
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginTop: 'var(--spacing-xs)'
              }}>
                Enter your phone number with country code
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              style={{
                width: '100%',
                justifyContent: 'center',
                fontSize: '0.9375rem',
                padding: 'var(--spacing-md) var(--spacing-lg)'
              }}
            >
              {loading ? 'Sending OTP...' : '📲 Send OTP'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleOtpVerification}>
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <label htmlFor="otp" style={{
                display: 'block',
                marginBottom: 'var(--spacing-sm)',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-secondary)'
              }}>
                Enter OTP
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                placeholder="000000"
                maxLength="6"
                style={{
                  textAlign: 'center',
                  fontSize: '1.5rem',
                  letterSpacing: '0.5rem',
                  fontWeight: 600
                }}
              />
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginTop: 'var(--spacing-xs)',
                textAlign: 'center'
              }}>
                OTP sent to {phoneNumber}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowOtpInput(false);
                  setOtp('');
                  setError('');
                }}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading || otp.length !== 6}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>
            </div>

            <button
              type="button"
              onClick={handlePhoneSignIn}
              disabled={loading}
              style={{
                width: '100%',
                marginTop: 'var(--spacing-md)',
                padding: 'var(--spacing-sm)',
                background: 'transparent',
                border: 'none',
                color: 'var(--primary-light)',
                fontSize: '0.875rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                textDecoration: 'underline',
                opacity: loading ? 0.5 : 1
              }}
            >
              Resend OTP
            </button>
          </form>
        )}

        {/* Footer */}
        <div style={{
          marginTop: 'var(--spacing-xl)',
          paddingTop: 'var(--spacing-lg)',
          borderTop: '1px solid var(--glass-border)',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5
          }}>
            🔒 Secure authentication for Autoteknic employees
          </p>
        </div>

        {/* reCAPTCHA container (hidden, for phone auth) */}
        <div id="recaptcha-container"></div>
      </Card>
    </div>
  );
};

export default Login;

