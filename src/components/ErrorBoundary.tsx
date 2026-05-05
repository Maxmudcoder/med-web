import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  children: ReactNode
}

type State = { hasError: boolean; message: string | null }

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, message: null }

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message || 'Nomaʼlum xato' }
  }

  override componentDidCatch(err: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', err, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center px-6 py-12">
          <h1 className="font-display text-xl font-bold text-[var(--color-text)]">
            Biror joyda nosozlik yuz berdi
          </h1>
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">
            Sahifa yuklashda xato chiqdi. Sahifani yangilab koʻring yoki birozdan keyin qayta urinib koʻring.
          </p>
          {this.state.message ? (
            <pre className="mt-6 max-h-40 overflow-auto rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-[var(--color-text)]">
              {this.state.message}
            </pre>
          ) : null}
          <button
            type="button"
            className="mt-8 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow"
            onClick={() => window.location.reload()}
          >
            Sahifani yangilash
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
