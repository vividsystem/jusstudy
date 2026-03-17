import './HackclubLogo.css';

export default function HackclubLogo() {
	return (
		<a className="hackclub-anchor" href="https://hackclub.com" tabIndex={-1}>
			<picture>
				<source media="(max-width: 1023px)" srcSet="/hackclub-flag-left.png" />
				<img src="/hackclub-flag-top.png" alt="Hackclub Logo" className="hackclub-logo" />
			</picture>
		</a>
	)
}
