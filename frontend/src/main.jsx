import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './style.css'
import './qr.css'
import './dashboard.css'
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// createRoot(document.getElementById("root")).render(<App />);