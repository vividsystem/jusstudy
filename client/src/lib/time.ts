export function secondsToFormatTime(s: number) {
	if (s < 3600) { // less than an hour
		return `${Math.floor(s / 60)}min`
	} else {
		const secondsTillFullHour = s % 3600
		const hours = (s - secondsTillFullHour) / 3600
		const minutes = Math.floor(secondsTillFullHour / 60)
		return minutes != 0 ? `${hours}h ${Math.floor(secondsTillFullHour / 60)}min` : `${hours}h`
	}

}

export function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString("en-US", {
		month: "short", day: "numeric", year: "numeric",
		hour: "2-digit", minute: "2-digit",
	});
}
