/**
 * Order Form - Product Card Transformer
 * 
 * Converts Ghost product cards into interactive size/quantity selectors.
 * 
 * Usage:
 * 1. Create a page using the "Order Form" template
 * 2. Add product cards in Ghost editor
 * 3. Set button text to comma-separated sizes: "XS,S,M,L,XL"
 * 4. The script transforms each card into a quantity selector grid
 */

(function() {
    'use strict';

    function initOrderForm() {
        const productCards = document.querySelectorAll('.order-form .kg-product-card');
        
        if (!productCards.length) {
            console.log('Order Form: No product cards found');
            return;
        }

        productCards.forEach((card, index) => {
            transformProductCard(card, index + 1);
        });

        console.log(`Order Form: Transformed ${productCards.length} product card(s)`);
    }

    function transformProductCard(card, productIndex) {
        // Extract product name from title
        const titleEl = card.querySelector('.kg-product-card-title');
        const productName = titleEl ? titleEl.textContent.trim() : `Product ${productIndex}`;
        
        // Extract sizes from button text
        const buttonEl = card.querySelector('.kg-product-card-button');
        const sizesText = buttonEl ? buttonEl.textContent.trim() : '';
        const sizes = sizesText ? sizesText.split(',').map(s => s.trim()).filter(s => s) : [];

        // If no sizes found, skip transformation
        if (!sizes.length) {
            console.log(`Order Form: No sizes found for "${productName}", skipping`);
            return;
        }

        // Create the size/qty grid
        const sizeGrid = createSizeGrid(productName, sizes, productIndex);

        // Find the button container and replace it with the grid
        const buttonContainer = card.querySelector('.kg-product-card-button-container');
        if (buttonContainer) {
            buttonContainer.replaceWith(sizeGrid);
        } else if (buttonEl) {
            buttonEl.replaceWith(sizeGrid);
        } else {
            // Append to card if no button found
            card.appendChild(sizeGrid);
        }

        // Add hidden field for product name
        const hiddenName = document.createElement('input');
        hiddenName.type = 'hidden';
        hiddenName.name = `p${productIndex}_name`;
        hiddenName.value = productName;
        card.appendChild(hiddenName);

        // Mark card as transformed
        card.classList.add('order-form-product');
    }

    function createSizeGrid(productName, sizes, productIndex) {
        const container = document.createElement('div');
        container.className = 'size-qty-grid';

        sizes.forEach(size => {
            const row = createSizeRow(size, productIndex);
            container.appendChild(row);
        });

        return container;
    }

    function createSizeRow(size, productIndex) {
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
        input.name = `p${productIndex}_${sizeKey}`;
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
