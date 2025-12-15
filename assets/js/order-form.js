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

        // Determine which cards should be horizontal or small square
        const cardFlags = detectCardFlags(productCards);

        productCards.forEach((card, index) => {
            transformProductCard(card, cardFlags[index]);
        });

        // Initialize masonry layout after cards are transformed
        initMasonry(form, productCards);
    }

    function initMasonry(form, cards) {
        const gap = 16; // Base gap in pixels
        
        function layoutMasonry() {
            const containerWidth = form.offsetWidth;
            const cardWidths = cards.map(card => card.offsetWidth);
            
            // Track column heights
            let columns = [];
            let columnXPositions = [];
            let currentX = 0;
            
            // First pass: determine columns based on card widths fitting in container
            cards.forEach((card, index) => {
                const cardWidth = cardWidths[index];
                
                // Find the shortest column that can fit this card
                let bestColumn = -1;
                let bestHeight = Infinity;
                let bestX = 0;
                
                // Try to find space in existing columns
                for (let i = 0; i < columns.length; i++) {
                    const spaceNeeded = columnXPositions[i] + cardWidth;
                    // Check if card fits starting at this column position
                    if (spaceNeeded <= containerWidth + 1) { // +1 for rounding
                        // Check if this card would overlap with other columns
                        let canFit = true;
                        let maxHeightInSpan = columns[i];
                        
                        for (let j = i + 1; j < columns.length; j++) {
                            if (columnXPositions[j] < columnXPositions[i] + cardWidth) {
                                maxHeightInSpan = Math.max(maxHeightInSpan, columns[j]);
                            }
                        }
                        
                        if (canFit && maxHeightInSpan < bestHeight) {
                            bestHeight = maxHeightInSpan;
                            bestColumn = i;
                            bestX = columnXPositions[i];
                        }
                    }
                }
                
                // If no existing column works, start a new row
                if (bestColumn === -1 || (columns.length === 0)) {
                    if (columns.length === 0 || currentX + cardWidth > containerWidth) {
                        // New row
                        bestX = 0;
                        bestHeight = columns.length > 0 ? Math.max(...columns) + gap : 0;
                    } else {
                        bestX = currentX;
                        bestHeight = columns.length > 0 ? Math.min(...columns) : 0;
                    }
                }
                
                // Position the card
                card.style.left = `${bestX}px`;
                card.style.top = `${bestHeight}px`;
                
                // Update tracking
                const cardBottom = bestHeight + card.offsetHeight + gap;
                const cardRight = bestX + cardWidth + gap;
                
                // Update or add column tracking
                let updated = false;
                for (let i = 0; i < columnXPositions.length; i++) {
                    if (Math.abs(columnXPositions[i] - bestX) < 5) {
                        columns[i] = cardBottom;
                        updated = true;
                        break;
                    }
                }
                if (!updated) {
                    columns.push(cardBottom);
                    columnXPositions.push(bestX);
                }
                
                currentX = cardRight;
                if (currentX >= containerWidth) {
                    currentX = 0;
                }
            });
            
            // Set container height
            const maxHeight = Math.max(...columns);
            form.style.minHeight = `${maxHeight}px`;
        }

        // Initial layout after images load
        Promise.all(
            cards.map(card => {
                const img = card.querySelector('img');
                if (img && !img.complete) {
                    return new Promise(resolve => {
                        img.onload = resolve;
                        img.onerror = resolve;
                    });
                }
                return Promise.resolve();
            })
        ).then(() => {
            requestAnimationFrame(layoutMasonry);
        });

        // Relayout on resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(layoutMasonry, 100);
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
            return {
                horizontal: href.includes('#H'),
                smallSquare: href.includes('#SQ')
            };
        });

        // Auto-horizontal for odd card out (if not already forced horizontal or small square)
        const specialCount = flags.filter(f => f.horizontal || f.smallSquare).length;
        const remainingCards = cards.length - specialCount;
        
        if (remainingCards % 2 === 1) {
            // Find last non-special card and make it horizontal
            for (let i = cards.length - 1; i >= 0; i--) {
                if (!flags[i].horizontal && !flags[i].smallSquare) {
                    flags[i].horizontal = true;
                    break;
                }
            }
        }

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

        // Setup expandable description for non-small cards
        const description = card.querySelector('.kg-product-card-description');
        if (description && !flags.smallSquare) {
            setupExpandableDescription(description, sizeGrid);
        }
    }

    function applyHorizontalLayout(card, sizeGrid) {
        card.classList.add('order-form-product-horizontal');

        const rightColumn = document.createElement('div');
        rightColumn.className = 'order-form-right-column';

        const titleContainer = card.querySelector('.kg-product-card-title-container');
        const description = card.querySelector('.kg-product-card-description');

        // Move title to right column
        if (titleContainer) rightColumn.appendChild(titleContainer);
        
        // Description and sizeGrid will be wrapped together by setupExpandableDescription
        // Just move them to right column for now
        if (description) rightColumn.appendChild(description);
        rightColumn.appendChild(sizeGrid);

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
