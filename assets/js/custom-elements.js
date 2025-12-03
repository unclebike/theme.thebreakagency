document.addEventListener('DOMContentLoaded', function () {
    if (!customElements.get('custom-header')) {
        customElements.define('custom-header', class CustomHeader extends HTMLElement {
            constructor() {
                super(); 

                this.navbar = this;                      
                this.setNavigation(this);
                this.secondLevelMenu();
                this.navbarTopPadding = parseFloat(window.getComputedStyle(this.navbar.querySelector('.navbar')).paddingTop);
                this.navHeight = parseFloat(window.getComputedStyle(this.navbar.querySelector('.nav')).height);
                this.circles = this.querySelectorAll('.navbar-circle')

                window.addEventListener('resize', debounce(() => {
                    this.navbarTopPadding = parseFloat(window.getComputedStyle(this.navbar.querySelector('.navbar')).paddingTop);  
                    this.navHeight = parseFloat(window.getComputedStyle(this.navbar.querySelector('.nav')).height);
                }, 50));

                this.setAnnouncementBar();
                this.setCircle();

                this.blurTimeout;
                this.blurEl = document.querySelector('.background-blur');

                let bgMedia = document.querySelector('.hero-section .background-image') || document.querySelector('.all-posts-section');

                if(!bgMedia){
                    this.querySelectorAll('.links-label').forEach(label => {
                        label.parentElement.addEventListener('mouseenter', this.blurHoverIn.bind(this));
                        label.parentElement.addEventListener('mouseleave', this.blurHoverOut.bind(this));
                    })
                }

                if(this.blurEl) {
                    this.blurEl.addEventListener('click', this.blurHoverOut.bind(this))

                    let darkBlur = document.querySelector('[data-dark-background-blur="true"]');
                    if(darkBlur){
                        this.blurEl.classList.add('dark-background-blur');
                    }
                }
            }

            blurHoverIn(){
                if(window.matchMedia('(max-width: 1080px)').matches) return;

                const bgBlur = document.querySelector('.background-blur');

                bgBlur.style.pointerEvents = 'auto';
                bgBlur.style.display = 'block';

                if(this.blurTimeout) {
                    clearTimeout(this.blurTimeout);
                }

                setTimeout(() => {
                    bgBlur.style.opacity = 1;
                }, 10);
            }

            blurHoverOut() {
                if(window.matchMedia('(max-width: 1080px)').matches) return;
                
                const bgBlur = document.querySelector('.background-blur');

                bgBlur.style.opacity = 0;
                this.blurTimeout = setTimeout(() => {
                    bgBlur.style.pointerEvents = 'none';
                    bgBlur.style.display = 'none';
                }, 200);
            }

            setAnnouncementBar(){
                let announcementBar = document.querySelector('#announcement-bar-root');
                
                if(announcementBar){
                    this.navbar.insertBefore(announcementBar, this.navbar.firstChild);
                }
            }
            
            setCircle() {
                if(!this.circles) return;
                let targetY = window.innerHeight / 2;
                let currentY = targetY;
                const ease = 0.11;
            
                window.addEventListener('mousemove', (event) => {
                    let announcementBar = document.querySelector('#announcement-bar-root');
                    let announcementBarHeight = 0;
                    if(announcementBar){
                        announcementBarHeight = parseFloat(window.getComputedStyle(announcementBar).height);
                    }
                    targetY = event.clientY - this.navHeight - this.navbarTopPadding - 3 - announcementBarHeight;
                });
            
                const animate = () => {
                    currentY += (targetY - currentY) * ease;
                    this.circles.forEach(circle => {
                        circle.style.top = `${currentY}px`;  
                    })                          
                    requestAnimationFrame(animate);
                };
            
                animate();
            }

            setNavigation(){
                const menuBtn = this.querySelector('.menu-button');
                const menu = this.querySelector('.navbar-links-outer');
                const navbar = this;
                menu.style.transition = 'opacity 0.3s var(--ease-transition)';

                if(document.querySelector('main')?.getAttribute('data-accent-navigation') === 'true'){
                    navbar.querySelector('.navbar').classList.add('navbar-accent');
                }
            
                menuBtn.addEventListener('click', e => menuHandler(e));
                window.addEventListener('resize', debounce(() => {menuOnResize()}, 100)); //leave at 100, if smaller there is a bug with scrolling to the top
            
                function menuHandler(e){ 
                    if(menu.getAttribute('isopen') == 'true'){
                        closeMenu();
                    }else{
                        openMenu();
                    }
                }
            
                function closeMenu(){
                    unsetAccentNavbar(this);
                    enableScrolling();
            
                    if(window.matchMedia('(max-width: 1080px)').matches){
                        setTimeout(() => {
                            menu.style.display = 'none';
                            menu.setAttribute("isopen", false);
                        }, 300);
                        menu.style.opacity = '0';
                    }
                
                    menuBtn.querySelector('.first-line').style.position = 'static';
                    menuBtn.querySelector('.first-line').style.transform = 'rotateZ(0deg)';
                    menuBtn.querySelector('.second-line').style.position = 'static';
                    menuBtn.querySelector('.second-line').style.transform = 'rotateZ(0deg)';
                    menuBtn.querySelector('.mobile-line').style.opacity = '1';
                }
                
                function openMenu(){     
                    setAccentNavbar(this);

                    disableScrolling();
                    menu.setAttribute("isopen", true);
                
                    menu.style.display = 'flex';
                        setTimeout(() => {
                            menu.style.opacity = '1';
                    }, 10);
                
                    
                    menu.style.height = '100dvh';
                    menuBtn.querySelector('.first-line').style.position = 'absolute';
                    menuBtn.querySelector('.first-line').style.transform = 'rotateZ(-45deg)';
                    menuBtn.querySelector('.second-line').style.position = 'absolute';
                    menuBtn.querySelector('.second-line').style.transform = 'rotateZ(45deg)';
                    menuBtn.querySelector('.mobile-line').style.opacity = '0';
                }
                
                function menuOnResize(){
                    if(window.matchMedia('(max-width: 1080px)').matches){
                        unsetAccentNavbar(this);
                        menu.classList.remove('desktop-navbar');
                        if(menu.getAttribute('isopen') == 'true'){
                            setAccentNavbar(this); 
                            disableScrolling();
                        }                        
                    }else{
                        unsetAccentNavbar(this);
                        menu.classList.add('desktop-navbar');                        
                        enableScrolling(false);
                    }
                }

                function setAccentNavbar(){
                    if(document.querySelector('main')?.getAttribute('data-accent-navigation') === 'true') return;
                    navbar.querySelector('.navbar').classList.add('navbar-accent');
                }
    
                function unsetAccentNavbar(){
                    if(document.querySelector('main')?.getAttribute('data-accent-navigation') === 'true') return;
                    navbar.querySelector('.navbar').classList.remove('navbar-accent');
                }
            }

            secondLevelMenu(){
                let navArray = [];
                const navbar = this.querySelector('.nav');
                if(navbar){
                    navbar.querySelectorAll('li').forEach(link => {      
                        if (link.dataset.label.charAt(0) === "-") {
                        link.dataset.parent = link.dataset.label.substring(1);                               
                        if(link.dataset.label.includes("--")){
                            var data = link.dataset.parent.split("--")
                            link.dataset.parent = data[0];
                            link.dataset.child = data[1];
                            
                            link.querySelector('.nav-link').innerHTML = link.dataset.child;
                            link.querySelector('.nav-link').setAttribute('tabindex', '0');
                            navArray.push({parent: data[0], child: link});
                        }else{
                            link.querySelector('.nav-link').innerHTML = link.dataset.parent;  
                
                            const anchor = link.querySelector('a');
                            const div = document.createElement('div');
                            const ul = document.createElement('ul');
                            const container = document.createElement('div');
                            const circle = document.createElement('li');                   
                                
                            div.innerHTML = anchor.innerHTML;
                            div.classList.add('links-label', 'medium-text', 'smaller');                         
                            div.dataset.label = link.dataset.parent;
                            div.innerHTML += `
                                <div class="navbar-label-circle">
                                </div>
                            `
                            anchor.parentNode.replaceChild(div, anchor);
                
                            link.appendChild(container);
                            container.classList.add('secondary-links');
                            container.appendChild(ul)                                    
                            ul.classList.add('secondary-links-inner');
                            circle.classList.add('navbar-circle')
                            ul.appendChild(circle)
                            //secondary links handler for mobile
                            div.addEventListener('click', e => this.openCloseLinksOnMobile(link));
                            window.addEventListener('resize', debounce(() => {this.secondaryLinksOnResize(link)}, 10));
                        }               
                        }
                    })
                
                    //move links
                    navArray.forEach(item => {
                        var secondaryList = document.querySelector(`.nav div.links-label[data-label="${item.parent}"]`).parentNode.querySelector('ul');
                        secondaryList.appendChild(item.child);
                    })

                    navbar.style.display = 'flex';
                }
            }

            openCloseLinksOnMobile(link){
                if(window.matchMedia('(max-width: 1080px)').matches){
                    let container = link.querySelector('.secondary-links');
                    container.offsetHeight == 0 ? container.style.height = 'auto' : container.style.height = '0px';
                }
            }
            
            secondaryLinksOnResize(link){
                let container = link.querySelector('.secondary-links');
                window.matchMedia('(max-width: 1080px)').matches ? container.style.height = '0px' : container.style.height = 'auto';
            }

        })
    }

    if (!customElements.get('custom-notifications')) {
        customElements.define('custom-notifications', class CustomNotifications extends HTMLElement {
            constructor() {
                super(); 

                this.setNotification();
            }
    
            setNotification() {
                var action = getParameterByName('action');
                var stripe = getParameterByName('stripe');
                var success = getParameterByName('success');
            
                if(success == null && action == null && stripe == null) return;
        
                var notifications = document.querySelector('.global-notifications');
                if(stripe){
                    notifications.classList.add(`stripe-${stripe}`);
        
                    notifications.addEventListener('animationend', () => {
                        notifications.classList.remove(`stripe-${stripe}`);
                    });
                }else{
                    notifications.classList.add(`${action}-${success}`);
        
                    notifications.addEventListener('animationend', () => {
                        notifications.classList.remove(`${action}-${success}`);
                    });
                }
            }           
        })
    }

    if (!customElements.get('custom-pagination')) {
        customElements.define('custom-pagination', class CustomPagination extends HTMLElement {
            constructor() {
                super(); 
                
                this.loadMoreBtn = this.querySelector("#load-more-btn");               
                
                if(this.loadMoreBtn){
                    this.loadMoreBtn.addEventListener("click", () => {
                        this.loadMorePosts();
                    });
                }
            }
    
            loadMorePosts(cleanList = false) {
                let currentPage = parseInt(this.getAttribute("data-current-page"));
                let nextPage = cleanList ? currentPage = 1 : currentPage + 1;
                let startUrl = window.location;

                if(this.getAttribute('data-is-archivepage') == "true"){
                    let tagName = document.querySelector('archive-tags').getAttribute('data-current-tag')
                    tagName == "all-tags" ? startUrl = window.location.origin + "/": startUrl = window.location.origin + `/tag/${tagName}/`
                }
                
                let url = startUrl + `page/${nextPage}/`;

    
                // Make the AJAX request
                fetch(url)
                    .then(response => response.text())
                    .then(data => {
                        let parser = new DOMParser();
                        let html = parser.parseFromString(data, "text/html");
                        let grid = document.querySelector("#pagination-grid");
                        let newPosts = html.querySelector("#pagination-grid").innerHTML;
                        
                        // Append the new posts to the existing ones
                        cleanList ? grid.innerHTML = newPosts : grid.insertAdjacentHTML("beforeend", newPosts);     
                        
                        // Update the "Load more" button attributes
                        this.setAttribute("data-current-page", nextPage);
                        if(this.loadMoreBtn){
                            this.loadMoreBtn.style.display = html.querySelector("#load-more-btn") ? "block" : "none";
                        }

                        let footer =  document.querySelector('custom-footer');
                        let isCreativeFooter = footer.getAttribute('data-is-creative') == 'true' ? true : false;
                        if(isCreativeFooter){
                            footer.footerAnimation();
                        }
                    })
                    .catch(error => {
                        console.error("Error loading more posts:", error);
                    });
            }
        })
    }

    if (!customElements.get('archive-tags')) {
        customElements.define('archive-tags', class ArchiveTags extends HTMLElement {
            constructor() {
                super(); 

                this.querySelectorAll('.archive-tag-button').forEach(button => {
                    button.addEventListener('change', this.archiveButtonChange.bind(this))
                })

                this.container = this;
                this.makeDraggable();
                this.setGradient(document.querySelector('.tags-gradient-before'));
            }

            makeDraggable() {
                let isDown = false;
                let startX;
                let scrollLeft;
                let isDragging = false; // Track drag state
                let container = this.container;
            
                container.addEventListener('mousedown', (e) => {
                    isDown = true;
                    isDragging = false; // Reset drag state
                    container.classList.add('active'); // Optional: Add styling when dragging
                    startX = e.pageX - container.offsetLeft;
                    scrollLeft = container.scrollLeft;
                });
            
                container.addEventListener('mousemove', (e) => {
                    if (!isDown) return;
                    e.preventDefault();
                    isDragging = true; // Dragging detected
                    const x = e.pageX - container.offsetLeft;
                    const walk = x - startX;
                    container.scrollLeft = scrollLeft - walk;
                });
            
                container.addEventListener('mouseup', () => {
                    isDown = false;
                    container.classList.remove('active');
                });
            
                container.addEventListener('mouseleave', () => {
                    isDown = false;
                    container.classList.remove('active');
                });
            
                // Prevent button clicks after dragging
                container.querySelectorAll('.button').forEach((btn) => {
                    btn.addEventListener('click', (e) => {
                        if (isDragging) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    });
                });
            }
            
            setGradient(container, direction = 'left') {
                const rootStyle = getComputedStyle(document.documentElement);
                let bgColor = rootStyle.getPropertyValue('--background-color').trim() || '#ffffff'; // Default to white
            
                function hexToRgb(hex) {
                    hex = hex.replace(/^#/, '');
                    if (hex.length === 3) {
                        hex = hex.split('').map(x => x + x).join('');
                    }
                    let bigint = parseInt(hex, 16);
                    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
                }
            
                let [r, g, b] = hexToRgb(bgColor);
            
                let gradient = `linear-gradient(
                    to ${direction}, 
                    rgba(${r}, ${g}, ${b}, 0) 0%, 
                    rgba(${r}, ${g}, ${b}, 0.5) 40%, 
                    rgba(${r}, ${g}, ${b}, 0.9) 80%, 
                    rgba(${r}, ${g}, ${b}, 1) 95%
                )`;
            
                container.style.background = gradient;
            }

            archiveButtonChange(e){  
                this.setAttribute('data-current-tag', e.target.id);
                this.setAttribute('data-current-tag-name', e.target.getAttribute('data-name'));

                document.querySelector('#archive-posts-number').textContent =  `${e.target.getAttribute('data-number')}`;
                
                // Make the AJAX request
                document.getElementById('custom-pagination').loadMorePosts(true);
            }
        })
    }

    if (!customElements.get('custom-membership')) {
        customElements.define('custom-membership', class CustomMembership extends HTMLElement {
            constructor() {
                super(); 
    
                document.querySelectorAll('.membership-button').forEach(button => {
                    button.addEventListener('click', this.tabChange.bind(this))
                })

                this.setSaving()
            }

            setSaving(){
                let percentage = 0;
                this.querySelectorAll('.membership-tiers[data-tab-content="yearly"] .tier-card').forEach(card => {
                    let yearly = parseFloat(card.getAttribute('data-yearly'));
                    let monthly = parseFloat(card.getAttribute('data-monthly')) * 12;
                    let tempPercentage = parseInt(100 - (yearly / monthly) * 100);

                    if(tempPercentage > percentage){
                        percentage = tempPercentage;
                    }
                })

                if(percentage > 0){
                    document.querySelector('#save-number').innerHTML = percentage + "%";
                    document.querySelector('.save-container').style.display = 'flex';
                }
            }
    
            tabChange(e) {
                if(e.target.getAttribute('data-inactive') == "true"){
                    e.target.setAttribute('data-inactive', "false");
                    let name = e.target.getAttribute('data-tab')
                    this.querySelector(`.membership-tiers[data-tab-content=${name}]`).setAttribute('data-inactive', "false")
            
                    let oposite;
                    name == "yearly" ? oposite = "monthly" : oposite = "yearly"
            
                    document.querySelector(`.membership-button[data-tab=${oposite}]`).setAttribute('data-inactive', "true");
                    this.querySelector(`.membership-tiers[data-tab-content=${oposite}]`).setAttribute('data-inactive', "true")
                }   
            }
        })
    }

    if (!customElements.get('contact-socials')) {
        customElements.define('contact-socials', class ContactSocials extends HTMLElement {
            constructor() {
                super(); 

                this.init();
            }

            init(){
                let data = document.querySelector('#contact-data');
                if(!data) return;

                const contactData = JSON.parse(data.textContent);
                
                if(contactData.email){
                    this.querySelector('#email').href = `mailto:${contactData.email}`
                    this.querySelector('#email').style.display = 'flex'
                }

                if(contactData.phone){
                    this.querySelector('#phone').href = `tel:${contactData.phone}`
                    this.querySelector('#phone').style.display = 'flex'
                }

                if(contactData.address){
                    this.querySelector('#address').href = contactData.address;
                    this.querySelector('#address').style.display = 'flex'
                }
            }
        })
    }

    if (!customElements.get('custom-form')) {
        customElements.define('custom-form', class CustomForm extends HTMLElement {
            constructor() {
                super();

                const formElement = this.querySelector('form');
                const heading = document.querySelector('.form-page-content h1');
                const description = this.querySelector('.form-page-paragraph p');
                const homeButton = document.querySelector('.form-success-button');
                const successHeading = this.querySelector("#form-success-heading-text")?.getAttribute('data-success-heading');
                const successParagraph = this.querySelector("#form-success-paragraph-text")?.getAttribute('data-success-paragraph');

                // Handle user type toggle
                const toggleInputs = this.querySelectorAll('input[name="user-type"]');
                const slider = this.querySelector('.toggle-slider');

                if (toggleInputs.length > 0 && slider) {
                    toggleInputs.forEach((input, index) => {
                        input.addEventListener('change', (e) => {
                            if (e.target.value === 'normie') {
                                // Prevent form submission for normies
                                e.preventDefault();

                                // Hide the form
                                formElement.style.display = "none";

                                // Update description only (heading stays the same)
                                description.innerHTML = "Thanks for your interest! Please reach out to us directly and we'll get back to you soon.";

                                // Show a contact button instead
                                const contactButton = document.createElement('a');
                                contactButton.href = 'mailto:hello@thebreaksales.ca';
                                contactButton.className = 'button form-success-button';
                                contactButton.style.display = 'block';
                                contactButton.textContent = 'Email Us';

                                // Replace or insert the button
                                const existingButton = this.querySelector('.form-success-button');
                                if (existingButton) {
                                    existingButton.replaceWith(contactButton);
                                } else {
                                    this.appendChild(contactButton);
                                }
                            } else if (e.target.value === 'dealer') {
                                // Show the form again for dealers
                                formElement.style.display = "flex";

                                // Reset description to original (heading stays the same)
                                const originalDescription = description.getAttribute('data-original-description');

                                if (originalDescription) {
                                    description.innerHTML = originalDescription;
                                }

                                // Hide the email button
                                const emailButton = this.querySelector('.form-success-button');
                                if (emailButton && emailButton.textContent === 'Email Us') {
                                    emailButton.style.display = 'none';
                                }
                            }
                        });
                    });

                    // Store original description only
                    description.setAttribute('data-original-description', description.innerHTML);
                }

                let success = false;
                const observer = new MutationObserver(function(mutationsList) {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const classList = mutation.target.classList;
                    if (classList.contains('success') && !success) {
                        success = true;

                        formElement.style.display = "none";

                        heading.innerHTML = successHeading;
                        homeButton.style.display = "block";

                        description.innerHTML = successParagraph;
                    }
                    }
                }
                });

                observer.observe(formElement, { attributes: true });
            }
        })
    }

    if (!customElements.get('featured-posts')) {
        customElements.define('featured-posts', class FeaturedPosts extends HTMLElement {
            constructor() {
                super(); 

                this.container = this;
                this.isAnimating = false;
                this.cardMaxHeight = 0;
                this.enablePreview = this.container.getAttribute('data-enable-preview');
                this.circleContainer = this.container.querySelector('.featured-posts-list');
                this.circle = document.querySelector('.featured-posts-circle');
                this.init();

                window.addEventListener('resize', debounce(() => {
                    this.cardMaxHeight = 0;
                    if(window.matchMedia('(max-width: 1080px)').matches) return;

                    this.container.querySelectorAll('.featured-post').forEach(post => {
                        this.getSectionMinHeight(post); 
                        post.querySelector('.featured-post-heading-wrapper').style.opacity = '';
                        post.querySelector('.featured-post-top').style.height = '';
                        post.querySelector('.featured-post-content').style.height = '';
                    })
                    this.container.style.minHeight = `max(calc(54px + ${this.cardMaxHeight}px), calc((3.75vw + ${this.cardMaxHeight}px) * var(--scale)))`;
                }, 100));
            }

            init(){
                this.container.querySelectorAll('.featured-post').forEach(post => {
                    let heading = post.querySelector('.featured-post-heading-wrapper');
                    let stickyContent = post.querySelector('.featured-post-content');

                    stickyContent.addEventListener('mouseover', (e) => {
                        this.circle.style.display = 'none';
                    })

                    stickyContent.addEventListener('mouseout', (e) => {
                        this.circle.style.display = 'block';
                    })
                    
                    heading.addEventListener('mouseover', (e) => {
                        this.setActivePost(post)
                    })

                    heading.addEventListener('touchstart', (e) => {
                        this.setActivePost(post);
                    }); 

                    if(this.enablePreview == 'true'){
                        heading.addEventListener('click', (e) => {
                            this.setPostPreview(post);
                        }); 
                    }
                    
                    if(!window.matchMedia('(max-width: 1080px)').matches){
                        this.getSectionMinHeight(post); 
                    }                   
                })
             
                this.setActivePost(this.container.querySelectorAll('.featured-post')[0]); 

                this.setCircle();
                
                if(window.matchMedia('(max-width: 1080px)').matches) return;
                this.container.style.minHeight = `max(calc(54px + ${this.cardMaxHeight}px), calc((3.75vw + ${this.cardMaxHeight}px) * var(--scale)))`;
            }  
            
            setCircle() {             
                let currentY = targetY;
                const ease = 0.11;      
            
                const animate = () => {
                    currentY += (targetY - currentY) * ease;
                    this.circle.style.top = `${currentY}px`;         
                    requestAnimationFrame(animate);
                };
            
                animate();
            }
            
            
            setActivePost(post){
                let activePost = this.container.querySelector('.active-post');

                if(activePost && activePost != post){
                    activePost.classList.remove('active-post');
                }
                
                post.classList.add('active-post');
            }

            getSectionMinHeight(post){
                let content = post.querySelector('.featured-post-sticky-content');
                if(this.cardMaxHeight < content.offsetHeight){
                    this.cardMaxHeight = content.offsetHeight;
                }  
                
                post.querySelector('.featured-post-content').style.display = "none";
            }

            setPostPreview(post){
                if(!window.matchMedia('(max-width: 1080px)').matches) return;
                if(this.isAnimating) return;

                this.isAnimating = true;

                let container = post.querySelector('.featured-post-content');
                let topPart = post.querySelector('.featured-post-top');
                let heading = post.querySelector('.featured-post-heading-wrapper');

                if (container.style.height === '0px' || !container.style.height) {                
                    container.style.height = `${container.scrollHeight}px`;
                    topPart.style.height = `${topPart.scrollHeight}px`;
                    heading.style.opacity = 1;       
                    
                    setTimeout(() => {
                        container.style.height = 'auto';
                        topPart.style.height = 'auto';
                        this.isAnimating = false;
                    }, 500);
                } else {
                    container.style.height = `${container.scrollHeight}px`;
                    topPart.style.height = `${topPart.scrollHeight}px`;

                    setTimeout(() => {
                        container.style.height = '0px';
                        topPart.style.height = '0px';
                    }, 20); 

                    setTimeout(() => {
                        this.isAnimating = false;
                    }, 520);

                    heading.style.opacity = 0.2;
                }     
            }
        })
    }

    if (!customElements.get('all-posts')) {
        customElements.define('all-posts', class AllPosts extends HTMLElement {
            constructor() {
                super(); 

                this.container = this;
                this.circle = document.querySelector('.all-posts-circle');
                this.init();
            }

            init(){
                this.container.querySelectorAll('.all-posts-item').forEach(post => {
                    let heading = post.querySelector('.all-posts-item-link');
                    
                    heading.addEventListener('mouseover', (e) => {
                        this.setActivePost(post)
                    })

                    heading.addEventListener('touchstart', (e) => {
                        this.setActivePost(post);
                    });                  
                })

                this.setCircle();
                this.allPostsMobileTrigger();
            }  
            
            setCircle() {             
                let currentY = targetY;
                const ease = 0.11;      
            
                const animate = () => {
                    currentY += (targetY - currentY) * ease;
                    this.circle.style.top = `${currentY}px`;         
                    requestAnimationFrame(animate);
                };
            
                animate();
            }
            
            
            setActivePost(post){
                if(window.matchMedia('(max-width: 1080px)').matches) return;
                
                let activePost = this.container.querySelector('.active');

                if(activePost && activePost != post){
                    activePost.classList.remove('active');
                }
                
                post.classList.add('active');
            }

            allPostsMobileTrigger(){
                let container = this.container;
                let selector = '.all-posts-item';
              
                gsap.registerPlugin(ScrollTrigger);
              
                killScrollTrigger(selector);
              
                document.querySelectorAll(selector).forEach(heading => {
                  let img = heading.querySelector('.all-posts-background-image');
                  let headingInner = heading.querySelector('.all-posts-item-link');
              
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
                    /* gsap.set(headingInner, {
                      clearProps: "all"
                    });
                    if(img){
                      gsap.set(img, {
                        clearProps: "all"
                      });
                    } */
                  }
              
                  function onEnterAnimation(){
                    /* headingInner.style.opacity = 1;
                    if(img){
                      img.style.opacity = 1;
                    }  */ 
                    let activePost = container.querySelector('.active');
                    if(activePost){
                        activePost.classList.remove('active');
                    }
                    
                    heading.classList.add('active');
                  }
              
                  function onLeaveAnimation(){
                    /* headingInner.style.opacity = 0.2;
                    if(img){
                      img.style.opacity = 0;
                    }  */
                      let activePost = container.querySelector('.active');
                      if(activePost){
                          activePost.classList.remove('active');
                      }
                      
                      heading.classList.add('active');
                  }
                });
              }
        })
    }

    if (!customElements.get('slider-component')) {
        customElements.define(
            'slider-component',
            class SliderComponent extends HTMLElement {
                constructor() {
                    super();

                    this.slider = this;
                    this.flkty = null;
                    this.currentIndex = 1;
                    this.numberTrack = this.slider.querySelector('.current-slide-number-inner');
                    this.slideNumber = this.slider.querySelectorAll('.slide').length;

                    this.prevButton = this.querySelector('.slider-button[name="previous"]');
                    this.nextButton = this.querySelector('.slider-button[name="next"]');

                    this.init();
                }

                init() {
                    // Wait for Flickity to be available
                    if (typeof Flickity === 'undefined') {
                        setTimeout(() => this.init(), 50);
                        return;
                    }

                    this.flkty = new Flickity(this.slider.querySelector('.slider-wrapper'), {
                        cellAlign: 'center',
                        prevNextButtons: false,
                        pageDots: false,
                        draggable: true,
                        selectedAttraction: 0.07, //speed
                        friction: 1, //bounciness
                        fade: true,
                        on: {
                            ready: () => {
                              this.slider.querySelector('.slider-wrapper').setAttribute('tabindex', '-1');
                              this.animateSlideContent();
                              this.setLinkTabindex();
                              this.setupIndexSlideLinks();
                              this.formatSlideNumbers();
                            },
                        }
                    });

                    if (this.prevButton) {
                        this.prevButton.addEventListener('click', () => {
                            this.flkty.previous(true);
                        });
                    }

                    if (this.nextButton) {
                        this.nextButton.addEventListener('click', () => {
                            this.flkty.next(true);
                        });
                    }

                    this.flkty.on('change', this.onSlideChange.bind(this));

                    window.addEventListener(
                        'resize',
                        debounce(() => {
                          this.flkty.resize();
                          this.slider.querySelector('.flickity-viewport').style.height = "100%";
                        }, 100)
                    );

                    this.flkty.resize();
                }

                onSlideChange(index) {
                    this.animateSlideContent(false);
                    this.currentIndex = index + 1;
          
                    this.setLinkTabindex();

                    if (!this.numberTrack) return;

                    this.numberTrack.style.transform = `translateY(-${(100 / this.slideNumber) * index}%)`;
                }

                setLinkTabindex() {
                    let prevLinks = this.slider.querySelectorAll(`.slide:not(.is-selected) a`);
          
                    prevLinks.forEach((link) => {
                      link.setAttribute('tabindex', '-1');
                    });
          
                    let currentLink = this.slider.querySelector(`.slide.is-selected a`);
                    if (!currentLink) return;
          
                    currentLink.setAttribute('tabindex', '0');
                }

                setupIndexSlideLinks() {
                    const indexSlideItems = this.slider.querySelectorAll('.index-slide-item');
                    const slides = this.slider.querySelectorAll('.slide');

                    // Debug: log all slide slugs
                    console.log('All slides and their slugs:');
                    Array.from(slides).forEach((slide, index) => {
                        console.log(`Index ${index}: slug="${slide.getAttribute('data-slug')}"`);
                    });

                    indexSlideItems.forEach(item => {
                        item.addEventListener('click', (e) => {
                            e.preventDefault();
                            const targetSlug = item.getAttribute('data-target-slug');
                            console.log('Clicked item with target slug:', targetSlug);
                            if (targetSlug) {
                                // Find the slide with matching slug and get its DOM index
                                const targetIndex = Array.from(slides).findIndex(
                                    slide => slide.getAttribute('data-slug') === targetSlug
                                );
                                console.log('Found target index:', targetIndex);
                                if (targetIndex !== -1) {
                                    this.flkty.select(targetIndex);
                                }
                            }
                        });
                    });
                }

                formatSlideNumbers() {
                    const numbers = this.slider.querySelectorAll('.current-slide-number-inner span');
                    numbers.forEach((span, index) => {
                        span.textContent = String(index).padStart(2, '0');
                    });

                    // Format total slides
                    const total = this.slider.querySelector('.slider-navigation-total-slides .medium-text');
                    if (total) {
                        total.textContent = String(this.slideNumber).padStart(2, '0');
                    }
                }

                animateSlideContent(initial = true) {
                    let slide = this.querySelector('.slide.is-selected');

                    gsap.to(slide.querySelectorAll('.slide-ease-in-animation'), {
                      opacity: 1,
                      y: 0,
                      duration: 1.2,
                      delay: 0.25,
                      stagger: 0.03,
                      ease: 'expo.out',
                    });


                    gsap.fromTo(
                        slide.querySelector('.slide-image-animation'),
                        {
                            scale: 1.06,
                        },
                        {
                            scale: 1,
                            duration: 0.6,
                            ease: 'power2.out',
                        }
                    );

                    if (initial) return;

                    let prevSlide = this.querySelector(`.slide[data-slide-number='${this.currentIndex}']`);

                    gsap.to(prevSlide.querySelectorAll('.slide-ease-in-animation'), {
                      opacity: 0,
                      y: 30,
                      duration: 1.2,
                      stagger: 0.03,
                      ease: 'expo.out',
                    });

                }
            }
        );
    }

    if (!customElements.get('circles-component')) {
        customElements.define(
            'circles-component',
            class CirclesComponent extends HTMLElement {
                constructor() {
                    super();

                    this.container = this;
                    this.type = this.container.getAttribute('data-circles-content');
                    this.baseNumber;
                    this.type == "Brands" ? this.setBrands() : this.init();
                }

                init() {
                    this.setAnimationSpeed();

                    // Ensure GSAP and ScrollTrigger are ready before initializing animations
                    this.initCircleAnimation();

                    window.addEventListener('resize', debounce(() => {
                        this.setCircleAnimation();
                    }, 100));
                }

                initCircleAnimation() {
                    // Check if GSAP and ScrollTrigger are available
                    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
                        // Retry after a short delay
                        setTimeout(() => this.initCircleAnimation(), 50);
                        return;
                    }

                    // Ensure the circle animation element exists
                    const circleAnimation = document.querySelector('.circle-animation');
                    if (!circleAnimation) {
                        setTimeout(() => this.initCircleAnimation(), 50);
                        return;
                    }

                    // Wait for the next frame to ensure DOM is fully laid out
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            this.setCircleAnimation();
                            // Refresh ScrollTrigger after a short delay to ensure all calculations are correct
                            setTimeout(() => {
                                ScrollTrigger.refresh();
                            }, 100);
                        });
                    });
                }

                setBrands(){
                    const url = window.location.origin + "/brands/"
                    const temp = document.querySelector('#circle-pair-template');
                    fetch(url)
                        .then(response => response.text())
                        .then(data => {
                            let parser = new DOMParser();
                            let html = parser.parseFromString(data, "text/html");
                            let content = html.querySelector('.brands-main');

                            if(!content) return;

                            content.querySelectorAll('figure').forEach(figure => {
                                let clone = temp.content.cloneNode(true);
                                let contentText = figure.querySelector('figcaption');
                                let [heading, text] = contentText.textContent.split(";").map(item => item.trim());

                                let data = {
                                    heading: heading,
                                    text: text
                                };

                                clone.querySelector('figure').appendChild(figure.querySelector('img'));
                                if(contentText){
                                    clone.querySelector('.medium-text').textContent = data.heading;
                                    clone.querySelector('.paragraph').textContent = data.text;
                                }

                                this.container.querySelectorAll('.infinite-scroll-content').forEach(batch => {
                                    let secondClone = clone.cloneNode(true);
                                    batch.appendChild(secondClone)
                                })
                            })
                        })
                        .finally(() => {
                            this.init();
                            setCreativePostImages();
                            resetScrollTriggers();
                            let settings = document.querySelector('settings-sidebar')
                            if(settings){
                                settings.showHideSettingButtons();
                            }
                        })
                        .catch(error => {
                            console.error("Error loading brands:", error);
                        });                   
                }

                setAnimationSpeed(){
                    this.baseNumber = this.container.querySelectorAll('.infinite-scroll-content')[0].querySelectorAll('.circle-element').length;

                    this.querySelectorAll('.infinite-scroll-content').forEach(el => {
                        if(el.parentNode.parentNode.classList.contains('reversed')){
                            el.style.animation = `scroll-right ${6 * this.baseNumber}s linear infinite`;
                        }else{
                            el.style.animation = `scroll-left ${6 * this.baseNumber}s linear infinite`;
                        }
                    })
                }

                setCircleAnimation() {
                    const innerHeight = window.innerHeight;
                    const innerWidth = window.innerWidth;
                    const container = document.querySelector('.slider-with-circles');
                    const circleAnimation = document.querySelector('.slider-with-circles .circle-animation');

                    if (!container || !circleAnimation) return;

                    killScrollTrigger('.slider-with-circles');

                    if (window.matchMedia('(max-width: 1080px)').matches) {
                        container.style.marginBottom = '';
                        return;
                    }

                    if(!container.classList.contains('no-slider')){
                        // Set initial state to ensure circle is visible
                        gsap.set(circleAnimation, {
                            width: "0%",
                            height: "0%"
                        });

                        gsap.to(circleAnimation, {
                            scrollTrigger: {
                                trigger: container,
                                start: "top top",
                                end: () => {
                                    const vmax = Math.max(innerWidth, innerHeight);
                                    const aspectRatio = innerHeight / innerWidth;
                                    const scrollMultiplier = aspectRatio > 1 ? 3 : 2;
                                    return `${vmax * scrollMultiplier}px top`;
                                },
                                scrub: true,
                                immediateRender: false,
                            },
                            width: "100%",
                            height: "100%",
                        });
                    }

                    const height = container.querySelector('.infinite-scroll').offsetHeight;
                    const angle = 10 * (Math.PI / 180);
                    const rotatedHeight = Math.abs(height * Math.cos(angle)) + Math.abs(innerWidth * Math.sin(angle));

                    (rotatedHeight * 2.15 > innerHeight) ? container.style.marginBottom = `${rotatedHeight * 2.15 - innerHeight}px` : container.style.marginBottom = '0px';
                }
            }
        );
    }

    if (!customElements.get('custom-socials')) {
        customElements.define('custom-socials', class CustomSocials extends HTMLElement {
            constructor() {
                super(); 

                this.setSocials(this);
                this.container = this;
            }

            setSocials(){
                const url = window.location.origin + "/" + "socials/"
                fetch(url)
                    .then(response => response.text())
                    .then(data => {
                        let parser = new DOMParser();
                        let html = parser.parseFromString(data, "text/html");
                        let content = html.querySelector('.socials-main');

                        if(!content) return;
                        
                        content.querySelectorAll('figure').forEach(figure => {
                            const a = document.createElement('a');
                            a.classList.add('social', 'default-social');
                            a.setAttribute('target', '_blank');

                            let figcaption = figure.querySelector('figcaption');
                            if(figcaption){
                                a.setAttribute('aria-label', figcaption.textContent)
                            }
                 
                            a.href = figure.querySelector('a').href;
                            
                            const div = document.createElement('div');
                            div.classList.add('social-inner');
                            a.appendChild(div)

                            const image = document.createElement('img');
                            image.src = figure.querySelector('img').src;

                            if (this.isSVG(image.src)) {
                                fetch(image.src)
                                 .then(response => response.text())
                                 .then(svgContent => {
                                    const parser = new DOMParser();
                                    const svgElement = parser.parseFromString(svgContent, "image/svg+xml").documentElement;
                                    div.appendChild(svgElement)
                                 })
                                 .catch(error => console.error('Error fetching the SVG:', error));
                            } else {
                                div.appendChild(image)
                            }

                            this.container.appendChild(a)
                        })
                    })
                    .catch(error => {
                        console.error("Error loading socials:", error);
                    });
            }

            isSVG(url) {
                return url.split('?')[0].toLowerCase().endsWith('.svg');
            }
        })
    }

    if (!customElements.get('custom-footer')) {
        customElements.define('custom-footer', class CustomFooter extends HTMLElement {
            constructor() {
                super(); 
                
                this.container = this;
                this.isSecondLevel = false;
                this.isCreativeFooter = this.container.getAttribute('data-is-creative') == 'true' ? true : false;
                this.returnButton = this.querySelector('.return-button');

                if(this.isCreativeFooter){
                    this.secondLevelFooter(this); 
                    this.footerSlider();
                    this.footerAnimation();

                    this.mainHeightChange();
                }else{
                    this.secondLevelFooterNormal();
                }
                
                this.returnButton?.addEventListener('click', () => {
                    window.scroll({
                        top: 0,
                        behavior: 'smooth'
                    });
                })            
            }  

            mainHeightChange() {
                const mainElement = document.documentElement;
            
                if (!mainElement) return;
            
                const resizeObserver = new ResizeObserver(debounce(entries => {
                    for (let entry of entries) {
                        this.footerAnimation(); 
                    }
                }, 100));
            
                resizeObserver.observe(mainElement);
            }

            footerAnimation() {
                killScrollTrigger('.footer-outer');

                if (window.matchMedia('(max-width: 1080px)').matches) return;

                gsap.to(".footer-overlay-piece-inner", {
                    width: "100%",
                    ease: "none",
                    stagger: {
                        amount: 1,
                        from: "start"
                    },
                    scrollTrigger: {
                        trigger: ".footer-outer",
                        start: "top top",
                        end: "bottom bottom",
                        scrub: true
                    }
                });

                let bgColor = getComputedStyle(document.documentElement).getPropertyValue('--background-color').trim();
                let textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
            
                ScrollTrigger.create({
                    trigger: ".footer-outer",
                    start: "center center",
                    end: "center center",
                    onEnter: () => {
                        gsap.to(".footer-center-link .heading-1", {
                            color: bgColor,
                            duration: 0.2,
                            ease: "linear"
                        });

                        gsap.to(".footer-center-link .arrow-link-button", {
                            backgroundColor: bgColor,
                            color: textColor,
                            duration: 0.2,
                            ease: "linear"
                        });
                    },
                    onLeaveBack: () => {
                        gsap.to(".footer-center-link .heading-1", {
                            color: textColor,
                            duration: 0.2,
                            ease: "linear"
                        });

                        gsap.to(".footer-center-link .arrow-link-button", {
                            backgroundColor: textColor,
                            color: bgColor,
                            duration: 0.2,
                            ease: "linear"
                        });
                    }
                });  
            }
            
            footerSlider(){
                const slides = this.container.querySelectorAll('.footer-slide');

                const sliderTimeline = gsap.timeline({ repeat: -1 });

                slides.forEach((slide, index) => {
                    sliderTimeline.set(slide, { display: 'block' }, index * 0.8);
                    sliderTimeline.set(slide, { display: 'none' }, (index + 1) * 0.8);
                });

                gsap.set(slides[0], { display: 'block' });
            }
            
            secondLevelFooter(){
                let navArray = [];             
                const footerNav = document.querySelector('.footer-nav');
                if(footerNav){
                    footerNav.querySelectorAll('li').forEach(link => {        
                        if (link.dataset.label.charAt(0) === "-") {                       
                            link.dataset.parent = link.dataset.label.substring(1);
                            if(link.dataset.label.includes("--")){
                                var data = link.dataset.parent.split("--")
                                link.dataset.parent = data[0];
                                link.dataset.child = data[1];
                                
                                link.querySelector('.footer-nav-link .footer-text').innerHTML = link.dataset.child;                             
                                navArray.push({parent: data[0], child: link});
                            }
                            else{
                                if(!this.isSecondLevel){
                                    link.querySelector('.footer-nav-link').innerHTML = link.dataset.parent;
                                            
                                    const anchor = link.querySelector('a');
                                    const div = document.createElement('div');                               

                                    div.innerHTML = anchor.innerHTML;
                                    div.classList.add('subtitle', 'light');
                                    div.dataset.label = link.dataset.parent;
                                    this.querySelector('.footer-links-column.right-aligned').insertBefore(div, this.querySelector('.footer-links-column.right-aligned').firstChild)
                                
                                    this.isSecondLevel = true;
                                }else {
                                    link.remove();
                                }
                            }    
                        }else {
                            document.querySelector('.footer-normal-links').appendChild(link)
                        }
                    })

                    //move links
                    navArray.forEach(item => {
                        this.querySelector('.footer-secondary-links').appendChild(item.child);
                    })

                    footerNav.remove();
                    
                    if(document.querySelector('.footer-secondary-links').children.length === 0){
                        document.querySelector('.footer-links-column.right-aligned').remove();
                    }

                    this.querySelector('.footer-top').style.display = 'flex';
                }
            }

            secondLevelFooterNormal(){
                let navArray = [];
                const footerNav = document.querySelector('.footer-nav');
                if(footerNav){
                    footerNav.querySelectorAll('li').forEach(link => {         
                        if (link.dataset.label.charAt(0) === "-") {
                
                            link.dataset.parent = link.dataset.label.substring(1);
                            if(link.dataset.label.includes("--")){
                                var data = link.dataset.parent.split("--")
                                link.dataset.parent = data[0];
                                link.dataset.child = data[1];
                                
                                link.querySelector('.footer-nav-link').innerHTML = link.dataset.child;
                                navArray.push({parent: data[0], child: link});
                                }
                                else{
                                link.querySelector('.footer-nav-link').innerHTML = link.dataset.parent;  
                
                                const anchor = link.querySelector('a');
                                const div = document.createElement('div');
                                const ul = document.createElement('ul');
                                const groupUl = document.createElement('ul')
                
                
                                div.innerHTML = anchor.innerHTML;
                                div.classList.add('subtitle', 'light')
                                groupUl.classList.add('footer-links-group')
                                div.dataset.label = link.dataset.parent;
                                anchor.parentNode.replaceChild(div, anchor);
                
                                link.appendChild(ul);
                                ul.classList.add('footer-secondary-links');
                
                                
                                document.querySelector('.footer-navigation').appendChild(groupUl)
                                groupUl.appendChild(link)
                            }    
                        }else {
                            document.querySelector('.footer-normal-links').appendChild(link)
                        }
                    })

                    //move links
                    navArray.forEach(item => {
                        var secondaryList = this.querySelector(`div.subtitle[data-label="${item.parent}"]`).parentNode.querySelector('ul');
                        secondaryList.appendChild(item.child)
                    })

                    if(footerNav.children.length === 0){
                        footerNav.remove();
                    }
                    
                    if(document.querySelector('.footer-normal-links').children.length === 0){
                        document.querySelector('.footer-normal-links-group').remove();
                    }

                    this.querySelector('.footer-navigation').style.display = 'grid';
                }
            }
        })
    }
})