/**
 * Order Form - Product Card Transformer
 * 
 * Converts Ghost product cards into interactive size/quantity selectors.
 * 
 * Usage:
 * 1. Create a page using the "Order Form" template
 * 2. Add product cards in Ghost editor
 * 3. Set button text to comma-separated sizes: "XS,S,M,L,XL"
 * 4. Set button URL to product ID: "#SKU-12345" or "SKU-12345"
 * 5. Add a kg-button card at the end with the Formspree URL as href
 * 6. The script transforms cards and wires up the form submission
 */

(function() {
    'use strict';

    function initOrderForm() {
        const form = document.querySelector('.order-form');
        if (!form) {
            console.log('Order Form: No form found');
            return;
        }

        // Find submit button (kg-button) and extract Formspree URL
        const submitButton = form.querySelector('.kg-button-card .kg-btn');
        if (submitButton) {
            const formspreeUrl = submitButton.getAttribute('href');
            if (formspreeUrl && formspreeUrl.includes('formspree.io')) {
                form.setAttribute('action', formspreeUrl);
                
                // Convert the button to a submit button
                submitButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    form.submit();
                });
                
                // Style it as submit
                submitButton.closest('.kg-button-card').classList.add('order-form-submit-card');
            }
        }

        // Transform product cards
        const productCards = form.querySelectorAll('.kg-product-card');
        
        if (!productCards.length) {
            console.log('Order Form: No product cards found');
            return;
        }

        productCards.forEach((card) => {
            transformProductCard(card);
        });

        console.log(`Order Form: Transformed ${productCards.length} product card(s)`);
    }

    function transformProductCard(card) {
        // Extract product name from title
        const titleEl = card.querySelector('.kg-product-card-title');
        const productName = titleEl ? titleEl.textContent.trim() : 'Unknown Product';
        
        // Extract product ID from button URL
        const buttonEl = card.querySelector('.kg-product-card-button');
        if (!buttonEl) {
            console.log(`Order Form: No button found for "${productName}", skipping`);
            return;
        }

        let buttonUrl = buttonEl.getAttribute('href') || '';
        
        // Check for horizontal flag #H
        const isHorizontal = buttonUrl.includes('#H');
        buttonUrl = buttonUrl.replace('#H', '');
        
        // Extract ID - remove # if present, use the value as product ID
        const productId = buttonUrl.replace(/^#/, '').trim();
        
        if (!productId) {
            console.log(`Order Form: No product ID in button URL for "${productName}", skipping`);
            return;
        }

        // Extract sizes from button text
        const sizesText = buttonEl.textContent.trim();
        const sizes = sizesText ? sizesText.split(',').map(s => s.trim()).filter(s => s) : [];

        if (!sizes.length) {
            console.log(`Order Form: No sizes found for "${productName}", skipping`);
            return;
        }

        // Create the size/qty grid
        const sizeGrid = createSizeGrid(productId, sizes);

        // Find the button container and replace it with the grid
        const buttonContainer = card.querySelector('.kg-product-card-button-container');
        if (buttonContainer) {
            buttonContainer.replaceWith(sizeGrid);
        } else {
            buttonEl.replaceWith(sizeGrid);
        }

        // Add hidden field for product name (using product ID as key)
        const hiddenName = document.createElement('input');
        hiddenName.type = 'hidden';
        hiddenName.name = `${productId}_name`;
        hiddenName.value = productName;
        card.appendChild(hiddenName);

        // Mark card as transformed
        card.classList.add('order-form-product');
        
        // Add horizontal class if flagged
        if (isHorizontal) {
            card.classList.add('order-form-product-horizontal');
            
            // Create right column wrapper for title, description, and sizes
            const rightColumn = document.createElement('div');
            rightColumn.className = 'order-form-right-column';
            
            // Move title and description into right column
            const titleContainer = card.querySelector('.kg-product-card-title-container');
            const description = card.querySelector('.kg-product-card-description');
            
            if (titleContainer) rightColumn.appendChild(titleContainer);
            if (description) rightColumn.appendChild(description);
            rightColumn.appendChild(sizeGrid);
            
            // Append right column to card
            card.appendChild(rightColumn);
        }
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
