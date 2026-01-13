/**
 * Google Form Integration with Multi-Step Flow Support
 * 
 * Detects Ghost URL cards containing Google Form links and transforms them
 * into styled, themed forms that submit directly to Google Forms.
 * 
 * Features:
 * - Single form: renders standalone (no progress indicator)
 * - Multiple consecutive forms: creates a flow with progress indicator
 * - Buttons after forms: shown after final form submission
 * - Content between forms: revealed as user progresses
 * - Separator breaks the chain into independent flows
 * 
 * Usage:
 * 1. Create a page using the "Google Form" template
 * 2. Add URL cards with Google Form links
 * 3. Optionally add button cards after forms (shown on completion)
 * 4. Use separator (horizontal rule) to break forms into independent groups
 */

(function() {
    'use strict';

    // API endpoint for fetching form structure
    const API_BASE = 'https://thebreaksales.ca/api';
    
    // Default messages
    const DEFAULT_SUCCESS_MESSAGE = 'Thanks! Your response has been recorded.';
    const DEFAULT_COMPLETION_MESSAGE = 'Thank you for completing all forms!';
    const DEFAULT_SUBMIT_TEXT = 'Submit';
    const LOADING_TEXT = 'Submitting...';

    /**
     * Initialize Google Forms integration
     */
    function initGoogleForms() {
        const container = document.querySelector('.google-form-container');
        if (!container) return;
        
        // Detect and process form flows
        const flows = detectFormFlows(container);
        
        // Initialize each flow
        flows.forEach(flow => initializeFlow(flow));
    }

    /**
     * Check if an element is a Google Form bookmark card
     */
    function isGoogleFormBookmark(element) {
        if (!element.classList.contains('kg-bookmark-card')) return false;
        const link = element.querySelector('a.kg-bookmark-container');
        if (!link) return false;
        const href = link.getAttribute('href');
        return href && href.includes('docs.google.com/forms');
    }

    /**
     * Extract Google Form URL from a bookmark card
     */
    function extractGoogleFormUrl(element) {
        const link = element.querySelector('a.kg-bookmark-container');
        return link ? link.getAttribute('href') : null;
    }

    /**
     * Detect form flows in the container
     * Groups consecutive Google Form bookmarks, collects trailing buttons,
     * and tracks interstitial content. Separators break the chain.
     */
    function detectFormFlows(container) {
        const elements = Array.from(container.children);
        const flows = [];
        let currentFlow = null;
        
        for (const element of elements) {
            const isGoogleForm = isGoogleFormBookmark(element);
            const isButton = element.classList.contains('kg-button-card');
            const isSeparator = element.classList.contains('kg-divider-card');
            
            if (isSeparator) {
                // Separator breaks the chain
                if (currentFlow && currentFlow.forms.length > 0) {
                    flows.push(currentFlow);
                }
                currentFlow = null;
                // Separator stays visible, not part of any flow
                continue;
            }
            
            if (isGoogleForm) {
                if (!currentFlow) {
                    currentFlow = {
                        id: 'flow-' + Math.random().toString(36).substr(2, 9),
                        forms: [],
                        buttons: [],
                        pendingContent: [],
                        allElements: [] // Track all elements in order for proper sequencing
                    };
                }
                
                // If we have pending content, add it before this form
                if (currentFlow.pendingContent.length > 0) {
                    currentFlow.allElements.push({
                        type: 'content',
                        elements: [...currentFlow.pendingContent]
                    });
                    currentFlow.pendingContent = [];
                }
                
                // Hide all forms except the first one in the flow
                // (first form will be shown via loading state)
                if (currentFlow.forms.length > 0) {
                    element.classList.add('google-form-flow-hidden');
                }
                
                // Add the form
                const formStep = {
                    type: 'form',
                    element: element,
                    formUrl: extractGoogleFormUrl(element),
                    formData: null,
                    state: 'pending'
                };
                currentFlow.forms.push(formStep);
                currentFlow.allElements.push(formStep);
            }
            else if (isButton && currentFlow && currentFlow.forms.length > 0) {
                // Button after form(s) - collect for end
                currentFlow.buttons.push(element);
                // Hide button initially
                element.classList.add('google-form-flow-hidden');
            }
            else if (currentFlow && currentFlow.forms.length > 0) {
                // Other content between forms - save for later reveal
                currentFlow.pendingContent.push(element);
                // Hide initially
                element.classList.add('google-form-flow-hidden');
            }
            // If no current flow, element renders normally (independent)
        }
        
        // Don't forget the last flow
        if (currentFlow && currentFlow.forms.length > 0) {
            // Add any remaining pending content
            if (currentFlow.pendingContent.length > 0) {
                currentFlow.allElements.push({
                    type: 'content',
                    elements: [...currentFlow.pendingContent]
                });
            }
            flows.push(currentFlow);
        }
        
        return flows;
    }

    /**
     * Initialize a form flow
     */
    async function initializeFlow(flow) {
        const totalForms = flow.forms.length;
        const isMultiStep = totalForms > 1 || flow.buttons.length > 0;
        
        // Set first form as active
        flow.forms[0].state = 'active';
        flow.currentFormIndex = 0;
        
        // Show loading state on first form
        showLoadingState(flow.forms[0].element);
        
        // Fetch all form structures in parallel
        try {
            const formDataPromises = flow.forms.map(step => 
                fetchFormStructure(step.formUrl)
            );
            const formDataResults = await Promise.all(formDataPromises);
            
            // Store form data
            formDataResults.forEach((data, index) => {
                flow.forms[index].formData = data;
            });
            
            // Render the first form
            renderFormStep(flow, 0, isMultiStep, totalForms);
            
        } catch (error) {
            console.error('Failed to load form flow:', error);
            // Show fallback for first form
            showFallback(flow.forms[0].element, flow.forms[0].formUrl);
        }
    }

    /**
     * Render a form step
     */
    function renderFormStep(flow, stepIndex, isMultiStep, totalForms) {
        const step = flow.forms[stepIndex];
        const element = step.element;
        const formData = step.formData;
        
        if (!formData) {
            showFallback(element, step.formUrl);
            return;
        }
        
        // Unhide if this was a hidden pending form
        element.classList.remove('google-form-flow-hidden');
        element.classList.remove('google-form-loading');
        element.classList.add('google-form-card');
        element.classList.add('google-form-card--active');
        
        // Build form HTML with optional progress indicator
        const progressHtml = isMultiStep 
            ? `<div class="google-form-progress">Step ${stepIndex + 1} of ${totalForms}</div>`
            : '';
        
        const fieldsHtml = formData.fields.map(field => buildFieldHtml(field)).join('');
        
        element.innerHTML = `
            ${progressHtml}
            <form class="google-form" novalidate>
                <div class="google-form-header">
                    <h3 class="google-form-title">${escapeHtml(formData.title)}</h3>
                    ${formData.description ? `<p class="google-form-description">${escapeHtml(formData.description)}</p>` : ''}
                </div>
                <div class="google-form-fields">
                    ${fieldsHtml}
                </div>
                <div class="google-form-submit">
                    <button type="submit" class="google-form-btn">
                        <span class="btn-text">${escapeHtml(DEFAULT_SUBMIT_TEXT)}</span>
                    </button>
                </div>
            </form>
        `;
        
        // Setup form submission
        const form = element.querySelector('form');
        setupFormSubmission(form, formData.submitUrl, flow, stepIndex);
    }

    /**
     * Setup form submission handler
     */
    function setupFormSubmission(form, submitUrl, flow, stepIndex) {
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
                // Collect form data and convert to URL-encoded string
                const formData = new FormData(form);
                const urlEncodedData = new URLSearchParams(formData).toString();
                
                // Submit to Google Forms (no-cors mode with URL-encoded data)
                await fetch(submitUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: urlEncodedData,
                });
                
                // Handle step completion
                completeStep(flow, stepIndex);
                
            } catch (error) {
                console.error('Form submission failed:', error);
                
                // Show error state
                if (submitBtn) {
                    submitBtn.classList.remove('loading');
                    submitBtn.classList.add('error');
                    if (btnText) btnText.textContent = 'Error - try again';
                    
                    setTimeout(() => {
                        submitBtn.disabled = false;
                        submitBtn.classList.remove('error');
                        if (btnText) btnText.textContent = DEFAULT_SUBMIT_TEXT;
                    }, 3000);
                }
            }
        });
    }

    /**
     * Complete a step and progress to next
     */
    function completeStep(flow, stepIndex) {
        const currentStep = flow.forms[stepIndex];
        const totalForms = flow.forms.length;
        const isMultiStep = totalForms > 1 || flow.buttons.length > 0;
        const hasNextForm = stepIndex < totalForms - 1;
        const formTitle = currentStep.formData?.title || 'Form';
        
        // Mark current step as completed
        currentStep.state = 'completed';
        
        // Transform current form to completed card
        renderCompletedCard(currentStep.element, stepIndex + 1, formTitle, isMultiStep);
        
        // Reveal any content that comes after this form (before next form)
        revealContentAfterStep(flow, stepIndex);
        
        if (hasNextForm) {
            // Activate next form
            const nextStep = flow.forms[stepIndex + 1];
            nextStep.state = 'active';
            flow.currentFormIndex = stepIndex + 1;
            
            // Render next form
            renderFormStep(flow, stepIndex + 1, isMultiStep, totalForms);
        } else {
            // All forms completed - show buttons card if we have buttons
            if (flow.buttons.length > 0) {
                renderButtonsCard(flow);
            }
        }
    }

    /**
     * Reveal content elements that come after a step
     */
    function revealContentAfterStep(flow, stepIndex) {
        // Find the position of this form in allElements
        let foundForm = false;
        let formCount = 0;
        
        for (const item of flow.allElements) {
            if (item.type === 'form') {
                if (formCount === stepIndex) {
                    foundForm = true;
                } else if (foundForm && item.type === 'form') {
                    // Hit the next form, stop revealing
                    break;
                }
                formCount++;
            } else if (item.type === 'content' && foundForm) {
                // Reveal this content
                item.elements.forEach(el => {
                    el.classList.remove('google-form-flow-hidden');
                });
                // Stop after revealing content before next form
                break;
            }
        }
    }

    /**
     * Render a completed step card (collapsed)
     */
    function renderCompletedCard(element, stepNumber, title, isMultiStep) {
        element.classList.remove('google-form-card--active');
        element.classList.add('google-form-card--completed');
        
        const stepLabel = isMultiStep ? `Step ${stepNumber} complete` : 'Complete';
        
        element.innerHTML = `
            <div class="google-form-completed-content">
                <div class="google-form-completed-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                </div>
                <div class="google-form-completed-info">
                    <span class="google-form-completed-step">${escapeHtml(stepLabel)}</span>
                    <span class="google-form-completed-title">${escapeHtml(title)}</span>
                </div>
            </div>
        `;
    }

    /**
     * Render the final buttons card (matches completed step card style)
     */
    function renderButtonsCard(flow) {
        // Create buttons card container - use completed card styling
        const buttonsCard = document.createElement('div');
        buttonsCard.className = 'google-form-card google-form-card--completed google-form-buttons-card';
        
        // Build buttons HTML from the collected button cards
        const buttonsHtml = flow.buttons.map(btn => {
            // Extract the button content from the Ghost button card
            const link = btn.querySelector('a.kg-btn');
            if (link) {
                return `<a href="${escapeHtml(link.getAttribute('href'))}" class="google-form-action-btn" target="${link.getAttribute('target') || '_self'}">${escapeHtml(link.textContent)}</a>`;
            }
            return '';
        }).join('');
        
        buttonsCard.innerHTML = `
            <div class="google-form-completed-content google-form-completed-content--with-buttons">
                <div class="google-form-completed-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                </div>
                <div class="google-form-completed-info">
                    <span class="google-form-completed-step">Complete</span>
                    <span class="google-form-completed-title">${escapeHtml(DEFAULT_COMPLETION_MESSAGE)}</span>
                </div>
                <div class="google-form-button-group">
                    ${buttonsHtml}
                </div>
            </div>
        `;
        
        // Insert after the last form
        const lastForm = flow.forms[flow.forms.length - 1].element;
        lastForm.parentNode.insertBefore(buttonsCard, lastForm.nextSibling);
        
        // Remove the original hidden button cards
        flow.buttons.forEach(btn => btn.remove());
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
    function showLoadingState(element) {
        element.classList.add('google-form-loading');
        element.innerHTML = `
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
     * Show iframe fallback
     */
    function showFallback(element, formUrl) {
        element.classList.remove('google-form-loading');
        element.classList.add('google-form-fallback');
        
        let embedUrl = formUrl;
        if (!embedUrl.includes('/viewform')) {
            embedUrl = embedUrl.replace(/\/edit.*$/, '/viewform');
            if (!embedUrl.includes('/viewform')) {
                embedUrl = embedUrl + '/viewform';
            }
        }
        embedUrl = embedUrl.includes('?') 
            ? embedUrl + '&embedded=true'
            : embedUrl + '?embedded=true';
        
        element.innerHTML = `
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
