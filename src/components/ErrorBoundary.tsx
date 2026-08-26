import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px', backgroundColor: '#f9fafb', color: '#111827', fontFamily: 'monospace', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ maxWidth: '600px', width: '100%', backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
            <h1 style={{ color: '#dc2626', fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Application Error</h1>
            <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '16px' }}>The application encountered an uncaught runtime error. Please reload the app or clear the cache.</p>
            
            <div style={{ backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '8px', overflowX: 'auto', marginBottom: '16px', border: '1px solid #e5e7eb' }}>
              <p style={{ fontWeight: 'bold', color: '#1f2937', margin: '0 0 8px 0', fontSize: '13px' }}>{this.state.error?.toString()}</p>
              <pre style={{ margin: 0, fontSize: '11px', color: '#4b5563', whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto' }}>
                {this.state.error?.stack}
              </pre>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => window.location.reload()}
                style={{ flex: 1, padding: '10px 16px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
              >
                Reload Page
              </button>
              <button 
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                style={{ flex: 1, padding: '10px 16px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
              >
                Clear Cache &amp; Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
