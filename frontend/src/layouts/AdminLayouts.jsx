import RoleShell from '../components/common/RoleShell.jsx'
import { roleRoutes } from '../constants/roleRoutes.js'
import AdminHeader from './AdminLayout/AdminHeader.jsx'

export default function AdminLayout() {
	return <RoleShell config={roleRoutes.admin} CustomHeader={AdminHeader} />
}
