(() => {
  const form = document.querySelector('#ace-contact-form');
  if (!form) return;
  const status = form.querySelector('[data-contact-status]');
  const button = form.querySelector('button[type="submit"]');
  const originalText = button?.textContent || 'Send Message';
  const success = document.querySelector('[data-contact-success]');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (status) {
      status.textContent = 'Sending…';
      status.className = 'form-status';
    }
    if (button) {
      button.disabled = true;
      button.textContent = 'Sending…';
    }

    try {
      const endpoint = window.aceDashboardEndpoint('/api/contact', form);
      const response = await fetch(endpoint, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || 'The message could not be sent.');

      form.hidden = true;
      if (success) {
        success.hidden = false;
        const reference = success.querySelector('[data-contact-reference]');
        if (reference) reference.textContent = result.reference || 'ACE-CONTACT';
        window.addWhatsAppLink(success, result.whatsappUrl);
        success.focus();
      }
    } catch (error) {
      console.error(error);
      if (status) {
        status.textContent = error instanceof Error ? error.message : 'We could not send your message. Please try again.';
        status.className = 'form-status is-error';
      }
      if (button) {
        button.disabled = false;
        button.textContent = originalText;
      }
    }
  });
})();
