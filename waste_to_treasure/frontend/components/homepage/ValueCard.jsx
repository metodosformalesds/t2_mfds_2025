export default function ValueCard({ icon: Icon, title, description }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-primary-600" />
      </div>
      <h3 className="text-xl font-bold text-neutral-900 mb-3 font-poppins">
        {title}
      </h3>
      <p className="text-gray-600 font-inter leading-relaxed">
        {description}
      </p>
    </div>
  )
}