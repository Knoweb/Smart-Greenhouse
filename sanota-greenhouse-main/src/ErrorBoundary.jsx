import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App render crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="auth-shell" style={{ '--auth-bg-image': 'none' }}>
          <div className="auth-panel">
            <div className="auth-form-card" style={{ textAlign: 'left' }}>
              <div className="auth-eyebrow">Runtime error</div>
              <h1 style={{ marginTop: 12, fontSize: 28 }}>The app crashed while loading.</h1>
              <p style={{ marginTop: 12, color: 'rgba(226,232,240,0.82)', lineHeight: 1.6 }}>
                {this.state.error?.message || 'Something in the React tree failed before the page could render.'}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
