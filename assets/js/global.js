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

function setToggle() {
  // Only run on post/page templates (not home page)
  const postContent = document.querySelector('.post-content');
  if (!postContent) return;

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
  // Only run on post/page templates (not home page)
  const postContent = document.querySelector('.post-content');
  if (!postContent) return;

  const toggleCards = document.querySelectorAll('.kg-toggle-card');
  if (toggleCards.length === 0) return;

  const allImageFigures = document.querySelectorAll('.post-content .kg-image-card');
  const imageFigures = Array.from(allImageFigures).filter(figure => {
    return !figure.classList.contains('kg-gallery-image') &&
           !figure.closest('.kg-gallery-card') &&
           !figure.closest('.kg-gallery-container') &&
           !figure.closest('circles-component') &&
           !figure.closest('.circles-section') &&
           !figure.closest('.circle-scrollers') &&
           !figure.closest('.parallax-image') &&
           !figure.closest('.image-animation') &&
           !figure.closest('.ease-in-animation') &&
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

  gsap.registerPlugin(ScrollTrigger);

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

  creativeLatestPostsTrigger();

  const animate = () => {
    currentX += (targetX - currentX) * ease;
    currentY += (targetY - currentY) * ease;

    document.querySelectorAll('.creative-post-card-image-container').forEach(img => {
      img.style.transform = `translate(${currentX}px, ${currentY}px)`;
    });

    requestAnimationFrame(animate);
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