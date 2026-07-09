import RoleShell from '../components/common/RoleShell.jsx'
import { roleRoutes } from '../constants/roleRoutes.js'

export default function PatientLayout() {
	return <RoleShell config={roleRoutes.patient} />
}
