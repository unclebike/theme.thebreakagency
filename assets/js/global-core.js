/**
 * Global Core - Non-animation utility functions
 * These load immediately and don't depend on GSAP
 */

let targetX = window.innerWidth / 2;
let targetY = window.innerHeight / 2;

window.addEventListener('mousemove', (event) => {
  targetX = event.clientX;
  targetY = event.clientY;
});

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function debounce(fn, delay) {
    let timerId;
    return function(...args) {
      if (timerId) {
        clearTimeout(timerId);
      }
      timerId = setTimeout(() => {
        fn(...args);
        timerId = null;
      }, delay);
    };
}

function hexToRgba() {
  let hex = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
  hex = hex.replace('#', '');

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  let opac_70 =  `rgba(${r}, ${g}, ${b}, 0.7)`;
  let opac_40 =  `rgba(${r}, ${g}, ${b}, 0.4)`;

  document.documentElement.style.setProperty('--text-color-70', opac_70);
  document.documentElement.style.setProperty('--text-color-40', opac_40);
}

function loadColors(colors, doc = document){
    const data = colors;
    if(!data) return;
    const root = doc.documentElement;
   
    let splitArray = data.toString().replace(/,\s*/g, ',').split(',');
    let colorVariables = ['text-color', 'background-color', 'overlay-text-color', 'overlay-button-text-color']

    for(let i = 0; i < splitArray.length; i++){
       if(i == 4) break;

       root.style.setProperty(`--${colorVariables[i]}`, `${splitArray[i]}`);
    }
}

function loadFonts(fonts, doc = document){
    const data = fonts;
    if(!data) return;

    const ghostFonts = document.querySelector('link[href*="fonts.bunny.net/css"]');

    if(ghostFonts) return;
    
    const root = document.documentElement;
   
    let splitArray = data.toString().replace(/,\s*/g, ',').split(',');

    let googleFontsURL = `https://fonts.googleapis.com/css2?`;

    for(let i = 0; i < splitArray.length; i++){
       if(i == 2) break;

       if(splitArray[i].toString() == 'Thunder'){
        root.setAttribute('data-primary-font', `${splitArray[i].toString()}`);
       }

       root.style.setProperty(`--font${i+1}`, `'${splitArray[i].toString()}'`);

       splitArray[i] = splitArray[i].replace(' ', '+');
       googleFontsURL += `family=${splitArray[i]}:wght@300;400;500;600&`  
    }

    googleFontsURL += 'display=swap'

    const linkElement = doc.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.href = googleFontsURL;

    doc.head.appendChild(linkElement);
}

function setLightense(){
  window.addEventListener('DOMContentLoaded', function () {
      const imagesInAnchors = document.querySelectorAll('.post-content a img, .post-content .kg-product-card img, .kg-signup-card img, .kg-header-card img');
  
      imagesInAnchors.forEach((img) => {
          img.classList.add('no-lightense');  
      });
  
      Lightense('.post-content img:not(.no-lightense)', {
          background: 'var(--background-color)'
      });
  }, false);
}

function copyUrlToClipboard(parentElement){
  let parent = document.querySelector(`.${parentElement}`)
  let alert = parent.querySelector('.clipboard-alert');

  parent.querySelector('.clipboard-link').addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href);
      alert.style.display = "block";

      setTimeout(function () {
          alert.style.display = "none";
      }, 3000);
  })
}

function scaleFontSizes(factor = 0.8) {
  const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, li, button');
  
  textElements.forEach((el) => {
    const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
  });
}

function setH2position() {
  if(window.innerWidth <= 1080) return;

  const navbar = document.querySelector('.navbar .wide-container');
  const width = window.getComputedStyle(navbar).width;
  document.documentElement.style.setProperty('--post-container-width', width);
}

