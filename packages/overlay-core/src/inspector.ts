import type { ElementInspectionData } from './types'


export class ElementInspector {
  static getComputedStyles(element: HTMLElement): Record<string, string> {
    const styles = getComputedStyle(element)
    
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

  static getAttributes(element: Element): Record<string, string> {
    return Array.from(element.attributes).reduce((acc, attr) => {
      acc[attr.name] = attr.value
      return acc
    }, {} as Record<string, string>)
  }

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

  static getHierarchy(element: HTMLElement, depth = 3): HTMLElement[] {
    const hierarchy: HTMLElement[] = [element]
    
    for (let i = 0; i < depth && element.parentElement; i++) {
      element = element.parentElement as HTMLElement
      if (element) hierarchy.push(element)
    }
    
    return hierarchy
  }

  static getFullStyles(element: HTMLElement): Record<string, string> {
    const styles = getComputedStyle(element)
    const result: Record<string, string> = {}
    
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
    
    for (let i = 0; i < styles.length; i++) {
      const prop = styles[i]
      const val = styles.getPropertyValue(prop)
      if (val && !result[prop]) {
        result[prop] = val
      }
    }
    
    return result
  }

  static matchesSelector(element: Element, selectors: string[]): boolean {
    return selectors.some(selector => 
      element.matches(selector) || element.closest(selector) !== null
    )
  }

  static getAncestors(element: Element): HTMLElement[] {
    const ancestors: HTMLElement[] = []
    let current = element.parentElement
    
    while (current && current.tagName.toLowerCase() !== 'html') {
      ancestors.push(current as HTMLElement)
      current = (current as HTMLElement).parentElement
    }
    
    return ancestors
  }

  static create(_root: Document | HTMLElement = document): typeof ElementInspector {
    return new Proxy(ElementInspector, {
      get(_, prop) {
        return Reflect.get(this, prop)
      },
    })
  }

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

    if (data.computedStyle && data.computedStyle.display === 'block' && !data.computedStyle.width) {
      suggestions.push({
        type: 'style',
        selector: `${element.tagName.toLowerCase()}${element.id ? '#' + element.id : ''}`,
        explanation: 'Element has implicit width from content. Consider adding explicit width for precise layout control.',
      })
    }

    if (data.computedStyle && data.computedStyle.color !== '#000000') {
      suggestions.push({
        type: 'style',
        selector: `${element.tagName.toLowerCase()}${element.id ? '#' + element.id : ''}`,
        explanation: `Current color is ${data.computedStyle.color}. This can be adjusted for accessibility or theming.`,
      })
    }

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
