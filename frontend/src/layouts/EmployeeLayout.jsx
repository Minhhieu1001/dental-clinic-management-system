import RoleShell from '../components/common/RoleShell.jsx'
import { roleRoutes } from '../constants/roleRoutes.js'
import EmployeeHeader from './ReceptionistLayout/EmployeeHeader.jsx'

export default function EmployeeLayout() {
	return <RoleShell config={roleRoutes.employee} CustomHeader={EmployeeHeader} />
}
