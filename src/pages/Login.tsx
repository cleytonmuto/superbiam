import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { createUserProfile, getUserProfile } from '../utils/userProfile';
import './Login.css';

export default function Login() {
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for redirect result (if user was redirected back from Google)
    getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
          // Check if profile exists, create as "reader" if not
          const existingProfile = await getUserProfile(result.user.uid);
          if (!existingProfile) {
            await createUserProfile(result.user, 'reader');
          }
          navigate('/');
        }
      })
      .catch((error) => {
        console.error('Redirect sign-in error:', error);
      });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    try {
      // Try popup first (better UX)
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if profile exists, create as "reader" if it doesn't exist (backward compatibility)
      const existingProfile = await getUserProfile(user.uid);
      if (!existingProfile) {
        await createUserProfile(user, 'reader');
      }
      
      // Navigation will happen automatically via onAuthStateChanged
    } catch (error: any) {
      console.error('Error signing in:', error);
      setErrorMessage(null); // Clear any previous error
      
      // If popup is blocked, try redirect
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectError) {
          console.error('Redirect sign-in error:', redirectError);
          setErrorMessage('Failed to sign in. Please check your browser settings and try again.');
        }
      } else if (error.code === 'auth/unauthorized-domain') {
        setErrorMessage('This domain is not authorized. Please check Firebase Authentication settings.');
      } else if (error.code === 'auth/operation-not-allowed') {
        setErrorMessage('Google sign-in is not enabled. Please enable it in Firebase Console.');
      } else {
        setErrorMessage(`Failed to sign in: ${error.message || 'Unknown error'}. Please check the console for details.`);
      }
    }
  };

  const handleGoogleSignUp = async () => {
    setErrorMessage(null);
    try {
      // Try popup first (better UX)
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if profile already exists
      const existingProfile = await getUserProfile(user.uid);
      
      if (existingProfile) {
        // User already has an account, sign them out and show error
        await signOut(auth);
        setErrorMessage('This account is already registered. Please use "Sign in with Google" instead.');
        return;
      }
      
      // Create new profile as "reader"
      await createUserProfile(user, 'reader');
      
      // Navigation will happen automatically via onAuthStateChanged
    } catch (error: any) {
      console.error('Error signing up:', error);
      setErrorMessage(null); // Clear any previous error
      
      // If popup is blocked, try redirect
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectError) {
          console.error('Redirect sign-up error:', redirectError);
          setErrorMessage('Failed to sign up. Please check your browser settings and try again.');
        }
      } else if (error.code === 'auth/unauthorized-domain') {
        setErrorMessage('This domain is not authorized. Please check Firebase Authentication settings.');
      } else if (error.code === 'auth/operation-not-allowed') {
        setErrorMessage('Google sign-in is not enabled. Please enable it in Firebase Console.');
      } else {
        setErrorMessage(`Failed to sign up: ${error.message || 'Unknown error'}. Please check the console for details.`);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return <div className="login-container">Loading...</div>;
  }

  if (user) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>You're already signed in!</h2>
          <p>Welcome, {user.displayName || user.email}</p>
          <button onClick={handleSignOut} className="btn btn-secondary">
            Sign Out
          </button>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Daily Blog Login</h2>
        <p>Sign in or sign up with Google to access the blog</p>
        <div className="auth-buttons">
          <button onClick={handleGoogleSignIn} className="btn btn-google">
            Sign in with Google
          </button>
          <button onClick={handleGoogleSignUp} className="btn btn-google btn-signup">
            Sign up with Google
          </button>
        </div>
        {errorMessage && (
          <div className="error-message">
            {errorMessage}
          </div>
        )}
        <p className="auth-note">
          New users will be registered as readers. Editor access must be granted manually.
        </p>
        <Link to="/" className="back-link">← Back to Home</Link>
      </div>
    </div>
  );
}

