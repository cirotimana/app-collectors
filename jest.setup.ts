import "@testing-library/jest-dom";

class ResizeObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
}

class IntersectionObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
}

// @ts-ignore
global.ResizeObserver = ResizeObserver
// @ts-ignore
global.IntersectionObserver = IntersectionObserver

// cmdk / radix scroll
window.HTMLElement.prototype.scrollIntoView = function () { }

// matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Image mock
// @ts-ignore
global.Image = class {
  onload: () => void = () => { }
  addEventListener = jest.fn()
  removeEventListener = jest.fn()
  constructor() {
    setTimeout(() => {
      this.onload()
    }, 100)
  }
}
