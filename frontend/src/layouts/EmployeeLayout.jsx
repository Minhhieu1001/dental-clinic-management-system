import RoleShell from '../components/common/RoleShell.jsx'
import { roleRoutes } from '../constants/roleRoutes.js'

export default function EmployeeLayout() {
	return <RoleShell config={roleRoutes.employee} />
}
