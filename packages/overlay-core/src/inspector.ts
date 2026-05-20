import type { ElementInspectionData } from './types'

/**
 * Element Inspector - Standalone utility for inspecting and analyzing DOM elements
 * Useful for debugging, development, and creating custom editing tools
 */

export class ElementInspector {
  /**
   * Get computed styles for an element (normalized property names)
   */
  static getComputedStyles(element: HTMLElement): Record<string, string> {
    const styles = getComputedStyle(element)
    
    // Common properties developers interact with
    return {
      display: styles.display,
      position: styles.position,
      visibility: styles.visibility,
      overflow: styles.overflow,
      width: styles.width,
      height: styles.height,
      minWidth: styles.minWidth,
      minHeight: styles.minHeight,
      maxWidth: styles.maxWidth,
      maxHeight: styles.maxHeight,
      margin: styles.margin,
      marginTop: styles.marginTop,
      marginRight: styles.marginRight,
      marginBottom: styles.marginBottom,
      marginLeft: styles.marginLeft,
      padding: styles.padding,
      paddingTop: styles.paddingTop,
      paddingRight: styles.paddingRight,
      paddingBottom: styles.paddingBottom,
      paddingLeft: styles.paddingLeft,
      border: styles.border,
      borderTop: styles.borderTop,
      borderRight: styles.borderRight,
      borderBottom: styles.borderBottom,
      borderLeft: styles.borderLeft,
      borderRadius: styles.borderRadius,
      borderWidth: styles.borderWidth,
      borderColor: styles.borderColor,
      backgroundColor: styles.backgroundColor,
      background: styles.background,
      color: styles.color,
      fontSize: styles.fontSize,
      fontWeight: styles.fontWeight,
      fontFamily: styles.fontFamily,
      lineHeight: styles.lineHeight,
      textAlign: styles.textAlign,
      textDecoration: styles.textDecoration,
      boxShadow: styles.boxShadow,
      zIndex: styles.zIndex,
      opacity: styles.opacity,
      cursor: styles.cursor,
    }
  }

  /**
   * Get element attributes as a plain object
   */
  static getAttributes(element: Element): Record<string, string> {
    return Array.from(element.attributes).reduce((acc, attr) => {
      acc[attr.name] = attr.value
      return acc
    }, {} as Record<string, string>)
  }

  /**
   * Get human-readable element description
   */
  static describeElement(element: HTMLElement): ElementInspectionData {
    const computedStyle = ElementInspector.getComputedStyles(element)
    const attributes = ElementInspector.getAttributes(element)

    return {
      tagName: element.tagName.toLowerCase(),
      className: element.className?.split(' ').filter(Boolean),
      id: element.id || undefined,
      computedStyle,
      attributes,
      isEditable: element.isContentEditable || ['INPUT', 'TEXTAREA'].includes(element.tagName),
    }
  }

  /**
   * Get element DOM hierarchy (parent chain)
   */
  static getHierarchy(element: HTMLElement, depth = 3): HTMLElement[] {
    const hierarchy: HTMLElement[] = [element]
    
    for (let i = 0; i < depth && element.parentElement; i++) {
      element = element.parentElement as HTMLElement
      if (element) hierarchy.push(element)
    }
    
    return hierarchy
  }

  /**
   * Get full computed style object with normalized property names
   */
  static getFullStyles(element: HTMLElement): Record<string, string> {
    const styles = getComputedStyle(element)
    const result: Record<string, string> = {}
    
    // Add common properties
    const commonProps = [
      'display', 'position', 'visibility', 'overflow', 'width', 'height', 'margin', 'padding', 'border',
      'borderRadius', 'borderWidth', 'borderColor', 'backgroundColor', 'background', 'color',
      'fontSize', 'fontWeight', 'fontFamily', 'lineHeight', 'textAlign', 'textDecoration',
      'boxShadow', 'zIndex', 'opacity', 'cursor'
    ]
    commonProps.forEach((prop) => {
      const val = styles.getPropertyValue(prop)
      if (val !== '') {
        result[prop] = val
      }
    })
    
    // Add all computed properties
    for (let i = 0; i < styles.length; i++) {
      const prop = styles[i]
      const val = styles.getPropertyValue(prop)
      if (val && !result[prop]) {
        result[prop] = val
      }
    }
    
    return result
  }

  /**
   * Check if element is in a specific selector group
   */
  static matchesSelector(element: Element, selectors: string[]): boolean {
    return selectors.some(selector => 
      element.matches(selector) || element.closest(selector) !== null
    )
  }

  /**
   * Get all ancestor elements up to document
   */
  static getAncestors(element: Element): HTMLElement[] {
    const ancestors: HTMLElement[] = []
    let current = element.parentElement
    
    while (current && current.tagName.toLowerCase() !== 'html') {
      ancestors.push(current as HTMLElement)
      current = (current as HTMLElement).parentElement
    }
    
    return ancestors
  }

  /**
   * Create an inspector instance for a specific root context
   */
  static create(_root: Document | HTMLElement = document): typeof ElementInspector {
    return new Proxy(ElementInspector, {
      get(_, prop) {
        return Reflect.get(this, prop)
      },
    })
  }

  /**
   * Inspect and suggest common edits for the element
   */
  static analyze(element: HTMLElement): {
    data: ElementInspectionData
    suggestions: Array<{
      type: string
      selector: string
      explanation: string
      currentValue?: string
      proposedValue?: string
    }>
  } {
    const data = ElementInspector.describeElement(element)
    const suggestions: Array<{
      type: string
      selector: string
      explanation: string
      currentValue?: string
      proposedValue?: string
    }> = []

    // Suggest editing if element is display:block but has no width/height explicitly set
    if (data.computedStyle && data.computedStyle.display === 'block' && !data.computedStyle.width) {
      suggestions.push({
        type: 'style',
        selector: `${element.tagName.toLowerCase()}${element.id ? '#' + element.id : ''}`,
        explanation: 'Element has implicit width from content. Consider adding explicit width for precise layout control.',
      })
    }

    // Suggest color adjustments
    if (data.computedStyle && data.computedStyle.color !== '#000000') {
      suggestions.push({
        type: 'style',
        selector: `${element.tagName.toLowerCase()}${element.id ? '#' + element.id : ''}`,
        explanation: `Current color is ${data.computedStyle.color}. This can be adjusted for accessibility or theming.`,
      })
    }

    // Check for hover states
    if (data.attributes && !data.attributes.onmouseover && !data.attributes.onmouseenter) {
      suggestions.push({
        type: 'attribute',
        selector: `${element.tagName.toLowerCase()}${element.id ? '#' + element.id : ''}`,
        proposedValue: 'onmouseover',
        currentValue: undefined,
        explanation: 'No hover handler detected. Consider adding for interactive states.',
      })
    }

    return { data, suggestions }
  }
}
