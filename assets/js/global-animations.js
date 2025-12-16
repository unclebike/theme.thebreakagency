/**
 * Global Animations - GSAP-dependent functions
 * Loads after GSAP/ScrollTrigger are available
 */

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Refresh ScrollTrigger on resize
window.addEventListener('resize', debounce(() => {
  ScrollTrigger.refresh();
}, 800));

function resetScrollTriggers(){
  ScrollTrigger.refresh();
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

    let mm = gsap.matchMedia();
    
    mm.add("(max-width: 1080px)", () => {
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
    });
    
    mm.add("(min-width: 1081px)", () => {
      removeStyles(); 
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

/**
 * Initialize all animations
 * Called after GSAP is loaded and DOM is ready
 */
function initAnimations() {
  hexToRgba();
  pageLoadAnimations();
  setCreativePostImages();
  setImageParallax();
  applyImageGridPattern();
  applyImageCalloutGridPattern();

  let oldWidth = window.innerWidth;

  window.addEventListener('resize', debounce(() => {
      if(oldWidth == window.innerWidth) return;
      oldWidth = window.innerWidth;
      setImageParallax();
  }, 100));
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAnimations);
} else {
  initAnimations();
}
