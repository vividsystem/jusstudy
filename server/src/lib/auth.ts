import { auth } from "@server/auth"

export async function getHackatimeAccessToken(headers: Headers) {
	const accounts = await auth.api.listUserAccounts({ headers })
	const htAccount = accounts.find((a) => a.providerId === "hackatime")
	if (!htAccount) {
		return null
	}

	const token = await auth.api.getAccessToken({
		headers: headers,
		body: {
			accountId: htAccount.id
		}
	})

	return token
}