function setVideo(){
  let featuredImageWrapper = document.querySelector('.post-main-image-wrapper')
  if(!featuredImageWrapper){
    featuredImageWrapper = document.querySelector('.background-image');
  }

  const video = document.querySelector('.post-content .kg-video-card')

  if(!video || !featuredImageWrapper) return;

  featuredImageWrapper.querySelector('figure').remove();

  let videoEl = video.querySelector('video');
  videoEl.removeAttribute("controls");

  videoEl.muted = true;

  if(!videoEl.loop){
    videoEl.play().catch(error => console.log('Autoplay prevented:', error));
  }
  
  featuredImageWrapper.appendChild(videoEl);

  video.remove();

  const otherVideos = document.querySelectorAll(".post-content-inner-wrapper video");
  otherVideos.forEach(video => {
    video.style.display = "block";
  })
}

function setVideoOnMediaBackground(){
  document.querySelectorAll('.background-media').forEach(media => {
    let slug = media.getAttribute('data-slug');
    if(!slug) return;

    let startUrl = window.location.origin + "/";
    
    let url = startUrl + `${slug}/`;

    // Make the AJAX request
    fetch(url)
        .then(response => response.text())
        .then(data => {
            let parser = new DOMParser();
            let html = parser.parseFromString(data, "text/html");
            let hasVideo = html.querySelector("article").getAttribute('data-has-video');

            if(hasVideo == "true"){
              let featuredImageWrapper = media.querySelector('.background-image');

              let video = html.querySelector('.post-content .kg-video-card');

              if(!video || !featuredImageWrapper) return;

              let videoEl = video.querySelector('video');

              videoEl.muted = true;
              if(!videoEl.loop){
                videoEl.play().catch(error => console.log('Autoplay prevented:', error));
              }
              featuredImageWrapper.appendChild(videoEl);
              video.remove();
            }
        })
        .catch(error => {
            console.error("Error loading more posts:", error);
        });
  })
}

let scrollPosition = 0;
 
