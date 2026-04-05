import { useSearchParams } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import logoChecky from './assets/img/logochecky.png'; // Phải có import ảnh

export default function QR() { // Tên hàm phải viết hoa chữ Q
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');

  // 2. Build the URL that the student's phone will actually visit when they scan
  // ⚠️ CRITICAL: Change this to your Ngrok URL before your presentation!
  // Example: const BACKEND_URL = "https://1234.ngrok.app";
  const checkInUrl = `${import.meta.env.VITE_BACKEND_URL}/student/checkin?session=${sessionId}`;

  return (
    <div className="container-qr">
      <div className="card-qr">
        <h1>Quét để vào lớp</h1> 

        <p className="note-qr" style={{ marginTop: '5px', marginBottom: '15px' }}>
          Vui lòng dùng camera điện thoại để quét
        </p>
        
        {/* 1. Conditionally show the QR Code or an error message */}
        {sessionId ? (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {/* 2. REMOVED the extra white wrapper div from here */}
            <QRCodeCanvas 
              value={checkInUrl} 
              size={500} 
              level={"H"} // Matches your old code: High error correction for projectors
            />
          </div>
        ) : (
          <div style={{ padding: '50px 0' }}>
            <h2 style={{ color: '#d9534f' }}>❌ Lỗi: Không tìm thấy Session ID</h2>
            <p>Vui lòng tạo session từ trang Dashboard.</p>
          </div>
        )}
      </div>

      <div className="logocard">
        <img src={logoChecky} width="300" className='LOGO' alt="Logo" />
        <p className='logotext'>Hệ thống check-in tự động</p>
      </div>
    </div>
  );
}