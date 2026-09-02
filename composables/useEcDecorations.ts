import type { ComputedRef, Ref } from 'vue'
import type { ParsedEcInfo } from './useEcParser'
import { computed, h, nextTick, ref, render } from 'vue'
import ProsePreCollapseWidget from '~/components/content/ProsePreCollapseWidget.vue'
import { highlightPalette } from '~/configs/ecHighlight'

export function useEcDecorations(
  preEl: Ref<HTMLElement | undefined>,
  parsedEc: ComputedRef<ParsedEcInfo>,
) {
  const appConfig = useAppConfig()
  const expandedCollapseRanges = ref(new Set<string>())

  const annotationPosition = computed(() => appConfig.codeSnippets?.annotation?.position === 'inline' ? 'inline' : 'row')
  const annotationPlacement = computed(() => {
    const v = appConfig.codeSnippets?.annotation?.rowPlacement
    return (v === 'before' || v === 'after' || v === 'top' || v === 'bottom') ? v : 'after'
  })

  let hoverAttached = false

  function setActiveAnnotation(code: HTMLElement, annKey: string | null) {
    code.querySelectorAll('[data-ec-ann]').forEach((el) => {
      if (annKey == null) {
        el.classList.remove('is-ec-active')
      }
      else {
        el.classList.toggle('is-ec-active', el.getAttribute('data-ec-ann') === annKey)
      }
    })
  }

  function setActiveHighlight(code: HTMLElement, hlGroup: string | null) {
    code.querySelectorAll('.ec-highlight').forEach((el) => {
      if (hlGroup == null) {
        el.classList.remove('is-hl-active')
      }
      else {
        el.classList.toggle('is-hl-active', el.getAttribute('data-ec-hl-group') === hlGroup)
      }
    })
  }

  function handleHover(event: MouseEvent) {
    const pre = preEl.value
    if (!pre)
      return
    const code = pre.querySelector('code')
    if (!code)
      return
    const target = event.target as Element
    const annGroup = target?.closest?.('[data-ec-ann]')
    setActiveAnnotation(code as HTMLElement, annGroup ? annGroup.getAttribute('data-ec-ann') : null)
    const hlMark = target?.closest?.('.ec-highlight')
    setActiveHighlight(code as HTMLElement, hlMark ? hlMark.getAttribute('data-ec-hl-group') : null)
  }

  function cleanupDecorations(codeEl: HTMLElement) {
    setActiveAnnotation(codeEl, null)
    setActiveHighlight(codeEl, null)

    codeEl.querySelectorAll('.ec-collapse-range').forEach((el) => {
      while (el.firstChild) el.parentNode?.insertBefore(el.firstChild, el)
      el.remove()
    })

    codeEl.querySelectorAll('.ec-collapse-widget, .ec-annotation-row').forEach((n) => {
      render(null, n as HTMLElement)
      n.remove()
    })

    codeEl.querySelectorAll<HTMLElement>('.line').forEach((line) => {
      line.classList.remove('ec-collapsed', 'ec-annotated', 'ec-annotation-inline')
      line.removeAttribute('data-ec-note')
      line.removeAttribute('data-ec-ann')
      line.removeAttribute('title')

      // Remove existing marks and restore text
      line.querySelectorAll('mark.ec-highlight').forEach((mark) => {
        const textNode = document.createTextNode(mark.textContent || '')
        mark.parentNode?.replaceChild(textNode, mark)
      })

      const content = line.querySelector('.ec-annotated-content')
      if (content) {
        while (content.firstChild) line.insertBefore(content.firstChild, content)
        content.remove()
      }
    })
  }

  function ensureAnnotatedContent(line: HTMLElement) {
    let content = line.querySelector<HTMLElement>(':scope > .ec-annotated-content')
    if (!content) {
      content = document.createElement('span')
      content.className = 'ec-annotated-content'

      const twoslashNodes: ChildNode[] = []
      while (line.firstChild) {
        const child = line.firstChild
        if (
          child instanceof Element
          && child.classList.contains('twoslash-hover')
        ) {
          twoslashNodes.push(child)
        }
        else {
          content.appendChild(child)
        }
      }

      if (twoslashNodes.length > 0) {
        line.append(...twoslashNodes)
        line.insertBefore(content, line.firstChild)
      }
      else {
        line.appendChild(content)
      }
    }
    return content
  }

  function assignHighlightGroups(codeEl: HTMLElement) {
    const highlights = parsedEc.value.highlights
    const paletteCount = highlightPalette.length

    // Dedupe identical patterns: every occurrence of the same /pattern/ should
    // share one hover group and one color, and shouldn't consume extra palette
    // slots. Preserve first-seen order.
    const uniquePatterns: string[] = []
    for (const hl of highlights) {
      if (hl && !uniquePatterns.includes(hl.pattern))
        uniquePatterns.push(hl.pattern)
    }

    const marks = codeEl.querySelectorAll<HTMLElement>('.ec-highlight')
    marks.forEach((mark) => {
      const text = mark.textContent || ''
      if (!text)
        return
      for (let i = 0; i < uniquePatterns.length; i++) {
        const pattern = uniquePatterns[i]
        try {
          const regex = new RegExp(`^(?:${pattern})$`)
          if (regex.test(text)) {
            mark.setAttribute('data-ec-hl-group', String(i))
            mark.setAttribute('data-ec-hl-color', String(i % paletteCount))
            return
          }
        }
        catch {
          continue
        }
      }
    })
  }

  function applyEcDecorations() {
    const pre = preEl.value
    if (!pre || typeof window === 'undefined')
      return
    const code = pre.querySelector('code')
    if (!code)
      return
    const codeEl = code as HTMLElement

    if (!hoverAttached && typeof window !== 'undefined') {
      pre.addEventListener('mouseover', handleHover)
      pre.addEventListener('mouseout', handleHover)
      hoverAttached = true
    }

    cleanupDecorations(codeEl)

    const lines = code.querySelectorAll<HTMLElement>('.line')
    const lineMap = new Map<number, HTMLElement>()
    lines.forEach((line) => {
      const lineNo = Number(line.getAttribute('line'))
      if (Number.isFinite(lineNo))
        lineMap.set(lineNo, line)
    })

    const placeholders: HTMLElement[] = []

    // 1. Collapse logic
    parsedEc.value.collapseRanges.forEach((range) => {
      const key = `${range.start}-${range.end}`
      const isExpanded = expandedCollapseRanges.value.has(key)
      const firstLine = lineMap.get(range.start)
      if (!firstLine)
        return

      const rangeContainer = document.createElement('div')
      rangeContainer.className = `ec-collapse-range ${isExpanded ? 'is-expanded' : 'is-collapsed'}`

      const widget = document.createElement('span')
      widget.className = 'line ec-collapse-widget'
      widget.setAttribute('line', '…')
      widget.setAttribute('data-start-line', String(range.start))
      widget.setAttribute('data-end-line', String(range.end))

      render(h(ProsePreCollapseWidget, {
        expanded: isExpanded,
        lineCount: range.end - range.start + 1,
        toggleable: appConfig.codeSnippets?.collapse?.toggleable !== false,
        onToggle: () => {
          if (expandedCollapseRanges.value.has(key))
            expandedCollapseRanges.value.delete(key)
          else expandedCollapseRanges.value.add(key)
          applyEcDecorations()
        },
      }), widget)

      codeEl.insertBefore(rangeContainer, firstLine)
      rangeContainer.appendChild(widget)
      placeholders.push(widget)

      for (let i = range.start; i <= range.end; i++) {
        const l = lineMap.get(i)
        if (l) {
          rangeContainer.appendChild(l)
          if (!isExpanded)
            l.classList.add('ec-collapsed')
        }
      }
    })

    // 2. Annotation logic
    parsedEc.value.annotations.forEach((anno, annIndex) => {
      const annKey = String(annIndex)
      const start = Math.min(...anno.lines); const end = Math.max(...anno.lines)
      let firstLineEl: HTMLElement | undefined

      for (let i = start; i <= end; i++) {
        const l = lineMap.get(i)
        if (l) {
          l.classList.add('ec-annotated')
          l.setAttribute('data-ec-ann', annKey)
          ensureAnnotatedContent(l)
          if (!firstLineEl && i === start)
            firstLineEl = l
        }
      }

      const isCollapsed = firstLineEl?.classList.contains('ec-collapsed')
      const anchor = (firstLineEl && !isCollapsed)
        ? firstLineEl
        : placeholders.find((p) => {
            const s = Number(p.getAttribute('data-start-line')); const e = Number(p.getAttribute('data-end-line'))
            return start >= s && start <= e
          })

      if (anchor) {
        if (annotationPosition.value === 'inline') {
          anchor.classList.add('ec-annotation-inline'); anchor.setAttribute('data-ec-note', anno.text)
        }
        else {
          const row = document.createElement('div'); row.className = 'ec-annotation-row'; row.textContent = anno.text
          row.setAttribute('data-ec-ann', annKey)
          anchor.insertAdjacentElement(annotationPlacement.value === 'before' ? 'beforebegin' : 'afterend', row)
        }
      }
    })

    // 3. Assign per-pattern highlight groups
    assignHighlightGroups(codeEl)
  }

  return {
    applyEcDecorations,
    collapseRanges: computed(() => parsedEc.value.collapseRanges),
    expandedCollapseRanges,
    resetDecorations: () => { expandedCollapseRanges.value.clear(); nextTick(applyEcDecorations) },
    expandAll: () => {
      parsedEc.value.collapseRanges.forEach(r => expandedCollapseRanges.value.add(`${r.start}-${r.end}`))
      applyEcDecorations()
    },
    collapseAll: () => { expandedCollapseRanges.value.clear(); applyEcDecorations() },
  }
}
