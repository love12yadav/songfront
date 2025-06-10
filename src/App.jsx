import React, { useState } from 'react';
import SongPlayer from './SongPlayer';
import SongUpload from './SongUpload';
import './App.css';
import backgroundVideo from './video1.mov';

const App = () => {
  const [showUpload, setShowUpload] = useState(false);

  const toggleUpload = () => {
    setShowUpload(!showUpload);
  };

  return (
    <div className="App">
      {/* Background Video */}
      <video
        className="background-video"
        autoPlay
        loop
        muted
        src={backgroundVideo} 
        type="video/mp4"
      />

      <header className="App-header">
        <div className="nav-left">
          <h1>Song Management</h1>
        </div>
        <div className="nav-right">
          <button onClick={toggleUpload}>
            {showUpload ? 'Go to Player' : 'Go to Upload'}
          </button>
        </div>
      </header>

      {/* Content area */}
      <div className="content">
        {showUpload ? <SongUpload /> : <SongPlayer />}
      </div>
    </div>
  );
};

export default App;
