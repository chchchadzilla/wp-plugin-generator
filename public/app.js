const form = document.getElementById('generator-form');
const statusEl = document.getElementById('status');
const resultEl = document.getElementById('result');
const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');
const presetSelect = document.getElementById('preset-select');
const presetSummary = document.getElementById('preset-summary');
const descriptionField = form.querySelector('textarea[name="description"]');

let presets = [];

const setStatus = (message, isError = false) => {
  statusEl.textContent = message || '';
  statusEl.style.color = isError ? '#dc2626' : '#475569';
};

const setResult = (text) => {
  resultEl.textContent = text || 'Your plugin code will show up here.';
};

const getPluginFilename = (description) => {
  const slug = description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `${slug || 'wordpress-plugin'}-generated.php`;
};

const groupPresets = (list) => {
  const grouped = new Map();
  list.forEach((preset) => {
    const key = preset.category || 'Other';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(preset);
  });
  return grouped;
};

const populatePresets = (list) => {
  presetSelect.innerHTML = '<option value="">Pick a preset scenario…</option>';
  const grouped = groupPresets(list);
  [...grouped.entries()].forEach(([category, items]) => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = `${category} (${items.length})`;
    items.forEach((preset) => {
      const option = document.createElement('option');
      option.value = preset.id;
      option.textContent = preset.title;
      optgroup.appendChild(option);
    });
    presetSelect.appendChild(optgroup);
  });
};

const updatePresetSummary = (preset) => {
  if (!preset) {
    presetSummary.textContent = 'Presets cover grouped workflows from starter boosts to suite-wide ops.';
    return;
  }
  presetSummary.textContent = `${preset.category} · ${preset.level} · ${preset.summary}`;
};

const loadPresets = async () => {
  try {
    const response = await fetch('/data/prompt-presets.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Unable to load presets');
    presets = await response.json();
    populatePresets(presets);
  } catch (error) {
    console.error('Preset load failed', error);
    presetSummary.textContent = 'Preset library unavailable. Describe your idea manually.';
  }
};

presetSelect.addEventListener('change', () => {
  const preset = presets.find((item) => item.id === presetSelect.value);
  if (!preset) {
    updatePresetSummary(null);
    return;
  }

  updatePresetSummary(preset);
  if (descriptionField.value.trim().length === 0) {
    descriptionField.value = preset.prompt;
  } else {
    const wantsReplace = confirm('Replace your current description with the preset text?');
    if (wantsReplace) {
      descriptionField.value = preset.prompt;
    }
  }
});

loadPresets();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = form.querySelector('button[type="submit"]');

  const formData = new FormData(form);
  const payload = {
    apiKey: formData.get('apiKey'),
    model: formData.get('model') || 'openrouter/auto',
    description: formData.get('description')
  };

  if (!payload.apiKey || !payload.description) {
    setStatus('API key and plugin description are required.', true);
    return;
  }

  submitButton.disabled = true;
  setStatus('Generating plugin with OpenRouter…');

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || 'Unknown error');
    }

    setResult(data.pluginCode);
    setStatus('Done! Review, tweak if needed, and drop it into wp-content/plugins.');
    downloadBtn.dataset.filename = getPluginFilename(payload.description);
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Generation failed', true);
  } finally {
    submitButton.disabled = false;
  }
});

copyBtn.addEventListener('click', async () => {
  const text = resultEl.textContent.trim();
  if (!text || text === 'Your plugin code will show up here.') {
    setStatus('Nothing to copy yet.', true);
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    setStatus('Copied to clipboard.');
  } catch (error) {
    console.error(error);
    setStatus('Copy failed. Select the code manually instead.', true);
  }
});

downloadBtn.addEventListener('click', () => {
  const text = resultEl.textContent.trim();
  if (!text || text === 'Your plugin code will show up here.') {
    setStatus('Generate something before downloading.', true);
    return;
  }

  const filename = downloadBtn.dataset.filename || 'wordpress-plugin-generated.php';
  const blob = new Blob([text], { type: 'text/php' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
  setStatus(`Downloaded ${filename}`);
});
