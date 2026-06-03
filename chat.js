(function () {
    const widget = document.getElementById('chat-widget');
    const toggle = document.getElementById('chat-toggle');
    const panel = document.getElementById('chat-panel');
    const closeBtn = document.getElementById('chat-close');
    const form = document.getElementById('chat-form');
    const feedback = document.getElementById('chat-feedback');
    const submitBtn = document.getElementById('chat-submit');

    if (!widget || !toggle || !panel || !form) return;

    const API_URL = '/api/support';

    function setOpen(open) {
        widget.classList.toggle('chat-widget--open', open);
        toggle.setAttribute('aria-expanded', String(open));
        panel.hidden = !open;
        if (open) {
            const first = form.querySelector('input, textarea');
            if (first) first.focus();
        }
    }

    function showFeedback(type, text) {
        feedback.hidden = false;
        feedback.className = `chat-feedback chat-feedback--${type}`;
        feedback.textContent = text;
    }

    function clearFeedback() {
        feedback.hidden = true;
        feedback.textContent = '';
        feedback.className = 'chat-feedback';
    }

    toggle.addEventListener('click', () => {
        setOpen(!widget.classList.contains('chat-widget--open'));
    });

    closeBtn.addEventListener('click', () => setOpen(false));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && widget.classList.contains('chat-widget--open')) {
            setOpen(false);
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearFeedback();

        const name = form.name.value.trim();
        const email = form.email.value.trim();
        const message = form.message.value.trim();

        if (!email || !message) {
            showFeedback('error', 'Veuillez renseigner votre e-mail et décrire votre problème.');
            return;
        }

        if (message.length < 10) {
            showFeedback('error', 'Veuillez décrire votre problème plus en détail (10 caractères minimum).');
            return;
        }

        submitBtn.disabled = true;
        const originalLabel = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="ri-loader-4-line" aria-hidden="true"></i> Envoi en cours…';

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'فشل الإرسال');
            }

            showFeedback(
                'success',
                data.message || 'Votre message a bien été envoyé. Nous vous répondrons rapidement.'
            );
            form.reset();
        } catch (err) {
            const msg =
                err.message === 'Failed to fetch'
                    ? 'Connexion au serveur impossible. Lancez le site avec : npm start'
                    : err.message || 'Une erreur est survenue. Veuillez réessayer.';
            showFeedback('error', msg);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalLabel;
        }
    });
})();
