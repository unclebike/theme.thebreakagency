/**
 * Google Form Integration
 * 
 * Detects Ghost URL cards containing Google Form links and transforms them
 * into styled, themed forms that submit directly to Google Forms.
 * 
 * Usage:
 * 1. In Ghost editor, add a URL card with a Google Form link
 * 2. The form will be automatically detected and rendered with theme styling
 * 3. Submissions go directly to Google Forms
 * 
 * Configuration (optional data attributes on a following HTML card):
 * - data-success-redirect="/thank-you" - Redirect after successful submission
 * - data-success-message="Custom message" - Custom success text
 */

(function() {
    'use strict';

    // API endpoint for fetching form structure
    const API_BASE = 'https://thebreaksales.ca/api';
    
    // Default messages
    const DEFAULT_SUCCESS_MESSAGE = 'Thanks! Your response has been recorded.';
    const DEFAULT_SUBMIT_TEXT = 'Submit';
    const LOADING_TEXT = 'Submitting...';

    /**
     * Initialize Google Forms integration
     */
    function initGoogleForms() {
        // Find all bookmark cards (URL cards render as .kg-bookmark-card)
        const bookmarkCards = document.querySelectorAll('.kg-bookmark-card');
        
        bookmarkCards.forEach(card => {
            const link = card.querySelector('a.kg-bookmark-container');
            if (!link) return;
            
            const href = link.getAttribute('href');
            if (!href || !isGoogleFormUrl(href)) return;
            
            // This is a Google Form - transform it
            transformGoogleFormCard(card, href);
        });
    }

    /**
     * Check if a URL is a Google Form
     */
    function isGoogleFormUrl(url) {
        return url && url.includes('docs.google.com/forms');
    }

    /**
     * Transform a bookmark card into a Google Form
     */
    async function transformGoogleFormCard(card, formUrl) {
        // Get configuration from next sibling if it's an HTML card with data attributes
        const config = getFormConfig(card);
        
        // Show loading state
        showLoadingState(card);
        
        try {
            // Fetch form structure from worker
            const formData = await fetchFormStructure(formUrl);
            
            // Render the form
            renderForm(card, formData, config);
            
        } catch (error) {
            console.error('Failed to load Google Form:', error);
            // Fallback to iframe
            showFallback(card, formUrl);
        }
    }

    /**
     * Get configuration from adjacent HTML card if present
     */
    function getFormConfig(card) {
        const config = {
            successRedirect: null,
            successMessage: DEFAULT_SUCCESS_MESSAGE,
            submitText: DEFAULT_SUBMIT_TEXT,
        };
        
        // Check next sibling for config
        const nextEl = card.nextElementSibling;
        if (nextEl && nextEl.classList.contains('kg-html-card')) {
            const configEl = nextEl.querySelector('[data-google-form-config]');
            if (configEl) {
                config.successRedirect = configEl.dataset.successRedirect || null;
                config.successMessage = configEl.dataset.successMessage || DEFAULT_SUCCESS_MESSAGE;
                config.submitText = configEl.dataset.submitText || DEFAULT_SUBMIT_TEXT;
                // Hide the config card
                nextEl.style.display = 'none';
            }
        }
        
        return config;
    }

    /**
     * Fetch form structure from worker API
     */
    async function fetchFormStructure(formUrl) {
        const response = await fetch(`${API_BASE}/google-form?url=${encodeURIComponent(formUrl)}`);
        
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to fetch form');
        }
        
        return response.json();
    }

    /**
     * Show loading state (skeleton shimmer)
     */
    function showLoadingState(card) {
        card.classList.add('google-form-loading');
        card.innerHTML = `
            <div class="google-form-skeleton">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-field"></div>
                <div class="skeleton skeleton-field"></div>
                <div class="skeleton skeleton-field"></div>
                <div class="skeleton skeleton-button"></div>
            </div>
        `;
    }

    /**
     * Render the form with theme styling
     */
    function renderForm(card, formData, config) {
        card.classList.remove('google-form-loading');
        card.classList.add('google-form-card');
        
        // Build form HTML
        const formHtml = buildFormHtml(formData, config);
        card.innerHTML = formHtml;
        
        // Setup form submission
        const form = card.querySelector('form');
        if (form) {
            setupFormSubmission(form, formData.submitUrl, config);
        }
    }

    /**
     * Build HTML for the form
     */
    function buildFormHtml(formData, config) {
        const fieldsHtml = formData.fields.map(field => buildFieldHtml(field)).join('');
        
        // Show skipped fields notice if any
        const skippedNotice = formData.skippedFields && formData.skippedFields.length > 0
            ? `<p class="google-form-notice">Note: Some fields are not supported and have been omitted.</p>`
            : '';
        
        return `
            <form class="google-form" novalidate>
                <div class="google-form-header">
                    <h3 class="google-form-title">${escapeHtml(formData.title)}</h3>
                    ${formData.description ? `<p class="google-form-description">${escapeHtml(formData.description)}</p>` : ''}
                </div>
                <div class="google-form-fields">
                    ${fieldsHtml}
                </div>
                ${skippedNotice}
                <div class="google-form-submit">
                    <button type="submit" class="google-form-btn">
                        <span class="btn-text">${escapeHtml(config.submitText)}</span>
                    </button>
                </div>
            </form>
        `;
    }

    /**
     * Build HTML for a single field
     */
    function buildFieldHtml(field) {
        const requiredMark = field.required ? '<span class="required">*</span>' : '';
        const requiredAttr = field.required ? 'required' : '';
        
        let inputHtml = '';
        
        switch (field.type) {
            case 'text':
                inputHtml = `
                    <input type="text" 
                           name="${escapeHtml(field.id)}" 
                           id="${escapeHtml(field.id)}"
                           ${requiredAttr}
                           class="google-form-input">
                `;
                break;
                
            case 'textarea':
                inputHtml = `
                    <textarea name="${escapeHtml(field.id)}" 
                              id="${escapeHtml(field.id)}"
                              ${requiredAttr}
                              class="google-form-textarea"
                              rows="4"></textarea>
                `;
                break;
                
            case 'radio':
                inputHtml = buildRadioGroup(field);
                break;
                
            case 'checkbox':
                inputHtml = buildCheckboxGroup(field);
                break;
                
            case 'dropdown':
                inputHtml = buildDropdown(field);
                break;
                
            case 'date':
                inputHtml = `
                    <input type="date" 
                           name="${escapeHtml(field.id)}" 
                           id="${escapeHtml(field.id)}"
                           ${requiredAttr}
                           class="google-form-input google-form-date">
                `;
                break;
                
            case 'time':
                inputHtml = `
                    <input type="time" 
                           name="${escapeHtml(field.id)}" 
                           id="${escapeHtml(field.id)}"
                           ${requiredAttr}
                           class="google-form-input google-form-time">
                `;
                break;
                
            default:
                inputHtml = `
                    <input type="text" 
                           name="${escapeHtml(field.id)}" 
                           id="${escapeHtml(field.id)}"
                           ${requiredAttr}
                           class="google-form-input">
                `;
        }
        
        return `
            <div class="google-form-field" data-type="${field.type}">
                <label for="${escapeHtml(field.id)}" class="google-form-label">
                    ${escapeHtml(field.label)} ${requiredMark}
                </label>
                ${field.description ? `<p class="google-form-field-description">${escapeHtml(field.description)}</p>` : ''}
                ${inputHtml}
            </div>
        `;
    }

    /**
     * Build radio button group
     */
    function buildRadioGroup(field) {
        if (!field.options || field.options.length === 0) {
            return '<p class="google-form-error">No options available</p>';
        }
        
        const requiredAttr = field.required ? 'required' : '';
        
        const optionsHtml = field.options.map((option, index) => `
            <label class="google-form-radio-label">
                <input type="radio" 
                       name="${escapeHtml(field.id)}" 
                       value="${escapeHtml(option)}"
                       ${requiredAttr}
                       class="google-form-radio">
                <span class="google-form-radio-text">${escapeHtml(option)}</span>
            </label>
        `).join('');
        
        return `<div class="google-form-radio-group">${optionsHtml}</div>`;
    }

    /**
     * Build checkbox group
     */
    function buildCheckboxGroup(field) {
        if (!field.options || field.options.length === 0) {
            return '<p class="google-form-error">No options available</p>';
        }
        
        const optionsHtml = field.options.map((option, index) => `
            <label class="google-form-checkbox-label">
                <input type="checkbox" 
                       name="${escapeHtml(field.id)}" 
                       value="${escapeHtml(option)}"
                       class="google-form-checkbox">
                <span class="google-form-checkbox-text">${escapeHtml(option)}</span>
            </label>
        `).join('');
        
        return `<div class="google-form-checkbox-group">${optionsHtml}</div>`;
    }

    /**
     * Build dropdown select
     */
    function buildDropdown(field) {
        if (!field.options || field.options.length === 0) {
            return '<p class="google-form-error">No options available</p>';
        }
        
        const requiredAttr = field.required ? 'required' : '';
        
        const optionsHtml = field.options.map(option => `
            <option value="${escapeHtml(option)}">${escapeHtml(option)}</option>
        `).join('');
        
        return `
            <select name="${escapeHtml(field.id)}" 
                    id="${escapeHtml(field.id)}"
                    ${requiredAttr}
                    class="google-form-select">
                <option value="">Select...</option>
                ${optionsHtml}
            </select>
        `;
    }

    /**
     * Setup form submission handler
     */
    function setupFormSubmission(form, submitUrl, config) {
        const submitBtn = form.querySelector('.google-form-btn');
        const btnText = submitBtn?.querySelector('.btn-text');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Validate form
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            // Show loading state
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add('loading');
                if (btnText) btnText.textContent = LOADING_TEXT;
            }
            
            try {
                // Collect form data
                const formData = new FormData(form);
                
                // Submit to Google Forms
                // Note: Google Forms doesn't support CORS, so we use no-cors mode
                // This means we can't read the response, but the submission will work
                await fetch(submitUrl, {
                    method: 'POST',
                    body: formData,
                    mode: 'no-cors',
                });
                
                // Show success
                showSuccess(form.closest('.google-form-card'), config);
                
            } catch (error) {
                console.error('Form submission failed:', error);
                
                // Show error state
                if (submitBtn) {
                    submitBtn.classList.remove('loading');
                    submitBtn.classList.add('error');
                    if (btnText) btnText.textContent = 'Error - try again';
                    
                    // Reset after 3 seconds
                    setTimeout(() => {
                        submitBtn.disabled = false;
                        submitBtn.classList.remove('error');
                        if (btnText) btnText.textContent = config.submitText;
                    }, 3000);
                }
            }
        });
    }

    /**
     * Show success state
     */
    function showSuccess(container, config) {
        // If redirect configured, navigate
        if (config.successRedirect) {
            window.location.href = config.successRedirect;
            return;
        }
        
        // Show success message inline
        container.classList.add('google-form-success');
        container.innerHTML = `
            <div class="google-form-success-content">
                <div class="google-form-success-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                </div>
                <p class="google-form-success-message">${escapeHtml(config.successMessage)}</p>
            </div>
        `;
    }

    /**
     * Show iframe fallback
     */
    function showFallback(container, formUrl) {
        container.classList.remove('google-form-loading');
        container.classList.add('google-form-fallback');
        
        // Ensure URL has /viewform
        let embedUrl = formUrl;
        if (!embedUrl.includes('/viewform')) {
            embedUrl = embedUrl.replace(/\/edit.*$/, '/viewform');
            if (!embedUrl.includes('/viewform')) {
                embedUrl = embedUrl + '/viewform';
            }
        }
        // Add embedded parameter
        embedUrl = embedUrl.includes('?') 
            ? embedUrl + '&embedded=true'
            : embedUrl + '?embedded=true';
        
        container.innerHTML = `
            <div class="google-form-fallback-wrapper">
                <iframe src="${escapeHtml(embedUrl)}" 
                        class="google-form-iframe"
                        frameborder="0" 
                        marginheight="0" 
                        marginwidth="0">
                    Loading...
                </iframe>
            </div>
        `;
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGoogleForms);
    } else {
        initGoogleForms();
    }
})();
