import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorBoundaryProps {
	children: React.ReactNode;
	fallback?: (error: Error, errorInfo: React.ErrorInfo, reset: () => void) => React.ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
	errorInfo: React.ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null, errorInfo: null };
	}

	static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
		this.setState({
			error,
			errorInfo
		});
		console.error('Error caught by boundary:', error, errorInfo);
	}

	handleDismiss = (): void => {
		this.setState({ hasError: false, error: null, errorInfo: null });
	};

	render(): React.ReactNode {
		const { hasError, error, errorInfo } = this.state;
		const { children, fallback } = this.props;

		if (hasError && error && errorInfo) {
			if (fallback) {
				return (
					<>
						{children}
						<div className="fixed inset-0 pointer-events-none z-50">
							<div className="pointer-events-auto">
								{fallback(error, errorInfo, this.handleDismiss)}
							</div>
						</div>
					</>
				);
			}

			return (
				<>
					{children}
					<div className="fixed inset-4 flex items-start justify-end p-4 z-50 overflow-y-auto">
						<div className="bg-dark-red border-4 border-egg-yellow rounded-4xl shadow-xl p-6 max-w-xl w-full relative text-egg-yellow">
							<button
								onClick={this.handleDismiss}
								className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
								aria-label="Dismiss error"
							>
								<X className="w-5 h-5" />
							</button>

							<div className="flex items-start">
								<AlertCircle className="w-6 h-6 text-egg-yellow mr-3 shrink-0 mt-0.5" />
								<div className="flex-1 pr-8">
									<h3 className="text-lg font-semibold text-egg-yellow mb-2 whitespace-pre-wrap">
										Something went wrong
									</h3>
									<p className="text-beige mb-4">
										{error.toString()}
									</p>
									<details className="mb-4">
										<summary className="cursor-pointer text-sm font-medium text-light-brown hover:text-dark-brown">
											View error details
										</summary>
										<pre className="mt-2 text-xs bg-dark-brown p-3 rounded overflow-auto max-h-64">
											{errorInfo.componentStack}
										</pre>
									</details>
								</div>
							</div>
						</div>
					</div>
				</>
			);
		}

		return children;
	}
}
