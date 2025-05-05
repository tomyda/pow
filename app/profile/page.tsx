import ProfilePictureUpload from '../components/profile-picture-upload'
import { getCurrentUser } from '@/lib/auth-utils'

export default async function ProfilePage() {
  // Get user data on the server
  const user = await getCurrentUser()
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
      
      <div className="mb-8">
        <ProfilePictureUpload />
      </div>
      
      {/* Display current profile picture */}
      {user?.profilePicture && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Current Picture</h2>
          <img 
            src={user.profilePicture} 
            alt={`${user.name}'s profile`} 
            className="w-32 h-32 object-cover rounded-full"
          />
        </div>
      )}
      
      {/* Basic Information */}
      <section className="mb-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Full Name</p>
            <p className="font-medium">{user.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Role</p>
            <p className="font-medium">{user.is_admin ? 'Admin' : 'Member'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Joined</p>
            <p className="font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </section>

      {/* Account Stats */}
      <section className="mb-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Activity Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded">
            <p className="text-2xl font-bold text-blue-600">{user.votes_count || 0}</p>
            <p className="text-sm text-gray-600">Votes Cast</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded">
            <p className="text-2xl font-bold text-green-600">{user.win_count || 0}</p>
            <p className="text-sm text-gray-600">Times Won</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded">
            <p className="text-2xl font-bold text-purple-600">{user.sessions_participated || 0}</p>
            <p className="text-sm text-gray-600">Sessions Joined</p>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded">
            <p className="text-2xl font-bold text-amber-600">{user.honorable_mentions || 0}</p>
            <p className="text-sm text-gray-600">Honorable Mentions</p>
          </div>
        </div>
      </section>

      {/* User Preferences */}
      <section className="mb-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive emails for voting results</p>
            </div>
            <div>
              {/* This would be a client component */}
              <span className={`px-2 py-1 rounded text-xs font-medium ${user.email_notifications ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {user.email_notifications ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Theme Preference</p>
              <p className="text-sm text-gray-500">Choose your preferred theme</p>
            </div>
            <div>
              <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {user.theme || 'System Default'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="mb-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        {user.recent_activity && user.recent_activity.length > 0 ? (
          <ul className="space-y-3">
            {user.recent_activity.map((activity: { id: string; description: string; created_at: string }) => (
              <li key={activity.id} className="border-b pb-3">
                <div className="flex justify-between">
                  <p>{activity.description}</p>
                  <p className="text-sm text-gray-500">{new Date(activity.created_at).toLocaleDateString()}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No recent activity</p>
        )}
      </section>
    </div>
  )
}