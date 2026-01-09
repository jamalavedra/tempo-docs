'use client'

import {
  createElement,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import { useRouter } from 'waku'
import {
  renderQueryString,
  unstable_createAdapterProvider as createAdapterProvider,
  type unstable_AdapterInterface as AdapterInterface,
  type unstable_AdapterOptions as AdapterOptions,
} from 'nuqs/adapters/custom'

type Emitter = {
  listeners: Set<(search: URLSearchParams) => void>
  emit: (search: URLSearchParams) => void
  on: (fn: (search: URLSearchParams) => void) => void
  off: (fn: (search: URLSearchParams) => void) => void
}

function createEmitter(): Emitter {
  const listeners = new Set<(search: URLSearchParams) => void>()
  return {
    listeners,
    emit: (search) => listeners.forEach((fn) => fn(search)),
    on: (fn) => listeners.add(fn),
    off: (fn) => listeners.delete(fn),
  }
}

const emitter = createEmitter()

const historyUpdateMarker = '__nuqs_waku__'

function filterSearchParams(
  search: URLSearchParams,
  watchKeys: string[],
  preserveUnknown: boolean,
): URLSearchParams {
  if (watchKeys.length === 0) return search
  const result = new URLSearchParams()
  for (const key of watchKeys) {
    const values = search.getAll(key)
    for (const value of values) {
      result.append(key, value)
    }
  }
  if (preserveUnknown) {
    for (const [key, value] of search.entries()) {
      if (!watchKeys.includes(key)) {
        result.append(key, value)
      }
    }
  }
  return result
}

function applyChange(
  search: URLSearchParams,
  watchKeys: string[],
  preserveExisting: boolean,
): URLSearchParams {
  return filterSearchParams(search, watchKeys, preserveExisting)
}

function useNuqsWakuAdapter(watchKeys: string[]): AdapterInterface {
  const router = useRouter()

  const [searchParams, setSearchParams] = useState(() => {
    if (typeof location === 'undefined') {
      return new URLSearchParams()
    }
    return filterSearchParams(
      new URLSearchParams(location.search),
      watchKeys,
      false,
    )
  })

  const updateUrl = useMemo(() => {
    return function updateUrl(
      search: URLSearchParams,
      options: Required<AdapterOptions>,
    ) {
      const url = new URL(location.href)
      url.search = renderQueryString(search)

      const method =
        options.history === 'push' ? history.pushState : history.replaceState
      method.call(history, history.state, historyUpdateMarker, url)

      emitter.emit(search)

      if (options.scroll === true) {
        window.scrollTo({ top: 0 })
      }
    }
  }, [])

  useEffect(() => {
    const onPopState = () => {
      setSearchParams(
        applyChange(new URLSearchParams(location.search), watchKeys, false),
      )
    }

    const onEmitterUpdate = (search: URLSearchParams) => {
      setSearchParams(applyChange(search, watchKeys, true))
    }

    emitter.on(onEmitterUpdate)
    window.addEventListener('popstate', onPopState)

    return () => {
      emitter.off(onEmitterUpdate)
      window.removeEventListener('popstate', onPopState)
    }
  }, [watchKeys.join('&')])

  useEffect(() => {
    if (typeof router.query === 'string' && router.query) {
      setSearchParams(
        filterSearchParams(
          new URLSearchParams(router.query),
          watchKeys,
          false,
        ),
      )
    }
  }, [router.query, watchKeys.join('&')])

  return {
    searchParams,
    updateUrl,
  }
}

const NuqsWakuAdapter = createAdapterProvider(useNuqsWakuAdapter)

export function NuqsAdapter({
  children,
}: {
  children: ReactNode
}): ReactElement {
  return createElement(NuqsWakuAdapter, { children })
}
