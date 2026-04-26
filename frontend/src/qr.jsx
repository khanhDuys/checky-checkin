import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { useEffect, useState } from 'react';
import * as OTPAuth from 'otpauth';
import logoChecky from './assets/img/logochecky.png';
import './QR.css'; 

export default function QR() {
  const navigate = useNavigate();
  
  // ALL hooks must be declared at the top before any 'return' statements!
  const [sessionData, setSessionData] = useState(null);
  const [currentUrl, setCurrentUrl] = useState('');
  const [timeLeft, setTimeLeft] = useState(15);

  // 1. Extract the invisible RAM data
useEffect(() => {
    // Check if we already have it safely in THIS tab's sessionStorage 
    // (This ensures the QR code doesn't break if the teacher presses F5 to refresh the page!)
    let secureData = sessionStorage.getItem('myTabQrSecret');
    
    // If not, check if the Dashboard just dropped it in localStorage for us
    if (!secureData) {
      const dropData = localStorage.getItem('tempQrSecret');
      
      if (dropData) {
        // Move it into our isolated sessionStorage
        sessionStorage.setItem('myTabQrSecret', dropData);
        secureData = dropData;
        
        // SWEEP: Delete it from localStorage immediately so no other tabs can see it!
        localStorage.removeItem('tempQrSecret');
      }
    }

    // Finally, load the data or kick them out
    if (secureData) {
      setSessionData(JSON.parse(secureData));
    } else {
      console.warn("No secure data found, returning to dashboard.");
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  // Safely extract these variables from the state. 
  // The '?' ensures it doesn't crash while sessionData is null during the first millisecond.
  const sessionId = sessionData?.sessionId;
  const seed = sessionData?.seed;

  // 2. The QR Code & Timer Generator
  useEffect(() => {
    // If we haven't loaded the seed yet from RAM, just wait.
    if (!seed || !sessionId) return; 

    let totp = new OTPAuth.TOTP({
      issuer: "CheckyCheckin",
      label: "ClassSession",
      algorithm: "SHA1",
      digits: 6,
      period: 15, 
      secret: OTPAuth.Secret.fromBase32(seed),
    });

    const updateQR = () => {
      const activeCode = totp.generate();
      const newUrl = `${import.meta.env.VITE_FRONTEND_URL}/student/checkin?session=${sessionId}&code=${activeCode}`;
      setCurrentUrl(newUrl);
      console.log(newUrl);
      const epoch = Math.floor(Date.now() / 1000);
      setTimeLeft(15 - (epoch % 15));
    };

    updateQR();
    const interval = setInterval(updateQR, 1000);

    return () => clearInterval(interval);
  }, [sessionId, seed]);

  // 3. --- THE TAB KILL SWITCH ---
  useEffect(() => {
    const killSession = () => {
      if (sessionId) {
        const killUrl = `${import.meta.env.VITE_BACKEND_URL}/dashboard/sessions/${sessionId}/close`;
        navigator.sendBeacon(killUrl); 
      }
    };
    window.addEventListener('beforeunload', killSession);
    return () => {
      window.removeEventListener('beforeunload', killSession);
      killSession(); 
    };
  }, [sessionId]);

  // --- RENDER GUARDS ---
  // Now that all hooks have been declared, we can safely do our early returns!
  if (!sessionData || !sessionId) {
    return (
      <div style={{ color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#050325' }}>
        <h2>Đang tải dữ liệu an toàn...</h2>
      </div>
    );
  }

  // --- MAIN UI ---
  return (
      <div className="container-qr">
        <div className="card-qr">
          <h1>Quét để vào lớp</h1> 
          
          <p className="note-qr" style={{ marginTop: '5px', marginBottom: '15px' }}>
            Vui lòng dùng điện thoại để quét mã
          </p>

          <div className="qr-stack-container">
            {currentUrl && (
              <QRCodeCanvas value={currentUrl} size={500} level={"H"} />
            )}
            
            <div className="qr-timer-circle">
              {timeLeft}
            </div>
          </div>
        </div>
        
        <div className="logocard">
          <img src={logoChecky} width="300" className='LOGO' alt="Logo" />
          <p className='logotext'>Hệ thống check-in tự động</p>
        </div>
      </div>
  );
}