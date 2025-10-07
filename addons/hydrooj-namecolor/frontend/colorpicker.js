document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('color-input');
    const picker = document.getElementById('color-picker');
    const preview = document.getElementById('preview');
    const userInput = document.getElementById('username');
    const list = document.getElementById('suggestion-list');

    const applyColor = (c) => preview && (preview.style.color = c);
    if (input && picker) {
        picker.addEventListener('input', () => { input.value = picker.value; applyColor(picker.value); });
        input.addEventListener('input', () => {
            const val = input.value.trim();
            if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(val)) { picker.value = val; applyColor(val); }
        });
        applyColor(picker.value);
    }

    if (userInput && list) {
        let timer = null;
        const fetchSuggestions = async (q) => (await fetch(`/admin/namecolor/search?q=${encodeURIComponent(q)}`)).json();
        const show = (items) => {
            list.innerHTML = '';
            if (!items.length) return list.style.display = 'none';
            for (const it of items) {
                const li = document.createElement('li');
                li.style.padding = '4px 6px'; li.style.cursor = 'pointer';
                li.textContent = `${it.username} (${it.id})`;
                li.onclick = () => { userInput.value = it.username; list.style.display = 'none'; };
                list.appendChild(li);
            }
            list.style.display = 'block';
        };
        userInput.addEventListener('input', () => {
            clearTimeout(timer);
            const val = userInput.value.trim();
            if (!val) return list.style.display = 'none';
            timer = setTimeout(async () => show(await fetchSuggestions(val)), 200);
        });
        document.addEventListener('click', e => {
            if (!list.contains(e.target) && e.target !== userInput) list.style.display = 'none';
        });
    }

    const autoSave = (selector, url) => {
        document.querySelectorAll(selector).forEach(el => {
            el.addEventListener('input', async () => {
                const id = el.dataset.id, color = el.value;
                el.style.opacity = '0.5';
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, color })
                });
                const data = await res.json();
                el.style.opacity = '1';
                if (!data.ok) alert('保存失败: ' + data.msg);
            });
        });
    };
    autoSave('.user-color', '/admin/namecolor/update');
    autoSave('.group-color', '/admin/namecolor/updateGroup');
});
