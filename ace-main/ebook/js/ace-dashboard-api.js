(() => {
  const meta = document.querySelector('meta[name="ace-dashboard-api-base"]');
  const configuredBase = window.ACE_DASHBOARD_API_BASE || meta?.content || 'https://ace-dashboard-praizeokidis-projects.vercel.app';

  window.aceDashboardEndpoint = (path, form) => {
    const base = form?.dataset.dashboardApiBase || configuredBase;
    if (!base) {
      throw new Error('ACE dashboard is not connected yet. Please try again shortly.');
    }
    return `${base.replace(/\/$/, '')}/${String(path).replace(/^\//, '')}`;
  };

  window.addWhatsAppLink = (container, whatsappUrl) => {
    if (!container || !whatsappUrl) return;
    let link = container.querySelector('[data-whatsapp-link]');
    if (!link) {
      link = document.createElement('a');
      link.className = 'button button-whatsapp';
      link.setAttribute('data-whatsapp-link', 'true');
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.innerHTML = 'Continue on WhatsApp <span aria-hidden="true">↗</span>';
      const returnLink = container.querySelector('a.button');
      returnLink?.parentNode?.insertBefore(link, returnLink);
    }
    link.href = whatsappUrl;
    link.hidden = false;
  };
})();
