import RoleShell from '../components/common/RoleShell.jsx'
import { roleRoutes } from '../constants/roleRoutes.js'
import DentistHeader from './DentistLayout/DentistHeader.jsx'

export default function DentistLayout() {
	return <RoleShell config={roleRoutes.dentist} CustomHeader={DentistHeader} />
}
