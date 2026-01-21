export function secondsToFormatTime(s: number) {
	if (s < 3600) { // less than an hour
		return `${Math.floor(s / 60)}min`
	} else {
		const secondsTillFullHour = s % 3600
		const hours = (s - secondsTillFullHour) / 3600
		return `${hours}h ${Math.floor(secondsTillFullHour / 60)}min`
	}

}
