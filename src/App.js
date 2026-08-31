import { useEffect } from 'react';
import './App.css';
import VideoQueue from './components/VideoQueue';

// const API_URL ="https://script.google.com/macros/s/AKfycbwTZaX6NOe3T5zizw-0pRbmQSrP0V54MZ_QSrt-xCw8Wjjb7b-6WGJ3JjljIxwgizcaAQ/exec"

function App() {

  
  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);
  return (
    <div className="App">
      <VideoQueue/>
    </div>
  );
}

export default App;
