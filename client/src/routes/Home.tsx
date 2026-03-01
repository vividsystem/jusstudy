import { Navigate, useNavigate } from "react-router"
import { authClient } from "../lib/auth-client"
import Button from "@client/components/Button"

function Home() {
	const navigate = useNavigate()
	const { data } = authClient.useSession()
	if (data == null) {
		return <Navigate to={"/"} />
	}
	return (
		<div className="max-w-xl mx-auto flex flex-col gap-6 items-center justify-center min-h-screen">
			{data.user.banned && (<>
				<h1 className="text-5xl">You are banned</h1>
			</>)}

			{!data.user.yswsEligible && !data.user.banned && (<>
				<h1>You are not YSWS eligible right now!</h1>
				<p>This means that you are either 1. too old, 2. haven't finished your identity check or 3. have been banned</p>
			</>)}
			<Button onClick={async (ev) => {
				ev.preventDefault()
				await authClient.signOut()
				navigate("/")
			}}>
				signout
			</Button >
		</div>
	)
}


export default Home
