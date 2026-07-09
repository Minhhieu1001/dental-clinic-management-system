import RoleShell from '../components/common/RoleShell.jsx'
import { roleRoutes } from '../constants/roleRoutes.js'

export default function AdminLayout() {
	return <RoleShell config={roleRoutes.admin} />
}
