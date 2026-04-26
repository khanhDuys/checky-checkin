import logoChecky from './assets/img/logochecky.png';
import { signInWithRedirect, signInWithPopup, getRedirectResult, onAuthStateChanged, signOut, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function Student() {
  const STUDENT_REDIRECT_FLAG = 'student_auth_redirect_in_progress';
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('');
  const [view, setView] = useState('login');
  const isProcessingAuthRef = useRef(false);
  
  // Grab from URL first
  const urlSessionId = searchParams.get('session');
  const urlTotpCode = searchParams.get('code');

  useEffect(() => {
    let isMounted = true;

    const verifyStudent = async (user) => {
      if (!isMounted || !user || isProcessingAuthRef.current) return;

      isProcessingAuthRef.current = true;
      try {
        console.log("User found! Preparing to send POST request...");
        setStatus("Đang xác thực...");
        const idToken = await user.getIdToken();

        // Read from URL, fallback to localStorage if Firebase stripped the URL
        const activeSession = urlSessionId || localStorage.getItem('checkin_session');
        const activeCode = urlTotpCode || localStorage.getItem('checkin_code');

        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/student/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            session_id: activeSession,
            totp: activeCode,
          }),
        });

        const data = await response.json();
        console.log("Server response:", data);

        if (!isMounted) return;
        if (response.ok) {
          localStorage.removeItem('checkin_session');
          localStorage.removeItem('checkin_code');
          localStorage.setItem('userData', JSON.stringify(data.user));
          setStatus(`Chào ${data.user.name || 'bạn'}! Vui lòng chụp ảnh.`);
          setView('camera');
        } else {
          setStatus(data.detail || "Email không hợp lệ hoặc mã qr đã hết hạn");
        }
      } catch (error) {
        if (isMounted) {
          console.error("Login failed:", error);
          setStatus("Lỗi đăng nhập: " + error.message);
        }
      } finally {
        isProcessingAuthRef.current = false;
      }
    };

    const initializeAuth = async () => {
      try {
        const redirectPending = sessionStorage.getItem(STUDENT_REDIRECT_FLAG) === '1';
        console.log("Checking for redirect result...");
        const result = await getRedirectResult(auth);
        console.log("Redirect result:", result);
        if (result?.user) {
          sessionStorage.removeItem(STUDENT_REDIRECT_FLAG);
          await verifyStudent(result.user);
          return;
        }

        // On some environments, redirect result can be null even though auth completed.
        // If we know we just started a redirect flow, fallback to currentUser / auth-state listener.
        if (redirectPending) {
          setStatus("Đang hoàn tất đăng nhập...");
          if (auth.currentUser) {
            sessionStorage.removeItem(STUDENT_REDIRECT_FLAG);
            await verifyStudent(auth.currentUser);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error("Redirect login failed:", error);
          setStatus("Lỗi đăng nhập: " + error.message);
        }
      }
    };

    initializeAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        sessionStorage.removeItem(STUDENT_REDIRECT_FLAG);
        await verifyStudent(user);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSessionId, urlTotpCode]);

  const handleStudentLogin = async () => {
    // SAVE THE PARAMS before leaving the page
    await auth.signOut();
    
    if (urlSessionId) localStorage.setItem('checkin_session', urlSessionId);
    if (urlTotpCode) localStorage.setItem('checkin_code', urlTotpCode);

    const forceStudentLogin = async () => {
      try {
        setStatus("Đang mở đăng nhập Google...");
        // Important on single-device testing: clear existing teacher session first.
        await signOut(auth);
      } catch (error) {
        console.warn("Could not sign out existing session before student login:", error);
      }

      const studentProvider = new GoogleAuthProvider();
      studentProvider.setCustomParameters({
        prompt: 'select_account',
      });

      try {
        // Popup is more reliable in same-device testing and avoids redirect result issues.
        setStatus("Đang đăng nhập...");
        const popupResult = await signInWithPopup(auth, studentProvider);
        if (popupResult?.user) {
          await popupResult.user.getIdToken(true);
        }
      } catch (error) {
        console.warn("Popup login failed, falling back to redirect:", error);
        // Fallback for environments where popup is blocked.
        sessionStorage.setItem(STUDENT_REDIRECT_FLAG, '1');
        await signInWithRedirect(auth, studentProvider);
      }
    };

    forceStudentLogin();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) setStatus(`Đã nhận ảnh: ${file.name}. Đang xử lý...`);
  };

  return (
    <div className="container">
      <div className="card">
        {view === 'login' ? (
          <>
            <h1>Đăng nhập</h1>
            <button className="btn" onClick={handleStudentLogin}>Đăng nhập bằng Google</button>
            <p className="note">Vui lòng dùng email có đuôi @ptnk.edu.vn</p>
          </>
        ) : (
          <>
            <h1>Xác thực khuôn mặt</h1>
            <p className="note">Nhấn bên dưới để mở camera điện thoại</p>
            <label className="btn" style={{ display: 'block', textAlign: 'center', cursor: 'pointer' }}>
              Mở Camera
              <input
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
            <button
              className="btn-back"
              onClick={() => setView('login')}
              style={{ marginTop: '10px', background: 'none', border: 'none', color: 'gray' }}
            >
              Quay lại
            </button>
          </>
        )}
        {status && <p className="status-msg" style={{ fontSize: '12px', marginTop: '10px' }}>{status}</p>}
      </div>

      <div className="logocard">
        <img src={logoChecky} width="300" className="LOGO" alt="Logo" />
        <p className="logotext">Hệ thống check-in tự động</p>
      </div>
    </div>
  );
} 