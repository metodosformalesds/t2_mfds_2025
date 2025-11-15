export default function StatItem({ number, label }) {
  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-bold text-white mb-2 font-poppins">
        {number}
      </div>
      <div className="text-white/80 font-inter">
        {label}
      </div>
    </div>
  )
}