import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage';
import QR from './qr';
import Dashboard from './dashboard'
import Student from './Student'
export default function App() {
  return (
    <Router>
      <Routes>
        {/* Đường dẫn mặc định là trang Login */}
        <Route path="/" element={<LoginPage />} />
        
        {/* Đường dẫn vào trang Quét mã QR */}
        <Route path="/qr" element={<QR />} />

        <Route path="/dashboard/" element={<Dashboard />} /> 
    
        <Route path="/student/checkin" element={<Student />} /> 

      </Routes>
    </Router>
  );
}

