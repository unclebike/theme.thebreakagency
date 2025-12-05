let targetX = window.innerWidth / 2;
let targetY = window.innerHeight / 2;

window.addEventListener('mousemove', (event) => {
  targetX = event.clientX;
  targetY = event.clientY;
});

gsap.registerPlugin(ScrollTrigger);

function resetScrollTriggers(){
  ScrollTrigger.refresh();
}

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

window.addEventListener('resize', debounce(() => {
  ScrollTrigger.refresh();
}, 800));

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
  /* document.documentElement.style.scrollBehavior = 'auto'; */
   
}
   
function enableScrolling(scrollToPosition = true) {
  document.body.style.removeProperty('overflow');
  document.body.style.removeProperty('position');
  document.body.style.removeProperty('top');
  document.body.style.removeProperty('width');
  if(scrollToPosition){
    window.scrollTo(0, scrollPosition);
  }
  /* document.documentElement.style.scrollBehavior = 'smooth'; */
}

function killScrollTrigger(selector) {
  ScrollTrigger.getAll().forEach(trigger => {
    if (trigger.trigger && trigger.trigger.matches(selector)) {
      trigger.kill();
    }
  });
}

function creativeLatestPostsTrigger(){
  let selector = '.creative-post-card, .all-posts-link';

  killScrollTrigger(selector);

  document.querySelectorAll(selector).forEach(heading => {
    let img = heading.querySelector('.creative-post-card-image-wrapper');
    let headingInner = heading.querySelector('.creative-post-card-title');
    let arrow = heading.querySelector('.arrow-link-button');

    ScrollTrigger.matchMedia({
      "(max-width: 1080px)": function () {
        gsap.to(headingInner, {
          scrollTrigger: {
            trigger: heading,
            start: "top center",
            end: "bottom+=1 center",
            toggleActions: "play reverse play reverse",
            onEnter: () => {
              onEnterAnimation();
            },
            onLeave: () => {
              onLeaveAnimation();
            },
            onEnterBack: () => {
              onEnterAnimation();
            },
            onLeaveBack: () => {
              onLeaveAnimation();
            }
          }
        });
      },
      "(min-width: 1081px)": function () {
         removeStyles(); 
      }
    });

    function removeStyles(){
      gsap.set(headingInner, {
        clearProps: "all"
      });
      if(img){
        gsap.set(img, {
          clearProps: "all"
        });
      }else{
        gsap.set(arrow, {
          clearProps: "all"
        });
      } 
    }

    function onEnterAnimation(){
      headingInner.style.opacity = 1;
      if(img){
        img.style.opacity = 1;
      }else{
        arrow.style.transform = 'translateX(120%) scale(1)';
      }   
    }

    function onLeaveAnimation(){
      headingInner.style.opacity = 0.2;
      if(img){
        img.style.opacity = 0;
      }else{
        arrow.style.transform = 'translateX(120%) scale(0)';
      }   
    }
  });
}

function setCreativePostImages() {
  let selector = '.creative-post-card, .all-posts-link';

  let getSelectors = document.querySelectorAll(selector);
  if(getSelectors.length == 0) return;

  let currentX = targetX;
  let currentY = targetY;
  const ease = 0.11;
  let animationFrameId = null;

  creativeLatestPostsTrigger();

  const animate = () => {
    const deltaX = Math.abs(targetX - currentX);
    const deltaY = Math.abs(targetY - currentY);

    // Only update if there's a meaningful difference
    if (deltaX > 0.5 || deltaY > 0.5) {
      currentX += (targetX - currentX) * ease;
      currentY += (targetY - currentY) * ease;

      document.querySelectorAll('.creative-post-card-image-container').forEach(img => {
        img.style.transform = `translate(${currentX}px, ${currentY}px)`;
      });
    }

    animationFrameId = requestAnimationFrame(animate);
  };

  animate();
}

function setImageParallax() {
  killScrollTrigger('.parallax-image');

  document.querySelectorAll('.parallax-image img').forEach((image) => {
    const container = image.closest('.parallax-image');

    if(container.classList.contains('parallax-image-mobile') && window.innerWidth > 1080){
      image.style.transform = 'translateX(0%)';
      return;
    }else if(container.classList.contains('parallax-image-desktop') && window.innerWidth <= 1080){
      image.style.transform = 'translateX(0%)';
      return;
    }

    gsap.fromTo(
      image,
      { yPercent: -5 },
      {
        yPercent: 5,
        ease: 'none',
        scrollTrigger: {
          trigger: container,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        },
      }
    );
  });
}

