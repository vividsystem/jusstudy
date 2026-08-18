export function secondsToFormatTime(s: number) {
	if (s < 3600) { // less than an hour
		return `${Math.floor(s / 60)}min`
	} else {
		const secondsTillFullHour = s % 3600
		const hours = (s - secondsTillFullHour) / 3600
		const minutes = Math.floor(secondsTillFullHour / 60)
		return minutes != 0 ? `${hours}h${Math.floor(secondsTillFullHour / 60)}min` : `${hours}h`
	}

}

export function timeAgo(dateStr: string): string {
	const diff = Date.now() - new Date(dateStr).getTime();
	const days = Math.floor(diff / 86_400_000);
	if (days === 0) return "Today";
	if (days === 1) return "Yesterday";
	if (days < 30) return `${days}d ago`;
	return `${Math.floor(days / 30)}mo ago`;
}

export function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString("en-US", {
		month: "short", day: "numeric", year: "numeric",
		hour: "2-digit", minute: "2-digit",
	});
}
