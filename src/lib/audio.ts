export const NOISES = [
  { id: 'white', label: 'White' },
  { id: 'pink', label: 'Pink' },
  { id: 'brown', label: 'Deep brown' },
  { id: 'cafe', label: 'Café' },
  { id: 'airplane', label: 'Airplane' },
] as const

export type NoiseId = (typeof NOISES)[number]['id']

const BUFFER_SECONDS = 4

/**
 * Four seconds of noise, looped. `cafe` is shaped pink noise and `airplane` is
 * shaped brown noise, so both borrow the colour of their base.
 */
function fillBuffer(context: AudioContext, colour: 'white' | 'pink' | 'brown'): AudioBuffer {
  const length = context.sampleRate * BUFFER_SECONDS
  const buffer = context.createBuffer(1, length, context.sampleRate)
  const channel = buffer.getChannelData(0)
  let b0 = 0
  let b1 = 0
  let b2 = 0
  let b3 = 0
  let b4 = 0
  let b5 = 0
  let b6 = 0
  let last = 0

  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1
    if (colour === 'white') {
      channel[i] = white * 0.6
    } else if (colour === 'pink') {
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.969 * b2 + white * 0.153852
      b3 = 0.8665 * b3 + white * 0.3104856
      b4 = 0.55 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.016898
      channel[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.09
      b6 = white * 0.115926
    } else {
      last = (last + 0.02 * white) / 1.02
      channel[i] = last * 3.2
    }
  }

  return buffer
}

/**
 * The generated-noise graph. Radio and video go through video.js instead — this
 * is synthesised sample by sample, so there is no source for a player to load.
 * Kept outside the component tree so a re-render never restarts playback.
 */
export class NoiseEngine {
  private context: AudioContext | null = null
  private gain: GainNode | null = null
  private lfo: OscillatorNode | null = null
  private source: AudioBufferSourceNode | null = null
  private volume = 0.55

  start(noise: NoiseId): boolean {
    const Context =
      window.AudioContext ??
      (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Context) {
      return false
    }

    this.stop()
    this.context ??= new Context()
    void this.context.resume()

    const context = this.context
    const base = noise === 'airplane' ? 'brown' : noise === 'cafe' ? 'pink' : noise
    const source = context.createBufferSource()
    source.buffer = fillBuffer(context, base)
    source.loop = true

    const gain = context.createGain()
    gain.gain.value = this.volume * 0.9

    let chain: AudioNode = source
    if (noise === 'airplane') {
      const lowpass = context.createBiquadFilter()
      lowpass.type = 'lowpass'
      lowpass.frequency.value = 340
      lowpass.Q.value = 0.8
      chain.connect(lowpass)
      chain = lowpass
    } else if (noise === 'cafe') {
      const bandpass = context.createBiquadFilter()
      bandpass.type = 'bandpass'
      bandpass.frequency.value = 700
      bandpass.Q.value = 0.55
      chain.connect(bandpass)
      chain = bandpass

      // A slow swell, so the room sounds like it breathes.
      const lfo = context.createOscillator()
      lfo.frequency.value = 0.12
      const lfoGain = context.createGain()
      lfoGain.gain.value = 0.22
      lfo.connect(lfoGain).connect(gain.gain)
      lfo.start()
      this.lfo = lfo
    }

    chain.connect(gain).connect(context.destination)
    source.start()
    this.source = source
    this.gain = gain
    return true
  }

  setVolume(percent: number): void {
    this.volume = percent / 100
    if (this.gain) {
      this.gain.gain.value = this.volume * 0.9
    }
  }

  dispose(): void {
    this.stop()
    void this.context?.close()
    this.context = null
  }

  stop(): void {
    try {
      this.source?.stop()
    } catch {
      // Already stopped; a source node can only be started once.
    }
    try {
      this.lfo?.stop()
    } catch {
      // Same.
    }
    this.source = null
    this.lfo = null
    this.gain = null
  }
}
