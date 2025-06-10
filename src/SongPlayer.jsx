import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import {
  Card, CardContent, Typography,
  Container, Box, IconButton
} from '@mui/material';
import { SkipNext, SkipPrevious, PlayArrow, Pause } from '@mui/icons-material';
import './Player.css';
import shadows from '@mui/material/styles/shadows';

const SongPlayer = () => {
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [lastClapTime, setLastClapTime] = useState(0);

  const audioRef = useRef(null);
  const currentSongRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const recognitionRef = useRef(null);
  const clapDetectionRunningRef = useRef(false);
  const voiceRecognitionRunningRef = useRef(false);

  const setCurrentSongSafe = (song) => {
    setCurrentSong(song);
    currentSongRef.current = song;
  };

  useEffect(() => {
    axios.get('http://localhost:8080/api/songs')
      .then(response => {
        const songsWithUrls = response.data.map(song => ({
          ...song,
          playUrl: `http://localhost:8080/api/songs/play/${song.url}`

        }));
        setSongs(songsWithUrls);
        if (songsWithUrls.length > 0) {
          setCurrentSongSafe(songsWithUrls[0]);
        }
      })
      .catch(err => console.error('Error fetching songs:', err));
  }, []);

  useEffect(() => {
    if (songs.length > 0) {
      startClapDetection();
      startVoiceRecognition();
    }
    return () => {
      stopClapDetection();
      stopVoiceRecognition();
    };
  }, [songs]);



















  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    const playAudio = async () => {
      try {
        audio.pause(); 
        audio.src = currentSong.playUrl;
        await audio.load();
        if (playing) {
          await audio.play();
        }
      } catch (err) {
        console.warn('Audio play failed:', err);
      }
    };

    playAudio();
  }, [currentSong]);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.play().catch(err => console.warn('Play error:', err));
    } else {
      audio.pause();
    }
  }, [playing]);




  // useEffect(() => {
  //   if (audioRef.current) {
  //     if (playing) audioRef.current.play();
  //     else audioRef.current.pause();
  //   }
  // }, [playing, currentSong]);

  const handleNext = () => {
    if (!currentSongRef.current) {
      console.warn('No current song selected');
      return;
    }
    const currentIndex = songs.findIndex(song => song.id === currentSongRef.current.id);
    if (currentIndex === -1) {
      console.warn('Current song not found in songs list');
      return;
    }
    const nextIndex = (currentIndex + 1) % songs.length;
    const nextSong = songs[nextIndex];
    console.log('Changing to next song:', nextSong.title);
    setCurrentSongSafe(nextSong);
    setPlaying(true);
  };

  const handlePrevious = () => {
    if (!currentSongRef.current) return;
    const currentIndex = songs.findIndex(song => song.id === currentSongRef.current.id);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    const prevSong = songs[prevIndex];
    console.log('Changing to previous song:', prevSong.title);
    setCurrentSongSafe(prevSong);
    setPlaying(true);
  };

  const handleClapDetected = () => {
    const now = Date.now();
    if (now - lastClapTime > 1500) {
      console.log('👏 Clap detected');
      stopVoiceRecognition();
      handleNext();
      setLastClapTime(now);
      setTimeout(() => {
        startVoiceRecognition();
      }, 2000);
    }
  };

  const startClapDetection = async () => {
    if (clapDetectionRunningRef.current) return;
    clapDetectionRunningRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const detect = () => {
        if (!audioContextRef.current) return; 
        analyser.getByteTimeDomainData(dataArray);
        const average = dataArray.reduce((a, b) => a + Math.abs(b - 128), 0) / dataArray.length;
        if (average > 30) {
          handleClapDetected();
        }
        requestAnimationFrame(detect);
      };
      detect();
    } catch (err) {
      console.error('Microphone access error:', err);
      clapDetectionRunningRef.current = false;
    }
  };

  const stopClapDetection = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    clapDetectionRunningRef.current = false;
  };

  const startVoiceRecognition = () => {
    if (voiceRecognitionRunningRef.current) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    recognition.onresult = (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim().toLowerCase();
      console.log('🎤 Voice command heard:', transcript);
      if (transcript.includes('change baby')) {
        console.log('Voice command "change" detected, changing song');
        handleNext();
      }
    };

    recognition.onerror = (e) => {
      console.error('SpeechRecognition error:', e.error);
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        stopVoiceRecognition();
      }
    };

    recognition.onend = () => {
      console.log('SpeechRecognition ended');
      voiceRecognitionRunningRef.current = false;
      
    };

    recognition.start();
    voiceRecognitionRunningRef.current = true;
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      voiceRecognitionRunningRef.current = false;
    }
  };

  return (
    <Container className="app-container" sx={{ display: 'flex', height: '100vh', gap: 4, paddingTop: 2 }}>
      <Box
        className="song-list"
        sx={{
          width: '50%',
          overflowY: 'auto',
          borderRight: '1px solid #282828',
          paddingRight: 2,

          backgroundColor: 'transparent',
          borderRadius: '12px',
        }}
      >
        <Typography variant="h5" align="center" sx={{ mb: 3, fontWeight: 'bold', color: '#1DB954' }}>
          All Songs
        </Typography>
        {songs.map(song => (
          <Card
            key={song.id}
            className={`song-card ${currentSong && currentSong.id === song.id ? 'active' : ''}`}
            onClick={() => { setCurrentSongSafe(song); setPlaying(true); }}
            sx={{
              marginBottom: 2,
              cursor: 'pointer',
              backgroundColor: currentSong && currentSong.id === song.id ? '#1DB954' : '#181818',
              color: currentSong && currentSong.id === song.id ? '#fff' : '#b3b3b3',
              transition: 'background-color 0.3s ease',
              borderRadius: '8px',
              boxShadow: currentSong && currentSong.id === song.id ? '0 0 10px #1DB954' : 'none',
            }}
            elevation={currentSong && currentSong.id === song.id ? 8 : 2}
          >
            <CardContent sx={{ py: 1, px: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: '600' }}>{song.title}</Typography>
              <Typography variant="body2" sx={{ color: currentSong && currentSong.id === song.id ? '#d1d1d1' : '#888' }}>
                {song.artist}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Now Playing Section */}
      <Box
        className={`now-playing ${playing ? 'blinking' : ''}`}
        sx={{
          width: '50%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'transparent',
          borderRadius: '12px',
          boxShadow: '0 0 30px rgb(5, 171, 19)',
          padding: 4,
        }}
      >
        {currentSong && (
          <Card
            className={`player-card ${playing ? 'blinking' : ''}`}
            sx={{
              width: '100%',
              backgroundColor: '#181818',
              borderRadius: '16px',
              padding: 4,
              color: '#fff',
              textAlign: 'center',
              userSelect: 'none',
              boxShadow: 'none', 
            }}
          >
            <CardContent>
              <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                {currentSong.title}
              </Typography>
              <Typography variant="h6" sx={{ color: '#b3b3b3', mb: 3 }}>
                {currentSong.artist}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
                <IconButton
                  onClick={handlePrevious}
                  sx={{
                    color: '#1DB954',
                    '&:hover': { color: '#1ed760', transform: 'scale(1.1)' },
                    transition: 'all 0.3s ease',
                  }}
                  aria-label="Previous"
                >
                  <SkipPrevious fontSize="large" />
                </IconButton>
                <IconButton
                  onClick={() => setPlaying(p => !p)}
                  sx={{
                    color: '#1DB954',
                    backgroundColor: playing ? '#1DB954' : 'transparent',
                    borderRadius: '50%',
                    width: 70,
                    height: 70,
                    '&:hover': {
                      color: '#fff',
                      backgroundColor: '#1ed760',
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                  aria-label={playing ? 'Pause' : 'Play'}
                >
                  {playing ? <Pause fontSize="large" /> : <PlayArrow fontSize="large" />}
                </IconButton>
                <IconButton
                  onClick={handleNext}
                  sx={{
                    color: '#1DB954',
                    '&:hover': { color: '#1ed760', transform: 'scale(1.1)' },
                    transition: 'all 0.3s ease',
                  }}
                  aria-label="Next"
                >
                  <SkipNext fontSize="large" />
                </IconButton>
              </Box>
              <audio
                ref={audioRef}
                src={currentSong.playUrl}
                onEnded={handleNext}
                preload="auto"
              />
            </CardContent>
          </Card>
        )}
      </Box>
    </Container>
  );
};


export default SongPlayer;
