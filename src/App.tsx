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
  Paper,
  Slider,
  Stack,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import SpeedIcon from '@mui/icons-material/Speed';
import queryString from 'query-string';
import TranscriptionPanel from './components/TranscriptionPanel';
import { translate, freeSpeak } from './utils/translation';

const LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
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
  const [sourceLang, setSourceLang] = useState('en-US');
  const [targetLang, setTargetLang] = useState('es-ES');
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [currentTranslation, setCurrentTranslation] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const playerRef = useRef(null);
  
  // Player controls state
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [processingTranslation, setProcessingTranslation] = useState(false);

  useEffect(() => {
    const parsed = queryString.parse(window.location.search);
    if (parsed.url) setUrl(parsed.url as string);
    if (parsed.sourceLang) setSourceLang(parsed.sourceLang as string);
    if (parsed.targetLang) setTargetLang(parsed.targetLang as string);
  }, []);

  useEffect(() => {
    const params = queryString.stringify({
      url,
      sourceLang,
      targetLang
    });
    window.history.replaceState(null, '', `?${params}`);
  }, [url, sourceLang, targetLang]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Your browser does not support speech recognition.');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onresult = async (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript;
          setCurrentTranscript(transcript);
          
          // Pause video during translation and TTS
          if (playing) {
            setProcessingTranslation(true);
            setPlaying(false);
            
            try {
              const translation = await translate({
                finalTranscriptProxy: transcript,
                fromLang: sourceLang.split('-')[0],
                toLang: targetLang.split('-')[0]
              });
              
              setCurrentTranslation(translation);
              await freeSpeak(translation, targetLang);
              
              // Resume video playback
              setProcessingTranslation(false);
              setPlaying(true);
            } catch (error) {
              console.error('Translation or TTS error:', error);
              setProcessingTranslation(false);
              setPlaying(true);
            }
          }
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
  }, [isListening, sourceLang, targetLang, playing]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = sourceLang;
    }
  }, [sourceLang]);

  const handlePlay = () => {
    setPlaying(true);
    if (!isListening) {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const handlePause = () => {
    if (!processingTranslation) {
      setPlaying(false);
      if (isListening) {
        setIsListening(false);
        recognitionRef.current?.stop();
      }
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
        YouTube Player with Translation
      </Typography>

      <TextField
        fullWidth
        label="YouTube URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        margin="normal"
      />

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

      <Box sx={{ mb: 2 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton onClick={() => setPlaying(!playing)} disabled={processingTranslation}>
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

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2}>
          <FormControl fullWidth>
            <InputLabel>Source Language</InputLabel>
            <Select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              label="Source Language"
            >
              {LANGUAGES.map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  {lang.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Target Language</InputLabel>
            <Select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              label="Target Language"
            >
              {LANGUAGES.map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  {lang.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <TranscriptionPanel
        originalText={currentTranscript}
        translatedText={currentTranslation}
      />
    </Box>
  );
}

export default App;