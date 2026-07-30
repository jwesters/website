(() => {
  'use strict';

  const PROGRESSIONS = [
    // Pop
    {name:'Four Chords', category:'Pop', mode:'major', pattern:['I','V','vi','IV']},
    {name:'Axis Variation', category:'Pop', mode:'major', pattern:['vi','IV','I','V']},
    {name:'Sensitive Pop', category:'Pop', mode:'major', pattern:['I','iii','IV','iv']},
    {name:'Doo-Wop Pop', category:'Pop', mode:'major', pattern:['I','vi','IV','V']},
    {name:'Bright Lift', category:'Pop', mode:'major', pattern:['I','IV','vi','V']},
    {name:'Anthem Loop', category:'Pop', mode:'major', pattern:['IV','I','V','vi']},
    {name:'Pop Resolve', category:'Pop', mode:'major', pattern:['I','vi','ii','V']},
    {name:'Modern Pop', category:'Pop', mode:'major', pattern:['vi','V','IV','V']},
    {name:'Pop Ballad', category:'Pop', mode:'major', pattern:['I','V','IV','IV']},
    {name:'Rising Pop', category:'Pop', mode:'major', pattern:['I','ii','IV','V']},
    {name:'Descending Pop', category:'Pop', mode:'major', pattern:['I','V','IV','iii']},
    {name:'Pop Turnaround', category:'Pop', mode:'major', pattern:['I','iii','vi','IV']},

    // Rock
    {name:'Classic Rock I-IV-V', category:'Rock', mode:'major', pattern:['I','IV','V','IV']},
    {name:'Rock Mixolydian', category:'Rock', mode:'major', pattern:['I','bVII','IV','I']},
    {name:'Stadium Rock', category:'Rock', mode:'major', pattern:['I','V','IV','I']},
    {name:'Driving Rock', category:'Rock', mode:'major', pattern:['I','bVII','IV','bVII']},
    {name:'Power Ballad', category:'Rock', mode:'major', pattern:['I','V','vi','IV']},
    {name:'Rock Descender', category:'Rock', mode:'major', pattern:['I','bVII','bVI','bVII']},
    {name:'Southern Rock', category:'Rock', mode:'major', pattern:['I','bVII','IV','I']},
    {name:'Rock Minor Lift', category:'Rock', mode:'minor', pattern:['i','VI','III','VII']},
    {name:'Minor Rock Cycle', category:'Rock', mode:'minor', pattern:['i','VII','VI','VII']},
    {name:'Alternative Rock', category:'Rock', mode:'major', pattern:['I','iii','IV','vi']},

    // Folk / Country
    {name:'Three-Chord Folk', category:'Folk / Country', mode:'major', pattern:['I','IV','V','I']},
    {name:'Country Turnaround', category:'Folk / Country', mode:'major', pattern:['I','IV','I','V']},
    {name:'Country Walk', category:'Folk / Country', mode:'major', pattern:['I','vi','IV','V']},
    {name:'Folk Story', category:'Folk / Country', mode:'major', pattern:['I','V','IV','I']},
    {name:'Americana', category:'Folk / Country', mode:'major', pattern:['I','IV','vi','V']},
    {name:'Country Two-Five', category:'Folk / Country', mode:'major', pattern:['I','II7','V','I']},
    {name:'Train Beat', category:'Folk / Country', mode:'major', pattern:['I','I','IV','V']},
    {name:'Gentle Folk', category:'Folk / Country', mode:'major', pattern:['I','iii','IV','I']},
    {name:'Country Six Minor', category:'Folk / Country', mode:'major', pattern:['I','vi','ii','V']},
    {name:'Folk Modal', category:'Folk / Country', mode:'major', pattern:['I','bVII','I','IV']},

    // Blues
    {name:'12-Bar Blues', category:'Blues', mode:'major', pattern:['I7','I7','I7','I7','IV7','IV7','I7','I7','V7','IV7','I7','V7']},
    {name:'Quick-Change Blues', category:'Blues', mode:'major', pattern:['I7','IV7','I7','I7','IV7','IV7','I7','I7','V7','IV7','I7','V7']},
    {name:'Eight-Bar Blues', category:'Blues', mode:'major', pattern:['I7','V7','IV7','IV7','I7','V7','I7','V7']},
    {name:'Minor Blues', category:'Blues', mode:'minor', pattern:['i7','iv7','i7','i7','iv7','iv7','i7','i7','VI7','V7','i7','V7']},
    {name:'Blues Turnaround', category:'Blues', mode:'major', pattern:['I7','VI7','II7','V7']},
    {name:'Slow Blues', category:'Blues', mode:'major', pattern:['I7','IV7','I7','V7']},
    {name:'Minor Blues Loop', category:'Blues', mode:'minor', pattern:['i7','iv7','V7','i7']},
    {name:'Blues Shuffle', category:'Blues', mode:'major', pattern:['I7','IV7','I7','V7']},

    // Jazz
    {name:'Major ii-V-I', category:'Jazz', mode:'major', pattern:['ii7','V7','Imaj7','Imaj7']},
    {name:'Minor ii-V-i', category:'Jazz', mode:'minor', pattern:['iiø7','V7','i7','i7']},
    {name:'Jazz Turnaround', category:'Jazz', mode:'major', pattern:['Imaj7','vi7','ii7','V7']},
    {name:'Rhythm Changes Turnaround', category:'Jazz', mode:'major', pattern:['Imaj7','VI7','ii7','V7']},
    {name:'iii-VI-ii-V', category:'Jazz', mode:'major', pattern:['iii7','VI7','ii7','V7']},
    {name:'Circle Progression', category:'Jazz', mode:'major', pattern:['Imaj7','IVmaj7','viiø7','iii7','vi7','ii7','V7','Imaj7']},
    {name:'Backdoor Cadence', category:'Jazz', mode:'major', pattern:['iv7','bVII7','Imaj7','Imaj7']},
    {name:'Tritone ii-V', category:'Jazz', mode:'major', pattern:['ii7','bII7','Imaj7','Imaj7']},
    {name:'Jazz Blues Turn', category:'Jazz', mode:'major', pattern:['I7','VI7','ii7','V7']},
    {name:'Major Seventh Cycle', category:'Jazz', mode:'major', pattern:['Imaj7','iii7','IVmaj7','iv7']},
    {name:'Minor Jazz Cycle', category:'Jazz', mode:'minor', pattern:['i7','iv7','VII7','IIImaj7']},
    {name:'Autumn-Style Cycle', category:'Jazz', mode:'major', pattern:['ii7','V7','Imaj7','IVmaj7','viiø7','III7','vi7','vi7']},

    // Soul / R&B
    {name:'Soul Turnaround', category:'Soul / R&B', mode:'major', pattern:['Imaj7','iii7','IVmaj7','iv7']},
    {name:'Neo-Soul Loop', category:'Soul / R&B', mode:'major', pattern:['Imaj7','VI7','ii7','V7']},
    {name:'Smooth R&B', category:'Soul / R&B', mode:'major', pattern:['IVmaj7','V7','iii7','vi7']},
    {name:'R&B Ballad', category:'Soul / R&B', mode:'major', pattern:['Imaj7','V7','vi7','IVmaj7']},
    {name:'Soul Six-Four', category:'Soul / R&B', mode:'major', pattern:['vi7','IVmaj7','Imaj7','V7']},
    {name:'Gospel Lift', category:'Soul / R&B', mode:'major', pattern:['Imaj7','iii7','IVmaj7','V7']},
    {name:'Gospel Turn', category:'Soul / R&B', mode:'major', pattern:['Imaj7','VI7','ii7','V7']},
    {name:'Minor R&B', category:'Soul / R&B', mode:'minor', pattern:['i7','VImaj7','IIImaj7','VII7']},
    {name:'Soul Plagal', category:'Soul / R&B', mode:'major', pattern:['Imaj7','IVmaj7','iv7','Imaj7']},
    {name:'Late-Night R&B', category:'Soul / R&B', mode:'minor', pattern:['i9','iv9','VImaj7','V7']},

    // Classical / Traditional
    {name:'Authentic Cadence', category:'Classical / Traditional', mode:'major', pattern:['I','IV','V','I']},
    {name:'Perfect Cadence', category:'Classical / Traditional', mode:'major', pattern:['I','ii','V','I']},
    {name:'Plagal Cadence', category:'Classical / Traditional', mode:'major', pattern:['I','IV','I','I']},
    {name:'Pachelbel Canon', category:'Classical / Traditional', mode:'major', pattern:['I','V','vi','iii','IV','I','IV','V']},
    {name:'Descending Fifths', category:'Classical / Traditional', mode:'major', pattern:['I','IV','vii°','iii','vi','ii','V','I']},
    {name:'Romanesca', category:'Classical / Traditional', mode:'major', pattern:['I','V','vi','III','IV','I','IV','V']},
    {name:'Passamezzo Moderno', category:'Classical / Traditional', mode:'major', pattern:['I','IV','I','V','I','IV','V','I']},
    {name:'Passamezzo Antico', category:'Classical / Traditional', mode:'minor', pattern:['i','VII','i','V','III','VII','i','V']},
    {name:'La Folia', category:'Classical / Traditional', mode:'minor', pattern:['i','V','i','VII','III','VII','i','V']},
    {name:'Minor Authentic', category:'Classical / Traditional', mode:'minor', pattern:['i','iv','V','i']},

    // Minor / Cinematic
    {name:'Andalusian Cadence', category:'Minor / Cinematic', mode:'minor', pattern:['i','VII','VI','V']},
    {name:'Epic Minor', category:'Minor / Cinematic', mode:'minor', pattern:['i','VI','III','VII']},
    {name:'Dark Descent', category:'Minor / Cinematic', mode:'minor', pattern:['i','VII','VI','v']},
    {name:'Cinematic Rise', category:'Minor / Cinematic', mode:'minor', pattern:['i','III','VII','VI']},
    {name:'Minor Four-Chord', category:'Minor / Cinematic', mode:'minor', pattern:['i','VI','III','VII']},
    {name:'Tense Minor', category:'Minor / Cinematic', mode:'minor', pattern:['i','iv','VI','V']},
    {name:'Dramatic Minor', category:'Minor / Cinematic', mode:'minor', pattern:['i','VI','iv','V']},
    {name:'Minor Lament', category:'Minor / Cinematic', mode:'minor', pattern:['i','VII','VI','V7']},
    {name:'Heroic Minor', category:'Minor / Cinematic', mode:'minor', pattern:['i','III','VI','VII']},
    {name:'Suspense Loop', category:'Minor / Cinematic', mode:'minor', pattern:['i','ii°','V','i']},
    {name:'Minor Plagal', category:'Minor / Cinematic', mode:'minor', pattern:['i','iv','i','V']},
    {name:'Aeolian Cycle', category:'Minor / Cinematic', mode:'minor', pattern:['i','VII','VI','VII']},

    // Indie / Alternative
    {name:'Indie Lift', category:'Indie / Alternative', mode:'major', pattern:['I','iii','IV','vi']},
    {name:'Indie Mixolydian', category:'Indie / Alternative', mode:'major', pattern:['I','bVII','IV','IV']},
    {name:'Dreamy Indie', category:'Indie / Alternative', mode:'major', pattern:['IVmaj7','Imaj7','V','vi7']},
    {name:'Indie Minor', category:'Indie / Alternative', mode:'minor', pattern:['i','III','VI','iv']},
    {name:'Alternative Loop', category:'Indie / Alternative', mode:'major', pattern:['vi','IV','I','iii']},
    {name:'Open-Sky Indie', category:'Indie / Alternative', mode:'major', pattern:['I','IV','ii','IV']},
    {name:'Bittersweet Indie', category:'Indie / Alternative', mode:'major', pattern:['I','iii','vi','IV']},
    {name:'Modal Indie', category:'Indie / Alternative', mode:'major', pattern:['I','bVII','IV','I']},

    // Funk / Disco
    {name:'Funk Vamp', category:'Funk / Disco', mode:'major', pattern:['I7','IV7','I7','IV7']},
    {name:'Minor Funk Vamp', category:'Funk / Disco', mode:'minor', pattern:['i7','iv7','i7','V7']},
    {name:'Disco Loop', category:'Funk / Disco', mode:'major', pattern:['IVmaj7','V7','iii7','vi7']},
    {name:'Funk Two-Chord', category:'Funk / Disco', mode:'major', pattern:['I9','IV9','I9','IV9']},
    {name:'Soul-Funk Turn', category:'Funk / Disco', mode:'major', pattern:['I7','VI7','ii7','V7']},
    {name:'Minor Disco', category:'Funk / Disco', mode:'minor', pattern:['i7','VImaj7','IIImaj7','VII7']},

    // Reggae / Ska
    {name:'Reggae I-IV-V', category:'Reggae / Ska', mode:'major', pattern:['I','IV','V','IV']},
    {name:'Reggae Pop', category:'Reggae / Ska', mode:'major', pattern:['I','V','vi','IV']},
    {name:'Minor Reggae', category:'Reggae / Ska', mode:'minor', pattern:['i','VII','VI','VII']},
    {name:'Ska Turnaround', category:'Reggae / Ska', mode:'major', pattern:['I','vi','ii','V']},
    {name:'Rocksteady', category:'Reggae / Ska', mode:'major', pattern:['I','iii','IV','V']},
    {name:'Reggae Modal', category:'Reggae / Ska', mode:'major', pattern:['I','bVII','IV','I']}
  ];

  const KEY_OPTIONS = {
    major: [
      {label:'C major', tonic:'C', pc:0, prefer:'sharp', scale:['C','D','E','F','G','A','B']}, {label:'D♭ major', tonic:'Db', pc:1, prefer:'flat', scale:['Db','Eb','F','Gb','Ab','Bb','C']},
      {label:'D major', tonic:'D', pc:2, prefer:'sharp', scale:['D','E','F#','G','A','B','C#']}, {label:'E♭ major', tonic:'Eb', pc:3, prefer:'flat', scale:['Eb','F','G','Ab','Bb','C','D']},
      {label:'E major', tonic:'E', pc:4, prefer:'sharp', scale:['E','F#','G#','A','B','C#','D#']}, {label:'F major', tonic:'F', pc:5, prefer:'flat', scale:['F','G','A','Bb','C','D','E']},
      {label:'F♯ major', tonic:'F#', pc:6, prefer:'sharp', scale:['F#','G#','A#','B','C#','D#','E#']}, {label:'G major', tonic:'G', pc:7, prefer:'sharp', scale:['G','A','B','C','D','E','F#']},
      {label:'A♭ major', tonic:'Ab', pc:8, prefer:'flat', scale:['Ab','Bb','C','Db','Eb','F','G']}, {label:'A major', tonic:'A', pc:9, prefer:'sharp', scale:['A','B','C#','D','E','F#','G#']},
      {label:'B♭ major', tonic:'Bb', pc:10, prefer:'flat', scale:['Bb','C','D','Eb','F','G','A']}, {label:'B major', tonic:'B', pc:11, prefer:'sharp', scale:['B','C#','D#','E','F#','G#','A#']}
    ],
    minor: [
      {label:'C minor', tonic:'C', pc:0, prefer:'flat', scale:['C','D','Eb','F','G','Ab','Bb']}, {label:'C♯ minor', tonic:'C#', pc:1, prefer:'sharp', scale:['C#','D#','E','F#','G#','A','B']},
      {label:'D minor', tonic:'D', pc:2, prefer:'flat', scale:['D','E','F','G','A','Bb','C']}, {label:'E♭ minor', tonic:'Eb', pc:3, prefer:'flat', scale:['Eb','F','Gb','Ab','Bb','Cb','Db']},
      {label:'E minor', tonic:'E', pc:4, prefer:'sharp', scale:['E','F#','G','A','B','C','D']}, {label:'F minor', tonic:'F', pc:5, prefer:'flat', scale:['F','G','Ab','Bb','C','Db','Eb']},
      {label:'F♯ minor', tonic:'F#', pc:6, prefer:'sharp', scale:['F#','G#','A','B','C#','D','E']}, {label:'G minor', tonic:'G', pc:7, prefer:'flat', scale:['G','A','Bb','C','D','Eb','F']},
      {label:'G♯ minor', tonic:'G#', pc:8, prefer:'sharp', scale:['G#','A#','B','C#','D#','E','F#']}, {label:'A minor', tonic:'A', pc:9, prefer:'sharp', scale:['A','B','C','D','E','F','G']},
      {label:'B♭ minor', tonic:'Bb', pc:10, prefer:'flat', scale:['Bb','C','Db','Eb','F','Gb','Ab']}, {label:'B minor', tonic:'B', pc:11, prefer:'sharp', scale:['B','C#','D','E','F#','G','A']}
    ]
  };

  const NOTE_NAMES = {
    sharp:['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'],
    flat:['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']
  };

  const SCALE_OFFSETS = {
    major:[0,2,4,5,7,9,11],
    minor:[0,2,3,5,7,8,10]
  };

  const CHORD_INTERVALS = {
    major:[0,4,7], minor:[0,3,7], dim:[0,3,6], aug:[0,4,8],
    '7':[0,4,7,10], maj7:[0,4,7,11], m7:[0,3,7,10], m7b5:[0,3,6,10], dim7:[0,3,6,9],
    sus2:[0,2,7], sus4:[0,5,7], add9:[0,2,4,7], madd9:[0,2,3,7], '6':[0,4,7,9], m6:[0,3,7,9],
    '9':[0,2,4,7,10], m9:[0,2,3,7,10]
  };

  const STRING_PCS = [4,9,2,7,11,4]; // E A D G B e
  const STRING_LABELS = ['E','A','D','G','B','e'];

  // Familiar low-position shapes. -1=mute, 0=open.
  const OPEN_SHAPES = {
    'C':[-1,3,2,0,1,0], 'Cm':[-1,3,5,5,4,3], 'C7':[-1,3,2,3,1,0], 'Cmaj7':[-1,3,2,0,0,0], 'Cm7':[-1,3,5,3,4,3], 'Csus2':[-1,3,0,0,1,3], 'Csus4':[-1,3,3,0,1,1], 'Cadd9':[-1,3,2,0,3,0],
    'D':[-1,-1,0,2,3,2], 'Dm':[-1,-1,0,2,3,1], 'D7':[-1,-1,0,2,1,2], 'Dmaj7':[-1,-1,0,2,2,2], 'Dm7':[-1,-1,0,2,1,1], 'Dsus2':[-1,-1,0,2,3,0], 'Dsus4':[-1,-1,0,2,3,3], 'Dadd9':[-1,-1,0,2,3,0],
    'E':[0,2,2,1,0,0], 'Em':[0,2,2,0,0,0], 'E7':[0,2,0,1,0,0], 'Emaj7':[0,2,1,1,0,0], 'Em7':[0,2,0,0,0,0], 'Esus2':[0,2,4,4,0,0], 'Esus4':[0,2,2,2,0,0], 'Eadd9':[0,2,4,1,0,0],
    'F':[1,3,3,2,1,1], 'Fm':[1,3,3,1,1,1], 'F7':[1,3,1,2,1,1], 'Fmaj7':[-1,-1,3,2,1,0], 'Fm7':[1,3,1,1,1,1],
    'G':[3,2,0,0,0,3], 'Gm':[3,5,5,3,3,3], 'G7':[3,2,0,0,0,1], 'Gmaj7':[3,2,0,0,0,2], 'Gm7':[3,5,3,3,3,3], 'Gsus2':[3,0,0,0,3,3], 'Gsus4':[3,3,0,0,1,3], 'Gadd9':[3,2,0,2,0,3],
    'A':[-1,0,2,2,2,0], 'Am':[-1,0,2,2,1,0], 'A7':[-1,0,2,0,2,0], 'Amaj7':[-1,0,2,1,2,0], 'Am7':[-1,0,2,0,1,0], 'Asus2':[-1,0,2,2,0,0], 'Asus4':[-1,0,2,2,3,0], 'Aadd9':[-1,0,2,4,2,0],
    'B':[-1,2,4,4,4,2], 'Bm':[-1,2,4,4,3,2], 'B7':[-1,2,1,2,0,2], 'Bmaj7':[-1,2,4,3,4,2], 'Bm7':[-1,2,4,2,3,2], 'Bsus2':[-1,2,4,4,2,2], 'Bsus4':[-1,2,4,4,5,2]
  };

  const state = {
    category:'All styles', progressionIndex:0, currentMode:'major', keyIndex:0, difficulty:'easy', view:'diagram',
    voicingIndex:{}, bpm:92, custom:null, playing:false, playTimers:[], audioCtx:null, masterGain:null, currentPlayIndex:-1
  };

  const el = id => document.getElementById(id);
  const progressionSelect = el('progressionSelect');
  const categorySelect = el('categorySelect');
  const keySelect = el('keySelect');
  const chordGrid = el('chordGrid');
  const sequenceStrip = el('sequenceStrip');

  function cleanRoman(s) {
    return s.replace(/ø/g,'m7b5').replace(/°/g,'dim');
  }

  function parseRoman(token) {
    const raw = token.trim().replace(/–|—/g,'-');
    if (!raw) return null;
    const normalized = raw.replace(/♭/g,'b').replace(/♯/g,'#').replace('ø7','m7b5').replace('ø','m7b5').replace('°7','dim7').replace('°','dim');
    const m = normalized.match(/^([b#]*)([ivIV]+)(.*)$/);
    if (!m) return null;
    const accidentalText = m[1];
    const numeral = m[2];
    let suffix = m[3] || '';
    const romanUpper = numeral.toUpperCase();
    const degreeMap = {I:0,II:1,III:2,IV:3,V:4,VI:5,VII:6};
    if (!(romanUpper in degreeMap)) return null;
    let accidental = 0;
    for (const c of accidentalText) accidental += c === '#' ? 1 : -1;

    const isLower = numeral === numeral.toLowerCase();
    let quality;
    suffix = suffix.replace(/♭/g,'b').replace(/♯/g,'#');
    if (suffix === '') quality = isLower ? 'minor' : 'major';
    else if (suffix === '7') quality = isLower ? 'm7' : '7';
    else if (suffix === 'maj7' || suffix === 'M7' || suffix === 'Δ7') quality = 'maj7';
    else if (suffix === 'm' || suffix === 'min') quality = 'minor';
    else if (suffix === 'm7' || suffix === 'min7') quality = 'm7';
    else if (suffix === 'm7b5' || suffix === 'min7b5') quality = 'm7b5';
    else if (suffix === 'dim' || suffix === 'o') quality = 'dim';
    else if (suffix === 'dim7' || suffix === 'o7') quality = 'dim7';
    else if (suffix === 'aug' || suffix === '+') quality = 'aug';
    else if (suffix === '6') quality = isLower ? 'm6' : '6';
    else if (suffix === '9') quality = isLower ? 'm9' : '9';
    else if (suffix === 'add9') quality = isLower ? 'madd9' : 'add9';
    else if (['sus2','sus4','m6','m9'].includes(suffix)) quality = suffix;
    else return null;
    return {raw, degree:degreeMap[romanUpper], accidental, quality, isLower};
  }

  function qualitySuffix(q) {
    const suffixes = {major:'',minor:'m',dim:'dim',aug:'aug','7':'7',maj7:'maj7',m7:'m7',m7b5:'m7♭5',dim7:'dim7',sus2:'sus2',sus4:'sus4',add9:'add9',madd9:'m(add9)','6':'6',m6:'m6','9':'9',m9:'m9'};
    return Object.prototype.hasOwnProperty.call(suffixes, q) ? suffixes[q] : q;
  }

  function pcName(pc, prefer='sharp') {
    return NOTE_NAMES[prefer][((pc%12)+12)%12];
  }

  function keyData() {
    return KEY_OPTIONS[state.currentMode][state.keyIndex] || KEY_OPTIONS[state.currentMode][0];
  }

  function spelledShift(note, semitones) {
    if (!semitones) return note;
    const letter = note[0];
    const acc = note.slice(1);
    let count = 0;
    for (const c of acc) count += c === '#' ? 1 : c === 'b' ? -1 : 0;
    count += semitones;
    return letter + (count > 0 ? '#'.repeat(count) : count < 0 ? 'b'.repeat(-count) : '');
  }

  function chordFromRoman(token) {
    const parsed = parseRoman(token);
    if (!parsed) return null;
    const key = keyData();
    const scale = SCALE_OFFSETS[state.currentMode];
    const rootPc = (key.pc + scale[parsed.degree] + parsed.accidental + 120) % 12;
    const root = spelledShift(key.scale[parsed.degree], parsed.accidental);
    const name = root + qualitySuffix(parsed.quality);
    return {...parsed, rootPc, root, name, intervals:CHORD_INTERVALS[parsed.quality] || CHORD_INTERVALS.major};
  }

  function progressionData() {
    if (state.custom) return state.custom;
    return PROGRESSIONS[state.progressionIndex] || PROGRESSIONS[0];
  }

  function currentChords() {
    return progressionData().pattern.map(chordFromRoman).filter(Boolean);
  }

  function shapeKeyForOpen(chord) {
    const simpleRoot = pcName(chord.rootPc, 'sharp');
    const altRoot = pcName(chord.rootPc, 'flat');
    const suffix = qualitySuffix(chord.quality).replace('♭','b');
    for (const r of [simpleRoot, altRoot]) {
      const k = r + suffix;
      if (OPEN_SHAPES[k]) return k;
    }
    return null;
  }

  function scoreShape(shape, chord, difficulty) {
    const played = shape.filter(f => f >= 0);
    const fretted = played.filter(f => f > 0);
    const pcs = shape.map((f,i) => f < 0 ? null : (STRING_PCS[i] + f) % 12).filter(v => v !== null);
    const uniquePcs = new Set(pcs);
    const maxF = fretted.length ? Math.max(...fretted) : 0;
    const minF = fretted.length ? Math.min(...fretted) : 0;
    const span = maxF - minF;
    const opens = shape.filter(f => f === 0).length;
    const mutes = shape.filter(f => f < 0).length;
    const rootBass = pcs.length && pcs[0] === chord.rootPc;
    let s = 0;
    s += uniquePcs.size * 35;
    s += played.length * 4;
    s += opens * (difficulty === 'easy' ? 14 : 4);
    s -= span * 9;
    s -= maxF * (difficulty === 'easy' ? 2.6 : .7);
    s -= mutes * 2;
    if (rootBass) s += 18;
    if (difficulty === 'easy' && maxF > 5) s -= 80;
    if (maxF > 12) s -= 100;
    return s;
  }

  function shapeId(shape) { return shape.join(','); }

  function genericVoicings(chord, difficulty='medium', limit=8) {
    const target = new Set(chord.intervals.map(i => (chord.rootPc + i) % 12));
    const requiredUnique = Math.min(3, target.size);
    const maxStart = difficulty === 'easy' ? 4 : 9;
    const shapes = [];

    for (let start=0; start<=maxStart; start++) {
      const end = start + 4;
      const options = STRING_PCS.map((openPc) => {
        const opts = [-1];
        if (target.has(openPc)) opts.push(0);
        for (let f=Math.max(1,start); f<=Math.min(12,end); f++) {
          if (target.has((openPc+f)%12)) opts.push(f);
        }
        return [...new Set(opts)];
      });

      function dfs(i, shape, played, pcs, firstPlayedSeen) {
        if (i === 6) {
          if (played < 3) return;
          const uniq = new Set(pcs);
          if (uniq.size < requiredUnique) return;
          if (!uniq.has(chord.rootPc)) return;
          const fretted = shape.filter(f => f > 0);
          if (fretted.length > 4 && difficulty === 'easy') return;
          const maxF = fretted.length ? Math.max(...fretted) : 0;
          const minF = fretted.length ? Math.min(...fretted) : 0;
          if (maxF - minF > 4) return;
          shapes.push({shape:[...shape], score:scoreShape(shape,chord,difficulty), source:'Generated'});
          return;
        }
        for (const f of options[i]) {
          if (f < 0) {
            // Avoid holes after the first played string except occasional high-string mute.
            if (firstPlayedSeen && i < 5) continue;
            shape.push(f); dfs(i+1,shape,played,pcs,firstPlayedSeen); shape.pop();
          } else {
            shape.push(f);
            dfs(i+1,shape,played+1,[...pcs,(STRING_PCS[i]+f)%12],true);
            shape.pop();
          }
        }
      }
      dfs(0,[],0,[],false);
    }

    const dedup = new Map();
    for (const obj of shapes) {
      const id = shapeId(obj.shape);
      if (!dedup.has(id) || dedup.get(id).score < obj.score) dedup.set(id,obj);
    }
    return [...dedup.values()].sort((a,b)=>b.score-a.score).slice(0,limit);
  }

  function barreVoicings(chord) {
    const rE = (chord.rootPc - 4 + 12) % 12;
    const rA = (chord.rootPc - 9 + 12) % 12;
    const q = chord.quality;
    const out = [];
    const add = (shape,label) => {
      if (Math.max(...shape.filter(x=>x>=0)) <= 12) out.push({shape,label,source:'Movable'});
    };
    if (q === 'major') {
      add([rE,rE+2,rE+2,rE+1,rE,rE], 'E-shape barre');
      add([-1,rA,rA+2,rA+2,rA+2,rA], 'A-shape barre');
    } else if (q === 'minor') {
      add([rE,rE+2,rE+2,rE,rE,rE], 'Em-shape barre');
      add([-1,rA,rA+2,rA+2,rA+1,rA], 'Am-shape barre');
    } else if (q === '7') {
      add([rE,rE+2,rE,rE+1,rE,rE], 'E7-shape barre');
      add([-1,rA,rA+2,rA,rA+2,rA], 'A7-shape barre');
    } else if (q === 'maj7') {
      add([rE,rE+2,rE+1,rE+1,rE,rE], 'Emaj7-shape');
      add([-1,rA,rA+2,rA+1,rA+2,rA], 'Amaj7-shape');
    } else if (q === 'm7') {
      add([rE,rE+2,rE,rE,rE,rE], 'Em7-shape barre');
      add([-1,rA,rA+2,rA,rA+1,rA], 'Am7-shape barre');
    } else if (q === 'sus4') {
      add([rE,rE+2,rE+2,rE+2,rE,rE], 'Esus4-shape');
    }
    return out.filter(v => v.shape.every(f => f <= 12));
  }

  function getVoicings(chord) {
    const candidates = [];
    const openKey = shapeKeyForOpen(chord);
    if (openKey) candidates.push({shape:[...OPEN_SHAPES[openKey]], label:'Open / familiar', source:'Open'});
    if (state.difficulty === 'medium') candidates.push(...barreVoicings(chord));
    candidates.push(...genericVoicings(chord,state.difficulty,10));

    const dedup = new Map();
    for (const c of candidates) {
      const id = shapeId(c.shape);
      if (!dedup.has(id)) dedup.set(id,c);
    }
    const vals = [...dedup.values()];
    vals.forEach(v => {
      if (!v.label) {
        const frets = v.shape.filter(f=>f>0);
        const max = frets.length ? Math.max(...frets) : 0;
        const min = frets.length ? Math.min(...frets) : 0;
        v.label = max <= 4 ? 'Low-position voicing' : `Neck voicing · fret ${min}`;
      }
      v.score = scoreShape(v.shape,chord,state.difficulty) + (v.source === 'Open' ? 80 : v.source === 'Movable' ? 25 : 0);
    });
    vals.sort((a,b)=>b.score-a.score);
    return vals.slice(0, state.difficulty === 'easy' ? 4 : 6);
  }

  function noteNamesForChord(chord) {
    const key = keyData();
    return chord.intervals.map((i,idx)=>({name:pcName((chord.rootPc+i)%12,key.prefer), root:idx===0}));
  }

  function formatFretCode(shape) { const parts=shape.map(f=>f<0?'x':String(f)); return shape.some(f=>f>=10) ? parts.join(' ') : parts.join(''); }

  function tabForShape(shape) {
    const lines = [];
    for (let i=5;i>=0;i--) {
      const v = shape[i] < 0 ? 'x' : shape[i];
      const pad = String(v).padStart(2,'-');
      lines.push(`${STRING_LABELS[i]}|--${pad}--|`);
    }
    return lines.join('\n');
  }

  function diagramSVG(shape, chordName) {
    const fretted = shape.filter(f=>f>0);
    let base = fretted.length ? Math.min(...fretted) : 1;
    if (base <= 1) base = 1;
    const max = fretted.length ? Math.max(...fretted) : 1;
    if (max - base > 4) base = Math.max(1,max-4);
    const W=145,H=165, x0=25,y0=28, sw=18, fh=24;
    const parts = [`<svg class="chord-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${chordName} guitar chord diagram">`];
    parts.push(`<text x="${W/2}" y="14" text-anchor="middle" font-size="10" font-weight="700" fill="#667085">${base>1 ? base+'fr' : ''}</text>`);
    for (let s=0;s<6;s++) {
      const x=x0+s*sw;
      parts.push(`<line x1="${x}" y1="${y0}" x2="${x}" y2="${y0+5*fh}" stroke="#718096" stroke-width="1.15"/>`);
    }
    for (let f=0;f<=5;f++) {
      const y=y0+f*fh;
      parts.push(`<line x1="${x0}" y1="${y}" x2="${x0+5*sw}" y2="${y}" stroke="#718096" stroke-width="${f===0&&base===1?3:1.15}"/>`);
    }
    shape.forEach((f,s)=>{
      const x=x0+s*sw;
      if (f<0) parts.push(`<text x="${x}" y="22" text-anchor="middle" font-size="11" font-weight="800" fill="#8a94a5">×</text>`);
      else if (f===0) parts.push(`<circle cx="${x}" cy="19" r="4" fill="none" stroke="#506078" stroke-width="1.4"/>`);
      else {
        const row=f-base;
        if (row>=0 && row<5) parts.push(`<circle cx="${x}" cy="${y0+(row+.5)*fh}" r="7" fill="#2763d8"/>`);
      }
    });
    parts.push('</svg>');
    return parts.join('');
  }

  function populateCategories() {
    const cats = ['All styles', ...new Set(PROGRESSIONS.map(p=>p.category))];
    categorySelect.innerHTML = cats.map(c=>`<option value="${c}">${c}</option>`).join('');
  }

  function populateProgressions(keepName=null) {
    const filtered = PROGRESSIONS.map((p,i)=>({...p,_index:i})).filter(p=>state.category==='All styles'||p.category===state.category);
    progressionSelect.innerHTML = filtered.map(p=>`<option value="${p._index}">${p.name} · ${p.pattern.join(' – ')}</option>`).join('');
    let target = keepName ? filtered.find(p=>p.name===keepName) : filtered.find(p=>p._index===state.progressionIndex);
    if (!target) target = filtered[0];
    if (target) {
      state.progressionIndex = target._index;
      progressionSelect.value=String(target._index);
      if (!state.custom) setMode(target.mode, false);
    }
    el('libraryCount').textContent = `${filtered.length} shown · ${PROGRESSIONS.length} built in`;
    el('footerCount').textContent = PROGRESSIONS.length;
  }

  function populateKeys() {
    keySelect.innerHTML = KEY_OPTIONS[state.currentMode].map((k,i)=>`<option value="${i}">${k.label}</option>`).join('');
    keySelect.value = String(state.keyIndex);
  }

  function setMode(mode, preservePc=true) {
    const oldKey = KEY_OPTIONS[state.currentMode]?.[state.keyIndex];
    state.currentMode = mode;
    let idx = 0;
    if (preservePc && oldKey) {
      const found = KEY_OPTIONS[mode].findIndex(k=>k.pc===oldKey.pc);
      idx = found >= 0 ? found : 0;
    } else {
      idx = mode === 'minor' ? 9 : 0; // Am / C
    }
    state.keyIndex=idx;
    populateKeys();
  }

  function render() {
    const p = progressionData();
    const chords = currentChords();
    const key = keyData();
    el('resultMeta').textContent = `${p.category || 'Custom'} · ${key.label} · ${state.difficulty === 'easy' ? 'Easy shapes' : 'Medium shapes'}`;
    el('resultTitle').textContent = p.name;
    el('romanLine').textContent = p.pattern.join('  –  ');
    sequenceStrip.innerHTML = chords.map((c,i)=>`<div class="sequence-pill" data-seq="${i}"><span class="roman">${p.pattern[i]}</span><span class="chord">${c.name}</span></div>`).join('');

    chordGrid.innerHTML = chords.map((c,i)=>renderChordCard(c,i,p.pattern[i])).join('');
    chordGrid.querySelectorAll('[data-prev]').forEach(btn=>btn.addEventListener('click',()=>changeVoicing(Number(btn.dataset.prev),-1)));
    chordGrid.querySelectorAll('[data-next]').forEach(btn=>btn.addEventListener('click',()=>changeVoicing(Number(btn.dataset.next),1)));
    updateSequenceHighlight();
    saveSettings();
  }

  function renderChordCard(chord,index,roman) {
    const vs = getVoicings(chord);
    const key = `${index}:${chord.name}:${state.difficulty}`;
    const vi = Math.min(state.voicingIndex[key] || 0, Math.max(0,vs.length-1));
    state.voicingIndex[key]=vi;
    const v = vs[vi] || {shape:[-1,-1,-1,-1,-1,-1],label:'No voicing'};
    let visual='';
    if (state.view==='diagram') visual = diagramSVG(v.shape,chord.name);
    else if (state.view==='fingering') visual = `<div><div class="fret-code">${formatFretCode(v.shape)}</div><div class="fret-code-caption">Low E → high e · x = muted</div></div>`;
    else if (state.view==='notes') visual = `<div class="notes-view">${noteNamesForChord(chord).map(n=>`<span class="note-chip ${n.root?'root':''}">${n.name}</span>`).join('')}</div>`;
    else visual = `<pre class="tab-view">${tabForShape(v.shape)}</pre>`;
    const textClass = state.view==='diagram' ? '' : ' text-view';
    const fretNums = v.shape.filter(f=>f>0);
    const pos = fretNums.length ? Math.min(...fretNums) : 0;
    return `<article class="chord-card">
      <div class="chord-card-head">
        <div><span class="roman-tag">${roman}</span><div class="chord-name">${chord.name}</div></div>
        <div><div class="voicing-nav"><button data-prev="${index}" aria-label="Previous ${chord.name} voicing">‹</button><button data-next="${index}" aria-label="Next ${chord.name} voicing">›</button></div><div class="voicing-label">${vi+1} / ${vs.length}</div></div>
      </div>
      <div class="chord-visual${textClass}">${visual}</div>
      <div class="voicing-foot"><span><strong>${v.label}</strong></span><span>${pos===0?'open position':`starts fret ${pos}`}</span></div>
    </article>`;
  }

  function changeVoicing(index,delta) {
    const chords=currentChords();
    const chord=chords[index]; if(!chord) return;
    const vs=getVoicings(chord);
    const key=`${index}:${chord.name}:${state.difficulty}`;
    const cur=state.voicingIndex[key]||0;
    state.voicingIndex[key]=(cur+delta+vs.length)%vs.length;
    render();
  }

  function setView(view) {
    state.view=view;
    document.querySelectorAll('#viewToggle button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
    render();
  }

  function setDifficulty(diff) {
    state.difficulty=diff;
    state.voicingIndex={};
    document.querySelectorAll('#difficultyToggle button').forEach(b=>b.classList.toggle('active',b.dataset.difficulty===diff));
    render();
  }

  function parseCustomInput(value) {
    const tokens = value.split(/\s*(?:-|–|—|,|\|)\s*/).map(x=>x.trim()).filter(Boolean);
    if (tokens.length < 2) return {error:'Enter at least two Roman-numeral chords.'};
    const parsed=tokens.map(parseRoman);
    const bad=tokens.filter((_,i)=>!parsed[i]);
    if (bad.length) return {error:`I couldn't read: ${bad.join(', ')}`};
    return {tokens};
  }

  function previewCustom() {
    const box=el('customPreview');
    const result=parseCustomInput(el('customInput').value);
    if(result.error){box.textContent=result.error; box.classList.add('error'); return false;}
    const oldMode=state.currentMode, oldKeyIndex=state.keyIndex;
    const customMode=document.querySelector('#customModeToggle button.active').dataset.mode;
    state.currentMode=customMode;
    const oldPc=KEY_OPTIONS[oldMode][oldKeyIndex]?.pc ?? 0;
    const found=KEY_OPTIONS[customMode].findIndex(k=>k.pc===oldPc);
    state.keyIndex=found>=0?found:0;
    const names=result.tokens.map(chordFromRoman).map(c=>c?.name||'?');
    state.currentMode=oldMode; state.keyIndex=oldKeyIndex;
    box.innerHTML=`<strong>Preview:</strong> ${result.tokens.join(' – ')}<br>${names.join(' – ')}`;
    box.classList.remove('error');
    return true;
  }

  function applyCustom() {
    const result=parseCustomInput(el('customInput').value);
    if(result.error){previewCustom();return;}
    const mode=document.querySelector('#customModeToggle button.active').dataset.mode;
    state.custom={name:'Custom Progression',category:'Custom',mode,pattern:result.tokens};
    setMode(mode,true);
    let customOption=progressionSelect.querySelector('option[value="custom"]');
    if(!customOption){customOption=document.createElement('option');customOption.value='custom';progressionSelect.prepend(customOption);}
    customOption.textContent=`Custom · ${result.tokens.join(' – ')}`;
    progressionSelect.value='custom';
    el('customDialog').close();
    render();
  }

  function clearCustom() {
    state.custom=null;
    const opt=progressionSelect.querySelector('option[value="custom"]');
    if(opt) opt.remove();
  }

  // Web Audio playback
  function ensureAudio() {
    if (!state.audioCtx) state.audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    if (state.audioCtx.state==='suspended') state.audioCtx.resume();
    if (!state.masterGain) {
      state.masterGain=state.audioCtx.createGain();
      state.masterGain.gain.value=1;
      state.masterGain.connect(state.audioCtx.destination);
    }
    return state.audioCtx;
  }

  function resetMasterGain() {
    if (!state.audioCtx || !state.masterGain) return;
    const now=state.audioCtx.currentTime;
    try { state.masterGain.gain.cancelScheduledValues(now); state.masterGain.gain.setValueAtTime(0,now); } catch(e) {}
    try { state.masterGain.disconnect(); } catch(e) {}
    state.masterGain=null;
  }

  function midiForString(stringIndex,fret) {
    const openMidi=[40,45,50,55,59,64][stringIndex];
    return openMidi+fret;
  }
  function midiToHz(m){return 440*Math.pow(2,(m-69)/12);}

  function pluckChord(chord,index,when,duration) {
    const ctx=ensureAudio();
    const vs=getVoicings(chord);
    const key=`${index}:${chord.name}:${state.difficulty}`;
    const v=vs[Math.min(state.voicingIndex[key]||0,vs.length-1)]||vs[0];
    if(!v)return;
    v.shape.forEach((f,s)=>{
      if(f<0)return;
      const t=when+s*.035;
      const osc=ctx.createOscillator();
      const gain=ctx.createGain();
      const filter=ctx.createBiquadFilter();
      const hz=midiToHz(midiForString(s,f));
      osc.type='triangle'; osc.frequency.setValueAtTime(hz,t);
      filter.type='lowpass'; filter.frequency.setValueAtTime(Math.min(2600,hz*5),t); filter.Q.value=.6;
      gain.gain.setValueAtTime(.0001,t);
      gain.gain.exponentialRampToValueAtTime(.065,t+.008);
      gain.gain.exponentialRampToValueAtTime(.0001,t+Math.min(duration*.88,1.6));
      osc.connect(filter).connect(gain).connect(state.masterGain);
      osc.start(t); osc.stop(t+Math.min(duration,1.8));
    });
  }

  function updateSequenceHighlight() {
    document.querySelectorAll('.sequence-pill').forEach((n,i)=>n.classList.toggle('playing',state.playing&&i===state.currentPlayIndex));
  }

  function stopPlayback() {
    state.playTimers.forEach(clearTimeout); state.playTimers=[];
    if (state.playing) resetMasterGain();
    state.playing=false; state.currentPlayIndex=-1;
    el('playLabel').textContent='Play progression';
    el('stopBtn').classList.add('hidden');
    updateSequenceHighlight();
  }

  function playProgression() {
    stopPlayback();
    const chords=currentChords(); if(!chords.length)return;
    const ctx=ensureAudio();
    const beat=60/state.bpm;
    const chordDuration=beat*2;
    const now=ctx.currentTime+.06;
    state.playing=true;
    el('playLabel').textContent='Playing…';
    el('stopBtn').classList.remove('hidden');
    chords.forEach((chord,i)=>{
      const when=now+i*chordDuration;
      pluckChord(chord,i,when,chordDuration);
      state.playTimers.push(setTimeout(()=>{state.currentPlayIndex=i; updateSequenceHighlight();}, Math.max(0,(when-ctx.currentTime)*1000)));
    });
    state.playTimers.push(setTimeout(stopPlayback,(chords.length*chordDuration+.2)*1000));
  }

  // Minimal local PDF writer: text + vector chord diagrams, no external library.
  function pdfEscape(s) { return String(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[♭]/g,'b').replace(/[♯]/g,'#').replace(/[–—]/g,'-').replace(/[°]/g,'dim'); }
  function pdfText(x,y,size,text,font='F1') { return `BT /${font} ${size} Tf ${x.toFixed(1)} ${y.toFixed(1)} Td (${pdfEscape(text)}) Tj ET\n`; }
  function pdfLine(x1,y1,x2,y2,w=.7){return `${w} w ${x1} ${y1} m ${x2} ${y2} l S\n`;}
  function pdfCircle(cx,cy,r,fill=true){
    const k=.5522848, c=r*k;
    return `${cx+r} ${cy} m ${cx+r} ${cy+c} ${cx+c} ${cy+r} ${cx} ${cy+r} c ${cx-c} ${cy+r} ${cx-r} ${cy+c} ${cx-r} ${cy} c ${cx-r} ${cy-c} ${cx-c} ${cy-r} ${cx} ${cy-r} c ${cx+c} ${cy-r} ${cx+r} ${cy-c} ${cx+r} ${cy} c ${fill?'f':'S'}\n`;
  }
  function pdfDiagram(x,y,shape,label,roman) {
    let out=pdfText(x+34,y+112,12,label,'F2')+pdfText(x+36,y+98,8,roman,'F1');
    const fretted=shape.filter(f=>f>0); let base=fretted.length?Math.min(...fretted):1; if(base<=1)base=1;
    const sx=x+14, sy=y+18, sw=12, fh=13;
    if(base>1) out+=pdfText(sx-16,sy+68,7,`${base}fr`);
    for(let s=0;s<6;s++) out+=pdfLine(sx+s*sw,sy,sx+s*sw,sy+5*fh,.55);
    for(let f=0;f<=5;f++) out+=pdfLine(sx,sy+f*fh,sx+5*sw,sy+f*fh,(f===5&&base===1)?1.8:.55);
    shape.forEach((f,s)=>{
      const px=sx+s*sw;
      if(f<0) out+=pdfText(px-2.6,sy+71,7,'x');
      else if(f===0) out+=pdfCircle(px,sy+72,2.3,false);
      else {const row=f-base;if(row>=0&&row<5) out+=pdfCircle(px,sy+(4.5-row)*fh,3.3,true);}
    });
    return out;
  }

  function pdfVerticalTab(centerX, topY, shape) {
    const labels=['E','B','G','D','A','E'];
    const values=[shape?.[5],shape?.[4],shape?.[3],shape?.[2],shape?.[1],shape?.[0]].map(v=>v==null||v<0?'X':String(v));
    const lines=labels.map((label,i)=>`${label}|${values[i]}`);
    const size=7.1, step=8.5, charW=4.25;
    const width=Math.max(...lines.map(line=>line.length))*charW;
    const startX=centerX-width/2;
    let out='';
    lines.forEach((line,i)=>{ out+=pdfText(startX, topY-i*step, size, line, 'F3'); });
    return out;
  }

  function makePdf() {
    const p=progressionData(), chords=currentChords(), key=keyData();
    const pageW=612,pageH=792, margin=42;
    const pages=[];
    const perPage=8;
    for(let start=0;start<chords.length;start+=perPage){
      let c='';
      c+='0.08 0.12 0.20 rg\n';
      c+=pdfText(margin,pageH-55,22,'Progression Guitar','F2');
      c+='0.15 0.39 0.85 rg\n'+pdfText(margin,pageH-77,10,`${p.name}  |  ${key.label}`,'F2');
      c+='0.18 0.23 0.32 rg\n'+pdfText(margin,pageH-95,9,p.pattern.join('  -  '));
      c+='0.38 0.42 0.50 rg\n'+pdfText(margin,pageH-112,8,`Difficulty: ${state.difficulty==='easy'?'Easy':'Medium'}  |  Recommended voicings`);
      const sub=chords.slice(start,start+perPage);
      sub.forEach((ch,i)=>{
        const global=start+i, col=i%4,row=Math.floor(i/4);
        const x=margin+col*132, y=pageH-285-row*170;
        const vs=getVoicings(ch); const k=`${global}:${ch.name}:${state.difficulty}`;
        const v=vs[Math.min(state.voicingIndex[k]||0,vs.length-1)]||vs[0];
        c+='0.1 0.13 0.18 RG 0.1 0.13 0.18 rg\n';
        c+=pdfDiagram(x,y,v?.shape||[-1,-1,-1,-1,-1,-1],ch.name,p.pattern[global]);
        c+='0.38 0.42 0.50 rg\n'+pdfVerticalTab(x+44,y+5,v?.shape||[-1,-1,-1,-1,-1,-1]);
      });
      c+='0.46 0.50 0.58 rg\n'+pdfText(margin,28,7,'Generated locally by Progression Guitar');
      pages.push(c);
    }

    const objects=[];
    const add=o=>{objects.push(o);return objects.length;};
    const font1=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    const font2=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
    const font3=add('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>');
    const pagesObjPlaceholder=add('');
    const pageIds=[];
    pages.forEach(content=>{
      const stream=add(`<< /Length ${new TextEncoder().encode(content).length} >>\nstream\n${content}endstream`);
      const page=add(`<< /Type /Page /Parent ${pagesObjPlaceholder} 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /Font << /F1 ${font1} 0 R /F2 ${font2} 0 R /F3 ${font3} 0 R >> >> /Contents ${stream} 0 R >>`);
      pageIds.push(page);
    });
    objects[pagesObjPlaceholder-1]=`<< /Type /Pages /Kids [${pageIds.map(id=>`${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
    const catalog=add(`<< /Type /Catalog /Pages ${pagesObjPlaceholder} 0 R >>`);
    let pdf='%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const offsets=[0];
    for(let i=0;i<objects.length;i++){offsets.push(new TextEncoder().encode(pdf).length);pdf+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`;}
    const xref=new TextEncoder().encode(pdf).length;
    pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
    for(let i=1;i<offsets.length;i++) pdf+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;
    pdf+=`trailer\n<< /Size ${objects.length+1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;
    const blob=new Blob([new TextEncoder().encode(pdf)],{type:'application/pdf'});
    const a=document.createElement('a');
    const fname=`${p.name}-${key.label}`.replace(/♯/g,'-sharp').replace(/♭/g,'-flat').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()+'.pdf';
    a.href=URL.createObjectURL(blob); a.download=fname; document.body.appendChild(a); a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1000);
  }

  function saveSettings(){
    try{localStorage.setItem('progression-guitar-settings',JSON.stringify({category:state.category,progressionIndex:state.progressionIndex,currentMode:state.currentMode,keyIndex:state.keyIndex,difficulty:state.difficulty,view:state.view,bpm:state.bpm}));}catch(e){}
  }
  function loadSettings(){
    try{const x=JSON.parse(localStorage.getItem('progression-guitar-settings')||'{}');Object.assign(state,x);state.custom=null;state.voicingIndex={};}catch(e){}
  }

  function initEvents(){
    categorySelect.addEventListener('change',()=>{state.category=categorySelect.value;clearCustom();populateProgressions();render();});
    progressionSelect.addEventListener('change',()=>{if(progressionSelect.value==='custom'){render();return;} clearCustom();state.progressionIndex=Number(progressionSelect.value);const p=PROGRESSIONS[state.progressionIndex];if(p)setMode(p.mode,true);render();});
    keySelect.addEventListener('change',()=>{state.keyIndex=Number(keySelect.value);render();});
    document.querySelectorAll('#difficultyToggle button').forEach(b=>b.addEventListener('click',()=>setDifficulty(b.dataset.difficulty)));
    document.querySelectorAll('#viewToggle button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
    el('bpmRange').addEventListener('input',e=>{state.bpm=Number(e.target.value);el('bpmValue').textContent=state.bpm;saveSettings();});
    el('playBtn').addEventListener('click',()=>state.playing?stopPlayback():playProgression());
    el('stopBtn').addEventListener('click',stopPlayback);
    el('pdfBtn').addEventListener('click',makePdf);

    el('customBtn').addEventListener('click',()=>{el('customDialog').showModal();previewCustom();setTimeout(()=>el('customInput').focus(),50);});
    el('customInput').addEventListener('input',previewCustom);
    document.querySelectorAll('#customModeToggle button').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('#customModeToggle button').forEach(x=>x.classList.toggle('active',x===b));previewCustom();}));
    el('applyCustomBtn').addEventListener('click',applyCustom);
    document.querySelectorAll('.close-dialog').forEach(b=>b.addEventListener('click',()=>el('customDialog').close()));

    el('helpBtn').addEventListener('click',()=>el('helpDialog').showModal());
    document.querySelectorAll('.close-help').forEach(b=>b.addEventListener('click',()=>el('helpDialog').close()));
  }

  function init(){
    loadSettings();
    populateCategories();
    categorySelect.value=state.category;
    populateProgressions();
    populateKeys();
    keySelect.value=String(state.keyIndex);
    document.querySelectorAll('#difficultyToggle button').forEach(b=>b.classList.toggle('active',b.dataset.difficulty===state.difficulty));
    document.querySelectorAll('#viewToggle button').forEach(b=>b.classList.toggle('active',b.dataset.view===state.view));
    el('bpmRange').value=state.bpm; el('bpmValue').textContent=state.bpm;
    initEvents(); render();
  }

  init();
})();
