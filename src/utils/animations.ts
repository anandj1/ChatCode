
import { useEffect, useRef } from 'react';

export function useIntersectionObserver(options = {}) {
  const elementRef = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-slide-up');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      ...options
    });
    
    const currentElement = elementRef.current;
    
    if (currentElement) {
      observer.observe(currentElement);
    }
    
    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [options]);
  
  return elementRef;
}

export function useStaggeredAnimation(selector: string, delay = 100) {
  useEffect(() => {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('animate-slide-up');
      }, index * delay);
    });
  }, [selector, delay]);
}

export function applyEntryAnimation(element: HTMLElement, animation = 'animate-fade-in') {
  requestAnimationFrame(() => {
    element.classList.add(animation);
  });
}
