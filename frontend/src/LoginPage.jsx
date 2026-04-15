import { useNavigate } from 'react-router-dom';
import logoChecky from './assets/img/logochecky.png'; // Bắt buộc phải import ảnh
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from './firebase'; // Adjust path to your firebase.js
import { useState } from 'react';

export default function LoginPage() { // Phải có export default
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const handleStudentLogin = () => {
    navigate('/qr');
  };

  const handleTeacherLogin = async () => {
try {
      // 1. Open Google Login popup
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // 2. Get the secure ID token
      const idToken = await user.getIdToken();
      setStatus("Google login successful! Verifying with backend...");

      // 3. Send the token to  your FastAPI backend
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/login/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // It is standard practice to send tokens in the Authorization header
          'Authorization': `Bearer ${idToken}` 
        }
      });

      const data = await response.json();

      if (response.ok) {
        setStatus(`Backend verified you! Welcome, ${data.user.email}`);
        localStorage.setItem('authToken', idToken);
        
        // 2. Save the user data (like email and name) to display on the dashboard
        // We have to use JSON.stringify because localStorage only accepts text
        localStorage.setItem('userData', JSON.stringify(data.user));

        // 3. Navigate to the dashboard page!
        navigate('/dashboard');
      } else {
        setStatus("Backend rejected the token.");
      }

    } catch (error) {
      console.error("Login failed:", error);
      setStatus("Error logging in.");
    }
  };
  return (
    <div className="container">
      <div className="card">
        <h1>Đăng nhập</h1>

        <button className="btn" onClick={handleStudentLogin}>Học sinh</button>
        <button className="btn" onClick={handleTeacherLogin}>Giáo viên</button>

        <p className="note">
          Vui lòng đăng nhập bằng tài khoản trường
        </p>
      </div>

      <div className="logocard">
        <img src={logoChecky} width="300" className='LOGO' alt="Logo" />
        <p className='logotext'>Hệ thống check-in tự động</p>
      </div>
    </div>
  );
}