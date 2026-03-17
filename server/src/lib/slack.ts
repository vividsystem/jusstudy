// this uses cachet.dunkirk.sh

const CACHET_URL = "https://cachet.dunkirk.sh"
interface UserInformationResponse {
	displayName: string
	id: string
	imageUrl: string
	pronouns: string
	userId: string
}
export async function getSlackUserInformation(slackId: string) {
	const res = await fetch(`${CACHET_URL}/users/${slackId}`)
	if (!res.ok) {
		if (res.status == 404) {
			return null
		} else {
			throw new Error(await res.text())
		}
	}
	const data = await res.json()

	return data as UserInformationResponse

}
