import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

class AppErrorBoundary extends React.Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Vantoris</p>
          <h1 className="text-2xl font-semibold">This page didn’t load</h1>
          <p className="mt-3 text-sm text-muted-foreground">Reload to try again. If the problem continues, try again later.</p>
          <button
            type="button"
            className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      </main>
    )
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
)
