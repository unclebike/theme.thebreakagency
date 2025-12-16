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
 */

(function() {
    'use strict';

    function initOrderForm() {
        const form = document.querySelector('.order-form');
        if (!form) return;

        setupSubmitButton(form);
        
        const productCards = Array.from(form.querySelectorAll('.kg-product-card'));
        if (!productCards.length) return;

        // Setup progressive image loading first
        setupProgressiveImages(form);

        // Determine which cards should be horizontal or small square
        const cardFlags = detectCardFlags(productCards);

        productCards.forEach((card, index) => {
            transformProductCard(card, cardFlags[index]);
        });

        // Initialize Lightense for product images if available
        // Use full-res images stored in data-full-src for lightbox
        if (typeof Lightense !== 'undefined') {
            // Lightense will use data-src if available, otherwise src
            Lightense('.order-form .kg-product-card-image', {
                background: 'var(--background-color)'
            });
        }
    }

    /**
     * Progressive image loading - loads small thumbnails first, then full images
     * Ghost CDN supports /size/w{width}/ in URLs for resizing
     */
    function setupProgressiveImages(form) {
        const images = form.querySelectorAll('.kg-product-card-image');
        
        images.forEach(img => {
            const fullSrc = img.src;
            
            // Only process Ghost-hosted images
            if (!fullSrc.includes('/content/images/')) return;
            
            // Create small version URL (300px wide)
            const smallSrc = fullSrc.replace(
                '/content/images/',
                '/content/images/size/w300/'
            );
            
            // Store full URL for Lightense
            img.setAttribute('data-src', fullSrc);
            
            // Start with small image and blur
            img.src = smallSrc;
            img.classList.add('img-loading');
            
            // Preload full image in background
            const fullImg = new Image();
            fullImg.onload = () => {
                // Swap to full image and remove blur
                img.src = fullSrc;
                img.classList.remove('img-loading');
                img.classList.add('img-loaded');
            };
            fullImg.src = fullSrc;
        });
    }

    function setupSubmitButton(form) {
        const submitButton = form.querySelector('.kg-button-card .kg-btn');
        if (!submitButton) return;

        // Wire up the button to submit the form
        submitButton.addEventListener('click', (e) => {
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
            
            form.submit();
        });
        submitButton.closest('.kg-button-card').classList.add('order-form-submit-card');
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
