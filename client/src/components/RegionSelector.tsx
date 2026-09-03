import type { ShopRegion } from "@shared/validation"

interface RegionSelectorProps {
	regions: ShopRegion[]
	region: string
	setRegion: (id: string) => void
	onChange?: React.ChangeEventHandler<HTMLSelectElement, HTMLSelectElement>
}
export default function RegionSelector({ regions, region, setRegion, onChange }: RegionSelectorProps) {
	return <select
		onChange={(ev) => {
			setRegion(ev.currentTarget.value)
			return onChange ? onChange(ev) : null
		}}
		value={region}
		className="border-2 h-fit p-2 rounded-md text-lg bg-egg-yellow text-dark-red"
	>
		{regions.map(r => (
			<option key={r.id} value={r.id}>{r.name}</option>
		))}
	</select>
}
