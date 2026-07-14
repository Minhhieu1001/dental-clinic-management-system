import RoleShell from '../components/common/RoleShell.jsx'
import { roleRoutes } from '../constants/roleRoutes.js'
import PatientHeader from '../components/common/headers/PatientHeader.jsx'

export default function PatientLayout() {
	return <RoleShell config={roleRoutes.patient} CustomHeader={PatientHeader} />
}
