import { useNavigate } from "react-router"
import { authClient } from "../lib/auth-client"

function Home() {
	const navigate = useNavigate()
	return (
		<div className="max-w-xl mx-auto flex flex-col gap-6 items-center justify-center min-h-screen">
			<button onClick={async (ev) => {
				ev.preventDefault()
				await authClient.signOut()
				navigate("/")
			}}>
				signout
			</button >
			hi!
		</div>
	)
}


export default Home
