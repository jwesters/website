(() => {
  'use strict';

  const STEP = [7,8,9,10,11,12,13,14,16,17,19,21,23,25,28,31,34,37,41,45,50,55,60,66,73,80,88,97,107,118,130,143,157,173,190,209,230,253,279,307,337,371,408,449,494,544,598,658,724,796,876,963,1060,1166,1282,1411,1552,1707,1878,2066,2272,2499,2749,3024,3327,3660,4026,4428,4871,5358,5894,6484,7132,7845,8630,9493,10442,11487,12635,13899,15289,16818,18500,20350,22385,24623,27086,29794,32767];
  const INDEX = [-1,-1,-1,-1,2,4,6,8,-1,-1,-1,-1,2,4,6,8];

  function clamp16(v) { return Math.max(-32768, Math.min(32767, v | 0)); }

  function encodeNibble(state, sample) {
    let delta = sample - state.prev;
    let step = STEP[state.index];
    let nibble = delta < 0 ? 8 : 0;
    delta = Math.abs(delta);
    let diff = delta + (step >> 3);
    if (delta >= step) { nibble |= 4; delta -= step; }
    step >>= 1;
    if (delta >= step) { nibble |= 2; delta -= step; }
    step >>= 1;
    if (delta >= step) { nibble |= 1; delta -= step; }
    diff -= delta;
    state.prev = clamp16(state.prev + ((nibble & 8) ? -diff : diff));
    state.index = Math.max(0, Math.min(88, state.index + INDEX[nibble]));
    return nibble;
  }

  class ByteBlockWriter {
    constructor(blockSize = 1024 * 1024) {
      this.blockSize = Math.max(1024, blockSize | 0);
      this.blocks = [];
      this.current = new Uint8Array(this.blockSize);
      this.offset = 0;
      this.total = 0;
    }
    ensure(n) {
      if (n > this.current.length) throw new Error('IMA4 packet exceeds block size.');
      if (this.offset + n > this.current.length) this.flush();
    }
    flush() {
      if (!this.offset) return;
      this.blocks.push(this.current.slice(0, this.offset));
      this.current = new Uint8Array(this.blockSize);
      this.offset = 0;
    }
    writeByte(v) { this.current[this.offset++] = v & 255; this.total++; }
    finish() { this.flush(); return this.blocks; }
  }

  class StreamEncoder {
    constructor(channels, { blockSize = 1024 * 1024 } = {}) {
      if (channels !== 1 && channels !== 2) throw new Error('IMA4 supports mono or stereo in Audiobook Builder.');
      this.channels = channels;
      this.writer = new ByteBlockWriter(blockSize);
      this.states = Array.from({ length: channels }, () => ({ prev: 0, index: 0 }));
      this.pending = Array.from({ length: channels }, () => new Float32Array(64));
      this.pendingCount = 0;
      this.sampleCount = 0;
      this.lastDuration = 64;
      this.inputFrames = 0;
    }

    _toS16(v) {
      const x = Math.max(-1, Math.min(1, Number(v) || 0));
      return x <= -1 ? -32768 : Math.round(x * 32767);
    }

    _writePacket(planes, offset, validFrames = 64) {
      const packetBytes = 34 * this.channels;
      this.writer.ensure(packetBytes);
      for (let c = 0; c < this.channels; c++) {
        const state = this.states[c];
        const header = ((state.prev & 0xff80) | (state.index & 0x7f)) & 0xffff;
        this.writer.writeByte(header >>> 8);
        this.writer.writeByte(header);
        const plane = planes[c];
        for (let i = 0; i < 64; i += 2) {
          const s1 = i < validFrames ? this._toS16(plane[offset + i]) : 0;
          const s2 = i + 1 < validFrames ? this._toS16(plane[offset + i + 1]) : 0;
          const n1 = encodeNibble(state, s1);
          const n2 = encodeNibble(state, s2);
          this.writer.writeByte((n2 << 4) | n1);
        }
      }
      this.sampleCount++;
    }

    pushPlanar(data, frames) {
      if (!(data instanceof Float32Array)) throw new TypeError('IMA4 pushPlanar expects Float32Array data.');
      frames = Math.max(0, frames | 0);
      if (!frames) return;
      if (data.length < frames * this.channels) throw new Error('IMA4 planar buffer is shorter than expected.');
      this.inputFrames += frames;
      const planes = Array.from({ length: this.channels }, (_, c) => data.subarray(c * frames, (c + 1) * frames));
      let pos = 0;

      if (this.pendingCount) {
        const take = Math.min(64 - this.pendingCount, frames);
        for (let c = 0; c < this.channels; c++) this.pending[c].set(planes[c].subarray(0, take), this.pendingCount);
        this.pendingCount += take;
        pos += take;
        if (this.pendingCount === 64) {
          this._writePacket(this.pending, 0, 64);
          this.pendingCount = 0;
        }
      }

      while (pos + 64 <= frames) {
        this._writePacket(planes, pos, 64);
        pos += 64;
      }

      if (pos < frames) {
        const remain = frames - pos;
        for (let c = 0; c < this.channels; c++) this.pending[c].set(planes[c].subarray(pos), 0);
        this.pendingCount = remain;
      }
    }

    pushSilence(frames) {
      frames = Math.max(0, Math.round(frames));
      const chunkFrames = 8192;
      while (frames > 0) {
        const n = Math.min(chunkFrames, frames);
        this.pushPlanar(new Float32Array(n * this.channels), n);
        frames -= n;
      }
    }

    finish() {
      if (this.pendingCount) {
        this.lastDuration = this.pendingCount;
        this._writePacket(this.pending, 0, this.pendingCount);
        this.pendingCount = 0;
      } else if (this.sampleCount) {
        this.lastDuration = 64;
      }
      return {
        blocks: this.writer.finish(),
        bytes: this.writer.total,
        sampleCount: this.sampleCount,
        lastDuration: this.lastDuration,
        inputFrames: this.inputFrames,
        packetSize: 34 * this.channels
      };
    }
  }

  window.Ima4Compat = { StreamEncoder };
})();
