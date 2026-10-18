
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const services = [
    { icon: "▣", title: "Display / Screen Replacement", description: "Repair cracked screens and replace damaged displays." },
    { icon: "▰", title: "Battery Replacement", description: "Resolve battery draining and charging-life issues." },
    { icon: "ϟ", title: "Charging Port Repair", description: "Fix charging problems and faulty charging ports." },
    { icon: "♫", title: "Speaker / Microphone Repair", description: "Resolve sound, speaker and microphone problems." },
    { icon: "◎", title: "Camera Repair", description: "Fix front camera, rear camera and camera issues." },
    { icon: "⌘", title: "Motherboard Repair", description: "Diagnose hardware and circuit-related problems." },
    { icon: "⚙", title: "Software Troubleshooting", description: "Resolve software errors, hanging and update issues." },
    { icon: "◉", title: "Water Damage Inspection", description: "Inspect water-damaged devices and assess repairs." },
    { icon: "⊞", title: "Button Repair", description: "Fix faulty power, volume and other physical buttons." },
  ];

  const workflow = [
    { number: "01", title: "Receive Device", description: "Register customer and device details." },
    { number: "02", title: "Diagnosis", description: "Identify the problem and prepare an estimate." },
    { number: "03", title: "Repair", description: "Complete the approved repair and quality check." },
    { number: "04", title: "Complete", description: "Complete the repair and hand over the device." },
  ];

  const navLinks = [
    ["Home", "#home"],
    ["Services", "#services"],
    ["How It Works", "#workflow"],
    ["About", "#about"],
    ["Contact", "#contact"],
  ];

  const closeMenu = () => setMenuOpen(false);

  const goTo = (path) => {
    closeMenu();
    navigate(path);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-['Inter',sans-serif] text-slate-800">
      {/* FONT */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        html { scroll-behavior: smooth; }
        section[id] { scroll-margin-top: 84px; }
      `}</style>

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => goTo("/")}
            className="flex items-center gap-3 text-left"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-sm font-extrabold tracking-wide text-white shadow-md shadow-blue-900/20">
              MR
            </span>
            <span>
              <span className="block text-sm font-extrabold tracking-tight text-slate-950 sm:text-base">
                Mobile Repair Centre
              </span>
              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500">
                Repair Management System
              </span>
            </span>
          </button>

          <nav className="hidden items-center gap-6 lg:flex">
            {navLinks.map(([label, href], index) => (
              <a
                key={href}
                href={href}
                className={`text-[13px] font-semibold transition-colors hover:text-blue-700 ${
                  index === 0 ? "text-blue-700" : "text-slate-600"
                }`}
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => goTo("/login")}
              className="hidden rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 sm:inline-flex"
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => goTo("/register")}
              className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 sm:px-5"
            >
              Register <span aria-hidden="true">→</span>
            </button>

            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-xl text-slate-700 transition hover:bg-slate-50 lg:hidden"
            >
              {menuOpen ? "×" : "☰"}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-slate-200 bg-white px-4 py-3 shadow-lg lg:hidden">
            {navLinks.map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={closeMenu}
                className="block rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
              >
                {label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => goTo("/login")}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 text-left text-sm font-semibold text-slate-700 sm:hidden"
            >
              Login
            </button>
          </nav>
        )}
      </header>

      {/* HERO */}
      <section id="home">
        <div className="relative isolate flex min-h-[560px] items-center overflow-hidden bg-slate-950 sm:min-h-[620px] lg:min-h-[660px]">
          <img
            src="/images/mobile-repair-hero.jpg"
            alt="Technician working on a mobile phone repair"
            fetchPriority="high"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
          />

          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/30" />
          <div className="absolute inset-0 -z-10 bg-blue-950/15" />

          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-blue-100 backdrop-blur-sm sm:text-sm">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                Your Trusted Mobile Repair Partner
              </div>

              <h1 className="mt-7 text-4xl font-extrabold leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Fast. Reliable.
                <span className="block text-blue-300">Professional.</span>
                <span className="mt-3 block text-xl font-semibold leading-snug tracking-normal text-white sm:text-2xl lg:text-3xl">
                  Mobile Repair Services.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-sm leading-7 text-slate-200 sm:text-base sm:leading-8">
                We help keep your devices working with care and expertise.
                From screen replacement to software issues, manage your repair
                centre operations through one organized platform.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => goTo("/register")}
                  className="inline-flex items-center justify-center gap-3 rounded-lg bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500"
                >
                  Get Started <span aria-hidden="true">→</span>
                </button>
                <a
                  href="#services"
                  className="inline-flex items-center justify-center rounded-lg border border-white/35 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Explore Services
                </a>
              </div>

              <div className="mt-10 grid max-w-2xl grid-cols-1 gap-4 border-t border-white/20 pt-6 text-sm font-medium text-white sm:grid-cols-3">
                {["Trusted Service", "Clear Repair Tracking", "Organized Billing"].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-sm font-bold text-blue-300">
                      ✓
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-blue-700 via-blue-400 to-transparent" />
        </div>
      </section>

      {/* SERVICES */}
      <section id="services">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 sm:text-sm">
              Our Services
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Complete Mobile Repair Solutions
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              Explore common mobile repair services, from screen and battery
              replacement to hardware and software troubleshooting.
            </p>
            <div className="mx-auto mt-5 h-1 w-14 rounded-full bg-blue-600" />
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <article
                key={service.title}
                className="group rounded-xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-950/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl font-bold text-blue-700 transition group-hover:bg-blue-700 group-hover:text-white">
                  <span aria-hidden="true">{service.icon}</span>
                </div>
                <h3 className="mt-5 text-base font-bold leading-6 text-slate-900">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {service.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow" className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 sm:text-sm">
              How It Works
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              A Clear, Simple Repair Workflow
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              Follow a structured process from receiving a device to completing
              the repair.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {workflow.map((step) => (
              <article
                key={step.number}
                className="rounded-xl border border-slate-200 bg-white p-6 transition duration-300 hover:border-blue-300 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                  {step.number}
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 sm:text-sm">
              About The System
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl">
              Designed to simplify everyday repair operations.
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
              Mobile Repair Centre Management System helps organize customer
              registration, device details, job cards, estimates, repairs,
              payments and warranty information in one place.
            </p>
            <button
              type="button"
              onClick={() => goTo("/register")}
              className="mt-7 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Get Started <span aria-hidden="true">→</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { number: "01", title: "Centralized Data", description: "Keep customer and repair information organized." },
              { number: "02", title: "Better Control", description: "Manage daily repair activities efficiently." },
              { number: "03", title: "Easy Tracking", description: "Follow repair progress through job card status." },
              { number: "04", title: "Secure Access", description: "Access is managed according to user roles." },
            ].map((item) => (
              <article
                key={item.number}
                className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-md sm:p-6"
              >
                <p className="text-xs font-bold tracking-widest text-blue-700">
                  {item.number}
                </p>
                <h3 className="mt-3 font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 sm:text-sm">
              Contact Us
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              We’re Here to Help
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              Get in touch with our team for support or general enquiries.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:border-blue-300 hover:shadow-md">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl font-bold text-blue-700">
                @
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-500">
                Email Address
              </h3>
              <a
                href="mailto:mobilerepair@gmail.com"
                className="mt-2 block break-words text-sm font-bold text-slate-900 transition hover:text-blue-700"
              >
                mobilerepair@gmail.com
              </a>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                For enquiries and support
              </p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:border-blue-300 hover:shadow-md">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl font-bold text-blue-700">
                ☎
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-500">
                Phone Number
              </h3>
              <a
                href="tel:+919876543210"
                className="mt-2 block text-sm font-bold text-slate-900 transition hover:text-blue-700"
              >
                +91 98765 43210
              </a>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Contact us for assistance
              </p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:border-blue-300 hover:shadow-md">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl font-bold text-blue-700">
                ◷
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-500">
                Support Hours
              </h3>
              <p className="mt-2 text-sm font-bold text-slate-900">
                Monday – Saturday
              </p>
              <p className="mt-1 text-sm font-semibold text-blue-700">
                9:00 AM – 6:00 PM
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* COMPACT FOOTER */}
      <footer className="bg-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-4 text-center">
          <div>
            <p className="text-sm font-semibold text-white">
              Mobile Repair Centre
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Repair Management System
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
