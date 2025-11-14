export default function TeamMember({ name, role }) {
  const initials = name.split(' ').map(n => n[0]).join('')

  return (
    <div className="text-center">
      <div className="w-32 h-32 bg-gradient-to-br from-primary-400 to-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
        <span className="text-4xl font-bold text-white font-poppins">
          {initials}
        </span>
      </div>
      <h4 className="text-lg font-semibold text-neutral-900 font-poppins">
        {name}
      </h4>
      <p className="text-gray-600 font-inter">
        {role}
      </p>
    </div>
  )
}