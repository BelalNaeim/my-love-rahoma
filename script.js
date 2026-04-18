let slideIndex = 1;
let slideInterval;
let isTransitioning = false;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadDynamicContent();
});

async function loadDynamicContent() {
    try {
        const response = await fetch('/api/content');
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        
        // Update texts
        const heroSubtitle = document.getElementById('heroSubtitle');
        const loveText = document.getElementById('loveText');
        
        if (heroSubtitle && data.heroSubtitle) heroSubtitle.textContent = data.heroSubtitle;
        if (loveText && data.loveText) loveText.textContent = data.loveText;
        
        // Populate slides
        const sliderWrapper = document.getElementById('sliderWrapper');
        if (sliderWrapper && data.slides && data.slides.length > 0) {
            sliderWrapper.innerHTML = ''; // Clear loading state
            data.slides.forEach((slide, index) => {
                const isActive = index === 0 ? 'active' : '';
                sliderWrapper.innerHTML += `
                    <div class="slide ${isActive}">
                        <img src="${slide.src}" alt="Memory ${index + 1}" loading="lazy" />
                        ${slide.caption ? `<div class="caption">${slide.caption}</div>` : ''}
                    </div>
                `;
            });
        }
        
        // Re-attach image error handlers for newly injected images
        document.querySelectorAll('.slide img').forEach(img => {
            img.addEventListener('load', function() {
                this.style.opacity = '0';
                this.style.transition = 'opacity 0.5s ease-in';
                setTimeout(() => {
                    this.style.opacity = '1';
                }, 100);
            });
            img.addEventListener('error', function() {
                this.style.opacity = '0.5';
                console.warn('Image failed to load:', this.src);
            });
        });
        
        // Initialize existing functions now that DOM is populated
        initializeSlider();
        createDots();
        showSlides(slideIndex);
        startAutoSlide();
        addScrollAnimations();
        addParallaxEffect();
    } catch (e) {
        console.error("Error loading dynamic content:", e);
        // Fallback or error message
        const st = document.getElementById('heroSubtitle');
        if (st) st.textContent = "حدث خطأ في تحميل البيانات.";
    }
}

// Initialize slider
function initializeSlider() {
    const slides = document.getElementsByClassName("slide");
    if (slides.length > 0) {
        slides[0].classList.add('active');
    }
}

// Create dots dynamically
function createDots() {
    const slides = document.getElementsByClassName("slide");
    const dotsContainer = document.getElementById("dotsContainer");
    
    if (!dotsContainer) return;
    
    dotsContainer.innerHTML = '';
    
    for (let i = 0; i < slides.length; i++) {
        const dot = document.createElement("span");
        dot.className = "dot";
        if (i === 0) dot.classList.add("active");
        dot.setAttribute("onclick", `currentSlide(${i + 1})`);
        dot.addEventListener('mouseenter', function() {
            if (!this.classList.contains('active')) {
                this.style.transform = 'scale(1.1)';
            }
        });
        dot.addEventListener('mouseleave', function() {
            if (!this.classList.contains('active')) {
                this.style.transform = 'scale(1)';
            }
        });
        dotsContainer.appendChild(dot);
    }
}

// Next/previous controls with smooth animation
function changeSlide(n) {
    if (isTransitioning) return;
    
    clearInterval(slideInterval);
    const currentSlide = document.querySelector('.slide.active');
    
    if (currentSlide) {
        currentSlide.classList.add('fade-out');
        setTimeout(() => {
            showSlides(slideIndex += n);
            startAutoSlide();
        }, 300);
    } else {
        showSlides(slideIndex += n);
        startAutoSlide();
    }
}

// Thumbnail image controls
function currentSlide(n) {
    if (isTransitioning) return;
    
    clearInterval(slideInterval);
    const currentSlide = document.querySelector('.slide.active');
    
    if (currentSlide && slideIndex !== n) {
        currentSlide.classList.add('fade-out');
        setTimeout(() => {
            showSlides(slideIndex = n);
            startAutoSlide();
        }, 300);
    } else {
        showSlides(slideIndex = n);
        startAutoSlide();
    }
}

