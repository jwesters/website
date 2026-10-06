(() => {
  'use strict';

  const te = new TextEncoder();

  function u8(...values) { return Uint8Array.from(values.map(v => v & 0xff)); }
  function u16(v) { return Uint8Array.of((v >>> 8) & 255, v & 255); }
  function u24(v) { return Uint8Array.of((v >>> 16) & 255, (v >>> 8) & 255, v & 255); }
  function u32(v) {
    const n = Number(v) >>> 0;
    return Uint8Array.of((n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255);
  }
  function i32(v) { return u32(v >>> 0); }
  function u64(v) {
    let n = BigInt(Math.max(0, Math.floor(Number(v))));
    const out = new Uint8Array(8);
    for (let i = 7; i >= 0; i--) { out[i] = Number(n & 255n); n >>= 8n; }
    return out;
  }
  function fixed16_16(n) { return u32(Math.round(n * 65536)); }
  function fixed8_8(n) { return u16(Math.round(n * 256)); }
  function fourcc(s) {
    if (s.length !== 4) throw new Error(`FourCC must be 4 characters: ${s}`);
    return Uint8Array.of(s.charCodeAt(0) & 255, s.charCodeAt(1) & 255, s.charCodeAt(2) & 255, s.charCodeAt(3) & 255);
  }
  function concat(parts) {
    const valid = parts.filter(Boolean);
    let len = 0;
    for (const p of valid) len += p.length;
    const out = new Uint8Array(len);
    let off = 0;
    for (const p of valid) { out.set(p, off); off += p.length; }
    return out;
  }
  function box(type, ...payloads) {
    const payload = concat(payloads);
    if (payload.length + 8 > 0xffffffff) {
      const size = BigInt(payload.length) + 16n;
      return concat([u32(1), fourcc(type), (() => {
        const out = new Uint8Array(8); let n = size;
        for (let i = 7; i >= 0; i--) { out[i] = Number(n & 255n); n >>= 8n; }
        return out;
      })(), payload]);
    }
    return concat([u32(payload.length + 8), fourcc(type), payload]);
  }
  function fullBox(type, version, flags, ...payloads) {
    return box(type, u8(version), u24(flags), ...payloads);
  }
  function str(s) { return te.encode(String(s ?? '')); }
  function cString(s) { return concat([str(s), u8(0)]); }
  function clamp255Utf8(s) {
    let bytes = str(s);
    if (bytes.length <= 255) return bytes;
    bytes = bytes.slice(0, 255);
    while (bytes.length && (bytes[bytes.length - 1] & 0xc0) === 0x80) bytes = bytes.slice(0, -1);
    return bytes;
  }

  function descriptor(tag, payload) {
    const len = payload.length;
    const bytes = [];
    let groups = [len & 0x7f];
    let n = len >>> 7;
    while (n) { groups.unshift((n & 0x7f) | 0x80); n >>>= 7; }
    bytes.push(tag, ...groups);
    return concat([Uint8Array.from(bytes), payload]);
  }

  function esds(config, bitrate, trackId = 1) {
    const asc = config && config.length ? config : Uint8Array.of(0x12, 0x10);
    const decSpecific = descriptor(0x05, asc);
    const decoderConfig = descriptor(0x04, concat([
      u8(0x40), // MPEG-4 Audio
      u8(0x15), // audio stream
      u24(0),
      u32(bitrate || 96000),
      u32(bitrate || 96000),
      decSpecific,
    ]));
    const sl = descriptor(0x06, u8(0x02));
    const es = descriptor(0x03, concat([u16(trackId), u8(0), decoderConfig, sl]));
    return fullBox('esds', 0, 0, es);
  }

  function mp4aEntry(sampleRate, channels, config, bitrate) {
    const header = concat([
      new Uint8Array(6), u16(1),
      new Uint8Array(8),
      u16(channels), u16(16), u16(0), u16(0),
      u32(sampleRate << 16),
    ]);
    return box('mp4a', header, esds(config, bitrate));
  }

  function ima4Entry(sampleRate, channels) {
    // QuickTime Sound Sample Description v1 for Apple IMA 4:1 ADPCM.
    // One encoded sample = 64 PCM frames and 34 bytes per channel.
    const channelLayoutTag = channels === 1 ? 0x00040000 : 0x00030000;
    const chan = box('chan', u32(0), u32(channelLayoutTag), u32(0), u32(0));
    const header = concat([
      new Uint8Array(6), u16(1),
      u16(1), u16(0), u32(0),
      u16(channels), u16(16), u16(0xfffe), u16(0),
      u32(sampleRate * 65536),
      u32(64), u32(0), u32(0), u32(2),
    ]);
    return box('ima4', header, chan);
  }

  function stts(durations) {
    const runs = [];
    let last = null, count = 0;
    for (const d0 of durations) {
      const d = Math.max(1, Math.round(d0));
      if (last === null || d !== last) {
        if (count) runs.push([count, last]);
        last = d; count = 1;
      } else count++;
    }
    if (count) runs.push([count, last]);
    return fullBox('stts', 0, 0, u32(runs.length), ...runs.flatMap(([c,d]) => [u32(c), u32(d)]));
  }

  function sttsRuns(runs) {
    const clean = runs.filter(([count, duration]) => count > 0 && duration > 0);
    return fullBox('stts', 0, 0, u32(clean.length), ...clean.flatMap(([c,d]) => [u32(c), u32(d)]));
  }

  function stszConstant(sampleSize, sampleCount) {
    return fullBox('stsz', 0, 0, u32(sampleSize), u32(sampleCount));
  }

  function stsc(totalSamples=1, samplesPerChunk=1) {
    if (totalSamples <= 0) return fullBox('stsc', 0, 0, u32(0));
    const full = Math.floor(totalSamples / samplesPerChunk);
    const rem = totalSamples % samplesPerChunk;
    const entries = [];
    if (full > 0) entries.push([1, samplesPerChunk, 1]);
    if (rem > 0) entries.push([full + 1, rem, 1]);
    if (!entries.length) entries.push([1, totalSamples, 1]);
    return fullBox('stsc', 0, 0, u32(entries.length), ...entries.flatMap(e => [u32(e[0]),u32(e[1]),u32(e[2])]));
  }

  function stsz(samples) {
    return stszSizes(samples.map(s => s.length));
  }
  function packedU32(values) {
    const out = new Uint8Array(values.length * 4);
    const view = new DataView(out.buffer);
    for (let i = 0; i < values.length; i++) view.setUint32(i * 4, Number(values[i]) >>> 0, false);
    return out;
  }

  function packedU64(values) {
    const out = new Uint8Array(values.length * 8);
    const view = new DataView(out.buffer);
    for (let i = 0; i < values.length; i++) {
      const n = BigInt(Math.max(0, Math.floor(Number(values[i]))));
      view.setUint32(i * 8, Number((n >> 32n) & 0xffffffffn), false);
      view.setUint32(i * 8 + 4, Number(n & 0xffffffffn), false);
    }
    return out;
  }

  function stszSizes(sizes) {
    // Do not spread one argument per AAC frame. A multi-hour audiobook can
    // contain well over a million frames, which exceeds JS argument limits.
    return fullBox('stsz', 0, 0, u32(0), u32(sizes.length), packedU32(sizes));
  }

  function chunkOffsetBox(offsets) {
    const needs64 = offsets.some(x => x > 0xffffffff);
    if (needs64) return fullBox('co64', 0, 0, u32(offsets.length), packedU64(offsets));
    return fullBox('stco', 0, 0, u32(offsets.length), packedU32(offsets));
  }

  function mdhd(timescale, duration) {
    return fullBox('mdhd', 0, 0,
      u32(0), u32(0), u32(timescale), u32(duration),
      u16(0x55c4), // und
      u16(0)
    );
  }

  function hdlr(handlerType, name) {
    return fullBox('hdlr', 0, 0, u32(0), fourcc(handlerType), new Uint8Array(12), cString(name));
  }

  function smhd() { return fullBox('smhd', 0, 0, u16(0), u16(0)); }
  function dinf() {
    const url = fullBox('url ', 0, 1);
    const dref = fullBox('dref', 0, 0, u32(1), url);
    return box('dinf', dref);
  }

  function tkhd(trackId, movieDurationMs, { flags=0x000007, volume=0, altGroup=0, width=0, height=0 } = {}) {
    return fullBox('tkhd', 0, flags,
      u32(0), u32(0), u32(trackId), u32(0), u32(movieDurationMs),
      new Uint8Array(8), u16(0), u16(altGroup), fixed8_8(volume), u16(0),
      fixed16_16(1), u32(0), u32(0),
      u32(0), fixed16_16(1), u32(0),
      u32(0), u32(0), u32(0x40000000),
      fixed16_16(width), fixed16_16(height)
    );
  }

  function mvhd(movieDurationMs) {
    return fullBox('mvhd', 0, 0,
      u32(0), u32(0), u32(1000), u32(movieDurationMs),
      fixed16_16(1), fixed8_8(1), new Uint8Array(10),
      fixed16_16(1), u32(0), u32(0),
      u32(0), fixed16_16(1), u32(0),
      u32(0), u32(0), u32(0x40000000),
      new Uint8Array(24), u32(3)
    );
  }

  function dataBox(payload, type = 1) {
    return box('data', u32(type), u32(0), payload);
  }
  function textTag(tag, value) {
    if (value == null || value === '') return null;
    return box(tag, dataBox(str(value), 1));
  }
  function intTag(tag, value) {
    return box(tag, dataBox(u32(value), 21));
  }
  function freeformTag(name, value) {
    if (!value) return null;
    return box('----',
      fullBox('mean', 0, 0, str('com.apple.iTunes')),
      fullBox('name', 0, 0, str(name)),
      dataBox(str(value), 1)
    );
  }


  function nmhd() { return fullBox('nmhd', 0, 0); }

  function tx3gEntry() {
    const name = str('Sans-Serif');
    const ftab = box('ftab', u16(1), u16(1), u8(name.length), name);
    const entry = concat([
      new Uint8Array(6), u16(1),
      u32(0),                 // display flags
      u8(0x01), u8(0xff),    // horizontal / vertical justification
      u8(0x1f,0x1f,0x1f,0), // background RGBA
      u16(0), u16(0), u16(0), u16(0), // default text box
      u16(0), u16(0), u16(1), u8(1), u8(0x12), u8(0,0,0,0xff),
      ftab
    ]);
    return box('tx3g', entry);
  }

  function chapterSample(title) {
    const text = str(title || 'Chapter');
    const capped = text.length > 65535 ? text.slice(0,65535) : text;
    return concat([u16(capped.length), capped]);
  }

  function chapterTrack(chapters, movieDurationMs, offsets, samples) {
    const starts = chapters.map(c => Math.max(0, Math.round((c.time || 0) * 1000)));
    const durs = starts.map((v,i) => Math.max(1, (i+1 < starts.length ? starts[i+1] : movieDurationMs) - v));
    const stbl = box('stbl',
      fullBox('stsd', 0, 0, u32(1), tx3gEntry()),
      stts(durs), stsc(samples.length, 1), stsz(samples), chunkOffsetBox(offsets)
    );
    const minf = box('minf', nmhd(), dinf(), stbl);
    const mdia = box('mdia', mdhd(1000, durs.reduce((a,b)=>a+b,0)), hdlr('text', 'Chapter Titles'), minf);
    return box('trak', tkhd(2, movieDurationMs, { flags:1, volume:0, altGroup:1 }), mdia);
  }

  function metaBox(meta = {}, cover = null) {
    const desc = meta.description || '';
    const tags = [
      textTag('©nam', meta.title),
      textTag('©ART', meta.author),
      textTag('aART', meta.author),
      textTag('©alb', meta.title),
      textTag('©wrt', meta.narrator),
      textTag('©day', meta.year),
      textTag('©gen', meta.genre || 'Audiobook'),
      textTag('©cmt', meta.narrator ? `Narrated by ${meta.narrator}` : ''),
      textTag('desc', desc),
      textTag('ldes', desc),
      textTag('©too', 'Audiobook Builder'),
      box('stik', dataBox(u8(2), 21)),
      freeformTag('NARRATOR', meta.narrator),
    ].filter(Boolean);
    if (cover && cover.bytes && cover.bytes.length) {
      const type = cover.mime === 'image/png' ? 14 : 13;
      tags.push(box('covr', dataBox(cover.bytes, type)));
    }
    const metaHandler = fullBox('hdlr', 0, 0, u32(0), fourcc('mdir'), fourcc('appl'), new Uint8Array(8), cString(''));
    return fullBox('meta', 0, 0, metaHandler, box('ilst', ...tags));
  }

  function chapterBox(chapters = []) {
    const chosen = chapters.slice(0, 255);
    const payload = [u32(0), u8(chosen.length)];
    for (const c of chosen) {
      const title = clamp255Utf8(c.title || 'Chapter');
      payload.push(u64(Math.max(0, c.time || 0) * 10000000), u8(title.length), title);
    }
    return fullBox('chpl', 1, 0, ...payload);
  }

  function buildM4B({
    samples, dataBlocks, sampleSizes, durations,
    sampleRate, channels, config, bitrate, metadata, chapters, cover,
    codec = 'aac', sampleCount = 0, constantSampleSize = 0, lastSampleDuration = 0
  }) {
    const blocks = dataBlocks && dataBlocks.length ? dataBlocks : (samples || []);
    if (!blocks.length) throw new Error('No encoded audio data was provided.');

    const isIma4 = codec === 'ima4';
    let sizes = null;
    let count = 0;
    let totalTrackDuration = 0;
    let audioBytes = 0;
    let sampleEntry;
    let audioStts;
    let audioStsz;
    let audioSamplesPerChunk;

    if (isIma4) {
      count = Number(sampleCount) || 0;
      const packetSize = Number(constantSampleSize) || (34 * channels);
      if (!count) throw new Error('No IMA4 audio samples were provided.');
      const lastDur = Math.max(1, Math.min(64, Number(lastSampleDuration) || 64));
      totalTrackDuration = count === 1 ? lastDur : ((count - 1) * 64 + lastDur);
      audioBytes = count * packetSize;
      const actualBlockBytes = blocks.reduce((n,b) => n + b.length, 0);
      if (audioBytes !== actualBlockBytes) throw new Error(`IMA4 audio byte count mismatch (${actualBlockBytes} vs ${audioBytes}).`);
      sampleEntry = ima4Entry(sampleRate, channels);
      audioStts = sttsRuns(count === 1 || lastDur === 64 ? [[count, lastDur]] : [[count - 1, 64], [1, lastDur]]);
      audioStsz = stszConstant(packetSize, count);
      audioSamplesPerChunk = 4096;
    } else {
      sizes = sampleSizes && sampleSizes.length ? sampleSizes : (samples || []).map(s => s.length);
      if (!sizes.length) throw new Error('No encoded AAC samples were provided.');
      if (!durations || sizes.length !== durations.length) throw new Error('Sample/duration count mismatch.');
      count = sizes.length;
      totalTrackDuration = durations.reduce((a,b) => a + Math.max(1, Math.round(b)), 0);
      audioBytes = sizes.reduce((n,v) => n + v, 0);
      const actualBlockBytes = blocks.reduce((n,b) => n + b.length, 0);
      if (audioBytes !== actualBlockBytes) throw new Error('Encoded AAC block sizes do not match the sample table.');
      sampleEntry = mp4aEntry(sampleRate, channels, config, bitrate);
      audioStts = stts(durations);
      audioStsz = stszSizes(sizes);
      audioSamplesPerChunk = 128;
    }

    const movieDurationMs = Math.max(1, Math.round(totalTrackDuration * 1000 / sampleRate));
    const ftyp = box('ftyp', fourcc('M4B '), u32(0x00000200), fourcc('M4B '), fourcc('M4A '), fourcc('isom'), fourcc('mp42'));
    const chapterSamples = (chapters || []).map(c => chapterSample(c.title));
    const chapterBytes = chapterSamples.reduce((n,s) => n + s.length, 0);
    const mdatPayloadSize = audioBytes + chapterBytes;
    const mdatHeaderSize = mdatPayloadSize + 8 <= 0xffffffff ? 8 : 16;
    const dataStart = ftyp.length + mdatHeaderSize;

    const offsets = [];
    if (isIma4) {
      const packetSize = Number(constantSampleSize) || (34 * channels);
      for (let i = 0; i < count; i += audioSamplesPerChunk) offsets.push(dataStart + i * packetSize);
    } else {
      let off = dataStart;
      for (let i = 0; i < sizes.length; i++) {
        if (i % audioSamplesPerChunk === 0) offsets.push(off);
        off += sizes[i];
      }
    }

    let chapterDataOffset = dataStart + audioBytes;
    const chapterOffsets = [];
    for (const sample of chapterSamples) {
      chapterOffsets.push(chapterDataOffset);
      chapterDataOffset += sample.length;
    }

    let mdatHeader;
    if (mdatPayloadSize + 8 <= 0xffffffff) {
      mdatHeader = concat([u32(mdatPayloadSize + 8), fourcc('mdat')]);
    } else {
      const largeSize = BigInt(mdatPayloadSize) + 16n;
      const ls = new Uint8Array(8); let n = largeSize;
      for (let i=7;i>=0;i--) { ls[i]=Number(n & 255n); n >>= 8n; }
      mdatHeader = concat([u32(1), fourcc('mdat'), ls]);
    }

    const stbl = box('stbl',
      fullBox('stsd', 0, 0, u32(1), sampleEntry),
      audioStts,
      stsc(count, audioSamplesPerChunk),
      audioStsz,
      chunkOffsetBox(offsets)
    );
    const minf = box('minf', smhd(), dinf(), stbl);
    const mdia = box('mdia', mdhd(sampleRate, totalTrackDuration), hdlr('soun', 'SoundHandler'), minf);
    const tref = chapters && chapters.length ? box('tref', box('chap', u32(2))) : null;
    const audioTrak = box('trak', tkhd(1, movieDurationMs, { flags:7, volume:1 }), tref, mdia);
    const chapterTrak = chapters && chapters.length ? chapterTrack(chapters, movieDurationMs, chapterOffsets, chapterSamples) : null;
    const nero = chapters && chapters.length && chapters.length <= 255 ? chapterBox(chapters) : null;
    const udta = box('udta', metaBox(metadata, cover), nero);
    const moov = box('moov', mvhd(movieDurationMs), audioTrak, chapterTrak, udta);

    return new Blob([ftyp, mdatHeader, ...blocks, ...chapterSamples, moov], { type: 'audio/mp4' });
  }

  window.M4BMuxer = { buildM4B };
})();
