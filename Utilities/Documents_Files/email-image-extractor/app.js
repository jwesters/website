(function () {
    'use strict';
    const Core = window.EmailImageCore;
    const MAX_FILES = 5;
    const state = { emails: [], nextId: 1, urls: [] };

    const $ = id => document.getElementById(id);
    const dropZone = $('dropZone');
    const fileInput = $('fileInput');
    const browseBtn = $('browseBtn');
    const workspace = $('workspace');
    const results = $('results');
    const notice = $('notice');
    const downloadBtn = $('downloadBtn');

    function setTheme(theme) {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem('email-image-extractor-theme', theme);
    }
    const savedTheme = localStorage.getItem('email-image-extractor-theme');
    setTheme(savedTheme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
    $('themeBtn').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));

    browseBtn.addEventListener('click', e => { e.stopPropagation(); fileInput.click(); });
    dropZone.addEventListener('click', e => { if (e.target !== browseBtn) fileInput.click(); });
    dropZone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
    fileInput.addEventListener('change', () => processFiles([...fileInput.files]));

    for (const ev of ['dragenter', 'dragover']) dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.add('dragging'); });
    for (const ev of ['dragleave', 'drop']) dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.remove('dragging'); });
    dropZone.addEventListener('drop', e => processFiles([...e.dataTransfer.files]));

    $('selectAllBtn').addEventListener('click', () => setAll(true));
    $('deselectAllBtn').addEventListener('click', () => setAll(false));
    $('clearBtn').addEventListener('click', clearAll);
    downloadBtn.addEventListener('click', downloadZip);

    function showNotice(text, kind) {
        notice.textContent = text;
        notice.className = 'notice' + (kind ? ' ' + kind : '');
        notice.hidden = !text;
    }

    async function processFiles(files) {
        showNotice('', '');
        const valid = files.filter(f => /\.(eml|msg)$/i.test(f.name));
        if (!valid.length) { showNotice('Choose .eml or .msg files.', 'error'); return; }
        if (files.length !== valid.length) showNotice('Some unsupported files were skipped.', '');
        const remaining = MAX_FILES - state.emails.length;
        if (remaining <= 0) { showNotice('You already have 5 emails loaded. Clear them before adding more.', 'error'); return; }
        const batch = valid.slice(0, remaining);
        if (valid.length > remaining) showNotice('Only the first ' + remaining + ' file' + (remaining === 1 ? '' : 's') + ' were added because the maximum is 5.', '');

        dropZone.setAttribute('aria-busy', 'true');
        browseBtn.disabled = true;
        browseBtn.textContent = 'Extracting…';
        let failures = 0;
        for (const file of batch) {
            try {
                const buffer = await file.arrayBuffer();
                const parsed = Core.parseEmailFile(buffer, file.name);
                const email = {
                    id: state.nextId++, fileName: file.name, folderName: parsed.folderName,
                    type: parsed.type, images: parsed.images.map((img, i) => ({ ...img, id: state.nextId++ + '-' + i, selected: true }))
                };
                state.emails.push(email);
            } catch (err) {
                failures++;
                console.error(err);
                showNotice('Could not read ' + file.name + ': ' + (err && err.message ? err.message : 'Unknown parsing error'), 'error');
            }
        }
        fileInput.value = '';
        dropZone.removeAttribute('aria-busy');
        browseBtn.disabled = false;
        browseBtn.textContent = 'Choose Email Files';
        render();
        if (!failures && batch.length) {
            const total = state.emails.reduce((n, e) => n + e.images.length, 0);
            showNotice(total ? 'Extraction complete. Review the images below and deselect anything you do not want.' : 'The email file opened successfully, but no image attachments or inline images were found.', total ? 'success' : '');
        }
    }

    function revokeUrls() {
        for (const url of state.urls) URL.revokeObjectURL(url);
        state.urls.length = 0;
    }

    function render() {
        revokeUrls();
        workspace.hidden = state.emails.length === 0;
        results.textContent = '';
        for (const email of state.emails) {
            const section = document.createElement('section');
            section.className = 'email-group';
            const head = document.createElement('div');
            head.className = 'email-head';
            const title = document.createElement('div');
            title.className = 'email-title';
            const strong = document.createElement('strong'); strong.textContent = email.fileName;
            const sub = document.createElement('span'); sub.textContent = 'ZIP folder: ' + email.folderName;
            title.append(strong, sub);
            const meta = document.createElement('span'); meta.className = 'email-meta'; meta.textContent = email.images.length + ' image' + (email.images.length === 1 ? '' : 's');
            head.append(title, meta);
            section.append(head);

            if (!email.images.length) {
                const empty = document.createElement('div'); empty.className = 'empty-group'; empty.textContent = 'No images were found in this email.'; section.append(empty);
            } else {
                const grid = document.createElement('div'); grid.className = 'image-grid';
                for (const img of email.images) grid.append(makeCard(img));
                section.append(grid);
            }
            results.append(section);
        }
        updateStats();
    }

    function makeCard(img) {
        const card = document.createElement('label');
        card.className = 'image-card' + (img.selected ? ' selected' : '');
        const check = document.createElement('input');
        check.className = 'card-check'; check.type = 'checkbox'; check.checked = img.selected;
        check.addEventListener('change', () => { img.selected = check.checked; card.classList.toggle('selected', img.selected); updateStats(); });

        const badge = document.createElement('span'); badge.className = 'type-badge'; badge.textContent = img.inline ? 'INLINE' : 'ATTACHMENT';
        const preview = document.createElement('div'); preview.className = 'preview';
        const blob = new Blob([img.bytes], { type: img.mime || 'application/octet-stream' });
        const url = URL.createObjectURL(blob); state.urls.push(url);
        const image = document.createElement('img'); image.alt = img.name; image.src = url;
        image.addEventListener('error', () => {
            preview.textContent = '';
            const f = document.createElement('div'); f.className = 'preview-fallback'; f.textContent = 'Preview not supported by this browser'; preview.append(f);
        }, { once: true });
        preview.append(image);

        const body = document.createElement('div'); body.className = 'card-body';
        const name = document.createElement('div'); name.className = 'file-name'; name.textContent = img.name; name.title = img.name;
        const detail = document.createElement('div'); detail.className = 'file-detail';
        const size = document.createElement('span'); size.textContent = Core.formatBytes(img.bytes.length);
        const type = document.createElement('span'); type.textContent = (img.mime || 'image').replace('image/', '').toUpperCase();
        detail.append(size, type); body.append(name, detail);
        card.append(check, badge, preview, body);
        return card;
    }

    function allImages() { return state.emails.flatMap(e => e.images); }
    function setAll(value) { for (const img of allImages()) img.selected = value; render(); }
    function clearAll() {
        revokeUrls(); state.emails = []; results.textContent = ''; workspace.hidden = true; showNotice('', ''); fileInput.value = '';
    }

    function updateStats() {
        const images = allImages();
        const selected = images.filter(i => i.selected);
        $('fileCount').textContent = state.emails.length + ' email' + (state.emails.length === 1 ? '' : 's');
        $('imageCount').textContent = images.length + ' image' + (images.length === 1 ? '' : 's') + ' found';
        $('selectedCount').textContent = selected.length + ' selected';
        downloadBtn.disabled = selected.length === 0;
        $('downloadSummary').textContent = selected.length ? selected.length + ' image' + (selected.length === 1 ? '' : 's') + ' ready for ZIP' : 'Select at least one image';
        $('downloadDetail').textContent = state.emails.length > 1 ? 'Images will be organized into one folder per email.' : 'Images will be placed inside a folder named after the email.';
    }

    function uniqueFolders(emails) {
        const used = new Map();
        const out = new Map();
        for (const email of emails) {
            let base = Core.cleanName(email.folderName, 'Email');
            const key = base.toLowerCase();
            const n = used.get(key) || 0;
            used.set(key, n + 1);
            if (n) base += '-' + (n + 1);
            out.set(email.id, base);
        }
        return out;
    }

    function downloadZip() {
        const chosenEmails = state.emails.filter(e => e.images.some(i => i.selected));
        if (!chosenEmails.length) return;
        const folders = uniqueFolders(chosenEmails);
        const files = [];
        for (const email of chosenEmails) {
            const folder = folders.get(email.id);
            for (const img of email.images.filter(i => i.selected)) files.push({ path: folder + '/' + Core.cleanName(img.name, 'image'), bytes: img.bytes });
        }
        try {
            const zip = Core.makeZip(files);
            const blob = new Blob([zip], { type: 'application/zip' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'extracted-images.zip'; document.body.append(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 2000);
            showNotice('ZIP created with ' + files.length + ' image' + (files.length === 1 ? '' : 's') + '.', 'success');
        } catch (err) {
            console.error(err);
            showNotice('Could not create the ZIP: ' + (err && err.message ? err.message : 'Unknown error'), 'error');
        }
    }
})();
