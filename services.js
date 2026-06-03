(function () {
    const grid = document.getElementById('services-grid');
    if (!grid) return;

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatPrice(service) {
        const amount = Number(service.price);
        const formatted = Number.isFinite(amount)
            ? (Number.isInteger(amount) ? String(amount) : amount.toFixed(2))
            : escapeHtml(String(service.price));
        return `${formatted}${escapeHtml(service.priceUnit || '€')}`;
    }

    function renderCard(service) {
        const featured = service.featured ? ' service-card--featured' : '';
        const badge = service.badge
            ? `<span class="service-card__badge">${escapeHtml(service.badge)}</span>`
            : '';

        return `
            <article class="service-card${featured}" data-service-id="${escapeHtml(service.id)}">
                ${badge}
                <div class="service-card__icon"><i class="${escapeHtml(service.icon)}" aria-hidden="true"></i></div>
                <div class="service-card__price">
                    <span class="service-card__price-note">${escapeHtml(service.priceNote || '')}</span>
                    <span class="service-card__price-value">${formatPrice(service)}</span>
                </div>
                <h3>${escapeHtml(service.title)}</h3>
                <p class="service-card__lead">${escapeHtml(service.lead)}</p>
                <p class="service-card__detail">${escapeHtml(service.detail)}</p>
                <a href="#contact" class="service-card__link"><i class="ri-file-list-3-line" aria-hidden="true"></i> Demander un devis <i class="ri-arrow-right-line" aria-hidden="true"></i></a>
            </article>
        `;
    }

    function showLoading() {
        grid.innerHTML = `
            <div class="services-status services-status--loading" role="status">
                <i class="ri-loader-4-line" aria-hidden="true"></i>
                <span>Chargement des services…</span>
            </div>
        `;
    }

    function showError(message) {
        grid.innerHTML = `
            <div class="services-status services-status--error" role="alert">
                <i class="ri-error-warning-line" aria-hidden="true"></i>
                <span>${escapeHtml(message)}</span>
            </div>
        `;
    }

    function renderServices(services) {
        if (!services.length) {
            showError('Aucun service disponible pour le moment.');
            return;
        }

        grid.innerHTML = services.map(renderCard).join('');

        requestAnimationFrame(() => {
            grid.querySelectorAll('.service-card').forEach((card, index) => {
                card.style.animationDelay = `${index * 0.08}s`;
                card.classList.add('service-card--visible');
            });
        });
    }

    async function loadServices() {
        showLoading();

        try {
            const response = await fetch('services.json', { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const list = Array.isArray(data.services) ? data.services : [];
            renderServices(list);
        } catch {
            showError(
                'Impossible de charger les services. Ouvrez le site via un serveur local (Live Server, npx serve, etc.).'
            );
        }
    }

    loadServices();
})();
