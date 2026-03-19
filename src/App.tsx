import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, X, Moon, Sun, Bell, Upload, Youtube, Image as ImageIcon, Music, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [timeLeft, setTimeLeft] = useState(25 * 60 * 1000);
  const [initialTime, setInitialTime] = useState(25 * 60 * 1000);
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mode, setMode] = useState<'countdown' | 'countup'>('countdown');
  
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [bgType, setBgType] = useState<'image' | 'youtube'>('image');
  const [bgImage, setBgImage] = useState<string>('https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?q=80&w=2940&auto=format&fit=crop');
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [alertSound, setAlertSound] = useState<string>('');
  const [bgSound, setBgSound] = useState<string>('');
  const [bgSoundVolume, setBgSoundVolume] = useState<number>(0.5);
  const [fontFamily, setFontFamily] = useState<string>('font-mono');
  const [frameOpacity, setFrameOpacity] = useState<number>(0.4);
  const [stopwatchLineDuration, setStopwatchLineDuration] = useState<number>(60000);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const soundInputRef = useRef<HTMLInputElement>(null);
  const bgSoundInputRef = useRef<HTMLInputElement>(null);
  const bgAudioRef = useRef<HTMLAudioElement>(null);

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  const youtubeId = getYoutubeId(youtubeUrl);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (bgAudioRef.current) {
      if (isRunning) {
        bgAudioRef.current.play().catch(e => console.error("Audio play error:", e));
      } else {
        bgAudioRef.current.pause();
      }
    }
  }, [isRunning, bgSound]);

  useEffect(() => {
    if (bgAudioRef.current) {
      bgAudioRef.current.volume = bgSoundVolume;
    }
  }, [bgSoundVolume]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let lastTime = Date.now();
    if (isRunning) {
      interval = setInterval(() => {
        const now = Date.now();
        const delta = now - lastTime;
        lastTime = now;
        setTimeLeft((prev) => {
          if (mode === 'countdown') {
            if (prev <= delta) {
              setIsRunning(false);
              triggerNotification();
              return 0;
            }
            return prev - delta;
          } else {
            return prev + delta;
          }
        });
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isRunning, mode]);

  const triggerNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Timer Complete!', {
        body: 'Your timer has finished.',
      });
    } else {
      alert('Timer Complete!');
    }
    
    if (alertSound) {
      const audio = new Audio(alertSound);
      audio.play().catch(e => console.error("Error playing sound:", e));
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'countdown' ? initialTime : 0);
  };

  const switchMode = (newMode: 'countdown' | 'countup') => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(newMode === 'countdown' ? initialTime : 0);
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    
    const main = h > 0 
      ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      
    return { main, ms: milliseconds.toString().padStart(2, '0') };
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBgImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSoundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAlertSound(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBgSoundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBgSound(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTimeChange = (minutes: number) => {
    const newTime = minutes * 60 * 1000;
    setInitialTime(newTime);
    setTimeLeft(newTime);
    setIsRunning(false);
  };

  return (
    <div 
      className="min-h-screen relative flex items-center justify-center overflow-hidden transition-colors duration-500 font-sans"
      style={bgType === 'image' ? {
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : {}}
    >
      {/* Background */}
      {bgType === 'youtube' && youtubeId && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <iframe
            className="absolute top-1/2 left-1/2 w-[100vw] h-[100vh] min-w-[177.77vh] min-h-[56.25vw] -translate-x-1/2 -translate-y-1/2"
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1`}
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </div>
      )}

      {/* Background Audio */}
      {bgSound && (
        <audio
          ref={bgAudioRef}
          src={bgSound}
          loop
          preload="auto"
        />
      )}

      {/* Overlay */}
      <div className={`absolute inset-0 z-0 transition-colors duration-500 ${theme === 'dark' ? 'bg-black/60' : 'bg-white/30 backdrop-blur-sm'}`} />

      {/* Top Controls */}
      <div className="absolute top-6 right-6 z-20 flex gap-4">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={`p-3 rounded-full backdrop-blur-md transition-all ${
            theme === 'dark' 
              ? 'bg-white/10 text-white hover:bg-white/20' 
              : 'bg-black/10 text-black hover:bg-black/20'
          }`}
        >
          {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className={`p-3 rounded-full backdrop-blur-md transition-all ${
            theme === 'dark' 
              ? 'bg-white/10 text-white hover:bg-white/20' 
              : 'bg-black/10 text-black hover:bg-black/20'
          }`}
        >
          <Settings size={24} />
        </button>
      </div>

      {/* Main Timer */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Mode Switcher */}
        <div 
          className={`mb-8 flex p-1 rounded-full backdrop-blur-md border transition-colors duration-500 ${
            theme === 'dark' ? 'border-white/10' : 'border-white/40'
          }`}
          style={{
            backgroundColor: theme === 'dark' ? `rgba(0, 0, 0, ${frameOpacity})` : `rgba(255, 255, 255, ${frameOpacity})`
          }}
        >
          <button
            onClick={() => switchMode('countdown')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              mode === 'countdown' 
                ? theme === 'dark' ? 'bg-white text-black shadow-md' : 'bg-slate-900 text-white shadow-md'
                : theme === 'dark' ? 'text-white/70 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Timer
          </button>
          <button
            onClick={() => switchMode('countup')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              mode === 'countup' 
                ? theme === 'dark' ? 'bg-white text-black shadow-md' : 'bg-slate-900 text-white shadow-md'
                : theme === 'dark' ? 'text-white/70 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Stopwatch
          </button>
        </div>

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`p-12 md:p-24 rounded-[3rem] backdrop-blur-xl border transition-colors duration-500 ${
            theme === 'dark'
              ? 'border-white/10 text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
              : 'border-white/40 text-slate-900 shadow-[0_8px_32px_rgba(0,0,0,0.1)]'
          }`}
          style={{
            backgroundColor: theme === 'dark' ? `rgba(0, 0, 0, ${frameOpacity})` : `rgba(255, 255, 255, ${frameOpacity})`
          }}
        >
          <div className="flex flex-col w-full">
            <div className={`pb-4 text-[6rem] md:text-[10rem] font-light tracking-tighter leading-none tabular-nums flex items-baseline justify-center ${fontFamily}`}>
              <span>{formatTime(timeLeft).main}</span>
              <span className="text-[3rem] md:text-[5rem] opacity-70">.{formatTime(timeLeft).ms}</span>
            </div>
            <div className="w-full h-[6px] rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <div 
                className={`h-full rounded-full ${theme === 'dark' ? 'bg-white' : 'bg-slate-900'}`}
                style={{ 
                  width: `${mode === 'countdown' ? (initialTime > 0 ? (timeLeft / initialTime) * 100 : 0) : ((timeLeft % stopwatchLineDuration) / stopwatchLineDuration) * 100}%`
                }}
              />
            </div>
          </div>
          
          <div className="mt-10 flex items-center justify-center gap-6">
            <button
              onClick={resetTimer}
              className={`p-4 rounded-full transition-all ${
                theme === 'dark'
                  ? 'bg-white/10 hover:bg-white/20 text-white'
                  : 'bg-black/5 hover:bg-black/10 text-slate-800'
              }`}
            >
              <RotateCcw size={32} />
            </button>
            <button
              onClick={toggleTimer}
              className={`p-6 rounded-full transition-all ${
                theme === 'dark'
                  ? 'bg-white text-black hover:scale-105'
                  : 'bg-slate-900 text-white hover:scale-105'
              }`}
            >
              {isRunning ? <Pause size={40} className="fill-current" /> : <Play size={40} className="fill-current ml-2" />}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={`w-full max-w-md p-6 rounded-3xl shadow-2xl pointer-events-auto ${
                  theme === 'dark'
                    ? 'bg-zinc-900 text-white border border-white/10'
                    : 'bg-white text-slate-900 border border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-semibold">Settings</h2>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2">
                  {/* Time Presets */}
                  <div className={`transition-opacity ${mode === 'countup' ? 'opacity-50 pointer-events-none' : ''}`}>
                    <label className="block text-sm font-medium mb-3 opacity-80">
                      Duration {mode === 'countup' && '(Timer only)'}
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[5, 15, 25, 45, 60].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => handleTimeChange(mins)}
                          className={`py-2 rounded-xl text-sm font-medium transition-colors ${
                            initialTime === mins * 60 * 1000
                              ? theme === 'dark' ? 'bg-white text-black' : 'bg-slate-900 text-white'
                              : theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'
                          }`}
                        >
                          {mins} min
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-3">
                      <input 
                        type="number" 
                        placeholder="Custom minutes (press Enter)"
                        className={`flex-1 px-4 py-3 rounded-xl outline-none text-sm transition-colors ${
                          theme === 'dark' 
                            ? 'bg-white/5 border border-white/10 focus:border-white/30 placeholder:text-white/30' 
                            : 'bg-slate-50 border border-slate-200 focus:border-slate-400 placeholder:text-slate-400'
                        }`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseInt(e.currentTarget.value);
                            if (!isNaN(val) && val > 0) {
                              handleTimeChange(val);
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Font Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-3 opacity-80">Timer Font</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'font-mono', label: 'Mono' },
                        { id: 'font-sans', label: 'Sans' },
                        { id: 'font-serif', label: 'Serif' }
                      ].map((font) => (
                        <button
                          key={font.id}
                          onClick={() => setFontFamily(font.id)}
                          className={`py-2 rounded-xl text-sm font-medium transition-colors ${font.id} ${
                            fontFamily === font.id
                              ? theme === 'dark' ? 'bg-white text-black' : 'bg-slate-900 text-white'
                              : theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'
                          }`}
                        >
                          {font.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Frame Opacity */}
                  <div>
                    <label className="block text-sm font-medium mb-3 opacity-80">Clock Frame Opacity</label>
                    <div className="flex items-center gap-4 px-2">
                      <span className="text-xs opacity-50">Transparent</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={frameOpacity}
                        onChange={(e) => setFrameOpacity(parseFloat(e.target.value))}
                        className="flex-1 accent-current"
                      />
                      <span className="text-xs opacity-50">Solid</span>
                    </div>
                  </div>

                  {/* Stopwatch Line Cycle */}
                  <div className={`transition-opacity ${mode === 'countdown' ? 'opacity-50 pointer-events-none hidden' : ''}`}>
                    <label className="block text-sm font-medium mb-3 opacity-80">Stopwatch Line Cycle</label>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { value: 10000, label: '10s' },
                        { value: 30000, label: '30s' },
                        { value: 60000, label: '1m' },
                        { value: 300000, label: '5m' }
                      ].map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => setStopwatchLineDuration(preset.value)}
                          className={`py-2 rounded-xl text-sm font-medium transition-colors ${
                            stopwatchLineDuration === preset.value
                              ? theme === 'dark' ? 'bg-white text-black' : 'bg-slate-900 text-white'
                              : theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Background Type */}
                  <div>
                    <label className="block text-sm font-medium mb-3 opacity-80">Background</label>
                    <div className="flex gap-2 mb-3 p-1 rounded-xl backdrop-blur-md border transition-colors duration-500 bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10">
                      <button
                        onClick={() => setBgType('image')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                          bgType === 'image' 
                            ? theme === 'dark' ? 'bg-white/20 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        <ImageIcon size={16} /> Image/GIF
                      </button>
                      <button
                        onClick={() => setBgType('youtube')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                          bgType === 'youtube' 
                            ? theme === 'dark' ? 'bg-white/20 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        <Youtube size={16} /> YouTube
                      </button>
                    </div>

                    {bgType === 'image' ? (
                      <div className="flex gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-colors text-sm font-medium ${
                            theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'
                          }`}
                        >
                          <Upload size={18} />
                          <span>Upload Image/GIF</span>
                        </button>
                        <button
                          onClick={() => setBgImage('https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?q=80&w=2940&auto=format&fit=crop')}
                          className={`px-4 py-3 rounded-xl transition-colors ${
                            theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'
                          }`}
                          title="Reset to default"
                        >
                          <RotateCcw size={18} />
                        </button>
                      </div>
                    ) : (
                      <input 
                        type="text" 
                        placeholder="Paste YouTube URL here..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl outline-none text-sm transition-colors ${
                          theme === 'dark' 
                            ? 'bg-white/5 border border-white/10 focus:border-white/30 placeholder:text-white/30' 
                            : 'bg-slate-50 border border-slate-200 focus:border-slate-400 placeholder:text-slate-400'
                        }`}
                      />
                    )}
                  </div>

                  {/* Custom Alert Sound */}
                  <div>
                    <label className="block text-sm font-medium mb-3 opacity-80">Alert Sound</label>
                    <div className="flex gap-3">
                      <input
                        type="file"
                        accept="audio/mp3,audio/wav,audio/ogg"
                        ref={soundInputRef}
                        onChange={handleSoundUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => soundInputRef.current?.click()}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-colors text-sm font-medium ${
                          theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'
                        }`}
                      >
                        <Music size={18} />
                        <span>{alertSound ? 'Change Sound' : 'Upload Sound (.mp3)'}</span>
                      </button>
                      {alertSound && (
                        <button
                          onClick={() => setAlertSound('')}
                          className={`px-4 py-3 rounded-xl transition-colors ${
                            theme === 'dark' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-100 text-red-600 hover:bg-red-200'
                          }`}
                          title="Remove custom sound"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Background Audio */}
                  <div>
                    <label className="block text-sm font-medium mb-3 opacity-80">Background Audio</label>
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-3">
                        <input
                          type="file"
                          accept="audio/mp3,audio/wav,audio/ogg"
                          ref={bgSoundInputRef}
                          onChange={handleBgSoundUpload}
                          className="hidden"
                        />
                        <button
                          onClick={() => bgSoundInputRef.current?.click()}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-colors text-sm font-medium ${
                            theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'
                          }`}
                        >
                          <Volume2 size={18} />
                          <span>{bgSound ? 'Change Background Audio' : 'Upload Background Audio'}</span>
                        </button>
                        {bgSound && (
                          <button
                            onClick={() => setBgSound('')}
                            className={`px-4 py-3 rounded-xl transition-colors ${
                              theme === 'dark' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-100 text-red-600 hover:bg-red-200'
                            }`}
                            title="Remove background audio"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                      {bgSound && (
                        <div className="flex items-center gap-3 px-2">
                          <Volume2 size={16} className="opacity-50" />
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={bgSoundVolume}
                            onChange={(e) => setBgSoundVolume(parseFloat(e.target.value))}
                            className="flex-1 accent-current"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notifications */}
                  <div>
                    <label className="block text-sm font-medium mb-3 opacity-80">Notifications</label>
                    <button
                      onClick={requestNotificationPermission}
                      disabled={notificationPermission === 'granted'}
                      className={`w-full flex items-center justify-between py-3 px-4 rounded-xl transition-colors text-sm font-medium ${
                        notificationPermission === 'granted'
                          ? theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                          : theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Bell size={18} />
                        <span>
                          {notificationPermission === 'granted' 
                            ? 'Notifications Enabled' 
                            : notificationPermission === 'denied'
                              ? 'Notifications Blocked'
                              : 'Enable Notifications'}
                        </span>
                      </div>
                      {notificationPermission === 'granted' && <span className="text-xs font-bold uppercase tracking-wider">Active</span>}
                    </button>
                    {notificationPermission === 'denied' && (
                      <p className="text-xs mt-2 text-red-400">Please enable notifications in your browser settings.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
