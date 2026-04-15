import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import logoChecky from './assets/img/logochecky.png'; 

export default function Dashboard() { 
  const [resultMessage, setResultMessage] = useState('...');
  const [attendanceLogs, setAttendanceLogs] = useState([]); // State to hold the table data
  const navigate = useNavigate();

  // --- NEW: Polling mechanism to fetch logs every 5 seconds ---
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        // You will need to make sure this endpoint exists in your FastAPI backend!
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/dashboard/attendance`);
        
        if (response.ok) {
          const data = await response.json();
          // Assuming your backend returns a list/array of dictionary logs
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
          class_name: "skibidi toliet"
        })
      });

      const data = await response.json();
      
      setResultMessage("Success: " + JSON.stringify(data));
      
      navigate('/qr', { 
        state: { 
          sessionId: data.session_id, 
          seed: data.seed 
        } 
      });
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

        {/* --- NEW: The Attendance Table --- */}
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
              {/* If we have logs, loop through them and render a row for each one */}
              {attendanceLogs.length > 0 ? (
                attendanceLogs.map((log, index) => (
                  <tr key={index}>
                    {/* Make sure these variable names match exactly what your Python backend sends! */}
                    <td>{log.name}</td>
                    <td>{log.email}</td>
                    <td>{log.time}</td>
                    <td>{log.status || 'Có mặt'}</td> 
                  </tr>
                ))
              ) : (
                /* If the array is empty, show this fallback message */
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