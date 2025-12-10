function setToggle() {
  const toggleHeadingElements = document.getElementsByClassName("kg-toggle-heading");

  const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svgElement.setAttribute("viewBox", "0 0 18 10");
  svgElement.setAttribute("fill", "none");
  svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
  pathElement.setAttribute("d", "M16.2277 0.269316L17.641 1.68398L9.93832 9.38932C9.8149 9.51352 9.66813 9.61209 9.50646 9.67936C9.3448 9.74662 9.17142 9.78125 8.99632 9.78125C8.82122 9.78125 8.64785 9.74662 8.48618 9.67936C8.32451 9.61209 8.17775 9.51352 8.05432 9.38932L0.347657 1.68398L1.76099 0.270649L8.99432 7.50265L16.2277 0.269316Z");

  svgElement.appendChild(pathElement);

  document.querySelectorAll('.kg-toggle-card').forEach(card => {
      card.querySelector('.kg-toggle-heading svg').remove();

      const container = card.querySelector(".kg-toggle-card-icon");
      const clonedSvg = svgElement.cloneNode(true);

      container.appendChild(clonedSvg);

      // Check for :open in heading text and default to open state
      const headingText = card.querySelector('.kg-toggle-heading-text');
      if (headingText && headingText.textContent.includes(':open')) {
          headingText.textContent = headingText.textContent.replace(':open', '').trim();
          card.setAttribute('data-kg-toggle-state', 'open');
      }
  })

  const toggleFn = function(event) {

      const targetElement = event.target;
      const parentElement = targetElement.closest('.kg-toggle-card');
      var toggleState = parentElement.getAttribute("data-kg-toggle-state");
      if (toggleState === 'close') {
          parentElement.setAttribute('data-kg-toggle-state', 'open');
      } else {
          parentElement.setAttribute('data-kg-toggle-state', 'close');
      }
  };

  for (let i = 0; i < toggleHeadingElements.length; i++) {
      toggleHeadingElements[i].addEventListener('click', toggleFn, false);
  }
}

function moveImagesToToggleCards() {
  const toggleCards = document.querySelectorAll('.kg-toggle-card');
  if (toggleCards.length === 0) return;

  const allImageFigures = document.querySelectorAll('.post-content .kg-image-card');
  const imageFigures = Array.from(allImageFigures).filter(figure => {
    return !figure.classList.contains('kg-gallery-image') &&
           !figure.closest('.kg-gallery-card') &&
           !figure.closest('.kg-gallery-container') &&
           !figure.closest('.opacity-animation');
  });

  if (imageFigures.length === 0) return;

  const toggleMap = new Map();
  toggleCards.forEach(card => {
    const headingText = card.querySelector('.kg-toggle-heading-text');
    if (headingText) {
      const normalizedHeading = headingText.textContent.trim().toLowerCase();
      toggleMap.set(normalizedHeading, card);
    }
  });

  imageFigures.forEach(figure => {
    const caption = figure.querySelector('figcaption');
    if (!caption) return;

    const captionText = caption.textContent;
    const semicolonIndex = captionText.indexOf(';');

    if (semicolonIndex === -1) return;

    const beforeSemicolon = captionText.substring(0, semicolonIndex).trim().toLowerCase();
    const afterSemicolon = captionText.substring(semicolonIndex + 1).trim();

    const matchingToggle = toggleMap.get(beforeSemicolon);

    if (matchingToggle) {
      const toggleHeading = matchingToggle.querySelector('.kg-toggle-heading');
      if (toggleHeading) {
        const img = figure.querySelector('img');
        if (img) {
          img.classList.add('no-lightense');
          img.style.cursor = 'pointer';
          img.addEventListener('click', function() {
            toggleHeading.click();
          });
          toggleHeading.insertAdjacentElement('beforebegin', img);
        }

        if (afterSemicolon) {
          caption.textContent = afterSemicolon;
          toggleHeading.insertAdjacentElement('afterend', caption);
        }

        figure.remove();
      }
    }
  });
}

// Initialize toggle functions on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  setToggle();
  moveImagesToToggleCards();
});
