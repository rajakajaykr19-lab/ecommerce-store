import Link from 'next/link';
import { Award, Leaf, Heart, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about our story, values, and commitment to crafting premium garments with quality, sustainability, and care.',
};

const values = [
  {
    icon: Award,
    title: 'Quality',
    description: 'Every garment undergoes rigorous quality checks. We use only premium fabrics sourced from trusted mills to ensure lasting comfort and durability.',
  },
  {
    icon: Heart,
    title: 'Craftsmanship',
    description: 'Our designs blend contemporary trends with timeless elegance. Each piece is thoughtfully crafted by skilled artisans who take pride in their work.',
  },
  {
    icon: Leaf,
    title: 'Sustainability',
    description: 'We are committed to responsible fashion. From eco-friendly packaging to ethical sourcing, sustainability is at the heart of everything we do.',
  },
];

const team = [
  { name: 'Rajesh Kumar', role: 'Founder & CEO', description: 'With over 15 years in the fashion industry, Rajesh founded the brand with a vision to make premium fashion accessible to everyone.' },
  { name: 'Priya Sharma', role: 'Head of Design', description: 'A NIFT graduate with a passion for blending Indian heritage with global trends, Priya leads our design team with creativity and precision.' },
  { name: 'Amit Patel', role: 'Head of Operations', description: 'Amit ensures every order reaches you perfectly and on time. His logistics expertise keeps our supply chain running smoothly.' },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-black text-white">
        <div className="container-custom py-16 md:py-24">
          <div className="max-w-3xl">
            <span className="text-[#d4a853] text-sm font-medium tracking-wider uppercase">Our Story</span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mt-4 mb-6 leading-tight">
              Fashion That Tells <span className="text-[#d4a853]">Your Story</span>
            </h1>
            <p className="text-gray-300 text-lg leading-relaxed mb-4">
              Born from a passion for premium quality and timeless design, we set out to create a brand that celebrates the modern Indian lifestyle. Our journey began with a simple belief: everyone deserves access to well-crafted, stylish clothing.
            </p>
            <p className="text-gray-400 leading-relaxed">
              Today, we serve thousands of customers across India, offering curated collections that blend comfort, style, and affordability. Every piece in our catalog is a testament to our unwavering commitment to quality.
            </p>
          </div>
        </div>
      </section>

      {/* Lifestyle Image Placeholder */}
      <section className="bg-gray-100 h-64 md:h-96 flex items-center justify-center">
        <p className="text-gray-400 text-sm tracking-wider uppercase">Lifestyle Imagery</p>
      </section>

      {/* Values Section */}
      <section className="container-custom py-16 md:py-24">
        <div className="text-center mb-16">
          <span className="text-[#d4a853] text-sm font-medium tracking-wider uppercase">What We Stand For</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3">Our Values</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {values.map((value) => (
            <div key={value.title} className="border border-gray-200 p-8 text-center hover:border-[#d4a853] transition-colors group">
              <div className="w-16 h-16 mx-auto mb-6 bg-[#d4a853]/10 flex items-center justify-center group-hover:bg-[#d4a853]/20 transition-colors">
                <value.icon size={28} className="text-[#d4a853]" />
              </div>
              <h3 className="text-xl font-bold mb-3">{value.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Brand Story */}
      <section className="bg-gray-50 py-16 md:py-24">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-gray-200 h-80 md:h-96 flex items-center justify-center">
              <p className="text-gray-400 text-sm tracking-wider uppercase">Brand Imagery</p>
            </div>
            <div>
              <span className="text-[#d4a853] text-sm font-medium tracking-wider uppercase">The Journey</span>
              <h2 className="text-3xl font-bold mt-3 mb-6">From Vision to Wardrobe</h2>
              <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                <p>
                  What started as a small workshop in Mumbai has grown into one of India&apos;s most loved premium fashion brands. Our founders saw a gap in the market for high-quality garments that didn&apos;t compromise on style or affordability.
                </p>
                <p>
                  We partnered with local artisans and global fabric mills to create collections that resonate with the modern Indian consumer. From handpicked cotton to precision stitching, every detail matters.
                </p>
                <p>
                  Today, with over 50,000 happy customers and counting, we continue to push boundaries in design, quality, and customer experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container-custom py-16 md:py-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { number: '50,000+', label: 'Happy Customers' },
            { number: '500+', label: 'Products' },
            { number: '28', label: 'States Covered' },
            { number: '4.8', label: 'Average Rating' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl md:text-4xl font-bold text-[#d4a853]">{stat.number}</p>
              <p className="text-sm text-gray-500 mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-gray-50 py-16 md:py-24">
        <div className="container-custom">
          <div className="text-center mb-16">
            <span className="text-[#d4a853] text-sm font-medium tracking-wider uppercase">The People Behind the Brand</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3">Meet Our Team</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member) => (
              <div key={member.name} className="bg-white border border-gray-200 overflow-hidden group">
                <div className="bg-gray-200 h-64 flex items-center justify-center">
                  <p className="text-gray-400 text-sm">Photo</p>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg">{member.name}</h3>
                  <p className="text-[#d4a853] text-sm font-medium mt-1 mb-3">{member.role}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{member.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black text-white py-16 md:py-24">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Elevate Your Style?</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Explore our curated collections and discover premium garments crafted for the modern Indian lifestyle.
          </p>
          <Link href="/shop">
            <button className="bg-[#d4a853] text-black px-10 py-4 font-semibold text-sm hover:bg-[#c49a3f] transition-colors inline-flex items-center gap-2">
              Shop Now <ArrowRight size={16} />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
