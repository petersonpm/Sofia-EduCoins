/**
 * Helper to play retro arcade sound effects using browser Web Audio API synth.
 */
const playTone = (frequency, type = 'sine', duration = 0.2, volume = 0.15) => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Resume context if suspended (browser security autoplay policies)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    // Smooth decay to avoid audio clicks
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (error) {
    console.warn('Web Audio API synth is blocked or unsupported:', error);
  }
};

/**
 * Super Mario style coin pickup sound.
 */
export const playCoinSound = () => {
  playTone(987.77, 'sine', 0.08, 0.15); // B5 note
  setTimeout(() => {
    playTone(1318.51, 'sine', 0.25, 0.15); // E6 note
  }, 80);
};

/**
 * Joyful level-up ascending chord.
 */
export const playLevelUpSound = () => {
  const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
  notes.forEach((freq, index) => {
    setTimeout(() => {
      playTone(freq, 'triangle', 0.2, 0.12);
    }, index * 80);
  });
};

/**
 * Generic success/completion chime.
 */
export const playSuccessSound = () => {
  playTone(587.33, 'sine', 0.1, 0.12); // D5
  setTimeout(() => {
    playTone(783.99, 'sine', 0.1, 0.12); // G5
  }, 100);
  setTimeout(() => {
    playTone(987.77, 'sine', 0.3, 0.15); // B5
  }, 200);
};

/**
 * Friendly error or action decline sound.
 */
export const playBuzzerSound = () => {
  playTone(180, 'sawtooth', 0.15, 0.1);
  setTimeout(() => {
    playTone(140, 'sawtooth', 0.2, 0.1);
  }, 120);
};
