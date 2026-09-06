(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.EmailImageCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const IMAGE_EXTS = new Set(['jpg','jpeg','png','gif','webp','bmp','tif','tiff','ico','svg','avif','heic','heif','jfif']);
    const MIME_TO_EXT = {
        'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/gif': 'gif',
        'image/webp': 'webp', 'image/bmp': 'bmp', 'image/tiff': 'tiff', 'image/x-icon': 'ico',
        'image/vnd.microsoft.icon': 'ico', 'image/svg+xml': 'svg', 'image/avif': 'avif',
        'image/heic': 'heic', 'image/heif': 'heif'
    };

    function cleanName(name, fallback) {
        let s = String(name || '').replace(/[\\/:*?"<>|\x00-\x1F]/g, '_').replace(/\s+/g, ' ').trim();
        s = s.replace(/[. ]+$/g, '');
        if (!s) s = fallback || 'image';
        return s.slice(0, 180);
    }

    function basenameNoExt(name) {
        const safe = cleanName(name || 'Email', 'Email');
        const idx = safe.lastIndexOf('.');
        return idx > 0 ? safe.slice(0, idx) : safe;
    }

    function extOf(name) {
        const m = String(name || '').toLowerCase().match(/\.([a-z0-9]{2,6})$/);
        return m ? m[1] : '';
    }

    function formatBytes(n) {
        const num = Number(n || 0);
        if (num < 1024) return num + ' B';
        if (num < 1024 * 1024) return (num / 1024).toFixed(num < 10240 ? 1 : 0) + ' KB';
        return (num / 1024 / 1024).toFixed(num < 10 * 1024 * 1024 ? 1 : 0) + ' MB';
    }

    function concatBytes(chunks) {
        const total = chunks.reduce((n, c) => n + c.length, 0);
        const out = new Uint8Array(total);
        let p = 0;
        for (const c of chunks) { out.set(c, p); p += c.length; }
        return out;
    }

    function bytesFromBinaryString(s) {
        const out = new Uint8Array(s.length);
        for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
        return out;
    }

    function decodeBase64(str) {
        const s = String(str || '').replace(/\s/g, '');
        if (!s) return new Uint8Array(0);
        if (typeof atob === 'function') {
            const bin = atob(s);
            return bytesFromBinaryString(bin);
        }
        if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(s, 'base64'));
        throw new Error('Base64 decoding is not supported in this browser.');
    }

    function encodeUtf8(s) {
        if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(String(s));
        if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(String(s), 'utf8'));
        const escaped = unescape(encodeURIComponent(String(s)));
        return bytesFromBinaryString(escaped);
    }

    function decodeUtf8(bytes) {
        try { return new TextDecoder('utf-8', { fatal: false }).decode(bytes); } catch (_) {}
        if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('utf8');
        let s = ''; for (const b of bytes) s += String.fromCharCode(b);
        try { return decodeURIComponent(escape(s)); } catch (_) { return s; }
    }

    function decodeLatin1(bytes) {
        let out = '';
        const CHUNK = 0x8000;
        for (let i = 0; i < bytes.length; i += CHUNK) {
            out += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + CHUNK, bytes.length)));
        }
        return out;
    }

    function decodeUtf16LE(bytes) {
        if (!bytes || !bytes.length) return '';
        try { return new TextDecoder('utf-16le').decode(bytes).replace(/\u0000+$/g, ''); } catch (_) {}
        let s = '';
        for (let i = 0; i + 1 < bytes.length; i += 2) {
            const c = bytes[i] | (bytes[i + 1] << 8);
            if (!c) break;
            s += String.fromCharCode(c);
        }
        return s;
    }

    function percentDecodeBytes(s) {
        const out = [];
        for (let i = 0; i < s.length; i++) {
            if (s[i] === '%' && /^[0-9A-Fa-f]{2}$/.test(s.slice(i + 1, i + 3))) {
                out.push(parseInt(s.slice(i + 1, i + 3), 16)); i += 2;
            } else out.push(s.charCodeAt(i) & 0xff);
        }
        return new Uint8Array(out);
    }

    function decodeQuotedPrintableToBytes(str) {
        const s = String(str || '').replace(/=\r?\n/g, '');
        const out = [];
        for (let i = 0; i < s.length; i++) {
            if (s[i] === '=' && /^[0-9A-Fa-f]{2}$/.test(s.slice(i + 1, i + 3))) {
                out.push(parseInt(s.slice(i + 1, i + 3), 16)); i += 2;
            } else out.push(s.charCodeAt(i) & 0xff);
        }
        return new Uint8Array(out);
    }

    function decodeMimeWords(value) {
        if (!value) return '';
        return String(value).replace(/=\?([^?]+)\?([bBqQ])\?([^?]*)\?=/g, function (_, charset, enc, data) {
            try {
                let bytes;
                if (enc.toUpperCase() === 'B') bytes = decodeBase64(data);
                else bytes = decodeQuotedPrintableToBytes(data.replace(/_/g, ' '));
                const cs = String(charset).toLowerCase();
                if (typeof TextDecoder !== 'undefined') {
                    try { return new TextDecoder(cs).decode(bytes); } catch (_) {}
                }
                return cs.includes('utf') ? decodeUtf8(bytes) : decodeLatin1(bytes);
            } catch (_) { return _; }
        }).replace(/\?=\s+=\?/g, '?==?');
    }

    function parseHeaders(raw) {
        const lines = String(raw || '').replace(/\r\n/g, '\n').split('\n');
        const unfolded = [];
        for (const line of lines) {
            if (/^[ \t]/.test(line) && unfolded.length) unfolded[unfolded.length - 1] += ' ' + line.trim();
            else unfolded.push(line);
        }
        const map = {};
        for (const line of unfolded) {
            const i = line.indexOf(':');
            if (i <= 0) continue;
            const key = line.slice(0, i).trim().toLowerCase();
            const val = line.slice(i + 1).trim();
            if (!map[key]) map[key] = val; else map[key] += ', ' + val;
        }
        return map;
    }

    function parseHeaderWithParams(value) {
        const raw = String(value || '');
        const parts = raw.split(';');
        const main = (parts.shift() || '').trim().toLowerCase();
        const params = {};
        for (const p of parts) {
            const i = p.indexOf('=');
            if (i < 0) continue;
            let k = p.slice(0, i).trim().toLowerCase();
            let v = p.slice(i + 1).trim();
            if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
            params[k] = v.replace(/\\([\\"])/g, '$1');
        }
        // RFC 2231 continuations and encoded parameters.
        for (const base of ['filename', 'name']) {
            const segs = [];
            for (let n = 0; n < 20; n++) {
                const k1 = base + '*' + n + '*', k2 = base + '*' + n;
                if (Object.prototype.hasOwnProperty.call(params, k1)) segs.push(params[k1]);
                else if (Object.prototype.hasOwnProperty.call(params, k2)) segs.push(params[k2]);
                else break;
            }
            if (segs.length) params[base + '*'] = segs.join('');
            if (params[base + '*']) {
                let v = params[base + '*'];
                const m = v.match(/^([^']*)'[^']*'(.*)$/);
                let charset = 'utf-8';
                if (m) { charset = m[1] || 'utf-8'; v = m[2]; }
                const bytes = percentDecodeBytes(v);
                try { params[base] = new TextDecoder(charset).decode(bytes); }
                catch (_) { params[base] = decodeUtf8(bytes); }
            } else if (params[base]) params[base] = decodeMimeWords(params[base]);
        }
        return { value: main, params };
    }

    function splitHeaderBody(raw) {
        let idx = raw.indexOf('\r\n\r\n');
        let sep = 4;
        if (idx < 0) { idx = raw.indexOf('\n\n'); sep = 2; }
        if (idx < 0) return { header: raw, body: '' };
        return { header: raw.slice(0, idx), body: raw.slice(idx + sep) };
    }

    function splitMultipart(body, boundary) {
        const norm = String(body || '').replace(/\r\n/g, '\n');
        const lines = norm.split('\n');
        const marker = '--' + boundary;
        const end = marker + '--';
        const parts = [];
        let current = null;
        for (const line of lines) {
            const boundaryLine = line.replace(/[ \t]+$/g, '');
            if (boundaryLine === marker || boundaryLine === end) {
                if (current) parts.push(current.join('\r\n'));
                current = boundaryLine === end ? null : [];
                if (boundaryLine === end) break;
            } else if (current) current.push(line);
        }
        if (current && current.length) parts.push(current.join('\r\n'));
        return parts;
    }

    function decodeTransfer(body, encoding) {
        const enc = String(encoding || '').trim().toLowerCase();
        if (enc === 'base64') return decodeBase64(body);
        if (enc === 'quoted-printable') return decodeQuotedPrintableToBytes(body);
        return bytesFromBinaryString(body);
    }

    function detectImageType(bytes, mime, filename) {
        const m = String(mime || '').toLowerCase().split(';')[0].trim();
        if (m.startsWith('image/')) return { isImage: true, mime: m, ext: MIME_TO_EXT[m] || extOf(filename) || 'img' };
        const ext = extOf(filename);
        if (IMAGE_EXTS.has(ext)) return { isImage: true, mime: mimeForExt(ext), ext };
        if (!bytes || bytes.length < 4) return { isImage: false, mime: m || 'application/octet-stream', ext: '' };
        const b = bytes;
        if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return {isImage:true,mime:'image/png',ext:'png'};
        if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return {isImage:true,mime:'image/jpeg',ext:'jpg'};
        if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return {isImage:true,mime:'image/gif',ext:'gif'};
        if (b[0] === 0x42 && b[1] === 0x4d) return {isImage:true,mime:'image/bmp',ext:'bmp'};
        if ((b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a && b[3] === 0x00) || (b[0] === 0x4d && b[1] === 0x4d && b[2] === 0x00 && b[3] === 0x2a)) return {isImage:true,mime:'image/tiff',ext:'tiff'};
        if (b.length >= 12 && String.fromCharCode(...b.subarray(0,4)) === 'RIFF' && String.fromCharCode(...b.subarray(8,12)) === 'WEBP') return {isImage:true,mime:'image/webp',ext:'webp'};
        if (b.length >= 12 && String.fromCharCode(...b.subarray(4,12)).includes('ftypavif')) return {isImage:true,mime:'image/avif',ext:'avif'};
        if (b.length >= 12 && String.fromCharCode(...b.subarray(4,12)).includes('ftypheic')) return {isImage:true,mime:'image/heic',ext:'heic'};
        const lead = decodeLatin1(b.subarray(0, Math.min(512,b.length))).trim().toLowerCase();
        if (lead.startsWith('<svg') || (lead.startsWith('<?xml') && lead.includes('<svg'))) return {isImage:true,mime:'image/svg+xml',ext:'svg'};
        return { isImage: false, mime: m || 'application/octet-stream', ext: '' };
    }

    function mimeForExt(ext) {
        ext = String(ext || '').toLowerCase();
        const found = Object.entries(MIME_TO_EXT).find(([, e]) => e === ext);
        if (found) return found[0];
        if (ext === 'jpeg' || ext === 'jfif') return 'image/jpeg';
        if (ext === 'tif') return 'image/tiff';
        return 'application/octet-stream';
    }

    function extractDataUris(html, sourceLabel) {
        const out = [];
        const re = /data:(image\/[a-z0-9.+-]+)(?:;[^,]*)?;base64,([a-z0-9+/_=\s-]+)/gi;
        let m, n = 1;
        while ((m = re.exec(String(html || ''))) !== null) {
            try {
                const bytes = decodeBase64(m[2].replace(/-/g,'+').replace(/_/g,'/'));
                const info = detectImageType(bytes, m[1], '');
                if (info.isImage) out.push({
                    name: 'embedded-' + n++ + '.' + info.ext,
                    bytes, mime: info.mime, inline: true, source: sourceLabel || 'HTML data URI'
                });
            } catch (_) {}
        }
        return out;
    }

    function uniqueImageNames(images) {
        const seen = new Map();
        for (let i = 0; i < images.length; i++) {
            let name = cleanName(images[i].name, 'image-' + (i + 1));
            const info = detectImageType(images[i].bytes, images[i].mime, name);
            if (!extOf(name) && info.ext) name += '.' + info.ext;
            const key = name.toLowerCase();
            const count = seen.get(key) || 0;
            seen.set(key, count + 1);
            if (count) {
                const dot = name.lastIndexOf('.');
                name = dot > 0 ? name.slice(0, dot) + '-' + (count + 1) + name.slice(dot) : name + '-' + (count + 1);
            }
            images[i].name = name;
        }
        return images;
    }

    function parseEml(arrayBuffer, fileName) {
        const raw = decodeLatin1(new Uint8Array(arrayBuffer));
        const images = [];
        let sequence = 1;

        function walkPart(partRaw, depth) {
            if (depth > 30) return;
            const hb = splitHeaderBody(partRaw);
            const headers = parseHeaders(hb.header);
            const ct = parseHeaderWithParams(headers['content-type'] || 'text/plain');
            const cd = parseHeaderWithParams(headers['content-disposition'] || '');
            const cte = headers['content-transfer-encoding'] || '';
            const contentId = String(headers['content-id'] || '').replace(/[<>]/g, '').trim();

            if (ct.value.startsWith('multipart/') && ct.params.boundary) {
                for (const child of splitMultipart(hb.body, ct.params.boundary)) walkPart(child, depth + 1);
                return;
            }

            if (ct.value === 'message/rfc822') {
                try {
                    const nestedBytes = decodeTransfer(hb.body, cte);
                    walkPart(decodeLatin1(nestedBytes), depth + 1);
                } catch (_) {}
                return;
            }

            let bytes;
            try { bytes = decodeTransfer(hb.body, cte); } catch (_) { return; }
            const filename = decodeMimeWords(cd.params.filename || ct.params.name || '');
            const info = detectImageType(bytes, ct.value, filename);
            if (info.isImage) {
                images.push({
                    name: filename || ('image-' + sequence++ + '.' + info.ext),
                    bytes,
                    mime: info.mime,
                    inline: cd.value === 'inline' || !!contentId,
                    source: contentId ? 'Inline image' : (cd.value === 'attachment' ? 'Attachment' : 'Email image')
                });
            }

            if (ct.value === 'text/html') {
                let text;
                const charset = ct.params.charset || 'utf-8';
                try { text = new TextDecoder(charset).decode(bytes); } catch (_) { text = decodeUtf8(bytes); }
                images.push(...extractDataUris(text, 'HTML data URI'));
            }
        }

        walkPart(raw, 0);
        return {
            type: 'eml',
            fileName,
            folderName: cleanName(basenameNoExt(fileName), 'Email'),
            images: uniqueImageNames(images)
        };
    }

    // -------- Outlook MSG / Compound File Binary parser --------
    const CFB = { FREE:0xffffffff, END:0xfffffffe, FAT:0xfffffffd, DIF:0xfffffffc, NOSTREAM:0xffffffff };

    class CompoundFile {
        constructor(arrayBuffer) {
            this.bytes = new Uint8Array(arrayBuffer);
            this.view = new DataView(arrayBuffer);
            this.parseHeader();
            this.loadFat();
            this.loadDirectory();
            this.loadMiniFat();
            this.loadMiniStream();
            this.buildPaths();
        }
        u16(o) { return this.view.getUint16(o, true); }
        u32(o) { return this.view.getUint32(o, true); }
        parseHeader() {
            const sig = [0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1];
            if (this.bytes.length < 512 || sig.some((v,i)=>this.bytes[i]!==v)) throw new Error('This does not appear to be a valid Outlook MSG/OLE file.');
            const byteOrder = this.u16(0x1c);
            if (byteOrder !== 0xfffe) throw new Error('Unsupported MSG byte order.');
            this.majorVersion = this.u16(0x1a);
            this.sectorSize = 1 << this.u16(0x1e);
            this.miniSectorSize = 1 << this.u16(0x20);
            this.numFatSectors = this.u32(0x2c);
            this.firstDirSector = this.u32(0x30);
            this.miniCutoff = this.u32(0x38);
            this.firstMiniFatSector = this.u32(0x3c);
            this.numMiniFatSectors = this.u32(0x40);
            this.firstDifatSector = this.u32(0x44);
            this.numDifatSectors = this.u32(0x48);
            if (![512,4096].includes(this.sectorSize) || this.miniSectorSize !== 64) throw new Error('Unsupported MSG sector size.');
        }
        sectorOffset(id) {
            const o = (id + 1) * this.sectorSize;
            if (id >= 0xfffffffc || o < 512 || o + this.sectorSize > this.bytes.length + this.sectorSize) throw new Error('Invalid MSG sector chain.');
            return o;
        }
        sectorBytes(id) {
            const o = this.sectorOffset(id);
            return this.bytes.subarray(o, Math.min(o + this.sectorSize, this.bytes.length));
        }
        loadFat() {
            const difat = [];
            for (let i = 0; i < 109; i++) {
                const id = this.u32(0x4c + i * 4);
                if (id !== CFB.FREE) difat.push(id);
            }
            let dif = this.firstDifatSector;
            const entriesPerDif = this.sectorSize / 4 - 1;
            for (let n = 0; n < this.numDifatSectors && dif !== CFB.END && dif !== CFB.FREE; n++) {
                const sec = this.sectorBytes(dif);
                const dv = new DataView(sec.buffer, sec.byteOffset, sec.byteLength);
                for (let i = 0; i < entriesPerDif; i++) {
                    const id = dv.getUint32(i * 4, true);
                    if (id !== CFB.FREE) difat.push(id);
                }
                dif = dv.getUint32(entriesPerDif * 4, true);
            }
            this.fat = [];
            const fatSectors = difat.slice(0, this.numFatSectors);
            for (const id of fatSectors) {
                const sec = this.sectorBytes(id);
                const dv = new DataView(sec.buffer, sec.byteOffset, sec.byteLength);
                for (let o = 0; o + 4 <= sec.length; o += 4) this.fat.push(dv.getUint32(o, true));
            }
            if (!this.fat.length) throw new Error('MSG FAT table is missing.');
        }
        chain(start, table, maxItems) {
            const ids = [];
            let id = start;
            const seen = new Set();
            const max = Math.min(maxItems || 1000000, table.length + 1);
            while (id !== CFB.END && id !== CFB.FREE && id < 0xfffffffc) {
                if (seen.has(id) || ids.length >= max || id >= table.length) throw new Error('Corrupt MSG sector chain.');
                seen.add(id); ids.push(id); id = table[id];
            }
            return ids;
        }
        readRegularStream(start, size) {
            if (!size) return new Uint8Array(0);
            const ids = this.chain(start, this.fat, Math.ceil(size / this.sectorSize) + 8);
            const chunks = ids.map(id => this.sectorBytes(id));
            return concatBytes(chunks).subarray(0, size);
        }
        loadDirectory() {
            const dirRaw = this.readRegularStream(this.firstDirSector, Math.max(this.sectorSize, this.bytes.length));
            this.entries = [];
            for (let o = 0; o + 128 <= dirRaw.length; o += 128) {
                const e = dirRaw.subarray(o, o + 128);
                const dv = new DataView(e.buffer, e.byteOffset, e.byteLength);
                const nameLen = dv.getUint16(64, true);
                const nameBytes = e.subarray(0, Math.max(0, Math.min(64, nameLen >= 2 ? nameLen - 2 : 0)));
                const type = e[66];
                const low = dv.getUint32(120, true);
                const high = dv.getUint32(124, true);
                let size = Number((BigInt(high) << 32n) | BigInt(low));
                if (this.majorVersion === 3 && type === 2) size = low;
                this.entries.push({
                    id: this.entries.length,
                    name: decodeUtf16LE(nameBytes),
                    type,
                    left: dv.getUint32(68, true), right: dv.getUint32(72, true), child: dv.getUint32(76, true),
                    start: dv.getUint32(116, true), size,
                    parent: null, path: ''
                });
            }
            this.root = this.entries.find(e => e.type === 5) || this.entries[0];
            if (!this.root) throw new Error('MSG directory is empty.');
        }
        loadMiniFat() {
            this.miniFat = [];
            if (!this.numMiniFatSectors || this.firstMiniFatSector === CFB.END || this.firstMiniFatSector === CFB.FREE) return;
            const ids = this.chain(this.firstMiniFatSector, this.fat, this.numMiniFatSectors + 4).slice(0, this.numMiniFatSectors);
            for (const id of ids) {
                const sec = this.sectorBytes(id);
                const dv = new DataView(sec.buffer, sec.byteOffset, sec.byteLength);
                for (let o = 0; o + 4 <= sec.length; o += 4) this.miniFat.push(dv.getUint32(o, true));
            }
        }
        loadMiniStream() {
            this.miniStream = this.root && this.root.size ? this.readRegularStream(this.root.start, this.root.size) : new Uint8Array(0);
        }
        readEntry(entry) {
            if (!entry || entry.type !== 2 || !entry.size) return new Uint8Array(0);
            if (entry.size < this.miniCutoff && this.miniFat.length && this.miniStream.length) {
                const ids = this.chain(entry.start, this.miniFat, Math.ceil(entry.size / this.miniSectorSize) + 8);
                const chunks = ids.map(id => this.miniStream.subarray(id * this.miniSectorSize, id * this.miniSectorSize + this.miniSectorSize));
                return concatBytes(chunks).subarray(0, entry.size);
            }
            return this.readRegularStream(entry.start, entry.size);
        }
        walkSiblingTree(id, parentId, visited) {
            if (id === CFB.NOSTREAM || id >= this.entries.length || visited.has(id)) return;
            visited.add(id);
            const e = this.entries[id];
            this.walkSiblingTree(e.left, parentId, visited);
            e.parent = parentId;
            if ((e.type === 1 || e.type === 5) && e.child !== CFB.NOSTREAM) this.walkSiblingTree(e.child, e.id, visited);
            this.walkSiblingTree(e.right, parentId, visited);
        }
        buildPaths() {
            const visited = new Set();
            if (this.root.child !== CFB.NOSTREAM) this.walkSiblingTree(this.root.child, this.root.id, visited);
            for (const e of this.entries) {
                const names = [e.name]; let p = e.parent; let guard = 0;
                while (p != null && p < this.entries.length && guard++ < 100) {
                    if (this.entries[p].type !== 5) names.unshift(this.entries[p].name);
                    p = this.entries[p].parent;
                }
                e.path = names.filter(Boolean).join('/');
            }
        }
        childrenOf(parentId) { return this.entries.filter(e => e.parent === parentId); }
    }

    function readMsgString(cfb, entries, propId) {
        const uni = entries.find(e => e.type === 2 && e.name.toLowerCase() === ('__substg1.0_' + propId + '001f').toLowerCase());
        if (uni) return decodeUtf16LE(cfb.readEntry(uni)).replace(/\u0000+$/g, '');
        const ansi = entries.find(e => e.type === 2 && e.name.toLowerCase() === ('__substg1.0_' + propId + '001e').toLowerCase());
        if (ansi) return decodeLatin1(cfb.readEntry(ansi)).replace(/\u0000+$/g, '');
        return '';
    }

    function parseMsg(arrayBuffer, fileName) {
        const cfb = new CompoundFile(arrayBuffer);
        const images = [];
        let seq = 1;
        const attachStorages = cfb.entries.filter(e => e.type === 1 && /^__attach_version1\.0_#/i.test(e.name));
        for (const storage of attachStorages) {
            const kids = cfb.childrenOf(storage.id);
            const data = kids.find(e => e.type === 2 && /^__substg1\.0_37010102$/i.test(e.name));
            if (!data) continue;
            let bytes;
            try { bytes = cfb.readEntry(data); } catch (_) { continue; }
            const longName = readMsgString(cfb, kids, '3707');
            const shortName = readMsgString(cfb, kids, '3704');
            const mime = readMsgString(cfb, kids, '370e');
            const contentId = readMsgString(cfb, kids, '3712');
            const name = longName || shortName || '';
            const info = detectImageType(bytes, mime, name);
            if (!info.isImage) continue;
            images.push({
                name: name || ('image-' + seq++ + '.' + info.ext),
                bytes,
                mime: info.mime,
                inline: !!contentId,
                source: contentId ? 'Inline image' : 'Attachment'
            });
        }

        // Extract base64 data-URI images embedded directly in the MSG HTML body.
        const rootKids = cfb.childrenOf(cfb.root.id);
        const html = rootKids.find(e => e.type === 2 && /^__substg1\.0_10130102$/i.test(e.name));
        if (html) {
            try {
                const htmlBytes = cfb.readEntry(html);
                images.push(...extractDataUris(decodeUtf8(htmlBytes), 'HTML data URI'));
            } catch (_) {}
        }

        return {
            type: 'msg', fileName,
            folderName: cleanName(basenameNoExt(fileName), 'Email'),
            images: uniqueImageNames(images)
        };
    }

    function parseEmailFile(arrayBuffer, fileName) {
        const lower = String(fileName || '').toLowerCase();
        if (lower.endsWith('.eml')) return parseEml(arrayBuffer, fileName);
        if (lower.endsWith('.msg')) return parseMsg(arrayBuffer, fileName);
        throw new Error('Only .eml and .msg files are supported.');
    }

    // -------- Minimal ZIP writer (stored/no compression) --------
    let crcTable = null;
    function makeCrcTable() {
        const table = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
            table[n] = c >>> 0;
        }
        return table;
    }
    function crc32(bytes) {
        if (!crcTable) crcTable = makeCrcTable();
        let c = 0xffffffff;
        for (const b of bytes) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
        return (c ^ 0xffffffff) >>> 0;
    }
    function dosDateTime(date) {
        const d = date || new Date();
        const year = Math.max(1980, d.getFullYear());
        return {
            time: ((d.getHours() & 31) << 11) | ((d.getMinutes() & 63) << 5) | ((Math.floor(d.getSeconds()/2)) & 31),
            date: (((year - 1980) & 127) << 9) | (((d.getMonth()+1) & 15) << 5) | (d.getDate() & 31)
        };
    }
    function u16le(n) { return new Uint8Array([n & 255, (n >>> 8) & 255]); }
    function u32le(n) { return new Uint8Array([n & 255, (n >>> 8)&255, (n >>> 16)&255, (n >>> 24)&255]); }
    function makeZip(files) {
        const locals = [], centrals = [];
        let offset = 0;
        const dt = dosDateTime(new Date());
        for (const file of files) {
            const nameBytes = encodeUtf8(String(file.path).replace(/\\/g,'/'));
            const data = file.bytes instanceof Uint8Array ? file.bytes : new Uint8Array(file.bytes);
            const crc = crc32(data);
            const local = concatBytes([
                u32le(0x04034b50), u16le(20), u16le(0x0800), u16le(0), u16le(dt.time), u16le(dt.date),
                u32le(crc), u32le(data.length), u32le(data.length), u16le(nameBytes.length), u16le(0), nameBytes, data
            ]);
            locals.push(local);
            const central = concatBytes([
                u32le(0x02014b50), u16le(20), u16le(20), u16le(0x0800), u16le(0), u16le(dt.time), u16le(dt.date),
                u32le(crc), u32le(data.length), u32le(data.length), u16le(nameBytes.length), u16le(0), u16le(0),
                u16le(0), u16le(0), u32le(0), u32le(offset), nameBytes
            ]);
            centrals.push(central);
            offset += local.length;
        }
        const centralSize = centrals.reduce((n,c)=>n+c.length,0);
        const end = concatBytes([
            u32le(0x06054b50), u16le(0), u16le(0), u16le(files.length), u16le(files.length),
            u32le(centralSize), u32le(offset), u16le(0)
        ]);
        return concatBytes([...locals, ...centrals, end]);
    }

    return {
        IMAGE_EXTS, parseEml, parseMsg, parseEmailFile, detectImageType, extractDataUris,
        makeZip, cleanName, basenameNoExt, formatBytes, crc32, CompoundFile, decodeUtf16LE
    };
});