function disableScrolling() {
  scrollPosition = window.pageYOffset;
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollPosition}px`;
  document.body.style.width = '100%';
}
   
function enableScrolling(scrollToPosition = true) {
  document.body.style.removeProperty('overflow');
  document.body.style.removeProperty('position');
  document.body.style.removeProperty('top');
  document.body.style.removeProperty('width');
  if(scrollToPosition){
    window.scrollTo(0, scrollPosition);
  }
}

function detectImageBrightness(imgElement) {
  // Commented out - automatic contrast detection for masonry grid images
}

function applyImageGridPattern() {
  const postContent = document.querySelector('.post-content-inner');
  if (!postContent) {
    return;
  }

  const children = Array.from(postContent.children);

  // Get theme colors
  const rootStyles = getComputedStyle(document.documentElement);
  const textColor = rootStyles.getPropertyValue('--text-color').trim();
  const backgroundColor = rootStyles.getPropertyValue('--background-color').trim();
  const overlayTextColor = rootStyles.getPropertyValue('--overlay-text-color').trim();
  const overlayButtonTextColor = rootStyles.getPropertyValue('--overlay-button-text-color').trim();

  // Create array of available colors (excluding background color)
  const colors = [textColor, overlayTextColor, overlayButtonTextColor].filter(color => color && color !== backgroundColor);

  for (let i = 0; i < children.length; i++) {
    const element = children[i];

    // Check if current element is a kg-header (both old and new versions)
    if (element.classList.contains('kg-header-card')) {
      const images = [];
      let nextIndex = i + 1;

      // Collect consecutive image cards or figures with kg-image-card
      while (nextIndex < children.length) {
        const nextEl = children[nextIndex];
        if (nextEl.classList.contains('kg-image-card') ||
            (nextEl.tagName === 'FIGURE' && nextEl.classList.contains('kg-image-card'))) {
          images.push(nextEl);
          nextIndex++;
        } else {
          break;
        }
      }

      // Check if there are 3-9 images and the next element is a divider
      if (images.length >= 3 && images.length <= 9 &&
          nextIndex < children.length &&
          children[nextIndex].tagName === 'HR') {

        // Add class to the kg-header to match grid width
        element.classList.add('kg-header-with-grid');

        // Create a wrapper for the images
        const wrapper = document.createElement('div');
        wrapper.className = 'kg-image-masonry-grid';
        wrapper.setAttribute('data-image-count', images.length);

        // Insert wrapper before the first image
        images[0].parentNode.insertBefore(wrapper, images[0]);

        // Move all images into the wrapper and assign colors
        images.forEach((img, index) => {
          wrapper.appendChild(img);

          // Assign a background color using only the first color (dark blue)
          img.style.backgroundColor = colors[0];

          // Add a class to indicate it has a colored background
          img.classList.add('kg-image-with-bg');
        });
      }
    }
  }
}

function applyImageCalloutGridPattern() {
  const postContent = document.querySelector('.post-content-inner');
  if (!postContent) {
    return;
  }

  const children = Array.from(postContent.children);

  // Helper to check if element is empty (empty p tags, br, etc.)
  const isEmpty = (el) => {
    if (el.tagName === 'P' && el.textContent.trim() === '' && el.children.length === 0) return true;
    if (el.tagName === 'BR') return true;
    return false;
  };

  for (let i = 0; i < children.length - 1; i++) {
    const currentEl = children[i];
    
    const currentIsImage = currentEl.classList.contains('kg-image-card');
    const currentIsCallout = currentEl.classList.contains('kg-callout-card');
    
    if (!currentIsImage && !currentIsCallout) continue;

    // Look for the next non-empty element
    let nextIndex = i + 1;
    let emptyElements = [];
    
    while (nextIndex < children.length && isEmpty(children[nextIndex])) {
      emptyElements.push(children[nextIndex]);
      nextIndex++;
    }
    
    if (nextIndex >= children.length) continue;
    
    const nextEl = children[nextIndex];
    const nextIsImage = nextEl.classList.contains('kg-image-card');
    const nextIsCallout = nextEl.classList.contains('kg-callout-card');

    const nextIsButton = nextEl.classList.contains('kg-button-card');

    // Check if we have an image card followed by a callout card or vice versa
    if ((currentIsImage && nextIsCallout) || (currentIsCallout && nextIsImage)) {
      // Create a wrapper for the grid
      const wrapper = document.createElement('div');
      wrapper.className = 'kg-image-callout-grid';

      // Determine which is image and which is first callout
      const imageEl = currentIsImage ? currentEl : nextEl;
      const firstCallout = currentIsCallout ? currentEl : nextEl;

      // Insert wrapper before the first element
      currentEl.parentNode.insertBefore(wrapper, currentEl);

      // Move first callout into wrapper
      wrapper.appendChild(firstCallout);
      
      // Move image inside the first callout (at the beginning, left side)
      firstCallout.prepend(imageEl);
      
      // Remove empty elements between them
      emptyElements.forEach(el => el.remove());

      // Continue collecting additional callouts and button
      let lastCallout = firstCallout;
      let scanIndex = nextIndex + 1;
      
      // Re-fetch children since DOM has changed
      const updatedChildren = Array.from(postContent.children);
      const wrapperIndex = updatedChildren.indexOf(wrapper);
      scanIndex = wrapperIndex + 1;
      
      while (scanIndex < updatedChildren.length) {
        const scanEl = updatedChildren[scanIndex];
        
        // Skip empty elements
        if (isEmpty(scanEl)) {
          scanEl.remove();
          // Re-fetch after removal
          const refreshedChildren = Array.from(postContent.children);
          scanIndex = refreshedChildren.indexOf(wrapper) + 1;
          continue;
        }
        
        const isCallout = scanEl.classList.contains('kg-callout-card');
        const isButton = scanEl.classList.contains('kg-button-card');
        
        if (isCallout) {
          // Add callout to wrapper
          wrapper.appendChild(scanEl);
          lastCallout = scanEl;
          scanIndex++;
        } else if (isButton) {
          // Move button inside the last callout
          lastCallout.appendChild(scanEl);
          break;
        } else {
          // Stop if we hit something else
          break;
        }
      }

      // Skip to after processed elements
      i = Array.from(postContent.children).indexOf(wrapper);
    }
    // Check if we have a callout followed by a button (no image)
    else if (currentIsCallout && nextIsButton) {
      // Remove empty elements between them
      emptyElements.forEach(el => el.remove());
      
      // Move button inside the callout
      currentEl.appendChild(nextEl);
      
      // Mark this callout as processed to avoid re-processing
      currentEl.classList.add('kg-callout-with-button');
    }
  }
}
