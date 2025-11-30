// ====== NAVIGATION BAR FUNCTIONALITY ======

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      
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
      
      if (href && href.startsWith("#")) {
        document.querySelectorAll(".nav-link").forEach(l => {
          if (l.getAttribute("href") && l.getAttribute("href").startsWith("#")) {
            l.classList.remove("active");
          }
        });
        link.classList.add("active");
      }
    });
    
    const currentPath = window.location.pathname;
    const linkPath = link.getAttribute("href");
    
    if (linkPath && !linkPath.startsWith("#")) {
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
        
        sectionLinks.forEach(l => l.classList.remove("active"));
        
        sections.forEach(({ link, element }) => {
          if (element) {
            const offsetTop = element.offsetTop;
            const offsetBottom = offsetTop + element.offsetHeight;
            
            if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
              link.classList.add("active");
              activeSectionFound = true;
            }
          }
        });
      };
      
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
      
      handleScroll();
    }
  }
});

