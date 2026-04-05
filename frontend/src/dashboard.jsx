import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Make sure this is imported
import logoChecky from './assets/img/logochecky.png'; // Phải có import ảnh

export default function Dashboard() { // Tên hàm phải viết hoa chữ Q
  const [resultMessage, setResultMessage] = useState('...');
  const navigate = useNavigate();
  const createSession = async () => {
    // Chuyển hướng sang trang QR khi nhấn nút
    try {
      setResultMessage("Đang tạo session..."); 

      const API_URL = "https://countable-plotless-aubrielle.ngrok-free.dev"; 

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/dashboard/sessions/`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_name: "skibidi toliet"
        })
      });

      const data = await response.json();
      
      setResultMessage("Success: " + JSON.stringify(data));
      
      const qrURL = `/qr?session=${data.session_id}`;
      window.open(qrURL, "_blank");
    } catch (error) {
      console.error(error);
      setResultMessage("Error connecting to server.");
    }  
  };

  return (
    <div className="container-dashboard">
      <div className="card-dashboard">
        {/* Đổi tiêu đề để phân biệt với trang Login */}
        <h1>Dashboard Giáo Viên</h1> 
        
        <button className="btn" onClick={createSession}>Tạo session mới</button>

        <p className="note" style={{ marginTop: '20px' }}>
            {resultMessage}
        </p>
      </div>

      <div className="logocard">
        <img src={logoChecky} width="300" className='LOGO' alt="Logo" />
        <p className='logotext'>Hệ thống check-in tự động</p>
      </div>
    </div>
  );
}