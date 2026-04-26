import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import logoChecky from './assets/img/logochecky.png'; 

export default function Dashboard() { 
  const [resultMessage, setResultMessage] = useState('...');
  const [attendanceLogs, setAttendanceLogs] = useState([]); 
  const [teacherData, setTeacherData] = useState(null);
  const navigate = useNavigate();

  // --- NEW: AUTHENTICATION GUARD ---
  useEffect(() => {
    const verifyTeacherAuth = async () => {
      const token = localStorage.getItem('authToken');
      
      // 1. If there is no token in local storage, kick them out immediately
      if (!token) {
        console.warn("Chưa đăng nhập! Đang chuyển hướng...");
        navigate('/', { replace: true });
        return;
      }

      // 2. If there is a token, double-check it with the backend
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/login/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          }
        });

        // 3. If the backend says the token is invalid/expired, kick them out
        if (!response.ok) {
          console.warn("Token không hợp lệ hoặc đã hết hạn.");
          localStorage.clear(); // Wipe the bad data
          navigate('/', { replace: true });
        } else {
          const data = await response.json();
          setTeacherData(data.user);
        }
      } catch (error) {
        console.error("Lỗi kết nối khi xác thực:", error);
        localStorage.clear();
        navigate('/', { replace: true });
      }
    };

    verifyTeacherAuth();
  }, [navigate]);
  // ---------------------------------

  // --- Polling mechanism to fetch logs every 5 seconds ---
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/dashboard/attendance`);
        
        if (response.ok) {
          const data = await response.json();
          setAttendanceLogs(data); 
        } else {
          console.error("Failed to fetch attendance data.");
        }
      } catch (error) {
        console.error("Error connecting to server for attendance:", error);
      }
    };

    // 1. Call it immediately when the dashboard first loads
    fetchAttendance();

    // 2. Set an interval to call it every 5000 milliseconds (5 seconds)
    const intervalId = setInterval(fetchAttendance, 5000);

    // 3. Cleanup function to stop polling if the teacher leaves the dashboard
    return () => clearInterval(intervalId);
  }, []); 
  // -------------------------------------------------------------

  const createSession = async () => {
    try {
      setResultMessage("Đang tạo session..."); 

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/dashboard/sessions/`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_name: "10 Tin-LN",
          subject: "Triết học SkibidiTolietism",
          teacher_email: teacherData.email
        })
      });

      const data = await response.json();
      
      setResultMessage("Success");
      localStorage.setItem('tempQrSecret', JSON.stringify({
        sessionId: data.session_id,
        seed: data.seed
      }));

      // 2. Open the new tab securely
      window.open('/qr', '_blank', 'noopener,noreferrer');

      // 3. FAILSAFE: If the user has a popup blocker and the tab never opens, 
      // delete the secret after 3 seconds anyway so it doesn't leak.
      setTimeout(() => {
        localStorage.removeItem('tempQrSecret');
      }, 3000);

      window.open('/qr', '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error(error);
      setResultMessage("Error connecting to server.");
    }  
  };

  return (
    <div className="container-dashboard">
      <div className="card-dashboard">
        <h1>Dashboard Giáo Viên</h1> 
        
        <button className="btn" onClick={createSession}>Tạo session mới</button>

        <p className="note" style={{ marginTop: '10px', marginBottom: '20px' }}>
            {resultMessage}
        </p>

        {/* --- The Attendance Table --- */}
        <div className="table-container">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Họ và Tên</th>
                <th>Email / MSSV</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {attendanceLogs.length > 0 ? (
                attendanceLogs.map((log, index) => (
                  <tr key={index}>
                    <td>{log.name}</td>
                    <td>{log.email}</td>
                    <td>{log.time}</td>
                    <td>{log.status || 'Có mặt'}</td> 
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: '#666' }}>
                    Chưa có dữ liệu điểm danh...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* ------------------------------- */}

      </div>

      <div className="logocard">
        <img src={logoChecky} width="300" className='LOGO' alt="Logo" />
        <p className='logotext'>Hệ thống check-in tự động</p>
      </div>
    </div>
  );
}