function showSlides(n) {
    isTransitioning = true;
    let i;
    let slides = document.getElementsByClassName("slide");
    let dots = document.getElementsByClassName("dot");
    
    if (n > slides.length) {slideIndex = 1}    
    if (n < 1) {slideIndex = slides.length}
    
    // Remove active class from all slides
    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";  
        slides[i].className = slides[i].className.replace(" active", "");
        slides[i].className = slides[i].className.replace(" fade-out", "");
    }
    
    // Remove active class from all dots
    for (i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" active", "");
    }
    
    // Show current slide with animation
    const currentSlide = slides[slideIndex - 1];
    currentSlide.style.display = "block";
    currentSlide.classList.add("active");
    
    // Add entrance animation
    setTimeout(() => {
        currentSlide.style.opacity = '0';
        currentSlide.style.transform = 'translateX(30px) scale(0.95)';
        
        requestAnimationFrame(() => {
            currentSlide.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            currentSlide.style.opacity = '1';
            currentSlide.style.transform = 'translateX(0) scale(1)';
        });
    }, 10);
    
    // Update dots
    if (dots[slideIndex - 1]) {
        dots[slideIndex - 1].classList.add("active");
        // Animate dot
        dots[slideIndex - 1].style.transform = 'scale(1.3)';
        setTimeout(() => {
            dots[slideIndex - 1].style.transform = 'scale(1.2)';
        }, 200);
    }
    
    // Animate caption
    const caption = currentSlide.querySelector('.caption');
    if (caption) {
        caption.style.opacity = '0';
        caption.style.transform = 'translateY(20px)';
        setTimeout(() => {
            caption.style.transition = 'all 0.6s ease-out';
            caption.style.opacity = '1';
            caption.style.transform = 'translateY(0)';
        }, 300);
    }
    
    setTimeout(() => {
        isTransitioning = false;
    }, 600);
}

function startAutoSlide() {
    slideInterval = setInterval(() => {
        if (!isTransitioning) {
            const currentSlide = document.querySelector('.slide.active');
            if (currentSlide) {
                currentSlide.classList.add('fade-out');
                setTimeout(() => {
                    showSlides(slideIndex += 1);
                }, 300);
            } else {
                showSlides(slideIndex += 1);
            }
        }
    }, 5000); // Change image every 5 seconds
}

// Add scroll animations
function addScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 1s ease-out forwards';
                entry.target.style.opacity = '1';
            }
        });
    }, observerOptions);

    // Observe sections
    const sections = document.querySelectorAll('.message-section, .gallery-section');
    sections.forEach(section => {
        section.style.opacity = '0';
        observer.observe(section);
    });
}

// Audio Control
function toggleMusic() {
    const music = document.getElementById("bgMusic");
    const playIcon = document.getElementById("mainPlayIcon");
    const equalizer = document.getElementById("equalizer");

    if (music.paused) {
        music.play();
        playIcon.classList.remove("fa-play");
        playIcon.classList.add("fa-pause");
        equalizer.classList.add("playing");
    } else {
        music.pause();
        playIcon.classList.remove("fa-pause");
        playIcon.classList.add("fa-play");
        equalizer.classList.remove("playing");
    }
}

// Timer Logic
const startDate = new Date("2025-11-21T00:00:00").getTime(); // Set this to the anniversary date

function updateTimer() {
    const now = new Date().getTime();
    const distance = now - Math.min(now, startDate); // Ensure distance is positive

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const elDays = document.getElementById("days");
    if (elDays) {
        elDays.innerText = days < 10 ? "0" + days : days;
        document.getElementById("hours").innerText = hours < 10 ? "0" + hours : hours;
        document.getElementById("minutes").innerText = minutes < 10 ? "0" + minutes : minutes;
        document.getElementById("seconds").innerText = seconds < 10 ? "0" + seconds : seconds;
    }
}
setInterval(updateTimer, 1000);

// Scroll Reveal Animation
window.addEventListener("scroll", reveal);

function reveal() {
  const reveals = document.querySelectorAll(".reveal");
  for (let i = 0; i < reveals.length; i++) {
    const windowHeight = window.innerHeight;
    const elementTop = reveals[i].getBoundingClientRect().top;
    const elementVisible = 100;
    if (elementTop < windowHeight - elementVisible) {
      reveals[i].classList.add("active");
    }
  }
}


// Add parallax effect to hero section
function addParallaxEffect() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroContent = document.querySelector('.hero-content');
        
        if (heroContent && scrolled < hero.offsetHeight) {
            heroContent.style.transform = `translateY(${scrolled * 0.5}px)`;
            heroContent.style.opacity = 1 - (scrolled / hero.offsetHeight);
        }
    });
}

// Add keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        changeSlide(-1);
    } else if (e.key === 'ArrowRight') {
        changeSlide(1);
    }
});

// Add touch/swipe support for mobile
let touchStartX = 0;
let touchEndX = 0;

document.querySelector('.slider-container')?.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

document.querySelector('.slider-container')?.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, { passive: true });

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            changeSlide(1); // Swipe left - next
        } else {
            changeSlide(-1); // Swipe right - previous
        }
    }
}

// Image loading handlers are now attached dynamically in loadDynamicContent()

