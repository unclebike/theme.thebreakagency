/**
 * Order Form - Product Card Transformer
 * 
 * Converts Ghost product cards into interactive size/quantity selectors.
 * 
 * Usage:
 * 1. Create a page using the "Order Form" template
 * 2. Add product cards in Ghost editor
 * 3. Set button text to comma-separated sizes: "XS,S,M,L,XL"
 * 4. Set button URL to product ID: "#SKU-12345"
 * 5. Add #H to force horizontal layout: "#SKU-12345#H"
 * 6. Add #SQ for small square card (one-size items): "#SKU-12345#SQ"
 * 7. Add a kg-button card at the end with the Formspree URL as href
 * 
 * Layout:
 * - Odd number of cards: last card auto-becomes horizontal
 * - Use #H flag to force any card horizontal
 * - Use #SQ flag for compact one-size items (smaller square)
 * 
 * Draft Saving (for logged-in members):
 * - Save Draft button appears for logged-in Ghost members
 * - Drafts are stored in Cloudflare KV, keyed by member UUID + page slug
 * - Drafts auto-load when returning to the page
 */

(function() {
    'use strict';

    const API_BASE = 'https://thebreaksales.ca/api';

    function initOrderForm() {
        const form = document.querySelector('.order-form');
        if (!form) return;

        // Get member info from data attributes (set by Handlebars template)
        const memberUuid = form.dataset.memberUuid;
        const memberEmail = form.dataset.memberEmail;
        const memberName = form.dataset.memberName;
        const pageSlug = form.dataset.pageSlug;
        const isLoggedIn = !!memberUuid;

        const productCards = Array.from(form.querySelectorAll('.kg-product-card'));
        
        // Determine which cards should be horizontal or small square
        const cardFlags = detectCardFlags(productCards);

        productCards.forEach((card, index) => {
            transformProductCard(card, cardFlags[index]);
        });

        // Setup custom lightbox that loads full image on demand
        setupLightbox(form);

        if (isLoggedIn) {
            // Logged-in user: full order functionality
            setupSubmitButton(form, memberUuid, pageSlug);
            setupDraftButtons(form, memberUuid, pageSlug);
            
            // Pre-fill member info if available
            if (memberEmail) {
                const emailInput = form.querySelector('[name="email"]');
                if (emailInput && !emailInput.value) emailInput.value = memberEmail;
            }
            if (memberName) {
                const nameInput = form.querySelector('[name="name"]');
                if (nameInput && !nameInput.value) nameInput.value = memberName;
            }
            // Auto-load saved draft
            loadDraft(form, memberUuid, pageSlug);
            
            // Add hidden fields for member tracking
            addHiddenField(form, '_member_uuid', memberUuid);
            if (pageSlug) {
                addHiddenField(form, '_page_slug', pageSlug);
            }
        } else {
            // Non-logged-in user: signup flow
            setupSignupButtons(form);
        }
    }

    function addHiddenField(form, name, value) {
        let field = form.querySelector(`[name="${name}"]`);
        if (!field) {
            field = document.createElement('input');
            field.type = 'hidden';
            field.name = name;
            form.appendChild(field);
        }
        field.value = value;
    }

    /**
     * Simple lightbox for product images - uses already-loaded full-size image
     */
    function setupLightbox(form) {
        const images = form.querySelectorAll('.kg-product-card-image');
        if (!images.length) return;
        
        // Create lightbox overlay
        const overlay = document.createElement('div');
        overlay.className = 'order-form-lightbox';
        overlay.innerHTML = `
            <div class="lightbox-backdrop"></div>
            <div class="lightbox-content">
                <img class="lightbox-img" src="" alt="">
            </div>
        `;
        document.body.appendChild(overlay);
        
        const backdrop = overlay.querySelector('.lightbox-backdrop');
        const lightboxImg = overlay.querySelector('.lightbox-img');
        
        // Close on backdrop click or escape
        backdrop.addEventListener('click', closeLightbox);
        lightboxImg.addEventListener('click', closeLightbox);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.classList.contains('active')) {
                closeLightbox();
            }
        });
        
        function closeLightbox() {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            setTimeout(() => {
                lightboxImg.src = '';
            }, 300);
        }
        
        function openLightbox(img) {
            lightboxImg.src = img.src;
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
        // Attach click handlers to images
        images.forEach(img => {
            img.addEventListener('click', () => openLightbox(img));
        });
    }

    function setupSubmitButton(form, memberUuid, pageSlug) {
        const submitButton = form.querySelector('.kg-button-card .kg-btn');
        if (!submitButton) return;

        submitButton.closest('.kg-button-card').classList.add('order-form-submit-card');

        // Config
        const defaultText = 'Send Order';
        const successText = 'Success!';
        const sendingText = 'Sending...';
        const errorText = 'Error';

        // Wrap submit button text for state changes
        submitButton.textContent = '';
        const btnTextEl = document.createElement('span');
        btnTextEl.className = 'submit-btn-text';
        btnTextEl.textContent = defaultText;
        submitButton.appendChild(btnTextEl);
        submitButton.classList.add('order-form-submit-btn');

        // Store references on form for other functions to use
        form._submitBtn = submitButton;
        form._submitBtnTextEl = btnTextEl;
        form._submitDefaultText = defaultText;

        // Function to reset submit button state
        function resetSubmitBtnState() {
            submitButton.classList.remove('success', 'error');
            btnTextEl.textContent = defaultText;
        }

        // Listen for quantity changes to reset success/error state
        form.addEventListener('input', (e) => {
            if (e.target.classList.contains('qty-input')) {
                resetSubmitBtnState();
            }
        });
        form.addEventListener('click', (e) => {
            if (e.target.classList.contains('qty-btn')) {
                resetSubmitBtnState();
            }
        });

        // Wire up the button to submit the form via AJAX
        submitButton.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Basic validation before submit
            const name = form.querySelector('[name="name"]');
            const email = form.querySelector('[name="email"]');
            
            if (name && !name.value.trim()) {
                name.focus();
                return;
            }
            if (email && !email.value.trim()) {
                email.focus();
                return;
            }
            
            // Check if at least one product is selected
            const qtyInputs = form.querySelectorAll('.qty-input');
            let hasItems = false;
            qtyInputs.forEach(input => {
                if (parseInt(input.value) > 0) hasItems = true;
            });
            
            if (!hasItems) {
                alert('Please select at least one item.');
                return;
            }

            // Show sending state
            submitButton.disabled = true;
            submitButton.classList.remove('success', 'error');
            submitButton.classList.add('sending');
            btnTextEl.textContent = sendingText;

            try {
                // Collect form data
                const formData = new FormData(form);
                const data = {};
                formData.forEach((value, key) => {
                    data[key] = value;
                });

                // Submit to API
                const response = await fetch(`${API_BASE}/order`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                if (!response.ok) {
                    throw new Error('Order submission failed');
                }

                // Success!
                submitButton.classList.remove('sending');
                submitButton.classList.add('success');
                btnTextEl.textContent = successText;
                
                // Delete draft after successful order (for logged-in users)
                if (memberUuid && pageSlug) {
                    try {
                        await fetch(`${API_BASE}/draft/delete`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ memberUuid, pageSlug }),
                        });
                    } catch (e) {
                        // Ignore draft deletion errors
                    }
                }

            } catch (error) {
                console.error('Order submission failed:', error);
                submitButton.classList.remove('sending');
                submitButton.classList.add('error');
                btnTextEl.textContent = errorText;
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    /**
     * Setup Save Draft button for logged-in members
     */
    function setupDraftButtons(form, memberUuid, pageSlug) {
        const submitCard = form.querySelector('.order-form-submit-card');
        if (!submitCard) return;

        // Save Draft button config
        const saveDraftText = 'Save Draft';
        const saveDraftSuccessText = 'Success!';
        const saveDraftSavingText = 'Saving...';

        // Create save draft button
        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'kg-btn order-form-save-btn';
        saveBtn.innerHTML = `<span class="save-btn-text">${saveDraftText}</span>`;
        
        const saveBtnTextEl = saveBtn.querySelector('.save-btn-text');
        
        // Insert save button before submit button
        const submitBtn = form._submitBtn;
        if (submitBtn) {
            submitBtn.parentNode.insertBefore(saveBtn, submitBtn);
        }

        // Mark form as having draft capability
        form.classList.add('has-draft-capability');

        // Function to reset Save Draft button to default state
        function resetSaveBtnState() {
            saveBtn.classList.remove('success', 'restored');
            saveBtnTextEl.textContent = saveDraftText;
        }

        // Listen for quantity changes to reset Save Draft button state
        form.addEventListener('input', (e) => {
            if (e.target.classList.contains('qty-input')) {
                resetSaveBtnState();
            }
        });

        // Also reset on +/- button clicks
        form.addEventListener('click', (e) => {
            if (e.target.classList.contains('qty-btn')) {
                resetSaveBtnState();
            }
        });

        // Save draft click handler
        saveBtn.addEventListener('click', async () => {
            saveBtn.disabled = true;
            saveBtn.classList.remove('success', 'restored');
            saveBtn.classList.add('saving');
            saveBtnTextEl.textContent = saveDraftSavingText;

            try {
                await saveDraft(form, memberUuid, pageSlug);
                saveBtn.classList.remove('saving');
                saveBtn.classList.add('success');
                saveBtnTextEl.textContent = saveDraftSuccessText;
                form.classList.add('draft-saved');
                // Success state persists until quantity changes
            } catch (error) {
                console.error('Failed to save draft:', error);
                saveBtn.classList.remove('saving');
                saveBtnTextEl.textContent = saveDraftText;
                // Show error state
                saveBtn.classList.add('error');
            } finally {
                saveBtn.disabled = false;
            }
        });

        // Store references for loadDraft to use
        form._saveDraftBtn = saveBtn;
        form._saveDraftBtnTextEl = saveBtnTextEl;
    }

    /**
     * Setup signup buttons for non-logged-in users
     * Adds bottom signup/login buttons and wires up Ghost member signup/signin
     */
    function setupSignupButtons(form) {
        // Hide the submit button card (from Ghost editor) for non-logged-in users
        const submitCard = form.querySelector('.kg-button-card');
        if (submitCard) {
            submitCard.style.display = 'none';
        }
        
        // Get existing buttons in customer info section
        const topSignupBtn = form.querySelector('.order-form-signup-btn');
        const topLoginBtn = form.querySelector('.order-form-login-btn');
        
        // Create bottom button card (after product catalog)
        const bottomBtnCard = document.createElement('div');
        bottomBtnCard.className = 'order-form-signup-card';
        bottomBtnCard.innerHTML = `
            <button type="button" class="order-form-signup-btn">Sign Up to Order</button>
            <button type="button" class="order-form-login-btn" style="display: none;">Login as Purchaser</button>
        `;
        form.appendChild(bottomBtnCard);
        
        const bottomSignupBtn = bottomBtnCard.querySelector('.order-form-signup-btn');
        const bottomLoginBtn = bottomBtnCard.querySelector('.order-form-login-btn');
        
        const nameInput = form.querySelector('[name="name"]');
        const emailInput = form.querySelector('[name="email"]');
        
        // Show/hide login button based on name field content
        function updateButtonVisibility() {
            const hasName = nameInput?.value.trim().length > 0;
            const hasEmail = emailInput?.value.trim().length > 0;
            
            // Show login button only when email has content but name is empty
            const showLogin = hasEmail && !hasName;
            
            if (topLoginBtn) {
                topLoginBtn.style.display = showLogin ? '' : 'none';
            }
            if (bottomLoginBtn) {
                bottomLoginBtn.style.display = showLogin ? '' : 'none';
            }
        }
        
        // Listen to input changes
        nameInput?.addEventListener('input', updateButtonVisibility);
        emailInput?.addEventListener('input', updateButtonVisibility);
        
        // Signup handler - uses Ghost's member signup (requires name + email)
        async function handleSignup(btn) {
            const name = nameInput?.value.trim();
            const email = emailInput?.value.trim();
            
            if (!name) {
                nameInput?.focus();
                return;
            }
            if (!email) {
                emailInput?.focus();
                return;
            }
            
            // Validate email format
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                emailInput?.focus();
                return;
            }
            
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Signing up...';
            btn.classList.remove('success', 'error');
            
            try {
                // Use Ghost's member signup API
                const response = await fetch('/members/api/send-magic-link/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: name,
                        email: email,
                        requestSrc: window.location.href,
                    }),
                });
                
                if (!response.ok) {
                    throw new Error('Signup failed');
                }
                
                // Success - show confirmation on all buttons
                showSuccessState([topSignupBtn, bottomSignupBtn, topLoginBtn, bottomLoginBtn]);
                
            } catch (error) {
                console.error('Signup failed:', error);
                showErrorState(btn, originalText);
            }
        }
        
        // Login handler - uses Ghost's signin magic link (email only)
        async function handleLogin(btn) {
            const email = emailInput?.value.trim();
            
            if (!email) {
                emailInput?.focus();
                return;
            }
            
            // Validate email format
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                emailInput?.focus();
                return;
            }
            
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Sending...';
            btn.classList.remove('success', 'error');
            
            try {
                // Use Ghost's signin magic link API
                const response = await fetch('/members/api/send-magic-link/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email,
                        emailType: 'signin',
                        requestSrc: window.location.href,
                    }),
                });
                
                if (!response.ok) {
                    throw new Error('Login failed');
                }
                
                // Success - show confirmation on all buttons
                showSuccessState([topSignupBtn, bottomSignupBtn, topLoginBtn, bottomLoginBtn]);
                
            } catch (error) {
                console.error('Login failed:', error);
                showErrorState(btn, originalText);
            }
        }
        
        // Helper to show success state on multiple buttons
        function showSuccessState(buttons) {
            buttons.forEach(btn => {
                if (btn) {
                    btn.classList.add('success');
                    btn.textContent = 'Check your email!';
                    btn.disabled = true;
                }
            });
        }
        
        // Helper to show error state with reset
        function showErrorState(btn, originalText) {
            btn.classList.add('error');
            btn.textContent = 'Error - try again';
            btn.disabled = false;
            
            // Reset after 3 seconds
            setTimeout(() => {
                btn.classList.remove('error');
                btn.textContent = originalText;
            }, 3000);
        }
        
        // Wire up signup buttons
        if (topSignupBtn) {
            topSignupBtn.addEventListener('click', () => handleSignup(topSignupBtn));
        }
        bottomSignupBtn.addEventListener('click', () => handleSignup(bottomSignupBtn));
        
        // Wire up login buttons
        if (topLoginBtn) {
            topLoginBtn.addEventListener('click', () => handleLogin(topLoginBtn));
        }
        bottomLoginBtn.addEventListener('click', () => handleLogin(bottomLoginBtn));
    }

    /**
     * Collect form data for saving as draft
     */
    function collectFormData(form) {
        const customer = {
            name: form.querySelector('[name="name"]')?.value || '',
            email: form.querySelector('[name="email"]')?.value || '',
            phone: form.querySelector('[name="phone"]')?.value || '',
            address: form.querySelector('[name="address"]')?.value || '',
            city: form.querySelector('[name="city"]')?.value || '',
            province: form.querySelector('[name="province"]')?.value || '',
            postalCode: form.querySelector('[name="postal_code"]')?.value || '',
            notes: form.querySelector('[name="notes"]')?.value || '',
        };

        // Collect all quantity inputs
        const products = {};
        form.querySelectorAll('.qty-input').forEach(input => {
            const qty = parseInt(input.value) || 0;
            if (qty > 0) {
                products[input.name] = qty;
            }
        });

        return { customer, products };
    }

    /**
     * Save draft to Cloudflare KV via worker
     */
    async function saveDraft(form, memberUuid, pageSlug) {
        const { customer, products } = collectFormData(form);

        const response = await fetch(`${API_BASE}/draft/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                memberUuid,
                pageSlug,
                customer,
                products,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to save draft');
        }

        return response.json();
    }

    /**
     * Load draft from Cloudflare KV and populate form
     */
    async function loadDraft(form, memberUuid, pageSlug) {
        try {
            const response = await fetch(
                `${API_BASE}/draft/load?memberUuid=${encodeURIComponent(memberUuid)}&pageSlug=${encodeURIComponent(pageSlug)}`
            );

            if (!response.ok) return;

            const data = await response.json();
            if (!data.found || !data.draft) return;

            const { customer, products } = data.draft;

            // Populate customer fields (don't overwrite if already filled)
            if (customer) {
                setFieldIfEmpty(form, 'name', customer.name);
                setFieldIfEmpty(form, 'email', customer.email);
                setFieldIfEmpty(form, 'phone', customer.phone);
                setFieldIfEmpty(form, 'address', customer.address);
                setFieldIfEmpty(form, 'city', customer.city);
                setFieldIfEmpty(form, 'province', customer.province);
                setFieldIfEmpty(form, 'postal_code', customer.postalCode);
                setFieldIfEmpty(form, 'notes', customer.notes);
            }

            // Populate product quantities
            if (products) {
                Object.entries(products).forEach(([fieldName, qty]) => {
                    const input = form.querySelector(`[name="${fieldName}"]`);
                    if (input) {
                        input.value = qty;
                        // Update row state to show highlight
                        const row = input.closest('.size-qty-row');
                        if (row) updateRowState(row, qty);
                    }
                });
            }

            // Show loaded indicator
            form.classList.add('draft-loaded');
            
            // Show restored state on Save Draft button (orange, temporary)
            const saveBtn = form._saveDraftBtn;
            const saveBtnTextEl = form._saveDraftBtnTextEl;
            if (saveBtn && saveBtnTextEl) {
                saveBtn.classList.add('restored');
                saveBtnTextEl.textContent = 'Draft Restored';
                // Reset after 3 seconds
                setTimeout(() => {
                    saveBtn.classList.remove('restored');
                    saveBtnTextEl.textContent = 'Save Draft';
                }, 3000);
            }

        } catch (error) {
            console.error('Failed to load draft:', error);
        }
    }

    function setFieldIfEmpty(form, name, value) {
        if (!value) return;
        const field = form.querySelector(`[name="${name}"]`);
        if (field && !field.value) {
            field.value = value;
        }
    }

    function detectCardFlags(cards) {
        const flags = cards.map(card => {
            const buttonEl = card.querySelector('.kg-product-card-button');
            const href = buttonEl?.getAttribute('href') || '';
            const buttonText = buttonEl?.textContent.trim() || '';
            const sizeCount = buttonText.split(',').filter(s => s.trim()).length;
            
            return {
                horizontal: href.includes('#H') || sizeCount > 3,  // Auto-horizontal if more than 3 sizes
                smallSquare: href.includes('#SQ')
            };
        });

        return flags;
    }

    function transformProductCard(card, flags) {
        const titleEl = card.querySelector('.kg-product-card-title');
        const productName = titleEl?.textContent.trim() || 'Unknown Product';
        
        const buttonEl = card.querySelector('.kg-product-card-button');
        if (!buttonEl) return;

        // Parse button URL for product ID (strip flags)
        const buttonUrl = (buttonEl.getAttribute('href') || '').replace(/#H|#SQ/g, '');
        const productId = buttonUrl.replace(/^#/, '').trim();
        if (!productId) return;

        // Parse sizes from button text
        const sizes = (buttonEl.textContent.trim())
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        if (!sizes.length) return;

        // Build size grid and replace button
        const sizeGrid = createSizeGrid(productId, sizes);
        const buttonContainer = card.querySelector('.kg-product-card-button-container');
        (buttonContainer || buttonEl).replaceWith(sizeGrid);

        // Add hidden product name field
        const hiddenName = document.createElement('input');
        hiddenName.type = 'hidden';
        hiddenName.name = `${productId}_name`;
        hiddenName.value = productName;
        card.appendChild(hiddenName);

        // Mark as transformed
        card.classList.add('order-form-product');

        // Apply layout variants
        if (flags.smallSquare) {
            card.classList.add('order-form-product-small');
        } else if (flags.horizontal) {
            applyHorizontalLayout(card, sizeGrid);
        }

        // Setup expandable description for non-small, non-horizontal cards
        const description = card.querySelector('.kg-product-card-description');
        if (description && !flags.smallSquare && !flags.horizontal) {
            setupExpandableDescription(description, sizeGrid);
        }
    }

    function applyHorizontalLayout(card, sizeGrid) {
        card.classList.add('order-form-product-horizontal');

        // Left column: image, title, description
        const leftColumn = document.createElement('div');
        leftColumn.className = 'order-form-left-column';

        const image = card.querySelector('.kg-product-card-image');
        const titleContainer = card.querySelector('.kg-product-card-title-container');
        const description = card.querySelector('.kg-product-card-description');

        if (image) leftColumn.appendChild(image);
        if (titleContainer) leftColumn.appendChild(titleContainer);
        if (description) leftColumn.appendChild(description);

        // Right column: just the size grid
        const rightColumn = document.createElement('div');
        rightColumn.className = 'order-form-right-column';
        rightColumn.appendChild(sizeGrid);

        card.appendChild(leftColumn);
        card.appendChild(rightColumn);
    }

    function setupExpandableDescription(description, sizeGrid) {
        // Create a wrapper around description + sizeGrid for positioning context
        const descGridWrapper = document.createElement('div');
        descGridWrapper.className = 'description-grid-wrapper';
        description.parentNode.insertBefore(descGridWrapper, description);
        descGridWrapper.appendChild(description);
        descGridWrapper.appendChild(sizeGrid);

        // Get the original text content
        const originalText = description.textContent.trim();
        
        // Create wrapper for truncated content
        const wrapper = document.createElement('div');
        wrapper.className = 'description-wrapper';
        description.innerHTML = '';
        description.appendChild(wrapper);

        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'description-toggle';
        toggleBtn.textContent = '...more';

        let isExpanded = false;
        let truncatedText = originalText;
        let needsTruncation = false;

        function truncateToFit() {
            // Get line height
            const style = window.getComputedStyle(description);
            const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.5;
            
            // Calculate available height based on card space above size grid
            const gridHeight = descGridWrapper.offsetHeight;
            const sizeGridHeight = sizeGrid.offsetHeight;
            // Get the padding-top of size grid to ensure description doesn't overlap into it
            const sizeGridStyle = window.getComputedStyle(sizeGrid);
            const sizeGridPaddingTop = parseFloat(sizeGridStyle.paddingTop) || 0;
            const availableHeight = gridHeight - sizeGridHeight - sizeGridPaddingTop;
            
            // Calculate max lines that fit (minimum 2)
            const maxLines = Math.max(2, Math.floor(availableHeight / lineHeight));
            const maxHeight = lineHeight * maxLines;

            // First, check if full text fits without button
            wrapper.textContent = originalText;
            
            if (wrapper.scrollHeight <= maxHeight + 2) {
                // Text fits, no truncation needed
                needsTruncation = false;
                truncatedText = originalText;
                description.classList.add('no-overflow');
                return;
            }

            // Text doesn't fit, need to truncate
            needsTruncation = true;
            description.classList.remove('no-overflow');

            // Binary search to find text that fits with "...more" button
            let low = 0;
            let high = originalText.length;

            while (low < high) {
                const mid = Math.floor((low + high + 1) / 2);
                const testText = originalText.slice(0, mid);
                wrapper.innerHTML = '';
                wrapper.appendChild(document.createTextNode(testText + ' '));
                wrapper.appendChild(toggleBtn.cloneNode(true));
                
                if (wrapper.scrollHeight <= maxHeight + 2) {
                    low = mid;
                } else {
                    high = mid - 1;
                }
            }

            // Set final truncated text (trim trailing space/punctuation for cleaner look)
            truncatedText = originalText.slice(0, low).replace(/[\s,.\-:;]+$/, '');
            render();
        }

        function render() {
            wrapper.innerHTML = '';
            if (isExpanded) {
                wrapper.appendChild(document.createTextNode(originalText + ' '));
                toggleBtn.textContent = '...less';
                wrapper.appendChild(toggleBtn);
            } else if (needsTruncation) {
                wrapper.appendChild(document.createTextNode(truncatedText + ' '));
                toggleBtn.textContent = '...more';
                wrapper.appendChild(toggleBtn);
            } else {
                wrapper.appendChild(document.createTextNode(originalText));
                // No button needed
            }
        }

        toggleBtn.addEventListener('click', () => {
            isExpanded = !isExpanded;
            description.classList.toggle('description-expanded', isExpanded);
            render();
        });

        // Run after layout is complete
        requestAnimationFrame(() => {
            truncateToFit();
        });

        // Recalculate on resize
        window.addEventListener('resize', debounce(() => {
            if (!isExpanded) {
                truncateToFit();
            }
        }, 100));
    }

    function debounce(fn, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    function createSizeGrid(productId, sizes) {
        const container = document.createElement('div');
        container.className = 'size-qty-grid';

        sizes.forEach(size => {
            const row = createSizeRow(productId, size);
            container.appendChild(row);
        });

        return container;
    }

    function createSizeRow(productId, size) {
        const row = document.createElement('div');
        row.className = 'size-qty-row';

        // Parse size prefix shortcodes: Y=Youth, U=Unisex, M=Mens, W=Womens, none=Adult
        // Prefix must be followed by a valid size (S, M, L, XL, XXL, etc.)
        // e.g., "YS" -> Youth S, "MM" -> Mens M, "M" -> Adult M
        const prefixMap = {
            'Y': 'YOUTH',
            'U': 'UNISEX',
            'M': 'MENS',
            'W': 'WOMENS'
        };
        
        const upperSize = size.toUpperCase();
        const firstChar = upperSize.charAt(0);
        const rest = size.slice(1).trim();
        let caption = null;
        let displaySize = size;
        
        // Only treat as prefix if there's something after it (the actual size)
        if (prefixMap[firstChar] && rest.length > 0) {
            caption = prefixMap[firstChar];
            displaySize = rest;
        } else {
            // No valid prefix = Adult
            caption = 'ADULT';
            displaySize = size;
        }

        // Size label with caption
        const label = document.createElement('span');
        label.className = 'size-label';
        
        const captionEl = document.createElement('span');
        captionEl.className = 'size-label-caption';
        captionEl.textContent = caption;
        label.appendChild(captionEl);
        
        const textEl = document.createElement('span');
        textEl.className = 'size-label-text';
        textEl.textContent = displaySize;
        label.appendChild(textEl);

        // Quantity controls
        const controls = document.createElement('div');
        controls.className = 'qty-controls';

        const minusBtn = document.createElement('button');
        minusBtn.type = 'button';
        minusBtn.className = 'qty-btn qty-minus';
        minusBtn.textContent = '-';
        minusBtn.setAttribute('aria-label', `Decrease ${size} quantity`);

        // Create a safe field name from size (lowercase, no spaces)
        const sizeKey = size.toLowerCase().replace(/[^a-z0-9]/g, '');
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'qty-input';
        input.name = `${productId}_${sizeKey}`;
        input.value = '0';
        input.min = '0';
        input.max = '999';
        input.setAttribute('aria-label', `${size} quantity`);

        const plusBtn = document.createElement('button');
        plusBtn.type = 'button';
        plusBtn.className = 'qty-btn qty-plus';
        plusBtn.textContent = '+';
        plusBtn.setAttribute('aria-label', `Increase ${size} quantity`);

        // Event listeners
        minusBtn.addEventListener('click', () => {
            const current = parseInt(input.value) || 0;
            if (current > 0) {
                input.value = current - 1;
                updateRowState(row, current - 1);
            }
        });

        plusBtn.addEventListener('click', () => {
            const current = parseInt(input.value) || 0;
            input.value = current + 1;
            updateRowState(row, current + 1);
        });

        input.addEventListener('change', () => {
            let val = parseInt(input.value) || 0;
            if (val < 0) val = 0;
            input.value = val;
            updateRowState(row, val);
        });

        input.addEventListener('input', () => {
            let val = parseInt(input.value) || 0;
            if (val < 0) val = 0;
            updateRowState(row, val);
        });

        controls.appendChild(minusBtn);
        controls.appendChild(input);
        controls.appendChild(plusBtn);

        row.appendChild(label);
        row.appendChild(controls);

        return row;
    }

    function updateRowState(row, qty) {
        if (qty > 0) {
            row.classList.add('has-quantity');
        } else {
            row.classList.remove('has-quantity');
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initOrderForm);
    } else {
        initOrderForm();
    }
})();
