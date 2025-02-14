import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player/youtube';
import { 
  Box, 
  TextField, 
  Accordion, 
  AccordionSummary,
  AccordionDetails,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Paper,
  Slider,
  Button,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import SpeedIcon from '@mui/icons-material/Speed';

const LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' },
  { code: 'it-IT', name: 'Italian' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'ru-RU', name: 'Russian' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'ko-KR', name: 'Korean' },
  { code: 'hi-IN', name: 'Hindi' }
];

const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function App() {
  const [url, setUrl] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [transcripts, setTranscripts] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  
  // Player controls state
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Your browser does not support speech recognition.');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript;
          setTranscripts(prev => [...prev, transcript]);
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening) {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  const handlePlay = () => {
    setPlaying(true);
    if (!isListening) {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const handlePause = () => {
    setPlaying(false);
    if (isListening) {
      setIsListening(false);
      recognitionRef.current?.stop();
    }
  };

  const handleSeekChange = (e, newValue) => {
    setPlayed(parseFloat(newValue));
  };

  const handleSeekMouseUp = (e, newValue) => {
    playerRef.current.seekTo(parseFloat(newValue));
  };

  const handleProgress = state => {
    setPlayed(state.played);
    setLoaded(state.loaded);
  };

  const handleDuration = (duration) => {
    setDuration(duration);
  };

  const formatTime = (seconds) => {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto', padding: 2 }}>
      <Typography variant="h4" gutterBottom>
        YouTube Player with Speech Recognition
      </Typography>

      {/* YouTube URL Input */}
      <TextField
        fullWidth
        label="YouTube URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        margin="normal"
      />

      {/* Player */}
      <Box sx={{ my: 2 }}>
        <ReactPlayer
          ref={playerRef}
          url={url}
          width="100%"
          height="400px"
          playing={playing}
          volume={volume}
          muted={muted}
          playbackRate={playbackRate}
          onPlay={handlePlay}
          onPause={handlePause}
          onProgress={handleProgress}
          onDuration={handleDuration}
        />
      </Box>

      {/* Player Controls */}
      <Box sx={{ mb: 2 }}>
        <Stack spacing={2}>
          {/* Play/Pause and Volume Controls */}
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton onClick={() => setPlaying(!playing)}>
              {playing ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
            
            <IconButton onClick={() => setMuted(!muted)}>
              {muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </IconButton>
            
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e, newValue) => setVolume(newValue)}
              sx={{ width: 100 }}
            />

            <Box sx={{ flexGrow: 1 }} />

            {/* Playback Rate */}
            <FormControl sx={{ minWidth: 100 }}>
              <Select
                value={playbackRate}
                onChange={(e) => setPlaybackRate(e.target.value)}
                size="small"
                startAdornment={<SpeedIcon sx={{ mr: 1 }} />}
              >
                {PLAYBACK_RATES.map(rate => (
                  <MenuItem key={rate} value={rate}>
                    {rate}x
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {/* Progress Bar */}
          <Stack spacing={1}>
            <Slider
              min={0}
              max={0.999999}
              step={0.000001}
              value={played}
              onChange={handleSeekChange}
              onChangeCommitted={handleSeekMouseUp}
            />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2">{formatTime(duration * played)}</Typography>
              <Typography variant="body2">{formatTime(duration)}</Typography>
            </Stack>
          </Stack>
        </Stack>
      </Box>

      {/* Speech Recognition Controls in Accordion */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Speech Recognition Controls</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormControl fullWidth margin="normal">
            <InputLabel>Speech Recognition Language</InputLabel>
            <Select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              label="Speech Recognition Language"
            >
              {LANGUAGES.map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  {lang.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Paper sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
            <List>
              {transcripts.map((transcript, index) => (
                <ListItem key={index} divider>
                  <ListItemText primary={transcript} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

export default App;