import { useNavigate } from 'react-router-dom';
import logoChecky from './assets/img/logochecky.png'; // Bắt buộc phải import ảnh

export default function LoginPage() { // Phải có export default
  const navigate = useNavigate();

  const handleStudentLogin = () => {
    // Chuyển hướng sang trang QR khi nhấn nút
    navigate('/qr');
  };

  const handleTeacherLogin = () => {
    navigate('/dashboard/')
  }
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