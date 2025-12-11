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
 * 6. Add a kg-button card at the end with the Formspree URL as href
 * 
 * Layout:
 * - Odd number of cards: last card auto-becomes horizontal
 * - Use #H flag to force any card horizontal
 */

(function() {
    'use strict';

    function initOrderForm() {
        const form = document.querySelector('.order-form');
        if (!form) return;

        setupSubmitButton(form);
        
        const productCards = Array.from(form.querySelectorAll('.kg-product-card'));
        if (!productCards.length) return;

        // Determine which cards should be horizontal
        const horizontalFlags = detectHorizontalCards(productCards);

        productCards.forEach((card, index) => {
            transformProductCard(card, horizontalFlags[index]);
        });
    }

    function setupSubmitButton(form) {
        const submitButton = form.querySelector('.kg-button-card .kg-btn');
        if (!submitButton) return;

        const formspreeUrl = submitButton.getAttribute('href');
        if (!formspreeUrl || !formspreeUrl.includes('formspree.io')) return;

        form.setAttribute('action', formspreeUrl);
        submitButton.addEventListener('click', (e) => {
            e.preventDefault();
            form.submit();
        });
        submitButton.closest('.kg-button-card').classList.add('order-form-submit-card');
    }

    function detectHorizontalCards(cards) {
        const flags = cards.map(card => {
            const buttonEl = card.querySelector('.kg-product-card-button');
            const href = buttonEl?.getAttribute('href') || '';
            return href.includes('#H');
        });

        // Auto-horizontal for odd card out (if not already forced)
        const forcedCount = flags.filter(f => f).length;
        const remainingCards = cards.length - forcedCount;
        
        if (remainingCards % 2 === 1) {
            // Find last non-forced card and make it horizontal
            for (let i = cards.length - 1; i >= 0; i--) {
                if (!flags[i]) {
                    flags[i] = true;
                    break;
                }
            }
        }

        return flags;
    }

    function transformProductCard(card, isHorizontal) {
        const titleEl = card.querySelector('.kg-product-card-title');
        const productName = titleEl?.textContent.trim() || 'Unknown Product';
        
        const buttonEl = card.querySelector('.kg-product-card-button');
        if (!buttonEl) return;

        // Parse button URL for product ID (strip #H flag)
        const buttonUrl = (buttonEl.getAttribute('href') || '').replace('#H', '');
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

        // Apply horizontal layout
        if (isHorizontal) {
            applyHorizontalLayout(card, sizeGrid);
        }
    }

    function applyHorizontalLayout(card, sizeGrid) {
        card.classList.add('order-form-product-horizontal');

        const rightColumn = document.createElement('div');
        rightColumn.className = 'order-form-right-column';

        const titleContainer = card.querySelector('.kg-product-card-title-container');
        const description = card.querySelector('.kg-product-card-description');

        if (titleContainer) rightColumn.appendChild(titleContainer);
        if (description) rightColumn.appendChild(description);
        rightColumn.appendChild(sizeGrid);

        card.appendChild(rightColumn);

        // Setup expandable description
        if (description) {
            setupExpandableDescription(description, sizeGrid);
        }
    }

    function setupExpandableDescription(description, sizeGrid) {
        // Wrap original content
        const originalContent = description.innerHTML;
        description.innerHTML = `
            <div class="description-collapsed">
                <span class="description-text">${originalContent}</span>
                <button type="button" class="description-toggle">...more</button>
            </div>
            <div class="description-expanded">
                <span class="description-text">${originalContent}</span>
                <button type="button" class="description-toggle">...less</button>
            </div>
        `;

        const collapsed = description.querySelector('.description-collapsed');
        const expanded = description.querySelector('.description-expanded');
        const moreBtn = collapsed.querySelector('.description-toggle');
        const lessBtn = expanded.querySelector('.description-toggle');

        // Check if text actually overflows (needs "...more")
        const textEl = collapsed.querySelector('.description-text');
        requestAnimationFrame(() => {
            // Add small buffer (2px) to account for rounding
            if (textEl.scrollHeight <= textEl.offsetHeight + 2) {
                moreBtn.style.display = 'none';
                description.classList.add('no-overflow');
                return;
            }

            // Expand on click
            moreBtn.addEventListener('click', () => {
                const expandedHeight = expanded.scrollHeight;
                
                gsap.to(collapsed, {
                    opacity: 0,
                    duration: 0.2,
                    onComplete: () => {
                        collapsed.style.display = 'none';
                        expanded.style.display = 'block';
                        expanded.style.opacity = 0;
                        
                        gsap.to(expanded, { opacity: 1, duration: 0.2 });
                        gsap.to(sizeGrid, { opacity: 0, duration: 0.2 });
                    }
                });
            });

            // Collapse on click
            lessBtn.addEventListener('click', () => {
                gsap.to(expanded, {
                    opacity: 0,
                    duration: 0.2,
                    onComplete: () => {
                        expanded.style.display = 'none';
                        collapsed.style.display = 'flex';
                        collapsed.style.opacity = 0;
                        
                        gsap.to(collapsed, { opacity: 1, duration: 0.2 });
                        gsap.to(sizeGrid, { opacity: 1, duration: 0.2 });
                    }
                });
            });
        });
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

        // Size label
        const label = document.createElement('span');
        label.className = 'size-label';
        label.textContent = size;

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
