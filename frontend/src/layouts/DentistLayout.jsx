import RoleShell from '../components/common/RoleShell.jsx'
import { roleRoutes } from '../constants/roleRoutes.js'

export default function DentistLayout() {
	return <RoleShell config={roleRoutes.dentist} />
}
