import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getCurrentUser, getUserDisplayName, getUserInitial, getUserRole, isMongoObjectIdString } from '../utils/user'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function resolveImageUrl(url) {
	if (!url) return ''
	return /^https?:\/\//i.test(url) ? url : `${API_BASE}${url}`
}

function NavBar({ transparent = false }) {
	const navigate = useNavigate();
	const user = getCurrentUser();
	const displayName = getUserDisplayName(user);
	const avatarSrc = resolveImageUrl(user?.profilePicture || user?.profile || user?.logo)
	const [unreadCount, setUnreadCount] = useState(0);

	useEffect(() => {
		if (getUserRole(user) !== 'employer' || !isMongoObjectIdString(user?.id)) {
			return;
		}
		fetch(`${API_BASE}/jobs/employer/${user.id}`)
			.then(res => res.json())
			.then(jobs => {
				const total = jobs.reduce((sum, job) => sum + (Number(job?.unreadApplications || 0)), 0);
				setUnreadCount(total);
			})
			.catch(err => console.error('Failed to fetch unread applications count', err));
	}, [user?.id]);

	const role = getUserRole(user);
	const navItems = role === 'admin'
		? [
			{ page: 'Home', link: '/' },
			{ page: 'Admin', link: '/admin' },
			{ page: 'Explore Jobs', link: '/jobs' },
			{ page: 'Manage Jobs', link: '/jobs/employers' },
			{ page: 'My Applications', link: '/my-applications' },
			{ page: 'Profile', link: '/profile' },
		]
		: [
			{ page: 'Home', link: '/' },
			{
				page: `${role === 'employer' ? 'Manage' : 'Explore'} Jobs`,
				link: role === 'employer' ? '/jobs/employers' : '/jobs',
				badge: unreadCount > 0 ? unreadCount : null
			},
			...(role === 'applicant' ? [{ page: 'My Applications', link: '/my-applications' }] : []),
			{ page: 'Profile', link: '/profile' }
		];

	const navClassName = `ml-auto w-full rounded-2xl border px-5 py-4 ${transparent ? 'border-transparent bg-transparent shadow-none' : 'border-slate-200 bg-white shadow-sm'}`;
	const navItemClassName = (isActive) =>
		transparent
			? `rounded-lg border px-3 py-2 text-sm font-medium text-white transition ${isActive ? 'border-white/40 bg-white/20' : 'border-white/25 bg-white/10 hover:bg-white/20'}`
			: `rounded-lg border px-3 py-2 text-sm font-medium transition ${isActive ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'}`;

	const authButtonClassName = `rounded-lg border px-3 py-2 text-sm font-medium transition ${transparent ? 'border-white/25 bg-white/10 text-white hover:bg-white/20' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'}`;

	const handleSignOut = () => {
		localStorage.removeItem('user');
		navigate('/signout', { replace: true });
	};

	return (
		<nav className={navClassName}>
			<div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4">
				<div className="min-w-0 justify-self-start">
					<p className={`font-semibold text-2xl ${transparent ? 'text-white' : 'text-black'}`}>
						Get that Job<span className="text-xs">.com</span>
					</p>
				</div>

				<div className="flex items-center gap-2 justify-self-center">
					{navItems.map((item) => (
						<div key={item.page} className="relative">
							<NavLink
								key={item.page}
								to={item.link}
								end
								className={({ isActive }) => navItemClassName(isActive)}
							>
								{item.page}
							</NavLink>
							{item.badge && (
								<span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 border border-violet-200">
									{item.badge}
								</span>
							)}
						</div>
					))}
				</div>

				<div className="flex min-w-0 items-center justify-end gap-3">
					{user ? (
						<>
							<div className="min-w-0">
								<p className={`text-xs uppercase tracking-wide ${transparent ? 'text-white/70' : 'text-slate-500'}`}>Signed in as</p>
								<p className={`truncate text-sm font-semibold ${transparent ? 'text-white' : 'text-slate-900'}`}>{displayName}</p>
							</div>
							<div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border text-lg font-semibold ${transparent ? 'border-white/40 bg-white/15 text-white' : 'border-violet-200 bg-violet-50 text-violet-300'}`}>
								{avatarSrc ? (
									<img src={avatarSrc} alt={displayName || 'Signed in user'} className="h-full w-full object-cover" />
								) : (
									<span>{getUserInitial(user)}</span>
								)}
							</div>
							<button
								type="button"
								onClick={handleSignOut}
								className={authButtonClassName}
							>
								Sign Out
							</button>
						</>
					) : (
						<NavLink
							to="/login"
							className={({ isActive }) => navItemClassName(isActive)}
						>
							Login
						</NavLink>
					)}
				</div>
			</div>
		</nav>
	)
}

export default NavBar
