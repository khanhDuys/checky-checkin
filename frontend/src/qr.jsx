import { useLocation, Navigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { useEffect, useState } from 'react';
import * as OTPAuth from 'otpauth';
import logoChecky from './assets/img/logochecky.png';
import './QR.css'; // Make sure you import the CSS file you created in Step 1!

export default function QR() {
  const location = useLocation();

  // Extract the invisible RAM data
  const { sessionId, seed } = location.state || {};
  
  const [currentUrl, setCurrentUrl] = useState('');
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    if (!seed) return; 

    // Set up the TOTP Math generator
    let totp = new OTPAuth.TOTP({
      issuer: "CheckyCheckin",
      label: "ClassSession",
      algorithm: "SHA1",
      digits: 6,
      period: 15, // Matches the 15 seconds you set in Python!
      secret: OTPAuth.Secret.fromBase32(seed),
    });

    const updateQR = () => {
      const activeCode = totp.generate();
      
      // Use window.location.origin for automatic dynamic URLs
      const newUrl = `${window.location.origin}/student/checkin?session=${sessionId}&code=${activeCode}`;
      setCurrentUrl(newUrl);
      console.log("Current QR Link:", newUrl);

      const epoch = Math.floor(Date.now() / 1000);
      setTimeLeft(15 - (epoch % 15));
    };

    updateQR();
    const interval = setInterval(updateQR, 1000);

    return () => clearInterval(interval);
  }, [sessionId, seed]);

  // --- THE TAB KILL SWITCH (From earlier) ---
  useEffect(() => {
    const killSession = () => {
      if (sessionId) {
        // Includes the /dashboard prefix to fix the 404 error!
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


  // Student Blocker (If RAM is empty)
  if (!sessionId) {
    return <Navigate to="/" replace />;
  }

  return (
      <div className="container-qr">
        <div className="card-qr">
          <h1>Quét để vào lớp</h1> 
          
          {/* We removed the old <p> timer text from here! */}
          <p className="note-qr" style={{ marginTop: '5px', marginBottom: '15px' }}>

            Vui lòng dùng điện thoại đẻ quét mã

          </p>
          {/* 🛑 THIS IS THE NEW STACKED QR LAYOUT 🛑 */}
          <div className="qr-stack-container">
            {currentUrl && (
              <QRCodeCanvas value={currentUrl} size={500} level={"H"} />
            )}
            
            {/* THIS IS THE FLOATING CIRCLE OVER THE QR CODE */}
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