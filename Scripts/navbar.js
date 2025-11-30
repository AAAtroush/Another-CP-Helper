// ====== NAVIGATION BAR FUNCTIONALITY ======

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Navigation bar smooth scrolling and active state
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      
      // If it's an internal link (starts with #), handle smooth scroll
      if (href && href.startsWith("#")) {
        e.preventDefault();
        const targetElement = document.querySelector(href);
        if (targetElement) {
          const offsetTop = targetElement.offsetTop - 80;
          window.scrollTo({
            top: offsetTop,
            behavior: "smooth"
          });
        }
      }
      
      // Update active state for section links
      if (href && href.startsWith("#")) {
        document.querySelectorAll(".nav-link").forEach(l => {
          if (l.getAttribute("href") && l.getAttribute("href").startsWith("#")) {
            l.classList.remove("active");
          }
        });
        link.classList.add("active");
      }
    });
    
    // Set active state based on current page
    const currentPath = window.location.pathname;
    const linkPath = link.getAttribute("href");
    
    if (linkPath && !linkPath.startsWith("#")) {
      // Handle different path formats
      const normalizedCurrentPath = currentPath.replace(/\/$/, '') || '/';
      const normalizedLinkPath = linkPath.replace(/^\.\//, '');
      
      if (normalizedLinkPath === normalizedCurrentPath || 
          normalizedCurrentPath.endsWith(normalizedLinkPath) ||
          (normalizedCurrentPath.endsWith("index.html") && normalizedLinkPath === "index.html") ||
          (normalizedCurrentPath.endsWith("grid-visualizer.html") && normalizedLinkPath === "grid-visualizer.html") ||
          (normalizedCurrentPath === "/" && normalizedLinkPath === "index.html")) {
        link.classList.add("active");
      }
    }
  });
  
  // Update active state on scroll for section links
  const sectionLinks = document.querySelectorAll('.nav-link[href^="#"]');
  if (sectionLinks.length > 0) {
    const sections = Array.from(sectionLinks).map(link => {
      const href = link.getAttribute("href");
      return {
        link: link,
        element: document.querySelector(href)
      };
    }).filter(item => item.element);
    
    if (sections.length > 0) {
      const handleScroll = () => {
        const scrollPosition = window.scrollY + 100;
        let activeSectionFound = false;
        
        // First, remove active from all section links
        sectionLinks.forEach(l => l.classList.remove("active"));
        
        // Check each section to see if it's in view
        sections.forEach(({ link, element }) => {
          if (element) {
            const offsetTop = element.offsetTop;
            const offsetBottom = offsetTop + element.offsetHeight;
            
            // Check if the scroll position is within the section bounds
            if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
              link.classList.add("active");
              activeSectionFound = true;
            }
          }
        });
        
        // If no section is in view, all section links remain inactive
        // (already removed above, so nothing to do)
      };
      
      // Throttle scroll events for better performance
      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            handleScroll();
            ticking = false;
          });
          ticking = true;
        }
      });
      
      // Initial check
      handleScroll();
    }
  }
});