function pageLoadAnimations() {
  let easeInAnimations = document.querySelectorAll('.ease-in-animation');
  let easeInAnimationsNoStagger = document.querySelectorAll('.ease-in-animation-no-stagger');
  let opacityAnimations = document.querySelectorAll('.opacity-animation');
  let imageAnimations = document.querySelector('.image-animation');

  if(easeInAnimations.length > 0){
    gsap.to(easeInAnimations, {
      opacity: 1,
      y: 0,
      duration: 1.2,
      delay: 0.25,
      stagger: 0.03,
      ease: 'expo.out',
    });
  }

  if(easeInAnimationsNoStagger.length > 0){

    gsap.to(easeInAnimationsNoStagger, {
      opacity: 1,
      y: 0,
      duration: 1.2,
      delay: 0.2,
      ease: 'expo.out',
    });
  }

  if(opacityAnimations.length > 0){
    gsap.to(opacityAnimations, {
      opacity: 1,
      duration: 1.2,
      delay: 0.25,
      stagger: 0.1,
      ease: 'expo.out',
    });
  }

  if(imageAnimations){
    gsap.fromTo(
      imageAnimations,
      {
          opacity: 0
      },
      {
          opacity: 1,
          duration: 0,
          ease: 'power2.out',
      }
    );
  }

  //Adding a class here instead of animation because there was a problem with Lightense & this animation
  let postContent = document.querySelector('.post-content');
  if(postContent){
      postContent.classList.add('visible-content')
  }
}

let lenis;

function setSmoothScroll() {
  if(window.safari !== undefined) return;

  if (lenis) {
    lenis.destroy();
  }

  let speed = 0.6;

  lenis = new Lenis({
    duration: speed,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false
  })

  function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
  }

  requestAnimationFrame(raf);
}

function detectImageBrightness(imgElement) {
  // Commented out - automatic contrast detection for masonry grid images
  /*
  const img = imgElement.querySelector('img');
  if (!img) return;

  img.onload = function() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Use smaller sample for performance
    const sampleSize = 50;
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    
    ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
    
    const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
    const data = imageData.data;
    let brightness = 0;
    let pixelCount = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      // Skip transparent pixels
      if (data[i + 3] > 0) {
        brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
        pixelCount++;
      }
    }
    
    if (pixelCount > 0) {
      brightness = brightness / pixelCount;
      
      // Apply appropriate blend mode based on brightness to the image only
      if (brightness < 128) {
        // Dark image - use darken blend mode with light background
        img.style.mixBlendMode = 'darken';
        img.style.backgroundColor = '#ffffff';
        img.style.padding = '2px';
      } else {
        // Light image - use lighten blend mode with dark background
        img.style.mixBlendMode = 'lighten';
        img.style.backgroundColor = '#000000';
        img.style.padding = '2px';
      }
    }
  };
  
  // Trigger detection if image is already loaded
  if (img.complete) {
    img.onload();
  }
  }
  */
}

function applyImageGridPattern() {
  const postContent = document.querySelector('.post-content-inner');
  if (!postContent) {
    console.log('No .post-content-inner found');
    return;
  }

  const children = Array.from(postContent.children);
  console.log('Found', children.length, 'children in post-content-inner');

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
      console.log('Found kg-header at index', i);
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

      console.log('Found', images.length, 'images after kg-header');

      // Check if there are 3-9 images and the next element is a divider
      if (images.length >= 3 && images.length <= 9 &&
          nextIndex < children.length &&
          children[nextIndex].tagName === 'HR') {

        console.log('Pattern matched! Creating masonry grid with', images.length, 'images');

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

          // Detect image brightness and apply appropriate blend mode to the image only
          // detectImageBrightness(img);
        });

        console.log('Masonry grid created successfully with colored backgrounds');
      } else {
        if (images.length < 3) {
          console.log('Not enough images (need 3-9, found', images.length + ')');
        } else if (images.length > 9) {
          console.log('Too many images (need 3-9, found', images.length + ')');
        } else if (nextIndex >= children.length || children[nextIndex].tagName !== 'HR') {
          console.log('No HR divider found after images');
        }
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

  for (let i = 0; i < children.length - 1; i++) {
    const currentEl = children[i];
    const nextEl = children[i + 1];

    const currentIsImage = currentEl.classList.contains('kg-image-card');
    const currentIsCallout = currentEl.classList.contains('kg-callout-card');
    const nextIsImage = nextEl.classList.contains('kg-image-card');
    const nextIsCallout = nextEl.classList.contains('kg-callout-card');

    // Check if we have an image card followed by a callout card or vice versa
    if ((currentIsImage && nextIsCallout) || (currentIsCallout && nextIsImage)) {
      // Create a wrapper for the grid
      const wrapper = document.createElement('div');
      wrapper.className = 'kg-image-callout-grid';

      // Insert wrapper before the first element
      currentEl.parentNode.insertBefore(wrapper, currentEl);

      // Move both elements into the wrapper
      wrapper.appendChild(currentEl);
      wrapper.appendChild(nextEl);

      // Skip the next element since we've already processed it
      i++;
    }
  }
}