import Image from "next/image";

export default function Team() {
  const teamMembers = [
    {
      name: "Philip T. Agbesi",
      role: "General Manager",
      img: "/images/team/philip.jpg",
    },
    {
      name: "Lydia Korley",
      role: "Admin/HR",
      img: "https://picsum.photos/id/1027/300/400",
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4 font-serif">
            Meet our dedicated EaseVote team
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed max-w-2xl mx-auto">
            Meet our dedicated EaseVote team, a group of passionate innovators
            and strategists committed to delivering exceptional solutions.
            Together, we collaborate, innovate, and drive growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto md:gap-6">
          {teamMembers.map((member, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-xl h-64 md:h-80 cursor-pointer"
            >
              <Image
                src={member.img}
                alt={member.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <span className="text-white font-bold text-lg">
                  {member.name}
                </span>
                <span className="text-white/80 text-sm">{member.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
