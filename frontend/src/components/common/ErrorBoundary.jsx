import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="h-16 w-16 rounded-2xl bg-rose-50 border border-rose-200/70 text-rose-600 flex items-center justify-center mb-4 shadow-sm">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Đã xảy ra lỗi khi tải giao diện</h2>
          <p className="mt-1 text-xs text-slate-500 max-w-md font-medium">
            {this.state.error?.message || 'Có lỗi không xác định xảy ra. Vui lòng thử tải lại trang.'}
          </p>
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
            >
              <RefreshCw size={14} />
              <span>Tải lại trang</span>
            </button>
            <a
              href="/"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
            >
              <Home size={14} />
              <span>Về trang chủ</span>
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

